import asyncio
import unittest

from fastapi import HTTPException

from api.routes.profiles import create_profiles_router
from api.schemas.profiles import CareerProfileUpdate


class ProfileRouteTests(unittest.TestCase):
    def test_routes_keep_existing_paths_and_methods(self):
        router = create_profiles_router(None, self._get_current_user)

        routes = [(route.path, route.methods) for route in router.routes]

        self.assertEqual(
            routes,
            [
                ("/api/v1/career-profile", {"GET"}),
                ("/api/v1/career-profile", {"PUT"}),
            ],
        )

    def test_career_profile_update_rejects_invalid_work_arrangement(self):
        router = create_profiles_router(None, self._get_current_user)
        endpoint = next(
            route.endpoint
            for route in router.routes
            if route.path == "/api/v1/career-profile" and "PUT" in route.methods
        )

        with self.assertRaises(HTTPException) as raised:
            asyncio.run(
                endpoint(
                    payload=CareerProfileUpdate(workArrangement="Anywhere"),
                    user_id="user-123",
                )
            )

        self.assertEqual(raised.exception.status_code, 400)

    @staticmethod
    async def _get_current_user():
        return "user-123"


if __name__ == "__main__":
    unittest.main()
