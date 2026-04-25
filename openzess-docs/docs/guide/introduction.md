# Introduction

OpenZess is an **open-source, self-hosted autonomous agent platform** that gives AI models direct access to your local system through a secure, sandboxed environment.

## The Vision

Most AI chat interfaces are isolated text boxes — they can generate code but can't run it, they can describe files but can't create them. OpenZess breaks this barrier entirely.

When you chat with an OpenZess agent, it can:

- **Execute terminal commands** inside a sandboxed Linux environment
- **Create, read, and edit files** on your system
- **Search the web** and scrape URLs for live information
- **Control a virtual desktop** via mouse and keyboard
- **Schedule background tasks** that run autonomously
- **Connect to external services** via the Model Context Protocol (MCP)

## Core Philosophy

### 1. Safety First
Every command executes inside a **Debian WSL sandbox**. The agent physically cannot touch your Windows host. Even GUI interactions are trapped inside an invisible X11 virtual display.

### 2. Provider Agnostic
OpenZess doesn't lock you into a single AI provider. Through [LiteLLM](https://docs.litellm.ai/), it routes to **10+ providers** including Google Gemini, OpenAI, Anthropic, Groq, DeepSeek, Qwen, and local Ollama models.

### 3. Extensible by Design
The plugin system supports two extension mechanisms:
- **MCP Servers**: Industry-standard protocol for connecting external tools
- **Python Plugins**: Drop a `.py` file into `backend/plugins/` and it's instantly available to your agent

## System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| OS | Windows 10 + WSL2 | Windows 11 + WSL2 |
| RAM | 4 GB | 8 GB+ |
| Node.js | v18+ | v20+ |
| Python | 3.10+ | 3.12+ |
| Browser | Chrome/Edge | Chrome |
