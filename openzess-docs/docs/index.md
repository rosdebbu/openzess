---
layout: home

hero:
  name: "OpenZess"
  text: "Autonomous Agent Matrix"
  tagline: Build, deploy, and orchestrate AI agents with native tool access, multi-provider LLM routing, and a sandboxed Linux environment.
  actions:
    - theme: brand
      text: Get Started →
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/rosdebbu/openzess

features:
  - icon: 🧠
    title: Multi-Provider LLM Engine
    details: Route prompts to Gemini, OpenAI, Anthropic, Groq, DeepSeek, Qwen, GLM, Kimi, or local Ollama models — all through a single unified interface powered by LiteLLM.
  - icon: 🛡️
    title: Sandboxed Execution
    details: All terminal commands execute inside an isolated Debian WSL sandbox. Your host Windows machine is never exposed. Safety-first by design.
  - icon: 💻
    title: Matrix Viewer
    details: Watch your AI agent interact with an invisible X11 Linux desktop in real-time via WebSocket streaming. Click, type, and browse — all inside the matrix.
  - icon: 🔌
    title: MCP Plugin Ecosystem
    details: Connect to any Model Context Protocol server (Stitch, Prisma, custom tools) via stdio or HTTP transport. Hot-plug external capabilities into your agent's brain.
  - icon: 🌐
    title: Cloud-Native Database
    details: Powered by Neon Serverless PostgreSQL. All sessions, messages, personas, and notes persist safely in the cloud with zero local file risk.
  - icon: ⚔️
    title: Swarm Intelligence
    details: Deploy multiple AI agents simultaneously in the War Room. Watch them debate, critique, and synthesize solutions collaboratively in real-time.
---

## Why OpenZess?

OpenZess is not just another chatbot UI. It is a **full operating system for AI agents** — a complete environment where autonomous agents can execute code, browse the web, manage files, and even control a virtual desktop.

Built by [Debjit Das](https://github.com/rosdebbu), OpenZess combines the power of modern LLMs with native system-level capabilities that no other open-source project offers.

### What makes it different?

| Feature | OpenZess | Typical Chat UIs |
|---------|----------|-----------------|
| Terminal execution | ✅ Sandboxed WSL | ❌ None |
| File system access | ✅ Full CRUD | ❌ None |
| Multi-provider LLM | ✅ 10+ providers | ❌ Single provider |
| Virtual desktop control | ✅ X11 Matrix | ❌ None |
| Plugin system | ✅ MCP + Python | ❌ None |
| Multi-agent swarm | ✅ War Room | ❌ None |
| Cloud database | ✅ Neon PostgreSQL | ❌ Local only |
| Telegram/Discord bots | ✅ Built-in | ❌ None |
