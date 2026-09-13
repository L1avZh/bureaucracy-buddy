"""OpenAI-backed AI provider. Only active when AI_PROVIDER=openai and OPENAI_API_KEY is set.

Uses httpx directly against the OpenAI chat completions API with a JSON-schema constrained
response, retries with backoff via tenacity, an explicit timeout, and a graceful fallback to a
clear AppError if the API fails — this must never crash the request with a raw exception/stack
trace reaching the client.
"""
from __future__ import annotations

import json
from datetime import datetime, timezone

import httpx
import structlog
from tenacity import retry, retry_if_exception_type, stop_after_attempt, wait_exponential

from app.ai.provider import DISCLAIMER, AIProvider
from app.config import Settings
from app.errors import AppError
from app.schemas.ai import (
    ChatMessage,
    ChecklistResponse,
    SuggestedDocument,
    SuggestedProcess,
    SuggestedTask,
)

logger = structlog.get_logger("bureaucracy_buddy")

_OPENAI_URL = "https://api.openai.com/v1/chat/completions"
_TIMEOUT = httpx.Timeout(20.0, connect=5.0)

_CHECKLIST_JSON_SCHEMA = {
    "name": "bureaucracy_checklist",
    "schema": {
        "type": "object",
        "properties": {
            "process": {
                "type": "object",
                "properties": {
                    "title": {"type": "string"},
                    "category": {
                        "type": "string",
                        "enum": [
                            "government", "tax", "healthcare", "employment", "education",
                            "housing", "vehicles", "banking", "immigration", "other",
                        ],
                    },
                    "description": {"type": "string"},
                    "priority": {"type": "string", "enum": ["low", "medium", "high"]},
                },
                "required": ["title", "category", "description", "priority"],
                "additionalProperties": False,
            },
            "tasks": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "explanation": {"type": "string"},
                        "estimated_minutes": {"type": "integer"},
                    },
                    "required": ["title", "explanation", "estimated_minutes"],
                    "additionalProperties": False,
                },
            },
            "documents": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "category": {"type": "string"},
                    },
                    "required": ["title", "category"],
                    "additionalProperties": False,
                },
            },
            "questions": {"type": "array", "items": {"type": "string"}},
        },
        "required": ["process", "tasks", "documents", "questions"],
        "additionalProperties": False,
    },
    "strict": True,
}


class AIProviderUnavailableError(AppError):
    code = "INTERNAL_ERROR"
    status_code = 503

    def __init__(self, message: str = "The AI provider is temporarily unavailable. Please try again shortly.") -> None:
        super().__init__(message)


class OpenAIProvider(AIProvider):
    name = "openai"

    def __init__(self, settings: Settings) -> None:
        if not settings.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY must be set to use the openai provider")
        self._api_key = settings.OPENAI_API_KEY
        self._model = settings.OPENAI_MODEL

    @retry(
        reraise=True,
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=0.5, min=0.5, max=4),
        retry=retry_if_exception_type((httpx.TransportError, httpx.HTTPStatusError)),
    )
    async def _call(self, payload: dict) -> dict:
        headers = {"Authorization": f"Bearer {self._api_key}", "Content-Type": "application/json"}
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            response = await client.post(_OPENAI_URL, headers=headers, json=payload)
            response.raise_for_status()
            return response.json()

    async def generate_checklist(self, goal: str, category: str | None) -> ChecklistResponse:
        system_prompt = (
            "You are an assistant that turns a bureaucratic/administrative goal into a "
            "structured, generic checklist (process + tasks + suggested documents + "
            "clarifying questions). You are not a legal or government authority; never present "
            "output as verified or official."
        )
        user_prompt = f"Goal: {goal}\nCategory hint: {category or 'unspecified'}"
        payload = {
            "model": self._model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "response_format": {"type": "json_schema", "json_schema": _CHECKLIST_JSON_SCHEMA},
            "temperature": 0.3,
        }
        try:
            data = await self._call(payload)
            content = data["choices"][0]["message"]["content"]
            parsed = json.loads(content)
        except Exception as exc:  # noqa: BLE001 - deliberately broad: any failure -> graceful fallback
            logger.error("openai_checklist_failed", error=str(exc), error_type=type(exc).__name__)
            raise AIProviderUnavailableError() from exc

        try:
            return ChecklistResponse(
                process=SuggestedProcess(**parsed["process"]),
                tasks=[SuggestedTask(**t) for t in parsed["tasks"]],
                documents=[SuggestedDocument(**d) for d in parsed["documents"]],
                questions=parsed["questions"],
                disclaimer=DISCLAIMER,
                provider="openai",
            )
        except Exception as exc:  # noqa: BLE001
            logger.error("openai_checklist_parse_failed", error=str(exc))
            raise AIProviderUnavailableError("The AI provider returned an unexpected response.") from exc

    async def chat(self, messages: list[ChatMessage]) -> str:
        system_prompt = (
            "You are a helpful assistant for bureaucratic/administrative processes (tax, "
            "government, healthcare, immigration, etc). Be concise and practical. You are not "
            "a legal or government authority; never claim your answer is verified or official."
        )
        payload = {
            "model": self._model,
            "messages": [{"role": "system", "content": system_prompt}]
            + [{"role": m.role, "content": m.content} for m in messages],
            "temperature": 0.4,
        }
        try:
            data = await self._call(payload)
            return data["choices"][0]["message"]["content"]
        except Exception as exc:  # noqa: BLE001
            logger.error("openai_chat_failed", error=str(exc), error_type=type(exc).__name__)
            raise AIProviderUnavailableError() from exc


def _utcnow() -> datetime:
    return datetime.now(timezone.utc)
