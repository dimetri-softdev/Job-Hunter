import asyncio
import unittest
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import main
from starlette.requests import Request


class _BillingDatabase:
    def __init__(self, subscription, admin_ids=None):
        self.subscription = subscription
        self.admin_ids = set(admin_ids or [])
        self.queries = []
        self.executions = []

    @asynccontextmanager
    async def tx(self):
        yield self

    async def query_raw(self, query, *values):
        self.queries.append(query)
        if 'FROM "AdminAccess"' in query:
            return [{"userId": user_id} for user_id in values if user_id in self.admin_ids]
        if 'FROM "UserSubscription"' in query:
            return [self.subscription] if self.subscription else []
        if 'COUNT(*)' in query:
            return [{"feature": "job_fit", "used": 0}]
        return []

    async def execute_raw(self, query, *values):
        self.executions.append((query, values))


class BillingPlanTests(unittest.TestCase):
    def test_raw_iso_subscription_dates_preserve_active_billing_status(self):
        period_start = datetime.now(timezone.utc).replace(microsecond=0)
        period_end = period_start + timedelta(days=30)
        db = _BillingDatabase(
            {
                "plan": "standard",
                "status": "ACTIVE",
                "provider": "payfast",
                "providerEnvironment": "live",
                "billingInterval": "monthly",
                "currentPeriodStart": period_start.isoformat().replace("+00:00", "Z"),
                "currentPeriodEnd": period_end.isoformat().replace("+00:00", "Z"),
            }
        )
        live_settings = main.PayFastSettings(
            mode="live",
            merchant_id="live-merchant",
            merchant_key="live-key",
            passphrase="live-passphrase",
            return_url="https://app.example.com/return",
            cancel_url="https://app.example.com/cancel",
            notify_url="https://api.example.com/itn",
        )

        with patch.object(main, "db", db), patch.object(
            main, "PAYFAST_SETTINGS", live_settings
        ):
            with patch.object(main, "billing_is_enabled", AsyncMock(return_value=True)):
                result = asyncio.run(
                    main.get_billing_status(request=_request(), user_id="user-123")
                )

        self.assertEqual(result["status"], "ACTIVE")
        self.assertFalse(result["isAdmin"])
        self.assertEqual(result["checkoutMode"], "live")
        self.assertEqual(
            datetime.fromisoformat(result["currentPeriodStart"]),
            period_start,
        )
        self.assertEqual(
            datetime.fromisoformat(result["currentPeriodEnd"]),
            period_end,
        )
        self.assertTrue(result["features"]["job_fit"]["available"])

    def test_sandbox_subscription_does_not_grant_live_entitlement(self):
        db = _BillingDatabase(
            {
                "plan": "standard",
                "status": "ACTIVE",
                "provider": "payfast",
                "providerEnvironment": "sandbox",
                "currentPeriodEnd": datetime.now(timezone.utc) + timedelta(days=30),
            }
        )
        request = _request()
        live_settings = main.PayFastSettings(
            mode="live",
            merchant_id="live-merchant",
            merchant_key="live-key",
            passphrase="live-passphrase",
            return_url="https://app.example.com/return",
            cancel_url="https://app.example.com/cancel",
            notify_url="https://api.example.com/itn",
        )

        with patch.object(main, "db", db), patch.object(
            main, "PAYFAST_SETTINGS", live_settings
        ), patch.object(main, "billing_is_enabled", AsyncMock(return_value=True)):
            account_access = asyncio.run(
                main.require_billing_account_access(request, "user-123")
            )
            usage = asyncio.run(
                main.reserve_billing_usage(request, "user-123", "job_fit")
            )
            status = asyncio.run(
                main.get_billing_status(request=request, user_id="user-123")
            )

        self.assertIsNone(account_access)
        self.assertEqual(usage, {"plan": "basic", "used": 1, "limit": 5})
        self.assertEqual(status["status"], "ENVIRONMENT_MISMATCH")
        self.assertEqual(status["plan"], "basic")
        self.assertEqual(status["providerEnvironment"], "sandbox")
        self.assertTrue(status["features"]["job_fit"]["available"])
        self.assertFalse(status["features"]["role_suggestions"]["available"])

    def test_feature_floors_include_starter_and_lite_tiers(self):
        self.assertTrue(main._feature_available("starter", "job_fit"))
        self.assertFalse(main._feature_available("starter", "role_suggestions"))
        self.assertTrue(main._feature_available("lite", "resume_updates"))
        self.assertTrue(main._feature_available("premium", "resume_updates"))

    def test_starter_increases_core_allowances_over_basic(self):
        self.assertEqual(main.BILLING_PLANS["starter"]["job_fit"], 10)
        self.assertEqual(main.BILLING_PLANS["starter"]["roadmap_generation"], 4)
        self.assertEqual(main.BILLING_PLANS["starter"]["assistant_chat"], 50)
        for feature in ("job_fit", "roadmap_generation", "assistant_chat"):
            self.assertGreater(
                main.BILLING_PLANS["starter"][feature],
                main.BILLING_PLANS["basic"][feature],
            )

    def test_premium_usage_is_recorded_without_a_monthly_count_limit(self):
        db = _BillingDatabase(
            {
                "plan": "premium",
                "status": "ACTIVE",
                "currentPeriodEnd": datetime.now(timezone.utc) + timedelta(days=30),
            }
        )
        request = _request()

        with patch.object(main, "db", db):
            with patch.object(
                main,
                "billing_is_enabled",
                AsyncMock(return_value=True),
            ):
                result = asyncio.run(
                    main.reserve_billing_usage(request, "user-123", "job_fit")
                )

        if result is None:
            self.fail("Premium usage should be reserved while billing is enabled.")
        self.assertIsNone(result["limit"])
        self.assertFalse(any("COUNT(*)" in query for query in db.queries))
        self.assertEqual(len(db.executions), 1)

    def test_no_subscription_uses_free_basic_monthly_allowance(self):
        db = _BillingDatabase(subscription=None)
        request = _request()

        with patch.object(main, "db", db):
            with patch.object(
                main,
                "billing_is_enabled",
                AsyncMock(return_value=True),
            ):
                result = asyncio.run(
                    main.reserve_billing_usage(request, "user-123", "job_fit")
                )

        if result is None:
            self.fail("Basic usage should be reserved while billing is enabled.")
        self.assertEqual(result, {"plan": "basic", "used": 1, "limit": 5})
        self.assertTrue(any("COUNT(*)" in query for query in db.queries))

    def test_environment_admin_has_unlimited_billing_status_without_subscription(self):
        db = _BillingDatabase(subscription=None)
        request = _request()
        request.state.billing_user_email = "Admin@Example.com"

        with patch.object(main, "db", db), patch.dict(
            "os.environ", {"ADMIN_EMAILS": "admin@example.com,owner@example.com"}
        ):
            with patch.object(main, "billing_is_enabled", AsyncMock(return_value=True)):
                result = asyncio.run(
                    main.get_billing_status(request=request, user_id="admin-user")
                )

        self.assertTrue(result["isAdmin"])
        self.assertEqual(result["status"], "ADMIN")
        self.assertIsNone(result["plan"])
        self.assertTrue(all(feature["available"] for feature in result["features"].values()))
        self.assertTrue(all(feature["included"] for feature in result["features"].values()))
        self.assertTrue(all(feature["limit"] is None for feature in result["features"].values()))
        self.assertFalse(any('FROM "AdminAccess"' in query for query in db.queries))

    def test_database_admin_bypasses_feature_and_assistant_limits(self):
        db = _BillingDatabase(
            subscription={
                "plan": "basic",
                "status": "CANCELED",
                "currentPeriodEnd": datetime.now(timezone.utc) - timedelta(days=1),
            },
            admin_ids={"admin-user"},
        )
        request = _request()

        with patch.object(main, "db", db), patch.object(
            main, "billing_is_enabled", AsyncMock(return_value=True)
        ):
            self.assertTrue(
                asyncio.run(main.is_admin_user(request, "admin-user"))
            )
            result = asyncio.run(
                main.reserve_billing_usage(request, "admin-user", "job_fit")
            )
            daily_event_id = asyncio.run(
                main.reserve_assistant_daily_usage("admin-user", request)
            )
            account_access = asyncio.run(
                main.require_billing_account_access(request, "admin-user")
            )

        if result is None:
            self.fail("Admin usage should be reserved while billing is enabled.")
        self.assertEqual(result["plan"], "premium")
        self.assertIsNone(result["limit"])
        self.assertIsNone(daily_event_id)
        self.assertIsNone(account_access)
        self.assertFalse(any("COUNT(*)" in query for query in db.queries))
        self.assertEqual(len(db.executions), 1)


def _request():
    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/test",
            "headers": [],
            "query_string": b"",
            "server": ("test", 80),
            "client": ("127.0.0.1", 12345),
            "scheme": "http",
            "http_version": "1.1",
        },
        receive,
    )


if __name__ == "__main__":
    unittest.main()
