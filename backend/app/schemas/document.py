from __future__ import annotations

from datetime import date, datetime

from pydantic import BaseModel, ConfigDict


class DocumentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    process_id: str | None
    title: str
    category: str
    original_filename: str
    content_type: str
    size_bytes: int
    expires_at: date | None
    notes: str | None
    uploaded_at: datetime


class DocumentCreateMeta(BaseModel):
    title: str
    category: str = "other"
    process_id: str | None = None
    expires_at: date | None = None
    notes: str | None = None


class DocumentUpdate(BaseModel):
    title: str | None = None
    category: str | None = None
    process_id: str | None = None
    expires_at: date | None = None
    notes: str | None = None
