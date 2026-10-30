import asyncio
import unittest
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch
from urllib.parse import urlencode

from fastapi import HTTPException
from starlette.requests import Request

from api.routes.payfast import (
    PAYFAST_SANDBOX_PROCESS_URL,
    PayFastSettings,
    _next_period,
    _signature,
    create_payfast_router,
)
from api.schemas.payfast import SubscriptionCheckoutRequest


class FakeDatabase:
    def __init__(self, *, checkout=None, duplicate_notification=False):
        self.checkout = checkout
        self.duplicate_notification = duplicate_notification
        self.queries = []
        self.executions = []

    async def query_raw(self, query, *values):
        self.queries.append((query, values))
        if 'INSERT INTO "PayfastNotification"' in query:
            return [] if self.duplicate_notification else [{"id": "notification-id"}]
        if 'FROM "PayfastCheckout"' in query:
            return [self.checkout] if self.checkout else []
        if 'FROM "UserSubscription"' in query:
            return []
        if 'FROM "User"' in query:
            return [{"email": "person@example.com"}]
        raise AssertionError(f"Unexpected query: {query}")

    async def execute_raw(self, query, *values):
        self.executions.append((query, values))

    @asynccontextmanager
    async def tx(self):
        yield self


class PayFastRouteTests(unittest.TestCase):
    def setUp(self):
        self.settings = PayFastSettings(
            mode="sandbox",
            merchant_id="sandbox-merchant",
            merchant_key="sandbox-key",
            passphrase="sandbox-passphrase",
            return_url="https://app.example.com/billing?checkout=return",
            cancel_url="https://app.example.com/billing?checkout=cancelled",
            notify_url="https://api.example.com/api/v1/billing/payfast/itn",
        )
        self.prices = {
            "starter": {
                "monthly": Decimal("29.00"),
                "annual": Decimal("278.40"),
            }
        }

    def test_checkout_builds_a_signed_annual_sandbox_subscription(self):
        db = FakeDatabase()
        endpoint = self._endpoint(db, "/api/v1/billing/checkout")

        result = asyncio.run(
            endpoint(
                payload=SubscriptionCheckoutRequest(
                    plan="starter",
                    billingInterval="annual",
                ),
                user_id="user-123",
            )
        )

        self.assertEqual(result["action"], PAYFAST_SANDBOX_PROCESS_URL)
        self.assertEqual(result["mode"], "sandbox")
        self.assertEqual(result["fields"]["frequency"], "6")
        self.assertEqual(result["fields"]["recurring_amount"], "278.40")
        self.assertEqual(
            result["fields"]["signature"],
            _signature(
                [(key, value) for key, value in result["fields"].items() if key != "signature"],
                self.settings.passphrase,
            ),
        )
        self.assertEqual(len(db.executions), 1)

    def test_checkout_is_disabled_when_live_mode_is_selected(self):
        settings = PayFastSettings(
            mode="live",
            merchant_id="merchant",
            merchant_key="key",
            passphrase="passphrase",
            return_url="https://app.example.com/return",
            cancel_url="https://app.example.com/cancel",
            notify_url="https://api.example.com/itn",
        )
        endpoint = self._endpoint(FakeDatabase(), "/api/v1/billing/checkout", settings)

        with self.assertRaises(HTTPException) as raised:
            asyncio.run(
                endpoint(
                    payload=SubscriptionCheckoutRequest(
                        plan="starter",
                        billingInterval="monthly",
                    ),
                    user_id="user-123",
                )
            )

        self.assertEqual(raised.exception.status_code, 503)

    def test_invalid_signature_is_rejected_before_provider_validation(self):
        endpoint = self._endpoint(FakeDatabase(), "/api/v1/billing/payfast/itn")
        request = _request(
            urlencode(
                [
                    ("merchant_id", "sandbox-merchant"),
                    ("m_payment_id", "checkout-id"),
                    ("pf_payment_id", "payment-id"),
                    ("payment_status", "COMPLETE"),
                    ("amount_gross", "29.00"),
                    ("signature", "invalid"),
                ]
            ).encode()
        )

        with self.assertRaises(HTTPException) as raised:
            asyncio.run(endpoint(request=request))

        self.assertEqual(raised.exception.status_code, 400)

    def test_valid_notification_activates_only_the_matching_paid_subscription(self):
        db = FakeDatabase(
            checkout={
                "id": "checkout-id",
                "userId": "user-123",
                "plan": "starter",
                "billingInterval": "monthly",
                "amount": Decimal("29.00"),
                "status": "PENDING",
                "providerSubscriptionId": None,
            }
        )
        endpoint = self._endpoint(db, "/api/v1/billing/payfast/itn")
        request = _signed_itn(self.settings.passphrase)

        with patch("api.routes.payfast.httpx.AsyncClient", _ValidatingClient):
            result = asyncio.run(endpoint(request=request))

        self.assertEqual(result, {"received": True, "duplicate": False})
        self.assertEqual(len(db.executions), 2)
        self.assertIn('"UserSubscription"', db.executions[0][0])
        self.assertIn('"PayfastCheckout"', db.executions[1][0])

    def test_duplicate_notification_does_not_repeat_subscription_updates(self):
        db = FakeDatabase(
            checkout={
                "id": "checkout-id",
                "userId": "user-123",
                "plan": "starter",
                "billingInterval": "monthly",
                "amount": Decimal("29.00"),
                "status": "PENDING",
                "providerSubscriptionId": None,
            },
            duplicate_notification=True,
        )
        endpoint = self._endpoint(db, "/api/v1/billing/payfast/itn")

        with patch("api.routes.payfast.httpx.AsyncClient", _ValidatingClient):
            result = asyncio.run(endpoint(request=_signed_itn(self.settings.passphrase)))

        self.assertEqual(result, {"received": True, "duplicate": True})
        self.assertEqual(db.executions, [])

    def test_amount_mismatch_does_not_create_entitlement(self):
        db = FakeDatabase(
            checkout={
                "id": "checkout-id",
                "userId": "user-123",
                "plan": "starter",
                "billingInterval": "monthly",
                "amount": Decimal("29.00"),
                "status": "PENDING",
                "providerSubscriptionId": None,
            }
        )
        endpoint = self._endpoint(db, "/api/v1/billing/payfast/itn")
        request = _signed_itn(self.settings.passphrase, amount="1.00")

        with patch("api.routes.payfast.httpx.AsyncClient", _ValidatingClient):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(endpoint(request=request))

        self.assertEqual(raised.exception.status_code, 400)
        self.assertEqual(db.executions, [])

    def test_period_calculation_handles_month_end_and_leap_day(self):
        month_end = datetime(2026, 1, 31, 12, tzinfo=timezone.utc)
        leap_day = datetime(2024, 2, 29, 12, tzinfo=timezone.utc)

        self.assertEqual(_next_period(month_end, "monthly"), datetime(2026, 2, 28, 12, tzinfo=timezone.utc))
        self.assertEqual(_next_period(leap_day, "annual"), datetime(2025, 2, 28, 12, tzinfo=timezone.utc))

    def _endpoint(self, db, path, settings=None):
        router = create_payfast_router(
            db,
            _get_current_user,
            settings or self.settings,
            self.prices,
        )
        return next(route.endpoint for route in router.routes if route.path == path)


class _ValidatingClient:
    def __init__(self, **kwargs):
        self.kwargs = kwargs

    async def __aenter__(self):
        return self

    async def __aexit__(self, *args):
        return None

    async def post(self, url, *, content, headers):
        return SimpleNamespace(status_code=200, text="VALID")


async def _get_current_user():
    return "user-123"


def _request(body):
    async def receive():
        return {"type": "http.request", "body": body, "more_body": False}

    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/billing/payfast/itn",
            "headers": [(b"content-type", b"application/x-www-form-urlencoded")],
            "query_string": b"",
            "server": ("api.example.com", 443),
            "client": ("192.0.2.1", 12345),
            "scheme": "https",
            "http_version": "1.1",
        },
        receive,
    )


def _signed_itn(passphrase, *, amount="29.00"):
    pairs = [
        ("merchant_id", "sandbox-merchant"),
        ("m_payment_id", "checkout-id"),
        ("pf_payment_id", "payment-id"),
        ("payment_status", "COMPLETE"),
        ("amount_gross", amount),
        ("token", "subscription-token"),
    ]
    pairs.append(("signature", _signature(pairs, passphrase)))
    return _request(urlencode(pairs).encode())


if __name__ == "__main__":
    unittest.main()
