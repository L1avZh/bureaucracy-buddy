"""Test fixtures: an isolated app + temp SQLite DB + temp storage dir, and an authenticated
client fixture. Environment variables MUST be set before `app.*` is imported anywhere, since
app.config.get_settings() is cached and app.database creates its engine at import time.
"""
from __future__ import annotations

import os
import tempfile
import uuid
from collections.abc import AsyncGenerator

_TEST_DIR = tempfile.mkdtemp(prefix="bb-test-")
os.environ["ENVIRONMENT"] = "test"
os.environ["SECRET_KEY"] = "test-only-secret-key-not-for-production-use"
os.environ["DATABASE_URL"] = f"sqlite+aiosqlite:///{_TEST_DIR}/test.db"
os.environ["STORAGE_DIR"] = f"{_TEST_DIR}/storage"
os.environ["CORS_ORIGINS"] = "http://localhost:5173"
os.environ["AI_PROVIDER"] = "mock"
os.environ["ACCESS_TOKEN_EXPIRE_MINUTES"] = "15"
os.environ["REFRESH_TOKEN_EXPIRE_DAYS"] = "30"

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient

from app.database import Base, engine
from app.main import app
from app.rate_limit import limiter


@pytest_asyncio.fixture(scope="session", autouse=True)
async def _create_schema() -> AsyncGenerator[None, None]:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()


@pytest.fixture(autouse=True)
def _reset_rate_limiter() -> None:
    limiter.reset()


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


def unique_email() -> str:
    return f"user_{uuid.uuid4().hex[:12]}@example.com"


async def register_user(client: AsyncClient, *, password: str = "supersecret123") -> dict:
    email = unique_email()
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": password, "display_name": "Test User"},
    )
    assert response.status_code == 201, response.text
    data = response.json()
    data["password"] = password
    return data


@pytest_asyncio.fixture
async def auth_client(client: AsyncClient) -> AsyncGenerator[tuple[AsyncClient, dict], None]:
    registered = await register_user(client)
    client.headers["Authorization"] = f"Bearer {registered['access_token']}"
    yield client, registered["user"]
