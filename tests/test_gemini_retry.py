import importlib
import sys
import types
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from fastapi import HTTPException


if "main" in sys.modules:
    import main
else:
    prisma_stub = types.ModuleType("prisma")
    setattr(prisma_stub, "Prisma", type("Prisma", (), {}))
    with patch.dict(sys.modules, {"prisma": prisma_stub}):
        main = importlib.import_module("main")


class RetryableGeminiError(Exception):
    def __init__(self, code: int):
        super().__init__(f"Gemini status {code}")
        self.code = code


class GeminiRetryTests(unittest.TestCase):
    def test_retries_primary_and_fallback_models_before_succeeding(self):
        calls = []

        def generate_content(model, **kwargs):
            self.assertEqual(kwargs["contents"], ["prompt"])
            calls.append(model)
            if model == "gemini-primary":
                raise RetryableGeminiError(503)
            if calls.count(model) == 1:
                raise RetryableGeminiError(503)
            return SimpleNamespace(text='{"verdict":"POSSIBLE_MATCH"}')

        client = SimpleNamespace(
            models=SimpleNamespace(generate_content=generate_content)
        )
        with (
            patch.object(main, "GEMINI_MODEL", "gemini-primary"),
            patch.object(main, "gemini_client", client),
            patch.object(main.time, "sleep") as sleep,
        ):
            result = main.gemini_generate_with_retry(contents=["prompt"])

        self.assertEqual(
            calls,
            [
                "gemini-primary",
                "gemini-primary",
                "gemini-3.5-flash-lite",
                "gemini-3.5-flash-lite",
            ],
        )
        self.assertEqual(sleep.call_count, 2)
        self.assertEqual(result.text, '{"verdict":"POSSIBLE_MATCH"}')

    def test_reports_temporary_unavailability_after_all_models_fail(self):
        calls = []

        def generate_content(model, **kwargs):
            self.assertEqual(kwargs["contents"], ["prompt"])
            calls.append(model)
            raise RetryableGeminiError(503)

        client = SimpleNamespace(
            models=SimpleNamespace(generate_content=generate_content)
        )
        with (
            patch.object(main, "GEMINI_MODEL", "gemini-primary"),
            patch.object(main, "gemini_client", client),
            patch.object(main.time, "sleep"),
        ):
            with self.assertRaises(HTTPException) as raised:
                main.gemini_generate_with_retry(contents=["prompt"])

        self.assertEqual(raised.exception.status_code, 503)
        self.assertEqual(len(calls), 4)

    def test_does_not_retry_non_transient_provider_errors(self):
        calls = []

        def generate_content(model, **kwargs):
            self.assertEqual(kwargs["contents"], ["prompt"])
            calls.append(model)
            raise RetryableGeminiError(400)

        client = SimpleNamespace(
            models=SimpleNamespace(generate_content=generate_content)
        )
        with (
            patch.object(main, "GEMINI_MODEL", "gemini-primary"),
            patch.object(main, "gemini_client", client),
        ):
            with self.assertRaises(RetryableGeminiError):
                main.gemini_generate_with_retry(contents=["prompt"])

        self.assertEqual(calls, ["gemini-primary"])


if __name__ == "__main__":
    unittest.main()
