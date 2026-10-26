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
