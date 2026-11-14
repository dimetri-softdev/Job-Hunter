import asyncio
import unittest
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import patch
from urllib.parse import urlencode

from fastapi import HTTPException
from fastapi.routing import APIRoute
from starlette.requests import Request

from api.routes.payfast import (
    PAYFAST_SANDBOX_PROCESS_URL,
    PayFastSettings,
    _checkout_signature,
    _itn_signature,
    _next_period,
    _signature,
    create_payfast_router,
)
from api.schemas.payfast import SubscriptionCheckoutRequest


class FakeDatabase:
    def __init__(
        self,
        *,
        checkout=None,
        subscription=None,
        duplicate_notification=False,
        completed_event=False,
    ):
        self.checkout = checkout
        self.subscription = subscription
        self.duplicate_notification = duplicate_notification
        self.completed_event = completed_event
        self.queries = []
        self.executions = []

    async def query_raw(self, query, *values):
        self.queries.append((query, values))
        if 'INSERT INTO "PayfastNotification"' in query:
            return [] if self.duplicate_notification else [{"id": "notification-id"}]
        if 'FROM "PayfastNotification"' in query:
            return [{"id": "notification-id"}] if self.completed_event else []
        if 'FROM "PayfastCheckout"' in query:
            return [self.checkout] if self.checkout else []
        if 'FROM "UserSubscription"' in query:
            return [self.subscription] if self.subscription else []
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
        self.cancellation_settings = PayFastSettings(
            mode="sandbox",
            merchant_id="sandbox-merchant",
            merchant_key="sandbox-key",
            passphrase="sandbox-passphrase",
            return_url="https://app.example.com/billing?checkout=return",
            cancel_url="https://app.example.com/billing?checkout=cancelled",
            notify_url="https://api.example.com/api/v1/billing/payfast/itn",
            cancellation_cron_secret="cron-secret",
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
            _checkout_signature(
                [(key, value) for key, value in result["fields"].items() if key != "signature"],
                "sandbox-passphrase",
            ),
        )
        self.assertEqual(
            list(result["fields"]),
            [
                "merchant_id",
                "merchant_key",
                "return_url",
                "cancel_url",
                "notify_url",
                "email_address",
                "m_payment_id",
                "amount",
                "item_name",
                "subscription_type",
                "recurring_amount",
                "frequency",
                "cycles",
                "signature",
            ],
        )
        self.assertEqual(len(db.executions), 1)
        self.assertIn("$5::numeric", db.executions[0][0])

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

    def test_customer_can_schedule_period_end_cancellation(self):
        subscription = {
            "provider": "payfast",
            "providerSubscriptionId": "sandbox-token",
            "status": "ACTIVE",
            "currentPeriodEnd": datetime(2030, 1, 1, tzinfo=timezone.utc),
            "cancelAtPeriodEnd": False,
            "cancellationRequestSentAt": None,
        }
        db = CancellationDatabase(subscription)
        endpoint = self._endpoint(
            db,
            "/api/v1/billing/payfast/cancel",
            settings=self.cancellation_settings,
        )

        result = asyncio.run(endpoint(user_id="user-123"))

        self.assertTrue(result["cancelAtPeriodEnd"])
        self.assertEqual(result["currentPeriodEnd"], "2030-01-01T00:00:00+00:00")
        self.assertIn('"cancelAtPeriodEnd" = TRUE', db.executions[0][0])

    def test_customer_can_undo_cancellation_before_payfast_request(self):
        subscription = {
            "provider": "payfast",
            "cancelAtPeriodEnd": True,
            "cancellationRequestSentAt": None,
            "currentPeriodEnd": datetime(2030, 1, 1, tzinfo=timezone.utc),
            "cancellationAttemptCount": 0,
        }
        db = CancellationDatabase(subscription)
        endpoint = self._endpoint(
            db,
            "/api/v1/billing/payfast/cancel",
            settings=self.cancellation_settings,
            method="DELETE",
        )

        result = asyncio.run(endpoint(user_id="user-123"))

        self.assertFalse(result["cancelAtPeriodEnd"])
        self.assertIn('"cancelAtPeriodEnd" = FALSE', db.executions[0][0])

    def test_cancellation_job_uses_payfast_sandbox_testing_parameter(self):
        subscription = {
            "id": "subscription-id",
            "providerSubscriptionId": "sandbox-token",
            "cancellationAttemptCount": 0,
        }
        db = CancellationDatabase(subscription, due=True)
        endpoint = self._endpoint(
            db,
            "/api/v1/internal/payfast/cancellations/process",
            settings=self.cancellation_settings,
        )
        client = _SuccessfulCancellationClient()
        with patch("api.routes.payfast.httpx.AsyncClient", return_value=client):
            result = asyncio.run(endpoint(request=_cron_request()))

        self.assertEqual(result, {"sent": 1, "failed": 0, "skipped": 0})
        url, kwargs = client.put_request
        self.assertEqual(
            url,
            "https://api.payfast.co.za/subscriptions/sandbox-token/cancel",
        )
        self.assertEqual(kwargs["params"], {"testing": "true"})
        self.assertEqual(kwargs["headers"]["merchant-id"], "sandbox-merchant")
        signed_fields = {
            key: value
            for key, value in kwargs["headers"].items()
            if key != "signature"
        }
        import hashlib
        from urllib.parse import quote_plus

        signed_fields["passphrase"] = "sandbox-passphrase"
        api_parameter_string = "&".join(
            f"{key}={quote_plus(value)}"
            for key, value in sorted(signed_fields.items())
        )
        self.assertEqual(
            kwargs["headers"]["signature"],
            hashlib.md5(api_parameter_string.encode()).hexdigest(),
        )
        self.assertTrue(
            any('"cancellationRequestSentAt" = $1' in query for query, _ in db.executions)
        )
        due_query = next(query for query, _ in db.queries if 'SELECT "id" FROM "UserSubscription"' in query)
        self.assertIn('"currentPeriodStart" > "cancellationRequestedAt"', due_query)

    def test_cancellation_job_rejects_invalid_cron_secret(self):
        endpoint = self._endpoint(
            CancellationDatabase({}, due=True),
            "/api/v1/internal/payfast/cancellations/process",
            settings=self.cancellation_settings,
        )

        with self.assertRaises(HTTPException) as raised:
            asyncio.run(endpoint(request=_cron_request("wrong-secret")))

        self.assertEqual(raised.exception.status_code, 401)

    def test_checkout_reuses_the_existing_pending_session(self):
        db = FakeDatabase(
            checkout={
                "id": "existing-checkout",
                "plan": "starter",
                "billingInterval": "monthly",
                "amount": Decimal("29.00"),
            }
        )
        endpoint = self._endpoint(db, "/api/v1/billing/checkout")

        result = asyncio.run(
            endpoint(
                payload=SubscriptionCheckoutRequest(
                    plan="starter",
                    billingInterval="monthly",
                ),
                user_id="user-123",
            )
        )

        self.assertEqual(result["fields"]["m_payment_id"], "existing-checkout")
        self.assertEqual(db.executions, [])

    def test_checkout_rejects_reusing_a_pending_session_for_a_different_plan(self):
        db = FakeDatabase(
            checkout={
                "id": "existing-checkout",
                "plan": "starter",
                "billingInterval": "monthly",
                "amount": Decimal("29.00"),
            }
        )
        endpoint = self._endpoint(db, "/api/v1/billing/checkout")

        with self.assertRaises(HTTPException) as raised:
            asyncio.run(
                endpoint(
                    payload=SubscriptionCheckoutRequest(
                        plan="starter",
                        billingInterval="annual",
                    ),
                    user_id="user-123",
                )
            )

        self.assertEqual(raised.exception.status_code, 409)
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

        with self.assertLogs("api.routes.payfast", level="WARNING") as captured:
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(endpoint(request=request))

        self.assertEqual(raised.exception.status_code, 400)
        self.assertIn("signature mismatch", captured.output[0])

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
        notification_insert = next(
            query for query, _values in db.queries
            if 'INSERT INTO "PayfastNotification"' in query
        )
        self.assertIn("$6::numeric", notification_insert)

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

    def test_late_failure_does_not_downgrade_a_completed_payment(self):
        db = FakeDatabase(
            checkout={
                "id": "checkout-id",
                "userId": "user-123",
                "plan": "starter",
                "billingInterval": "monthly",
                "amount": Decimal("29.00"),
                "status": "COMPLETE",
                "providerSubscriptionId": "subscription-token",
            },
            subscription={
                "userId": "user-123",
                "plan": "starter",
                "billingInterval": "monthly",
                "status": "ACTIVE",
                "currentPeriodEnd": datetime.now(timezone.utc),
            },
            completed_event=True,
        )
        endpoint = self._endpoint(db, "/api/v1/billing/payfast/itn")
        request = _signed_itn(self.settings.passphrase, status="FAILED")

        with patch("api.routes.payfast.httpx.AsyncClient", _ValidatingClient):
            result = asyncio.run(endpoint(request=request))

        self.assertEqual(result, {"received": True, "duplicate": True})
        self.assertEqual(db.executions, [])

    def test_cancellation_notification_does_not_require_payment_amount_or_reference(self):
        db = FakeDatabase(
            subscription={
                "userId": "user-123",
                "plan": "starter",
                "billingInterval": "monthly",
                "status": "ACTIVE",
                "currentPeriodEnd": datetime(2030, 1, 1, tzinfo=timezone.utc),
            },
            completed_event=True,
        )
        endpoint = self._endpoint(db, "/api/v1/billing/payfast/itn")
        request = _cancellation_itn(self.settings.passphrase)

        with patch("api.routes.payfast.httpx.AsyncClient", _ValidatingClient):
            result = asyncio.run(endpoint(request=request))

        self.assertEqual(result, {"received": True, "duplicate": False})
        self.assertIn('"status" = $1', db.executions[0][0])
        self.assertIn('"cancellationRequestSentAt"', db.executions[0][0])
        self.assertIn("CANCELED", db.executions[0][1])
        notification_insert = next(
            values for query, values in db.queries
            if 'INSERT INTO "PayfastNotification"' in query
        )
        self.assertEqual(notification_insert[2], "subscription:subscription-token")
        self.assertIsNone(notification_insert[5])

    def test_renewal_notification_preserves_a_pending_cancellation_request(self):
        db = FakeDatabase(
            subscription={
                "userId": "user-123",
                "plan": "starter",
                "billingInterval": "monthly",
                "status": "ACTIVE",
                "currentPeriodEnd": datetime(2030, 1, 1, tzinfo=timezone.utc),
                "cancelAtPeriodEnd": True,
                "cancellationRequestedAt": datetime(2029, 12, 1, tzinfo=timezone.utc),
            }
        )
        endpoint = self._endpoint(db, "/api/v1/billing/payfast/itn")

        with patch("api.routes.payfast.httpx.AsyncClient", _ValidatingClient):
            result = asyncio.run(endpoint(request=_signed_itn(self.settings.passphrase)))

        self.assertEqual(result, {"received": True, "duplicate": False})
        renewal = next(query for query, _ in db.executions if 'INSERT INTO "UserSubscription"' in query)
        self.assertIn('"UserSubscription"."cancelAtPeriodEnd"', renewal)
        self.assertIn('"cancellationRequestedAt"', renewal)

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

    def test_signature_matches_php_urlencode_for_tilde_values(self):
        import hashlib

        expected = hashlib.md5(
            b"item_name=Job%7EHunter&passphrase=salt%7Evalue"
        ).hexdigest()

        self.assertEqual(
            _signature([("item_name", "Job~Hunter")], "salt~value"),
            expected,
        )

    def test_itn_signature_matches_payfast_notification_canonicalization(self):
        import hashlib

        fields = [
            ("merchant_id", "sandbox-merchant"),
            ("optional_field", ""),
            ("item_name", "Job Hunter"),
            ("signature", "provider-signature"),
            ("ignored_after_signature", "ignored"),
        ]
        expected = hashlib.md5(
            b"merchant_id=sandbox-merchant&optional_field=&item_name=Job+Hunter"
            b"&passphrase=salt%7Evalue"
        ).hexdigest()

        self.assertEqual(_itn_signature(fields, "salt~value"), expected)

    def test_signature_trims_values_and_passphrase_before_encoding(self):
        import hashlib

        expected = hashlib.md5(
            b"email_address=person%40example.com&passphrase=salt"
        ).hexdigest()

        self.assertEqual(
            _signature(
                [("email_address", " person@example.com "), ("empty", " ")],
                " salt ",
            ),
            expected,
        )

    def test_checkout_signature_uses_payfast_field_order_not_input_order(self):
        fields = [
            ("frequency", "6"),
            ("email_address", "person@example.com"),
            ("recurring_amount", "278.40"),
            ("merchant_id", "merchant"),
            ("subscription_type", "1"),
        ]
        reordered_fields = [
            ("merchant_id", "merchant"),
            ("email_address", "person@example.com"),
            ("subscription_type", "1"),
            ("recurring_amount", "278.40"),
            ("frequency", "6"),
        ]

        self.assertEqual(
            _checkout_signature(fields, "sandbox-passphrase"),
            _checkout_signature(reordered_fields, "sandbox-passphrase"),
        )

    def _endpoint(self, db, path, settings=None, method="POST"):
        router = create_payfast_router(
            db,
            _get_current_user,
            settings or self.settings,
            self.prices,
        )
        route = next(
            route
            for route in router.routes
            if isinstance(route, APIRoute)
            and route.path == path
            and method in route.methods
        )
        return route.endpoint


