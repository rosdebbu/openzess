# Changelog

## v2.0.0 (August 2026) 🦎

### 📟 Hermes-Grade Cyberpunk Terminal TUI
- Full-featured interactive terminal interface (`openzess` in Debian WSL / `.\openzess.bat` on Windows).
- 3D ASCII Lizard Mascot branding in Deep/Olive Lizard Green (`#16a34a`).
- Categorized live capabilities card and turn delimiters.
- Real-time token streaming with sub-second latency tracking.
- Interactive slash commands: `/model`, `/habits`, `/skills`, `/memory`, `/clear`, `/help`, `/exit`.

### 🧠 Autonomous Habit Profiler & Self-Growth Engine
- Created `habit_learner.py` implementing closed dialectic learning loop inspired by Honcho & Hermes Agent.
- Automatically infers user coding preferences, environment targets, and communication styles.
- Persists behavioral habits as vector embeddings in ChromaDB.
- Automatically injects adaptive user profile into system prompts on subsequent sessions.

### ⚡ Hybrid Architecture & Performance Optimization
- 70% Python flexibility for agent reasoning and plugin hot-loading.
- 30% Rust Axum sidecar (`port 8100`) for high-throughput image encoding and compute offload.
- Instant SSE token streaming and lazy React message bubble allocation.
- 100% green test suite (86 passing pytest unit tests).

---

## v1.1.0 (April 2026)

### 🌐 Cloud Database Migration
- Migrated from local SQLite to **Neon Serverless PostgreSQL**
- All 153 existing sessions safely transferred to cloud
- Added connection pooling (`pool_size=10`, `max_overflow=20`)
- Automatic SQLite fallback for local development

### 🎙️ Voice Control
- Added **Speech Recognition** with continuous listening
- Implemented 2.5-second silence detection for auto-submit
- Hands-free agent interaction loop

### 🛡️ Security Hardening
- Fixed DISPLAY port mismatch (`:99` → `:100`) for Matrix Viewer stability
- Added proper `psycopg2-binary` dependency management in WSL

---

## v1.0.0 (March 2026)

### 🚀 Initial Release
- Multi-provider LLM routing via LiteLLM
- 13 native tools including terminal, file system, and web access
- Matrix Viewer with X11 virtual desktop streaming
- MCP Plugin System (stdio + SSE + Streamable HTTP)
- Custom Python Plugin hot-loading
- Swarm/War Room multi-agent debates
- TavernAI character card import
- Telegram & Discord bot integrations
- ChromaDB Memory Vault
- Cron Jobs & Filesystem Watchdogs
- Knowledge Base / Canvas notes system
- OpenAI & Anthropic compatible API endpoints
- Text-to-Speech engine
