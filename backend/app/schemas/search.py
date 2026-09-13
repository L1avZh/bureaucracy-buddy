from __future__ import annotations

from pydantic import BaseModel


class SearchResultItem(BaseModel):
    id: str
    type: str
    title: str
    snippet: str
    url: str | None = None


class SearchResponse(BaseModel):
    processes: list[SearchResultItem]
    tasks: list[SearchResultItem]
    documents: list[SearchResultItem]
    notes: list[SearchResultItem]
    sources: list[SearchResultItem]
