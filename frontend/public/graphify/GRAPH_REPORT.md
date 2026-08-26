# Graphify Codebase Report — Openzess

**Extraction:** 85% EXTRACTED · 15% INFERRED · 0% AMBIGUOUS  
**Structure:** 19 Nodes · 20 Directed Links · 9 Architectural Communities  

---

## 🏛️ God Nodes (High Connectivity)
1. **OpenzessAgent** (32 Connections) — Core brain orchestrating LiteLLM, ChromaDB RAG, and tool authorization.
2. **FastAPIServer** (24 Connections) — Primary asynchronous REST & WebSocket bridge.
3. **SwarmManager** (18 Connections) — ThreadPool multi-agent coordinator for debate arenas.
4. **PaperBananaPlugin** (15 Connections) — Publication-grade SVG methodology and statistical plot visualizer.
5. **MCPRegistry** (13 Connections) — Model Context Protocol stdio client.

---

## 🔍 Structural Observations & Community Clusters
* **Community 1 (Agent Core):** `OpenzessAgent`, `litellm`, system instructions, and tool executor.
* **Community 2 (Backend & Persistence):** `server.py`, `database.py`, SQLite session hydrator.
* **Community 3 (Swarm Debates):** `swarm_manager.py`, multi-model consensus pipeline.
* **Community 4 (Memory Vault):** `chromadb`, SentenceTransformer embedding, vector search.
* **Community 5 (MCP Ecosystem):** `mcp_manager.py`, dynamic tool conversion.
* **Community 6 (Plugin Framework):** `plugin_loader.py`, `paperbanana_plugin.py`, `system_health.py`.
* **Community 7 (System & Sandbox):** `background_workers.py`, `mss`, `pyautogui`, Debian WSL matrix.
* **Community 8 (Remote Bridges):** `telegram_worker.py`, `discord_worker.py`.
* **Community 9 (Frontend Matrix):** React pages (`Chat.tsx`, `Graphify.tsx`, `DebateArena.tsx`, etc.).
