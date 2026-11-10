import hashlib
import hmac
import logging
import uuid
from calendar import monthrange
from collections.abc import Awaitable, Callable, Sequence
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Optional
from urllib.parse import parse_qsl, quote, quote_plus

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from api.schemas.payfast import SubscriptionCheckoutRequest

logger = logging.getLogger(__name__)

PAYFAST_SANDBOX_PROCESS_URL = "https://sandbox.payfast.co.za/eng/process"
PAYFAST_SANDBOX_VALIDATE_URL = "https://sandbox.payfast.co.za/eng/query/validate"
PAYFAST_API_URL = "https://api.payfast.co.za"
MAX_ITN_BODY_BYTES = 16_384
MAX_CANCELLATIONS_PER_RUN = 50
MAX_CANCELLATION_RETRY_INTERVAL = timedelta(minutes=30)
PAYFAST_CHECKOUT_SIGNATURE_FIELDS = (
    "merchant_id",
    "merchant_key",
    "return_url",
    "cancel_url",
    "notify_url",
    "notify_method",
    "name_first",
    "name_last",
    "email_address",
    "cell_number",
    "m_payment_id",
    "amount",
    "item_name",
    "item_description",
    "custom_int1",
    "custom_int2",
    "custom_int3",
    "custom_int4",
    "custom_int5",
    "custom_str1",
    "custom_str2",
    "custom_str3",
    "custom_str4",
    "custom_str5",
    "email_confirmation",
    "confirmation_address",
    "currency",
    "payment_method",
    "subscription_type",
    "billing_date",
    "recurring_amount",
    "frequency",
    "cycles",
    "subscription_notify_email",
    "subscription_notify_webhook",
    "subscription_notify_buyer",
)


@dataclass(frozen=True)
class PayFastSettings:
    mode: Optional[str]
    merchant_id: Optional[str]
    merchant_key: Optional[str]
    passphrase: Optional[str]
    return_url: Optional[str]
    cancel_url: Optional[str]
    notify_url: Optional[str]
    cancellation_cron_secret: Optional[str] = None

    @property
    def checkout_enabled(self) -> bool:
        return (
            self.mode == "sandbox"
            and all(
                value and value.strip()
                for value in (
                    self.merchant_id,
                    self.merchant_key,
                    self.passphrase,
                    self.return_url,
                    self.cancel_url,
                    self.notify_url,
                )
            )
            and all(
                value.startswith("https://")
                for value in (self.return_url or "", self.cancel_url or "", self.notify_url or "")
            )
        )

    @property
    def cancellation_enabled(self) -> bool:
        return (
            self.mode == "sandbox"
            and all(
                value and value.strip()
                for value in (self.merchant_id, self.passphrase)
            )
            and bool(self.cancellation_cron_secret and self.cancellation_cron_secret.strip())
        )


def _signature(fields: Sequence[tuple[str, str]], passphrase: str) -> str:
    parameters = []
    for key, value in fields:
        normalized_value = value.strip()
        if key != "signature" and normalized_value:
            encoded_value = quote_plus(normalized_value, safe="").replace("~", "%7E")
            parameters.append(f"{key}={encoded_value}")
    normalized_passphrase = passphrase.strip()
    if normalized_passphrase:
        encoded_passphrase = quote_plus(normalized_passphrase, safe="").replace("~", "%7E")
        parameters.append(f"passphrase={encoded_passphrase}")
    return hashlib.md5("&".join(parameters).encode("utf-8")).hexdigest()


def _api_signature(fields: dict[str, str], passphrase: str) -> str:
    normalized_passphrase = passphrase.strip()
    if normalized_passphrase:
        fields = {**fields, "passphrase": normalized_passphrase}
    return _signature(sorted(fields.items()), "")


def _itn_rejection(status_code: int, reason: str, detail: str) -> HTTPException:
    logger.warning("PayFast sandbox ITN rejected: %s", reason)
    return HTTPException(status_code=status_code, detail=detail)


def _checkout_signature(fields: Sequence[tuple[str, str]], passphrase: str) -> str:
    field_values = dict(fields)
    ordered_fields = [
        (key, field_values[key])
        for key in PAYFAST_CHECKOUT_SIGNATURE_FIELDS
        if key in field_values
    ]
    return _signature(ordered_fields, passphrase)


