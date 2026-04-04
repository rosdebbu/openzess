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

tools = [run_terminal_command, search_the_web, read_web_page]

class OpenzessAgent:
    def __init__(self, api_key: str, history=None):
        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(
            model_name="gemini-2.5-flash",
            tools=tools,
            system_instruction="You are openzess, a helpful AI coding assistant with a beautiful web UI. You can help the user by running terminal commands. You are currently running on a Windows system. Use general Windows/PowerShell commands where appropriate."
        )
        self.chat_session = self.model.start_chat(history=history or [])

    def chat(self, user_prompt: str):
        try:
            response = self.chat_session.send_message(user_prompt)
            tool_outputs = []

            # Check if there are function calls in the response parts
            function_calls = [part.function_call for part in response.parts if part.function_call]
            
            while function_calls:
                function_responses = []
                for function_call in function_calls:
                    name = function_call.name
                    args = {k: v for k, v in function_call.args.items()}
                    
                    output = ""
                    if name == "run_terminal_command":
                        output = run_terminal_command(args.get("command", ""))
                    elif name == "search_the_web":
                        output = search_the_web(args.get("query", ""))
                    elif name == "read_web_page":
                        output = read_web_page(args.get("url", ""))
                        
                    tool_outputs.append({
                        "tool": name,
                        "args": args,
                        "output": output
                    })
                    
                    function_responses.append(
                        content_types.Part.from_function_response(
                            name=name,
                            response={"result": output}
                        )
                    )
                
                # Send the function results back to the model
                response = self.chat_session.send_message(function_responses)
                # Check again if the model wants to call more functions
                function_calls = [part.function_call for part in response.parts if part.function_call]

            return {"reply": response.text, "tools": tool_outputs}
            
        except Exception as e:
            return {"reply": f"An error occurred: {str(e)}", "tools": []}
