# Bureaucracy Buddy — Frontend

React 19 + TypeScript frontend for Bureaucracy Buddy. See the [root README](../README.md#architecture)
for the API/domain overview. This app does not run standalone in a meaningful way — most
screens need the FastAPI backend in `../backend` running at `http://localhost:8000`.

## Stack

- **React 19 + TypeScript (strict)**, **Vite 7**
- **react-router v7** for routing
- **@tanstack/react-query** for all server state (no component calls `fetch` directly —
  everything goes through `src/api/*.ts` + `src/features/*/hooks.ts`)
- **zod** schemas in `src/schemas/` mirror every request/response; responses are validated
  in dev (`import.meta.env.DEV`) and a `ContractMismatchError` is thrown on drift
- **react-hook-form** + `@hookform/resolvers/zod` for forms
- **Radix UI primitives** (dialog, dropdown, tabs, tooltip, toast) styled with **Tailwind v4**
- **zustand** for small persisted UI concerns only (theme, locale, onboarding-seen, auth
  token in memory) — never for server data
- **i18next / react-i18next** — `en` and `he` (RTL), see `src/locales/`
- **vite-plugin-pwa** for the app shell + offline banner
- **vitest** + **@testing-library/react** for unit/component tests, **Playwright** for E2E

## Running it

```bash
npm install
npm run dev       # http://localhost:5173, proxies /api -> http://localhost:8000
```

The dev server proxies `/api/*` to the backend (see `vite.config.ts`). To point at a
different backend origin, set `VITE_API_URL` (e.g. in `.env.local`):

```
VITE_API_URL=https://api.example.com
```

Leave it unset for local dev — the Vite proxy handles it. In production, either serve the
frontend from the same origin as the API (so relative `/api` just works) or set
`VITE_API_URL` at build time.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check (`tsc -b`) then production build |
| `npm run lint` | ESLint over the whole project |
| `npm run test` | Run the vitest suite once |
| `npm run test:watch` | Vitest in watch mode |
| `npm run e2e` | Run Playwright E2E tests (see below) |

## Testing

**Unit/component tests** (`npm run test`) cover the design system primitives
(`src/components/ui/*.test.tsx`), the auth store (`src/stores/auth-store.test.ts`), and one
feature's query/mutation hooks against a mocked API client
(`src/features/processes/hooks.test.tsx`). They run against jsdom via `vitest.config.ts`
(kept separate from `vite.config.ts` — see the comment in that file for why).

**E2E tests** (`npm run e2e`, config in `playwright.config.ts`) exercise the real frontend
against a real backend — they do not mock the network. To run them:

```bash
# terminal 1
cd ../backend && uvicorn app.main:app --reload   # or: docker compose up backend

# terminal 2
cd frontend && npm run e2e
```

Playwright starts its own `npm run dev` for the frontend automatically; you still need the
backend running separately. `e2e/full-flow.spec.ts` covers: register → onboarding → create
process → add task → complete task → search (command palette) → settings → export.

## PWA icons

`public/icons/icon.svg` is a simple placeholder mark (a checklist glyph on a brand-green
rounded square) used for the favicon, apple-touch-icon, and manifest icons. Swap it for a
real brand icon by replacing that file — it's referenced by `index.html` and
`vite.config.ts`'s `VitePWA({ manifest: { icons: [...] } })`. Modern browsers accept SVG
manifest icons; if you need PNG fallbacks for older platforms, generate 192×192 and 512×512
PNGs from the same artwork and add them to the `icons` array alongside the SVG.

## Notable scope decisions

- **Sources CRUD UI**: the contract exposes `/sources` (official reference links), and the
  AI assistant surfaces matching sources for contrast next to AI-generated guidance, but
  there's no dedicated page for browsing/adding sources — it wasn't in the numbered product
  requirements, only implied by the contract.
- **Reminders**: shown read-only on the dashboard ("Upcoming deadlines"); there's no UI to
  create custom reminders, since the product requirements didn't call for one.
- **Push notifications**: out of scope — needs a push backend/VAPID keys the contract
  doesn't define. The service worker (via `vite-plugin-pwa`) handles app-shell caching and
  an offline banner only, per the spec's explicit "no complex offline write-sync" scope.
- **Bundle size**: total JS is ~213 KB gzip, split into cacheable vendor chunks
  (`react-vendor`, `query-vendor`, `ui-vendor`, `i18n-vendor`) via
  `build.rollupOptions.output.manualChunks` plus per-page chunks via `React.lazy`, so a
  deploy only invalidates the app-code chunk and vendor code stays cached across releases.
