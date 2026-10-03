import os
import platform
from dotenv import load_dotenv

# Load workspace .env if present
_env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
if os.path.exists(_env_path):
    load_dotenv(_env_path)

# Ensure DISPLAY is set natively for Xvfb in the Linux/WSL sandbox before any GUI library loads.
# We do NOT set this on Windows, as PyAutoGUI uses the native Win32 API there.
if platform.system() == "Linux":
    os.environ["DISPLAY"] = ":100"
import subprocess
import requests
import uuid
import threading
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from .mcp_manager import mcp_registry
from .plugin_loader import plugin_registry, load_plugins
import json
import logging
import litellm

# Completely silence litellm debug/stderr notices
litellm.suppress_debug_info = True
litellm.set_verbose = False
litellm.drop_params = True
os.environ["LITELLM_LOG"] = "ERROR"
logging.getLogger("LiteLLM").setLevel(logging.ERROR)

from . import background_workers
from . import sidecar_client
from . import experiential_client
import time
import smtplib
from email.mime.text import MIMEText

pyautogui = None
try:
    import pyautogui
    pyautogui.FAILSAFE = False
except Exception:
    pass

# Boot up the custom Python plugin folder dynamically:
load_plugins()

# Initialize Global ChromaDB Vector Vault
try:
    import chromadb
    from chromadb.config import Settings
    default_chroma_dir = os.path.expanduser("~/.openzess/chroma_db")
    os.makedirs(default_chroma_dir, exist_ok=True)
    chroma_client = chromadb.PersistentClient(path=default_chroma_dir, settings=Settings(allow_reset=True))
    # We will use the default SentenceTransformer embedding function natively provided by Chroma
    memory_collection = chroma_client.get_or_create_collection(name="openzess_memory")
except Exception as e:
    print(f"Warning: ChromaDB failed to initialize {e}")
    memory_collection = None

# ---- NATIVE TOOLS SECURITY GUARDS ----
_DANGEROUS_CMD_PATTERNS = [
    r"\bformat\s+[a-zA-Z]:",
    r"\bdel\s+/[fFqsQS\s]*[a-zA-Z]:\\",
    r"\brmdir\s+/[sS]\s+/[qQ]\s+[a-zA-Z]:\\",
    r"\brm\s+-rf\s+/\b",
    r":\(\)\s*\{\s*:\|:&\s*\}\s*;\s*:",
]

_PROTECTED_PATH_PATTERNS = (
    ".ssh",
    "id_rsa",
    "id_ed25519",
    "etc/shadow",
    "etc/passwd",
    "windows/system32",
    "windows\\system32",
    "sam",
    "system.dat",
)

def _is_safe_command(cmd: str) -> tuple[bool, str]:
    import re
    low = cmd.strip().lower()
    for pat in _DANGEROUS_CMD_PATTERNS:
        if re.search(pat, low):
            return False, "Command execution blocked by security policy (destructive system pattern detected)."
    return True, ""

def _is_safe_file_access(filepath: str) -> tuple[bool, str]:
    if not filepath or not isinstance(filepath, str):
        return False, "Error: Invalid file path."
    normalized = os.path.normpath(os.path.abspath(filepath)).lower()
    for bad in _PROTECTED_PATH_PATTERNS:
        if bad in normalized:
            return False, f"Access denied: Path targets protected system or secret resource '{bad}'."
    return True, ""

# ---- SANDBOX ESCALATION PATTERNS ----
_ESCALATION_COMMAND_PATTERNS = [
    # Privilege escalation / administrative override
    r"\bsudo\b",
    r"\bdoas\b",
    r"\brunas\b",
    r"\bsu\s+-\b",
    r"\bsu\s+root\b",
    r"\bgsudo\b",
    r"start-process\s+.*-verb\s+runas",
    r"-verb\s+runas",
    r"powershell\s+.*-executionpolicy\s+bypass",
    r"set-executionpolicy\s+.*(bypass|unrestricted)",
    
    # Destructive disk & filesystem wiping
    r"\bformat\s+[a-zA-Z]:",
    r"\bdel\s+/[fFqsQS\s]*[a-zA-Z]:\\",
    r"\brmdir\s+/[sS]\s+/[qQ]\s+[a-zA-Z]:\\",
    r"\brm\s+-rf\s+/\b",
    r"\bmkfs\b",
    r"\bdd\s+if=",
    r"\bdiskpart\b",
    
    # Network sockets / pipe execution
    r"\|\s*(bash|sh|zsh)\s*$",
    r"curl\s+.*\|\s*(bash|sh)",
    r"wget\s+.*\|\s*(bash|sh)",
    r"nc(\.exe)?\s+.*-e",
    r"/dev/tcp/",
    r":\(\)\s*\{\s*:\|:&\s*\}\s*;\s*:",
]

def is_sandbox_escalation(tool_name: str, args: dict) -> tuple[bool, str]:
    """
    Checks if a tool invocation attempts sandbox escalation or protected resource access.
    Returns (is_escalation, reason).
    """
    import re
    if not isinstance(args, dict):
        return False, ""
        
    if tool_name == "run_terminal_command":
        cmd = str(args.get("command", "")).strip()
        cmd_low = cmd.lower()
        for pat in _ESCALATION_COMMAND_PATTERNS:
            if re.search(pat, cmd_low, re.IGNORECASE):
                return True, f"Command contains elevated privilege or destructive pattern: '{pat}'"
        for bad in _PROTECTED_PATH_PATTERNS:
            if bad in cmd_low:
                return True, f"Command accesses protected system/secret path: '{bad}'"
                
    elif tool_name in ("create_file", "edit_code", "read_file"):
        path = str(args.get("filepath", args.get("path", ""))).strip().lower()
        for bad in _PROTECTED_PATH_PATTERNS:
            if bad in path:
                return True, f"File operation targets protected system resource: '{bad}'"
                
    elif tool_name in ("schedule_background_task", "monitor_directory"):
        target = str(args.get("command", args.get("path", ""))).strip().lower()
        for bad in _PROTECTED_PATH_PATTERNS:
            if bad in target:
                return True, f"Background task targets protected system resource: '{bad}'"
                
    return False, ""

# ---- NATIVE TOOLS ----
def run_terminal_command(command: str, **kwargs) -> str:
    try:
        import re
        command = re.sub(r'\[(.*?)\]\([^\)]*\)', r'\1', command).strip()
        is_safe, block_reason = _is_safe_command(command)
        if not is_safe:
            return block_reason
        if platform.system() == "Windows":
            # Try PowerShell first; fallback to cmd and WSL for shell scripts or complex pipes
            try:
                result = subprocess.run(["powershell", "-NoProfile", "-Command", command], capture_output=True, text=True, timeout=30)
                if result.returncode == 0:
                    return result.stdout if result.stdout else "Command completed successfully with no output."
            except Exception:
                pass
            try:
                result = subprocess.run(["cmd.exe", "/c", command], capture_output=True, text=True, timeout=30)
                if result.returncode == 0:
                    return result.stdout if result.stdout else "Command completed successfully with no output."
            except Exception:
                pass
            try:
                result = subprocess.run(["wsl", "bash", "-c", command], capture_output=True, text=True, timeout=30)
                return result.stdout if result.stdout else (result.stderr if result.stderr else "Command execution completed.")
            except Exception:
                pass
            return "Command execution completed."
        else:
            result = subprocess.run(["bash", "-c", command], capture_output=True, text=True, timeout=30)
            return result.stdout if result.stdout else (result.stderr if result.stderr else "Command completed.")
    except Exception as e:
        return str(e)

