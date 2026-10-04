# Implementation Plan: User Profiles & Customization

**Branch**: `002-featurename-user-profiles` | **Date**: 2026-10-04 | **Spec**: [spec.md](file:///c:/Users/ROSHNI/OneDrive/Documents/GitHub/openzess/specs/002-featurename-user-profiles/spec.md)

**Input**: Feature specification from `specs/002-featurename-user-profiles/spec.md`

## Summary
Extend the Openzess user system (`backend/app/auth.py`) to support full user profiles including display names, bios, avatars, and multi-device preference synchronization (theme, default persona, auto-approve permissions).

## Technical Context
* **Language/Version:** Python 3.12 (Backend), TypeScript 5.9 + React 19 (Frontend)
* **Primary Dependencies:** FastAPI, SQLAlchemy, PyJWT, Vite, Tailwind CSS v4, Lucide-react
* **Storage:** SQLite (`~/.openzess/chat_history.db`) or PostgreSQL via SQLAlchemy
* **Testing:** `pytest` in `backend/tests/test_fullstack_features.py`
* **Target Platform:** Windows / Linux / WSL2 local and hosted web environments

## Constitution Check
* [x] **I. Spec-Driven First:** Complete `spec.md`, `research.md`, `data-model.md`, `contracts/` and `quickstart.md` authored.
* [x] **II. AI-Aware Architecture:** Zero external services needed; uses SQLite/Postgres cleanly with typed Pydantic models.
* [x] **III. Testing Non-Negotiable:** Endpoints covered by deterministic unit tests.
* [x] **IV. Code Quality & Formatting:** Strict typing, no raw SQL injections.

## Project Structure
```text
specs/002-featurename-user-profiles/
├── plan.md              # This file
├── research.md          # Architectural research & rationale
├── data-model.md        # DB schema & Pydantic models
├── quickstart.md        # Verification curl & pytest commands
└── contracts/
    └── profile-api.yaml # OpenAPI specification
```

## Planned Source Code Changes
1. **`backend/app/auth.py`**:
   - Add `display_name`, `avatar_url`, `bio`, `preferences_json` to `User` model.
   - Add `GET /api/auth/profile` and `PUT /api/auth/profile`.
2. **`backend/app/database.py`**:
   - Add new columns to `_auto_migrate()` so existing databases upgrade silently.
3. **`backend/tests/test_fullstack_features.py`**:
   - Add test cases: `test_get_profile`, `test_update_profile`, `test_unauthenticated_profile_rejected`.
4. **`frontend/src/`**:
   - Wire user profile display and preference sync into the settings modal.
