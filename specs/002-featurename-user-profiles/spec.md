# Feature Specification: User Profiles & Customization

**Feature Branch**: `002-featurename-user-profiles`  
**Created**: 2026-10-04  
**Status**: Ready for Implementation  
**Input**: User description: "User Profiles feature allowing users to manage their identity, bio, avatar, and workspace preferences."

---

## 1. Overview & Motivation
Openzess currently supports user authentication (`register`, `login`, `me`) and binds session/note ownership to a `user_id`. However, users cannot configure a custom display name, bio, avatar image, or synchronize their workspace preferences (such as dark/light theme, default persona, and tool permissions) across devices. 

This feature adds a first-class **User Profile** data model and UI, enabling users to personalize their Openzess workspace and maintain their settings consistently.

---

## 2. User Scenarios & Acceptance Criteria

### User Story 1 - View & Edit Profile Information (Priority: P1)
As an authenticated Openzess user, I want to view and edit my profile (display name, bio, and avatar) so that my workspace reflects my identity.

* **Why this priority:** Core functionality needed for user personalization.
* **Independent Test:** Authenticate via JWT, send `PUT /api/auth/profile`, and verify `GET /api/auth/profile` returns updated details.
* **Acceptance Scenarios:**
  1. **Given** an authenticated user, **When** they update their display name and bio via the profile settings, **Then** the updated values are persisted in the database and returned on subsequent `/api/auth/profile` requests.
  2. **Given** an unauthenticated request to `/api/auth/profile`, **When** sent to the server, **Then** an HTTP 401 Unauthorized response is returned.

---

### User Story 2 - User Workspace Preferences Synchronization (Priority: P2)
As a user who switches between devices (laptop, desktop, tablet), I want my preferences (theme, default persona, auto-approve tools) saved to my profile so I don't have to reconfigure them in every browser.

* **Why this priority:** Eliminates friction when using Openzess in multi-device or remote server environments.
* **Independent Test:** Update preferences via API, log in from a fresh incognito window, and verify preferences are restored.
* **Acceptance Scenarios:**
  1. **Given** a user changes their theme to "dark" and default persona to "coder", **When** they save preferences, **Then** the `preferences_json` field updates and persists across logins.

---

### User Story 3 - Avatar Selection & Display in UI (Priority: P3)
As a user chatting with agent personas, I want my avatar visible next to my chat messages and in the sidebar navigation header.

* **Why this priority:** Visual polish and clear distinction between user and agent messages.
* **Independent Test:** Set an avatar image URL or pick an avatar preset, then observe it rendered next to user chat bubbles.
* **Acceptance Scenarios:**
  1. **Given** a user sets an avatar URL, **When** they send messages in Chat, **Then** the user message avatar reflects their chosen image.

---

## 3. Assumptions & Scope Boundaries
- **Authentication Dependency:** Reuses the existing JWT authentication flow in `backend/app/auth.py`.
- **Database Support:** Works on both SQLite (`~/.openzess/chat_history.db`) and PostgreSQL via SQLAlchemy.
- **Backward Compatibility:** Existing users without profile records will default gracefully (display name defaults to username).
