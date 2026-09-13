"""File storage: content-type/size validation and path-traversal-safe storage keys.

Storage keys are ALWAYS generated server-side from a UUID and a fixed extension derived from
an allow-listed content type. The client-supplied original filename is kept only as metadata
(rendered as text, never used to build a filesystem path).
"""
from __future__ import annotations

import os
import uuid
from pathlib import Path

from app.config import Settings, get_settings
from app.errors import ValidationAppError

ALLOWED_CONTENT_TYPES: dict[str, str] = {
    "application/pdf": ".pdf",
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/webp": ".webp",
    "image/heic": ".heic",
}


def validate_upload(content_type: str, size_bytes: int, settings: Settings | None = None) -> str:
    """Validates content-type and size BEFORE anything is written to disk.

    Returns the file extension to use for storage. Raises ValidationAppError otherwise.
    """
    settings = settings or get_settings()
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise ValidationAppError(
            f"Unsupported content type '{content_type}'. Allowed: "
            f"{', '.join(sorted(ALLOWED_CONTENT_TYPES))}"
        )
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if size_bytes > max_bytes:
        raise ValidationAppError(f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_MB} MB")
    if size_bytes <= 0:
        raise ValidationAppError("Uploaded file is empty")
    return ALLOWED_CONTENT_TYPES[content_type]


def _storage_root(settings: Settings | None = None) -> Path:
    settings = settings or get_settings()
    root = Path(settings.STORAGE_DIR).resolve()
    root.mkdir(parents=True, exist_ok=True)
    return root


def build_storage_key(user_id: str, extension: str) -> str:
    """Builds a storage key from a server-controlled user id (never client input) and a
    server-derived extension (never a client-supplied filename)."""
    # user_id comes from the authenticated session, not user-editable request data.
    safe_user_segment = uuid.UUID(user_id).hex if _is_uuid(user_id) else "shared"
    return f"{safe_user_segment}/{uuid.uuid4().hex}{extension}"


def _is_uuid(value: str) -> bool:
    try:
        uuid.UUID(value)
        return True
    except ValueError:
        return False


def resolve_path(storage_key: str, settings: Settings | None = None) -> Path:
    """Resolves a storage key to an absolute path, verifying it stays inside the storage root
    (defense in depth — storage keys are always server-generated, never from user input)."""
    root = _storage_root(settings)
    candidate = (root / storage_key).resolve()
    if not str(candidate).startswith(str(root) + os.sep) and candidate != root:
        raise ValidationAppError("Invalid storage key")
    return candidate


def save_bytes(storage_key: str, data: bytes, settings: Settings | None = None) -> None:
    path = resolve_path(storage_key, settings)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def read_bytes(storage_key: str, settings: Settings | None = None) -> bytes:
    path = resolve_path(storage_key, settings)
    return path.read_bytes()


def delete_file(storage_key: str, settings: Settings | None = None) -> None:
    path = resolve_path(storage_key, settings)
    path.unlink(missing_ok=True)
