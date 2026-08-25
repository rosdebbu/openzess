<p align="center">
  <img src="docs/assets/welcome-screen.png" alt="Openzess — AI Workspace" width="720" />
</p>

<h1 align="center">Openzess</h1>
<p align="center"><strong>The open-source, multi-agent AI workspace — built for builders.</strong></p>

<p align="center">
  <a href="https://github.com/rosdebbu/openzess"><img alt="GitHub" src="https://img.shields.io/badge/GitHub-rosdebbu%2Fopenzess-181717?style=for-the-badge&logo=github"></a>
  <a href="https://github.com/rosdebbu/openzess/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/rosdebbu/openzess/actions/workflows/ci.yml/badge.svg?style=for-the-badge"></a>
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-69%25-3178C6?style=for-the-badge&logo=typescript&logoColor=white">
  <img alt="Python" src="https://img.shields.io/badge/Python-27%25-3776AB?style=for-the-badge&logo=python&logoColor=white">
  <img alt="License" src="https://img.shields.io/badge/License-MIT-22c55e?style=for-the-badge">
  <img alt="Version" src="https://img.shields.io/badge/Version-1.1.0-A89080?style=for-the-badge">
  <a href="https://github.com/rosdebbu/openzess/discussions"><img alt="Discussions" src="https://img.shields.io/badge/Discussions-Welcome-8B5CF6?style=for-the-badge&logo=github"></a>
</p>

<p align="center">
  <a href="#-demo">Demo</a> •
  <a href="#-features">Features</a> •
  <a href="#%EF%B8%8F-architecture">Architecture</a> •
  <a href="#-getting-started">Getting Started</a> •
  <a href="#-technology-stack">Tech Stack</a> •
  <a href="#-contributing">Contributing</a>
</p>

---

## Overview

**Openzess** is a full-stack, provider-agnostic AI workspace that gives you complete control over how AI agents operate, collaborate, and integrate into your development workflow. Unlike closed ecosystems, Openzess lets you bring **any** LLM provider — Gemini, OpenAI, Anthropic, DeepSeek, Groq, Qwen, Ollama, and more — and orchestrates them through a unified, production-grade interface.

It ships with a **multi-agent debate engine**, **parallel swarm execution**, **MCP protocol support**, **Tavern-compatible persona imports**, **background task scheduling**, and a full **tool-calling runtime** — all wrapped in a polished React + FastAPI application.

---

## 🎬 Demo

### ▶️ Application Walkthrough

<p align="center">
  <img src="docs/assets/demo-walkthrough.webp" alt="Openzess — Full Application Walkthrough" width="720" />
</p>

<p align="center"><em>Dark mode walkthrough — navigating Chat, Debate Arena, Tavern, and more.</em></p>

### ▶️ Login & Boot Sequence

<p align="center">
  <img src="docs/assets/demo-login.webp" alt="Openzess — Boot Sequence & Login" width="720" />
</p>

<p align="center"><em>Cinematic boot sequence with provider authentication flow.</em></p>

---

## 📸 Screenshots

<table>
<tr>
<td width="50%">

**Chat Dashboard — Light Mode**
<img src="docs/assets/dashboard-light.png" alt="Dashboard Light" width="100%" />

</td>
<td width="50%">

**Chat Dashboard — Dark Mode**
<img src="docs/assets/dashboard-dark.png" alt="Dashboard Dark" width="100%" />

</td>
</tr>
<tr>
<td width="50%">

**Warroom Debate — Multi-Agent Consensus**
<img src="docs/assets/warroom-debate.png" alt="Warroom Debate" width="100%" />

</td>
<td width="50%">

**CollaborationRoom — Parallel Swarm**
<img src="docs/assets/collaboration-room.png" alt="CollaborationRoom" width="100%" />

</td>
</tr>
<tr>
<td width="50%">

**Agent Skills & Personas**
<img src="docs/assets/agent-skills.png" alt="Agent Skills" width="100%" />

</td>
<td width="50%">

