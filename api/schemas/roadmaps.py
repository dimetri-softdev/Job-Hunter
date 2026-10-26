from typing import Optional

from pydantic import BaseModel, Field


class TaskUpdate(BaseModel):
    completed: bool


class ProjectProofUpdate(BaseModel):
    proofUrl: Optional[str] = Field(..., max_length=2048)
    proofNotes: Optional[str] = Field(..., max_length=2000)
