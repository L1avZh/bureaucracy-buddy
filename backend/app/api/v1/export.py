"""Export/import routes.

- GET /export: full JSON export of the user's structured data (no raw file bytes).
- GET /documents/export.zip: zip of the user's actual uploaded files.
- POST /import: JSON import (export shape), validated with create-style schemas, one transaction.

Note: the documents-export-zip route is declared on its own router (mounted before the
parameterized /documents/{document_id} routes in documents.py) so "export.zip" is never
swallowed as a document id by the path-parameter route.
"""
from __future__ import annotations

import io
import re
import uuid
import zipfile

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.document import Document
from app.models.note import Note
from app.models.process import Process
from app.models.reminder import Reminder
from app.models.source import Source
from app.models.task import Task
from app.models.user import User
from app.schemas.document import DocumentRead
from app.schemas.export import ExportData, ImportData, ImportResult
from app.schemas.note import NoteRead
from app.schemas.process import ProcessRead
from app.schemas.reminder import ReminderRead
from app.schemas.source import SourceRead
from app.schemas.task import TaskRead
from app.schemas.user import UserRead
from app.security import get_current_user
from app.services import storage

router = APIRouter(tags=["export"])
documents_export_router = APIRouter(prefix="/documents", tags=["export"])

_UNSAFE_NAME_CHARS = re.compile(r'[\\/:*?"<>|\r\n]')


