import os
import subprocess
import requests
from bs4 import BeautifulSoup
from duckduckgo_search import DDGS
import google.generativeai as genai
from google.generativeai.types import content_types

def run_terminal_command(command: str) -> str:
    """Executes a shell command on the user's machine (Windows)."""
    try:
        result = subprocess.run(command, shell=True, capture_output=True, text=True, timeout=15)
        return result.stdout if result.stdout else result.stderr
    except subprocess.TimeoutExpired:
        return "Command timed out."
    except Exception as e:
        return str(e)

def search_the_web(query: str) -> str:
    """Performs a web search using DuckDuckGo to get recent information."""
    try:
        results = DDGS().text(query, max_results=3)
        formatted_results = "\n\n".join(
            [f"Title: {res['title']}\nURL: {res['href']}\nSnippet: {res['body']}" for res in results]
        )
        return formatted_results if formatted_results else "No results found."
    except Exception as e:
        return f"Web search failed: {str(e)}"

def read_web_page(url: str) -> str:
    """Fetches and reads the text content of a given URL."""
    try:
        headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"}
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()
        soup = BeautifulSoup(response.text, "html.parser")
        text = " ".join(soup.stripped_strings)
        return text[:5000]
    except Exception as e:
        return f"Failed to read URL: {str(e)}"

def create_file(filepath: str, content: str) -> str:
    """Creates a new file at the specified path with the given content. Do not use for editing existing files."""
    try:
        os.makedirs(os.path.dirname(os.path.abspath(filepath)) or ".", exist_ok=True)
        if os.path.exists(filepath):
            return f"Error: File {filepath} already exists. Use edit_code to modify it."
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return f"File successfully created at {filepath}"
    except Exception as e:
        return f"Failed to create file: {str(e)}"

def read_file(filepath: str) -> str:
    """Reads the contents of a local file."""
    try:
        if not os.path.exists(filepath):
            return f"Error: File {filepath} does not exist."
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            return content[:15000] if len(content) > 15000 else content
    except Exception as e:
        return f"Failed to read file: {str(e)}"

def edit_code(filepath: str, old_string: str, new_string: str) -> str:
    """Edits an existing file by exactly replacing old_string with new_string."""
    try:
        if not os.path.exists(filepath):
            return f"Error: File {filepath} does not exist."
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        if old_string not in content:
            return f"Error: old_string not found in file. No changes made."
        new_content = content.replace(old_string, new_string)
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return f"Successfully updated {filepath}"
    except Exception as e:
        return f"Failed to edit file: {str(e)}"

tools = [run_terminal_command, search_the_web, read_web_page, create_file, read_file, edit_code]

class OpenzessAgent:
    def __init__(self, api_key: str, history: list = None, system_instruction: str = None, allowed_tools: list = None):
        genai.configure(api_key=api_key)
        
        active_tools = tools
        if allowed_tools is not None:
            active_tools = [t for t in tools if t.__name__ in allowed_tools]
            
        default_instruction = "You are openzess, a helpful AI coding assistant with a beautiful web UI. You can help the user by running terminal commands. You are currently running on a Windows system. Use general Windows/PowerShell commands where appropriate."
        
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            tools=active_tools,
            system_instruction=system_instruction if system_instruction else default_instruction
        )
        self.chat_session = self.model.start_chat(history=history if history else [])

    def _run_tool(self, name: str, args: dict) -> str:
        if name == "run_terminal_command": return run_terminal_command(args.get("command", ""))
        elif name == "search_the_web": return search_the_web(args.get("query", ""))
        elif name == "read_web_page": return read_web_page(args.get("url", ""))
        elif name == "create_file": return create_file(args.get("filepath", ""), args.get("content", ""))
        elif name == "read_file": return read_file(args.get("filepath", ""))
        elif name == "edit_code": return edit_code(args.get("filepath", ""), args.get("old_string", ""), args.get("new_string", ""))
        return f"Unknown tool: {name}"

    def _handle_response_loop(self, response):
        tool_outputs = []
        function_calls = [part.function_call for part in response.parts if part.function_call]
        
        while function_calls:
            dangerous_tools = ["run_terminal_command", "create_file", "edit_code"]
            requires_auth = any(fc.name in dangerous_tools for fc in function_calls)
            
            if requires_auth:
                return {
                    "reply": None,
                    "auth_required": True,
                    "pending_calls": [{"name": fc.name, "args": dict(fc.args)} for fc in function_calls]
                }
            
            function_responses = []
            for fc in function_calls:
                output = self._run_tool(fc.name, dict(fc.args))
                tool_outputs.append({"tool": fc.name, "args": dict(fc.args), "output": output})
                function_responses.append(content_types.Part.from_function_response(name=fc.name, response={"result": output}))
            
            response = self.chat_session.send_message(function_responses)
            function_calls = [part.function_call for part in response.parts if part.function_call]
            
        return {"reply": response.text, "tools": tool_outputs, "auth_required": False}

    def chat(self, user_prompt: str):
        try:
            response = self.chat_session.send_message(user_prompt)
            return self._handle_response_loop(response)
        except Exception as e:
            return {"reply": f"An error occurred: {str(e)}", "tools": [], "auth_required": False}

    def execute_pending_tools(self, pending_calls: list, approved: bool):
        try:
            function_responses = []
            tool_outputs = []
            for call in pending_calls:
                name = call["name"]
                args = call["args"]
                
                if not approved:
                    output = "Execution halted: USER DENIED PERMISSION to run this tool."
                else:
                    output = self._run_tool(name, args)
                    
                tool_outputs.append({"tool": name, "args": args, "output": output})
                function_responses.append(content_types.Part.from_function_response(name=name, response={"result": output}))
                
            response = self.chat_session.send_message(function_responses)
            result = self._handle_response_loop(response)
            
            if result.get("tools"):
                tool_outputs.extend(result["tools"])
            result["tools"] = tool_outputs
            return result
        except Exception as e:
            return {"reply": f"An error occurred: {str(e)}", "tools": [], "auth_required": False}
