import asyncio
import unittest
from contextlib import asynccontextmanager
from datetime import datetime, timedelta, timezone
from unittest.mock import AsyncMock, patch

import main
from starlette.requests import Request


class _BillingDatabase:
    def __init__(self, subscription):
        self.subscription = subscription
        self.queries = []
        self.executions = []

    @asynccontextmanager
    async def tx(self):
        yield self

    async def query_raw(self, query, *values):
        self.queries.append(query)
        if 'FROM "UserSubscription"' in query:
            return [self.subscription] if self.subscription else []
        if 'COUNT(*)' in query:
            return [{"used": 0}]
        return []

    async def execute_raw(self, query, *values):
        self.executions.append((query, values))


class BillingPlanTests(unittest.TestCase):
    def test_feature_floors_include_starter_and_lite_tiers(self):
        self.assertTrue(main._feature_available("starter", "job_fit"))
        self.assertFalse(main._feature_available("starter", "role_suggestions"))
        self.assertTrue(main._feature_available("lite", "resume_updates"))
        self.assertTrue(main._feature_available("premium", "resume_updates"))

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
