# Changelog

All notable changes to Openzess are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- GitHub Actions CI (frontend type-check & build, backend compile check)
- Community health files: CONTRIBUTING, Code of Conduct, Security Policy,
  issue & PR templates, CHANGELOG
- Expanded `.env.example` covering all supported LLM providers

### Changed
- Converted to a **web-only application** — Electron desktop shell retired to
  `frontend/desktop-legacy/` (all features work in the browser)
- Backend restructured into a proper Python package (`backend/app/`)
- Dev utilities moved to `backend/tools/`
- Frontend context providers consolidated under `src/contexts/`

### Fixed
- Production TypeScript build (`npm run build`) — 20+ strict-mode errors
- Plugin loader failing inside package structure
- SQLite fallback for local runs without Docker

## [1.1.0] — 2026-01

### Added
- Multi-agent Debate Arena & WarRoom swarm collaboration
- MCP (Model Context Protocol) server grid with stdio subprocess isolation
- Tavern-compatible persona imports
- Background cron jobs & watchdog workers
- Telegram & Discord bot bridges
- ChromaDB-backed memory vault
- Dynamic Python plugin system

[Unreleased]: https://github.com/rosdebbu/openzess/compare/v1.1.0...HEAD
[1.1.0]: https://github.com/rosdebbu/openzess/releases/tag/v1.1.0
