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
from api.schemas.assistant import (
    InterviewAnswerFeedback,
    InterviewPracticeExercise,
    InterviewPracticeRequest,
    InterviewStudyGuide,
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

    def test_standalone_interview_request_accepts_role_context(self):
        request = InterviewPracticeRequest(
            aiProcessingConsent=True,
            action="questions",
            role="Product Designer",
            company="Example Co",
            jobDescription="Own product discovery and collaborate with engineering.",
            interviewOutline="Discuss a recent project and the product case exercise.",
            focusAreas=["Portfolio or case study", "Communication"],
        )

        self.assertEqual(request.role, "Product Designer")
        self.assertEqual(request.company, "Example Co")
        self.assertIn("product case", request.interviewOutline)
        self.assertEqual(len(request.focusAreas), 2)

    def test_interview_exercise_supports_varied_practical_formats(self):
        exercise = InterviewPracticeExercise(
            exerciseType="case-study",
            title="Prioritize a customer issue",
            instructions="Clarify assumptions and explain your approach.",
            material="Customers report a rising number of failed orders.",
            debriefQuestions=[
                "What would you clarify first?",
                "How would you measure success?",
            ],
        )

        self.assertEqual(exercise.exerciseType, "case-study")
        self.assertEqual(len(exercise.debriefQuestions), 2)

    def test_interview_exercise_timebox_is_bounded(self):
        with self.assertRaises(ValidationError):
            InterviewPracticeRequest(
                aiProcessingConsent=True,
                action="exercise",
                role="Operations Manager",
                exerciseType="case-study",
                exerciseDurationMinutes=90,
            )

    def test_interview_study_action_and_guide_accept_role_agnostic_content(self):
        request = InterviewPracticeRequest(
            aiProcessingConsent=True,
            action="study",
            role="Product Designer",
            interviewOutline="Discuss a portfolio project and design decisions.",
        )
        guide = InterviewStudyGuide(
            overview="Prepare to explain your decisions and their impact.",
            topics=[
                {
                    "title": "Design decisions",
                    "summary": "Explain the evidence behind your choices.",
                    "keyPoints": ["State the user need.", "Discuss trade-offs."],
                    "commonPitfalls": ["Skipping the outcome."],
                },
                {
                    "title": "Portfolio storytelling",
                    "summary": "Present a project as a clear narrative.",
                    "keyPoints": ["Set context.", "Describe your contribution."],
                },
            ],
            workedExamples=[
                {
                    "title": "Illustrative project response",
                    "scenario": "A hypothetical redesign with competing needs.",
                    "exampleResponse": "I compared the options against user needs.",
                    "personalizeBy": "Replace this with a project you actually worked on.",
                },
            ],
            flashcards=[
                {"question": f"Question {index}", "answer": f"Answer {index}"}
                for index in range(4)
            ],
            studyPlan=[
                {"activity": f"Study activity {index}", "minutes": 10}
                for index in range(3)
            ],
        )

        self.assertEqual(request.action, "study")
        self.assertEqual(len(guide.flashcards), 4)
        self.assertEqual(guide.studyPlan[0].minutes, 10)

    def test_interview_study_guide_rejects_out_of_range_plan_duration(self):
        with self.assertRaises(ValidationError):
            InterviewStudyGuide(
                overview="Prepare for the conversation.",
                topics=[
                    {
                        "title": f"Topic {index}",
                        "summary": "A useful topic.",
                        "keyPoints": ["First point.", "Second point."],
                    }
                    for index in range(2)
                ],
                workedExamples=[
                    {
                        "title": "Example",
                        "scenario": "A hypothetical scenario.",
                        "exampleResponse": "An illustrative response.",
                        "personalizeBy": "Use a truthful personal example.",
                    }
                ],
                flashcards=[
                    {"question": f"Question {index}", "answer": f"Answer {index}"}
                    for index in range(4)
                ],
                studyPlan=[
                    {
                        "activity": f"Study activity {index}",
                        "minutes": 121 if index == 0 else 10,
                    }
                    for index in range(3)
                ],
            )


if __name__ == "__main__":
    unittest.main()
