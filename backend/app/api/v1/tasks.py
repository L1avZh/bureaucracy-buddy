from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.errors import NotFoundError
from app.models.process import Process
from app.models.task import Task
from app.models.user import User
from app.schemas.common import TaskStatus
from app.schemas.task import TaskRead, TaskUpdate
from app.security import get_current_user

router = APIRouter(prefix="/tasks", tags=["tasks"])


async def _get_owned_task(db: AsyncSession, user_id: str, task_id: str) -> Task:
    # Join through Process so the ownership check happens at the query level, not after fetch.
    result = await db.execute(
        select(Task).join(Process, Task.process_id == Process.id).where(
            Task.id == task_id, Process.user_id == user_id
        )
    )
    task = result.scalar_one_or_none()
    if task is None:
        raise NotFoundError("Task not found")
    return task


@router.patch("/{task_id}", response_model=TaskRead)
async def update_task(
    task_id: str,
    payload: TaskUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskRead:
    task = await _get_owned_task(db, current_user.id, task_id)
    updates = payload.model_dump(exclude_unset=True)
    for field, value in updates.items():
        if field == "external_links" and value is not None:
            value = [link.model_dump() if hasattr(link, "model_dump") else link for link in value]
        setattr(task, field, value)
    if "status" in updates:
        if updates["status"] == TaskStatus.done and task.completed_at is None:
            task.completed_at = datetime.now(timezone.utc)
        elif updates["status"] != TaskStatus.done:
            task.completed_at = None
    await db.commit()
    await db.refresh(task)
    return TaskRead.model_validate(task)


@router.delete("/{task_id}", status_code=204, response_model=None)
async def delete_task(
    task_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    task = await _get_owned_task(db, current_user.id, task_id)
    await db.delete(task)
    await db.commit()
