from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.common import ReminderRelatedType, ReminderStatus


class ReminderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    related_type: ReminderRelatedType
    related_id: str | None
    title: str
    remind_at: datetime
    status: ReminderStatus
    created_at: datetime


class ReminderCreate(BaseModel):
    related_type: ReminderRelatedType = ReminderRelatedType.custom
    related_id: str | None = None
    title: str
    remind_at: datetime
    status: ReminderStatus = ReminderStatus.pending


class ReminderUpdate(BaseModel):
    related_type: ReminderRelatedType | None = None
    related_id: str | None = None
    title: str | None = None
    remind_at: datetime | None = None
    status: ReminderStatus | None = None
