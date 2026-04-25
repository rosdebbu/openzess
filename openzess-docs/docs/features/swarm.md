# Swarm Intelligence / War Room

The War Room is OpenZess's multi-agent collaboration system. It lets you deploy multiple AI agents simultaneously to debate, analyze, and synthesize solutions.

## How It Works

### Swarm Debate Mode

When you enable **Swarm Mode** in the chat, your message is sent to multiple AI agents in parallel. Each agent has a different role and provider:

- **Strategist** (DeepSeek) — Plans the high-level approach
- **Critic** (DeepSeek) — Finds flaws and challenges assumptions
- **Optimizer** (GLM) — Refines and optimizes the solution

The agents take turns debating in a structured conversation. If all agents agree, they output `[CONSENSUS REACHED]` and the debate ends.

### The Final Synthesis

After the debate, a **Final Judge** (your primary model) reads the entire transcript and synthesizes a definitive answer as a structured Markdown table.

## Architecture

```python
class SwarmManager:
    def __init__(self):
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=10)

    async def dispatch_squad_stream(self, prompt, squad_config):
        # Fire off all agents in parallel with 400ms stagger
        for i, config in enumerate(squad_config):
            delay = i * 400  # Prevents API rate limiting
            futures.append(
                loop.run_in_executor(self.executor, run_agent_stream, ...)
            )
```

### Why 400ms Stagger?

Launching all API calls simultaneously can trigger rate limits and socket exhaustion. The 400ms delay between each agent launch provides just enough breathing room.

## Squad Configuration

Each squad member is defined by:

```json
{
    "role_name": "Strategist",
    "provider": "deepseek2",
    "api_key": "sk-...",
    "system_instruction": "You are a strategic planner..."
}
```

## Use Cases

- **Code Review**: Let one agent write code while another critiques it
- **Research**: Deploy multiple agents to search different aspects of a topic
- **Decision Making**: Get multiple AI perspectives before making a choice
- **Brainstorming**: Let agents build on each other's ideas iteratively
