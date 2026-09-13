"""Document routes.

Uploads are multipart (`file` + a JSON `metadata` form field). Content-type and size are
validated BEFORE anything is written to disk. The storage key is always generated server-side
from a UUID and never incorporates the client-supplied filename, so path traversal via a
malicious filename is not possible by construction.
"""
from __future__ import annotations

import re

from fastapi import APIRouter, Depends, File, Form, Query, UploadFile
from fastapi.responses import Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.errors import NotFoundError
from app.models.document import Document
from app.models.user import User
from app.schemas.common import Page
from app.schemas.document import DocumentCreateMeta, DocumentRead, DocumentUpdate
from app.security import get_current_user
from app.services import process_service, storage

router = APIRouter(prefix="/documents", tags=["documents"])

_UNSAFE_HEADER_CHARS = re.compile(r'[\r\n"]')


async def _get_owned_document(db: AsyncSession, user_id: str, document_id: str) -> Document:
    result = await db.execute(
        select(Document).where(Document.id == document_id, Document.user_id == user_id)
    )
    document = result.scalar_one_or_none()
    if document is None:
        raise NotFoundError("Document not found")
    return document


@router.get("", response_model=Page[DocumentRead])
async def list_documents(
    process_id: str | None = None,
    category: str | None = None,
    q: str | None = None,
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Page[DocumentRead]:
    stmt = select(Document).where(Document.user_id == current_user.id)
    if process_id:
        stmt = stmt.where(Document.process_id == process_id)
    if category:
        stmt = stmt.where(Document.category == category)
    if q:
        stmt = stmt.where(Document.title.ilike(f"%{q}%"))

    from sqlalchemy import func

    total = (await db.execute(select(func.count()).select_from(stmt.subquery()))).scalar_one()
    stmt = (
        stmt.order_by(Document.uploaded_at.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    rows = (await db.execute(stmt)).scalars().all()
    return Page[DocumentRead](
        items=[DocumentRead.model_validate(r) for r in rows], total=total, page=page, page_size=page_size
    )


@router.post("", response_model=DocumentRead, status_code=201)
async def upload_document(
    file: UploadFile = File(...),
    metadata: str = Form(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentRead:
    meta = DocumentCreateMeta.model_validate_json(metadata)

    if meta.process_id:
        await process_service.get_process_or_404(db, current_user.id, meta.process_id)

    content_type = file.content_type or "application/octet-stream"
    content = await file.read()
    extension = storage.validate_upload(content_type, len(content))

    storage_key = storage.build_storage_key(current_user.id, extension)
    storage.save_bytes(storage_key, content)

    document = Document(
        user_id=current_user.id,
        process_id=meta.process_id,
        title=meta.title,
        category=meta.category,
        original_filename=file.filename or "upload",
        content_type=content_type,
        size_bytes=len(content),
        storage_key=storage_key,
        expires_at=meta.expires_at,
        notes=meta.notes,
    )
    db.add(document)
    await db.commit()
    await db.refresh(document)
    return DocumentRead.model_validate(document)


@router.get("/{document_id}", response_model=DocumentRead)
async def get_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentRead:
    document = await _get_owned_document(db, current_user.id, document_id)
    return DocumentRead.model_validate(document)


@router.get("/{document_id}/file")
async def download_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> Response:
    document = await _get_owned_document(db, current_user.id, document_id)
    data = storage.read_bytes(document.storage_key)
    safe_name = _UNSAFE_HEADER_CHARS.sub("", document.original_filename) or "document"
    return Response(
        content=data,
        media_type=document.content_type,
        headers={"Content-Disposition": f'attachment; filename="{safe_name}"'},
    )


@router.patch("/{document_id}", response_model=DocumentRead)
async def update_document(
    document_id: str,
    payload: DocumentUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> DocumentRead:
    document = await _get_owned_document(db, current_user.id, document_id)
    updates = payload.model_dump(exclude_unset=True)
    if updates.get("process_id"):
        await process_service.get_process_or_404(db, current_user.id, updates["process_id"])
    for field, value in updates.items():
        setattr(document, field, value)
    await db.commit()
    await db.refresh(document)
    return DocumentRead.model_validate(document)


@router.delete("/{document_id}", status_code=204, response_model=None)
async def delete_document(
    document_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    document = await _get_owned_document(db, current_user.id, document_id)
    storage.delete_file(document.storage_key)
    await db.delete(document)
    await db.commit()
