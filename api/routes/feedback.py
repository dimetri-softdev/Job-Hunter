import json
import uuid
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from api.schemas.feedback import PeerFeedbackRequest


def create_feedback_router(
    db: Any,
    get_current_user: Callable[..., Awaitable[str]],
) -> APIRouter:
    router = APIRouter()

    @router.post("/api/v1/feedback")
    async def submit_peer_feedback(
        payload: PeerFeedbackRequest,
        user_id: str = Depends(get_current_user),
    ):
        feature_keys = [item.feature for item in payload.featureRatings]
        if len(feature_keys) != len(set(feature_keys)):
            raise HTTPException(
                status_code=400,
                detail="Rate each selected feature only once.",
            )

        response_id = str(uuid.uuid4())
        await db.execute_raw(
            'INSERT INTO "FeedbackResponse" ("id", "answers") VALUES ($1, $2::jsonb)',
            response_id,
            json.dumps(payload.model_dump()),
        )
        return {"submitted": True}

    return router
