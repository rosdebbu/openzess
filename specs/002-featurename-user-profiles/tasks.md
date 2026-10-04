# Tasks: User Profiles & Customization

**Branch**: `002-featurename-user-profiles` | **Spec**: [spec.md](file:///c:/Users/ROSHNI/OneDrive/Documents/GitHub/openzess/specs/002-featurename-user-profiles/spec.md) | **Plan**: [plan.md](file:///c:/Users/ROSHNI/OneDrive/Documents/GitHub/openzess/specs/002-featurename-user-profiles/plan.md)

---

## Phase 1: Data Model & Auto-Migration

- [ ] **Task 1.1**: Update `User` model in `backend/app/auth.py`
  - Add `display_name = Column(String(100), nullable=True)`
  - Add `avatar_url = Column(String(500), nullable=True)`
  - Add `bio = Column(String, nullable=True)`
  - Add `preferences_json = Column(String, nullable=True)`
- [ ] **Task 1.2**: Update `_auto_migrate()` in `backend/app/database.py`
  - Ensure `users` table auto-migrates existing SQLite/Postgres instances with the 4 new columns.

---

## Phase 2: Backend API Endpoints

- [ ] **Task 2.1**: Define Pydantic request & response schemas in `backend/app/auth.py`
  - `ProfileUpdate` (optional display_name, avatar_url, bio, preferences)
  - `ProfileResponse` (id, email, username, display_name, avatar_url, bio, preferences, is_admin, created_at)
- [ ] **Task 2.2**: Implement `GET /api/auth/profile` endpoint
  - Protected with `Depends(get_current_user)`
  - Returns user's profile details and parsed `preferences` dict.
- [ ] **Task 2.3**: Implement `PUT /api/auth/profile` endpoint
  - Validates and updates user profile and workspace preferences.

---

## Phase 3: Automated Tests

- [ ] **Task 3.1**: Add profile test suite to `backend/tests/test_fullstack_features.py`
  - `test_get_profile`: Authenticated user retrieves their profile.
  - `test_update_profile`: Authenticated user updates bio, display name, and preferences.
  - `test_unauthenticated_profile_rejected`: Unauthenticated request returns HTTP 401.

---

## Phase 4: Frontend UI Integration

- [ ] **Task 4.1**: Display profile and sync preferences in settings modal (`frontend/src/App.tsx`).
- [ ] **Task 4.2**: Verify full production build passes with `npm --prefix ./frontend run build`.
