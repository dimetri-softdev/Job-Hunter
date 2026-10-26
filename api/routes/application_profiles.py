import json
import uuid
from collections.abc import Awaitable, Callable
from typing import Any

from fastapi import APIRouter, Depends, HTTPException

from api.schemas.profiles import ApplicationProfileUpdate


def _sanitize_application_profile_payload(
    payload: ApplicationProfileUpdate,
) -> dict[str, Any]:
    data = payload.model_dump(exclude_none=False)
    for field in (
        "fullName",
        "email",
        "phone",
        "city",
        "state",
        "country",
        "postalCode",
        "addressLine1",
        "addressLine2",
        "linkedInUrl",
        "githubUrl",
        "portfolioUrl",
        "noticePeriod",
        "workAuthorization",
        "salaryExpectation",
    ):
        data[field] = (data.get(field) or "").strip() or None

    if not data.get("workAuthorizationConsent"):
        data["workAuthorization"] = None
    if not data.get("salaryExpectationConsent"):
        data["salaryExpectation"] = None
    if not data.get("eeoDataConsent"):
        data["eeoData"] = None

    return data


def create_application_profiles_router(
    db: Any,
    get_current_user: Callable[..., Awaitable[str]],
) -> APIRouter:
    router = APIRouter()

    async def load_application_profile(user_id: str) -> dict[str, Any]:
        profile_rows = await db.query_raw(
            'SELECT * FROM "ApplicationProfile" WHERE "userId" = $1',
            user_id,
        )
        if not profile_rows:
            return {
                "id": None,
                "userId": user_id,
                "fullName": None,
                "email": None,
                "phone": None,
                "city": None,
                "state": None,
                "country": None,
                "postalCode": None,
                "addressLine1": None,
                "addressLine2": None,
                "linkedInUrl": None,
                "githubUrl": None,
                "portfolioUrl": None,
                "noticePeriod": None,
                "workAuthorization": None,
                "salaryExpectation": None,
                "eeoData": None,
                "privacyConsentAccepted": False,
                "workAuthorizationConsent": False,
                "salaryExpectationConsent": False,
                "eeoDataConsent": False,
                "workHistory": [],
                "education": [],
                "skills": [],
                "savedAnswers": [],
            }

        profile = dict(profile_rows[0])
        if not profile.get("workAuthorizationConsent"):
            profile["workAuthorization"] = None
        if not profile.get("salaryExpectationConsent"):
            profile["salaryExpectation"] = None
        if not profile.get("eeoDataConsent"):
            profile["eeoData"] = None

        work_history = await db.query_raw(
            'SELECT * FROM "ApplicationProfileWorkHistoryEntry" '
            'WHERE "profileId" = $1 ORDER BY "createdAt" ASC',
            profile["id"],
        )
        education = await db.query_raw(
            'SELECT * FROM "ApplicationProfileEducationEntry" '
            'WHERE "profileId" = $1 ORDER BY "createdAt" ASC',
            profile["id"],
        )
        skills = await db.query_raw(
            'SELECT * FROM "ApplicationProfileSkill" '
            'WHERE "profileId" = $1 ORDER BY "createdAt" ASC',
            profile["id"],
        )
        answers = await db.query_raw(
            'SELECT * FROM "ApplicationProfileAnswer" '
            'WHERE "profileId" = $1 ORDER BY "createdAt" ASC',
            profile["id"],
        )

        return {
            **profile,
            "workHistory": [dict(row) for row in work_history],
            "education": [dict(row) for row in education],
            "skills": [dict(row) for row in skills],
            "savedAnswers": [dict(row) for row in answers],
        }

    @router.get("/api/v1/application-profile")
    async def get_application_profile(
        user_id: str = Depends(get_current_user),
    ) -> dict[str, Any]:
        return await load_application_profile(user_id)

    @router.put("/api/v1/application-profile")
    async def update_application_profile(
        payload: ApplicationProfileUpdate,
        user_id: str = Depends(get_current_user),
    ) -> dict[str, Any]:
        if not payload.privacyConsentAccepted:
            raise HTTPException(
                status_code=400,
                detail="Confirm the application-profile consent text before saving or using your autofill profile.",
            )

        data = _sanitize_application_profile_payload(payload)
        existing = await db.query_raw(
            'SELECT "id" FROM "ApplicationProfile" WHERE "userId" = $1',
            user_id,
        )
        profile_id = existing[0]["id"] if existing else str(uuid.uuid4())

        if existing:
            await db.execute_raw(
                'UPDATE "ApplicationProfile" SET "fullName" = $1, "email" = $2, "phone" = $3, '
                '"city" = $4, "state" = $5, "country" = $6, "postalCode" = $7, '
                '"addressLine1" = $8, "addressLine2" = $9, "linkedInUrl" = $10, '
                '"githubUrl" = $11, "portfolioUrl" = $12, "noticePeriod" = $13, '
                '"workAuthorization" = $14, "salaryExpectation" = $15, "eeoData" = $16::jsonb, '
                '"privacyConsentAccepted" = $17, "workAuthorizationConsent" = $18, '
                '"salaryExpectationConsent" = $19, "eeoDataConsent" = $20, "updatedAt" = NOW() '
                'WHERE "id" = $21 AND "userId" = $22',
                data["fullName"],
                data["email"],
                data["phone"],
                data["city"],
                data["state"],
                data["country"],
                data["postalCode"],
                data["addressLine1"],
                data["addressLine2"],
                data["linkedInUrl"],
                data["githubUrl"],
                data["portfolioUrl"],
                data["noticePeriod"],
                data["workAuthorization"],
                data["salaryExpectation"],
                json.dumps(data["eeoData"]) if data.get("eeoData") is not None else None,
                data["privacyConsentAccepted"],
                data["workAuthorizationConsent"],
                data["salaryExpectationConsent"],
                data["eeoDataConsent"],
                profile_id,
                user_id,
            )
        else:
            await db.execute_raw(
                'INSERT INTO "ApplicationProfile" ("id", "userId", "fullName", "email", "phone", "city", '
                '"state", "country", "postalCode", "addressLine1", "addressLine2", "linkedInUrl", '
                '"githubUrl", "portfolioUrl", "noticePeriod", "workAuthorization", "salaryExpectation", '
                '"eeoData", "privacyConsentAccepted", "workAuthorizationConsent", '
                '"salaryExpectationConsent", "eeoDataConsent", "createdAt", "updatedAt") '
                'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18::jsonb, '
                '$19, $20, $21, $22, NOW(), NOW())',
                profile_id,
                user_id,
                data["fullName"],
                data["email"],
                data["phone"],
                data["city"],
                data["state"],
                data["country"],
                data["postalCode"],
                data["addressLine1"],
                data["addressLine2"],
                data["linkedInUrl"],
                data["githubUrl"],
                data["portfolioUrl"],
                data["noticePeriod"],
                data["workAuthorization"],
                data["salaryExpectation"],
                json.dumps(data["eeoData"]) if data.get("eeoData") is not None else None,
                data["privacyConsentAccepted"],
                data["workAuthorizationConsent"],
                data["salaryExpectationConsent"],
                data["eeoDataConsent"],
            )

        for table in (
            "ApplicationProfileWorkHistoryEntry",
            "ApplicationProfileEducationEntry",
            "ApplicationProfileSkill",
            "ApplicationProfileAnswer",
        ):
            await db.execute_raw(
                f'DELETE FROM "{table}" WHERE "profileId" = $1',
                profile_id,
            )

        for item in payload.workHistory:
            await db.execute_raw(
                'INSERT INTO "ApplicationProfileWorkHistoryEntry" '
                '("id", "profileId", "company", "title", "location", "startDate", "endDate", '
                '"isCurrent", "description", "createdAt", "updatedAt") '
                'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())',
                str(uuid.uuid4()),
                profile_id,
                item.company.strip() if item.company else None,
                item.title.strip() if item.title else None,
                item.location.strip() if item.location else None,
                item.startDate.strip() if item.startDate else None,
                item.endDate.strip() if item.endDate else None,
                item.isCurrent,
                item.description.strip() if item.description else None,
            )

        for item in payload.education:
            await db.execute_raw(
                'INSERT INTO "ApplicationProfileEducationEntry" '
                '("id", "profileId", "school", "degree", "fieldOfStudy", "startDate", '
                '"endDate", "location", "description", "createdAt", "updatedAt") '
                'VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())',
                str(uuid.uuid4()),
                profile_id,
                item.school.strip() if item.school else None,
                item.degree.strip() if item.degree else None,
                item.fieldOfStudy.strip() if item.fieldOfStudy else None,
                item.startDate.strip() if item.startDate else None,
                item.endDate.strip() if item.endDate else None,
                item.location.strip() if item.location else None,
                item.description.strip() if item.description else None,
            )

        for item in payload.skills:
            await db.execute_raw(
                'INSERT INTO "ApplicationProfileSkill" '
                '("id", "profileId", "name", "category", "proficiency", "createdAt") '
                'VALUES ($1, $2, $3, $4, $5, NOW())',
                str(uuid.uuid4()),
                profile_id,
                item.name.strip(),
                item.category.strip() if item.category else None,
                item.proficiency.strip() if item.proficiency else None,
            )

        for item in payload.savedAnswers:
            if not item.answerText.strip():
                continue
            await db.execute_raw(
                'INSERT INTO "ApplicationProfileAnswer" '
                '("id", "profileId", "questionKey", "answerText", "isSensitive", "consentGiven", '
                '"createdAt", "updatedAt") VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())',
                str(uuid.uuid4()),
                profile_id,
                item.questionKey.strip(),
                item.answerText.strip(),
                bool(item.isSensitive),
                bool(item.consentGiven),
            )

        return await load_application_profile(user_id)

    return router
