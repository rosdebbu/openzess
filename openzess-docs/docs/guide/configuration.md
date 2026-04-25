# Configuration

OpenZess is highly configurable through environment variables, the Settings panel, and the Agent Persona system.

## Environment Variables

All environment variables are stored in the `.env` file at the project root.

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string (Neon recommended) |
| `STITCH_API_KEY` | No | API key for the Stitch MCP design system |
| `VITE_STITCH_API_KEY` | No | Same key exposed to the frontend |

## Agent Personas

OpenZess ships with 3 built-in personas plus a custom option:

### The Architect (Default)
The all-purpose agent with full tool access. Can execute commands, browse the web, manage files, and write code.

### Web Scraper Agent
A specialized agent that can only browse the web. Cannot execute commands or modify files. Perfect for research tasks.

### Code Generator Agent
Focused exclusively on reading and writing code. Cannot browse the web. Ideal for pure development tasks.

### Custom Persona
Create your own system instruction and enable/disable individual tools.

## Tool Configuration

Each persona has a configurable set of tools:

| Tool | Description |
|------|-------------|
| `run_terminal_command` | Execute bash commands in the WSL sandbox |
| `search_the_web` | Search DuckDuckGo for real-time information |
| `read_web_page` | Scrape and extract text from any URL |
| `create_file` | Create new files on the filesystem |
| `read_file` | Read contents of existing files |
| `edit_code` | Find-and-replace editing of existing files |

::: tip
Additional tools are available but always enabled: `schedule_background_task`, `monitor_directory`, `take_screenshot`, and the full suite of computer control tools (mouse move, click, type, key press).
:::
