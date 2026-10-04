# Phase 0 Research: User Profiles & Workspace Customization

## 1. Existing System Assessment
* **Authentication Backend:** Located in `backend/app/auth.py`. Uses PyJWT (`HS256`) with `get_current_user` FastAPI dependency.
* **Database & ORM:** Located in `backend/app/database.py`. Uses SQLAlchemy with auto-migration helpers (`_auto_migrate()`) that run before `Base.metadata.create_all()` to add columns cleanly across SQLite and Postgres.
* **Current User Table Schema:**
  * `id`: String (UUID)
  * `email`: String (Unique)
  * `username`: String (Unique)
  * `password_hash`: String
  * `is_admin`, `is_active`: Integer
  * `created_at`, `last_login_at`: DateTime

## 2. Technical Decisions
1. **Model Extension vs New Table:**
   * **Decision:** Add profile columns directly to the `User` model (`display_name`, `avatar_url`, `bio`, `preferences_json`).
   * **Rationale:** A 1-to-1 relationship between user and profile does not warrant a separate table join on every authenticated request. Keeping it in `users` allows `get_current_user` to return the complete profile object with zero additional queries.
2. **Schema Migration:**
   * Add `display_name`, `avatar_url`, `bio`, `preferences_json` to `_auto_migrate()` targets in `database.py` so existing installations update automatically without requiring manual database resets.
3. **Preferences Storage:**
   * Store frontend settings as JSON string in `preferences_json` (e.g. `{"theme": "dark", "persona": "architect", "auto_approve": false}`). This avoids rigid columns for frontend preference evolution.

## 3. Constitution Compliance Check
- [x] **Spec-Driven First:** Spec written and approved prior to implementation.
- [x] **Testing Non-Negotiable:** Requires unit tests in `backend/tests/test_fullstack_features.py` for profile retrieval and update endpoints.
- [x] **Code Quality:** Fully typed Pydantic models for request validation and response serialization.
