from __future__ import annotations

from fastapi import APIRouter, Depends, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.task import Task
from app.models.user import User
from app.schemas.common import Page
from app.schemas.process import ProcessCreate, ProcessRead, ProcessUpdate
from app.schemas.task import TaskCreate, TaskRead
from app.security import get_current_user
from app.services import process_service

router = APIRouter(prefix="/processes", tags=["processes"])


@router.get("", response_model=Page[ProcessRead])
async def list_processes(
    status: str | None = None,
    category: str | None = None,
    q: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Page[ProcessRead]:
    rows, total = await process_service.list_processes(
        db, current_user.id, status=status, category=category, q=q, page=page, page_size=page_size
    )
    return Page[ProcessRead](
        items=[ProcessRead.model_validate(r) for r in rows], total=total, page=page, page_size=page_size
    )


@router.post("", response_model=ProcessRead, status_code=201)
async def create_process(
    payload: ProcessCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProcessRead:
    process = await process_service.create_process(db, current_user.id, payload)
    return ProcessRead.model_validate(process)


@router.get("/{process_id}", response_model=ProcessRead)
async def get_process(
    process_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProcessRead:
    process = await process_service.get_process_or_404(db, current_user.id, process_id)
    return ProcessRead.model_validate(process)


@router.patch("/{process_id}", response_model=ProcessRead)
async def update_process(
    process_id: str,
    payload: ProcessUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> ProcessRead:
    process = await process_service.update_process(db, current_user.id, process_id, payload)
    return ProcessRead.model_validate(process)


@router.delete("/{process_id}", status_code=204, response_model=None)
async def delete_process(
    process_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    await process_service.delete_process(db, current_user.id, process_id)


@router.get("/{process_id}/tasks", response_model=list[TaskRead])
async def list_process_tasks(
    process_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[TaskRead]:
    # Ownership check at the query level: get_process_or_404 filters by user_id, and the task
    # query below is scoped to that already-verified process_id.
    await process_service.get_process_or_404(db, current_user.id, process_id)
    result = await db.execute(
        select(Task).where(Task.process_id == process_id).order_by(Task.order_index)
    )
    return [TaskRead.model_validate(t) for t in result.scalars().all()]


@router.post("/{process_id}/tasks", response_model=TaskRead, status_code=201)
async def create_process_task(
    process_id: str,
    payload: TaskCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> TaskRead:
    await process_service.get_process_or_404(db, current_user.id, process_id)
    task = Task(process_id=process_id, **payload.model_dump())
    db.add(task)
    await db.commit()
    await db.refresh(task)
    return TaskRead.model_validate(task)