@router.get("/export", response_model=ExportData)
async def export_data(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ExportData:
    processes = (
        (await db.execute(select(Process).where(Process.user_id == current_user.id)))
        .scalars()
        .all()
    )
    process_ids = [p.id for p in processes]
    tasks = []
    if process_ids:
        tasks = (
            (await db.execute(select(Task).where(Task.process_id.in_(process_ids))))
            .scalars()
            .all()
        )
    documents = (
        (await db.execute(select(Document).where(Document.user_id == current_user.id)))
        .scalars()
        .all()
    )
    reminders = (
        (await db.execute(select(Reminder).where(Reminder.user_id == current_user.id)))
        .scalars()
        .all()
    )
    notes = (
        (await db.execute(select(Note).where(Note.user_id == current_user.id))).scalars().all()
    )
    sources = (
        (await db.execute(select(Source).where(Source.user_id == current_user.id)))
        .scalars()
        .all()
    )

    return ExportData(
        user=UserRead.model_validate(current_user),
        processes=[ProcessRead.model_validate(p) for p in processes],
        tasks=[TaskRead.model_validate(t) for t in tasks],
        documents=[DocumentRead.model_validate(d) for d in documents],
        reminders=[ReminderRead.model_validate(r) for r in reminders],
        notes=[NoteRead.model_validate(n) for n in notes],
        sources=[SourceRead.model_validate(s) for s in sources],
    )


@documents_export_router.get("/export.zip")
async def export_documents_zip(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    documents = (
        (await db.execute(select(Document).where(Document.user_id == current_user.id)))
        .scalars()
        .all()
    )
    buffer = io.BytesIO()
    used_names: set[str] = set()
    with zipfile.ZipFile(buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        for doc in documents:
            try:
                data = storage.read_bytes(doc.storage_key)
            except OSError:
                continue  # file missing on disk; skip rather than fail the whole export
            base = _UNSAFE_NAME_CHARS.sub("_", doc.original_filename).strip() or "document"
            name = f"{doc.id}_{base}"[:200]
            while name in used_names:
                name = f"{doc.id}_{uuid.uuid4().hex[:6]}_{base}"[:200]
            used_names.add(name)
            zf.writestr(name, data)
    buffer.seek(0)
    return Response(
        content=buffer.read(),
        media_type="application/zip",
        headers={"Content-Disposition": 'attachment; filename="documents_export.zip"'},
    )


@router.post("/import", response_model=ImportResult)
async def import_data(
    payload: ImportData,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ImportResult:
    counts = {"processes": 0, "tasks": 0, "reminders": 0, "notes": 0, "sources": 0}

    async def _owned(model, item_id: str) -> bool:
        # Scoped to the current user: an id that exists but belongs to someone
        # else must never be treated as "already imported", or a crafted
        # payload could attach rows (e.g. tasks) to another user's data.
        result = await db.execute(
            select(model.id).where(model.id == item_id, model.user_id == current_user.id)
        )
        return result.scalar_one_or_none() is not None

    async def _task_owned(item_id: str) -> bool:
        result = await db.execute(
            select(Task.id).join(Process, Task.process_id == Process.id).where(
                Task.id == item_id, Process.user_id == current_user.id
            )
        )
        return result.scalar_one_or_none() is not None

    # Processes first, since tasks/notes may reference them. A payload id is
    # only ever reused (for idempotent re-import of your own export) when it
    # already belongs to *this* user; otherwise a fresh id is always
    # generated, even if the payload supplied one — a client-supplied id must
    # never let imported rows collide with, or attach to, another user's
    # data. Because ids can change on import, every payload id referenced
    # elsewhere in the payload (a task's process_id, a note's process_id /
    # task_id) is remapped through *_id_map so cross-references inside a
    # single import stay internally consistent.
    process_id_map: dict[str, str] = {}
    valid_process_ids: set[str] = set()
    for item in payload.processes:
        if item.id and await _owned(Process, item.id):
            process_id_map[item.id] = item.id
            valid_process_ids.add(item.id)
            continue
        new_id = str(uuid.uuid4())
        process = Process(id=new_id, user_id=current_user.id, **item.model_dump(exclude={"id"}))
        db.add(process)
        if item.id:
            process_id_map[item.id] = new_id
        valid_process_ids.add(new_id)
        counts["processes"] += 1

    # Also allow referencing processes the user already owns (not just ones in this payload).
    existing_process_ids = set(
        (await db.execute(select(Process.id).where(Process.user_id == current_user.id)))
        .scalars()
        .all()
    )
    valid_process_ids |= existing_process_ids
    for pid in existing_process_ids:
        process_id_map.setdefault(pid, pid)

    task_id_map: dict[str, str] = {}
    for item in payload.tasks:
        mapped_process_id = process_id_map.get(item.process_id, item.process_id)
        if mapped_process_id not in valid_process_ids:
            continue  # skip orphaned/unauthorized references rather than failing the whole import
        if item.id and await _task_owned(item.id):
            task_id_map[item.id] = item.id
            continue
        new_id = str(uuid.uuid4())
        task = Task(
            id=new_id,
            **item.model_dump(exclude={"id", "process_id"}),
            process_id=mapped_process_id,
        )
        db.add(task)
        if item.id:
            task_id_map[item.id] = new_id
        counts["tasks"] += 1

    for item in payload.reminders:
        if item.id and await _owned(Reminder, item.id):
            continue
        item_id = str(uuid.uuid4())
        reminder = Reminder(id=item_id, user_id=current_user.id, **item.model_dump(exclude={"id"}))
        db.add(reminder)
        counts["reminders"] += 1

    for item in payload.notes:
        mapped_process_id = (
            process_id_map.get(item.process_id, item.process_id) if item.process_id else None
        )
        if item.process_id and mapped_process_id not in valid_process_ids:
            continue
        mapped_task_id = task_id_map.get(item.task_id, item.task_id) if item.task_id else None
        if item.id and await _owned(Note, item.id):
            continue
        item_id = str(uuid.uuid4())
        note = Note(
            id=item_id,
            user_id=current_user.id,
            **item.model_dump(exclude={"id", "process_id", "task_id"}),
            process_id=mapped_process_id,
            task_id=mapped_task_id,
        )
        db.add(note)
        counts["notes"] += 1

    for item in payload.sources:
        if item.id and await _owned(Source, item.id):
            continue
        item_id = str(uuid.uuid4())
        source = Source(
            id=item_id,
            user_id=current_user.id,
            added_by="user",
            **item.model_dump(exclude={"id"}),
        )
        db.add(source)
        counts["sources"] += 1

    await db.commit()
    return ImportResult(
        processes_created=counts["processes"],
        tasks_created=counts["tasks"],
        reminders_created=counts["reminders"],
        notes_created=counts["notes"],
        sources_created=counts["sources"],
    )
