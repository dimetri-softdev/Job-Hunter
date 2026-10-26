import asyncio
import unittest
from types import SimpleNamespace

from fastapi import HTTPException

from api.routes.identity import create_identity_router


class IdentityRouteTests(unittest.TestCase):
    def test_routes_keep_the_existing_paths_and_methods(self):
        router = create_identity_router(
            db=None,
            get_current_user=self._get_current_user,
            supabase_url="https://example.supabase.co",
            supabase_anon_key="public-anon-key",
        )

        routes = [(route.path, route.methods) for route in router.routes]

        self.assertEqual(
            routes,
            [
                ("/api/v1/extension/config", {"GET"}),
                ("/api/v1/user", {"GET"}),
            ],
        )

    def test_extension_config_requires_authentication_configuration(self):
        router = create_identity_router(
            db=None,
            get_current_user=self._get_current_user,
            supabase_url=None,
            supabase_anon_key=None,
        )
        endpoint = next(
            route.endpoint
            for route in router.routes
            if route.path == "/api/v1/extension/config"
        )

        with self.assertRaises(HTTPException) as raised:
            asyncio.run(endpoint())

        self.assertEqual(raised.exception.status_code, 503)

    def test_extension_config_exposes_only_public_client_settings(self):
        router = create_identity_router(
            db=None,
            get_current_user=self._get_current_user,
            supabase_url="https://example.supabase.co/",
            supabase_anon_key="public-anon-key",
        )
        endpoint = next(
            route.endpoint
            for route in router.routes
            if route.path == "/api/v1/extension/config"
        )

        result = asyncio.run(endpoint())

        self.assertEqual(
            result,
            {
                "supabaseUrl": "https://example.supabase.co",
                "supabaseAnonKey": "public-anon-key",
            },
        )

    def test_user_route_looks_up_the_authenticated_user(self):
        expected_user = {"id": "user-123", "email": "person@example.com"}

        class UserRepository:
            async def find_unique(self, *, where):
                self.where = where
                return expected_user

        repository = UserRepository()
        router = create_identity_router(
            db=SimpleNamespace(user=repository),
            get_current_user=self._get_current_user,
            supabase_url="https://example.supabase.co",
            supabase_anon_key="public-anon-key",
        )
        endpoint = next(
            route.endpoint for route in router.routes if route.path == "/api/v1/user"
        )

        result = asyncio.run(endpoint(user_id="user-123"))

        self.assertIs(result, expected_user)
        self.assertEqual(repository.where, {"id": "user-123"})

    @staticmethod
    async def _get_current_user():
        return "user-123"


if __name__ == "__main__":
    unittest.main()
