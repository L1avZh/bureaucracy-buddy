from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict

from app.schemas.common import ProcessCategory, ProcessPriority, ProcessStatus


class ProcessRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    title: str
    category: ProcessCategory
    description: str | None
    status: ProcessStatus
    priority: ProcessPriority
    deadline: date | None
    created_at: datetime
    updated_at: datetime
    completed_at: datetime | None


class ProcessCreate(BaseModel):
    title: str
    category: ProcessCategory
    description: str | None = None
    status: ProcessStatus = ProcessStatus.not_started
    priority: ProcessPriority = ProcessPriority.medium
    deadline: date | None = None


class ProcessUpdate(BaseModel):
    title: str | None = None
    category: ProcessCategory | None = None
    description: str | None = None
    status: ProcessStatus | None = None
    priority: ProcessPriority | None = None
    deadline: date | None = None
