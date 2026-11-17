import unittest

from api.schemas.assistant import AssistantChatRequest, PublicAssistantRequest
from api.services.assistant_product import (
    ASSISTANT_PRODUCT_GUIDE,
    assistant_page_context,
)


class AssistantProductTests(unittest.TestCase):
    def test_signed_in_and_public_requests_accept_current_page(self):
        signed_in = AssistantChatRequest(
            message="How do I use this?",
            page="/applications",
        )
        public = PublicAssistantRequest(
            message="What is this page?",
            page="/guide",
        )

        self.assertEqual(signed_in.page, "/applications")
        self.assertEqual(public.page, "/guide")

    def test_known_pages_and_application_subpages_get_safe_navigation_hints(self):
        self.assertIn("Job applications", assistant_page_context("/applications"))
        detail_context = assistant_page_context("/applications/application-123")
        self.assertIn("Job applications", detail_context)
        self.assertIn("(/applications)", detail_context)
        self.assertNotIn("application-123", detail_context)
        self.assertIn("Admin dashboard", assistant_page_context("/admin"))

    def test_unknown_or_malformed_paths_do_not_become_prompt_context(self):
        for path in (None, "/unlisted", "/applications/../admin", "/settings?tab=billing"):
            with self.subTest(path=path):
                self.assertIsNone(assistant_page_context(path))

    def test_product_guide_covers_billing_without_claiming_private_account_access(self):
        self.assertIn("Live checkout creates real payments", ASSISTANT_PRODUCT_GUIDE)
        self.assertIn("unless it is explicitly present in context", ASSISTANT_PRODUCT_GUIDE)
        self.assertNotIn("does not currently offer checkout", ASSISTANT_PRODUCT_GUIDE)


if __name__ == "__main__":
    unittest.main()
