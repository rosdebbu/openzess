import os
import json
import subprocess
from dotenv import load_dotenv
from openai import OpenAI

load_dotenv()

client = OpenAI(api_key=os.environ.get("OPENAI_API_KEY"))

# 1. Define the tool (Skill) your agent can use
tools = [
    {
        "type": "function",
        "function": {
            "name": "run_terminal_command",
            "description": "Executes a shell command on the user's machine.",
            "parameters": {
                "type": "object",
                "properties": {
                    "command": {
                        "type": "string",
                        "description": "The bash/shell command to run."
                    }
                },
                "required": ["command"],
            },
        }
    }
]

# 2. The function that actually executes the tool
def run_terminal_command(command):
    print(f"\n[AGENT WANTS TO RUN]: {command}")
    user_input = input("Allow? (y/n): ")
    if user_input.lower() != 'y':
        return "User denied the command."
    
    try:
        # Note: on Windows we use PowerShell or CMD. `shell=True` will use the default system shell.
        result = subprocess.run(command, shell=True, capture_output=True, text=True)
        return result.stdout if result.stdout else result.stderr
    except Exception as e:
        return str(e)

# 3. The main agent loop
def run_agent():
    print("🤖 Welcome to openzess Prototype! Type 'exit' to quit.")
    
    # Give the agent a personality and instructions
    messages = [
        {"role": "system", "content": "You are openzess, a helpful AI coding assistant. You can help the user by running terminal commands to list files, read code, or check the environment. You are currently running on a Windows system. Use general Windows/PowerShell commands where appropriate."}
    ]
    
    while True:
        user_prompt = input("\nYou: ")
        if user_prompt.lower() == 'exit':
            break
            
        messages.append({"role": "user", "content": user_prompt})
        
        # Ask the LLM what to do
        response = client.chat.completions.create(
            model="gpt-4o-mini", # or gpt-4o
            messages=messages,
            tools=tools,
            tool_choice="auto"
        )
        
        response_message = response.choices[0].message
        messages.append(response_message)
        
        # Check if the LLM decided to use a tool
        if response_message.tool_calls:
            for tool_call in response_message.tool_calls:
                if tool_call.function.name == "run_terminal_command":
                    args = json.loads(tool_call.function.arguments)
                    
                    # Execute the tool
                    command_output = run_terminal_command(args["command"])
                    print(f"\n[COMMAND OUTPUT]:\n{command_output}")
                    
                    # Send the result back to the LLM
                    messages.append({
                        "role": "tool",
                        "tool_call_id": tool_call.id,
                        "name": tool_call.function.name,
                        "content": command_output
                    })
            
            # Get the final answer from the LLM after it sees the command output
            final_response = client.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages
            )
            print(f"\n🤖 openzess: {final_response.choices[0].message.content}")
        else:
            # If no tool was called, just print the text response
            print(f"\n🤖 openzess: {response_message.content}")

if __name__ == "__main__":
    run_agent()
