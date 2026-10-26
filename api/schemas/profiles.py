from typing import Any, Dict, Optional

from pydantic import BaseModel, Field


class CareerProfileUpdate(BaseModel):
    careerSummary: str = Field(default="", max_length=2500)
    skills: str = Field(default="", max_length=2500)
    workHistory: str = Field(default="", max_length=6000)
    education: str = Field(default="", max_length=3500)
    accomplishments: str = Field(default="", max_length=3500)
    experienceLevel: str = Field(default="", max_length=40)
    targetRoles: str = Field(default="", max_length=500)
    preferredLocation: str = Field(default="", max_length=160)
    workArrangement: str = Field(default="Any", max_length=40)


class ApplicationProfileWorkHistoryEntryInput(BaseModel):
    company: Optional[str] = Field(default=None, max_length=160)
    title: Optional[str] = Field(default=None, max_length=160)
    location: Optional[str] = Field(default=None, max_length=160)
    startDate: Optional[str] = Field(default=None, max_length=40)
    endDate: Optional[str] = Field(default=None, max_length=40)
    isCurrent: bool = False
    description: Optional[str] = Field(default=None, max_length=2000)


class ApplicationProfileEducationEntryInput(BaseModel):
    school: Optional[str] = Field(default=None, max_length=200)
    degree: Optional[str] = Field(default=None, max_length=200)
    fieldOfStudy: Optional[str] = Field(default=None, max_length=200)
    startDate: Optional[str] = Field(default=None, max_length=40)
    endDate: Optional[str] = Field(default=None, max_length=40)
    location: Optional[str] = Field(default=None, max_length=160)
    description: Optional[str] = Field(default=None, max_length=2000)


class ApplicationProfileSkillInput(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    category: Optional[str] = Field(default=None, max_length=80)
    proficiency: Optional[str] = Field(default=None, max_length=80)


class ApplicationProfileAnswerInput(BaseModel):
    questionKey: str = Field(min_length=1, max_length=200)
    answerText: str = Field(min_length=1, max_length=5000)
    isSensitive: bool = False
    consentGiven: bool = False


class ApplicationProfileUpdate(BaseModel):
    fullName: Optional[str] = Field(default=None, max_length=200)
    email: Optional[str] = Field(default=None, max_length=320)
    phone: Optional[str] = Field(default=None, max_length=50)
    city: Optional[str] = Field(default=None, max_length=120)
    state: Optional[str] = Field(default=None, max_length=120)
    country: Optional[str] = Field(default=None, max_length=120)
    postalCode: Optional[str] = Field(default=None, max_length=30)
    addressLine1: Optional[str] = Field(default=None, max_length=200)
    addressLine2: Optional[str] = Field(default=None, max_length=200)
    linkedInUrl: Optional[str] = Field(default=None, max_length=500)
    githubUrl: Optional[str] = Field(default=None, max_length=500)
    portfolioUrl: Optional[str] = Field(default=None, max_length=500)
    noticePeriod: Optional[str] = Field(default=None, max_length=120)
    workAuthorization: Optional[str] = Field(default=None, max_length=200)
    workAuthorizationConsent: bool = False
    salaryExpectation: Optional[str] = Field(default=None, max_length=200)
    salaryExpectationConsent: bool = False
    eeoData: Optional[Dict[str, Any]] = None
    eeoDataConsent: bool = False
    privacyConsentAccepted: bool = False
    workHistory: list[ApplicationProfileWorkHistoryEntryInput] = Field(
        default_factory=list, max_items=25
    )
    education: list[ApplicationProfileEducationEntryInput] = Field(
        default_factory=list, max_items=20
    )
    skills: list[ApplicationProfileSkillInput] = Field(
        default_factory=list, max_items=80
    )
    savedAnswers: list[ApplicationProfileAnswerInput] = Field(
        default_factory=list, max_items=200
    )
