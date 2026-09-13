"""Business logic for processes, kept separate from route handlers.

Every query is scoped by user_id at the query level (never fetch-then-check), so cross-user
access is impossible by construction, not by convention.
"""
from __future__ import annotations

from datetime import datetime, timezone

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.errors import NotFoundError
from app.models.process import Process
from app.schemas.process import ProcessCreate, ProcessUpdate
from app.schemas.common import ProcessStatus


async def get_process_or_404(db: AsyncSession, user_id: str, process_id: str) -> Process:
    result = await db.execute(
        select(Process).where(Process.id == process_id, Process.user_id == user_id)
    )
    process = result.scalar_one_or_none()
    if process is None:
        raise NotFoundError("Process not found")
    return process


async def list_processes(
    db: AsyncSession,
    user_id: str,
    *,
    status: str | None,
    category: str | None,
    q: str | None,
    page: int,
    page_size: int,
) -> tuple[list[Process], int]:
    stmt = select(Process).where(Process.user_id == user_id)
    if status:
        stmt = stmt.where(Process.status == status)
    if category:
        stmt = stmt.where(Process.category == category)
    if q:
        like = f"%{q.lower()}%"
        stmt = stmt.where(func.lower(Process.title).like(like))

    count_stmt = select(func.count()).select_from(stmt.subquery())
    total = (await db.execute(count_stmt)).scalar_one()

    stmt = stmt.order_by(Process.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
    rows = (await db.execute(stmt)).scalars().all()
    return list(rows), total


async def create_process(db: AsyncSession, user_id: str, data: ProcessCreate) -> Process:
    process = Process(user_id=user_id, **data.model_dump())
    if process.status == ProcessStatus.completed:
        process.completed_at = datetime.now(timezone.utc)
    db.add(process)
    await db.commit()
    await db.refresh(process)
    return process


async def update_process(
    db: AsyncSession, user_id: str, process_id: str, data: ProcessUpdate
) -> Process:
    process = await get_process_or_404(db, user_id, process_id)
    updates = data.model_dump(exclude_unset=True)
    for field, value in updates.items():
        setattr(process, field, value)
    if "status" in updates:
        if updates["status"] == ProcessStatus.completed and process.completed_at is None:
            process.completed_at = datetime.now(timezone.utc)
        elif updates["status"] != ProcessStatus.completed:
            process.completed_at = None
    await db.commit()
    await db.refresh(process)
    return process


async def delete_process(db: AsyncSession, user_id: str, process_id: str) -> None:
    process = await get_process_or_404(db, user_id, process_id)
    await db.delete(process)
    await db.commit()
