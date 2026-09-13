# Bureaucracy Buddy

**Tell it what you're trying to get done, and it helps you figure out what needs to happen next.**

Bureaucracy Buddy is a personal assistant for administrative processes — tax filings,
passport renewals, healthcare paperwork, immigration documents, vehicle registration, and
everything else that involves a form, a deadline, and a document you can never find when you
need it. It turns a vague goal into a concrete checklist, tracks deadlines and documents
per process, and keeps every AI-generated suggestion clearly labeled as guidance rather than
verified fact.

## Features

- **Onboarding that starts from a goal, not a form.** "What are you trying to get done?" →
  an AI-suggested checklist (or skip straight to a blank process).
- **Dashboard** answering "what do I need to do next?": active processes with progress bars,
  upcoming deadlines, tasks needing attention.
- **Process / case management**: status, priority, deadline, a checklist of tasks (each with
  an explanation, estimated time, external links, and notes), and free-form notes.
- **Document tracking**: metadata, category, expiration dates, per-process linking, upload
  with content-type/size validation.
- **AI assistant**, behind a provider abstraction — every response is labeled `mock` or
  `openai` and carries an explicit "AI-generated, not verified" disclaimer. No API key
  configured means the (fully functional, offline) mock provider is used automatically.
- **Global search / command palette** (`Cmd`/`Ctrl`+`K`) across processes, tasks, documents,
  notes, and sources.
- **Data export/import** as portable JSON (plus a documents zip), so you're never locked in.
- **Full English/Hebrew i18n with real RTL support**, light/dark/system theme, reduced-motion
  support, and an installable PWA shell with an offline banner.
- **Real auth** (email + password, Argon2 hashing, JWT + httpOnly refresh cookie) with strict
  per-user data isolation — every query is scoped server-side, not just checked after fetch.

## Architecture

```
┌─────────────────────┐        ┌──────────────────────────┐        ┌────────────┐
│  React 19 + TS SPA   │  REST  │   FastAPI (async)         │  SQL   │ PostgreSQL │
│  (Vite, Tailwind v4) │◄──────►│   /api/v1/*                │◄──────►│ (or SQLite │
│  TanStack Query, Zod │  JSON  │   SQLAlchemy 2.0 + Alembic │        │  for dev)  │
└─────────────────────┘        └──────────────┬─────────────┘        └────────────┘
                                               │
                                               ▼
                                 ┌───────────────────────────┐
                                 │  AIProvider abstraction     │
                                 │  MockProvider (default)     │
                                 │  OpenAIProvider (optional)  │
                                 └───────────────────────────┘
```

**Domain model**: `User`, `Process`, `Task`, `Document`, `Reminder`, `Note`, `Source`,
`AIConversation` — see [backend/app/models](backend/app/models). Every resource is scoped to
its owning user at the query level; cross-user access returns `404`, never `403`, so a
resource's existence is never leaked to a non-owner.

**API**: versioned under `/api/v1`, resource-oriented (`/processes`, `/processes/{id}/tasks`,
`/documents`, `/reminders`, `/notes`, `/sources`, `/search`, `/ai/checklist`, `/ai/chat`,
`/export`, `/import`), paginated list endpoints (`{items, total, page, page_size}`), and a
consistent error envelope:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "...", "details": [] } }
```

Full endpoint-by-endpoint documentation is generated automatically at `/docs` (Swagger UI) and
`/redoc` when the backend is running.

**AI layer**: the rest of the app depends on an `AIProvider` interface, never on a concrete
provider. `MockProvider` is deterministic and fully offline (default — no API key needed to
try the product). `OpenAIProvider` activates only when `AI_PROVIDER=openai` **and**
`OPENAI_API_KEY` are both set; if the key is missing, requests fall back to the mock provider
rather than failing outright. Every AI response includes `provider` and a disclaimer field, and
distinguishes AI-generated suggestions from anything backed by a verified `Source`.

## Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Frontend | React 19, TypeScript (strict), Vite 7 | Modern, fast, huge ecosystem |
| Routing | react-router v7 | Standard, well-maintained |
| Server state | TanStack Query | Caching/loading/error states without hand-rolled logic |
| Validation | Zod | Runtime-validates every API response and form input |
| Forms | react-hook-form + `@hookform/resolvers/zod` | De facto standard, minimal re-renders |
| UI primitives | Radix UI (dialog, dropdown, tabs, tooltip, toast) | Correct focus/keyboard/ARIA behavior out of the box |
| Styling | Tailwind CSS v4 | Fast iteration, small output, no runtime cost |
| i18n | i18next / react-i18next | Mature, first-class RTL support |
| UI state | Zustand | Tiny, only for theme/locale/auth-token — never server data |
| PWA | vite-plugin-pwa | App-shell caching, install prompt, offline banner |
| Backend | FastAPI + SQLAlchemy 2.0 (async) | Typed, async-native, excellent docs generation |
| Migrations | Alembic | Standard for SQLAlchemy |
| Database | PostgreSQL (prod) / SQLite (dev, zero-config) | One connection string away from either |
| Auth | Argon2 password hashing, JWT + httpOnly refresh cookie | Real auth, no third-party dependency |
| Testing | Vitest, Testing Library, Playwright, pytest | Unit, component, E2E, and API-level coverage |

Every dependency above is pulled in for a specific, load-bearing reason — see each
package's `README.md` for the "why" of anything not obvious.

## Getting started

### Prerequisites

- Node.js 22+, Python 3.12+
- Docker (optional, for the containerized stack)

### Run locally (no Docker)

```bash
# Backend
cd backend
python3.12 -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
cp ../.env.example .env   # fill in SECRET_KEY (see below)
mkdir -p data storage
alembic upgrade head
uvicorn app.main:app --reload   # http://localhost:8000

