"""Export/import: the JSON round-trip (self-restore) and cross-user safety.

Added after a manual QA pass found that re-importing another user's export
silently attached that user's tasks to the importer's own process, because the
importer's client-supplied ids were trusted as "already exists" without
checking ownership. See app/api/v1/export.py's _owned()/_task_owned() and the
*_id_map remapping for the fix these tests guard.
"""
from __future__ import annotations

from httpx import AsyncClient

from tests.conftest import register_user


async def test_export_then_import_into_same_account_is_idempotent(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _user = auth_client
    process_resp = await client.post(
        "/api/v1/processes",
        json={"title": "Renew passport", "category": "government", "priority": "high"},
    )
    assert process_resp.status_code == 201, process_resp.text
    process_id = process_resp.json()["id"]

    task_resp = await client.post(
        f"/api/v1/processes/{process_id}/tasks", json={"title": "Fill out the form"}
    )
    assert task_resp.status_code == 201, task_resp.text

    export = (await client.get("/api/v1/export")).json()
    assert len(export["processes"]) == 1
    assert len(export["tasks"]) == 1

    # Re-importing your own export must not duplicate anything.
    result = await client.post("/api/v1/import", json=export)
    assert result.status_code == 200, result.text
    assert result.json() == {
        "processes_created": 0,
        "tasks_created": 0,
        "reminders_created": 0,
        "notes_created": 0,
        "sources_created": 0,
    }
    processes = (await client.get("/api/v1/processes")).json()
    assert processes["total"] == 1


async def test_import_migrates_export_into_a_fresh_account_with_remapped_ids(
    client: AsyncClient,
) -> None:
    owner = await register_user(client)
    client.headers["Authorization"] = f"Bearer {owner['access_token']}"
    process_resp = await client.post(
        "/api/v1/processes", json={"title": "Renew license", "category": "vehicles"}
    )
    process_id = process_resp.json()["id"]
    await client.post(f"/api/v1/processes/{process_id}/tasks", json={"title": "Book a slot"})
    await client.post("/api/v1/notes", json={"process_id": process_id, "body": "Call ahead"})
    export = (await client.get("/api/v1/export")).json()

    newcomer = await register_user(client)
    client.headers["Authorization"] = f"Bearer {newcomer['access_token']}"
    result = await client.post("/api/v1/import", json=export)
    assert result.status_code == 200, result.text
    assert result.json()["processes_created"] == 1
    assert result.json()["tasks_created"] == 1
    assert result.json()["notes_created"] == 1

    # The task and note must land on the *newcomer's own* newly created
    # process (a fresh id), not on the original owner's process id from the
    # export payload.
    processes = (await client.get("/api/v1/processes")).json()["items"]
    assert len(processes) == 1
    new_process_id = processes[0]["id"]
    assert new_process_id != process_id

    tasks = (await client.get(f"/api/v1/processes/{new_process_id}/tasks")).json()
    assert len(tasks) == 1

    notes = (await client.get(f"/api/v1/notes?process_id={new_process_id}")).json()
    assert len(notes) == 1


async def test_importing_another_users_export_does_not_attach_data_to_their_process(
    client: AsyncClient,
) -> None:
    """Regression test: a task whose payload process_id equals a real process id
    owned by someone else must never be attached to that process — it must
    land on a newly created process of the importer's own instead.
    """
    victim = await register_user(client)
    client.headers["Authorization"] = f"Bearer {victim['access_token']}"
    process_resp = await client.post(
        "/api/v1/processes", json={"title": "Victim's private process", "category": "banking"}
    )
    victim_process_id = process_resp.json()["id"]
    export = (await client.get("/api/v1/export")).json()

    attacker = await register_user(client)
    client.headers["Authorization"] = f"Bearer {attacker['access_token']}"
    # Craft a payload referencing the victim's real process id directly,
    # rather than replaying the victim's own export (which already covers
    # the "innocent re-share" case above).
    payload = {
        "processes": [],
        "tasks": [{"process_id": victim_process_id, "title": "Injected task"}],
        "reminders": [],
        "notes": [],
        "sources": [],
    }
    result = await client.post("/api/v1/import", json=payload)
    assert result.status_code == 200, result.text
    assert result.json()["tasks_created"] == 0  # no process of the attacker's own to attach to

    client.headers["Authorization"] = f"Bearer {victim['access_token']}"
    victim_tasks = (await client.get(f"/api/v1/processes/{victim_process_id}/tasks")).json()
    assert victim_tasks == []
