"""Custom exceptions and global exception handlers producing the contract error envelope.

Error envelope (all 4xx/5xx JSON bodies):
    {"error": {"code": "...", "message": "...", "details": []}}
"""
from __future__ import annotations

from typing import Any

import structlog
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from slowapi.errors import RateLimitExceeded
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = structlog.get_logger("bureaucracy_buddy")

ErrorCode = str


class AppError(Exception):
    """Base class for application-level errors mapped to the contract error envelope."""

    code: ErrorCode = "INTERNAL_ERROR"
    status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR

    def __init__(self, message: str, *, details: list[Any] | None = None) -> None:
        self.message = message
        self.details = details or []
        super().__init__(message)


class ValidationAppError(AppError):
    code = "VALIDATION_ERROR"
    status_code = status.HTTP_422_UNPROCESSABLE_CONTENT


class NotFoundError(AppError):
    code = "NOT_FOUND"
    status_code = status.HTTP_404_NOT_FOUND

    def __init__(self, message: str = "Resource not found", **kw: Any) -> None:
        super().__init__(message, **kw)


class UnauthorizedError(AppError):
    code = "UNAUTHORIZED"
    status_code = status.HTTP_401_UNAUTHORIZED

    def __init__(self, message: str = "Authentication required", **kw: Any) -> None:
        super().__init__(message, **kw)


class ForbiddenError(AppError):
    code = "FORBIDDEN"
    status_code = status.HTTP_403_FORBIDDEN

    def __init__(self, message: str = "Not allowed", **kw: Any) -> None:
        super().__init__(message, **kw)


class ConflictError(AppError):
    code = "CONFLICT"
    status_code = status.HTTP_409_CONFLICT

    def __init__(self, message: str = "Conflict", **kw: Any) -> None:
        super().__init__(message, **kw)


class RateLimitedError(AppError):
    code = "RATE_LIMITED"
    status_code = status.HTTP_429_TOO_MANY_REQUESTS

    def __init__(self, message: str = "Too many requests", **kw: Any) -> None:
        super().__init__(message, **kw)


def _envelope(code: str, message: str, details: list[Any] | None = None) -> dict[str, Any]:
    return {"error": {"code": code, "message": message, "details": details or []}}


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(AppError)
    async def app_error_handler(request: Request, exc: AppError) -> JSONResponse:
        return JSONResponse(
            status_code=exc.status_code,
            content=_envelope(exc.code, exc.message, exc.details),
        )

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(
        request: Request, exc: RequestValidationError
    ) -> JSONResponse:
        # exc.errors() can contain non-JSON-serializable values in "ctx" (e.g. the raw
        # exception raised by a field_validator) — keep only the plain, serializable parts.
        details = [
            {"loc": list(e.get("loc", [])), "msg": e.get("msg", ""), "type": e.get("type", "")}
            for e in exc.errors()
        ]
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            content=_envelope("VALIDATION_ERROR", "Invalid request data", details),
        )

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_handler(request: Request, exc: RateLimitExceeded) -> JSONResponse:
        return JSONResponse(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            content=_envelope("RATE_LIMITED", "Too many requests, please try again later"),
        )

    @app.exception_handler(StarletteHTTPException)
    async def http_exception_handler(
        request: Request, exc: StarletteHTTPException
    ) -> JSONResponse:
        code_map = {
            401: "UNAUTHORIZED",
            403: "FORBIDDEN",
            404: "NOT_FOUND",
            409: "CONFLICT",
            429: "RATE_LIMITED",
        }
        code = code_map.get(exc.status_code, "INTERNAL_ERROR" if exc.status_code >= 500 else "VALIDATION_ERROR")
        detail = exc.detail if isinstance(exc.detail, str) else "Request failed"
        return JSONResponse(status_code=exc.status_code, content=_envelope(code, detail))

    @app.exception_handler(Exception)
    async def unhandled_exception_handler(request: Request, exc: Exception) -> JSONResponse:
        # Log the real error server-side only; never leak stack traces / internal paths to clients.
        logger.error("unhandled_exception", error=str(exc), error_type=type(exc).__name__)
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=_envelope("INTERNAL_ERROR", "An unexpected error occurred"),
        )
