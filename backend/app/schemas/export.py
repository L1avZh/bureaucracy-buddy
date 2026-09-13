from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel

from app.schemas.common import (
    ExternalLink,
    ProcessCategory,
    ProcessPriority,
    ProcessStatus,
    ReminderRelatedType,
    ReminderStatus,
    TaskStatus,
)
from app.schemas.document import DocumentRead
from app.schemas.note import NoteRead
from app.schemas.process import ProcessRead
from app.schemas.reminder import ReminderRead
from app.schemas.source import SourceRead
from app.schemas.task import TaskRead
from app.schemas.user import UserRead


class ExportData(BaseModel):
    user: UserRead
    processes: list[ProcessRead]
    tasks: list[TaskRead]
    documents: list[DocumentRead]
    reminders: list[ReminderRead]
    notes: list[NoteRead]
    sources: list[SourceRead]
    documents_note: str = (
        "Document entries below are metadata only. Raw file bytes are not included in this "
        "export — download files individually via GET /documents/{id}/file, or use "
        "GET /documents/export.zip to download all files as a zip archive."
    )


# Import schemas mirror the Create schemas used by the regular resource-creation endpoints,
# extended with an optional client-supplied `id` so relationships between rows in the same
# import payload (e.g. a task's process_id) can be preserved. user_id is always forced to the
# authenticated user server-side and is never taken from the payload. A payload id is only
# ever treated as "already imported" when it already belongs to the current user (see
# api/v1/export.py's _owned()/_task_owned()) — an id belonging to someone else is never
# trusted, and always gets a freshly generated id instead, with in-payload references
# remapped accordingly.


class ImportProcess(BaseModel):
    id: str | None = None
    title: str
    category: ProcessCategory
    description: str | None = None
    status: ProcessStatus = ProcessStatus.not_started
    priority: ProcessPriority = ProcessPriority.medium
    deadline: date | None = None


class ImportTask(BaseModel):
    id: str | None = None
    process_id: str
    title: str
    explanation: str | None = None
    status: TaskStatus = TaskStatus.todo
    order_index: int = 0
    deadline: date | None = None
    estimated_minutes: int | None = None
    external_links: list[ExternalLink] = []
    notes: str | None = None


class ImportReminder(BaseModel):
    id: str | None = None
    related_type: ReminderRelatedType = ReminderRelatedType.custom
    related_id: str | None = None
    title: str
    remind_at: datetime
    status: ReminderStatus = ReminderStatus.pending


class ImportNote(BaseModel):
    id: str | None = None
    process_id: str | None = None
    task_id: str | None = None
    body: str


class ImportSource(BaseModel):
    id: str | None = None
    title: str
    url: str
    organization: str | None = None
    country: str | None = None
    category: ProcessCategory
    last_verified_at: date | None = None


class ImportData(BaseModel):
    processes: list[ImportProcess] = []
    tasks: list[ImportTask] = []
    reminders: list[ImportReminder] = []
    notes: list[ImportNote] = []
    sources: list[ImportSource] = []


class ImportResult(BaseModel):
    processes_created: int
    tasks_created: int
    reminders_created: int
    notes_created: int
    sources_created: int
