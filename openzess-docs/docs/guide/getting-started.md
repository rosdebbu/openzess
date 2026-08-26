# Installation & Setup 🦎

This guide walks you through launching Openzess either in the **Cyberpunk Terminal TUI** or the **Full Web Workspace**.

---

## 🚀 Quick Launch (One-Liner)

### 🪟 Windows (Native PowerShell)
```powershell
# 1. Interactive Terminal CLI
.\openzess.bat

# 2. Full Web Workspace (React + FastAPI)
.\start.bat
```

### 🐧 Linux / Debian WSL2
```bash
# 1. Interactive Terminal CLI
openzess
# or
./openzess.sh

# 2. Start Backend Server
uvicorn backend.app.server:app --host 0.0.0.0 --port 8000 --reload
```

---

## 📋 Prerequisites

Before starting, ensure you have:

```bash
# 1. Python 3.12+ (Windows) or Python 3.13 (Debian WSL2)
python --version

# 2. Node.js 18+ & npm (for Web UI)
node --version

# 3. Optional: Debian WSL2 Sandbox
wsl --status
```

---

## 🔑 Environment Variables

Create a `.env` file in the project root:

```env
# Primary LLM API Keys (or enter them in Web UI / CLI)
OPENROUTER_API_KEY=sk-or-v1-...
GEMINI_API_KEY=AIzaSy...
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Localhost Endpoints (optional)
OLLAMA_API_BASE=http://localhost:11434
LMSTUDIO_API_BASE=http://localhost:1234/v1
```

---

## 🤖 Supported LLM Models & Providers

| Provider | Default Model | Key Type |
|---|---|---|
| **GLM (Zhipu / Z-AI)** | `openrouter/z-ai/glm-5.3-flash` | OpenRouter Key |
| **DeepSeek** | `openrouter/deepseek/deepseek-chat` | DeepSeek / OpenRouter Key |
| **Google Gemini** | `gemini/gemini-2.5-flash` | Gemini Key |
| **OpenAI** | `openai/gpt-4o-mini` | OpenAI Key |
| **Anthropic** | `anthropic/claude-3-5-sonnet-20241022` | Anthropic Key |
| **Groq** | `groq/llama-3.3-70b-versatile` | Groq Key |
| **Qwen** | `openrouter/qwen/qwen-2.5-72b-instruct` | OpenRouter Key |
| **Ollama (Local)** | `ollama/llama3.2` | Local Endpoint |
| **LM Studio (Local)**| `openai/local-model` | Local Endpoint |

::: tip Switching Models on the Fly
In the Terminal CLI, type `/model <provider>` (e.g. `/model deepseek` or `/model gemini`) to switch active neural engines instantly.
:::
