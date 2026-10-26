import asyncio
import json
import unittest

from fastapi import HTTPException

from api.routes.feedback import create_feedback_router
from api.schemas.feedback import PeerFeedbackRequest


class FeedbackRouteTests(unittest.TestCase):
    def setUp(self):
        self.inserted = []

        class Database:
            async def execute_raw(inner_self, query, *values):
                self.inserted.append((query, values))

        self.router = create_feedback_router(Database(), self._get_current_user)
        self.endpoint = next(
            route.endpoint for route in self.router.routes if route.path == "/api/v1/feedback"
        )

    def test_route_keeps_existing_path_and_method(self):
        self.assertEqual(
            [(route.path, route.methods) for route in self.router.routes],
            [("/api/v1/feedback", {"POST"})],
        )

    def test_duplicate_feature_ratings_are_rejected_without_storage(self):
        payload = self._payload(
            [
                {"feature": "job_fit", "usefulness": 4},
                {"feature": "job_fit", "usefulness": 5},
            ]
        )

        with self.assertRaises(HTTPException) as raised:
            asyncio.run(self.endpoint(payload=payload, user_id="user-123"))

        self.assertEqual(raised.exception.status_code, 400)
        self.assertEqual(self.inserted, [])

    def test_valid_feedback_is_stored_without_account_identity(self):
        payload = self._payload(
            [
                {"feature": "job_fit", "usefulness": 4},
                {"feature": "roadmaps", "usefulness": 5},
            ]
        )

        result = asyncio.run(self.endpoint(payload=payload, user_id="user-123"))

        self.assertEqual(result, {"submitted": True})
        self.assertEqual(len(self.inserted), 1)
        query, values = self.inserted[0]
        self.assertIn('"FeedbackResponse"', query)
        self.assertEqual(len(values[0]), 36)
        answers = json.loads(values[1])
        self.assertEqual(answers["overallRating"], 5)
        self.assertNotIn("userId", answers)

    @staticmethod
    def _payload(feature_ratings):
        return PeerFeedbackRequest(
            overallRating=5,
            featureRatings=feature_ratings,
            needsImprovement="not_sure",
            wouldPay="not_sure",
        )

    @staticmethod
    async def _get_current_user():
        return "user-123"


if __name__ == "__main__":
    unittest.main()
