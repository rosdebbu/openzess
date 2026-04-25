# Changelog

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
