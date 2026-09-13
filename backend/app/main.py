"""FastAPI app factory: middleware wiring and router includes."""
from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi.middleware import SlowAPIMiddleware

from app.api.health import router as root_health_router
from app.api.v1.router import api_router
from app.config import get_settings
from app.errors import register_exception_handlers
from app.logging import RequestContextMiddleware, configure_logging
from app.middleware import SecurityHeadersMiddleware
from app.rate_limit import limiter


def create_app() -> FastAPI:
    configure_logging()
    settings = get_settings()

    app = FastAPI(title="Bureaucracy Buddy API", version=settings.APP_VERSION)

    app.state.limiter = limiter

    app.add_middleware(SlowAPIMiddleware)
    app.add_middleware(SecurityHeadersMiddleware)
    app.add_middleware(RequestContextMiddleware)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    # Unauthenticated health check at both /health and /api/v1/health.
    app.include_router(root_health_router)
    app.include_router(api_router, prefix="/api/v1")

    return app


app = create_app()
