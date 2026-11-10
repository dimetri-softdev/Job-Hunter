from typing import Any


def _build_projects(data: dict[str, Any], error_prefix: str) -> list[dict[str, Any]]:
    projects = data.get("projects")
    if not isinstance(projects, list) or not projects:
        raise ValueError(f"{error_prefix} must contain projects.")

    projects_to_create = []
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

    return projects_to_create


def build_roadmap_data(data: dict[str, Any], user_id: str) -> dict[str, Any]:
    readiness_score = int(data["readinessScore"])
    if not 0 <= readiness_score <= 100:
        raise ValueError("The generated readiness score must be between 0 and 100.")

    return {
        "title": str(data["title"]),
        "readinessScore": readiness_score,
        "userId": user_id,
        "projects": {"create": _build_projects(data, "The generated roadmap")},
    }


def build_roadmap_continuation(
    data: dict[str, Any], current_readiness_score: int
) -> dict[str, Any]:
    readiness_score = int(data["readinessScore"])
    if not 0 <= readiness_score <= 100:
        raise ValueError("The generated readiness score must be between 0 and 100.")

    return {
        "readinessScore": min(100, max(current_readiness_score + 1, readiness_score)),
        "projects": {"create": _build_projects(data, "The generated roadmap continuation")},
    }