class CancellationDatabase:
    def __init__(self, subscription, *, due=False):
        self.subscription = subscription
        self.due = due
        self.queries = []
        self.executions = []

    async def query_raw(self, query, *values):
        self.queries.append((query, values))
        if 'SELECT "id" FROM "UserSubscription"' in query:
            return [{"id": self.subscription.get("id", "subscription-id")}] if self.due else []
        if '"provider", "providerSubscriptionId"' in query:
            return [self.subscription] if self.subscription else []
        if '"provider", "cancelAtPeriodEnd"' in query:
            return [self.subscription] if self.subscription else []
        if '"providerSubscriptionId", "cancellationAttemptCount"' in query:
            return [self.subscription] if self.subscription else []
        raise AssertionError(f"Unexpected query: {query}")

    async def execute_raw(self, query, *values):
        self.executions.append((query, values))

    @asynccontextmanager
    async def tx(self):
        yield self


class _SuccessfulCancellationClient:
    def __init__(self, **kwargs):
        self.kwargs = kwargs

    async def __aenter__(self):
        return self

    async def __aexit__(self, _exc_type, _exc_value, _traceback):
        return None

    async def put(self, url, **kwargs):
        self.put_request = (url, kwargs)
        return SimpleNamespace(status_code=200, raise_for_status=lambda: None)


