# Installation & Setup

This guide walks you through setting up OpenZess from scratch on a Windows machine.

## Prerequisites

Before starting, ensure you have the following installed:

```bash
# Check WSL
wsl --status

# Check Node.js
node --version  # Should be v18+

# Check Python (inside WSL)
wsl -d Debian bash -c "python3 --version"  # Should be 3.10+
```

::: tip
If you don't have WSL installed, run `wsl --install -d Debian` in an elevated PowerShell terminal and restart your machine.
:::

## Step 1: Clone the Repository

```bash
git clone https://github.com/rosdebbu/openzess.git
cd openzess
```

## Step 2: Configure Environment Variables

Create a `.env` file in the project root:

```env
# Database (Neon PostgreSQL — get a free instance at neon.tech)
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST.neon.tech/neondb?sslmode=require

# Optional: Stitch MCP API Key for design generation
STITCH_API_KEY=YOUR_STITCH_KEY
VITE_STITCH_API_KEY=YOUR_STITCH_KEY
```

::: warning
Never commit your `.env` file to Git. It contains sensitive credentials.
:::

## Step 3: Boot the System

OpenZess provides a single startup script that handles everything:

```bash
wsl -d Debian bash
cd /mnt/c/Users/YOUR_USER/path/to/openzess
bash start_wsl.sh
```

### What `start_wsl.sh` does automatically:

1. **Launches Xvfb** — An invisible X11 virtual display on `:100`
2. **Starts Fluxbox** — A lightweight window manager attached to the virtual display
3. **Installs Python dependencies** — Including `psycopg2-binary` for PostgreSQL
4. **Boots FastAPI backend** — On `http://localhost:8000`
5. **Installs Node modules** — If `node_modules` doesn't exist
6. **Starts Vite frontend** — On `http://localhost:5173`

## Step 4: Access OpenZess

Open your browser and navigate to:

```
http://localhost:5173
```

You'll see the Welcome screen where you can select your LLM provider and enter your API key.

## Supported LLM Providers

| Provider | Model | API Key Format |
|----------|-------|---------------|
| Google Gemini | `gemini-2.5-flash` | Standard Gemini key |
| OpenAI | `gpt-4o-mini` | `sk-...` |
| Anthropic | `claude-3-5-sonnet` | `sk-ant-...` |
| Groq | `llama-3.3-70b` | `gsk_...` |
| DeepSeek | `deepseek-chat` | DeepSeek or OpenRouter key |
| Qwen | `qwen-2.5-72b` | OpenRouter key |
| GLM | `glm-4` | OpenRouter key |
| Kimi | `moonshot-v1-8k` | OpenRouter key |
| Ollama | `llama3.2` | No key needed (local) |

::: info
All providers are routed through [LiteLLM](https://docs.litellm.ai/), which normalizes the API interface. You can switch providers at any time from the Settings panel.
:::