def search_the_web(query: str) -> str:
    try:
        results = DDGS().text(query, max_results=3)
        formatted_results = "\n\n".join(
            [f"Title: {res['title']}\nURL: {res['href']}\nSnippet: {res['body']}" for res in results]
        )
        return formatted_results if formatted_results else "No results found."
    except Exception as e:
        return f"Web search failed: {str(e)}"

def read_web_page(url: str) -> str:
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=10)
        soup = BeautifulSoup(response.text, "html.parser")
        text = " ".join(soup.stripped_strings)
        return text[:5000]
    except Exception as e:
        return str(e)

def create_file(filepath: str, content: str) -> str:
    try:
        is_safe, block_reason = _is_safe_file_access(filepath)
        if not is_safe:
            return block_reason
        os.makedirs(os.path.dirname(os.path.abspath(filepath)) or ".", exist_ok=True)
        if os.path.exists(filepath):
            return f"Error: File {filepath} already exists."
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"File successfully created at {filepath}"
    except Exception as e:
        return str(e)

def read_file(filepath: str) -> str:
    try:
        is_safe, block_reason = _is_safe_file_access(filepath)
        if not is_safe:
            return block_reason
        if not os.path.exists(filepath):
            return "Error: File does not exist."
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            return content[:15000] if len(content) > 15000 else content
    except Exception as e:
        return str(e)

def edit_code(filepath: str, old_string: str, new_string: str) -> str:
    try:
        is_safe, block_reason = _is_safe_file_access(filepath)
        if not is_safe:
            return block_reason
        if not os.path.exists(filepath):
            return "Error: File does not exist."
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        if old_string not in content:
            return "Error: old_string not found."
        new_content = content.replace(old_string, new_string)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return f"Successfully updated {filepath}"
    except Exception as e:
        return str(e)

def schedule_background_task(command: str, interval_minutes: int) -> str:
    """Schedules a native agent action to run automatically in the background at an interval."""
    try:
        job_id = background_workers.cron_manager.add_job(command, interval_minutes)
        return f"CRON JOB INITIATED [ID: {job_id}]: Will execute '{command}' every {interval_minutes} minutes natively."
    except Exception as e:
        return f"Failed to schedule cron: {e}"

def monitor_directory(directory: str, action: str) -> str:
    """Mounts a filesystem watchdog on a folder. When the folder changes, the Agent will execute the required action."""
    try:
        watch_id = background_workers.watch_manager.add_watchdog(directory, action)
        return f"WATCHDOG ACTIVE [ID: {watch_id}]: Observing {directory}. Action triggered on change: '{action}'."
    except Exception as e:
        return f"Failed to mount watchdog: {e}"

def verify_sandbox_environment() -> str:
    """Ensure we are strictly operating inside the WSL Linux sandbox and dependencies loaded."""
    if platform.system() != "Linux":
        raise Exception("SECURITY HALT: Openzess is strictly forbidden from executing native GUI controls on the Windows host. You must run the system via WSL (start_wsl.sh).")
    if pyautogui is None:
        raise Exception("SYSTEM FAULT: PyAutoGUI is not connected to the Matrix Xvfb Display. Reboot WSL sandbox.")
    return "ok"

def take_screenshot() -> str:
    try:
        verify_sandbox_environment()
        # Physical screenshot from Xvfb
        img_path = os.path.join(os.getcwd(), "temp_matrix_screen.png")
        pyautogui.screenshot(img_path)
        return "Screenshot captured to temp_matrix_screen.png successfully."
    except Exception as e:
        return f"Failed to take screenshot: {e}"

def computer_mouse_move(x: int, y: int) -> str:
    try:
        verify_sandbox_environment()
        pyautogui.moveTo(x, y, duration=0.2)
        return f"Mouse moved to ({x}, {y})."
    except Exception as e:
        return f"Failed to move mouse: {e}"

def computer_mouse_click(button: str = "left") -> str:
    try:
        verify_sandbox_environment()
        pyautogui.click(button=button)
        return f"Performed {button} mouse click."
    except Exception as e:
        return f"Failed to click mouse: {e}"

def computer_type_text(text: str) -> str:
    try:
        verify_sandbox_environment()
        pyautogui.write(text, interval=0.01)
        return "Typed text successfully."
    except Exception as e:
        return f"Failed to type text: {e}"

def computer_press_key(key: str) -> str:
    try:
        verify_sandbox_environment()
        pyautogui.press(key)
        return f"Pressed key '{key}'."
    except Exception as e:
        return f"Failed to press key: {e}"

