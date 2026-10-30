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
from urllib.parse import parse_qsl, quote_plus

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from api.schemas.payfast import SubscriptionCheckoutRequest

logger = logging.getLogger(__name__)

PAYFAST_SANDBOX_PROCESS_URL = "https://sandbox.payfast.co.za/eng/process"
PAYFAST_SANDBOX_VALIDATE_URL = "https://sandbox.payfast.co.za/eng/query/validate"
MAX_ITN_BODY_BYTES = 16_384


@dataclass(frozen=True)
class PayFastSettings:
    mode: Optional[str]
    merchant_id: Optional[str]
    merchant_key: Optional[str]
    passphrase: Optional[str]
    return_url: Optional[str]
    cancel_url: Optional[str]
    notify_url: Optional[str]

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


def _signature(fields: Sequence[tuple[str, str]], passphrase: str) -> str:
    parameters = [
        f"{key}={quote_plus(value, safe='')}"
        for key, value in fields
        if key != "signature" and value != ""
    ]
    if passphrase:
        parameters.append(f"passphrase={quote_plus(passphrase, safe='')}")
    return hashlib.md5("&".join(parameters).encode("utf-8")).hexdigest()


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

        existing = await db.query_raw(
            'SELECT "provider", "status", "providerSubscriptionId", "currentPeriodEnd" '
            'FROM "UserSubscription" WHERE "userId" = $1',
            user_id,
        )
        if existing and existing[0].get("provider") == "payfast" and existing[0].get(
            "providerSubscriptionId"
        ):
            raise HTTPException(
                status_code=409,
                detail="This account already has a PayFast subscription. Contact support to change it.",
            )

        users = await db.query_raw(
            'SELECT "email" FROM "User" WHERE "id" = $1',
            user_id,
        )
        if not users or not users[0].get("email"):
            raise HTTPException(status_code=404, detail="Account email was not found.")

        amount = prices[payload.plan][payload.billingInterval]
        checkout_id = str(uuid.uuid4())
        await db.execute_raw(
            'INSERT INTO "PayfastCheckout" '
            '("id", "userId", "plan", "billingInterval", "amount", "status", "updatedAt") '
            'VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)',
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
            ("m_payment_id", checkout_id),
            ("amount", f"{amount:.2f}"),
            ("item_name", f"Job Hunter {payload.plan.title()} ({payload.billingInterval})"),
            ("email_address", str(users[0]["email"])),
            ("subscription_type", "1"),
            ("frequency", "6" if payload.billingInterval == "annual" else "3"),
            ("cycles", "0"),
            ("recurring_amount", f"{amount:.2f}"),
        ]
        fields.append(("signature", _signature(fields, settings.passphrase or "")))

        return {
            "action": PAYFAST_SANDBOX_PROCESS_URL,
            "fields": dict(fields),
            "mode": "sandbox",
        }

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

        body = await request.body()
        if not body or len(body) > MAX_ITN_BODY_BYTES:
            raise HTTPException(status_code=400, detail="PayFast notification body is invalid.")
        try:
            pairs = parse_qsl(body.decode("utf-8"), keep_blank_values=True, strict_parsing=True)
        except (UnicodeDecodeError, ValueError) as exc:
            raise HTTPException(status_code=400, detail="PayFast notification is malformed.") from exc

        if not pairs or len({key for key, _ in pairs}) != len(pairs):
            raise HTTPException(status_code=400, detail="PayFast notification contains duplicate fields.")
        fields = dict(pairs)
        supplied_signature = fields.get("signature", "")
        if not supplied_signature or not hmac.compare_digest(
            supplied_signature,
            _signature(pairs, settings.passphrase or ""),
        ):
            raise HTTPException(status_code=400, detail="PayFast notification signature is invalid.")
        if fields.get("merchant_id") != settings.merchant_id:
            raise HTTPException(status_code=400, detail="PayFast merchant ID did not match.")

        required_fields = ("m_payment_id", "pf_payment_id", "payment_status", "amount_gross")
        if any(not fields.get(key) for key in required_fields):
            raise HTTPException(status_code=400, detail="PayFast notification is missing required fields.")

        try:
            async with httpx.AsyncClient(timeout=10.0, follow_redirects=False) as client:
                validation = await client.post(
                    PAYFAST_SANDBOX_VALIDATE_URL,
                    content=body,
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
        except httpx.RequestError as exc:
            logger.error("PayFast sandbox ITN validation request failed: %s", exc)
            raise HTTPException(
                status_code=503,
                detail="PayFast could not be reached to validate this notification.",
            ) from exc
        if validation.status_code != 200 or validation.text.strip() != "VALID":
            raise HTTPException(status_code=400, detail="PayFast did not validate this notification.")

        payment_status = fields["payment_status"]
        if payment_status not in {"COMPLETE", "FAILED", "CANCELLED", "PENDING"}:
            raise HTTPException(status_code=400, detail="PayFast notification status is unsupported.")

        checkout_rows = await db.query_raw(
            'SELECT "id", "userId", "plan", "billingInterval", "amount", "status", '
            '"providerSubscriptionId" FROM "PayfastCheckout" WHERE "id" = $1',
            fields["m_payment_id"],
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

        if checkout and checkout.get("status") == "COMPLETE" and token:
            if checkout.get("providerSubscriptionId") == token:
                checkout = None

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

        received_amount = _as_decimal(fields["amount_gross"])
        if expected_amount is None or received_amount != expected_amount:
            raise HTTPException(status_code=400, detail="PayFast amount did not match the selected plan.")
        if payment_status == "COMPLETE" and not token:
            raise HTTPException(status_code=400, detail="PayFast did not include the subscription token.")

        if token:
            token_owner = await db.query_raw(
                'SELECT "userId" FROM "UserSubscription" '
                'WHERE "providerSubscriptionId" = $1',
                token,
            )
            if token_owner and str(token_owner[0]["userId"]) != user_id:
                raise HTTPException(status_code=400, detail="PayFast subscription token is already assigned.")

        now = datetime.now(timezone.utc)
        async with db.tx() as transaction:
            inserted = await transaction.query_raw(
                'INSERT INTO "PayfastNotification" '
                '("id", "providerPaymentId", "merchantReference", "providerSubscriptionId", '
                '"paymentStatus", "amount") '
                'VALUES ($1, $2, $3, $4, $5, $6) '
                'ON CONFLICT ("providerPaymentId") DO NOTHING RETURNING "id"',
                str(uuid.uuid4()),
                fields["pf_payment_id"],
                fields["m_payment_id"],
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
                    '"billingInterval" = EXCLUDED."billingInterval", "updatedAt" = CURRENT_TIMESTAMP',
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
                        'UPDATE "UserSubscription" SET "status" = $1, "paymentFailedAt" = $2, '
                        '"canceledAt" = CASE WHEN $1 = $3 THEN $2 ELSE "canceledAt" END, '
                        '"updatedAt" = CURRENT_TIMESTAMP WHERE "provider" = $4 '
                        'AND "providerSubscriptionId" = $5',
                        "PAST_DUE" if payment_status == "FAILED" else "CANCELED",
                        now,
                        "CANCELED",
                        "payfast",
                        token,
                    )

        return {"received": True, "duplicate": False}

    return router
