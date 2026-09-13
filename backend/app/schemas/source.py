from __future__ import annotations

from datetime import date

from pydantic import BaseModel, ConfigDict

from app.schemas.common import AddedBy, ProcessCategory


class SourceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    title: str
    url: str
    organization: str | None
    country: str | None
    category: ProcessCategory
    last_verified_at: date | None
    added_by: AddedBy
    user_id: str | None


class SourceCreate(BaseModel):
    title: str
    url: str
    organization: str | None = None
    country: str | None = None
    category: ProcessCategory
    last_verified_at: date | None = None
