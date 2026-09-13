from __future__ import annotations

from httpx import AsyncClient

from tests.conftest import register_user


async def test_security_headers_present(client: AsyncClient) -> None:
    response = await client.get("/health")
    assert response.headers["x-content-type-options"] == "nosniff"
    assert response.headers["x-frame-options"] == "DENY"
    assert response.headers["referrer-policy"] == "strict-origin-when-cross-origin"
    assert response.headers["content-security-policy"] == "default-src 'none'"


async def test_user_cannot_read_other_users_process(client: AsyncClient) -> None:
    user_a = await register_user(client)
    client_a_headers = {"Authorization": f"Bearer {user_a['access_token']}"}
    create_resp = await client.post(
        "/api/v1/processes",
        json={"title": "Alice's secret process", "category": "healthcare"},
        headers=client_a_headers,
    )
    assert create_resp.status_code == 201
    process_id = create_resp.json()["id"]

    user_b = await register_user(client)
    client_b_headers = {"Authorization": f"Bearer {user_b['access_token']}"}

    # IDOR check: user B must get 404 (not 403), so existence of the resource is not leaked.
    get_resp = await client.get(f"/api/v1/processes/{process_id}", headers=client_b_headers)
    assert get_resp.status_code == 404
    assert get_resp.json()["error"]["code"] == "NOT_FOUND"

    patch_resp = await client.patch(
        f"/api/v1/processes/{process_id}", json={"title": "hacked"}, headers=client_b_headers
    )
    assert patch_resp.status_code == 404

    delete_resp = await client.delete(f"/api/v1/processes/{process_id}", headers=client_b_headers)
    assert delete_resp.status_code == 404

    # The process must still be intact for its real owner.
    still_there = await client.get(f"/api/v1/processes/{process_id}", headers=client_a_headers)
    assert still_there.status_code == 200
    assert still_there.json()["title"] == "Alice's secret process"


async def test_user_cannot_read_other_users_task(client: AsyncClient) -> None:
    user_a = await register_user(client)
    headers_a = {"Authorization": f"Bearer {user_a['access_token']}"}
    process_resp = await client.post(
        "/api/v1/processes", json={"title": "P", "category": "other"}, headers=headers_a
    )
    process_id = process_resp.json()["id"]
    task_resp = await client.post(
        f"/api/v1/processes/{process_id}/tasks", json={"title": "secret task"}, headers=headers_a
    )
    task_id = task_resp.json()["id"]

    user_b = await register_user(client)
    headers_b = {"Authorization": f"Bearer {user_b['access_token']}"}
    resp = await client.patch(f"/api/v1/tasks/{task_id}", json={"status": "done"}, headers=headers_b)
    assert resp.status_code == 404


async def test_user_cannot_download_other_users_document(client: AsyncClient) -> None:
    import io
    import json

    user_a = await register_user(client)
    headers_a = {"Authorization": f"Bearer {user_a['access_token']}"}
    files = {
        "file": ("a.pdf", io.BytesIO(b"%PDF-1.4 test"), "application/pdf"),
        "metadata": (None, json.dumps({"title": "secret doc", "category": "other"}), "application/json"),
    }
    upload_resp = await client.post("/api/v1/documents", files=files, headers=headers_a)
    document_id = upload_resp.json()["id"]

    user_b = await register_user(client)
    headers_b = {"Authorization": f"Bearer {user_b['access_token']}"}
    meta_resp = await client.get(f"/api/v1/documents/{document_id}", headers=headers_b)
    assert meta_resp.status_code == 404
    file_resp = await client.get(f"/api/v1/documents/{document_id}/file", headers=headers_b)
    assert file_resp.status_code == 404


async def test_login_rate_limit_triggers(client: AsyncClient) -> None:
    registered = await register_user(client)
    email = registered["user"]["email"]

    statuses = []
    for _ in range(15):
        resp = await client.post(
            "/api/v1/auth/login", json={"email": email, "password": "wrong-password"}
        )
        statuses.append(resp.status_code)

    assert 429 in statuses
    rate_limited_index = statuses.index(429)
    body = (
        await client.post("/api/v1/auth/login", json={"email": email, "password": "wrong-password"})
    ).json()
    assert body["error"]["code"] == "RATE_LIMITED"
    assert all(s == 401 for s in statuses[:rate_limited_index])
