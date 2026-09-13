"""Aggregated cross-resource search, strictly scoped to the authenticated user's own data
(plus system-wide sources, which are visible to everyone)."""
from __future__ import annotations

from sqlalchemy import or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.document import Document
from app.models.note import Note
from app.models.process import Process
from app.models.source import Source
from app.models.task import Task
from app.schemas.search import SearchResultItem

_LIMIT = 20


def _snippet(text: str | None, max_len: int = 160) -> str:
    if not text:
        return ""
    text = text.strip().replace("\n", " ")
    return text if len(text) <= max_len else text[: max_len - 1] + "…"


async def search_all(db: AsyncSession, user_id: str, q: str) -> dict[str, list[SearchResultItem]]:
    like = f"%{q.lower()}%"

    process_rows = (
        await db.execute(
            select(Process)
            .where(Process.user_id == user_id, Process.title.ilike(like))
            .limit(_LIMIT)
        )
    ).scalars().all()

    task_rows = (
        await db.execute(
            select(Task)
            .join(Process, Task.process_id == Process.id)
            .where(Process.user_id == user_id, Task.title.ilike(like))
            .limit(_LIMIT)
        )
    ).scalars().all()

    document_rows = (
        await db.execute(
            select(Document)
            .where(Document.user_id == user_id, Document.title.ilike(like))
            .limit(_LIMIT)
        )
    ).scalars().all()

    note_rows = (
        await db.execute(
            select(Note).where(Note.user_id == user_id, Note.body.ilike(like)).limit(_LIMIT)
        )
    ).scalars().all()

    source_rows = (
        await db.execute(
            select(Source)
            .where(
                or_(Source.added_by == "system", Source.user_id == user_id),
                Source.title.ilike(like),
            )
            .limit(_LIMIT)
        )
    ).scalars().all()

    return {
        "processes": [
            SearchResultItem(id=p.id, type="process", title=p.title, snippet=_snippet(p.description))
            for p in process_rows
        ],
        "tasks": [
            SearchResultItem(id=t.id, type="task", title=t.title, snippet=_snippet(t.explanation))
            for t in task_rows
        ],
        "documents": [
            SearchResultItem(
                id=d.id, type="document", title=d.title, snippet=_snippet(d.notes)
            )
            for d in document_rows
        ],
        "notes": [
            SearchResultItem(id=n.id, type="note", title=_snippet(n.body, 60), snippet=_snippet(n.body))
            for n in note_rows
        ],
        "sources": [
            SearchResultItem(
                id=s.id, type="source", title=s.title, snippet=_snippet(s.organization), url=s.url
            )
            for s in source_rows
        ],
    }
