# AGENTS.md

## Purpose & stack
- Internal employee support-ticket app: employees report/edit tickets, support staff change status and comment.
- Two independent npm packages, no root manifest/workspaces: `backend/` (Express 4 + TypeScript, ESM) and `frontend/` (React 19 + TypeScript + Vite 6).
- SQLite via Node built-in `node:sqlite`; requires a recent Node 22+ (env here is v22.17.0; repo pins no version).
- Relative TS imports include the `.ts` extension (`./app.ts`, etc.); keep this convention.

## Layout & entrypoints
- Backend entry: `backend/src/index.ts` → `initDb()` → `createApp()` → `listen()`; wiring is in `backend/src/app.ts`.
- Frontend entry: `frontend/index.html` → `src/main.tsx` → `AuthProvider` + `App`. `App.tsx` uses manual `window.location.pathname` routing/full-page redirects; no router library.
- `frontend/src/main.ts`, `counter.ts`, `style.css` and hero/Vite/TypeScript assets are unused Vite template leftovers. Real styles are `styles.css`.
- Backend dirs: `routes/` (HTTP), `middleware/` (auth/errors), `db/` (schema, queries, seeding), `validation/`, plus `types.ts` and `config.ts`.
- Frontend dirs: `pages/`, `components/`; `api.ts` owns every fetch, `auth.tsx` owns session state, `types.ts` mirrors backend types.

## API, auth, permissions
- `GET /api/health`; `/api/auth/{login,logout,me}`; `/api/tickets` (employee list/create), `/api/tickets/support` (support list/filters), `/api/tickets/:id`, `PATCH /:id` (employee fields), `PATCH /:id/status` (support only), `GET|POST /:id/comments`.
- Auth is a signed HMAC HTTP-only cookie `ticket_session` (7 days, `SameSite=lax`, `secure` only when `NODE_ENV=production`). Seed users: 3 employees + `support.agent`, password `Demo@123` unless `DEMO_PASSWORD` is set before seeding.
- Server-enforced rules: employees cannot change status; support cannot edit ticket fields; closed tickets cannot be edited; status only moves Open → In Progress → Resolved → Closed.
- `commentsRouter` is mounted on `/api/tickets` **before** `ticketsRouter` in `app.ts`; preserve that order when adding routes.

## Database
- `DATABASE_PATH` defaults to `./data/tickets.db` relative to process CWD (`backend/` when using npm scripts). Tests use `:memory:`.
- `schema.sql` is `CREATE TABLE IF NOT EXISTS` applied on every startup; there are no migrations. Schema changes need a fresh DB (`backend/data/` is gitignored).
- Seeding runs only when `users` is empty; changing `DEMO_PASSWORD` after a DB exists will not rehash seeded users.

## Run locally
- Install separately (no root install): `cd backend && npm install`, then `cd ../frontend && npm install`.
- Terminal 1: `cd backend && npm run dev` (tsx watch, port 3001).
- Terminal 2: `cd frontend && npm run dev` (Vite, http://localhost:5173; API health at http://localhost:3001/api/health).
- Vite proxies `/api` → `http://localhost:3001`; CORS allowlist is hardcoded to localhost/127.0.0.1:5173 with credentials. Changing `PORT` requires updating `vite.config.ts` and `app.ts` CORS.
- `.env.example` is documentation only — no dotenv loader; export env vars in the shell.

## Verification
- `cd backend && npm test` uses `tsx --test --test-concurrency=1` (Node test runner), not Vitest. Serialization matters: tests share one in-memory DB singleton via `initDb(":memory:")` + `resetDb()`.
- Focused: `cd backend && npx tsx --test --test-concurrency=1 tests/auth.test.ts`.
- `cd frontend && npm run build` is the only typecheck path (`tsc && vite build`). No lint/typecheck scripts in either package; backend has no build script.

## Important config files
- `backend/package.json` (scripts), `backend/tsconfig.json` (NodeNext), `backend/src/config.ts` (env defaults), `backend/vitest.config.ts` (present but unused by `npm test`).
- `frontend/package.json`, `frontend/tsconfig.json` (strict, `noUnusedLocals`), `frontend/vite.config.ts` (proxy), `frontend/index.html`.
- Root `.env.example` and `.gitignore`.

## Unverified / stale sources
- README calls the tests "Vitest", but `vitest` is absent from `backend/package.json` and only present in `package-lock.json`; trust `npm test` and the test files.
- No CI workflows, pre-commit config, `opencode.json`, `CLAUDE.md`, or other instruction files were found.
- No production deployment/static-serving path was found; the dev flow is the only verified one.
