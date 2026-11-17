import unittest
import sys
import types
from unittest.mock import AsyncMock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient

if "main" in sys.modules:
    import main
else:
    prisma_stub = types.ModuleType("prisma")
    prisma_stub.Prisma = type("Prisma", (), {})
    with patch.dict(sys.modules, {"prisma": prisma_stub}):
        import main


class CorsMiddlewareTests(unittest.TestCase):
    def test_cors_headers_are_added_to_early_write_auth_errors(self):
        frontend_origin = "https://job-hunter-nmln.onrender.com"
        with patch.object(
            main, "billing_is_enabled", AsyncMock(return_value=True)
        ), patch.object(
            main,
            "get_current_user",
            AsyncMock(
                side_effect=HTTPException(
                    status_code=401,
                    detail="Authentication required.",
                )
            ),
        ):
            response = TestClient(main.app).post(
                "/api/v1/applications/match",
                headers={"Origin": frontend_origin},
            )

        self.assertEqual(response.status_code, 401)
        self.assertEqual(
            response.headers.get("access-control-allow-origin"),
            frontend_origin,
        )


if __name__ == "__main__":
    unittest.main()
