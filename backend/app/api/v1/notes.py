from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.errors import NotFoundError
from app.models.note import Note
from app.models.user import User
from app.schemas.note import NoteCreate, NoteRead, NoteUpdate
from app.security import get_current_user
from app.services import process_service

router = APIRouter(prefix="/notes", tags=["notes"])


async def _get_owned_note(db: AsyncSession, user_id: str, note_id: str) -> Note:
    result = await db.execute(select(Note).where(Note.id == note_id, Note.user_id == user_id))
    note = result.scalar_one_or_none()
    if note is None:
        raise NotFoundError("Note not found")
    return note


@router.get("", response_model=list[NoteRead])
async def list_notes(
    process_id: str | None = None,
    task_id: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[NoteRead]:
    stmt = select(Note).where(Note.user_id == current_user.id)
    if process_id:
        stmt = stmt.where(Note.process_id == process_id)
    if task_id:
        stmt = stmt.where(Note.task_id == task_id)
    stmt = stmt.order_by(Note.created_at.desc())
    rows = (await db.execute(stmt)).scalars().all()
    return [NoteRead.model_validate(r) for r in rows]


@router.post("", response_model=NoteRead, status_code=201)
async def create_note(
    payload: NoteCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NoteRead:
    if payload.process_id:
        await process_service.get_process_or_404(db, current_user.id, payload.process_id)
    note = Note(user_id=current_user.id, **payload.model_dump())
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return NoteRead.model_validate(note)


@router.patch("/{note_id}", response_model=NoteRead)
async def update_note(
    note_id: str,
    payload: NoteUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> NoteRead:
    note = await _get_owned_note(db, current_user.id, note_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(note, field, value)
    await db.commit()
    await db.refresh(note)
    return NoteRead.model_validate(note)


@router.delete("/{note_id}", status_code=204, response_model=None)
async def delete_note(
    note_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    note = await _get_owned_note(db, current_user.id, note_id)
    await db.delete(note)
    await db.commit()
