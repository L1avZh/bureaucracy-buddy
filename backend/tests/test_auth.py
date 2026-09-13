from __future__ import annotations

from httpx import AsyncClient

from tests.conftest import register_user, unique_email


async def test_register_returns_user_and_token(client: AsyncClient) -> None:
    email = unique_email()
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "supersecret123", "display_name": "Alice"},
    )
    assert response.status_code == 201
    data = response.json()
    assert data["user"]["email"] == email
    assert data["user"]["display_name"] == "Alice"
    assert "password" not in data["user"]
    assert "password_hash" not in data["user"]
    assert data["access_token"]
    assert "refresh_token" in response.cookies


async def test_register_rejects_short_password(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/register",
        json={"email": unique_email(), "password": "short", "display_name": "Bob"},
    )
    assert response.status_code == 422
    body = response.json()
    assert body["error"]["code"] == "VALIDATION_ERROR"


async def test_register_duplicate_email_conflicts(client: AsyncClient) -> None:
    email = unique_email()
    payload = {"email": email, "password": "supersecret123", "display_name": "Carol"}
    first = await client.post("/api/v1/auth/register", json=payload)
    assert first.status_code == 201
    second = await client.post("/api/v1/auth/register", json=payload)
    assert second.status_code == 409
    assert second.json()["error"]["code"] == "CONFLICT"


async def test_login_success(client: AsyncClient) -> None:
    registered = await register_user(client)
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": registered["user"]["email"], "password": registered["password"]},
    )
    assert response.status_code == 200
    assert response.json()["access_token"]


async def test_login_wrong_password_is_unauthorized(client: AsyncClient) -> None:
    registered = await register_user(client)
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": registered["user"]["email"], "password": "wrong-password-123"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


async def test_login_unknown_email_same_error_as_wrong_password(client: AsyncClient) -> None:
    response = await client.post(
        "/api/v1/auth/login",
        json={"email": unique_email(), "password": "whatever-1234"},
    )
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"


async def test_refresh_requires_cookie(client: AsyncClient) -> None:
    response = await client.post("/api/v1/auth/refresh")
    assert response.status_code == 401


async def test_refresh_issues_new_access_token(client: AsyncClient) -> None:
    registered = await register_user(client)
    login_resp = await client.post(
        "/api/v1/auth/login",
        json={"email": registered["user"]["email"], "password": registered["password"]},
    )
    assert "refresh_token" in login_resp.cookies

    refresh_resp = await client.post("/api/v1/auth/refresh")
    assert refresh_resp.status_code == 200
    assert refresh_resp.json()["access_token"]


async def test_logout_clears_cookie(client: AsyncClient) -> None:
    registered = await register_user(client)
    await client.post(
        "/api/v1/auth/login",
        json={"email": registered["user"]["email"], "password": registered["password"]},
    )
    response = await client.post("/api/v1/auth/logout")
    assert response.status_code == 200
    set_cookie = response.headers.get_list("set-cookie")
    assert any("refresh_token=" in c and ("Max-Age=0" in c or "expires=" in c.lower()) for c in set_cookie)


async def test_protected_route_requires_token(client: AsyncClient) -> None:
    response = await client.get("/api/v1/users/me")
    assert response.status_code == 401
    assert response.json()["error"]["code"] == "UNAUTHORIZED"
