from __future__ import annotations

from httpx import AsyncClient


async def test_create_and_get_process(auth_client: tuple[AsyncClient, dict]) -> None:
    client, user = auth_client
    response = await client.post(
        "/api/v1/processes",
        json={"title": "Renew passport", "category": "immigration"},
    )
    assert response.status_code == 201
    process = response.json()
    assert process["title"] == "Renew passport"
    assert process["user_id"] == user["id"]
    assert process["status"] == "not_started"

    get_resp = await client.get(f"/api/v1/processes/{process['id']}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == process["id"]


async def test_list_processes_paginated(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    for i in range(3):
        resp = await client.post(
            "/api/v1/processes", json={"title": f"Process {i}", "category": "tax"}
        )
        assert resp.status_code == 201

    response = await client.get("/api/v1/processes", params={"page": 1, "page_size": 2})
    assert response.status_code == 200
    body = response.json()
    assert body["page"] == 1
    assert body["page_size"] == 2
    assert len(body["items"]) == 2
    assert body["total"] >= 3


async def test_filter_processes_by_status_and_category(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    await client.post(
        "/api/v1/processes", json={"title": "Tax filing", "category": "tax", "status": "in_progress"}
    )
    await client.post(
        "/api/v1/processes", json={"title": "Doctor visit", "category": "healthcare"}
    )
    response = await client.get("/api/v1/processes", params={"category": "tax"})
    assert response.status_code == 200
    items = response.json()["items"]
    assert all(item["category"] == "tax" for item in items)


async def test_update_process_sets_completed_at(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    create_resp = await client.post(
        "/api/v1/processes", json={"title": "Vehicle registration", "category": "vehicles"}
    )
    process_id = create_resp.json()["id"]

    update_resp = await client.patch(
        f"/api/v1/processes/{process_id}", json={"status": "completed"}
    )
    assert update_resp.status_code == 200
    body = update_resp.json()
    assert body["status"] == "completed"
    assert body["completed_at"] is not None


async def test_delete_process(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    create_resp = await client.post(
        "/api/v1/processes", json={"title": "To delete", "category": "other"}
    )
    process_id = create_resp.json()["id"]

    delete_resp = await client.delete(f"/api/v1/processes/{process_id}")
    assert delete_resp.status_code == 204

    get_resp = await client.get(f"/api/v1/processes/{process_id}")
    assert get_resp.status_code == 404
    assert get_resp.json()["error"]["code"] == "NOT_FOUND"


async def test_get_nonexistent_process_404(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    response = await client.get("/api/v1/processes/does-not-exist")
    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


async def test_create_process_invalid_category_422(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    response = await client.post(
        "/api/v1/processes", json={"title": "Bad category", "category": "not-a-real-category"}
    )
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"
