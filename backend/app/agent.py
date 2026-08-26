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
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from .mcp_manager import mcp_registry
from .plugin_loader import plugin_registry, load_plugins
import json
import litellm
from . import background_workers
from . import sidecar_client
import smtplib
from email.mime.text import MIMEText

pyautogui = None
try:
    import pyautogui
    # Set pyautogui fail-safe (moves mouse to corner aborts)
    pyautogui.FAILSAFE = False
except Exception as e:
    print(f"Warning: pyautogui failed to load (Xvfb matrix offline?): {e}")

# Boot up the custom Python plugin folder dynamically:
load_plugins()

# Initialize Global ChromaDB Vector Vault
try:
    import chromadb
    from chromadb.config import Settings
    chroma_client = chromadb.PersistentClient(path="./chroma_db", settings=Settings(allow_reset=True))
    # We will use the default SentenceTransformer embedding function natively provided by Chroma
    memory_collection = chroma_client.get_or_create_collection(name="openzess_memory")
except Exception as e:
    print(f"Warning: ChromaDB failed to initialize {e}")
    memory_collection = None

# ---- NATIVE TOOLS ----
def run_terminal_command(command: str) -> str:
    try:
        if platform.system() == "Windows":
            # Try default WSL first, fallback to PowerShell
            try:
                result = subprocess.run(["wsl", "bash", "-c", command], capture_output=True, text=True, timeout=30)
                if result.returncode == 0 or (result.stdout and not result.stderr):
                    return result.stdout
            except Exception:
                pass
            result = subprocess.run(["powershell", "-NoProfile", "-Command", command], capture_output=True, text=True, timeout=30)
            return result.stdout if result.stdout else result.stderr
        else:
            result = subprocess.run(["bash", "-c", command], capture_output=True, text=True, timeout=30)
            return result.stdout if result.stdout else result.stderr
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
        if not os.path.exists(filepath):
            return f"Error: File does not exist."
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            return content[:15000] if len(content) > 15000 else content
    except Exception as e:
        return str(e)

def edit_code(filepath: str, old_string: str, new_string: str) -> str:
    try:
        if not os.path.exists(filepath):
            return f"Error: File does not exist."
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
        return f"Typed text successfully."
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

PROVIDER_MODELS = {
    "gemini": "gemini/gemini-2.5-flash",
    "openai": "openai/gpt-4o-mini",
    "anthropic": "anthropic/claude-3-5-sonnet-20241022",
    "groq": "groq/llama-3.3-70b-versatile",
    "ollama": "ollama/llama3.2",
    "deepseek": "openrouter/deepseek/deepseek-chat",
    "deepseek2": "openrouter/deepseek/deepseek-chat",
    "deepseek3": "openrouter/deepseek/deepseek-chat",
    "qwen": "openrouter/qwen/qwen-2.5-72b-instruct",
    "glm": "openrouter/z-ai/glm-5.3-flash",
    "kimi": "openrouter/moonshotai/moonshot-v1-8k"
}

