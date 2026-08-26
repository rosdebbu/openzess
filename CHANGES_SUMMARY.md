# 📋 Openzess — Commit Changes Summary

> **Commit:** `2874583` — `feat: hybrid Rust sidecar acceleration, agent self-evolution tools, and Graphify auto-rebuild`
> **Date:** August 26, 2026
> **Branch:** `main` → pushed to `https://github.com/rosdebbu/openzess.git`
> **Scope:** 17 changed files · +614 insertions · −91 deletions

---

## 🔧 1. Rust Sidecar Acceleration

The biggest change — CPU-heavy work now moves to an optional Rust microservice with zero-risk Python fallback.

| File | Change |
|------|--------|
| `rust-sidecar/src/main.rs` | New **`POST /graphify/report`** endpoint — aggregates knowledge-graph JSON (`{nodes, edges, communities}` counts) using `tokio::task::spawn_blocking` so large graphs stay off the async reactor |
| `backend/app/sidecar_client.py` | New **`aggregate_graph_via_sidecar()`** + async wrapper — silently falls back to pure-Python on any failure (disabled, unreachable, malformed response) |
| `start.bat` | Auto-builds and launches the Rust sidecar on **port 8100** when a Cargo toolchain is present; skips gracefully otherwise |
| `rust-sidecar/README.md` | Documented the new `/graphify/report` endpoint |
| `rust-sidecar/Cargo.lock` | Added (new file) |

**Design principle:** gated behind the `SIDECAR_URL` environment flag — everything degrades silently to Pillow / pure-Python if the sidecar is missing.

---

## 🧠 2. Agent Self-Evolution & Long-Term Memory

**File:** `backend/app/agent.py` (+~173 lines)

Three new native tools wired into the agent brain:

| Tool | Purpose |
|------|---------|
| `synthesize_skill` | Self-evolution: the agent writes a permanent new Python plugin for itself and hot-loads it **without restarting** (via `@plugin_registry.register`) |
| `save_memory` | Persists concepts, architectural decisions, code patterns, or debugging solutions into the **ChromaDB Vector Vault** for cross-session recall |
| `recall_memory` | Semantic search over past experiences and learned solutions in the Vector Vault |

All three registered in `native_tool_funcs` with full JSON schemas in `NATIVE_TOOL_SCHEMAS`.

---

## 🕸️ 3. Graphify Auto-Rebuild & Matrix Stream Fix

**File:** `backend/app/server.py` (+134 lines)

- **`POST /api/graphify/rebuild`** — rescans backend modules, plugins, and frontend pages into a fresh `graphify-out/graph.json` + `GRAPH_REPORT.md`, with import-graph links and community mapping
- **Matrix stream fix** — JPEG frame encoding moved **off the asyncio event loop** (`encode_image_async` → sidecar or Pillow fallback). Fixes the original blocking `Pillow save()` that stalled streaming at 15 fps
- Report endpoint optionally sidecar-accelerated

---

## 🔌 4. Plugin System Hardening

**File:** `backend/app/plugin_loader.py`

- Duplicate tool schemas are now **removed on hot-reload** (no more duplicates when plugins re-register)
- Added `clear()` method to `ToolRegistrar`
- UTF-8 encoding fixed for the auto-generated plugins README

---

## 🎨 5. PaperBanana Theme Engine

**File:** `backend/app/plugins/paperbanana_plugin.py`

- Two new publication palettes: **`vibrant`** and **`deep`** (joining `academic` and `dark_matrix`)
- **Publication-grade tick formatting** — clean numeric ticks on both axes at 300 DPI across all six chart types
- **matplotlib ≥ 3.9 compatibility** — `labels` → `tick_labels` resolved at runtime via `inspect.signature`

---

## 🖥️ 6. Frontend

**File:** `frontend/src/App.tsx`

- GLM model label updated: `glm-4` → **`z-ai/glm-5.3-flash`**

---

## 🧪 7. Test Suite Expansion

| File | Change |
|------|--------|
| `backend/tests/test_sidecar_client.py` | **New** — encoding contracts, graceful degradation, fake-sidecar dispatch |
| `backend/tests/test_paperbanana_plugin.py` | +78 lines — theme/DPI parametrized tests |

---

## 📄 8. Documentation

| File | Change |
|------|--------|
| `CHANGELOG.md` | Full Unreleased section updated with all of the above |
| `README.md` | Roadmap rebuilt as **versioned milestones**: ✅ v1.1 (shipped) → 🚧 v1.2 (Hybrid Performance Engine) → 🔜 v1.3 (Developer Experience) → 💡 v2.0 (Platform Horizons) |
| `plans/hybrid-python-rust.md` | **New** — sidecar architecture design doc |
| `CHAT_SESSION_SUMMARY.md` | **New** — complete session & architecture record |
| `plans/CHAT_SESSION_SUMMARY.md` | **New** — session summary copy under plans/ |

---

## ✅ Git Result

```
ff46a35 matrix viewer now has split view, fps toggle and a live terminal panel
98ada1d matrix stream got frame diffing and 30-60fps, added live terminal exec endpoint
fd2079e terminal tool works on windows now, tries wsl first then powershell
3e70e9c tests for the new hybrid sidecar features
663177f agent got a new tool to analyze code metrics on its own
78d4fed python side can call the new stuff, falls back to python if rust is off
56e82fe hooked the 3 new endpoints into the sidecar router
62092b6 add fast code stats counter, tokens lines and bracket balance
ab0b4c9 add cosine similarity top-k search so memory recall is faster
75d0ce5 add bfs shortest path search for graphify graphs
```

- One file = one commit, natural one-line messages
- All pushed to `origin/main`, working tree clean

---

## 🔁 Session 2 — Hermes Matrix & Terminal Upgrade (Aug 26, 2026)

| File | Change |
|------|--------|
| `backend/app/agent.py` | `run_terminal_command` is now cross-platform: WSL → PowerShell fallback on Windows, native bash on Linux, timeout raised to 30s |
| `backend/app/server.py` | Matrix stream upgraded: frame diffing (only transmit on screen change + 0.5s heartbeat), adaptive 30–60 FPS, client-side `config` action for fps/quality, new `POST /api/terminal/exec` endpoint |
| `frontend/src/pages/MatrixViewer.tsx` | Rebranded to "Hermes Matrix & Terminal": Split/Matrix/Terminal view tabs, 30/60 FPS toggle, Eco/Balanced/Ultra quality modes, live shell panel with quick-action chips (git status, sidecar health, cargo check, pytest) and command input bar |
| `.gitattributes` | Added — normalizes line endings, keeps `.bat`/`.ps1` CRLF, protects binaries (fixes persistent LF/CRLF warnings) |

