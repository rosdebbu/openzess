# Custom Python Plugins

OpenZess has a hot-loading plugin system that lets you add custom tools by simply dropping a Python file into the `backend/plugins/` directory.

## Creating a Plugin

Create a new `.py` file in `backend/plugins/`:

```python
# backend/plugins/weather.py
from plugin_loader import plugin_registry

@plugin_registry.register(
    name="get_weather",
    description="Gets the current weather for a city",
    schema_params={
        "properties": {
            "city": {"type": "string", "description": "City name"}
        },
        "required": ["city"]
    }
)
def get_weather(city: str) -> str:
    import requests
    response = requests.get(f"https://wttr.in/{city}?format=3")
    return response.text
```

That's it! On the next server restart, the `get_weather` tool will be automatically available to every agent.

## How It Works

The `plugin_loader.py` module:

1. **Scans** the `backend/plugins/` directory for `.py` files
2. **Loads** each file as a dynamic Python module
3. **Injects** the `plugin_registry` into the module's namespace
4. **Merges** all registered functions and schemas into the agent's tool system

```python
native_tool_funcs.update(plugin_registry.funcs)
NATIVE_TOOL_SCHEMAS.extend(plugin_registry.schemas)
```

## The `@plugin_registry.register` Decorator

| Parameter | Type | Description |
|-----------|------|-------------|
| `name` | `str` | Unique tool name (used by the LLM) |
| `description` | `str` | What this tool does (shown to the LLM) |
| `schema_params` | `dict` | OpenAI-format JSON schema for parameters |

## Example: PC Control Plugin

OpenZess ships with `pc_control.py` as a built-in plugin example:

```python
@plugin_registry.register(
    name="open_application",
    description="Opens a desktop application in the Matrix sandbox",
    schema_params={
        "properties": {
            "app_name": {"type": "string"}
        },
        "required": ["app_name"]
    }
)
def open_application(app_name: str) -> str:
    import subprocess
    subprocess.Popen(["xdg-open", app_name])
    return f"Opened {app_name}"
```

::: tip
Plugins are loaded once at server startup. If you add a new plugin file, restart the backend to pick it up.
:::
