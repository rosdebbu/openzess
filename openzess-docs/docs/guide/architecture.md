# System Architecture

OpenZess follows a clean three-layer architecture optimized for real-time AI agent interaction.

## High-Level Overview

```
┌─────────────────────────────────────────────────────┐
│                    Browser (React)                    │
│  ┌──────┐ ┌────────┐ ┌───────┐ ┌────────┐ ┌──────┐ │
│  │ Chat │ │Sessions│ │Matrix │ │WarRoom │ │Tavern│ │
│  └──┬───┘ └───┬────┘ └──┬────┘ └───┬────┘ └──┬───┘ │
│     │         │         │          │          │      │
│     └─────────┴────┬────┴──────────┴──────────┘      │
│                    │ HTTP / WebSocket                  │
└────────────────────┼──────────────────────────────────┘
                     │
┌────────────────────┼──────────────────────────────────┐
│              FastAPI Server (server.py)                │
│  ┌─────────────┐ ┌────────────┐ ┌──────────────────┐ │
│  │ OpenzessAgent│ │MCP Manager │ │Background Workers│ │
│  │  (agent.py) │ │(mcp_mgr.py)│ │ (cron/watchdog)  │ │
│  └──────┬──────┘ └─────┬──────┘ └────────┬─────────┘ │
│         │              │                  │            │
│  ┌──────┴──────┐ ┌─────┴──────┐ ┌────────┴─────────┐ │
│  │   LiteLLM   │ │ MCP Servers│ │  Plugin Loader   │ │
│  │ (10+ models)│ │(Stitch etc)│ │  (hot-loading)   │ │
│  └─────────────┘ └────────────┘ └──────────────────┘ │
│                                                        │
│  ┌──────────────┐ ┌─────────────┐ ┌────────────────┐ │
│  │  PostgreSQL  │ │  ChromaDB   │ │  Xvfb + X11    │ │
│  │   (Neon)     │ │(Memory Vault│ │ (Matrix View)  │ │
│  └──────────────┘ └─────────────┘ └────────────────┘ │
└───────────────────────────────────────────────────────┘
```

## Component Breakdown

### Frontend (`frontend/`)
- **Framework**: React 19 + Vite 8
- **Styling**: Tailwind CSS with custom design tokens
- **Animations**: Framer Motion
- **Routing**: React Router v7

**Key Pages** (21 total):

| Page | Purpose |
|------|---------|
| `Chat.tsx` | Primary AI chat interface with voice control |
| `MatrixViewer.tsx` | Real-time X11 desktop streaming |
| `WarRoom.tsx` | Multi-agent swarm debate interface |
| `DebateArena.tsx` | Structured AI debate with turns |
| `Tavern.tsx` | Persona-based roleplay chat |
| `Sessions.tsx` | Chat session history browser |
| `KnowledgeBase.tsx` | Personal notes & canvas |
| `Skills.tsx` | Agent skill management |
| `Channels.tsx` | Telegram/Discord bot configuration |
| `CronJobs.tsx` | Background task scheduler |
| `MCP.tsx` | MCP server connection manager |
| `Marketplace.tsx` | Plugin marketplace browser |
| `Companion.tsx` | VRM 3D avatar companion |

### Backend (`backend/`)

| File | Responsibility |
|------|---------------|
| `server.py` | FastAPI application with 30+ REST endpoints |
| `agent.py` | Core LLM agent with tool execution loop |
| `database.py` | SQLAlchemy ORM for Neon PostgreSQL |
| `mcp_manager.py` | MCP client connection manager |
| `plugin_loader.py` | Dynamic Python plugin hot-loader |
| `swarm_manager.py` | Multi-agent parallel execution engine |
| `background_workers.py` | Cron scheduler and filesystem watchdog |
| `tavern_parser.py` | TavernAI character card importer |
| `telegram_worker.py` | Telegram bot integration |
| `discord_worker.py` | Discord bot integration |

## Data Flow

1. **User sends message** → Frontend `POST /api/chat` with SSE streaming
2. **Server creates session** → Stored in PostgreSQL via SQLAlchemy
3. **Agent processes** → LiteLLM routes to selected provider
4. **Tool calls detected** → Agent pauses, frontend shows approval dialog
5. **User approves** → `POST /api/chat/approve` executes tools in sandbox
6. **Results streamed** → SSE chunks flow back to the React UI
7. **Memory saved** → Important context stored in ChromaDB vector database