# Frontend (separate terminal)
cd frontend
npm install
npm run dev   # http://localhost:5173, proxies /api to the backend
```

Generate a `SECRET_KEY` with:

```bash
python -c "import secrets; print(secrets.token_urlsafe(64))"
```

### Run with Docker Compose

```bash
cp .env.example .env   # set SECRET_KEY at minimum
docker compose up --build
```

This builds and runs Postgres, the backend, and the frontend (served by nginx, which proxies
`/api` to the backend) — the app is available at `http://localhost:8080`. For active
development with hot-reload, use the no-Docker instructions above instead; Compose here
mirrors a production-like deployment, not a live-reload dev loop.

## Configuration

See [.env.example](.env.example) for the full list. Nothing has a usable default in
production — the backend fails fast at startup if `SECRET_KEY` is unset while
`ENVIRONMENT=production`, rather than starting insecurely.

| Variable | Required | Notes |
| --- | --- | --- |
| `SECRET_KEY` | Yes (production) | JWT signing key; generate with the command above |
| `DATABASE_URL` | No | Defaults to a local SQLite file; use `postgresql+asyncpg://...` in production |
| `CORS_ORIGINS` | Yes | Comma-separated allow-list; credentials are only accepted for these origins |
| `AI_PROVIDER` | No | `mock` (default) or `openai` |
| `OPENAI_API_KEY` | No | Only used if `AI_PROVIDER=openai` |
| `MAX_UPLOAD_MB` | No | Default 10 |

## Testing

```bash
# Backend: unit + API + security tests (42 tests)
cd backend && pytest -q

# Backend: dependency vulnerability scan
pip install pip-audit && pip-audit -r requirements.txt

# Frontend: typecheck, lint, unit/component tests, production build
cd frontend
npx tsc -b && npm run lint && npm run test && npm run build

# Frontend: dependency vulnerability scan
npm audit --audit-level=high

# End-to-end (needs the backend running — see frontend/README.md)
npm run e2e
```

CI (`.github/workflows/ci.yml`) runs all of the above on every pull request, plus a Docker
build-verification job and, on `main`, a production build artifact upload.

## Privacy & security

- **Local-first-friendly storage**: documents are stored on the backend instance you run —
  nothing is sent to a third party unless you explicitly configure the OpenAI provider, and
  even then only the text you send to the AI assistant is transmitted (never document files).
- **No sensitive data in logs**: structured logs (method, path, status, duration, request id)
  — never request/response bodies, passwords, tokens, or document contents.
- **Strict per-user isolation**: every query is scoped to the authenticated user; cross-user
  access returns 404. Regression-tested in `backend/tests/test_security.py`.
- **File upload safety**: content-type allow-list, size limits, and randomly generated
  storage keys — user-supplied filenames are never used to build a filesystem path.
- **Import safety**: importing a data export never lets a client-supplied id attach rows to
  another user's data — see `backend/tests/test_export_import.py` for the regression tests
  covering this.
- **Secure defaults**: CORS allow-list, security headers (`X-Content-Type-Options`,
  `X-Frame-Options`, `Referrer-Policy`, a strict `Content-Security-Policy` on the API), rate
  limiting on auth and AI endpoints, and generic error responses (no stack traces) to clients.
- No secrets are committed to this repository; `.env` is gitignored and `.env.example` holds
  only placeholders.

## Deployment

1. Build and push the two images (`backend/Dockerfile`, `frontend/Dockerfile`) to your
   registry, or deploy the backend and a static frontend build separately.
2. Provision a PostgreSQL database and set `DATABASE_URL`.
3. Set `SECRET_KEY`, `CORS_ORIGINS` (your real frontend origin), and `ENVIRONMENT=production`.
4. Run `alembic upgrade head` before starting the backend (the Docker image does this
   automatically on container start).
5. Point the frontend at the backend: either serve both from the same origin (nginx proxies
   `/api`, as `docker-compose.yml` does) or set `VITE_API_URL` at frontend build time.

## Roadmap / known limitations

- Reminders are stored and queryable but nothing actually delivers them yet (no email/push
  integration) — see `backend/README.md` for why this was left out of this pass.
- No dedicated UI for browsing/adding `Source` records yet (the API exists; the AI assistant
  surfaces matching sources for contrast).
- No OAuth/social login — email + password only, by design, to avoid a half-built integration.

## Contributing

Issues and pull requests are welcome. Before opening a PR: run the full test/lint/typecheck
suite for whichever half you touched (see **Testing** above) — CI will run it again regardless,
but catching it locally is faster.

## License

[MIT](LICENSE)
