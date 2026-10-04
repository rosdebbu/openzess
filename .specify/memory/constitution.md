# Openzess Constitution

## Core Principles

### I. Spec-Driven First
All significant features, bug fixes, or architectural changes must first be written as a Spec (`/speckit-specify`), followed by a Plan (`/speckit-plan`), before any code is generated or modified. The specification is the absolute source of truth.

### II. AI-Aware Architecture
The project is built to be manipulated by AI agents. Code should remain straightforward. Modules should be isolated with clear inputs and outputs so that an AI can easily read, test, and refactor them without cascading side effects.
- Prefer explicit over implicit logic.
- Avoid over-engineered abstractions; Keep It Simple, Stupid (KISS).

### III. Testing is Non-Negotiable
- **Backend:** `pytest` is used for all backend testing. Test files must live in `backend/tests/`. Every backend feature requires corresponding unit tests.
- **Frontend:** Frontend logic must have corresponding unit tests.

### IV. Code Quality & Formatting
- **Backend:** Code is formatted and linted via `ruff`. Ensure all backend Python code is typed where applicable (using `pyproject.toml` guidelines).
- **Frontend:** Vite + React + TypeScript configuration is used. `eslint` is required to pass before merging. Types should be strictly defined avoiding `any` types.

### V. Component Architecture
- **Backend (`backend/app`)**: Contains all core server logic (likely FastAPI/Flask/etc.) and handles interactions with Chroma DB and other tools. 
- **Frontend (`frontend/src`)**: Built with Vite + React. Keep components modular. Business logic should be decoupled from UI rendering.
- **Rust Sidecar (`rust-sidecar/`)**: For performance-critical backend tasks. Ensure clear FFI/IPC boundaries with the Python backend.

## Security & Deployment
- Never commit `.env` or `credentials.json` directly.
- Docker configuration (`docker-compose.yml`, `Dockerfile`) is the standard for localized running. All new services must be registered in the compose file.
- Cloudflare tunneling configuration must remain secure.

## Governance
This Constitution supersedes all other practices in the repository. It is a living document and should be updated as the architecture or stack evolves.

**Version**: 1.0.0 | **Ratified**: 2026-10-04