**MCP Protocol Grid**
<img src="docs/assets/mcp-grid.png" alt="MCP Grid" width="100%" />

</td>
</tr>
<tr>
<td width="50%">

**Tavern — Multi-Character Personas**
<img src="docs/assets/tavern-personas.png" alt="Tavern Personas" width="100%" />

</td>
<td width="50%">

**Debate Arena — Sequential Consensus**
<img src="docs/assets/debate-arena.png" alt="Debate Arena" width="100%" />

</td>
</tr>
</table>

---

## ✨ Features

### 🧠 Core Intelligence

| Feature | Description |
|---------|-------------|
| **Universal Provider Support** | Gemini, OpenAI, Anthropic, Groq, DeepSeek, Qwen, GLM, Kimi, Ollama (local). Swap models at runtime. |
| **Tool-Calling Runtime** | Terminal execution, file I/O, code editing, web search, URL scraping — all with human-in-the-loop approval. |
| **Streaming Chat** | Real-time SSE-based streaming with full Markdown rendering and syntax highlighting. |
| **Session Persistence** | SQLite-backed conversation history with session management and cross-device hydration. |

### ⚔️ Multi-Agent Systems

| Feature | Description |
|---------|-------------|
| **Warroom Debate** | Sequential multi-round debate engine — agents argue, critique, and reach consensus. A Judge synthesizes the verdict. |
| **CollaborationRoom** | Parallel swarm dispatch — up to 10 agents across different providers respond simultaneously. |
| **Agent Personas** | Pre-configured roles (Architect, Scraper, CodeGen) with full custom persona support. |
| **Tavern Card Import** | Import SillyTavern/TavernAI `.png` and `.json` character cards for multi-character roleplaying. |

### 🔌 Extensibility & Integration

| Feature | Description |
|---------|-------------|
| **MCP Protocol** | Model Context Protocol support — connect external tools (GitHub, PostgreSQL, Filesystem, etc.) via stdio or SSE transports. |
| **Background Workers** | Cron job scheduler and filesystem watchdog for automated task execution. |
| **Channels** | Telegram and Discord bot bridges — extend Openzess conversations to messaging platforms. |
| **Developer API** | OpenAI-compatible and Anthropic-compatible REST endpoints (`/v1/chat/completions`, `/v1/messages`). |

### 🎨 Interface & Experience

| Feature | Description |
|---------|-------------|
| **Light & Dark Themes** | Full dual-theme support with smooth transitions. |
| **Graphify** | Visual knowledge graph renderer for relationship mapping. |
| **Canvas / Knowledge Base** | Structured document viewer and content workspace. |
| **TTS Engine** | Built-in text-to-speech synthesis via gTTS. |
| **Matrix Viewer** | Virtual display streaming interface for remote desktop interaction. |

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React + Vite)                      │
│                                                                      │
│  ┌───────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────────────┐ │
│  │   Chat    │ │  Debate  │ │ Collab     │ │  MCP / Skills /      │ │
│  │ Dashboard │ │  Arena   │ │ Room       │ │  Tavern / Settings   │ │
│  └─────┬─────┘ └────┬─────┘ └─────┬──────┘ └──────────┬───────────┘ │
│        │             │             │                    │             │
│        └─────────────┴─────────────┴────────────────────┘             │
│                              │ REST + SSE                            │
└──────────────────────────────┼───────────────────────────────────────┘
                               │
┌──────────────────────────────┼───────────────────────────────────────┐
│                     BACKEND (FastAPI + Python)                        │
│                               │                                      │
│  ┌────────────────────────────▼──────────────────────────────────┐   │
│  │                    server.py (API Router)                      │   │
│  └───┬──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────┘   │
│      │      │      │      │      │      │      │      │             │
│  ┌───▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──┐┌──▼──────┐   │
│  │Agent ││Swarm││MCP  ││Cron ││Tele-││Disc-││TTS  ││Database │   │
│  │Core  ││Mgr  ││Mgr  ││Jobs ││gram ││ord  ││gTTS ││SQLite   │   │
│  └──┬───┘└──┬──┘└──┬──┘└─────┘└─────┘└─────┘└─────┘└─────────┘   │
│     │       │      │                                                │
│  ┌──▼───────▼──────▼──────────────────────────────────────────┐     │
│  │            LiteLLM Universal Provider Gateway               │     │
│  │  Gemini │ OpenAI │ Anthropic │ DeepSeek │ Groq │ Ollama    │     │
│  └─────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Breakdown