class _ValidatingClient:
    def __init__(self, **kwargs):
        self.kwargs = kwargs

    async def __aenter__(self):
        return self

    async def __aexit__(self, _exc_type, _exc_value, _traceback):
        _ = (_exc_type, _exc_value, _traceback)
        return None

    async def post(self, url, *, content, headers):
        self.validation_request = (url, content, headers)
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


def _cron_request(secret="cron-secret"):
    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/internal/payfast/cancellations/process",
            "headers": [
                (b"x-payfast-cancellation-cron-secret", secret.encode()),
            ],
            "query_string": b"",
            "server": ("api.example.com", 443),
            "client": ("192.0.2.1", 12345),
            "scheme": "https",
            "http_version": "1.1",
        },
        receive,
    )


def _signed_itn(passphrase, *, amount="29.00", status="COMPLETE"):
    pairs = [
        ("merchant_id", "sandbox-merchant"),
        ("m_payment_id", "checkout-id"),
        ("pf_payment_id", "payment-id"),
        ("payment_status", status),
        ("amount_gross", amount),
        ("token", "subscription-token"),
    ]
    pairs.append(("signature", _itn_signature(pairs, passphrase)))
    return _request(urlencode(pairs).encode())


def _cancellation_itn(passphrase):
    pairs = [
        ("merchant_id", "sandbox-merchant"),
        ("pf_payment_id", "cancel-payment-id"),
        ("payment_status", "CANCELLED"),
        ("token", "subscription-token"),
    ]
    pairs.append(("signature", _itn_signature(pairs, passphrase)))
    return _request(urlencode(pairs).encode())


if __name__ == "__main__":
    unittest.main()
