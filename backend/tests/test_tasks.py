from __future__ import annotations

from httpx import AsyncClient


async def _create_process(client: AsyncClient) -> str:
    resp = await client.post(
        "/api/v1/processes", json={"title": "Process with tasks", "category": "government"}
    )
    assert resp.status_code == 201
    return resp.json()["id"]


async def test_create_and_list_tasks(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    process_id = await _create_process(client)

    create_resp = await client.post(
        f"/api/v1/processes/{process_id}/tasks",
        json={"title": "Gather documents", "order_index": 0},
    )
    assert create_resp.status_code == 201
    task = create_resp.json()
    assert task["process_id"] == process_id
    assert task["status"] == "todo"

    list_resp = await client.get(f"/api/v1/processes/{process_id}/tasks")
    assert list_resp.status_code == 200
    tasks = list_resp.json()
    assert len(tasks) == 1
    assert tasks[0]["id"] == task["id"]


async def test_complete_task_sets_completed_at(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    process_id = await _create_process(client)
    create_resp = await client.post(
        f"/api/v1/processes/{process_id}/tasks", json={"title": "Submit form"}
    )
    task_id = create_resp.json()["id"]

    update_resp = await client.patch(f"/api/v1/tasks/{task_id}", json={"status": "done"})
    assert update_resp.status_code == 200
    body = update_resp.json()
    assert body["status"] == "done"
    assert body["completed_at"] is not None


async def test_task_external_links_round_trip(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    process_id = await _create_process(client)
    links = [{"label": "Official site", "url": "https://example.gov"}]
    create_resp = await client.post(
        f"/api/v1/processes/{process_id}/tasks",
        json={"title": "Check site", "external_links": links},
    )
    assert create_resp.status_code == 201
    assert create_resp.json()["external_links"] == links


async def test_delete_task(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    process_id = await _create_process(client)
    create_resp = await client.post(
        f"/api/v1/processes/{process_id}/tasks", json={"title": "Temp task"}
    )
    task_id = create_resp.json()["id"]

    delete_resp = await client.delete(f"/api/v1/tasks/{task_id}")
    assert delete_resp.status_code == 204

    list_resp = await client.get(f"/api/v1/processes/{process_id}/tasks")
    assert all(t["id"] != task_id for t in list_resp.json())


async def test_create_task_for_nonexistent_process_404(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    response = await client.post(
        "/api/v1/processes/does-not-exist/tasks", json={"title": "Should fail"}
    )
    assert response.status_code == 404
