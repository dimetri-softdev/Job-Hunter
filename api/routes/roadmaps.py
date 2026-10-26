from collections.abc import Awaitable, Callable
from typing import Any
from urllib.parse import urlparse

from fastapi import APIRouter, Depends, HTTPException

from api.schemas.roadmaps import ProjectProofUpdate, TaskUpdate


def create_roadmaps_router(
    db: Any,
    get_current_user: Callable[..., Awaitable[str]],
) -> APIRouter:
    router = APIRouter()

    @router.get("/api/v1/roadmaps")
    async def get_roadmaps(user_id: str = Depends(get_current_user)):
        return await db.roadmap.find_many(
            where={"userId": user_id},
            include={
                "projects": {
                    "include": {
                        "tasks": True,
                    }
                }
            },
        )

    @router.delete("/api/v1/roadmaps/{roadmap_id}")
    async def delete_roadmap(
        roadmap_id: str,
        user_id: str = Depends(get_current_user),
    ):
        deleted = await db.query_raw(
            'DELETE FROM "Roadmap" WHERE "id" = $1 AND "userId" = $2 RETURNING "id"',
            roadmap_id,
            user_id,
        )
        if not deleted:
            raise HTTPException(status_code=404, detail="Roadmap not found.")
        return {"id": roadmap_id, "deleted": True}

    @router.patch("/api/v1/tasks/{task_id}")
    async def update_task_status(
        task_id: str,
        payload: TaskUpdate,
        user_id: str = Depends(get_current_user),
    ):
        task = await db.task.find_unique(
            where={"id": task_id},
            include={"projectTrack": {"include": {"roadmap": True}}},
        )
        if (
            not task
            or not task.projectTrack
            or not task.projectTrack.roadmap
            or task.projectTrack.roadmap.userId != user_id
        ):
            raise HTTPException(status_code=404, detail="Task not found")

        updated_task = await db.task.update(
            where={"id": task_id},
            data={"completed": payload.completed},
        )
        return {"status": "success", "task": updated_task}

    @router.get("/api/v1/projects/{project_id}/proof")
    async def get_project_proof(
        project_id: str,
        user_id: str = Depends(get_current_user),
    ):
        proof = await db.query_raw(
            'SELECT p."proofUrl", p."proofNotes" FROM "ProjectTrack" p '
            'JOIN "Roadmap" r ON r."id" = p."roadmapId" '
            'WHERE p."id" = $1 AND r."userId" = $2',
            project_id,
            user_id,
        )
        if not proof:
            raise HTTPException(status_code=404, detail="Project not found.")
        return proof[0]

    @router.patch("/api/v1/projects/{project_id}/proof")
    async def update_project_proof(
        project_id: str,
        payload: ProjectProofUpdate,
        user_id: str = Depends(get_current_user),
    ):
        proof_url = (
            payload.proofUrl.strip()
            if payload.proofUrl and payload.proofUrl.strip()
            else None
        )
        if proof_url:
            parsed_url = urlparse(proof_url)
            if parsed_url.scheme not in {"http", "https"} or not parsed_url.netloc:
                raise HTTPException(
                    status_code=400,
                    detail="Proof URL must be a valid HTTP or HTTPS link.",
                )

        updated = await db.query_raw(
            'UPDATE "ProjectTrack" p SET "proofUrl" = $1, "proofNotes" = $2 '
            'FROM "Roadmap" r WHERE p."id" = $3 AND p."roadmapId" = r."id" '
            'AND r."userId" = $4 RETURNING p."proofUrl", p."proofNotes"',
            proof_url,
            payload.proofNotes.strip()
            if payload.proofNotes and payload.proofNotes.strip()
            else None,
            project_id,
            user_id,
        )
        if not updated:
            raise HTTPException(status_code=404, detail="Project not found.")
        return updated[0]

    return router
