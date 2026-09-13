from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NoteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    process_id: str | None
    task_id: str | None
    body: str
    created_at: datetime
    updated_at: datetime


class NoteCreate(BaseModel):
    process_id: str | None = None
    task_id: str | None = None
    body: str


class NoteUpdate(BaseModel):
    body: str | None = None
    process_id: str | None = None
    task_id: str | None = None