class OpenzessAgent:
    def __init__(self, api_key: str = "", provider: str = "gemini", history: list = None, system_instruction: str = None, allowed_tools: list = None):
        # Fallback to environment variables if client-side api_key is empty
        if not api_key or not str(api_key).strip():
            if provider == "gemini":
                self.api_key = os.environ.get("GEMINI_API_KEY", "")
            elif provider == "openai":
                self.api_key = os.environ.get("OPENAI_API_KEY", "")
            elif provider == "anthropic":
                self.api_key = os.environ.get("ANTHROPIC_API_KEY", "")
            elif provider == "groq":
                self.api_key = os.environ.get("GROQ_API_KEY", "")
            else:
                self.api_key = os.environ.get("OPENROUTER_API_KEY", os.environ.get("DEEPSEEK_API_KEY", ""))
        else:
            self.api_key = api_key

        if provider in PROVIDER_MODELS:
            self.model_name = PROVIDER_MODELS[provider]
        elif "/" in provider:
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
        elif ("openrouter/" in self.model_name or (self.api_key and self.api_key.startswith("sk-or-"))) and self.api_key:
            os.environ["OPENROUTER_API_KEY"] = self.api_key
        
        # Smart route Native DeepSeek API keys to their direct litellm endpoint
        if "deepseek" in provider and self.api_key and not self.api_key.startswith("sk-or-"):
            if provider == "deepseek3":
                self.model_name = "deepseek/deepseek-reasoner"
            else:
                self.model_name = "deepseek/deepseek-chat"
        
        self.messages = []
        default_inst = "You are openzess, a self-growing AI agent and coding assistant. You can synthesize your own tools, write code, persist memories into your ChromaDB vector vault, and execute commands inside a secure Linux Debian WSL sandbox."
        self.messages.append({"role": "system", "content": system_instruction if system_instruction else default_inst})
        
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

    def _run_tool(self, name: str, args: dict) -> str:
        sid = mcp_registry.find_server_for_tool(name)
        if sid:
            return mcp_registry.call_tool(name, args)
            
        if name in native_tool_funcs:
            return native_tool_funcs[name](**args)
            
        return f"Unknown tool: {name}"

    def _handle_response_loop(self):
        tool_outputs = []
        
        while True:
            response = litellm.completion(
                model=self.model_name,
                messages=self.messages,
                tools=self.tools if self.tools else None,
                api_key=self.api_key
            )
            
            message = response.choices[0].message
            # Filter litellm specific attributes to keep dict clean for next chat round
            msg_dict = message.model_dump()
            if "function_call" in msg_dict and msg_dict["function_call"] is None:
                del msg_dict["function_call"]
            
            self.messages.append(msg_dict)
            
            if not message.tool_calls:
                return {"reply": message.content, "tools": tool_outputs, "auth_required": False}
                
            dangerous_tools = ["run_terminal_command", "create_file", "edit_code", "schedule_background_task", "monitor_directory", "computer_mouse_move", "computer_mouse_click", "computer_type_text", "computer_press_key", "send_email", "synthesize_skill"]
            
            pending_calls = []
            for tc in message.tool_calls:
                args = json.loads(tc.function.arguments)
                pending_calls.append({"id": tc.id, "name": tc.function.name, "args": args})

            requires_auth = any(pc["name"] in dangerous_tools for pc in pending_calls)
            if requires_auth:
                return {
                    "reply": None,
                    "auth_required": True,
                    "pending_calls": pending_calls
                }
            
            # Auto-execute safe tools
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
                        import os
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

    def chat(self, user_prompt: str):
        try:
            self.last_prompt = user_prompt
            
            # --- RAG RETRIEVAL ---
            rag_context = ""
            if memory_collection is not None:
                try:
                    results = memory_collection.query(query_texts=[user_prompt], n_results=3)
                    if results and results.get("documents") and results["documents"] and results["documents"][0]:
                        rag_context = "\n\n[SYSTEM WARNING - RELEVANT PAST LONG-TERM MEMORY EXTRACTED FOR CONTEXT]:\n"
                        for doc in results["documents"][0]:
                            if doc.strip():
                                rag_context += f"- {doc}\n"
                except Exception as eval_e:
                    print(f"RAG Retrieval failed: {eval_e}")
            
            enhanced_prompt = user_prompt + rag_context if rag_context else user_prompt
            self.messages.append({"role": "user", "content": enhanced_prompt})
            
            result = self._handle_response_loop()
            
            # --- RAG INGESTION ---
            if not result.get("auth_required") and result.get("reply") and memory_collection is not None:
                self._ingest_memory(self.last_prompt, result["reply"])
                
            return result
        except BaseException as e:
            import traceback
            traceback.print_exc()
            raise e

    def chat_stream(self, user_prompt: str):
        try:
            self.last_prompt = user_prompt
            
            rag_context = ""
            if memory_collection is not None:
                try:
                    results = memory_collection.query(query_texts=[user_prompt], n_results=3)
                    if results and results.get("documents") and results["documents"] and results["documents"][0]:
                        rag_context = "\n\n[SYSTEM WARNING - RELEVANT PAST LONG-TERM MEMORY EXTRACTED FOR CONTEXT]:\n"
                        for doc in results["documents"][0]:
                            if doc.strip():
                                rag_context += f"- {doc}\n"
                except Exception as eval_e:
                    print(f"RAG Retrieval failed: {eval_e}")
            
            enhanced_prompt = user_prompt + rag_context if rag_context else user_prompt
            self.messages.append({"role": "user", "content": enhanced_prompt})
            
            tool_outputs = []
            
            while True:
                response_stream = litellm.completion(
                    model=self.model_name,
                    messages=self.messages,
                    tools=self.tools if self.tools else None,
                    stream=True,
                    api_key=self.api_key
                )
                
                collected_content = ""
                tool_calls = []

                for chunk in response_stream:
                    delta = chunk.choices[0].delta
                    
                    if delta.content:
                        collected_content += delta.content
                        yield {"type": "content", "content": delta.content}
                        
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

                msg_dict = {"role": "assistant"}
                if tool_calls:
                     msg_dict["tool_calls"] = tool_calls
                     # Some APIs require content to be present, even if empty string
                     msg_dict["content"] = collected_content if collected_content else ""
                else:
                     msg_dict["content"] = collected_content if collected_content else ""
                     
                self.messages.append(msg_dict)
                
                if not tool_calls:
                    if collected_content and memory_collection is not None:
                        self._ingest_memory(self.last_prompt, collected_content)
                    yield {"type": "done", "auth_required": False, "reply": collected_content}
                    return
                    
                dangerous_tools = ["run_terminal_command", "create_file", "edit_code", "schedule_background_task", "monitor_directory", "computer_mouse_move", "computer_mouse_click", "computer_type_text", "computer_press_key", "send_email", "synthesize_skill"]
                
                pending_calls = []
                for tc in tool_calls:
                    args = {}
                    try:
                        args = json.loads(tc["function"]["arguments"])
                        # If args contains a dictionary with an identical string representation it might need strict loading
                    except:
                        try:
                            # fallback for bad quotes
                            import ast
                            args = ast.literal_eval(tc["function"]["arguments"])
                        except:
                            pass
                    pending_calls.append({"id": tc["id"], "name": tc["function"]["name"], "args": args})
                
                requires_auth = any(pc["name"] in dangerous_tools for pc in pending_calls)
                if requires_auth:
                    yield {
                        "type": "auth_required",
                        "pending_calls": pending_calls
                    }
                    return
                    
                for pc in pending_calls:
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
                            import os
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
            
            if not result.get("auth_required") and result.get("reply") and memory_collection is not None:
                if hasattr(self, 'last_prompt'):
                    self._ingest_memory(self.last_prompt, result["reply"])
                    
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
                    
        except BaseException as e:
            import traceback
