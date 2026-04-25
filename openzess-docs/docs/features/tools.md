# Native Tool System

OpenZess provides 13 built-in tools that the agent can invoke during conversations. These tools are the agent's hands and eyes — they allow it to interact with the real world.

## Core Tools

### `run_terminal_command`
Executes a bash command inside the Debian WSL sandbox.

```python
def run_terminal_command(command: str) -> str:
    result = subprocess.run(
        ["wsl", "-d", "Debian", "bash", "-c", command],
        capture_output=True, text=True, timeout=15
    )
    return result.stdout if result.stdout else result.stderr
```

**Examples**: `ls -la`, `python3 script.py`, `grep -r "TODO" .`, `pip install requests`

### `search_the_web`
Searches DuckDuckGo and returns top 3 results with titles, URLs, and snippets.

### `read_web_page`
Fetches a URL and extracts clean text content using BeautifulSoup. Returns up to 5,000 characters.

### `create_file`
Creates a new file at a specified path. Refuses to overwrite existing files for safety.

### `read_file`
Reads and returns file contents, capped at 15,000 characters for large files.

### `edit_code`
Performs exact string find-and-replace on existing files. The agent specifies `old_string` and `new_string` for precise, surgical edits.

## Automation Tools

### `schedule_background_task`
Creates a recurring cron job that executes a command at a specified interval (in minutes).

### `monitor_directory`
Mounts a filesystem watchdog on a directory. When any file changes, the agent automatically executes a specified action.

## Computer Control Tools

These tools allow the agent to interact with the virtual X11 desktop:

| Tool | Action |
|------|--------|
| `take_screenshot` | Captures the entire virtual display |
| `computer_mouse_move` | Moves cursor to (x, y) coordinates |
| `computer_mouse_click` | Clicks left, right, or middle button |
| `computer_type_text` | Types a string character-by-character |
| `computer_press_key` | Presses a keyboard key (enter, tab, etc.) |

::: warning
Computer control tools are only available when running inside the WSL sandbox with an active Xvfb display. They will fail gracefully if the display is not available.
:::

## Tool Approval Flow

When the agent wants to execute a tool, the process is:

1. Agent generates a `tool_call` response
2. Frontend displays the tool name and arguments to the user
3. User clicks **Approve** or **Deny**
4. If approved, the tool executes and results are fed back to the agent
5. If denied, the agent receives "Action denied by user" and adjusts its approach
