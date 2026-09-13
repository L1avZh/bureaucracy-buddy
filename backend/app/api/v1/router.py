"""Aggregates all v1 routers. Mounted at /api/v1 in app.main.

Route registration order matters here: `documents_export_router` (GET /documents/export.zip)
is included before `documents.router` (GET /documents/{document_id}) so the literal
"export.zip" path is never captured by the {document_id} path parameter.
"""
from __future__ import annotations

from fastapi import APIRouter

from app.api import health
from app.api.v1 import ai, auth, documents, export, notes, processes, reminders, search, sources, tasks, users

api_router = APIRouter()

api_router.include_router(health.router)
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(processes.router)
api_router.include_router(tasks.router)
api_router.include_router(export.documents_export_router)
api_router.include_router(documents.router)
api_router.include_router(reminders.router)
api_router.include_router(notes.router)
api_router.include_router(sources.router)
api_router.include_router(search.router)
api_router.include_router(ai.router)
api_router.include_router(export.router)
