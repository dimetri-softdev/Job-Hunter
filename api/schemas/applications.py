from datetime import date
from typing import Literal, Optional

from pydantic import BaseModel, Field


APPLICATION_STATUSES = {
    "SAVED",
    "APPLIED",
    "PHONE_SCREEN",
    "INTERVIEWING",
    "OFFERED",
    "REJECTED",
    "WITHDRAWN",
}


class SavedFitAssessment(BaseModel):
    verdict: Literal[
        "STRONG_MATCH",
        "POSSIBLE_MATCH",
        "STRETCH",
        "LOW_MATCH",
        "INSUFFICIENT_INFO",
    ]
    roleTitle: str = Field(min_length=1, max_length=160)
    assessment: str = Field(max_length=800)
    strengths: list[str] = Field(default_factory=list, max_length=5)
    gaps: list[str] = Field(default_factory=list, max_length=5)
    questionsToConfirm: list[str] = Field(default_factory=list, max_length=5)


class OfferDetailsRequest(BaseModel):
    annualCompensation: Optional[float] = Field(default=None, ge=0, le=1000000000)
    currency: Optional[str] = Field(default=None, min_length=3, max_length=3)
    commuteMinutes: Optional[int] = Field(default=None, ge=0, le=5000)
    learning: Optional[int] = Field(default=None, ge=1, le=5)
    stability: Optional[int] = Field(default=None, ge=1, le=5)
    workLife: Optional[int] = Field(default=None, ge=1, le=5)


class ApplicationCreate(BaseModel):
    company: str
    position: str
    status: Optional[str] = "APPLIED"
    source: Optional[
        Literal[
            "Company website",
            "LinkedIn",
            "Job board",
            "Recruiter",
            "Referral",
            "Networking",
            "Other",
        ]
    ] = None
    notes: Optional[str] = None
    jobUrl: Optional[str] = None
    jobDescription: Optional[str] = None
    jobSummary: Optional[str] = None
    fitAssessment: Optional[SavedFitAssessment] = None
    offerDetails: Optional[OfferDetailsRequest] = None
    nextAction: Optional[str] = Field(default=None, max_length=280)
    followUpAt: Optional[date] = None
    contactName: Optional[str] = Field(default=None, max_length=120)
    contactEmail: Optional[str] = Field(default=None, max_length=254)


class ApplicationImportRequest(BaseModel):
    applications: list[ApplicationCreate] = Field(min_length=1)


class ApplicationUpdate(BaseModel):
    company: str = Field(min_length=1, max_length=120)
    position: str = Field(min_length=1, max_length=120)
    status: str
    source: Optional[
        Literal[
            "Company website",
            "LinkedIn",
            "Job board",
            "Recruiter",
            "Referral",
            "Networking",
            "Other",
        ]
    ] = None
    notes: Optional[str] = Field(default=None, max_length=2000)
    jobUrl: Optional[str] = Field(default=None, max_length=2000)
    nextAction: Optional[str] = Field(default=None, max_length=280)
    followUpAt: Optional[date] = None
    contactName: Optional[str] = Field(default=None, max_length=120)
    contactEmail: Optional[str] = Field(default=None, max_length=254)


class ApplicationActivityCreate(BaseModel):
    kind: Literal[
        "NOTE",
        "FOLLOW_UP",
        "INTERVIEW",
        "EMAIL",
        "OFFER",
        "APPLICATION_DRAFT",
        "OTHER",
    ]
    detail: str = Field(min_length=1, max_length=6000)
