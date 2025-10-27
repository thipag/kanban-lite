# Kanban Lite

Monorepo with a FastAPI backend, React + Vite frontend, Docker-based local orchestration, and Render deployment assets. Built collaboratively by Thiago Pagogna and Codex (OpenAI).

## Requirements
- Python 3.12+
- Node.js 20+
- Docker and Docker Compose
- Make

## Local Setup
1. Duplicate the environment template and adjust variables as needed:
   ```bash
   cp .env.example .env
   ```
2. Install backend and frontend dependencies:
   ```bash
   make setup
   ```
   The command creates a `.venv` virtualenv with `uv` when available (falls back to `python -m venv`) and installs all project dependencies.
3. Launch the development stack (Postgres, API, frontend with hot reload):
   ```bash
   make dev
   ```
   - API: http://localhost:8000
   - Frontend: http://localhost:5173 (already wired to the local API)
4. Seed the database once the containers are running:
   ```bash
   make seed
   ```
   The target prefers `uv run` and falls back to the virtualenv Python executable.

## Testing
- Full test suite (backend + frontend unit tests):
  ```bash
  make test
  ```
- Backend only:
  ```bash
  cd backend && pytest
  ```
- Frontend unit tests (Vitest + Testing Library):
  ```bash
  cd web && npm run test
  ```
- Playwright responsiveness and end-to-end flows:
  ```bash
  cd web && npx playwright test
  ```

## Responsive Validation (Playwright)
Run individual viewport checks:
- Mobile (390x844, touch enabled):
  ```bash
  cd web && npx playwright test --project=mobile
  ```
- Tablet (768x1024):
  ```bash
  cd web && npx playwright test --project=tablet
  ```
- Desktop (1366x768):
  ```bash
  cd web && npx playwright test --project=desktop
  ```

## Publishing Workflow
### 1. Push the repo to GitHub (or any Git provider)
```bash
# from the project root
git init
git add .
git commit -m "Initial commit"
git remote add origin git@github.com:<your-user>/<your-repo>.git
git push -u origin main
```

### 2. Deploy on Render using the Blueprint
1. In Render, go to **New → Blueprint** and select the repository you just pushed.
2. Render will detect `render.yaml` and provision:
   - `kanban-lite-api` (Docker service, free plan) pointing at the FastAPI backend image.
   - `kanban-lite-web` (Static site) for the Vite build output.
   - `kanban-db` (PostgreSQL free tier) for persistence.
3. Before the first deploy, configure the unsynced environment variables:
   - `kanban-lite-api` service:
     - `DATABASE_URL`: copy the **Internal Database URL** from `kanban-db`. Replace the `postgres://` prefix with `postgresql+psycopg://` (retain the rest of the string, including `?sslmode=require` if present).
     - `AUTO_MIGRATE`: already set to `true` in the blueprint, keep it.
     - `PORT`: `8000`.
   - `kanban-lite-web` static site:
     - `VITE_API_URL`: leave blank for the first deploy; after the API service is live, copy its public URL (such as `https://kanban-lite-api.onrender.com`) into this variable and redeploy the static site.
4. Trigger the blueprint deploy. With `AUTO_MIGRATE=true`, the backend will apply Alembic migrations on startup.
5. Once the API finishes provisioning, update `VITE_API_URL` with its public address (for example, the URL printed at the top of the Render dashboard) and redeploy `kanban-lite-web`, then visit the static site URL to confirm the board is live.

## Environment Variables
| Variable        | Description                                                                 |
|-----------------|-----------------------------------------------------------------------------|
| `DATABASE_URL`  | Postgres DSN in the format `postgresql+psycopg://user:pass@host:5432/db`.   |
| `AUTO_MIGRATE`  | `true` applies Alembic migrations during API startup.                       |
| `FRONTEND_ORIGIN` | Allowed CORS origin (e.g., `http://localhost:5173`).                      |
| `VITE_API_URL`  | Base URL used by the frontend when calling the API.                        |

Use `.env.example` as a reference and keep real secrets out of version control.

## Credits
Crafted by Thiago Pagogna with implementation support from Codex (OpenAI). The collaboration narrative also appears in the `/about` page of the frontend.
