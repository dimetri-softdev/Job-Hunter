from pydantic import BaseModel


class ReminderPreferenceUpdate(BaseModel):
    emailEnabled: bool
