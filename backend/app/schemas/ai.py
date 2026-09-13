from __future__ import annotations

from datetime import datetime
from typing import Literal

from pydantic import BaseModel

from app.schemas.common import AIProviderName, ProcessCategory, ProcessPriority

Confidence = Literal["ai_generated"]


class ChecklistRequest(BaseModel):
    goal: str
    category: ProcessCategory | None = None


class SuggestedProcess(BaseModel):
    title: str
    category: ProcessCategory
    description: str
    priority: ProcessPriority
    confidence: Confidence = "ai_generated"


class SuggestedTask(BaseModel):
    title: str
    explanation: str
    estimated_minutes: int | None = None
    confidence: Confidence = "ai_generated"


class SuggestedDocument(BaseModel):
    title: str
    category: str
    confidence: Confidence = "ai_generated"


class ChecklistResponse(BaseModel):
    process: SuggestedProcess
    tasks: list[SuggestedTask]
    documents: list[SuggestedDocument]
    questions: list[str]
    disclaimer: str
    provider: AIProviderName


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime


class ChatRequest(BaseModel):
    conversation_id: str | None = None
    process_id: str | None = None
    message: str


class ChatResponse(BaseModel):
    conversation_id: str
    reply: str
    messages: list[ChatMessage]
    disclaimer: str
    provider: AIProviderName
