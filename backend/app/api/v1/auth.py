"""Auth routes: register, login, refresh, logout.

Access tokens are short-lived JWTs returned in the response body. Refresh tokens are
longer-lived JWTs held only in an HttpOnly, SameSite=Lax cookie (Secure in production; over
plain HTTP in dev/test the Secure flag is dropped so local development and the test suite work,
since browsers refuse to store/send Secure cookies without HTTPS).
"""
from fastapi import APIRouter, Depends, Request, Response
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import Settings, get_settings
from app.database import get_db
from app.errors import ConflictError, UnauthorizedError
from app.models.user import User
from app.rate_limit import limiter
from app.schemas.auth import AccessTokenResponse, AuthResponse
from app.schemas.user import UserLogin, UserRegister, UserRead
from app.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])

REFRESH_COOKIE_NAME = "refresh_token"


def _set_refresh_cookie(response: Response, token: str, settings: Settings) -> None:
    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=settings.REFRESH_TOKEN_EXPIRE_DAYS * 24 * 3600,
        path="/api/v1/auth",
    )


@router.post("/register", response_model=AuthResponse, status_code=201)
@limiter.limit("10/minute")
async def register(
    request: Request,
    response: Response,
    payload: UserRegister,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthResponse:
    existing = await db.execute(select(User).where(User.email == payload.email))
    if existing.scalar_one_or_none() is not None:
        raise ConflictError("An account with this email already exists")

    user = User(
        email=payload.email,
        password_hash=hash_password(payload.password),
        display_name=payload.display_name,
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    access_token = create_access_token(user.id, settings)
    refresh_token = create_refresh_token(user.id, settings)
    _set_refresh_cookie(response, refresh_token, settings)
    return AuthResponse(user=UserRead.model_validate(user), access_token=access_token)


@router.post("/login", response_model=AuthResponse)
@limiter.limit("10/minute")
async def login(
    request: Request,
    response: Response,
    payload: UserLogin,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AuthResponse:
    result = await db.execute(select(User).where(User.email == payload.email))
    user = result.scalar_one_or_none()
    # Same generic error whether the email doesn't exist or the password is wrong, to avoid
    # leaking which emails are registered.
    if user is None or not verify_password(payload.password, user.password_hash):
        raise UnauthorizedError("Invalid email or password")

    access_token = create_access_token(user.id, settings)
    refresh_token = create_refresh_token(user.id, settings)
    _set_refresh_cookie(response, refresh_token, settings)
    return AuthResponse(user=UserRead.model_validate(user), access_token=access_token)


@router.post("/refresh", response_model=AccessTokenResponse)
@limiter.limit("30/minute")
async def refresh(
    request: Request,
    response: Response,
    db: AsyncSession = Depends(get_db),
    settings: Settings = Depends(get_settings),
) -> AccessTokenResponse:
    token = request.cookies.get(REFRESH_COOKIE_NAME)
    if not token:
        raise UnauthorizedError("Missing refresh token")
    payload = decode_token(token, "refresh", settings)
    user_id = payload.get("sub")
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None:
        raise UnauthorizedError("User not found")

    access_token = create_access_token(user.id, settings)
    new_refresh_token = create_refresh_token(user.id, settings)
    _set_refresh_cookie(response, new_refresh_token, settings)
    return AccessTokenResponse(access_token=access_token)


@router.post("/logout")
async def logout(response: Response, settings: Settings = Depends(get_settings)) -> dict:
    response.delete_cookie(REFRESH_COOKIE_NAME, path="/api/v1/auth")
    return {"status": "logged_out"}
