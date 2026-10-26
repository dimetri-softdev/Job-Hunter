import unittest

from api.services.roadmaps import build_roadmap_data


class BuildRoadmapDataTests(unittest.TestCase):
    def test_builds_nested_prisma_create_payload(self):
        result = build_roadmap_data(
            {
                "title": "Backend Engineer",
                "readinessScore": "72",
                "projects": [
                    {
                        "title": "API project",
                        "description": "Build an API",
                        "level": "Intermediate",
                        "tasks": ["Design endpoints", "Add tests"],
                    }
                ],
            },
            user_id="user-123",
        )

        self.assertEqual(result["title"], "Backend Engineer")
        self.assertEqual(result["readinessScore"], 72)
        self.assertEqual(result["userId"], "user-123")
        self.assertEqual(
            result["projects"]["create"][0]["tasks"]["create"],
            [
                {"label": "Design endpoints", "completed": False},
                {"label": "Add tests", "completed": False},
            ],
        )

    def test_rejects_roadmaps_without_projects(self):
        with self.assertRaisesRegex(ValueError, "must contain projects"):
            build_roadmap_data(
                {"title": "Empty roadmap", "readinessScore": 50, "projects": []},
                user_id="user-123",
            )

    def test_rejects_readiness_scores_outside_range(self):
        with self.assertRaisesRegex(ValueError, "between 0 and 100"):
            build_roadmap_data(
                {"title": "Roadmap", "readinessScore": 101, "projects": [{"tasks": []}]},
                user_id="user-123",
            )

    def test_rejects_projects_without_task_lists(self):
        with self.assertRaisesRegex(ValueError, "must include a task list"):
            build_roadmap_data(
                {
                    "title": "Roadmap",
                    "readinessScore": 50,
                    "projects": [{"title": "Project"}],
                },
                user_id="user-123",
            )


if __name__ == "__main__":
    unittest.main()
