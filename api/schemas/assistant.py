from typing import Literal, Optional

from pydantic import BaseModel, Field


class GenerateRoadmapRequest(BaseModel):
    role: str
    targetLevel: str


class CareerRecommendationsRequest(BaseModel):
    aiProcessingConsent: bool


class JobPostingAnalyzeRequest(BaseModel):
    description: str = Field(min_length=80, max_length=20000)


class AssistantMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=2000)


class AssistantChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[AssistantMessage] = Field(default_factory=list, max_length=8)
    mode: Literal["product", "career"] = "career"
    context: Optional[str] = Field(default=None, max_length=6000)
    savedContext: Optional[str] = Field(default=None, max_length=15000)
    savedContextConsent: bool = False


class PublicAssistantRequest(BaseModel):
    message: str = Field(min_length=1, max_length=2000)
    history: list[AssistantMessage] = Field(default_factory=list, max_length=8)


class ApplicationPackRequest(BaseModel):
    aiProcessingConsent: bool
    jobDescription: Optional[str] = Field(default=None, max_length=20000)


class FollowUpSequenceRequest(BaseModel):
    aiProcessingConsent: bool
    focus: Literal["after-application", "after-interview", "no-response"]


class FollowUpSequenceMessage(BaseModel):
    timing: str = Field(min_length=1, max_length=120)
    purpose: str = Field(min_length=1, max_length=240)
    subject: str = Field(min_length=1, max_length=200)
    body: str = Field(min_length=1, max_length=4000)


class FollowUpSequenceDraft(BaseModel):
    messages: list[FollowUpSequenceMessage]


class InterviewPracticeRequest(BaseModel):
    aiProcessingConsent: bool
    action: Literal["questions", "feedback"]
    question: Optional[str] = Field(default=None, min_length=1, max_length=1000)
    answer: Optional[str] = Field(default=None, min_length=1, max_length=4000)


class InterviewPracticeQuestion(BaseModel):
    category: Literal["behavioral", "role-specific", "situational", "fit"]
    question: str = Field(min_length=1, max_length=500)
    focus: str = Field(min_length=1, max_length=300)


class InterviewPracticeQuestionSet(BaseModel):
    questions: list[InterviewPracticeQuestion] = Field(min_length=4, max_length=6)


class InterviewAnswerRating(BaseModel):
    score: int = Field(ge=1, le=5)
    evidence: str = Field(min_length=1, max_length=240)


class InterviewAnswerRubric(BaseModel):
    relevance: InterviewAnswerRating
    clarity: InterviewAnswerRating
    problemSolving: InterviewAnswerRating
    specificity: InterviewAnswerRating


class InterviewAnswerFeedback(BaseModel):
    strengths: list[str] = Field(min_length=1, max_length=3)
    improvements: list[str] = Field(min_length=1, max_length=3)
    answerStructure: str = Field(min_length=1, max_length=1200)
    followUpQuestion: str = Field(min_length=1, max_length=500)
    rubric: InterviewAnswerRubric


class FitGapRoadmapRequest(BaseModel):
    aiProcessingConsent: bool
    targetLevel: Literal["Junior", "Intermediate", "Senior"] = "Intermediate"


class ProofSprintRequest(BaseModel):
    gap: str = Field(min_length=1, max_length=300)
    aiProcessingConsent: bool


class ResumeUpdateDraft(BaseModel):
    updatedResume: str = Field(min_length=1, max_length=18000)
    revisionNotes: list[str] = Field(default_factory=list, max_length=6)


class CoverLetterDraft(BaseModel):
    coverLetter: str = Field(min_length=1, max_length=12000)
    revisionNotes: list[str] = Field(default_factory=list, max_length=6)
