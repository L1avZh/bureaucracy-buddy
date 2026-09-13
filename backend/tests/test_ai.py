from __future__ import annotations

from httpx import AsyncClient


async def test_ai_checklist_mock_provider(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    response = await client.post(
        "/api/v1/ai/checklist", json={"goal": "Renew my passport before it expires"}
    )
    assert response.status_code == 200
    body = response.json()
    assert body["provider"] == "mock"
    assert body["disclaimer"]
    assert "AI" in body["disclaimer"] or "ai" in body["disclaimer"].lower()
    assert body["process"]["category"] == "immigration"
    assert body["process"]["confidence"] == "ai_generated"
    assert len(body["tasks"]) > 0
    assert all(t["confidence"] == "ai_generated" for t in body["tasks"])
    assert len(body["documents"]) > 0
    assert len(body["questions"]) > 0


async def test_ai_checklist_uses_explicit_category(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    response = await client.post(
        "/api/v1/ai/checklist", json={"goal": "Something generic", "category": "banking"}
    )
    assert response.status_code == 200
    assert response.json()["process"]["category"] == "banking"


async def test_ai_checklist_never_claims_official(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    response = await client.post("/api/v1/ai/checklist", json={"goal": "File my taxes"})
    body = response.json()
    disclaimer = body["disclaimer"].lower()
    assert "not verified" in disclaimer or "not official" in disclaimer or "provided for general guidance" in disclaimer


async def test_ai_chat_mock_provider_and_conversation_continuity(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    first = await client.post("/api/v1/ai/chat", json={"message": "Hello, what do I need?"})
    assert first.status_code == 200
    body = first.json()
    assert body["provider"] == "mock"
    assert body["conversation_id"]
    assert body["reply"]
    assert len(body["messages"]) == 2

    second = await client.post(
        "/api/v1/ai/chat",
        json={"conversation_id": body["conversation_id"], "message": "And then what?"},
    )
    assert second.status_code == 200
    second_body = second.json()
    assert second_body["conversation_id"] == body["conversation_id"]
    assert len(second_body["messages"]) == 4


async def test_ai_chat_unknown_conversation_404(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    response = await client.post(
        "/api/v1/ai/chat", json={"conversation_id": "does-not-exist", "message": "hi"}
    )
    assert response.status_code == 404


async def test_ai_requires_auth(client: AsyncClient) -> None:
    response = await client.post("/api/v1/ai/checklist", json={"goal": "test"})
    assert response.status_code == 401
