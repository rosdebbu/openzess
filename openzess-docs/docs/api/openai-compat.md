# OpenAI-Compatible API

OpenZess exposes an OpenAI-compatible API, which means you can use it as a drop-in replacement for OpenAI in any tool that supports custom endpoints (like Cursor, Continue, or any OpenAI SDK client).

## Chat Completions

### `POST /v1/chat/completions`

Follows the exact OpenAI Chat Completions API format:

```bash
curl http://localhost:8000/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openzess",
    "messages": [
      {"role": "user", "content": "What is OpenZess?"}
    ]
  }'
```

**Response:**
```json
{
    "id": "chatcmpl-uuid",
    "object": "chat.completion",
    "model": "openzess",
    "choices": [{
        "index": 0,
        "message": {
            "role": "assistant",
            "content": "OpenZess is an autonomous agent platform..."
        },
        "finish_reason": "stop"
    }]
}
```

### `GET /v1/models`

Lists available models:

```json
{
    "object": "list",
    "data": [{
        "id": "openzess",
        "object": "model",
        "owned_by": "openzess"
    }]
}
```

## Anthropic-Compatible API

### `POST /v1/messages`

Also supports the Anthropic Messages API format:

```bash
curl http://localhost:8000/v1/messages \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "openzess",
    "messages": [
      {"role": "user", "content": "Hello!"}
    ],
    "system": "You are a helpful assistant.",
    "max_tokens": 1024
  }'
```

## Smart Key Detection

OpenZess automatically detects which provider to use based on your API key format:

| Key Prefix | Detected Provider |
|------------|------------------|
| `sk-ant-*` | Anthropic |
| `gsk_*` | Groq |
| `sk-*` | OpenAI |
| Other | Gemini (default) |

::: tip
This means you can point any OpenAI-compatible tool at `http://localhost:8000/v1` and it will route through OpenZess, giving your tools access to the full agent capability (terminal, file system, web search, etc.).
:::
