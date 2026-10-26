from typing import Literal, Optional

from pydantic import BaseModel, Field


class FeatureFeedback(BaseModel):
    feature: Literal[
        "job_fit",
        "application_tracking",
        "account_settings",
        "career_suggestions",
        "roadmaps",
        "proof_sprints",
        "career_momentum",
        "search_playbook",
        "offer_comparison",
        "application_assistant",
        "application_packs",
        "csv_backups",
    ]
    usefulness: int = Field(ge=1, le=5)


class PeerFeedbackRequest(BaseModel):
    overallRating: int = Field(ge=1, le=5)
    featureRatings: list[FeatureFeedback] = Field(min_length=1, max_length=12)
    needsImprovement: Literal["yes", "no", "not_sure"]
    improvementNotes: Optional[str] = Field(default=None, max_length=1500)
    mostValuable: Optional[str] = Field(default=None, max_length=800)
    mainFriction: Optional[str] = Field(default=None, max_length=1200)
    wouldPay: Literal["yes", "no", "not_sure"]
    fairMonthlyPrice: Optional[str] = Field(default=None, max_length=100)
