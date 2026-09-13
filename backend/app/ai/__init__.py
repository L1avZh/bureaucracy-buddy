from __future__ import annotations

from app.ai.mock_provider import MockAIProvider
from app.ai.provider import AIProvider
from app.config import Settings, get_settings


def get_ai_provider(settings: Settings | None = None) -> AIProvider:
    settings = settings or get_settings()
    if settings.AI_PROVIDER == "openai" and settings.OPENAI_API_KEY:
        from app.ai.openai_provider import OpenAIProvider

        return OpenAIProvider(settings)
    return MockAIProvider()


__all__ = ["AIProvider", "get_ai_provider"]