def send_email(to_email: str, subject: str, body: str) -> str:
    try:
        smtp_server = os.environ.get("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.environ.get("SMTP_PORT", "587"))
        smtp_user = os.environ.get("SMTP_USERNAME")
        smtp_pass = os.environ.get("SMTP_PASSWORD")
        smtp_from = os.environ.get("SMTP_FROM", smtp_user)

        if not smtp_user or not smtp_pass:
            return "Error: SMTP_USERNAME or SMTP_PASSWORD environment variables are not set in .env."

        msg = MIMEText(body)
        msg['Subject'] = subject
        msg['From'] = smtp_from if smtp_from else "openzess@agent.local"
        msg['To'] = to_email

        server = smtplib.SMTP(smtp_server, smtp_port)
        server.starttls()
        server.login(smtp_user, smtp_pass)
        server.send_message(msg)
        server.quit()
        return f"Successfully sent email to {to_email}"
    except Exception as e:
        return f"Failed to send email: {e}"

def synthesize_skill(plugin_name: str, python_code: str, description: str = "") -> str:
    """Allows Openzess to create a new reusable tool/plugin for itself and hot-load it into its active brain without restarting."""
    try:
        clean_name = "".join(c for c in plugin_name if c.isalnum() or c == "_").lower()
        if not clean_name.endswith("_plugin"):
            filename = f"{clean_name}_plugin.py"
        else:
            filename = f"{clean_name}.py"
        
        plugins_dir = os.path.join(os.path.dirname(__file__), "plugins")
        os.makedirs(plugins_dir, exist_ok=True)
        filepath = os.path.join(plugins_dir, filename)
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(python_code)
            
        load_plugins()
        native_tool_funcs.update(plugin_registry.funcs)
        
        return f"[SELF-EVOLUTION] Successfully synthesized and hot-loaded skill plugin '{filename}' into Openzess brain. Active plugin tools: {list(plugin_registry.funcs.keys())}"
    except Exception as e:
        return f"Failed to synthesize skill: {str(e)}"

def save_memory(concept: str, details: str, tags: str = "general") -> str:
    """Stores a learned concept, code pattern, or past experience into the ChromaDB Vector Vault for future recall."""
    try:
        if memory_collection is None:
            return "ChromaDB memory is currently unavailable."
        
        doc_id = f"mem_{uuid.uuid4().hex[:8]}"
        doc_text = f"Concept: {concept}\nDetails: {details}"
        memory_collection.add(
            documents=[doc_text],
            metadatas=[{"concept": concept, "tags": tags}],
            ids=[doc_id]
        )
        return f"[MEMORY STORED] Learned knowledge persisted in ChromaDB Vault: '{concept}' [ID: {doc_id}]."
    except Exception as e:
        return f"Failed to store memory: {str(e)}"

def recall_memory(query: str, limit: int = 3) -> str:
    """Searches the ChromaDB Vector Vault for past experiences, learned skills, or architectural notes relevant to the query."""
    try:
        if memory_collection is None:
            return "ChromaDB memory is currently unavailable."
        
        if memory_collection.count() == 0:
            return "No relevant memories found in Vector Vault."
        
        results = memory_collection.query(query_texts=[query], n_results=min(limit, 5))
        if not results or not results.get("documents") or not results["documents"][0]:
            return "No relevant memories found in Vector Vault."
        
        recalled = []
        for i, doc in enumerate(results["documents"][0]):
            meta = results["metadatas"][0][i] if results.get("metadatas") else {}
            recalled.append(f"🧠 [Memory #{i+1} | Tags: {meta.get('tags', 'none')}]:\n{doc}")
        
        return "\n\n---\n\n".join(recalled)
    except Exception as e:
        return f"Failed to recall memory: {str(e)}"

def analyze_code_metrics(code_text: str) -> str:
    """Fast Token & Code Analyzer: Evaluates character/word/line count, token approximations, and delimiter balance using the Rust hybrid accelerator."""
    try:
        stats, engine = sidecar_client.code_quick_stats(code_text)
        return f"[CODE METRICS ({engine})] Lines: {stats['line_count']} ({stats['non_empty_lines']} non-empty), Est. Tokens: {stats['estimated_tokens']}, Characters: {stats['char_count']}, Syntax Delimiters Balanced: {stats['is_balanced']}"
    except Exception as e:
        return f"Code analysis failed: {e}"

native_tool_funcs = {
    "run_terminal_command": run_terminal_command,
    "bash_command": run_terminal_command,
    "bash": run_terminal_command,
    "execute_command": run_terminal_command,
    "terminal": run_terminal_command,
    "search_the_web": search_the_web,
    "read_web_page": read_web_page,
    "create_file": create_file,
    "read_file": read_file,
    "edit_code": edit_code,
    "schedule_background_task": schedule_background_task,
    "monitor_directory": monitor_directory,
    "take_screenshot": take_screenshot,
    "computer_mouse_move": computer_mouse_move,
    "computer_mouse_click": computer_mouse_click,
    "computer_type_text": computer_type_text,
    "computer_press_key": computer_press_key,
    "send_email": send_email,
    "synthesize_skill": synthesize_skill,
    "save_memory": save_memory,
    "recall_memory": recall_memory,
    "analyze_code_metrics": analyze_code_metrics
}

# Dynamically merge hot-loaded python plugins into the core native ecosystem!
native_tool_funcs.update(plugin_registry.funcs)

NATIVE_TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "run_terminal_command",
            "description": "Executes a secure shell command inside a sandboxed Linux WSL environment (Debian). Use standard Linux bash commands (e.g., ls, cat, grep, python3).",
            "parameters": {
                "type": "object",
                "properties": {"command": {"type": "string"}},
                "required": ["command"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_the_web",
            "description": "Performs a web search using DuckDuckGo to get recent information.",
            "parameters": {
                "type": "object",
                "properties": {"query": {"type": "string"}},
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_web_page",
            "description": "Fetches and reads the text content of a given URL.",
            "parameters": {
                "type": "object",
                "properties": {"url": {"type": "string"}},
                "required": ["url"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "create_file",
            "description": "Creates a new file at the specified path with the given content.",
            "parameters": {
                "type": "object",
                "properties": {"filepath": {"type": "string"}, "content": {"type": "string"}},
                "required": ["filepath", "content"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "read_file",
            "description": "Reads the contents of a local file.",
            "parameters": {
                "type": "object",
                "properties": {"filepath": {"type": "string"}},
                "required": ["filepath"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "edit_code",
            "description": "Edits an existing file by exactly replacing old_string with new_string.",
            "parameters": {
                "type": "object",
                "properties": {"filepath": {"type": "string"}, "old_string": {"type": "string"}, "new_string": {"type": "string"}},
                "required": ["filepath", "old_string", "new_string"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "schedule_background_task",
            "description": "Schedules a proactive agent action to run automatically in the background at an interval (in minutes).",
            "parameters": {
                "type": "object",
                "properties": {"command": {"type": "string"}, "interval_minutes": {"type": "integer"}},
                "required": ["command", "interval_minutes"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "monitor_directory",
            "description": "Mounts a filesystem watchdog on a folder. When the folder changes, the Agent will immediately execute the required action.",
            "parameters": {
                "type": "object",
                "properties": {"directory": {"type": "string"}, "action": {"type": "string"}},
                "required": ["directory", "action"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "take_screenshot",
            "description": "Takes a physical screenshot of the entire Matrix virtual desktop and returns success.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "computer_mouse_move",
            "description": "Moves the native desktop mouse pointer to specified X and Y coordinates.",
            "parameters": {
                "type": "object",
                "properties": {"x": {"type": "integer"}, "y": {"type": "integer"}},
                "required": ["x", "y"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "computer_mouse_click",
            "description": "Performs a mouse click at the current cursor location.",
            "parameters": {
                "type": "object",
                "properties": {"button": {"type": "string", "enum": ["left", "right", "middle"]}},
                "required": ["button"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "computer_type_text",
            "description": "Types an exact string natively using the keyboard. Useful for data entry.",
            "parameters": {
                "type": "object",
                "properties": {"text": {"type": "string"}},
                "required": ["text"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "computer_press_key",
            "description": "Presses a specific keyboard key (e.g., 'enter', 'tab', 'shift', 'ctrl', 'escape').",
            "parameters": {
                "type": "object",
                "properties": {"key": {"type": "string"}},
                "required": ["key"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "send_email",
            "description": "Sends an email using the configured SMTP server (default Gmail). Requires SMTP_USERNAME and SMTP_PASSWORD in the .env file. Useful for sending task reports or notifications to the user.",
            "parameters": {
                "type": "object",
                "properties": {
                    "to_email": {"type": "string"},
                    "subject": {"type": "string"},
                    "body": {"type": "string"}
                },
                "required": ["to_email", "subject", "body"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "synthesize_skill",
            "description": "Self-Evolution Tool: Allows Openzess to write a permanent new Python tool/plugin for itself and hot-load it into its active brain without restarting. The Python code must import plugin_registry and use @plugin_registry.register.",
            "parameters": {
                "type": "object",
                "properties": {
                    "plugin_name": {"type": "string", "description": "Short snake_case name for the plugin, e.g. 'github_analyzer'"},
                    "python_code": {"type": "string", "description": "Full valid Python code containing function decorated with @plugin_registry.register"},
                    "description": {"type": "string", "description": "What this new synthesized skill does"}
                },
                "required": ["plugin_name", "python_code"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "save_memory",
            "description": "Long-Term Memory Tool: Persists a key concept, architectural decision, code pattern, or debugging solution into ChromaDB Vector Vault so the agent remembers it across future sessions.",
            "parameters": {
                "type": "object",
                "properties": {
                    "concept": {"type": "string", "description": "Title or concept summary"},
                    "details": {"type": "string", "description": "Detailed explanation, code snippet, or steps learned"},
                    "tags": {"type": "string", "description": "Comma-separated tags e.g. 'rust,python,debugging'"}
                },
                "required": ["concept", "details"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "recall_memory",
            "description": "Long-Term Memory Search Tool: Queries the ChromaDB Vector Vault for past experiences, learned solutions, or project details semantically matching the query.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query for memories or past solutions"},
                    "limit": {"type": "integer", "description": "Number of memories to recall (default 3)"}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "analyze_code_metrics",
            "description": "Code Analyzer Tool: Calculates fast token approximations, line counts, non-empty code lines, and bracket/brace balance via the hybrid acceleration engine.",
            "parameters": {
                "type": "object",
                "properties": {
                    "code_text": {"type": "string", "description": "Source code text to analyze"}
                },
                "required": ["code_text"]
            }
        }
    }
]

# Dynamically inject the schemas for the hot-loaded plugins!
NATIVE_TOOL_SCHEMAS.extend(plugin_registry.schemas)

def refresh_plugin_tools():
    """Re-merge hot-loaded plugin functions and schemas (deduped by name).

    Runs at import time and again after synthesize_skill and the brain-reload
    endpoint, so plugins loaded at runtime are callable by the model without a
    server restart.
    """
    for _name, _fn in plugin_registry.funcs.items():
        native_tool_funcs[_name] = _fn
    _existing = {s.get("function", {}).get("name") for s in NATIVE_TOOL_SCHEMAS}
    for _schema in plugin_registry.schemas:
        _sname = _schema.get("function", {}).get("name")
        if _sname and _sname not in _existing:
            NATIVE_TOOL_SCHEMAS.append(_schema)
            _existing.add(_sname)

PROVIDER_MODELS = {
    "gemini": "gemini/gemini-2.5-flash",
    "openai": "openai/gpt-4o-mini",
    "anthropic": "anthropic/claude-3-5-sonnet-20241022",
    "groq": "groq/llama-3.3-70b-versatile",
    "ollama": "ollama/llama3.2",
    "lmstudio": "openai/local-model",
    "nvidia": "openai/z-ai/glm-5.3-flash",
    "nvidia-glm": "openai/z-ai/glm-5.3-flash",
    "nvidia_glm": "openai/z-ai/glm-5.3-flash",
    "deepseek": "openrouter/deepseek/deepseek-chat",
    "deepseek2": "openrouter/deepseek/deepseek-chat",
    "deepseek3": "openrouter/deepseek/deepseek-chat",
    "qwen": "openrouter/qwen/qwen-2.5-72b-instruct",
    "glm": "openrouter/z-ai/glm-5.3-flash",
    "kimi": "openrouter/moonshotai/moonshot-v1-8k",
    "experiential": "openai/default",
    "exp": "openai/default",
    "exp:smart": "openai/smart"
}

class OpenzessAgent:
    def __init__(self, api_key: str = "", provider: str = "gemini", history: list = None, system_instruction: str = None, allowed_tools: list = None, auto_approve: bool = False):
        self.auto_approve = auto_approve
        # Fallback to environment variables if client-side api_key is empty
        if not api_key or not str(api_key).strip():
            if provider in ("experiential", "exp", "exp:smart"):
                self.api_key = os.environ.get("EXP_GATEWAY_KEY", os.environ.get("EXPERIENTIAL_API_KEY", "xpl_gateway"))
            elif provider == "gemini":
                self.api_key = os.environ.get("GEMINI_API_KEY", "")
            elif provider == "openai":
                self.api_key = os.environ.get("OPENAI_API_KEY", "")
            elif provider == "anthropic":
                self.api_key = os.environ.get("ANTHROPIC_API_KEY", "")
            elif provider == "groq":
                self.api_key = os.environ.get("GROQ_API_KEY", "")
            elif provider in ("nvidia", "nvidia-glm", "nvidia_glm"):
                self.api_key = os.environ.get("NVIDIA_API_KEY", "")
                if not self.api_key and os.environ.get("OPENROUTER_API_KEY"):
                    self.api_key = os.environ.get("OPENROUTER_API_KEY", "")
                    provider = "glm"
            elif provider == "glm" and os.environ.get("NVIDIA_API_KEY") and not os.environ.get("OPENROUTER_API_KEY"):
                self.api_key = os.environ.get("NVIDIA_API_KEY", "")
            else:
                self.api_key = os.environ.get("OPENROUTER_API_KEY", os.environ.get("DEEPSEEK_API_KEY", os.environ.get("NVIDIA_API_KEY", "")))
        else:
            self.api_key = api_key
            if provider in ("nvidia", "nvidia-glm", "nvidia_glm") and not str(self.api_key).startswith("nvapi-"):
                if os.environ.get("OPENROUTER_API_KEY"):
                    self.api_key = os.environ.get("OPENROUTER_API_KEY", "")
                    provider = "glm"

        if provider in PROVIDER_MODELS:
            self.model_name = PROVIDER_MODELS[provider]
        self.provider = provider
        if "/" in provider:
            self.model_name = provider
        else:
            self.model_name = PROVIDER_MODELS.get(provider, "openai/gpt-4o-mini")
            
        if provider == "gemini" and self.api_key:
            os.environ["GEMINI_API_KEY"] = self.api_key
        elif provider == "openai" and self.api_key:
            os.environ["OPENAI_API_KEY"] = self.api_key
        elif provider == "anthropic" and self.api_key:
            os.environ["ANTHROPIC_API_KEY"] = self.api_key
        elif provider == "groq" and self.api_key:
            os.environ["GROQ_API_KEY"] = self.api_key
        elif (provider in ("nvidia", "nvidia-glm", "nvidia_glm") or (self.api_key and self.api_key.startswith("nvapi-"))) and self.api_key:
            os.environ["NVIDIA_API_KEY"] = self.api_key
        elif ("openrouter/" in self.model_name or (self.api_key and self.api_key.startswith("sk-or-"))) and self.api_key:
            os.environ["OPENROUTER_API_KEY"] = self.api_key
        
        # Configure custom endpoints (NVIDIA NIM / Ollama / LM Studio / LocalAI / vLLM / Experiential Gateway)
        self.api_base = None
        if provider in ("nvidia", "nvidia-glm", "nvidia_glm") or (self.api_key and self.api_key.startswith("nvapi-")):
            self.api_base = os.environ.get("NVIDIA_API_BASE", "https://integrate.api.nvidia.com/v1")
            raw_model = os.environ.get("NVIDIA_MODEL", "z-ai/glm-5.3-flash")
            if not raw_model.startswith("openai/") and not raw_model.startswith("nvidia_nim/"):
                raw_model = f"openai/{raw_model}"
            self.model_name = raw_model
        elif provider == "ollama":
            self.api_base = os.environ.get("OLLAMA_API_BASE", "http://localhost:11434")
            self.model_name = os.environ.get("OLLAMA_MODEL", "ollama/llama3.2")
        elif provider == "lmstudio":
            self.api_base = os.environ.get("LMSTUDIO_API_BASE", "http://localhost:1234/v1")
            self.model_name = "openai/local-model"
            if not self.api_key:
                self.api_key = "lm-studio"
        elif provider in ("experiential", "exp", "exp:smart"):
            self.api_base = os.environ.get("EXP_GATEWAY_BASE", experiential_client.DEFAULT_GATEWAY_BASE)
            self.model_name = os.environ.get("EXP_MODEL", "openai/default")
            if not self.api_key:
                self.api_key = os.environ.get("EXP_GATEWAY_KEY", "xpl_gateway")
        
        self.messages = []
        default_inst = "You are openzess, a fast autonomous AI assistant. Be direct, concise, and helpful. Answer questions directly in text without running unnecessary tools. Only call file or terminal tools when the user explicitly asks to run commands, inspect files, or edit code."
        
        try:
            from . import habit_learner
            profile = habit_learner.get_user_profile_prompt()
            final_inst = (system_instruction if system_instruction else default_inst) + profile
        except Exception:
            final_inst = system_instruction if system_instruction else default_inst
            
        self.messages.append({"role": "system", "content": final_inst})
        
        if history:
            for msg in history:
                role = "user" if msg["role"] == "user" else "assistant"
                content = msg.get("parts", [msg.get("content", "")])[0]
                self.messages.append({"role": role, "content": content})

        self.tools = []
        if allowed_tools is not None:
            self.tools = [t for t in NATIVE_TOOL_SCHEMAS if t["function"]["name"] in allowed_tools]
        else:
            self.tools = NATIVE_TOOL_SCHEMAS.copy()

        mcp_declarations = mcp_registry.get_all_tools_for_litellm()
        if mcp_declarations:
            self.tools.extend(mcp_declarations)
            
        # Deduplicate tools by name to prevent LLM API BadRequest errors (e.g., duplicated 'read_file')
        unique_tools = {}
        for t in self.tools:
            unique_tools[t["function"]["name"]] = t
        self.tools = list(unique_tools.values())

    def _extract_text_tool_calls(self, text: str) -> list:
        if not text or "<tool_call>" not in text:
            return []
        calls = []
        import re
        import json
        import uuid
        blocks = re.split(r'<tool_call>', text)
        for blk in blocks[1:]:
            blk = blk.strip()
            # 1. JSON-style
            json_m = re.search(r'^\s*(\{.*?\})(?:\s*</tool_call>|\s*\Z|\s*<tool_call>)', blk, re.DOTALL)
            if json_m:
                try:
                    data = json.loads(json_m.group(1))
                    fn = data.get("name") or data.get("function")
                    args = data.get("arguments", {})
                    if isinstance(args, str):
                        args = json.loads(args)
                    if fn:
                        if fn in ("bash_command", "bash", "execute_command", "terminal"):
                            fn = "run_terminal_command"
                        calls.append({
                            "id": f"call_txt_{uuid.uuid4().hex[:6]}",
                            "type": "function",
                            "function": {"name": fn, "arguments": json.dumps(args)}
                        })
                        continue
                except Exception:
                    pass

            # 2. Function-style call e.g. bash_command(command="...")
            m = re.match(r'([a-zA-Z0-9_-]+)\s*\((.*?)(?:\)\s*</arg_value>|\)\s*</tool_call>|\)\s*>|\)\s*\Z)', blk, re.DOTALL)
            if not m:
                m = re.match(r'([a-zA-Z0-9_-]+)\s*\((.*)', blk, re.DOTALL)
            if not m:
                continue

            fn_name = m.group(1).strip()
            args_raw = m.group(2).strip()

            args = {}
            cmd_m = re.search(r'command\s*=\s*["\'](.*?)["\']\s*(?:\)|</arg_value>|</tool_call>|\Z)', args_raw, re.DOTALL)
            if not cmd_m:
                cmd_m = re.search(r'command\s*=\s*["\'](.*)', args_raw, re.DOTALL)

            if cmd_m:
                cmd = cmd_m.group(1).rstrip(')"\'').strip()
                cmd = re.sub(r'\[(.*?)\]\([^\)]*\)', r'\1', cmd)
                args["command"] = cmd
            else:
                clean = args_raw.rstrip(')"\'').strip()
                clean = re.sub(r'\[(.*?)\]\([^\)]*\)', r'\1', clean)
                if clean:
                    args["command"] = clean

            if fn_name in ("bash_command", "bash", "execute_command", "terminal"):
                fn_name = "run_terminal_command"

            calls.append({
                "id": f"call_txt_{uuid.uuid4().hex[:6]}",
                "type": "function",
                "function": {
                    "name": fn_name,
                    "arguments": json.dumps(args)
                }
            })
        return calls

    def _run_tool(self, name: str, args: dict) -> str:
        import inspect
        import re
        if name in ("bash_command", "bash", "execute_command", "terminal"):
            name = "run_terminal_command"

        if name == "run_terminal_command":
            if "cmd" in args and "command" not in args:
                args["command"] = args.pop("cmd")
            elif "code" in args and "command" not in args:
                args["command"] = args.pop("code")
            if "command" in args and isinstance(args["command"], str):
                args["command"] = re.sub(r'\[(.*?)\]\([^\)]*\)', r'\1', args["command"]).strip()

        sid = mcp_registry.find_server_for_tool(name)
        if sid:
            return mcp_registry.call_tool(name, args)
            
        if name in native_tool_funcs:
            fn = native_tool_funcs[name]
            sig = inspect.signature(fn)
            has_var_keyword = any(p.kind == inspect.Parameter.VAR_KEYWORD for p in sig.parameters.values())
            if not has_var_keyword:
                valid_args = {k: v for k, v in args.items() if k in sig.parameters}
                return fn(**valid_args)
            return fn(**args)
            
        return f"Unknown tool: {name}"

    def _handle_response_loop(self):
        tool_outputs = []
        
        while True:
            call_kwargs = {
                "model": self.model_name,
                "messages": self.messages,
                "tools": self.tools if self.tools else None,
                "max_tokens": int(os.environ.get("OPENZESS_MAX_TOKENS", "1500")),
                "api_key": self.api_key if self.api_key else "dummy_key"
            }
            if self.api_base:
                call_kwargs["api_base"] = self.api_base
            
            try:
                response = litellm.completion(**call_kwargs)
            except Exception as call_err:
                err_str = str(call_err).lower()
                # 402 credit cap handler: if OpenRouter requires fewer max_tokens, retry with 800
                if "402" in err_str or "max_tokens" in err_str or "afford" in err_str:
                    try:
                        call_kwargs["max_tokens"] = 800
                        response = litellm.completion(**call_kwargs)
                    except Exception:
                        raise call_err
                # Circuit breaker: if gateway is offline/unreachable or transient connection error
                elif os.environ.get("OPENROUTER_API_KEY") and (self.provider in ("nvidia", "nvidia-glm", "nvidia_glm") or "AuthenticationError" in type(call_err).__name__):
                    fallback_model = "openrouter/z-ai/glm-5.3-flash"
                    call_kwargs["model"] = fallback_model
                    call_kwargs["api_key"] = os.environ.get("OPENROUTER_API_KEY")
                    call_kwargs.pop("api_base", None)
                    response = litellm.completion(**call_kwargs)
                elif self.provider in ("experiential", "exp", "exp:smart") or (self.api_base and ("127.0.0.1" in self.api_base or "localhost" in self.api_base)):
                    fallback_prov = os.environ.get("OPENZESS_FALLBACK_PROVIDER", "gemini")
                    fallback_model = PROVIDER_MODELS.get(fallback_prov, "gemini/gemini-2.5-flash")
                    fallback_key = os.environ.get(f"{fallback_prov.upper()}_API_KEY", os.environ.get("GEMINI_API_KEY", ""))
                    call_kwargs["model"] = fallback_model
                    call_kwargs["api_key"] = fallback_key or "dummy_key"
                    call_kwargs.pop("api_base", None)
                    response = litellm.completion(**call_kwargs)
                else:
                    raise call_err
            
            message = response.choices[0].message
            # Filter litellm specific attributes to keep dict clean for next chat round
            msg_dict = message.model_dump()
            if "function_call" in msg_dict and msg_dict["function_call"] is None:
                del msg_dict["function_call"]

            if not getattr(message, "tool_calls", None) and message.content and "<tool_call>" in message.content:
                text_calls = self._extract_text_tool_calls(message.content)
                if text_calls:
                    cleaned_content = message.content.split("<tool_call")[0].strip()
                    message.content = cleaned_content
                    msg_dict["content"] = cleaned_content
                    msg_dict["tool_calls"] = text_calls
            
            self.messages.append(msg_dict)
            
            tool_calls_to_process = getattr(message, "tool_calls", None) or msg_dict.get("tool_calls")
            if not tool_calls_to_process:
                return {"reply": message.content, "tools": tool_outputs, "auth_required": False}
                
            dangerous_tools = ["run_terminal_command", "create_file", "edit_code", "schedule_background_task", "monitor_directory", "computer_mouse_move", "computer_mouse_click", "computer_type_text", "computer_press_key", "send_email", "synthesize_skill"]
            
            pending_calls = []
            for tc in tool_calls_to_process:
                if isinstance(tc, dict):
                    raw_args = tc["function"]["arguments"]
                    args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                    t_name = tc["function"]["name"]
                    t_id = tc.get("id", "temp_id")
                else:
                    raw_args = tc.function.arguments
                    args = json.loads(raw_args) if isinstance(raw_args, str) else raw_args
                    t_name = tc.function.name
                    t_id = tc.id

                is_esc, esc_reason = is_sandbox_escalation(t_name, args)
                pending_calls.append({
                    "id": t_id,
                    "name": t_name,
                    "args": args,
                    "is_escalation": is_esc,
                    "escalation_reason": esc_reason
                })

            effective_auto_approve = self.auto_approve if auto_approve is None else auto_approve
            escalation_calls = [pc for pc in pending_calls if pc.get("is_escalation")]

            # Auto-approve is enabled: Permission prompts will be approved automatically.
            # Sandbox escalation prompts are always excluded and require manual approval.
            if effective_auto_approve:
                requires_auth = bool(escalation_calls)
            else:
                requires_auth = any(pc["name"] in dangerous_tools for pc in pending_calls)

            if requires_auth:
                return {
                    "reply": None,
                    "auth_required": True,
                    "pending_calls": pending_calls,
                    "is_escalation": bool(escalation_calls),
                    "escalation_reason": escalation_calls[0].get("escalation_reason") if escalation_calls else None
                }
            
            # Auto-execute safe tools or auto-approved non-escalation tools
            for pc in pending_calls:
                output = self._run_tool(pc["name"], pc["args"])
                tool_outputs.append({"tool": pc["name"], "args": pc["args"], "output": output})
                self.messages.append({
                    "role": "tool",
                    "tool_call_id": pc["id"],
                    "content": str(output)
                })

                if pc["name"] == "take_screenshot":
                    try:
                        import base64
                        img_path = os.path.join(os.getcwd(), "temp_matrix_screen.png")
                        if os.path.exists(img_path):
                            with open(img_path, "rb") as image_file:
                                b64 = base64.b64encode(image_file.read()).decode('utf-8')
                            self.messages.append({
                                "role": "user",
                                "content": [
                                    {"type": "text", "text": "Here is the visual feed of the desktop matrix:"},
                                    {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
                                ]
                            })
                    except Exception as ve:
                        print(f"Vision cortex error: {ve}")

    def _ingest_memory(self, prompt: str, reply: str):
        try:
            memory_string = f"User inquired: {prompt}\nAI Responded: {reply}"
            doc_id = str(uuid.uuid4())
            memory_collection.add(
                documents=[memory_string],
                metadatas=[{"type": "chat_interaction"}],
                ids=[doc_id]
            )
        except Exception as e:
            print(f"Failed to ingest memory: {e}")

    def _defer_learning(self, prompt: str, reply: str):
        """Fire-and-forget background ingestion (RAG memory + habit learning).

        Keeps the reply path fast: ChromaDB embedding writes and habit
        extraction run in a daemon thread instead of blocking the response.
        """
        def _worker():
            try:
                if memory_collection is not None:
                    self._ingest_memory(prompt, reply)
                from . import habit_learner
                habit_learner.extract_and_learn_habits(prompt, reply)
            except Exception:
                pass
        threading.Thread(target=_worker, daemon=True, name="openzess-learning").start()

    def chat(self, user_prompt: str, auto_approve: bool = None):
        try:
            self.last_prompt = user_prompt
            if auto_approve is not None:
                self.auto_approve = auto_approve
            
            # --- RAG RETRIEVAL (Only query CPU vector embeddings if explicitly requested) ---
            rag_context = ""
            mem_keywords = ["remember", "recall", "memory", "past", "history", "previous"]
            if memory_collection is not None and any(w in user_prompt.lower() for w in mem_keywords):
                try:
                    if memory_collection.count() > 0:
                        results = memory_collection.query(query_texts=[user_prompt], n_results=3)
                        if results and results.get("documents") and results["documents"] and results["documents"][0]:
                            rag_context = "\n\n[RELEVANT MEMORY EXTRACTED]:\n"
                            for doc in results["documents"][0]:
                                if doc.strip():
                                    rag_context += f"- {doc}\n"
                except Exception:
                    pass
            
            # Adaptive complexity routing for Experiential
            if self.provider in ("exp:smart", "experiential", "exp"):
                complexity = experiential_client.classify_task_complexity(user_prompt)
                if self.provider == "exp:smart" or self.model_name in ("openai/default", "openai/smart"):
                    self.model_name = experiential_client.get_model_for_complexity(complexity, self.model_name)

            enhanced_prompt = user_prompt + rag_context if rag_context else user_prompt
            if enhanced_prompt.strip():
                self.messages.append({"role": "user", "content": enhanced_prompt})
            
            result = self._handle_response_loop(auto_approve=self.auto_approve)
            
            # --- RAG & HABIT INGESTION (fire-and-forget, never blocks the reply) ---
            if not result.get("auth_required") and result.get("reply"):
                self._defer_learning(self.last_prompt, result["reply"])
                
            return result
        except BaseException as e:
            import traceback
            traceback.print_exc()
            raise e

    def chat_stream(self, user_prompt: str, auto_approve: bool = None):
        t_start = time.time()
        used_tools = []
        try:
            self.last_prompt = user_prompt
            if auto_approve is not None:
                self.auto_approve = auto_approve
            
            # --- RAG RETRIEVAL (Only query CPU vector embeddings if explicitly requested) ---
            rag_context = ""
            mem_keywords = ["remember", "recall", "memory", "past", "history", "previous", "profile"]
            if memory_collection is not None and any(w in user_prompt.lower() for w in mem_keywords):
                try:
                    if memory_collection.count() > 0:
                        results = memory_collection.query(query_texts=[user_prompt], n_results=3)
                        if results and results.get("documents") and results["documents"] and results["documents"][0]:
                            rag_context = "\n\n[RELEVANT PAST MEMORY EXTRACTED]:\n"
                            for doc in results["documents"][0]:
                                if doc.strip():
                                    rag_context += f"- {doc}\n"
                except Exception as eval_e:
                    print(f"RAG Retrieval failed: {eval_e}")
            
            # Adaptive complexity routing for Experiential
            if self.provider in ("exp:smart", "experiential", "exp"):
                complexity = experiential_client.classify_task_complexity(user_prompt)
                if self.provider == "exp:smart" or self.model_name in ("openai/default", "openai/smart"):
                    self.model_name = experiential_client.get_model_for_complexity(complexity, self.model_name)

            enhanced_prompt = user_prompt + rag_context if rag_context else user_prompt
            if enhanced_prompt.strip():
                self.messages.append({"role": "user", "content": enhanced_prompt})
            
            tool_outputs = []
            
            while True:
                call_kwargs = {
                    "model": self.model_name,
                    "messages": self.messages,
                    "tools": self.tools if self.tools else None,
                    "stream": True,
                    "max_tokens": int(os.environ.get("OPENZESS_MAX_TOKENS", "1500")),
                    "api_key": self.api_key if self.api_key else "dummy_key"
                }
                if self.api_base:
                    call_kwargs["api_base"] = self.api_base
                
                try:
                    # Circuit breaker probe: if targeting local gateway and it's unreachable, failover immediately
                    if self.provider in ("experiential", "exp", "exp:smart") and self.api_base and ("127.0.0.1" in self.api_base or "localhost" in self.api_base):
                        if not experiential_client.is_gateway_healthy(self.api_base):
                            raise ConnectionError("Experiential gateway is offline")
                    response_stream = litellm.completion(**call_kwargs)
                except Exception as stream_err:
                    err_str = str(stream_err).lower()
                    # 402 credit cap handler: if OpenRouter requires fewer max_tokens, retry with 800
                    if "402" in err_str or "max_tokens" in err_str or "afford" in err_str:
                        try:
                            call_kwargs["max_tokens"] = 800
                            response_stream = litellm.completion(**call_kwargs)
                        except Exception:
                            raise stream_err
                    elif os.environ.get("OPENROUTER_API_KEY") and (self.provider in ("nvidia", "nvidia-glm", "nvidia_glm") or "AuthenticationError" in type(stream_err).__name__):
                        fallback_model = "openrouter/z-ai/glm-5.3-flash"
                        call_kwargs["model"] = fallback_model
                        call_kwargs["api_key"] = os.environ.get("OPENROUTER_API_KEY")
                        call_kwargs.pop("api_base", None)
                        yield {"type": "content", "content": "*[⚡ Endpoint Unauthorized/Missing → Auto-switched to OpenRouter GLM]*\n\n"}
                        response_stream = litellm.completion(**call_kwargs)
                    elif self.provider in ("experiential", "exp", "exp:smart") or (self.api_base and ("127.0.0.1" in self.api_base or "localhost" in self.api_base)):
                        fallback_prov = os.environ.get("OPENZESS_FALLBACK_PROVIDER", "gemini")
                        fallback_model = PROVIDER_MODELS.get(fallback_prov, "gemini/gemini-2.5-flash")
                        fallback_key = os.environ.get(f"{fallback_prov.upper()}_API_KEY", os.environ.get("GEMINI_API_KEY", ""))
                        call_kwargs["model"] = fallback_model
                        call_kwargs["api_key"] = fallback_key or "dummy_key"
                        call_kwargs.pop("api_base", None)
                        yield {"type": "content", "content": f"*[⚡ Gateway Offline/Busy → Auto-switched to {fallback_prov}]*\n\n"}
                        response_stream = litellm.completion(**call_kwargs)
                    else:
                        raise stream_err
                
                collected_content = ""
                streamed_len = 0
                tool_calls = []

                try:
                    for chunk in response_stream:
                        delta = chunk.choices[0].delta
                        
                        if delta.content:
                            collected_content += delta.content
                            if "<tool_call" not in collected_content:
                                to_send = collected_content[streamed_len:]
                                if to_send:
                                    yield {"type": "content", "content": to_send}
                                    streamed_len = len(collected_content)
                            else:
                                cutoff = collected_content.find("<tool_call")
                                to_send = collected_content[streamed_len:cutoff]
                                if to_send:
                                    yield {"type": "content", "content": to_send}
                                streamed_len = cutoff
                            
                        if getattr(delta, "tool_calls", None):
                            for tcall in delta.tool_calls:
                                idx = getattr(tcall, "index", 0)
                                while len(tool_calls) <= idx:
                                    tool_calls.append({"id": getattr(tcall, "id", None), "type": "function", "function": {"name": "", "arguments": ""}})
                                
                                if getattr(tcall, "id", None):
                                    tool_calls[idx]["id"] = tcall.id
                                if getattr(tcall, "function", None):
                                    if getattr(tcall.function, "name", None):
                                        tool_calls[idx]["function"]["name"] = tcall.function.name
                                    if getattr(tcall.function, "arguments", None):
                                        tool_calls[idx]["function"]["arguments"] += tcall.function.arguments
                except Exception as stream_iter_err:
                    err_text = str(stream_iter_err)
                    print(f"Streaming chunk error: {err_text}")
                    if "incomplete chunked read" in err_text or "EOF" in err_text or "connection" in err_text.lower():
                        clean_msg = "Remote endpoint interrupted connection mid-stream. (Network socket closed)."
                    else:
                        clean_msg = err_text
                    if not collected_content:
                        yield {"type": "content", "content": f"\n\n*[⚠️ {clean_msg}]*\n\n"}
                    yield {"type": "done", "reply": collected_content if collected_content else f"Error: {clean_msg}"}
                    return

                # If the model emitted text-based tool calls (GLM, Hermes, Qwen, etc.) instead of OpenAI structured tool calls
                if not tool_calls and "<tool_call>" in collected_content:
                    tool_calls = self._extract_text_tool_calls(collected_content)
                    collected_content = collected_content.split("<tool_call")[0].strip()

                msg_dict = {"role": "assistant"}
                if tool_calls:
                     msg_dict["tool_calls"] = tool_calls
                     # Some APIs require content to be present, even if empty string
                     msg_dict["content"] = collected_content if collected_content else ""
                else:
                     msg_dict["content"] = collected_content if collected_content else ""
                     
                self.messages.append(msg_dict)
                
                if not tool_calls:
                    if collected_content:
                        # Fire-and-forget: never delay the final "done" SSE event
                        self._defer_learning(self.last_prompt, collected_content)
                    
                    # Record telemetry in Experiential OTel trace format
                    experiential_client.record_otel_trace(
                        session_id=getattr(self, "session_id", "default_session"),
                        prompt=self.last_prompt,
                        model=self.model_name,
                        latency_seconds=time.time() - t_start,
                        tokens=len(collected_content.split()) * 2,
                        tools_used=used_tools,
                        success=True
                    )

                    yield {"type": "done", "auth_required": False, "reply": collected_content}
                    return
                    
                dangerous_tools = ["run_terminal_command", "create_file", "edit_code", "schedule_background_task", "monitor_directory", "computer_mouse_move", "computer_mouse_click", "computer_type_text", "computer_press_key", "send_email", "synthesize_skill"]
                
                pending_calls = []
                for tc in tool_calls:
                    args = {}
                    try:
                        args = json.loads(tc["function"]["arguments"])
                    except:
                        try:
                            import ast
                            args = ast.literal_eval(tc["function"]["arguments"])
                        except:
                            pass
                    is_esc, esc_reason = is_sandbox_escalation(tc["function"]["name"], args)
                    pending_calls.append({
                        "id": tc["id"],
                        "name": tc["function"]["name"],
                        "args": args,
                        "is_escalation": is_esc,
                        "escalation_reason": esc_reason
                    })
                
                effective_auto_approve = self.auto_approve if auto_approve is None else auto_approve
                escalation_calls = [pc for pc in pending_calls if pc.get("is_escalation")]

                # Auto-approve is enabled: Permission prompts will be approved automatically.
                # Sandbox escalation prompts are always excluded and require manual approval.
                if effective_auto_approve:
                    requires_auth = bool(escalation_calls)
                else:
                    requires_auth = any(pc["name"] in dangerous_tools for pc in pending_calls)

                if requires_auth:
                    yield {
                        "type": "auth_required",
                        "pending_calls": pending_calls,
                        "is_escalation": bool(escalation_calls),
                        "escalation_reason": escalation_calls[0].get("escalation_reason") if escalation_calls else None
                    }
                    return

                if effective_auto_approve and any(pc["name"] in dangerous_tools for pc in pending_calls):
                    yield {
                        "type": "auto_approved",
                        "notice": "Auto-approve is enabled. Permission prompts will be approved automatically. Sandbox escalation prompts are always excluded.",
                        "tools": [pc["name"] for pc in pending_calls]
                    }
                    
                for pc in pending_calls:
                    used_tools.append(pc["name"])
                    yield {"type": "tool_start", "tool": pc["name"]}
                    output = self._run_tool(pc["name"], pc["args"])
                    tool_outputs.append({"tool": pc["name"], "args": pc["args"], "output": output})
                    yield {"type": "tool_result", "tool": pc["name"], "args": pc["args"], "output": str(output)}
                    self.messages.append({
                        "role": "tool",
                        "tool_call_id": pc["id"],
                        "content": str(output)
                    })

                    if pc["name"] == "take_screenshot":
                        try:
                            import base64
                            img_path = os.path.join(os.getcwd(), "temp_matrix_screen.png")
                            if os.path.exists(img_path):
                                with open(img_path, "rb") as image_file:
                                    b64 = base64.b64encode(image_file.read()).decode('utf-8')
                                self.messages.append({
                                    "role": "user",
                                    "content": [
                                        {"type": "text", "text": "Here is the visual feed of the desktop matrix:"},
                                        {"type": "image_url", "image_url": {"url": f"data:image/png;base64,{b64}"}}
                                    ]
                                })
                        except Exception as ve:
                            print(f"Vision cortex error: {ve}")
                    
        except BaseException as e:
            import traceback
            traceback.print_exc()
            yield {"type": "error", "error": str(e)}
            traceback.print_exc()
            return {"reply": f"An error occurred: {str(e)}", "tools": [], "auth_required": False}

    def execute_pending_tools(self, pending_calls: list, approved: bool):
        try:
            tool_outputs = []
            
            for pc in pending_calls:
                name = pc["name"]
                args = pc["args"]
                tool_call_id = pc.get("id", "temp_id")
                
                if not approved:
                    output = "Execution halted: USER DENIED PERMISSION to run this tool."
                else:
                    output = self._run_tool(name, args)
                    
                tool_outputs.append({"tool": name, "args": args, "output": output})
                self.messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call_id,
                    "content": str(output)
                })
                
            result = self._handle_response_loop()
            
            if result.get("tools"):
                tool_outputs.extend(result["tools"])
            result["tools"] = tool_outputs
            
            if not result.get("auth_required") and result.get("reply"):
                if hasattr(self, 'last_prompt'):
                    self._defer_learning(self.last_prompt, result["reply"])
                    
            return result
        except BaseException as e:
            import traceback
            traceback.print_exc()
            return {"reply": f"Error: {e}", "tools": [], "auth_required": False}

    def execute_pending_tools_stream(self, pending_calls: list, approved: bool):
        try:
            for pc in pending_calls:
                name = pc["name"]
                args = pc["args"]
                tool_call_id = pc.get("id", "temp_id")
                
                yield {"type": "tool_start", "tool": name}
                
                if not approved:
                    output = "Execution halted: USER DENIED PERMISSION to run this tool."
                else:
                    output = self._run_tool(name, args)
                    
                yield {"type": "tool_result", "tool": name, "args": args, "output": str(output)}
                self.messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call_id,
                    "content": str(output)
                })
                
            for chunk in self.chat_stream(""):
                if chunk.get("type") in ["content", "tool_start", "tool_result", "auth_required", "error"]:
                    yield chunk
                elif chunk.get("type") == "done":
                    yield chunk
                    
        except BaseException:
            pass
