"""Shared enums and generic response envelopes."""
from __future__ import annotations

from enum import StrEnum
from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict


class ProcessCategory(StrEnum):
    government = "government"
    tax = "tax"
    healthcare = "healthcare"
    employment = "employment"
    education = "education"
    housing = "housing"
    vehicles = "vehicles"
    banking = "banking"
    immigration = "immigration"
    other = "other"


class ProcessStatus(StrEnum):
    not_started = "not_started"
    in_progress = "in_progress"
    waiting = "waiting"
    action_required = "action_required"
    completed = "completed"
    cancelled = "cancelled"


class ProcessPriority(StrEnum):
    low = "low"
    medium = "medium"
    high = "high"


class TaskStatus(StrEnum):
    todo = "todo"
    done = "done"
    skipped = "skipped"


class ReminderRelatedType(StrEnum):
    process = "process"
    task = "task"
    document = "document"
    custom = "custom"


class ReminderStatus(StrEnum):
    pending = "pending"
    dismissed = "dismissed"
    done = "done"


class AddedBy(StrEnum):
    system = "system"
    user = "user"


class AIProviderName(StrEnum):
    mock = "mock"
    openai = "openai"


class Locale(StrEnum):
    en = "en"
    he = "he"


class Theme(StrEnum):
    light = "light"
    dark = "dark"
    system = "system"


T = TypeVar("T")


class Page(BaseModel, Generic[T]):
    model_config = ConfigDict(from_attributes=True)

    items: list[T]
    total: int
    page: int
    page_size: int


class ExternalLink(BaseModel):
    label: str
    url: str
