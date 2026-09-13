from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.errors import NotFoundError
from app.models.reminder import Reminder
from app.models.user import User
from app.schemas.reminder import ReminderCreate, ReminderRead, ReminderUpdate
from app.security import get_current_user

router = APIRouter(prefix="/reminders", tags=["reminders"])


async def _get_owned_reminder(db: AsyncSession, user_id: str, reminder_id: str) -> Reminder:
    result = await db.execute(
        select(Reminder).where(Reminder.id == reminder_id, Reminder.user_id == user_id)
    )
    reminder = result.scalar_one_or_none()
    if reminder is None:
        raise NotFoundError("Reminder not found")
    return reminder


@router.get("", response_model=list[ReminderRead])
async def list_reminders(
    upcoming: bool = False,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[ReminderRead]:
    stmt = select(Reminder).where(Reminder.user_id == current_user.id)
    if upcoming:
        stmt = stmt.where(
            Reminder.status == "pending", Reminder.remind_at >= datetime.now(timezone.utc)
        )
    stmt = stmt.order_by(Reminder.remind_at.asc())
    rows = (await db.execute(stmt)).scalars().all()
    return [ReminderRead.model_validate(r) for r in rows]


@router.post("", response_model=ReminderRead, status_code=201)
async def create_reminder(
    payload: ReminderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReminderRead:
    reminder = Reminder(user_id=current_user.id, **payload.model_dump())
    db.add(reminder)
    await db.commit()
    await db.refresh(reminder)
    return ReminderRead.model_validate(reminder)


@router.patch("/{reminder_id}", response_model=ReminderRead)
async def update_reminder(
    reminder_id: str,
    payload: ReminderUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ReminderRead:
    reminder = await _get_owned_reminder(db, current_user.id, reminder_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(reminder, field, value)
    await db.commit()
    await db.refresh(reminder)
    return ReminderRead.model_validate(reminder)


@router.delete("/{reminder_id}", status_code=204, response_model=None)
async def delete_reminder(
    reminder_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    reminder = await _get_owned_reminder(db, current_user.id, reminder_id)
    await db.delete(reminder)
    await db.commit()