def _next_period(start: datetime, interval: str) -> datetime:
    if interval == "annual":
        try:
            return start.replace(year=start.year + 1)
        except ValueError:
            return start.replace(year=start.year + 1, day=28)

    month_index = start.month
    year = start.year + (month_index // 12)
    month = (month_index % 12) + 1
    return start.replace(year=year, month=month, day=min(start.day, monthrange(year, month)[1]))


def _as_decimal(value: Any) -> Optional[Decimal]:
    try:
        return Decimal(str(value)).quantize(Decimal("0.01"))
    except (InvalidOperation, ValueError, TypeError):
        return None


def create_payfast_router(
    db: Any,
    get_current_user: Callable[..., Awaitable[str]],
    settings: PayFastSettings,
    prices: dict[str, dict[str, Decimal]],
) -> APIRouter:
    router = APIRouter()

    @router.post("/api/v1/billing/checkout")
    async def create_checkout(
        payload: SubscriptionCheckoutRequest,
        user_id: str = Depends(get_current_user),
    ):
        if not settings.checkout_enabled:
            raise HTTPException(
                status_code=503,
                detail="PayFast sandbox checkout is not configured.",
            )

        users = await db.query_raw(
            'SELECT "email" FROM "User" WHERE "id" = $1',
            user_id,
        )
        if not users or not users[0].get("email"):
            raise HTTPException(status_code=404, detail="Account email was not found.")

        plan = payload.plan
        interval = payload.billingInterval
        amount = prices[plan][interval]
        async with db.tx() as transaction:
            await transaction.query_raw(
                'SELECT "id" FROM "User" WHERE "id" = $1 FOR UPDATE',
                user_id,
            )
            existing = await transaction.query_raw(
                'SELECT "provider", "status", "providerSubscriptionId", "currentPeriodEnd" '
                'FROM "UserSubscription" WHERE "userId" = $1 FOR UPDATE',
                user_id,
            )
            if existing and existing[0].get("provider") == "payfast" and existing[0].get(
                "providerSubscriptionId"
            ):
                raise HTTPException(
                    status_code=409,
                    detail="This account already has a PayFast subscription. Contact support to change it.",
                )

            pending = await transaction.query_raw(
                'SELECT "id", "plan", "billingInterval", "amount" FROM "PayfastCheckout" '
                'WHERE "userId" = $1 AND "status" = $2 LIMIT 1 FOR UPDATE',
                user_id,
                "PENDING",
            )
            if pending:
                pending_checkout = pending[0]
                if (
                    pending_checkout["plan"] != plan
                    or pending_checkout["billingInterval"] != interval
                ):
                    raise HTTPException(
                        status_code=409,
                        detail="A checkout for a different plan is already pending. Reopen that checkout or contact support.",
                    )
                checkout_id = str(pending_checkout["id"])
                pending_amount = _as_decimal(pending_checkout["amount"])
                if pending_amount is None:
                    raise HTTPException(status_code=500, detail="Stored PayFast checkout amount is invalid.")
                amount = pending_amount
            else:
                checkout_id = str(uuid.uuid4())
                await transaction.execute_raw(
                    'INSERT INTO "PayfastCheckout" '
                    '("id", "userId", "plan", "billingInterval", "amount", "status", "updatedAt") '
                    'VALUES ($1, $2, $3, $4, $5::numeric, $6, CURRENT_TIMESTAMP)',
                    checkout_id,
                    user_id,
                    payload.plan,
                    payload.billingInterval,
                    amount,
                    "PENDING",
                )

        fields = [
            ("merchant_id", settings.merchant_id or ""),
            ("merchant_key", settings.merchant_key or ""),
            ("return_url", settings.return_url or ""),
            ("cancel_url", settings.cancel_url or ""),
            ("notify_url", settings.notify_url or ""),
            ("email_address", str(users[0]["email"])),
            ("m_payment_id", checkout_id),
            ("amount", f"{amount:.2f}"),
            ("item_name", f"Job Hunter {payload.plan.title()} ({payload.billingInterval})"),
            ("subscription_type", "1"),
            ("recurring_amount", f"{amount:.2f}"),
            ("frequency", "6" if payload.billingInterval == "annual" else "3"),
            ("cycles", "0"),
        ]
        fields.append(("signature", _checkout_signature(fields, settings.passphrase or "")))

        return {
            "action": PAYFAST_SANDBOX_PROCESS_URL,
            "fields": dict(fields),
            "mode": "sandbox",
        }

    @router.post("/api/v1/billing/payfast/cancel")
    async def request_period_end_cancellation(
        user_id: str = Depends(get_current_user),
    ):
        if not settings.cancellation_enabled:
            raise HTTPException(
                status_code=503,
                detail="PayFast sandbox cancellation is not configured.",
            )

        now = datetime.now(timezone.utc)
        async with db.tx() as transaction:
            subscriptions = await transaction.query_raw(
                'SELECT "provider", "providerSubscriptionId", "status", "currentPeriodEnd", '
                '"cancelAtPeriodEnd", "cancellationRequestSentAt" '
                'FROM "UserSubscription" WHERE "userId" = $1 FOR UPDATE',
                user_id,
            )
            if not subscriptions or subscriptions[0].get("provider") != "payfast":
                raise HTTPException(status_code=404, detail="No PayFast subscription was found.")
            subscription = subscriptions[0]
            period_end = subscription.get("currentPeriodEnd")
            if isinstance(period_end, datetime) and period_end.tzinfo is None:
                period_end = period_end.replace(tzinfo=timezone.utc)
            if (
                not subscription.get("providerSubscriptionId")
                or subscription.get("status") not in {"ACTIVE", "PAST_DUE"}
                or not period_end
                or period_end <= now
            ):
                raise HTTPException(
                    status_code=409,
                    detail="This PayFast subscription cannot be scheduled for cancellation.",
                )
            if subscription.get("cancellationRequestSentAt"):
                raise HTTPException(
                    status_code=409,
                    detail="PayFast has already received the cancellation request.",
                )
            if not subscription.get("cancelAtPeriodEnd"):
                await transaction.execute_raw(
                    'UPDATE "UserSubscription" SET "cancelAtPeriodEnd" = TRUE, '
                    '"cancellationRequestedAt" = $1, "updatedAt" = CURRENT_TIMESTAMP '
                    'WHERE "userId" = $2 AND "provider" = $3',
                    now,
                    user_id,
                    "payfast",
                )

        return {
            "cancelAtPeriodEnd": True,
            "currentPeriodEnd": period_end.isoformat(),
        }

    @router.delete("/api/v1/billing/payfast/cancel")
    async def undo_period_end_cancellation(
        user_id: str = Depends(get_current_user),
    ):
        if not settings.cancellation_enabled:
            raise HTTPException(
                status_code=503,
                detail="PayFast sandbox cancellation is not configured.",
            )

        async with db.tx() as transaction:
            subscriptions = await transaction.query_raw(
                'SELECT "provider", "cancelAtPeriodEnd", "cancellationRequestSentAt", '
                '"currentPeriodEnd", "cancellationAttemptCount" '
                'FROM "UserSubscription" WHERE "userId" = $1 FOR UPDATE',
                user_id,
            )
            if not subscriptions or subscriptions[0].get("provider") != "payfast":
                raise HTTPException(status_code=404, detail="No PayFast subscription was found.")
            subscription = subscriptions[0]
            if subscription.get("cancellationRequestSentAt"):
                raise HTTPException(
                    status_code=409,
                    detail="PayFast has already received the cancellation request.",
                )
            period_end = subscription.get("currentPeriodEnd")
            if isinstance(period_end, datetime) and period_end.tzinfo is None:
                period_end = period_end.replace(tzinfo=timezone.utc)
            if (
                subscription.get("cancellationAttemptCount", 0) > 0
                or not period_end
                or period_end <= datetime.now(timezone.utc)
            ):
                raise HTTPException(
                    status_code=409,
                    detail="This cancellation is already being processed and can no longer be undone here.",
                )
            if subscription.get("cancelAtPeriodEnd"):
                await transaction.execute_raw(
                    'UPDATE "UserSubscription" SET "cancelAtPeriodEnd" = FALSE, '
                    '"cancellationRequestedAt" = NULL, "updatedAt" = CURRENT_TIMESTAMP '
                    'WHERE "userId" = $1 AND "provider" = $2',
                    user_id,
                    "payfast",
                )

        return {"cancelAtPeriodEnd": False}

    @router.post("/api/v1/internal/payfast/cancellations/process")
    async def process_due_cancellations(request: Request):
        configured_secret = settings.cancellation_cron_secret
        supplied_secret = request.headers.get("x-payfast-cancellation-cron-secret")
        if not configured_secret:
            raise HTTPException(
                status_code=503,
                detail="PayFast cancellation job authentication is not configured.",
            )
        if not supplied_secret or not hmac.compare_digest(supplied_secret, configured_secret):
            raise HTTPException(status_code=401, detail="Invalid PayFast cancellation job credentials.")
        if not settings.cancellation_enabled:
            raise HTTPException(
                status_code=503,
                detail="PayFast sandbox cancellation is not configured.",
            )

        due_subscriptions = await db.query_raw(
            'SELECT "id" FROM "UserSubscription" WHERE "provider" = $1 '
            'AND "cancelAtPeriodEnd" = TRUE AND "cancellationRequestSentAt" IS NULL '
            'AND ("currentPeriodEnd" <= CURRENT_TIMESTAMP OR '
            '("cancellationRequestedAt" IS NOT NULL AND "currentPeriodStart" > "cancellationRequestedAt")) '
            'AND ("cancellationLastAttemptAt" IS NULL OR "cancellationLastAttemptAt" <= $2) '
            'ORDER BY "currentPeriodEnd" ASC LIMIT $3',
            "payfast",
            datetime.now(timezone.utc) - MAX_CANCELLATION_RETRY_INTERVAL,
            MAX_CANCELLATIONS_PER_RUN,
        )
        sent = 0
        failed = 0
        skipped = 0
        async with httpx.AsyncClient(timeout=15.0, follow_redirects=False) as client:
            for candidate in due_subscriptions:
                subscription = None
                async with db.tx() as transaction:
                    rows = await transaction.query_raw(
                        'SELECT "id", "providerSubscriptionId", "cancellationAttemptCount" '
                        'FROM "UserSubscription" WHERE "id" = $1 AND "provider" = $2 '
                        'AND "cancelAtPeriodEnd" = TRUE AND "cancellationRequestSentAt" IS NULL '
                        'AND ("currentPeriodEnd" <= CURRENT_TIMESTAMP OR '
                        '("cancellationRequestedAt" IS NOT NULL AND "currentPeriodStart" > "cancellationRequestedAt")) '
                        'AND ("cancellationLastAttemptAt" IS NULL OR "cancellationLastAttemptAt" <= $3) '
                        'FOR UPDATE',
                        candidate["id"],
                        "payfast",
                        datetime.now(timezone.utc) - MAX_CANCELLATION_RETRY_INTERVAL,
                    )
                    if rows and rows[0].get("providerSubscriptionId"):
                        subscription = rows[0]
                        await transaction.execute_raw(
                            'UPDATE "UserSubscription" SET "cancellationAttemptCount" = '
                            '"cancellationAttemptCount" + 1, "cancellationLastAttemptAt" = $1, '
                            '"updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2',
                            datetime.now(timezone.utc),
                            subscription["id"],
                        )
                if not subscription:
                    skipped += 1
                    continue

                timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S%z")
                api_fields = {
                    "merchant-id": settings.merchant_id or "",
                    "timestamp": timestamp,
                    "version": "v1",
                }
                headers = {
                    **api_fields,
                    "signature": _api_signature(api_fields, settings.passphrase or ""),
                }
                token = str(subscription["providerSubscriptionId"])
                try:
                    response = await client.put(
                        f"{PAYFAST_API_URL}/subscriptions/{quote(token, safe='')}/cancel",
                        params={"testing": "true"},
                        headers=headers,
                    )
                    response.raise_for_status()
                except httpx.HTTPStatusError as exc:
                    failed += 1
                    logger.error(
                        "PayFast sandbox cancellation request failed with HTTP %s.",
                        exc.response.status_code,
                    )
                    continue
                except httpx.RequestError as exc:
                    failed += 1
                    logger.error(
                        "PayFast sandbox cancellation request failed (%s).",
                        type(exc).__name__,
                    )
                    continue

                await db.execute_raw(
                    'UPDATE "UserSubscription" SET "cancellationRequestSentAt" = $1, '
                    '"updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2 '
                    'AND "cancelAtPeriodEnd" = TRUE AND "cancellationRequestSentAt" IS NULL',
                    datetime.now(timezone.utc),
                    subscription["id"],
                )
                sent += 1

        result = {"sent": sent, "failed": failed, "skipped": skipped}
        if failed:
            raise HTTPException(
                status_code=502,
                detail={
                    **result,
                    "message": "One or more PayFast cancellations failed and will be retried.",
                },
            )
        return result

    @router.post("/api/v1/billing/payfast/itn")
    async def receive_itn(request: Request):
        if not settings.checkout_enabled:
            raise HTTPException(
                status_code=503,
                detail="PayFast sandbox notifications are not configured.",
            )
        if request.headers.get("content-type", "").split(";", 1)[0].strip().lower() != (
            "application/x-www-form-urlencoded"
        ):
            raise HTTPException(status_code=415, detail="Expected a URL-encoded PayFast notification.")

        content_length = request.headers.get("content-length")
        if content_length:
            try:
                declared_length = int(content_length)
            except ValueError as exc:
                raise HTTPException(status_code=400, detail="PayFast notification length is invalid.") from exc
            if declared_length > MAX_ITN_BODY_BYTES:
                raise HTTPException(status_code=413, detail="PayFast notification is too large.")
        body_buffer = bytearray()
        async for chunk in request.stream():
            body_buffer.extend(chunk)
            if len(body_buffer) > MAX_ITN_BODY_BYTES:
                raise HTTPException(status_code=413, detail="PayFast notification is too large.")
        body = bytes(body_buffer)
        if not body:
            raise _itn_rejection(400, "empty body", "PayFast notification body is invalid.")
        try:
            pairs = parse_qsl(body.decode("utf-8"), keep_blank_values=True, strict_parsing=True)
        except (UnicodeDecodeError, ValueError) as exc:
            raise _itn_rejection(400, "malformed body", "PayFast notification is malformed.") from exc

        if not pairs or len({key for key, _ in pairs}) != len(pairs):
            raise _itn_rejection(
                400,
                "empty fields or duplicate field names",
                "PayFast notification contains duplicate fields.",
            )
        fields = dict(pairs)
        supplied_signature = fields.get("signature", "")
        if not supplied_signature or not hmac.compare_digest(
            supplied_signature,
            _signature(pairs, settings.passphrase or ""),
        ):
            raise _itn_rejection(
                400,
                "signature mismatch",
                "PayFast notification signature is invalid.",
            )
        if fields.get("merchant_id") != settings.merchant_id:
            raise _itn_rejection(
                400,
                "merchant ID mismatch",
                "PayFast merchant ID did not match.",
            )

        payment_status = fields.get("payment_status")
        if payment_status not in {"COMPLETE", "FAILED", "CANCELLED", "PENDING"}:
            raise _itn_rejection(
                400,
                "unsupported payment status",
                "PayFast notification status is unsupported.",
            )
        if not fields.get("pf_payment_id") or (
            payment_status != "CANCELLED"
            and any(not fields.get(key) for key in ("m_payment_id", "amount_gross"))
        ):
            raise _itn_rejection(
                400,
                "missing required fields",
                "PayFast notification is missing required fields.",
            )
        if payment_status == "CANCELLED" and not fields.get("token"):
            raise _itn_rejection(
                400,
                "cancellation is missing subscription token",
                "PayFast cancellation is missing its subscription token.",
            )

        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
                validation = await client.post(
                    PAYFAST_SANDBOX_VALIDATE_URL,
                    content=body,
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
        except httpx.RequestError as exc:
            logger.error(
                "PayFast sandbox ITN validation request failed (%s).",
                type(exc).__name__,
            )
            raise HTTPException(
                status_code=503,
                detail="PayFast could not be reached to validate this notification.",
            ) from exc
        if validation.status_code != 200 or validation.text.strip() != "VALID":
            raise _itn_rejection(
                400,
                "PayFast validation endpoint rejected notification",
                "PayFast did not validate this notification.",
            )

        checkout_rows = (
            await db.query_raw(
                'SELECT "id", "userId", "plan", "billingInterval", "amount", "status", '
                '"providerSubscriptionId" FROM "PayfastCheckout" WHERE "id" = $1',
                fields["m_payment_id"],
            )
            if fields.get("m_payment_id")
            else []
        )
        checkout = checkout_rows[0] if checkout_rows else None
        token = fields.get("token")
        subscription = None
        if token:
            subscription_rows = await db.query_raw(
                'SELECT "userId", "plan", "billingInterval", "status", "currentPeriodEnd" '
                'FROM "UserSubscription" WHERE "provider" = $1 AND "providerSubscriptionId" = $2',
                "payfast",
                token,
            )
            subscription = subscription_rows[0] if subscription_rows else None
        if payment_status == "CANCELLED":
            if not subscription:
                raise HTTPException(status_code=404, detail="PayFast subscription was not found.")
            checkout = None

        if checkout and checkout.get("status") == "COMPLETE":
            if token and checkout.get("providerSubscriptionId") == token:
                checkout = None
            else:
                raise HTTPException(
                    status_code=409,
                    detail="This PayFast checkout has already completed for another subscription.",
                )
        elif checkout and checkout.get("status") not in {"PENDING", payment_status}:
            raise HTTPException(
                status_code=409,
                detail="This PayFast checkout is no longer pending.",
            )

        if checkout:
            user_id = str(checkout["userId"])
            plan = str(checkout["plan"])
            interval = str(checkout["billingInterval"])
            expected_amount = _as_decimal(checkout["amount"])
        elif subscription:
            user_id = str(subscription["userId"])
            plan = str(subscription["plan"])
            interval = str(subscription["billingInterval"])
            expected_amount = prices.get(plan, {}).get(interval)
        else:
            raise HTTPException(status_code=404, detail="PayFast checkout or subscription was not found.")

        received_amount = _as_decimal(fields.get("amount_gross"))
        if payment_status != "CANCELLED" and (
            expected_amount is None or received_amount != expected_amount
        ):
            raise _itn_rejection(
                400,
                "payment amount mismatch",
                "PayFast amount did not match the selected plan.",
            )
        if payment_status == "COMPLETE" and not token:
            raise _itn_rejection(
                400,
                "completed subscription missing token",
                "PayFast did not include the subscription token.",
            )

        if token:
            token_owner = await db.query_raw(
                'SELECT "userId" FROM "UserSubscription" '
                'WHERE "providerSubscriptionId" = $1',
                token,
            )
            if token_owner and str(token_owner[0]["userId"]) != user_id:
                raise _itn_rejection(
                    400,
                    "subscription token already assigned",
                    "PayFast subscription token is already assigned.",
                )

        now = datetime.now(timezone.utc)
        async with db.tx() as transaction:
            completed_event = await transaction.query_raw(
                'SELECT "id" FROM "PayfastNotification" '
                'WHERE "providerPaymentId" = $1 AND "paymentStatus" = $2',
                fields["pf_payment_id"],
                "COMPLETE",
            )
            if completed_event and payment_status in {"FAILED", "PENDING"}:
                return {"received": True, "duplicate": True}

            inserted = await transaction.query_raw(
                'INSERT INTO "PayfastNotification" '
                '("id", "providerPaymentId", "merchantReference", "providerSubscriptionId", '
                '"paymentStatus", "amount") '
                'VALUES ($1, $2, $3, $4, $5, $6::numeric) '
                'ON CONFLICT ("providerPaymentId", "paymentStatus") DO NOTHING RETURNING "id"',
                str(uuid.uuid4()),
                fields["pf_payment_id"],
                fields.get("m_payment_id") or f"subscription:{token}",
                token,
                payment_status,
                received_amount,
            )
            if not inserted:
                return {"received": True, "duplicate": True}

            if payment_status == "COMPLETE":
                period_start = now
                if subscription and subscription.get("currentPeriodEnd"):
                    period_end = subscription["currentPeriodEnd"]
                    if period_end.tzinfo is None:
                        period_end = period_end.replace(tzinfo=timezone.utc)
                    if period_end > now:
                        period_start = period_end
                period_end = _next_period(period_start, interval)
                await transaction.execute_raw(
                    'INSERT INTO "UserSubscription" '
                    '("id", "userId", "plan", "status", "currentPeriodStart", "currentPeriodEnd", '
                    '"paymentFailedAt", "canceledAt", "provider", "providerSubscriptionId", '
                    '"billingInterval", "updatedAt") '
                    'VALUES ($1, $2, $3, $4, $5, $6, NULL, NULL, $7, $8, $9, CURRENT_TIMESTAMP) '
                    'ON CONFLICT ("userId") DO UPDATE SET "plan" = EXCLUDED."plan", '
                    '"status" = EXCLUDED."status", "currentPeriodStart" = EXCLUDED."currentPeriodStart", '
                    '"currentPeriodEnd" = EXCLUDED."currentPeriodEnd", "paymentFailedAt" = NULL, '
                    '"canceledAt" = NULL, "provider" = EXCLUDED."provider", '
                    '"providerSubscriptionId" = EXCLUDED."providerSubscriptionId", '
                    '"billingInterval" = EXCLUDED."billingInterval", '
                    '"cancellationRequestedAt" = CASE WHEN "UserSubscription"."cancelAtPeriodEnd" '
                    'THEN "UserSubscription"."cancellationRequestedAt" ELSE NULL END, '
                    '"cancellationRequestSentAt" = CASE WHEN "UserSubscription"."cancelAtPeriodEnd" '
                    'THEN "UserSubscription"."cancellationRequestSentAt" ELSE NULL END, '
                    '"cancellationAttemptCount" = CASE WHEN "UserSubscription"."cancelAtPeriodEnd" '
                    'THEN "UserSubscription"."cancellationAttemptCount" ELSE 0 END, '
                    '"cancellationLastAttemptAt" = CASE WHEN "UserSubscription"."cancelAtPeriodEnd" '
                    'THEN "UserSubscription"."cancellationLastAttemptAt" ELSE NULL END, '
                    '"updatedAt" = CURRENT_TIMESTAMP',
                    str(uuid.uuid4()),
                    user_id,
                    plan,
                    "ACTIVE",
                    period_start,
                    period_end,
                    "payfast",
                    token,
                    interval,
                )
                if checkout:
                    await transaction.execute_raw(
                        'UPDATE "PayfastCheckout" SET "status" = $1, '
                        '"providerSubscriptionId" = $2, "updatedAt" = CURRENT_TIMESTAMP '
                        'WHERE "id" = $3',
                        "COMPLETE",
                        token,
                        fields["m_payment_id"],
                    )
            elif payment_status in {"FAILED", "CANCELLED"}:
                if checkout:
                    await transaction.execute_raw(
                        'UPDATE "PayfastCheckout" SET "status" = $1, "updatedAt" = CURRENT_TIMESTAMP '
                        'WHERE "id" = $2 AND "status" = $3',
                        payment_status,
                        fields["m_payment_id"],
                        "PENDING",
                    )
                elif subscription:
                    await transaction.execute_raw(
                        'UPDATE "UserSubscription" SET "status" = $1, '
                        '"paymentFailedAt" = CASE WHEN $1 = $6 THEN $2 ELSE NULL END, '
                        '"canceledAt" = CASE WHEN $1 = $3 THEN $2 ELSE "canceledAt" END, '
                        '"cancellationRequestSentAt" = CASE WHEN $1 = $3 '
                        'THEN COALESCE("cancellationRequestSentAt", $2) '
                        'ELSE "cancellationRequestSentAt" END, '
                        '"updatedAt" = CURRENT_TIMESTAMP WHERE "provider" = $4 '
                        'AND "providerSubscriptionId" = $5',
                        "PAST_DUE" if payment_status == "FAILED" else "CANCELED",
                        now,
                        "CANCELED",
                        "payfast",
                        token,
                        "PAST_DUE",
                    )

        return {"received": True, "duplicate": False}

    return router
