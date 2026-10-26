import asyncio
import unittest

from fastapi import HTTPException

from api.routes.roadmaps import create_roadmaps_router
from api.schemas.roadmaps import ProjectProofUpdate


class RoadmapRouteTests(unittest.TestCase):
    def test_routes_keep_existing_paths_methods_and_order(self):
        router = create_roadmaps_router(None, self._get_current_user)

        routes = [(route.path, route.methods) for route in router.routes]

        self.assertEqual(
            routes,
            [
                ("/api/v1/roadmaps", {"GET"}),
                ("/api/v1/roadmaps/{roadmap_id}", {"DELETE"}),
                ("/api/v1/tasks/{task_id}", {"PATCH"}),
                ("/api/v1/projects/{project_id}/proof", {"GET"}),
                ("/api/v1/projects/{project_id}/proof", {"PATCH"}),
            ],
        )

    def test_project_proof_rejects_non_http_urls(self):
        router = create_roadmaps_router(None, self._get_current_user)
        endpoint = next(
            route.endpoint
            for route in router.routes
            if route.path == "/api/v1/projects/{project_id}/proof"
            and "PATCH" in route.methods
        )

        with self.assertRaises(HTTPException) as raised:
            asyncio.run(
                endpoint(
                    project_id="project-123",
                    payload=ProjectProofUpdate(
                        proofUrl="javascript:alert(1)",
                        proofNotes=None,
                    ),
                    user_id="user-123",
                )
            )

        self.assertEqual(raised.exception.status_code, 400)

    @staticmethod
    async def _get_current_user():
        return "user-123"


if __name__ == "__main__":
    unittest.main()