| Layer | Technology | Responsibility |
|-------|-----------|----------------|
| **Frontend** | React 18 + TypeScript + Vite | UI, routing, state management, SSE streaming |
| **Backend** | FastAPI + Python 3.11+ | API routing, agent orchestration, tool execution |
| **Agent Core** | LiteLLM + Custom Tool Runtime | Multi-provider LLM calls, function calling, approval flow |
| **Swarm Manager** | Async Python | Parallel multi-agent dispatch and debate orchestration |
| **MCP Manager** | stdio/SSE subprocess | External tool protocol connections |
| **Database** | SQLAlchemy + SQLite | Session storage, message history, persona management |
| **Channels** | python-telegram-bot, discord.py | Cross-platform messaging bridges |
| **Memory** | ChromaDB (vector store) | Semantic memory vault for agent context |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **Git**
- At least one LLM API key (Gemini, OpenAI, etc.) — or use **Ollama** for fully local operation

### 1. Clone the Repository

```bash
git clone https://github.com/rosdebbu/openzess.git
cd openzess
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://openzess:password@localhost:5432/openzess
```

> **Note:** SQLite is used by default. PostgreSQL is optional for production deployments.

### 3. Install Dependencies

**Backend:**
```bash
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # Linux/macOS
pip install -r requirements.txt
```

**Frontend:**
```bash
cd frontend
npm install
cd ..
```

### 4. Run the Application

#### Option A — One-Command Start (Windows)

```bat
start.bat
```

#### Option B — One-Command Start (Linux / WSL)

```bash
chmod +x scripts/start_wsl.sh
./scripts/start_wsl.sh
```

#### Option C — Manual Start

**Terminal 1 — Backend:**
```bash
cd backend
uvicorn app.server:app --host 0.0.0.0 --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
```

#### Option D — Docker (PostgreSQL)

```bash
docker-compose up --build
```

### 5. Access the Application

Open your browser and navigate to:

```
http://localhost:5173
```

You will be greeted by the boot sequence. Select a provider and enter your API key to begin.

---

## 🛠 Technology Stack

<table>
<tr>
<td valign="top" width="50%">

### Frontend
- **React 18** — Component architecture
- **TypeScript** — Type-safe development
- **Vite 8** — Sub-second HMR
- **Framer Motion** — Page transitions & micro-animations
- **React Router** — SPA routing
- **React Markdown** — Rich content rendering
- **Lucide Icons** — Consistent iconography
- **TailwindCSS** — Utility-first styling

</td>
<td valign="top" width="50%">

### Backend
- **FastAPI** — High-performance async API
- **LiteLLM** — Universal LLM gateway
- **SQLAlchemy** — ORM & migrations
- **ChromaDB** — Vector memory store
- **python-telegram-bot** — Telegram integration
- **discord.py** — Discord integration
- **gTTS** — Text-to-speech engine
- **BeautifulSoup** — Web scraping

</td>
</tr>
</table>

---

## 📁 Project Structure

