from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.source import Source
from app.models.user import User
from app.schemas.source import SourceCreate, SourceRead
from app.security import get_current_user

router = APIRouter(prefix="/sources", tags=["sources"])


@router.get("", response_model=list[SourceRead])
async def list_sources(
    category: str | None = None,
    country: str | None = None,
    q: str | None = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[SourceRead]:
    # System-wide sources are visible to everyone; user-added sources are visible only to
    # their owner.
    stmt = select(Source).where(or_(Source.added_by == "system", Source.user_id == current_user.id))
    if category:
        stmt = stmt.where(Source.category == category)
    if country:
        stmt = stmt.where(Source.country == country)
    if q:
        stmt = stmt.where(Source.title.ilike(f"%{q}%"))
    rows = (await db.execute(stmt)).scalars().all()
    return [SourceRead.model_validate(r) for r in rows]


@router.post("", response_model=SourceRead, status_code=201)
async def create_source(
    payload: SourceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> SourceRead:
    # User-added only: added_by/user_id are always set server-side, never trusted from the client.
    source = Source(**payload.model_dump(), added_by="user", user_id=current_user.id)
    db.add(source)
    await db.commit()
    await db.refresh(source)
    return SourceRead.model_validate(source)
