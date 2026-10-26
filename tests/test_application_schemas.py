import unittest

from pydantic import ValidationError

from api.schemas.applications import (
    APPLICATION_STATUSES,
    ApplicationActivityCreate,
    ApplicationCreate,
    ApplicationImportRequest,
    ApplicationUpdate,
    OfferDetailsRequest,
)


class ApplicationSchemaTests(unittest.TestCase):
    def test_application_create_preserves_default_status(self):
        application = ApplicationCreate(company="Example", position="Engineer")

        self.assertEqual(application.status, "APPLIED")

    def test_application_import_requires_at_least_one_application(self):
        with self.assertRaises(ValidationError):
            ApplicationImportRequest(applications=[])

    def test_application_update_rejects_empty_company(self):
        with self.assertRaises(ValidationError):
            ApplicationUpdate(company="", position="Engineer", status="APPLIED")

    def test_offer_details_validate_currency_length(self):
        with self.assertRaises(ValidationError):
            OfferDetailsRequest(currency="US")

    def test_application_activity_requires_detail(self):
        with self.assertRaises(ValidationError):
            ApplicationActivityCreate(kind="NOTE", detail="")

    def test_application_statuses_remain_available(self):
        self.assertIn("SAVED", APPLICATION_STATUSES)
        self.assertIn("WITHDRAWN", APPLICATION_STATUSES)


if __name__ == "__main__":
    unittest.main()
