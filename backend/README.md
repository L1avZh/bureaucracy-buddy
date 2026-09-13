# Bureaucracy Buddy — Backend

FastAPI + SQLAlchemy 2.0 (async) backend for Bureaucracy Buddy. See the
[root README](../README.md#architecture) for the API/domain overview. Python 3.12.
Dependency management: plain `pip` + `requirements.txt` / `requirements-dev.txt` (no
poetry/uv — kept simple and explicit).

## Project layout

```
app/
  main.py            FastAPI app factory, middleware wiring, router includes
  config.py          pydantic-settings Settings (fail-fast on missing SECRET_KEY in production)
  database.py        async engine/session setup
  logging.py         structlog config + request-id/access-log middleware
  security.py        password hashing, JWT encode/decode, current_user dependency
  errors.py          exception classes + handlers -> {"error": {...}} envelope
  middleware.py       security headers middleware
  rate_limit.py       shared slowapi Limiter
  models/             SQLAlchemy models (one file per resource)
  schemas/            Pydantic request/response schemas (one file per resource)
  api/
    health.py          unauthenticated GET /health
    v1/
      router.py         aggregates all v1 routers, mounted at /api/v1
      auth.py, users.py, processes.py, tasks.py, documents.py, reminders.py,
      notes.py, sources.py, search.py, ai.py, export.py
  services/           business logic: process_service.py, search_service.py, storage.py
  ai/                 AIProvider ABC + mock_provider.py (default) + openai_provider.py
alembic/              migration environment + initial migration
tests/                pytest + pytest-asyncio + httpx.AsyncClient (ASGITransport)
```

## Setup

```bash
cd backend
python3.12 -m venv .venv
source .venv/bin/activate
pip install -r requirements-dev.txt   # includes requirements.txt
cp ../.env.example .env               # then fill in SECRET_KEY etc. for production
```

## Running migrations

```bash
mkdir -p data storage
alembic upgrade head
```

This creates `./data/app.db` (SQLite, dev default) with all tables. To generate a new
migration after changing models: `alembic revision --autogenerate -m "message"`.

## Running the dev server

```bash
uvicorn app.main:app --reload
curl http://127.0.0.1:8000/health
curl http://127.0.0.1:8000/api/v1/health
```

## Running tests

```bash
pytest -q
```

Tests use an isolated temporary SQLite database and temporary storage directory (created in
`tests/conftest.py`, unique per test run) — they never touch `./data/app.db` or `./storage`.
The mock AI provider is used in tests (no network calls).

## Environment variables

See `../.env.example` (repo root) for the full list with defaults/notes:
`DATABASE_URL`, `SECRET_KEY`, `ENVIRONMENT`, `CORS_ORIGINS`, `AI_PROVIDER`, `OPENAI_API_KEY`,
`OPENAI_MODEL`, `ACCESS_TOKEN_EXPIRE_MINUTES`, `REFRESH_TOKEN_EXPIRE_DAYS`, `MAX_UPLOAD_MB`,
`STORAGE_DIR`.

`SECRET_KEY` has no default and the app refuses to start if it is unset while
`ENVIRONMENT=production`.

## Docker

```bash
docker build -t bureaucracy-buddy-backend .
docker run -p 8000:8000 -e SECRET_KEY=... -e ENVIRONMENT=production bureaucracy-buddy-backend
```

The image runs as a non-root user, runs `alembic upgrade head` on container start, and exposes
a `HEALTHCHECK` against `/health`.

## Notable design choices / judgment calls

- **IDOR responses are 404, not 403**: accessing another user's resource always returns
  `NOT_FOUND` rather than `FORBIDDEN`, so existence of a resource is never leaked to a
  non-owner. Applied consistently across processes, tasks, documents, reminders, notes.
- **Refresh cookie `Secure` flag**: only set when `ENVIRONMENT=production`. Browsers (and
  `httpx`'s cookie jar) drop `Secure` cookies over plain HTTP, so this keeps local dev and the
  test suite working while still being `Secure` in production. Always `HttpOnly` and
  `SameSite=Lax`, and scoped to the `/api/v1/auth` path only.
- **`/import`** accepts payloads shaped like `/export`'s output, validated with Create-style
  schemas extended with an optional client-supplied `id` (so a task's `process_id` can point at
  a process created earlier in the same import payload). A payload id is only ever treated as
  "already imported" (and skipped) when it already belongs to *the current user* — an id that
  exists but belongs to someone else is never trusted, so a crafted or replayed payload can't
  attach rows to another user's data. Every other id is freshly generated on import, with
  in-payload references (a task's `process_id`, a note's `process_id`/`task_id`) remapped
  accordingly, so importing your own export elsewhere still reconstructs the same structure.
  Regression tests for both the idempotent self-restore and the cross-user case live in
  `tests/test_export_import.py`.
- **Document `category`** is a free-text string (not an enum), unlike `Process.category` —
  document categories aren't a fixed, predefined set.
- **AI provider selection**: `AI_PROVIDER=openai` only actually activates the OpenAI provider if
  `OPENAI_API_KEY` is also set; otherwise it silently falls back to the mock provider rather than
  failing every AI request, so a misconfigured deployment degrades gracefully rather than
  breaking.

## Out of scope (deliberate)

- No real email/push delivery for reminders — reminders are stored and queryable
  (`GET /reminders?upcoming=true`); actually notifying the user is a frontend/worker concern not
  specified as a product requirement.
- No OAuth/social login (excluded by design, to avoid a half-built integration).
- No background job runner for AI calls — `/ai/*` calls the provider synchronously within the
  request, which is fine for the mock provider and acceptable for OpenAI given the timeout +
  retry policy in `openai_provider.py`.
