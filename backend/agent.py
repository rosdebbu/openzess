import os
import subprocess
import requests
import uuid
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
from mcp_manager import mcp_registry
import json
import litellm
import background_workers

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
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=15)
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

native_tool_funcs = {
    "run_terminal_command": run_terminal_command,
    "search_the_web": search_the_web,
    "read_web_page": read_web_page,
    "create_file": create_file,
    "read_file": read_file,
    "edit_code": edit_code,
    "schedule_background_task": schedule_background_task,
    "monitor_directory": monitor_directory
}

NATIVE_TOOL_SCHEMAS = [
    {
        "type": "function",
        "function": {
            "name": "run_terminal_command",
            "description": "Executes a shell command on the user's machine (Windows PowerShell).",
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
    }
]

PROVIDER_MODELS = {
    "gemini": "gemini/gemini-2.5-flash",
    "openai": "openai/gpt-4o-mini",
    "anthropic": "anthropic/claude-3-5-sonnet-20241022",
    "groq": "groq/llama-3.3-70b-versatile",
    "ollama": "ollama/llama3.2"
}

class OpenzessAgent:
    def __init__(self, api_key: str, provider: str = "gemini", history: list = None, system_instruction: str = None, allowed_tools: list = None):
        if provider == "gemini":
            os.environ["GEMINI_API_KEY"] = api_key
        elif provider == "openai":
            os.environ["OPENAI_API_KEY"] = api_key
        elif provider == "anthropic":
            os.environ["ANTHROPIC_API_KEY"] = api_key
        elif provider == "groq":
            os.environ["GROQ_API_KEY"] = api_key

        self.model_name = PROVIDER_MODELS.get(provider, "openai/gpt-4o-mini")
        
        self.messages = []
        default_inst = "You are openzess, a helpful AI coding assistant. You can help the user by running terminal commands on a Windows system. Use general Windows/PowerShell commands where appropriate."
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
                tools=self.tools if self.tools else None
            )
            
            message = response.choices[0].message
            # Filter litellm specific attributes to keep dict clean for next chat round
            msg_dict = message.model_dump()
            if "function_call" in msg_dict and msg_dict["function_call"] is None:
                del msg_dict["function_call"]
            
            self.messages.append(msg_dict)
            
            if not message.tool_calls:
                return {"reply": message.content, "tools": tool_outputs, "auth_required": False}
                
            dangerous_tools = ["run_terminal_command", "create_file", "edit_code", "schedule_background_task", "monitor_directory"]
            
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
            return {"reply": f"An error occurred: {str(e)}", "tools": [], "auth_required": False}
