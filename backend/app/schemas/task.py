from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.common import ExternalLink, TaskStatus


class TaskRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    process_id: str
    title: str
    explanation: str | None
    status: TaskStatus
    order_index: int
    deadline: date | None
    estimated_minutes: int | None
    external_links: list[ExternalLink]
    notes: str | None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None


class TaskCreate(BaseModel):
    title: str
    explanation: str | None = None
    status: TaskStatus = TaskStatus.todo
    order_index: int = 0
    deadline: date | None = None
    estimated_minutes: int | None = None
    external_links: list[ExternalLink] = []
    notes: str | None = None


class TaskUpdate(BaseModel):
    title: str | None = None
    explanation: str | None = None
    status: TaskStatus | None = None
    order_index: int | None = None
    deadline: date | None = None
    estimated_minutes: int | None = None
    external_links: list[ExternalLink] | None = None
    notes: str | None = None
