import asyncio
import json
import unittest
from types import SimpleNamespace
from unittest.mock import ANY, AsyncMock, MagicMock, patch

from fastapi import HTTPException
from starlette.requests import Request

import main
from api.schemas.assistant import (
    AutofillQuestion,
    ExtensionAutofillSuggestionsRequest,
)


class _AutofillDatabase:
    def __init__(self, privacy_consent=True):
        self.privacy_consent = privacy_consent
        self.queries = []

    async def query_raw(self, query, *values):
        self.queries.append(query)
        if '"id", "privacyConsentAccepted"' in query:
            return [{"id": "profile-1", "privacyConsentAccepted": self.privacy_consent}]
        if "ApplicationProfileWorkHistoryEntry" in query:
            return [{"company": "Example Co", "title": "Engineer", "description": "Built SQL tools"}]
        if "ApplicationProfileSkill" in query:
            return [{"name": "SQL", "category": "Data", "proficiency": "Advanced"}]
        if "ApplicationProfileAnswer" in query:
            return [
                {"questionKey": "teamwork", "answerText": "I enjoy collaborative projects."},
            ]
        return []


def _request():
    async def receive():
        return {"type": "http.request", "body": b"", "more_body": False}

    return Request(
        {
            "type": "http",
            "method": "POST",
            "path": "/api/v1/extension/autofill-suggestions",
            "headers": [],
            "query_string": b"",
            "server": ("test", 80),
            "client": ("127.0.0.1", 12345),
            "scheme": "http",
            "http_version": "1.1",
        },
        receive,
    )


def _endpoint():
    return next(
        route.endpoint
        for route in main.app.routes
        if getattr(route, "path", None) == "/api/v1/extension/autofill-suggestions"
    )


class ExtensionAutofillAITests(unittest.TestCase):
    def test_requires_explicit_ai_consent_before_profile_or_provider_access(self):
        database = _AutofillDatabase()
        payload = ExtensionAutofillSuggestionsRequest(
            aiProcessingConsent=False,
            fields=[AutofillQuestion(fieldId="field-0", label="Tell us about a skill")],
        )
        with patch.object(main, "db", database):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(
                    _endpoint()(request=_request(), payload=payload, user_id="user-1")
                )

        self.assertEqual(raised.exception.status_code, 400)
        self.assertEqual(database.queries, [])

    def test_requires_saved_profile_privacy_consent(self):
        database = _AutofillDatabase(privacy_consent=False)
        payload = ExtensionAutofillSuggestionsRequest(
            aiProcessingConsent=True,
            fields=[AutofillQuestion(fieldId="field-0", label="Tell us about a skill")],
        )
        reserve = AsyncMock()
        with patch.object(main, "db", database), patch.object(
            main, "reserve_billing_usage", reserve
        ):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(
                    _endpoint()(request=_request(), payload=payload, user_id="user-1")
                )

        self.assertEqual(raised.exception.status_code, 400)
        reserve.assert_not_awaited()

    def test_uses_billing_and_only_returns_unique_known_nonsensitive_field_ids(self):
        database = _AutofillDatabase()
        payload = ExtensionAutofillSuggestionsRequest(
            aiProcessingConsent=True,
            fields=[
                AutofillQuestion(fieldId="field-0", label="Tell us about your SQL experience"),
                AutofillQuestion(fieldId="field-1", label="Gender"),
                AutofillQuestion(fieldId="field-2", label="Unknown field"),
                AutofillQuestion(fieldId="field-3", label="Tell us about teamwork"),
            ],
        )
        completion = SimpleNamespace(
            text=json.dumps(
                {
                    "suggestions": [
                        {"fieldId": "field-0", "suggestedValue": "I have advanced SQL experience.", "confidence": 0.88},
                        {"fieldId": "field-1", "suggestedValue": "Prefer not to say", "confidence": 0.99},
                        {"fieldId": "field-999", "suggestedValue": "Invented answer", "confidence": 0.99},
                        {"fieldId": "field-0", "suggestedValue": "Duplicate", "confidence": 0.99},
                        {"fieldId": "field-3", "suggestedValue": "I enjoy collaborative projects.", "confidence": 0.8},
                    ]
                }
            )
        )
        reserve = AsyncMock()
        generate = MagicMock(return_value=completion)
        with (
            patch.object(main, "db", database),
            patch.object(main, "gemini_client", object()),
            patch.object(main, "reserve_billing_usage", reserve),
            patch.object(main, "gemini_generate_with_retry", generate),
        ):
            result = asyncio.run(
                _endpoint()(request=_request(), payload=payload, user_id="user-1")
            )

        self.assertEqual(
            result["suggestions"],
            [
                {
                    "fieldId": "field-3",
                    "suggestedValue": "I enjoy collaborative projects.",
                    "confidence": 0.8,
                }
            ],
        )
        reserve.assert_awaited_once_with(ANY, "user-1", "application_drafts")
        prompt = generate.call_args.kwargs["contents"][0]
        self.assertIn("Advanced", prompt)
        self.assertNotIn("work authorization", prompt.lower())
        self.assertNotIn("Gender", prompt)

    def test_usage_limit_blocks_ai_generation(self):
        database = _AutofillDatabase()
        payload = ExtensionAutofillSuggestionsRequest(
            aiProcessingConsent=True,
            fields=[AutofillQuestion(fieldId="field-0", label="Tell us about SQL")],
        )
        reserve = AsyncMock(side_effect=HTTPException(status_code=429, detail="Limit reached"))
        generate = MagicMock()
        with (
            patch.object(main, "db", database),
            patch.object(main, "gemini_client", object()),
            patch.object(main, "reserve_billing_usage", reserve),
            patch.object(main, "gemini_generate_with_retry", generate),
        ):
            with self.assertRaises(HTTPException) as raised:
                asyncio.run(
                    _endpoint()(request=_request(), payload=payload, user_id="user-1")
                )

        self.assertEqual(raised.exception.status_code, 429)
        generate.assert_not_called()


if __name__ == "__main__":
    unittest.main()
