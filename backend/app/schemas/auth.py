from __future__ import annotations

from pydantic import BaseModel

from app.schemas.user import UserRead


class AuthResponse(BaseModel):
    user: UserRead
    access_token: str
    token_type: str = "bearer"


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
