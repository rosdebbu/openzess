# Agent Core & LLM Routing

The `OpenzessAgent` class in `agent.py` is the brain of the entire system. It manages the conversation loop, tool execution, and multi-provider LLM routing.

## How It Works

### 1. Provider Selection
When you select a provider in the Settings panel, OpenZess maps it to a LiteLLM model string:

```python
PROVIDER_MODELS = {
    "gemini":    "gemini/gemini-2.5-flash",
    "openai":    "openai/gpt-4o-mini",
    "anthropic": "anthropic/claude-3-5-sonnet-20241022",
    "groq":      "groq/llama-3.3-70b-versatile",
    "ollama":    "ollama/llama3.2",
    "deepseek":  "openrouter/deepseek/deepseek-chat",
    "qwen":      "openrouter/qwen/qwen-2.5-72b-instruct",
    "glm":       "openrouter/zhipu/glm-4",
    "kimi":      "openrouter/moonshotai/moonshot-v1-8k"
}
```

### 2. The Agentic Loop

The agent uses a multi-turn tool-calling loop:

```
User Message
    ↓
LLM generates response
    ↓
Response contains tool calls? ──→ No ──→ Return text to user
    ↓ Yes
Send tool calls to frontend for approval
    ↓
User approves? ──→ No ──→ Return "Action denied"
    ↓ Yes
Execute tools in sandbox
    ↓
Feed results back to LLM
    ↓
Loop again (up to 15 iterations)
```

### 3. Streaming

All chat interactions support **Server-Sent Events (SSE)** streaming. The frontend receives chunks in real-time:

```json
{"type": "session", "session_id": "abc123"}
{"type": "content", "content": "Here is my "}
{"type": "content", "content": "response..."}
{"type": "tool_call", "name": "run_terminal_command", "args": {"command": "ls -la"}}
{"type": "done", "reply": "Full response text..."}
```

## Smart Provider Detection

When using the OpenAI-compatible API (`/v1/chat/completions`), OpenZess auto-detects the provider from the API key format:

```python
def guess_provider(key: str) -> str:
    if key.startswith("sk-ant"): return "anthropic"
    if key.startswith("gsk_"):  return "groq"
    if key.startswith("sk-"):   return "openai"
    return "gemini"
```

## Memory Integration

The agent automatically stores important context in **ChromaDB** — a local vector database. This gives the agent long-term memory that persists across sessions.

```python
memory_collection = chroma_client.get_or_create_collection(
    name="openzess_memory"
)
```
