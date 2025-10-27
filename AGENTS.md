# Agent: Build the “kanban-lite” Monorepo with Tests and No CI

## Objective
Create the **kanban-lite** monorepository containing:
1. Python 3.12 backend with FastAPI and PostgreSQL.
2. React + Vite + TypeScript frontend (mobile-first).
3. Local execution infrastructure via Docker Compose.
4. Render deployment blueprint (`render.yaml`) with a free Postgres database.

## Global Requirements
- Do **not** include any CI pipeline.
- Do **not** add comments to source code.
- Use simple, readable, deterministic patterns.
- Provide clear instructions in `README.md` (local run, migrations, seed, Render deployment).

## Domain Rules
- Minimal Kanban board with three fixed columns: `todo`, `doing`, `done`.
- Card fields: `id`, optional `title`, required `description`, `status` ∈ {`todo`, `doing`, `done`}, `created_at`, `updated_at`.
- Support create, read, update (including column changes), and delete.
- Provide basic pagination and status filtering.

## Backend (`backend/`)
- Stack: `fastapi`, `uvicorn[standard]`, `sqlalchemy`, `psycopg[binary]`, `alembic`, `pydantic-settings`, `python-dotenv`, `ruff`, `pytest`.
- Endpoints:
  - `GET /health`, `GET /version`
  - `POST /cards`
  - `GET /cards` (with `?status=` and pagination)
  - `GET /cards/{id}`
  - `PUT /cards/{id}` (`title`, `description`, `status`)
  - `DELETE /cards/{id}`
- Configuration via `DATABASE_URL`; enable CORS for the frontend domain.
- Alembic migrations; run automatically when `AUTO_MIGRATE=true`.
- Seed script `scripts/seed.py` inserting sample cards.
- Dockerfile running `uvicorn` on `0.0.0.0:8000`.

### Backend Tests
Use `pytest` + FastAPI `TestClient`. Cover at least:
- Card creation with/without `title`.
- Updates to `description` and `status` (column change).
- Listing with status filter and pagination.
- Card deletion and subsequent read failure.
- Schema validation (required description, valid status).
- Provide fixtures for an isolated test database.
- `make test` must execute the entire backend suite.

## Frontend (`web/`)
- Stack: React, Vite, TypeScript, Tailwind, shadcn/ui, React Query, `@dnd-kit/core`, `react-hook-form` + `zod`, `eslint`, `prettier`.
- Pages:
  - `/` — three columns with draggable cards.
  - `/about` — project information.
- API base URL via `VITE_API_URL` env var.
- Optimistic updates for create/edit/delete/drag moves.
- Production build outputs static bundle to `web/dist`.
- Frontend Dockerfile builds with Vite and serves via minimal Nginx.

### Responsive UX Guidelines
- Mobile-first Tailwind approach (~360–400 px base).
- Goals:
  - Phones: single column with tabs or carousel for Todo/Doing/Done.
  - Tablets: two columns visible, smooth overflow for third.
  - Desktop: all three columns visible.
- Touch drag-and-drop: configure `@dnd-kit/core` `TouchSensor`/`PointerSensor`, `activationConstraint`, drag overlay, and drag handle.
- Touch targets ≥44×44 px; concise typography.
- Create/edit forms: full-screen sheet/modal on phone, centered modal on larger screens.
- Top action bar with New Card and status filters; menu icon for secondary actions.
- Performance: CSS transform animations (~60 fps); consider virtualization when lists grow.
- Accessibility: visible focus states, keyboard navigation, `aria-label`s, WCAG-compliant colors.
- Responsive testing: Playwright viewports 390×844, 768×1024, 1366×768 covering render, card CRUD, touch DnD.
- Provide Tailwind breakpoints/utilities; README must include “How to validate responsiveness” section with Playwright commands.

### Frontend Tests
Use `vitest` + `@testing-library/react`. Minimum coverage:
- Mobile column/tab rendering.
- Card creation form.
- Card edit and delete.
- Drag-and-drop simulation.
- Local state updates after successful operations.

## Local Orchestration
- Root `docker-compose.yml` with `db` (Postgres), `api`, `web` services.
- Postgres only exposed locally, development volume attached.
- Document environment variables in `README.md`.

## Makefile Targets (root)
- `setup`: install backend + frontend deps.
- `dev`: start docker compose in development mode.
- `test`: run backend and frontend tests.
- `lint`: `ruff` for backend, `eslint` for frontend.
- `seed`: execute `scripts/seed.py`.
- `build`: build backend and frontend Docker images.

## Render Blueprint
- Root `render.yaml` specifying:
  - API web service (Docker runtime, port 8000, free plan) with env vars `DATABASE_URL` (unsynced), `AUTO_MIGRATE=true`, `PORT=8000`.
  - Static site for frontend (`npm ci && npm run build`, `staticPublishPath: dist`, `rootDir: web`) with env var `VITE_API_URL` (unsynced).
  - `databases:` block provisioning free Postgres `kanban-db`.
- README must describe:
  1. One-click blueprint deploy via Render and how to populate unsynced env vars.
  2. How to retrieve the database URL from Render and assign it to the API service.
  3. How to point `VITE_API_URL` to the public API URL on Render.

## Documentation Requirements
- README must include: prerequisites, local run (`make setup`, `make dev`, `make seed`), tests (`make test`), responsive validation, Render deployment steps, environment variables. All documentation must be in English.

## Deliverables
- Complete monorepo as specified.
- Passing unit tests.
- Verified mobile-first responsiveness.
- Working `render.yaml` with no CI pipelines.
