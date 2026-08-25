# OpenZess — Agent & Swarm Architecture

A deep technical blueprint of how **OpenZess** handles single-agent reasoning, long-term memory, and multi-agent swarms.

---

## 🧠 Core Agent Anatomy (`OpenzessAgent`)

The core agent (`backend/app/agent.py`) is designed around a multi-provider execution loop:

```mermaid
flowchart TD
    Prompt[User Input / Prompt] --> RAG[ChromaDB Vector Retrieval]
    RAG --> Context[Augmented Context Injection]
    Context --> LiteLLM[LiteLLM Provider Router]
    
    LiteLLM --> Decision{Requires Tool?}
    Decision -- No --> StreamOut[Stream Response to SSE / UI]
    Decision -- Yes --> SecurityCheck{Dangerous Tool?}
    
    SecurityCheck -- Yes --> AuthGate[Emit 'auth_required' Event]
    SecurityCheck -- No --> ToolExec[Execute Native Python / MCP Tool]
    
    AuthGate --> UserApproval[User Confirms in UI]
    UserApproval --> ToolExec
    ToolExec --> MemoryIngest[Ingest Interaction to ChromaDB]
    MemoryIngest --> Loop[Feed Tool Output back to LLM]
    Loop --> LiteLLM
```

---

## ⚔️ Swarm Debate Arena (`SwarmManager`)

The Swarm Manager (`backend/app/swarm_manager.py`) coordinates multi-model debates across distinct cognitive personas:

* **Lead Strategist:** Proposes the high-level architecture and system breakdown.
* **Devil's Advocate (Critic):** Aggressively tests assumptions, vulnerabilities, and edge cases.
* **Performance Optimizer:** Evaluates token latency, algorithmic complexity, and scaling limits.
* **Consensus Judge:** Synthesizes the debate into a finalized, actionable consensus.

---

## 🔌 Tool Ecosystem
1. **Dynamic Python Plugins:** Hot-loaded from `backend/app/plugins/` using `@plugin_registry.register`.
2. **PaperBanana Visualizer:** Vector SVG methodology diagrams and 300 DPI matplotlib/seaborn charts.
3. **Desktop Matrix Control:** Native PyAutoGUI & Xvfb mouse/keyboard/screen automation.
4. **Model Context Protocol (MCP):** Stdio JSON-RPC client connecting external MCP tools.
