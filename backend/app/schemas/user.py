from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, field_validator

from app.schemas.common import Locale, Theme


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    email: EmailStr
    display_name: str
    locale: Locale
    theme: Theme
    created_at: datetime


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    display_name: str

    @field_validator("password")
    @classmethod
    def _min_length(cls, v: str) -> str:
        if len(v) < 10:
            raise ValueError("Password must be at least 10 characters long")
        return v

    @field_validator("display_name")
    @classmethod
    def _display_name_not_blank(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Display name cannot be blank")
        return v.strip()


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    display_name: str | None = None
    locale: Locale | None = None
    theme: Theme | None = None
