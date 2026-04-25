# MCP Plugin System

OpenZess natively supports the **Model Context Protocol (MCP)** — an industry standard for connecting AI systems with external tools and data sources.

## What is MCP?

MCP is like USB for AI. Just as USB lets you plug any peripheral into any computer, MCP lets you plug any tool server into any AI agent. OpenZess acts as an MCP **client** that connects to external MCP **servers**.

## Supported Transports

| Transport | Use Case | Example |
|-----------|----------|---------|
| `stdio` | Local CLI tools | `npx @prisma/mcp-server` |
| `sse` | Remote HTTP servers | Stitch Design API |
| `streamablehttp` | Modern HTTP streaming | Newer MCP servers |

## Connecting an MCP Server

### From the UI

1. Navigate to **Tools → MCP Plugins** in the sidebar
2. Click **Add Server**
3. Fill in the connection details:
   - **Server ID**: A unique identifier (e.g., `prisma`)
   - **Command**: The CLI command to start the server (e.g., `npx`)
   - **Args**: Command arguments (e.g., `["-y", "@prisma/mcp-server"]`)
   - **Transport**: `stdio`, `sse`, or `streamablehttp`

### Auto-Reconnection

Connected MCP servers are saved to the database. On every system restart, OpenZess automatically reconnects all previously active servers:

```python
def init_active_mcps():
    servers = database.get_all_mcp_servers()
    for s in servers:
        if s["is_active"]:
            mcp_registry.connect(s["id"], s["command"], s["args"])
```

## How MCP Tools Appear to the Agent

When an MCP server connects, its tools are dynamically merged into the agent's tool schema:

```python
def get_all_tools_for_litellm(self) -> list:
    openai_tools = []
    for sid, tools in self.server_tools.items():
        for t in tools:
            openai_tools.append({
                "type": "function",
                "function": {
                    "name": t.name,
                    "description": f"[MCP: {sid}] {t.description}",
                    "parameters": t.inputSchema
                }
            })
    return openai_tools
```

The `[MCP: server_id]` prefix helps the agent understand which tools come from external servers.

## Process Management

OpenZess uses `psutil` to properly clean up MCP server processes, preventing zombie processes (especially common with `npx` on Windows):

```python
parent = psutil.Process(pid)
for child in parent.children(recursive=True):
    child.kill()
parent.kill()
```
