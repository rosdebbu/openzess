"""
Openzess Interactive Terminal CLI (Hermes-Style Console).
Runs natively in PowerShell, CMD, and Debian WSL2.
Features real-time token streaming, habit-learning, slash commands, and tool execution.
"""

import os
import sys
import time
from typing import Optional
from .agent import OpenzessAgent, PROVIDER_MODELS, memory_collection
from .plugin_loader import plugin_registry, load_plugins
from . import habit_learner


# ANSI Color codes for rich terminal styling
CYAN = "\033[96m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
MAGENTA = "\033[95m"
BLUE = "\033[94m"
BOLD = "\033[1m"
DIM = "\033[2m"
RESET = "\033[0m"


# Ensure UTF-8 output on Windows consoles
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

def print_banner():
    banner = f"""
{CYAN}{BOLD}========================================================================{RESET}
{CYAN}{BOLD}  OPENZESS :: Autonomous Hybrid AI Coding Agent & Terminal Matrix  {RESET}
{DIM}  Architecture: 70% Python + 30% Rust Sidecar · Sandbox: Debian 13 WSL2{RESET}
{CYAN}{BOLD}========================================================================{RESET}
"""
    print(banner)


def show_help():
    print(f"\n{YELLOW}{BOLD}Available Slash Commands:{RESET}")
    print(f"  {GREEN}/model <provider>{RESET}  Switch active model (glm, deepseek, gemini, groq, ollama)")
    print(f"  {GREEN}/habits{RESET}            Inspect learned user habits & adaptive profile")
    print(f"  {GREEN}/skills{RESET}            List all hot-loaded Python plugins & tools")
    print(f"  {GREEN}/memory <query>{RESET}    Search ChromaDB vector memory vault")
    print(f"  {GREEN}/clear{RESET}             Reset conversation history")
    print(f"  {GREEN}/help{RESET}              Show this help menu")
    print(f"  {GREEN}/exit{RESET} or {GREEN}/quit{RESET}     Exit the console\n")


def run_cli():
    print_banner()
    
    # Load plugins and habits on startup
    load_plugins()
    
    current_provider = os.environ.get("OPENZESS_PROVIDER", "glm")
    api_key = os.environ.get("OPENROUTER_API_KEY", os.environ.get("GEMINI_API_KEY", ""))
    
    agent = OpenzessAgent(api_key=api_key, provider=current_provider)
    
    print(f"{DIM}• Active Model  :{RESET} {GREEN}{agent.model_name}{RESET}")
    print(f"{DIM}• Active Tools  :{RESET} {YELLOW}{len(agent.tools)} tools registered{RESET}")
    print(f"{DIM}• Memory Vault  :{RESET} {MAGENTA}{memory_collection.count() if memory_collection else 0} records{RESET}")
    print(f"{DIM}• Type {GREEN}/help{DIM} for commands, or just start typing to chat and code.{RESET}\n")

    while True:
        try:
            prompt = input(f"{CYAN}{BOLD}openzess{RESET}{DIM} [{current_provider}]{RESET} {BOLD}❯{RESET} ").strip()
            if not prompt:
                continue

            # Slash commands handling
            if prompt.startswith("/"):
                parts = prompt.split(" ", 1)
                cmd = parts[0].lower()
                arg = parts[1].strip() if len(parts) > 1 else ""

                if cmd in ("/exit", "/quit", "/q"):
                    print(f"\n{YELLOW}Shutting down Openzess CLI. Goodbye!{RESET}")
                    break

                elif cmd in ("/help", "/h"):
                    show_help()
                    continue

                elif cmd == "/clear":
                    agent.messages = []
                    profile = habit_learner.get_user_profile_prompt()
                    agent.messages.append({"role": "system", "content": f"You are openzess, a self-growing AI agent and coding assistant.{profile}"})
                    print(f"{GREEN}✓ Conversation memory cleared.{RESET}\n")
                    continue

                elif cmd == "/habits":
                    habits = habit_learner.get_all_habits()
                    print(f"\n{MAGENTA}{BOLD}🧠 Learned User Habits & Profile:{RESET}")
                    if not habits:
                        print(f"  {DIM}No specific habits learned yet. As you talk and code, Openzess remembers automatically.{RESET}")
                    else:
                        for k, v in habits.items():
                            print(f"  {GREEN}• {k.replace('_', ' ').title()}:{RESET} {v}")
                    print()
                    continue

                elif cmd == "/skills":
                    print(f"\n{YELLOW}{BOLD}🧬 Hot-Loaded Skills & Plugins:{RESET}")
                    for schema in agent.tools:
                        fn = schema.get("function", {})
                        print(f"  {GREEN}@{fn.get('name')}{RESET}: {DIM}{fn.get('description')[:75]}...{RESET}")
                    print()
                    continue

                elif cmd == "/memory":
                    if not arg:
                        print(f"{YELLOW}Usage: /memory <search term>{RESET}")
                    else:
                        print(f"\n{MAGENTA}Searching ChromaDB for '{arg}'...{RESET}")
                        if memory_collection:
                            res = memory_collection.query(query_texts=[arg], n_results=3)
                            if res and res.get("documents") and res["documents"][0]:
                                for i, doc in enumerate(res["documents"][0]):
                                    print(f"  {DIM}[{i+1}]{RESET} {doc}\n")
                            else:
                                print(f"  {DIM}No matching memories found.{RESET}\n")
                    continue

                elif cmd == "/model":
                    if not arg:
                        print(f"{YELLOW}Current: {current_provider}. Usage: /model <glm|deepseek|gemini|groq|ollama>{RESET}")
                    else:
                        current_provider = arg
                        agent = OpenzessAgent(api_key=api_key, provider=current_provider)
                        print(f"{GREEN}✓ Switched model to: {agent.model_name}{RESET}\n")
                    continue

                else:
                    print(f"{YELLOW}Unknown command '{cmd}'. Type /help for options.{RESET}\n")
                    continue

            # Standard chat streaming loop
            print(f"\n{MAGENTA}{BOLD}Openzess:{RESET} ", end="", flush=True)
            
            for chunk in agent.chat_stream(prompt):
                ctype = chunk.get("type")
                if ctype == "content":
                    sys.stdout.write(chunk.get("content", ""))
                    sys.stdout.flush()
                elif ctype == "tool_start":
                    sys.stdout.write(f"\n{YELLOW}⚙️  Executing @{chunk.get('tool')}...{RESET}\n")
                    sys.stdout.flush()
                elif ctype == "tool_result":
                    output = chunk.get("output", "")
                    preview = str(output)[:120] + ("..." if len(str(output)) > 120 else "")
                    sys.stdout.write(f"{DIM}   ↳ Result: {preview}{RESET}\n")
                    sys.stdout.flush()
                elif ctype == "error":
                    sys.stdout.write(f"\n{YELLOW}❌ Error: {chunk.get('error')}{RESET}\n")
                    sys.stdout.flush()
                    
            print("\n")

        except KeyboardInterrupt:
            print(f"\n{YELLOW}Interrupt received. Type /exit to quit.{RESET}\n")
        except Exception as e:
            print(f"\n{YELLOW}Error: {e}{RESET}\n")


if __name__ == "__main__":
    run_cli()
