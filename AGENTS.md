# Repository Guidelines

## Project Structure & Module Organization
- `frontend/`: React + Vite UI (display and admin dashboard).
  - `src/pages/`: route-level pages (`Display.jsx`, `Admin.jsx`, `Login.jsx`).
  - `src/components/`: reusable UI components.
  - `src/components/admin/`: admin-only modules (settings, media, schedule, duty, bell plan).
- `backend/`: Flask API + Socket.IO server.
  - `routes/`: API and auth endpoints.
  - `db.py`: MongoDB connection and default settings schema.
  - `static/uploads/`: uploaded media files served by backend.
- Root docs/config: `README.md`, `.gitignore`, `backend/.env.example`.

## Build, Test, and Development Commands
- Backend install:
  - `cd backend && pip install -r requirements.txt`
- Backend run:
  - `cd backend && python app.py` (serves API on `:5000`)
- Frontend install:
  - `cd frontend && npm install`
- Frontend dev:
  - `cd frontend && npm run dev` (Vite on `:5173`, proxied to backend)
- Frontend lint:
  - `cd frontend && npm run lint`
- Frontend production build:
  - `cd frontend && npm run build`

## Coding Style & Naming Conventions
- JavaScript/React:
  - 2-space indentation, semicolon-free style is acceptable only if consistent (current code uses semicolons).
  - Components: `PascalCase` (`BellScheduleTab.jsx`), functions/variables: `camelCase`.
- Python:
  - 4-space indentation, `snake_case` for functions/variables.
- Keep UI text in proper Turkish UTF-8 (do not replace Turkish characters with ASCII fallbacks).
- Use ESLint (`frontend/eslint.config.js`) as the baseline quality gate.

## Testing Guidelines
- There is currently no automated test suite.
- Minimum validation before merging:
  1. `npm run lint` passes.
  2. `npm run build` passes.
  3. Manual smoke test: login, settings save, media upload, schedule/bell updates, display refresh.

## Commit & Pull Request Guidelines
- No strict historical convention is enforced; use clear, scoped commits (recommended: Conventional Commits, e.g., `feat(display): add weekend duty message`).
- PRs should include:
  - What changed and why.
  - Affected areas (`frontend`, `backend`, or both).
  - Screenshots/video for UI changes.
  - Any config/env changes (`.env` keys, ports, API behavior).
