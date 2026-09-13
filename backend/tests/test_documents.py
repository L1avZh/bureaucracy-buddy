from __future__ import annotations

import io
import json
import os

from httpx import AsyncClient

from app.config import get_settings

_PNG_BYTES = (
    b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR\x00\x00\x00\x01\x00\x00\x00\x01\x08\x02\x00\x00\x00"
    b"\x90wS\xde\x00\x00\x00\x0cIDATx\x9cc\xf8\xcf\xc0\x00\x00\x03\x01\x01\x00\x18\xdd\x8d\xb0"
    b"\x00\x00\x00\x00IEND\xaeB`\x82"
)


def _upload_files(filename: str, content_type: str, data: bytes, meta: dict):
    return {
        "file": (filename, io.BytesIO(data), content_type),
        "metadata": (None, json.dumps(meta), "application/json"),
    }


async def test_upload_get_and_download_document(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    files = _upload_files("photo.png", "image/png", _PNG_BYTES, {"title": "My photo", "category": "identity"})
    response = await client.post("/api/v1/documents", files=files)
    assert response.status_code == 201
    doc = response.json()
    assert doc["title"] == "My photo"
    assert doc["original_filename"] == "photo.png"
    assert "storage_key" not in doc

    get_resp = await client.get(f"/api/v1/documents/{doc['id']}")
    assert get_resp.status_code == 200

    file_resp = await client.get(f"/api/v1/documents/{doc['id']}/file")
    assert file_resp.status_code == 200
    assert file_resp.content == _PNG_BYTES
    assert file_resp.headers["content-type"] == "image/png"


async def test_delete_document_removes_file(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    files = _upload_files("f.png", "image/png", _PNG_BYTES, {"title": "Temp", "category": "other"})
    response = await client.post("/api/v1/documents", files=files)
    doc = response.json()

    delete_resp = await client.delete(f"/api/v1/documents/{doc['id']}")
    assert delete_resp.status_code == 204

    get_resp = await client.get(f"/api/v1/documents/{doc['id']}")
    assert get_resp.status_code == 404


async def test_upload_disallowed_content_type_rejected(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    files = _upload_files(
        "malware.exe", "application/x-msdownload", b"MZ\x90\x00", {"title": "Bad", "category": "other"}
    )
    response = await client.post("/api/v1/documents", files=files)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_upload_oversized_file_rejected(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    settings = get_settings()
    oversized = b"0" * (settings.MAX_UPLOAD_MB * 1024 * 1024 + 1)
    files = _upload_files("big.pdf", "application/pdf", oversized, {"title": "Too big", "category": "other"})
    response = await client.post("/api/v1/documents", files=files)
    assert response.status_code == 422
    assert response.json()["error"]["code"] == "VALIDATION_ERROR"


async def test_path_traversal_filename_is_not_used_for_storage(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    malicious_filename = "../../../../etc/passwd"
    files = _upload_files(
        malicious_filename, "image/png", _PNG_BYTES, {"title": "Evil filename", "category": "other"}
    )
    response = await client.post("/api/v1/documents", files=files)
    assert response.status_code == 201
    doc = response.json()
    # The client-supplied filename is preserved as harmless metadata text...
    assert doc["original_filename"] == malicious_filename
    assert "storage_key" not in doc

    # ...but never used to build a filesystem path: every file on disk lives strictly under the
    # configured storage root, and no file escaped it.
    settings = get_settings()
    storage_root = os.path.realpath(settings.STORAGE_DIR)
    for dirpath, _dirnames, filenames in os.walk(storage_root):
        for name in filenames:
            full_path = os.path.realpath(os.path.join(dirpath, name))
            assert full_path.startswith(storage_root + os.sep)
    assert not os.path.exists(os.path.join(os.path.dirname(storage_root), "etc", "passwd"))

    # Download still works and serves the correct bytes despite the hostile filename.
    file_resp = await client.get(f"/api/v1/documents/{doc['id']}/file")
    assert file_resp.status_code == 200
    assert file_resp.content == _PNG_BYTES
    # Content-Disposition header must not contain raw path-traversal segments that could
    # break header parsing (quotes/newlines are stripped).
    disposition = file_resp.headers["content-disposition"]
    assert "\n" not in disposition and "\r" not in disposition


async def test_list_documents_filtered_by_process(auth_client: tuple[AsyncClient, dict]) -> None:
    client, _ = auth_client
    process_resp = await client.post(
        "/api/v1/processes", json={"title": "Doc process", "category": "other"}
    )
    process_id = process_resp.json()["id"]
    files = _upload_files(
        "linked.pdf", "application/pdf", b"%PDF-1.4 fake", {"title": "Linked doc", "category": "other", "process_id": process_id}
    )
    upload_resp = await client.post("/api/v1/documents", files=files)
    assert upload_resp.status_code == 201

    list_resp = await client.get("/api/v1/documents", params={"process_id": process_id})
    assert list_resp.status_code == 200
    items = list_resp.json()["items"]
    assert len(items) == 1
    assert items[0]["process_id"] == process_id
