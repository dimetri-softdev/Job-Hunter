from collections.abc import Awaitable, Callable
from typing import Any, Optional

from fastapi import APIRouter, Depends, HTTPException


def create_identity_router(
    db: Any,
    get_current_user: Callable[..., Awaitable[str]],
    supabase_url: Optional[str],
    supabase_anon_key: Optional[str],
) -> APIRouter:
    router = APIRouter()

    @router.get("/api/v1/extension/config")
    async def get_extension_client_config():
        if not supabase_url or not supabase_anon_key:
            raise HTTPException(status_code=503, detail="Authentication is not configured.")
        return {
            "supabaseUrl": supabase_url.rstrip("/"),
            "supabaseAnonKey": supabase_anon_key,
        }

    @router.get("/api/v1/user")
    async def get_user_profile(user_id: str = Depends(get_current_user)):
        user = await db.user.find_unique(where={"id": user_id})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        return user

    return router
