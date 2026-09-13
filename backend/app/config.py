"""Application settings, loaded from environment variables / .env file."""
from __future__ import annotations

from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Core
    ENVIRONMENT: Literal["development", "production", "test"] = "development"
    SECRET_KEY: str = ""
    APP_VERSION: str = "0.1.0"

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./data/app.db"

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173"

    # AI provider
    AI_PROVIDER: Literal["mock", "openai"] = "mock"
    OPENAI_API_KEY: str | None = None
    OPENAI_MODEL: str = "gpt-4o-mini"

    # Auth / tokens
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    JWT_ALGORITHM: str = "HS256"

    # Uploads
    MAX_UPLOAD_MB: int = 10
    STORAGE_DIR: str = "./storage"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.CORS_ORIGINS.split(",") if o.strip()]

    @field_validator("SECRET_KEY")
    @classmethod
    def _validate_secret_key(cls, v: str) -> str:
        # Fail-fast happens in get_settings() below where ENVIRONMENT is available.
        return v


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if settings.ENVIRONMENT == "production" and not settings.SECRET_KEY:
        raise RuntimeError(
            "SECRET_KEY must be set when ENVIRONMENT=production. Refusing to start."
        )
    if not settings.SECRET_KEY:
        # Dev/test convenience only — never used in production due to the check above.
        settings.SECRET_KEY = "dev-only-insecure-secret-key-do-not-use-in-production"
    return settings
