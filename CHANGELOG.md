# Changelog

All notable changes to Openzess are documented in this file.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **Rust acceleration sidecar** (`rust-sidecar/`) — optional Axum microservice with
  `/health`, `/image/encode` and `/graphify/report` endpoints; Python integration via
  `backend/app/sidecar_client.py` featuring silent Pillow/pure-Python fallback,
  gated behind the new `SIDECAR_URL` environment flag
- **Hybrid Matrix stream encoding** — frame compression now runs off the asyncio
  event loop through the sidecar client (fixes blocking Pillow save at 15 fps)
- **Graphify dynamic auto-rebuild** — `POST /api/graphify/rebuild` rescans backend
  modules, plugins and frontend pages into a fresh `graphify-out/graph.json` +
  `GRAPH_REPORT.md`; report endpoint optionally sidecar-accelerated
- **PaperBanana theme engine** — four publication palettes (`academic`,
  `dark_matrix`, `vibrant`, `deep`) for diagrams; statistical plots gain clean
  numeric tick formatting at 300 DPI across all six chart types
- **Test suite expansion** — `test_sidecar_client.py` (encoding contracts, graceful
  degradation, fake-sidecar dispatch) and PaperBanana theme/DPI parametrized tests
- Benchmark harness `scripts/bench_sidecar.py` comparing Pillow vs Rust encoding
- `start.bat` auto-builds and launches the sidecar when a Rust toolchain is present
- GitHub Actions CI (frontend type-check & build, backend compile check)
- Community health files: CONTRIBUTING, Code of Conduct, Security Policy,
  issue & PR templates, CHANGELOG
- Expanded `.env.example` covering all supported LLM providers plus sidecar flags
- README roadmap rebuilt as versioned milestones (v1.1 shipped → v2.0 exploring)

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
