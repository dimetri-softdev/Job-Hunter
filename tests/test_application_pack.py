import asyncio
import importlib
import json
import sys
import types
import unittest
from types import SimpleNamespace
from unittest.mock import AsyncMock, patch

import httpx
from fastapi import HTTPException
from groq import BadRequestError

from api.schemas.assistant import ApplicationPackRequest


prisma_module = types.ModuleType("prisma")
prisma_module.Prisma = lambda: object()
with patch.dict(sys.modules, {"prisma": prisma_module}):
    main = importlib.import_module("main")


class ApplicationPackRouteTests(unittest.TestCase):
    def test_retries_json_validation_failure_without_constrained_format(self):
        class Database:
            async def query_raw(self, query, *values):
                if 'FROM "Application"' in query:
                    return [
                        {
                            "company": "Example Co",
                            "position": "Engineer",
                            "jobUrl": "https://example.com/job",
                            "jobDescription": "Build software with Python.",
                            "jobSummary": "",
                        }
                    ]
                return [
                    {
                        "careerSummary": "Software engineer",
                        "skills": "Python",
                        "workHistory": None,
                        "education": None,
                        "accomplishments": None,
                        "experienceLevel": None,
                        "targetRoles": None,
                    }
                ]

        calls = []

        def create_completion(**kwargs):
            calls.append(kwargs)
            if len(calls) == 1:
                raise BadRequestError(
                    "JSON validation failed",
                    response=httpx.Response(
                        400,
                        request=httpx.Request("POST", "https://api.groq.com/"),
                    ),
                    body={"error": {"code": "json_validate_failed"}},
                )
            result = {
                "coverLetter": "Draft cover letter.",
                "roleSummary": "Engineering role.",
                "evidenceToEmphasize": ["Python"],
                "resumeSummary": "Software engineer.",
                "resumeBullets": ["Built software with Python."],
                "supportedKeywords": ["Python"],
                "verifyBeforeUsing": [],
            }
            return SimpleNamespace(
                choices=[
                    SimpleNamespace(
                        message=SimpleNamespace(content=json.dumps(result))
                    )
                ]
            )

        groq_client = SimpleNamespace(
            chat=SimpleNamespace(
                completions=SimpleNamespace(create=create_completion)
            )
        )
        with (
            patch.object(main, "db", Database()),
            patch.object(main, "groq_client", groq_client),
            patch.object(main, "reserve_billing_usage", new=AsyncMock()),
        ):
            result = asyncio.run(
                main.prepare_application_pack(
                    request=object(),
                    application_id="application-123",
                    payload=ApplicationPackRequest(aiProcessingConsent=True),
                    user_id="user-123",
                )
            )

        self.assertEqual(len(calls), 2)
        self.assertEqual(calls[0]["response_format"], {"type": "json_object"})
        self.assertNotIn("response_format", calls[1])
        self.assertEqual(calls[0]["messages"], calls[1]["messages"])
        self.assertEqual(result["coverLetter"], "Draft cover letter.")
        self.assertEqual(result["supportedKeywords"], ["Python"])


if __name__ == "__main__":
    unittest.main()