```
openzess/
├── frontend/                      # React + TypeScript web SPA (browser-based)
│   └── src/
│       ├── pages/                 # 22 feature pages
│       │   ├── Chat.tsx           # Main AI chat interface
│       │   ├── DebateArena.tsx    # Sequential multi-agent debate
│       │   ├── WarRoom.tsx        # Parallel swarm collaboration
│       │   ├── Tavern.tsx         # Character persona imports
│       │   ├── Skills.tsx         # Agent persona management
│       │   ├── MCP.tsx            # Model Context Protocol grid
│       │   ├── Channels.tsx       # Telegram & Discord bridges
│       │   ├── CronJobs.tsx       # Background task scheduler
│       │   ├── Graphify.tsx       # Knowledge graph viewer
│       │   ├── KnowledgeBase.tsx  # Document canvas
│       │   └── ...                # 12 more feature pages
│       ├── components/            # Sidebar, transitions, avatars
│       ├── contexts/              # Theme & toast providers
│       └── utils/                 # Persona definitions
│
├── backend/                       # FastAPI + Python services
│   ├── app/                       # Application package
│   │   ├── server.py              # Main API router (1000+ lines)
│   │   ├── agent.py               # LiteLLM agent with tool calling
│   │   ├── database.py            # SQLAlchemy models & queries
│   │   ├── swarm_manager.py       # Multi-agent orchestration
│   │   ├── mcp_manager.py         # MCP protocol handler
│   │   ├── background_workers.py  # Cron & watchdog services
│   │   ├── telegram_worker.py     # Telegram bot bridge
│   │   ├── discord_worker.py      # Discord bot bridge
│   │   ├── tavern_parser.py       # SillyTavern card importer
│   │   ├── plugin_loader.py       # Dynamic plugin system
│   │   └── plugins/               # Drop-in Python tool plugins
│   ├── tools/                     # Dev utilities (DB migration, MCP test)
│   ├── requirements.txt           # Python dependencies
│   └── chroma_db/, chat_history.db  # Runtime data (gitignored)
│
├── prototype/                     # Early CLI prototypes (not part of the app)
├── scripts/                       # Helper scripts (WSL sandbox, tests)
├── docs/assets/                   # Screenshots & demo videos
├── openzess-docs/                 # Documentation site (VitePress)
├── docker-compose.yml             # PostgreSQL container
├── start.bat                      # Windows launch script (one-click)
├── .env.example                   # Environment template
├── LICENSE                        # MIT
└── README.md
```

---

## 🔐 Security Considerations

- **API keys** are stored client-side in `localStorage` and transmitted per-request — never persisted server-side
- **Tool execution** requires explicit human-in-the-loop approval before any terminal command runs
- **MCP connections** use subprocess isolation via stdio transport
- **CORS** is configured for local development — restrict `allow_origins` in production
- **Environment variables** isolate sensitive backend configuration

---

## 🗺️ Roadmap

- [ ] **Plugin Marketplace** — Community-contributed agent skills and MCP servers
- [ ] **Voice Interface** — Real-time voice input/output with Whisper + TTS
- [ ] **Cloud Deployment** — One-click Render/Vercel deployment pipeline
- [ ] **Multi-user Auth** — Role-based access control for team environments
- [ ] **Agent Memory** — Persistent long-term memory across sessions via ChromaDB
- [ ] **Mobile Responsive** — Full mobile-first responsive layout
- [ ] **Simulation Mode** — Dry-run tool execution for safe testing

---

## 🤝 Contributing

Contributions are welcome from AI engineers, full-stack developers, and open-source enthusiasts.

### How to Contribute

1. **Fork** this repository
2. **Create** a feature branch
   ```bash
   git checkout -b feat/your-feature
   ```
3. **Commit** changes with conventional commits
   ```bash
   git commit -m "feat: add your feature"
   ```
4. **Push** to your branch
   ```bash
   git push origin feat/your-feature
   ```
5. **Open** a Pull Request

### Development Guidelines

- Follow existing code style and component patterns
- Add TypeScript types for all new props/interfaces
- Test with at least two LLM providers before submitting
- Update documentation for user-facing changes

---

## 👨‍💻 Author

**Built by [@rosdebbu](https://github.com/rosdebbu)**

Openzess is an open-source project created to give developers full ownership over their AI workspace — no vendor lock-in, no closed ecosystems, just raw control.

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <sub>Built with TypeScript, Python, and a lot of coffee. ☕</sub>
</p>
