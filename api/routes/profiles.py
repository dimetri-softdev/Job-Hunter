from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from api.schemas.profiles import CareerProfileUpdate


def create_profiles_router(
    db: Any,
    get_current_user: Callable[..., Awaitable[str]],
) -> APIRouter:
    router = APIRouter()

    async def load_career_profile(user_id: str):
        profiles = await db.query_raw(
            'SELECT "careerSummary", "skills", "workHistory", "education", "accomplishments", '
            '"experienceLevel", "targetRoles", '
            '"preferredLocation", "workArrangement" FROM "User" WHERE "id" = $1',
            user_id,
        )
        if not profiles:
            raise HTTPException(status_code=404, detail="Career profile not found.")
        return profiles[0]

    @router.get("/api/v1/career-profile")
    async def get_career_profile(user_id: str = Depends(get_current_user)):
        return await load_career_profile(user_id)

    @router.put("/api/v1/career-profile")
    async def update_career_profile(
        payload: CareerProfileUpdate,
        user_id: str = Depends(get_current_user),
    ):
        allowed_levels = {
            "Student",
            "Entry level",
            "Junior",
            "Mid-level",
            "Senior",
            "Career changer",
        }
        allowed_arrangements = {"Any", "Remote", "Hybrid", "On-site"}
        experience_level = payload.experienceLevel.strip() or None
        work_arrangement = payload.workArrangement.strip() or "Any"
        if experience_level and experience_level not in allowed_levels:
            raise HTTPException(status_code=400, detail="Choose a valid experience level.")
        if work_arrangement not in allowed_arrangements:
            raise HTTPException(status_code=400, detail="Choose a valid work arrangement.")

        updated = await db.execute_raw(
            'UPDATE "User" SET "careerSummary" = $1, "skills" = $2, "experienceLevel" = $3, '
            '"workHistory" = $4, "education" = $5, "accomplishments" = $6, '
            '"targetRoles" = $7, "preferredLocation" = $8, "workArrangement" = $9 WHERE "id" = $10',
            payload.careerSummary.strip() or None,
            payload.skills.strip() or None,
            experience_level,
            payload.workHistory.strip() or None,
            payload.education.strip() or None,
            payload.accomplishments.strip() or None,
            payload.targetRoles.strip() or None,
            payload.preferredLocation.strip() or None,
            work_arrangement,
            user_id,
        )
        if updated != 1:
            raise HTTPException(status_code=404, detail="User not found.")
        return await load_career_profile(user_id)

    return router
