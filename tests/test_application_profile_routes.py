import asyncio
import unittest

from fastapi import HTTPException

from api.routes.application_profiles import (
    _sanitize_application_profile_payload,
    create_application_profiles_router,
)
from api.schemas.profiles import ApplicationProfileUpdate


class ApplicationProfileRouteTests(unittest.TestCase):
    def setUp(self):
        self.queries = []

        class Database:
            async def query_raw(inner_self, query, *values):
                self.queries.append((query, values))
                return []

            async def execute_raw(inner_self, query, *values):
                self.queries.append((query, values))
                return 1

        self.router = create_application_profiles_router(Database(), self._get_user)
        self.routes = {
            (route.path, method): route
            for route in self.router.routes
            for method in route.methods
        }

    def test_routes_keep_existing_paths_and_methods(self):
        self.assertEqual(
            [
                (route.path, route.methods)
                for route in self.router.routes
            ],
            [
                ("/api/v1/application-profile", {"GET"}),
                ("/api/v1/application-profile", {"PUT"}),
            ],
        )

    def test_get_returns_empty_profile_defaults(self):
        endpoint = self.routes[
            ("/api/v1/application-profile", "GET")
        ].endpoint

        result = asyncio.run(endpoint(user_id="user-123"))

        self.assertEqual(result["userId"], "user-123")
        self.assertIsNone(result["id"])
        self.assertFalse(result["privacyConsentAccepted"])
        self.assertEqual(result["workHistory"], [])
        self.assertEqual(result["education"], [])
        self.assertEqual(result["skills"], [])
        self.assertEqual(result["savedAnswers"], [])

    def test_update_requires_consent_before_database_access(self):
        route = self.routes[("/api/v1/application-profile", "PUT")]

        with self.assertRaises(HTTPException) as raised:
            asyncio.run(
                route.endpoint(
                    payload=ApplicationProfileUpdate(),
                    user_id="user-123",
                )
            )

        self.assertEqual(raised.exception.status_code, 400)
        self.assertEqual(self.queries, [])

    def test_sanitization_trims_values_and_hides_unconsented_fields(self):
        payload = ApplicationProfileUpdate(
            fullName="  Example Person  ",
            workAuthorization="Authorized",
            workAuthorizationConsent=False,
            salaryExpectation="120000",
            salaryExpectationConsent=False,
            eeoData={"veteranStatus": "yes"},
            eeoDataConsent=False,
        )

        result = _sanitize_application_profile_payload(payload)

        self.assertEqual(result["fullName"], "Example Person")
        self.assertIsNone(result["workAuthorization"])
        self.assertIsNone(result["salaryExpectation"])
        self.assertIsNone(result["eeoData"])

    @staticmethod
    async def _get_user():
        return "user-123"


if __name__ == "__main__":
    unittest.main()
