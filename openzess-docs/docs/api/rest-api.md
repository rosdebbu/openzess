# REST API Reference

OpenZess exposes a comprehensive REST API on `http://localhost:8000`. All endpoints accept and return JSON.

## Chat

### `POST /api/chat`
Send a message to the agent.

**Request Body:**
```json
{
    "message": "Write a Python hello world script",
    "api_key": "your-api-key",
    "provider": "gemini",
    "session_id": null,
    "system_instruction": null,
    "allowed_tools": ["run_terminal_command", "create_file"],
    "stream": true,
    "agent_name": null,
    "use_swarm": false
}
```

**SSE Response (when `stream: true`):**
```
data: {"type": "session", "session_id": "abc123"}
data: {"type": "content", "content": "Sure, "}
data: {"type": "content", "content": "here's a script..."}
data: {"type": "tool_call", "name": "create_file", "args": {...}}
data: {"type": "done", "reply": "Full response..."}
```

### `POST /api/chat/approve`
Approve or deny pending tool calls.

```json
{
    "session_id": "abc123",
    "pending_calls": [...],
    "approved": true,
    "stream": true
}
```

---

## Sessions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/sessions` | List all chat sessions |
| `GET` | `/api/sessions/{id}/messages` | Get messages for a session |
| `DELETE` | `/api/sessions/{id}` | Delete a session |
| `DELETE` | `/api/messages/{id}` | Delete a specific message |

---

## Memory Vault

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/memory` | List all memories |
| `DELETE` | `/api/memory/{id}` | Delete a memory |
| `DELETE` | `/api/memory` | Clear all memories |

---

## MCP Servers

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/mcp/servers` | List connected servers |
| `POST` | `/api/mcp/connect` | Connect a new server |
| `POST` | `/api/mcp/disconnect/{id}` | Disconnect a server |
| `DELETE` | `/api/mcp/saved/{id}` | Remove a saved server |

---

## Automation

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/cron` | Create a cron job |
| `GET` | `/api/cron` | List cron jobs |
| `DELETE` | `/api/cron/{id}` | Delete a cron job |
| `POST` | `/api/watchdog` | Create a watchdog |
| `GET` | `/api/watchdog` | List watchdogs |
| `DELETE` | `/api/watchdog/{id}` | Delete a watchdog |

---

## Knowledge Base

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/notes` | Create a note |
| `GET` | `/api/notes` | List all notes |
| `PUT` | `/api/notes/{id}` | Update a note |
| `DELETE` | `/api/notes/{id}` | Delete a note |
| `POST` | `/api/notes/upload` | Upload an image for notes |

---

## Utilities

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/files` | List files in current directory |
| `GET` | `/api/tools` | List available tools |
| `POST` | `/api/tts` | Generate text-to-speech audio |
