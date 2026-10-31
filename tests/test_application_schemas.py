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
from api.schemas.assistant import InterviewAnswerFeedback


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

    def test_interview_feedback_requires_bounded_rubric_scores(self):
        feedback = InterviewAnswerFeedback(
            strengths=["Clear decision"],
            improvements=["Add the result"],
            answerStructure="Situation, action, result",
            followUpQuestion="What changed afterward?",
            rubric={
                "relevance": {"score": 4, "evidence": "Directly addresses the question."},
                "clarity": {"score": 3, "evidence": "The steps are understandable."},
                "problemSolving": {"score": 2, "evidence": "The decision is not explained."},
                "specificity": {"score": 4, "evidence": "Includes a concrete example."},
            },
        )

        self.assertEqual(feedback.rubric.problemSolving.score, 2)

    def test_interview_feedback_rejects_out_of_range_rubric_scores(self):
        with self.assertRaises(ValidationError):
            InterviewAnswerFeedback(
                strengths=["Clear decision"],
                improvements=["Add the result"],
                answerStructure="Situation, action, result",
                followUpQuestion="What changed afterward?",
                rubric={
                    "relevance": {"score": 6, "evidence": "Directly addresses the question."},
                    "clarity": {"score": 3, "evidence": "The steps are understandable."},
                    "problemSolving": {"score": 2, "evidence": "The decision is not explained."},
                    "specificity": {"score": 4, "evidence": "Includes a concrete example."},
                },
            )


if __name__ == "__main__":
    unittest.main()
