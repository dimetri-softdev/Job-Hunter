from typing import Any


def build_roadmap_data(data: dict[str, Any], user_id: str) -> dict[str, Any]:
    projects_to_create = []
    projects = data.get("projects")
    if not isinstance(projects, list) or not projects:
        raise ValueError("The generated roadmap must contain projects.")

    readiness_score = int(data["readinessScore"])
    if not 0 <= readiness_score <= 100:
        raise ValueError("The generated readiness score must be between 0 and 100.")

    for project in projects:
        if not isinstance(project, dict) or not isinstance(project.get("tasks"), list):
            raise ValueError("Each generated project must include a task list.")

        tasks_to_create = [
            {"label": str(task), "completed": False}
            for task in project["tasks"]
        ]
        projects_to_create.append({
            "title": str(project["title"]),
            "description": str(project["description"]),
            "level": str(project["level"]),
            "tasks": {"create": tasks_to_create},
        })

    return {
        "title": str(data["title"]),
        "readinessScore": readiness_score,
        "userId": user_id,
        "projects": {"create": projects_to_create},
    }
