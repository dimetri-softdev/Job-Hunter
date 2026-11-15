import hashlib
import hmac
import logging
import uuid
from calendar import monthrange
from collections.abc import Awaitable, Callable, Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from decimal import Decimal, InvalidOperation
from typing import Any, Optional
from urllib.parse import parse_qsl, quote, quote_plus

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request

from api.schemas.payfast import SubscriptionChangeRequest, SubscriptionCheckoutRequest
from api.services.dates import utc_datetime

logger = logging.getLogger(__name__)

PAYFAST_SANDBOX_PROCESS_URL = "https://sandbox.payfast.co.za/eng/process"
PAYFAST_SANDBOX_VALIDATE_URL = "https://sandbox.payfast.co.za/eng/query/validate"
PAYFAST_LIVE_PROCESS_URL = "https://www.payfast.co.za/eng/process"
PAYFAST_LIVE_VALIDATE_URL = "https://www.payfast.co.za/eng/query/validate"
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

    @classmethod
    def from_environment(cls, environment: Mapping[str, str]) -> "PayFastSettings":
        def configured_value(name: str) -> Optional[str]:
            value = environment.get(name)
            return value.strip() if value else None

        mode = (configured_value("PAYFAST_MODE") or "sandbox").lower()
        if mode == "live":
            merchant_id = configured_value("PAYFAST_LIVE_MERCHANT_ID")
            merchant_key = configured_value("PAYFAST_LIVE_MERCHANT_KEY")
            passphrase = configured_value("PAYFAST_LIVE_PASSPHRASE")
        elif mode == "sandbox":
            merchant_id = (
                configured_value("PAYFAST_SANDBOX_MERCHANT_ID")
                or configured_value("PAYFAST_MERCHANT_ID")
            )
            merchant_key = (
                configured_value("PAYFAST_SANDBOX_MERCHANT_KEY")
                or configured_value("PAYFAST_MERCHANT_KEY")
            )
            passphrase = (
                configured_value("PAYFAST_SANDBOX_PASSPHRASE")
                or configured_value("PAYFAST_PASSPHRASE")
            )
        else:
            merchant_id = merchant_key = passphrase = None

        return cls(
            mode=mode,
            merchant_id=merchant_id,
            merchant_key=merchant_key,
            passphrase=passphrase,
            return_url=configured_value("PAYFAST_RETURN_URL"),
            cancel_url=configured_value("PAYFAST_CANCEL_URL"),
            notify_url=configured_value("PAYFAST_NOTIFY_URL"),
            cancellation_cron_secret=configured_value("PAYFAST_CANCELLATION_CRON_SECRET"),
        )

    @property
    def checkout_url(self) -> Optional[str]:
        if self.mode == "sandbox":
            return PAYFAST_SANDBOX_PROCESS_URL
        if self.mode == "live":
            return PAYFAST_LIVE_PROCESS_URL
        return None

    @property
    def validation_url(self) -> Optional[str]:
        if self.mode == "sandbox":
            return PAYFAST_SANDBOX_VALIDATE_URL
        if self.mode == "live":
            return PAYFAST_LIVE_VALIDATE_URL
        return None

    @property
    def checkout_enabled(self) -> bool:
        return (
            self.mode in {"sandbox", "live"}
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
            self.mode in {"sandbox", "live"}
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


def _itn_signature(
    fields: Sequence[tuple[str, str]],
    passphrase: str,
    *,
    sort_fields: bool = False,
    trim_values: bool = False,
    omit_empty: bool = False,
) -> str:
    signature_fields = []
    for key, value in fields:
        if key == "signature":
            break
        if trim_values:
            value = value.strip()
        if omit_empty and not value:
            continue
        signature_fields.append((key, value))
    if sort_fields:
        signature_fields.sort()

    parameters = []
    for key, value in signature_fields:
        encoded_value = quote_plus(value, safe="").replace("~", "%7E")
        parameters.append(f"{key}={encoded_value}")
    if passphrase:
        encoded_passphrase = quote_plus(passphrase, safe="").replace("~", "%7E")
        parameters.append(f"passphrase={encoded_passphrase}")
    return hashlib.md5("&".join(parameters).encode("utf-8")).hexdigest()


def _itn_signature_diagnostic(
    fields: Sequence[tuple[str, str]],
    passphrase: str,
    supplied_signature: str,
) -> str:
    variants = (
        ("without_passphrase", _itn_signature(fields, "")),
        ("sorted_fields", _itn_signature(fields, passphrase, sort_fields=True)),
        ("trimmed_values", _itn_signature(fields, passphrase, trim_values=True)),
        (
            "trimmed_values_omit_empty",
            _itn_signature(fields, passphrase, trim_values=True, omit_empty=True),
        ),
    )
    for name, signature in variants:
        if hmac.compare_digest(supplied_signature, signature):
            return name
    return "no_alternate_match"


def _api_signature(fields: dict[str, str], passphrase: str) -> str:
    normalized_passphrase = passphrase.strip()
    if normalized_passphrase:
        fields = {**fields, "passphrase": normalized_passphrase}
    return _signature(sorted(fields.items()), "")


def _itn_rejection(status_code: int, reason: str, detail: str) -> HTTPException:
    logger.warning("PayFast ITN rejected: %s", reason)
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


async def _process_replaced_subscription_cancellation(
    db: Any,
    client: httpx.AsyncClient,
    settings: PayFastSettings,
    checkout_id: str,
) -> Optional[bool]:
    attempted_at = datetime.now(timezone.utc)
    async with db.tx() as transaction:
        rows = await transaction.query_raw(
            'SELECT "id", "replacedSubscriptionToken" FROM "PayfastCheckout" '
            'WHERE "id" = $1 AND "status" = $2 AND "providerEnvironment" = $3 '
            'AND "replacedSubscriptionToken" IS NOT NULL '
            'AND "replacedSubscriptionCancellationSentAt" IS NULL '
            'AND "replacedSubscriptionCanceledAt" IS NULL '
            'AND ("replacedSubscriptionCancellationLastAttemptAt" IS NULL OR '
            '"replacedSubscriptionCancellationLastAttemptAt" <= $4::timestamp) '
            'FOR UPDATE',
            checkout_id,
            "COMPLETE",
            settings.mode,
            attempted_at - MAX_CANCELLATION_RETRY_INTERVAL,
        )
        if not rows or not rows[0].get("replacedSubscriptionToken"):
            return None
        replacement = rows[0]
        await transaction.execute_raw(
            'UPDATE "PayfastCheckout" SET '
            '"replacedSubscriptionCancellationAttemptCount" = '
            '"replacedSubscriptionCancellationAttemptCount" + 1, '
            '"replacedSubscriptionCancellationLastAttemptAt" = $1::timestamp, '
            '"updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2',
            attempted_at,
            checkout_id,
        )

    timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
    api_fields = {
        "merchant-id": settings.merchant_id or "",
        "timestamp": timestamp,
        "version": "v1",
    }
    headers = {
        **api_fields,
        "signature": _api_signature(api_fields, settings.passphrase or ""),
    }
    token = str(replacement["replacedSubscriptionToken"])
    try:
        response = await client.put(
            f"{PAYFAST_API_URL}/subscriptions/{quote(token, safe='')}/cancel",
            **({"params": {"testing": "true"}} if settings.mode == "sandbox" else {}),
            headers=headers,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as exc:
        logger.error(
            "PayFast replacement cancellation failed with HTTP %s.",
            exc.response.status_code,
        )
        return False
    except httpx.RequestError as exc:
        logger.error(
            "PayFast replacement cancellation failed (%s).",
            type(exc).__name__,
        )
        return False

    await db.execute_raw(
        'UPDATE "PayfastCheckout" SET '
        '"replacedSubscriptionCancellationSentAt" = $1::timestamp, '
        '"updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2 '
        'AND "replacedSubscriptionCancellationSentAt" IS NULL',
        datetime.now(timezone.utc),
        checkout_id,
    )
    return True


def create_payfast_router(
    db: Any,
    get_current_user: Callable[..., Awaitable[str]],
    settings: PayFastSettings,
    prices: dict[str, dict[str, Decimal]],
    plan_order: Optional[dict[str, int]] = None,
) -> APIRouter:
    router = APIRouter()
    ranks = plan_order or {
        "basic": 0,
        **{plan: index + 1 for index, plan in enumerate(prices)},
    }

    @router.post("/api/v1/billing/checkout")
    async def create_checkout(
        payload: SubscriptionCheckoutRequest,
        user_id: str = Depends(get_current_user),
    ):
        if not settings.checkout_enabled:
            raise HTTPException(
                status_code=503,
                detail="PayFast checkout is not configured.",
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
        now = datetime.now(timezone.utc)
        async with db.tx() as transaction:
            await transaction.query_raw(
                'SELECT "id" FROM "User" WHERE "id" = $1 FOR UPDATE',
                user_id,
            )
            existing = await transaction.query_raw(
                'SELECT "id", "provider", "providerEnvironment", "status", "plan", '
                '"billingInterval", "providerSubscriptionId", "currentPeriodEnd", '
                '"cancelAtPeriodEnd", "cancellationRequestSentAt", '
                '"cancellationAttemptCount", "scheduledPlan", "scheduledBillingInterval" '
                'FROM "UserSubscription" WHERE "userId" = $1 FOR UPDATE',
                user_id,
            )
            change_type = "NEW"
            replaced_subscription = None
            if (
                existing
                and existing[0].get("provider") == "payfast"
                and existing[0].get("providerSubscriptionId")
                and existing[0].get("providerEnvironment") == settings.mode
            ):
                current = existing[0]
                period_end = utc_datetime(current.get("currentPeriodEnd"))
                current_is_paid = period_end is not None and period_end > now
                if current.get("cancelAtPeriodEnd"):
                    if (
                        current.get("scheduledPlan")
                        and period_end
                        and period_end <= now
                        and plan == current.get("scheduledPlan")
                    ):
                        change_type = "DOWNGRADE"
                    elif (
                        current.get("status") == "CANCELED"
                        and period_end
                        and period_end <= now
                    ):
                        change_type = "NEW"
                    else:
                        raise HTTPException(
                            status_code=409,
                            detail=(
                                "This subscription is scheduled to end. Undo the scheduled "
                                "cancellation or wait until the paid period ends before checkout."
                            ),
                        )
                elif current.get("status") in {"ACTIVE", "PAST_DUE"} and current_is_paid:
                    current_rank = ranks.get(str(current.get("plan", "")).lower())
                    target_rank = ranks.get(plan)
                    if current_rank is None or target_rank is None or target_rank <= current_rank:
                        raise HTTPException(
                            status_code=409,
                            detail=(
                                "Choose a higher plan for immediate checkout. Lower plans "
                                "must be scheduled for renewal, and the current plan cannot be re-purchased."
                            ),
                        )
                    change_type = "UPGRADE"
                    replaced_subscription = current
                    if not settings.cancellation_enabled:
                        raise HTTPException(
                            status_code=503,
                            detail=(
                                "The PayFast cancellation processor must be configured "
                                "before upgrading an existing subscription."
                            ),
                        )
                elif current.get("status") in {"ACTIVE", "PAST_DUE"}:
                    raise HTTPException(
                        status_code=409,
                        detail="The existing PayFast subscription must be canceled before starting another checkout.",
                    )
                elif current_is_paid:
                    raise HTTPException(
                        status_code=409,
                        detail="Wait until the current paid period ends before starting another checkout.",
                    )

            pending = await transaction.query_raw(
                'SELECT "id", "plan", "billingInterval", "amount", "changeType", '
                '"replacedSubscriptionToken" FROM "PayfastCheckout" '
                'WHERE "userId" = $1 AND "status" = $2 '
                'AND "providerEnvironment" = $3 LIMIT 1 FOR UPDATE',
                user_id,
                "PENDING",
                settings.mode,
            )
            if pending:
                pending_checkout = pending[0]
                if (
                    pending_checkout["plan"] != plan
                    or pending_checkout["billingInterval"] != interval
                    or pending_checkout.get("changeType", change_type) != change_type
                    or pending_checkout.get("replacedSubscriptionToken")
                    != (
                        replaced_subscription.get("providerSubscriptionId")
                        if replaced_subscription
                        else None
                    )
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
                    '("id", "userId", "plan", "billingInterval", "amount", "status", '
                    '"providerEnvironment", "changeType", "replacedSubscriptionToken", '
                    '"replacedSubscriptionPlan", "replacedSubscriptionBillingInterval", "updatedAt") '
                    'VALUES ($1, $2, $3, $4, $5::numeric, $6, $7, $8, $9, $10, $11, CURRENT_TIMESTAMP)',
                    checkout_id,
                    user_id,
                    payload.plan,
                    payload.billingInterval,
                    amount,
                    "PENDING",
                    settings.mode,
                    change_type,
                    replaced_subscription.get("providerSubscriptionId")
                    if replaced_subscription
                    else None,
                    replaced_subscription.get("plan") if replaced_subscription else None,
                    replaced_subscription.get("billingInterval")
                    if replaced_subscription
                    else None,
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
            "action": settings.checkout_url,
            "fields": dict(fields),
            "mode": settings.mode,
        }

    @router.post("/api/v1/billing/payfast/change")
    async def schedule_downgrade(
        payload: SubscriptionChangeRequest,
        user_id: str = Depends(get_current_user),
    ):
        if not settings.cancellation_enabled:
            raise HTTPException(
                status_code=503,
                detail="PayFast cancellation is not configured.",
            )

        now = datetime.now(timezone.utc)
        async with db.tx() as transaction:
            await transaction.query_raw(
                'SELECT "id" FROM "User" WHERE "id" = $1 FOR UPDATE',
                user_id,
            )
            subscriptions = await transaction.query_raw(
                'SELECT "provider", "providerEnvironment", "providerSubscriptionId", '
                '"plan", "status", "currentPeriodEnd", "cancelAtPeriodEnd", '
                '"scheduledPlan", "scheduledBillingInterval", '
                '"cancellationRequestSentAt", "cancellationAttemptCount" '
                'FROM "UserSubscription" WHERE "userId" = $1 FOR UPDATE',
                user_id,
            )
            if (
                not subscriptions
                or subscriptions[0].get("provider") != "payfast"
                or not subscriptions[0].get("providerSubscriptionId")
            ):
                raise HTTPException(status_code=404, detail="No PayFast subscription was found.")
            subscription = subscriptions[0]
            if subscription.get("providerEnvironment") != settings.mode:
                raise HTTPException(
                    status_code=409,
                    detail="This subscription belongs to a different PayFast environment.",
                )
            period_end = utc_datetime(subscription.get("currentPeriodEnd"))
            current_rank = ranks.get(str(subscription.get("plan", "")).lower())
            target_rank = ranks.get(payload.plan)
            if (
                subscription.get("status") not in {"ACTIVE", "PAST_DUE"}
                or not period_end
                or period_end <= now
            ):
                raise HTTPException(
                    status_code=409,
                    detail="This subscription cannot be scheduled for a plan change.",
                )
            if current_rank is None or target_rank is None or target_rank >= current_rank:
                raise HTTPException(
                    status_code=409,
                    detail="Choose a lower plan to schedule a change at renewal.",
                )
            if (
                subscription.get("cancellationRequestSentAt")
                or subscription.get("cancellationAttemptCount", 0) > 0
            ):
                raise HTTPException(
                    status_code=409,
                    detail="This cancellation is already being processed and cannot be changed here.",
                )
            pending = await transaction.query_raw(
                'SELECT "id" FROM "PayfastCheckout" WHERE "userId" = $1 '
                'AND "status" = $2 AND "providerEnvironment" = $3 LIMIT 1',
                user_id,
                "PENDING",
                settings.mode,
            )
            if pending:
                raise HTTPException(
                    status_code=409,
                    detail="Finish or cancel the pending checkout before scheduling a plan change.",
                )

            if (
                not subscription.get("cancelAtPeriodEnd")
                or subscription.get("scheduledPlan") != payload.plan
                or subscription.get("scheduledBillingInterval") != payload.billingInterval
            ):
                await transaction.execute_raw(
                    'UPDATE "UserSubscription" SET "cancelAtPeriodEnd" = TRUE, '
                    '"cancellationRequestedAt" = $1::timestamp, "scheduledPlan" = $2, '
                    '"scheduledBillingInterval" = $3, "updatedAt" = CURRENT_TIMESTAMP '
                    'WHERE "userId" = $4 AND "provider" = $5',
                    now,
                    payload.plan,
                    payload.billingInterval,
                    user_id,
                    "payfast",
                )

        return {
            "cancelAtPeriodEnd": True,
            "scheduledPlan": payload.plan,
            "scheduledBillingInterval": payload.billingInterval,
            "currentPeriodEnd": period_end.isoformat(),
        }

    @router.delete("/api/v1/billing/payfast/change")
    async def undo_scheduled_downgrade(
        user_id: str = Depends(get_current_user),
    ):
        if not settings.cancellation_enabled:
            raise HTTPException(
                status_code=503,
                detail="PayFast cancellation is not configured.",
            )

        async with db.tx() as transaction:
            subscriptions = await transaction.query_raw(
                'SELECT "provider", "providerEnvironment", "cancelAtPeriodEnd", '
                '"scheduledPlan", "cancellationRequestSentAt", '
                '"currentPeriodEnd", "cancellationAttemptCount" '
                'FROM "UserSubscription" WHERE "userId" = $1 FOR UPDATE',
                user_id,
            )
            if not subscriptions or subscriptions[0].get("provider") != "payfast":
                raise HTTPException(status_code=404, detail="No PayFast subscription was found.")
            subscription = subscriptions[0]
            if subscription.get("providerEnvironment") != settings.mode:
                raise HTTPException(
                    status_code=409,
                    detail="This subscription belongs to a different PayFast environment.",
                )
            period_end = utc_datetime(subscription.get("currentPeriodEnd"))
            if (
                not subscription.get("scheduledPlan")
                or subscription.get("cancellationRequestSentAt")
                or subscription.get("cancellationAttemptCount", 0) > 0
                or not period_end
                or period_end <= datetime.now(timezone.utc)
            ):
                raise HTTPException(
                    status_code=409,
                    detail="This scheduled plan change can no longer be undone here.",
                )
            if subscription.get("cancelAtPeriodEnd"):
                await transaction.execute_raw(
                    'UPDATE "UserSubscription" SET "cancelAtPeriodEnd" = FALSE, '
                    '"cancellationRequestedAt" = NULL, "scheduledPlan" = NULL, '
                    '"scheduledBillingInterval" = NULL, "updatedAt" = CURRENT_TIMESTAMP '
                    'WHERE "userId" = $1 AND "provider" = $2',
                    user_id,
                    "payfast",
                )

        return {"cancelAtPeriodEnd": False, "scheduledPlan": None}

    @router.post("/api/v1/billing/payfast/cancel")
    async def request_period_end_cancellation(
        user_id: str = Depends(get_current_user),
    ):
        if not settings.cancellation_enabled:
            raise HTTPException(
                status_code=503,
                detail="PayFast cancellation is not configured.",
            )

        now = datetime.now(timezone.utc)
        async with db.tx() as transaction:
            subscriptions = await transaction.query_raw(
                'SELECT "provider", "providerEnvironment", "providerSubscriptionId", '
                '"status", "currentPeriodEnd", '
                '"cancelAtPeriodEnd", "cancellationRequestSentAt" '
                'FROM "UserSubscription" WHERE "userId" = $1 FOR UPDATE',
                user_id,
            )
            if not subscriptions or subscriptions[0].get("provider") != "payfast":
                raise HTTPException(status_code=404, detail="No PayFast subscription was found.")
            subscription = subscriptions[0]
            if subscription.get("providerEnvironment") != settings.mode:
                raise HTTPException(
                    status_code=409,
                    detail="This subscription belongs to a different PayFast environment.",
                )
            period_end = utc_datetime(subscription.get("currentPeriodEnd"))
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
                pending = await transaction.query_raw(
                    'SELECT "id" FROM "PayfastCheckout" WHERE "userId" = $1 '
                    'AND "status" = $2 AND "providerEnvironment" = $3 LIMIT 1',
                    user_id,
                    "PENDING",
                    settings.mode,
                )
                if pending:
                    raise HTTPException(
                        status_code=409,
                        detail="Finish or cancel the pending checkout before scheduling cancellation.",
                    )
            if not subscription.get("cancelAtPeriodEnd"):
                await transaction.execute_raw(
                    'UPDATE "UserSubscription" SET "cancelAtPeriodEnd" = TRUE, '
                    '"cancellationRequestedAt" = $1::timestamp, "updatedAt" = CURRENT_TIMESTAMP '
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
                detail="PayFast cancellation is not configured.",
            )

        async with db.tx() as transaction:
            subscriptions = await transaction.query_raw(
                'SELECT "provider", "providerEnvironment", "cancelAtPeriodEnd", '
                '"cancellationRequestSentAt", '
                '"currentPeriodEnd", "cancellationAttemptCount" '
                'FROM "UserSubscription" WHERE "userId" = $1 FOR UPDATE',
                user_id,
            )
            if not subscriptions or subscriptions[0].get("provider") != "payfast":
                raise HTTPException(status_code=404, detail="No PayFast subscription was found.")
            subscription = subscriptions[0]
            if subscription.get("providerEnvironment") != settings.mode:
                raise HTTPException(
                    status_code=409,
                    detail="This subscription belongs to a different PayFast environment.",
                )
            if subscription.get("cancellationRequestSentAt"):
                raise HTTPException(
                    status_code=409,
                    detail="PayFast has already received the cancellation request.",
                )
            period_end = utc_datetime(subscription.get("currentPeriodEnd"))
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
                    '"cancellationRequestedAt" = NULL, "scheduledPlan" = NULL, '
                    '"scheduledBillingInterval" = NULL, "updatedAt" = CURRENT_TIMESTAMP '
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
                detail="PayFast cancellation is not configured.",
            )

        due_subscriptions = await db.query_raw(
            'SELECT "id" FROM "UserSubscription" WHERE "provider" = $1 '
            'AND "providerEnvironment" = $2 AND "cancelAtPeriodEnd" = TRUE '
            'AND "cancellationRequestSentAt" IS NULL '
            'AND ("currentPeriodEnd" <= CURRENT_TIMESTAMP OR '
            '("scheduledPlan" IS NOT NULL AND "currentPeriodEnd" <= '
            'CURRENT_TIMESTAMP + INTERVAL \'1 day\') OR '
            '("cancellationRequestedAt" IS NOT NULL AND "currentPeriodStart" > "cancellationRequestedAt")) '
            'AND ("cancellationLastAttemptAt" IS NULL OR "cancellationLastAttemptAt" <= $3::timestamp) '
            'ORDER BY "currentPeriodEnd" ASC LIMIT $4',
            "payfast",
            settings.mode,
            datetime.now(timezone.utc) - MAX_CANCELLATION_RETRY_INTERVAL,
            MAX_CANCELLATIONS_PER_RUN,
        )
        due_replacements = await db.query_raw(
            'SELECT "id" FROM "PayfastCheckout" WHERE "status" = $1 '
            'AND "providerEnvironment" = $2 AND "replacedSubscriptionToken" IS NOT NULL '
            'AND "replacedSubscriptionCancellationSentAt" IS NULL '
            'AND "replacedSubscriptionCanceledAt" IS NULL '
            'AND ("replacedSubscriptionCancellationLastAttemptAt" IS NULL OR '
            '"replacedSubscriptionCancellationLastAttemptAt" <= $3::timestamp) '
            'ORDER BY "createdAt" ASC LIMIT $4',
            "COMPLETE",
            settings.mode,
            datetime.now(timezone.utc) - MAX_CANCELLATION_RETRY_INTERVAL,
            max(0, MAX_CANCELLATIONS_PER_RUN - len(due_subscriptions)),
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
                        'AND "providerEnvironment" = $3 AND "cancelAtPeriodEnd" = TRUE '
                        'AND "cancellationRequestSentAt" IS NULL '
                        'AND ("currentPeriodEnd" <= CURRENT_TIMESTAMP OR '
                        '("scheduledPlan" IS NOT NULL AND "currentPeriodEnd" <= '
                        'CURRENT_TIMESTAMP + INTERVAL \'1 day\') OR '
                        '("cancellationRequestedAt" IS NOT NULL AND "currentPeriodStart" > "cancellationRequestedAt")) '
                        'AND ("cancellationLastAttemptAt" IS NULL OR "cancellationLastAttemptAt" <= $4::timestamp) '
                        'FOR UPDATE',
                        candidate["id"],
                        "payfast",
                        settings.mode,
                        datetime.now(timezone.utc) - MAX_CANCELLATION_RETRY_INTERVAL,
                    )
                    if rows and rows[0].get("providerSubscriptionId"):
                        subscription = rows[0]
                        await transaction.execute_raw(
                            'UPDATE "UserSubscription" SET "cancellationAttemptCount" = '
                            '"cancellationAttemptCount" + 1, "cancellationLastAttemptAt" = $1::timestamp, '
                            '"updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2',
                            datetime.now(timezone.utc),
                            subscription["id"],
                        )
                if not subscription:
                    skipped += 1
                    continue

                timestamp = datetime.now(timezone.utc).replace(microsecond=0).isoformat()
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
                        **(
                            {"params": {"testing": "true"}}
                            if settings.mode == "sandbox"
                            else {}
                        ),
                        headers=headers,
                    )
                    response.raise_for_status()
                except httpx.HTTPStatusError as exc:
                    failed += 1
                    logger.error(
                        "PayFast cancellation request failed with HTTP %s.",
                        exc.response.status_code,
                    )
                    continue
                except httpx.RequestError as exc:
                    failed += 1
                    logger.error(
                        "PayFast cancellation request failed (%s).",
                        type(exc).__name__,
                    )
                    continue

                await db.execute_raw(
                    'UPDATE "UserSubscription" SET "cancellationRequestSentAt" = $1::timestamp, '
                    '"updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2 '
                    'AND "cancelAtPeriodEnd" = TRUE AND "cancellationRequestSentAt" IS NULL',
                    datetime.now(timezone.utc),
                    subscription["id"],
                )
                sent += 1

            for candidate in due_replacements:
                replacement_result = await _process_replaced_subscription_cancellation(
                    db,
                    client,
                    settings,
                    str(candidate["id"]),
                )
                if replacement_result is True:
                    sent += 1
                elif replacement_result is False:
                    failed += 1
                else:
                    skipped += 1

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
                detail="PayFast notifications are not configured.",
            )

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
            _itn_signature(pairs, settings.passphrase or ""),
        ):
            diagnostic = (
                _itn_signature_diagnostic(pairs, settings.passphrase or "", supplied_signature)
                if supplied_signature
                else "missing_signature"
            )
            raise _itn_rejection(
                400,
                f"signature mismatch; alternate={diagnostic}",
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
                    settings.validation_url,
                    content=body,
                    headers={"Content-Type": "application/x-www-form-urlencoded"},
                )
        except httpx.RequestError as exc:
            logger.error(
                "PayFast ITN validation request failed (%s).",
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
                '"providerEnvironment", "providerSubscriptionId", "changeType", '
                '"replacedSubscriptionToken", "replacedSubscriptionPlan", '
                '"replacedSubscriptionBillingInterval" '
                'FROM "PayfastCheckout" WHERE "id" = $1',
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
                'SELECT "userId", "plan", "billingInterval", "status", "currentPeriodEnd", '
                '"providerSubscriptionId" '
                'FROM "UserSubscription" WHERE "provider" = $1 '
                'AND "providerSubscriptionId" = $2 AND "providerEnvironment" = $3',
                "payfast",
                token,
                settings.mode,
            )
            subscription = subscription_rows[0] if subscription_rows else None
        replaced_subscription = None
        if token and not subscription:
            replacement_rows = await db.query_raw(
                'SELECT "id", "userId", "replacedSubscriptionPlan", '
                '"replacedSubscriptionBillingInterval" FROM "PayfastCheckout" '
                'WHERE "replacedSubscriptionToken" = $1 AND "providerEnvironment" = $2 '
                'AND "status" = $3 LIMIT 1',
                token,
                settings.mode,
                "COMPLETE",
            )
            replaced_subscription = replacement_rows[0] if replacement_rows else None
        replaced_notification = bool(replaced_subscription and not subscription)
        if replaced_notification:
            checkout = None
        if payment_status == "CANCELLED":
            if not subscription and not replaced_notification:
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
        if checkout and checkout.get("providerEnvironment") != settings.mode:
            raise HTTPException(
                status_code=409,
                detail="This checkout belongs to a different PayFast environment.",
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
        elif replaced_notification:
            user_id = str(replaced_subscription["userId"])
            plan = str(replaced_subscription["replacedSubscriptionPlan"])
            interval = str(replaced_subscription["replacedSubscriptionBillingInterval"])
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
        replacement_to_cancel = None
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

            if replaced_notification:
                if payment_status == "CANCELLED":
                    await transaction.execute_raw(
                        'UPDATE "PayfastCheckout" SET "replacedSubscriptionCanceledAt" = $1::timestamp, '
                        '"updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2 '
                        'AND "replacedSubscriptionCanceledAt" IS NULL',
                        now,
                        replaced_subscription["id"],
                    )
                return {"received": True, "duplicate": False}

            if payment_status == "COMPLETE":
                if checkout and checkout.get("changeType") in {"UPGRADE", "DOWNGRADE"}:
                    await transaction.query_raw(
                        'SELECT "id" FROM "User" WHERE "id" = $1 FOR UPDATE',
                        user_id,
                    )
                    current_rows = await transaction.query_raw(
                        'SELECT "provider", "providerEnvironment", "providerSubscriptionId", '
                        '"status", "currentPeriodEnd", "cancelAtPeriodEnd", '
                        '"scheduledPlan", "scheduledBillingInterval" '
                        'FROM "UserSubscription" WHERE "userId" = $1 FOR UPDATE',
                        user_id,
                    )
                    current = current_rows[0] if current_rows else None
                    if checkout["changeType"] == "UPGRADE":
                        if (
                            not current
                            or current.get("provider") != "payfast"
                            or current.get("providerEnvironment") != settings.mode
                            or current.get("providerSubscriptionId")
                            != checkout.get("replacedSubscriptionToken")
                            or current.get("status") not in {"ACTIVE", "PAST_DUE"}
                            or current.get("cancelAtPeriodEnd")
                        ):
                            raise HTTPException(
                                status_code=409,
                                detail="The existing subscription changed before the upgrade completed. Contact support.",
                            )
                    else:
                        current_period_end = utc_datetime(
                            current.get("currentPeriodEnd") if current else None
                        )
                        if (
                            not current
                            or current.get("provider") != "payfast"
                            or current.get("providerEnvironment") != settings.mode
                            or current.get("scheduledPlan") != plan
                            or not current_period_end
                            or current_period_end > now
                        ):
                            raise HTTPException(
                                status_code=409,
                                detail="The scheduled downgrade is not ready to complete. Contact support if this persists.",
                            )

                period_start = now
                if subscription and subscription.get("currentPeriodEnd"):
                    existing_period_end = utc_datetime(subscription["currentPeriodEnd"])
                    if existing_period_end and existing_period_end > now:
                        period_start = existing_period_end
                period_end = _next_period(period_start, interval)
                await transaction.execute_raw(
                    'INSERT INTO "UserSubscription" '
                    '("id", "userId", "plan", "status", "currentPeriodStart", "currentPeriodEnd", '
                    '"paymentFailedAt", "canceledAt", "provider", "providerEnvironment", '
                    '"providerSubscriptionId", "billingInterval", "updatedAt") '
                    'VALUES ($1, $2, $3, $4, $5::timestamp, $6::timestamp, NULL, NULL, '
                    '$7, $8, $9, $10, CURRENT_TIMESTAMP) '
                    'ON CONFLICT ("userId") DO UPDATE SET "plan" = EXCLUDED."plan", '
                    '"status" = EXCLUDED."status", "currentPeriodStart" = EXCLUDED."currentPeriodStart", '
                    '"currentPeriodEnd" = EXCLUDED."currentPeriodEnd", "paymentFailedAt" = NULL, '
                    '"canceledAt" = NULL, "provider" = EXCLUDED."provider", '
                    '"providerEnvironment" = EXCLUDED."providerEnvironment", '
                    '"providerSubscriptionId" = EXCLUDED."providerSubscriptionId", '
                    '"billingInterval" = EXCLUDED."billingInterval", '
                    '"cancelAtPeriodEnd" = CASE WHEN $11 THEN FALSE '
                    'ELSE "UserSubscription"."cancelAtPeriodEnd" END, '
                    '"cancellationRequestedAt" = CASE WHEN $11 THEN NULL '
                    'ELSE "UserSubscription"."cancellationRequestedAt" END, '
                    '"cancellationRequestSentAt" = CASE WHEN $11 THEN NULL '
                    'ELSE "UserSubscription"."cancellationRequestSentAt" END, '
                    '"cancellationAttemptCount" = CASE WHEN $11 THEN 0 '
                    'ELSE "UserSubscription"."cancellationAttemptCount" END, '
                    '"cancellationLastAttemptAt" = CASE WHEN $11 THEN NULL '
                    'ELSE "UserSubscription"."cancellationLastAttemptAt" END, '
                    '"scheduledPlan" = CASE WHEN $11 THEN NULL '
                    'ELSE "UserSubscription"."scheduledPlan" END, '
                    '"scheduledBillingInterval" = CASE WHEN $11 THEN NULL '
                    'ELSE "UserSubscription"."scheduledBillingInterval" END, '
                    '"updatedAt" = CURRENT_TIMESTAMP',
                    str(uuid.uuid4()),
                    user_id,
                    plan,
                    "ACTIVE",
                    period_start,
                    period_end,
                    "payfast",
                    settings.mode,
                    token,
                    interval,
                    bool(checkout),
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
                    if checkout.get("changeType") == "UPGRADE":
                        replacement_to_cancel = str(checkout["id"])
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
                        '"paymentFailedAt" = CASE WHEN $1 = $6 THEN $2::timestamp ELSE NULL END, '
                        '"canceledAt" = CASE WHEN $1 = $3 THEN $2::timestamp ELSE "canceledAt" END, '
                        '"cancellationRequestSentAt" = CASE WHEN $1 = $3 '
                        'THEN COALESCE("cancellationRequestSentAt", $2::timestamp) '
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

        if replacement_to_cancel:
            async with httpx.AsyncClient(timeout=15.0, follow_redirects=False) as client:
                await _process_replaced_subscription_cancellation(
                    db,
                    client,
                    settings,
                    replacement_to_cancel,
                )

        return {"received": True, "duplicate": False}

    return router
