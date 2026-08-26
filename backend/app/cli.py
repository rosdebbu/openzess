"""
Openzess Cyberpunk Matrix Terminal CLI (Hermes-Grade TUI).
Features 3D ASCII branding, categorized capabilities box, turn dividers,
real-time token streaming, habit profiling, and bottom status line.
"""

import os
import sys
import time
import uuid
from typing import Dict, List, Optional
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.text import Text
from rich.box import ROUNDED, HEAVY, DOUBLE

from .agent import OpenzessAgent, PROVIDER_MODELS, memory_collection
from .plugin_loader import plugin_registry, load_plugins
from . import habit_learner


# Reconfigure stdout for UTF-8 on Windows
if hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding="utf-8")
    except Exception:
        pass

console = Console()

# Amber & Cyberpunk Theme Color Constants
AMBER = "\033[38;5;214m"
GOLD = "\033[38;5;220m"
ORANGE = "\033[38;5;208m"
CYAN = "\033[38;5;51m"
GREEN = "\033[38;5;82m"
MAGENTA = "\033[38;5;201m"
DIM = "\033[2m"
BOLD = "\033[1m"
RESET = "\033[0m"


OPENZESS_ASCII_LOGO = f"""{AMBER}{BOLD}
 ██████╗ ██████╗ ███████╗███╗   ██╗███████╗███████╗███████╗
██╔═══██╗██╔══██╗██╔════╝████╗  ██║╚══███╔╝██╔════╝██╔════╝
██║   ██║██████╔╝█████╗  ██╔██╗ ██║  ███╔╝ █████╗  ███████╗
██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║ ███╔╝  ██╔══╝  ╚════██║
╚██████╔╝██║     ███████╗██║ ╚████║███████╗███████╗███████║
 ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝╚══════╝{RESET}"""

SEAHORSE_TOTEM = f"""{GOLD}
       .---.
      /     \\
     | () () |
      \\  -  /
     /`---'\\
    / /| |\\ \\
   / / | | \\ \\
  ( (  | |  ) )
   \\ \\_|_/ /
    `-----'{RESET}"""


def render_dashboard_box(agent: OpenzessAgent, session_id: str):
    """Renders the rich categorized card matching the Hermes Agent layout."""
    
    # Left column content
    habits_count = len(habit_learner.get_all_habits())
    memory_count = memory_collection.count() if memory_collection else 0
    
    left_text = (
        f"{SEAHORSE_TOTEM}\n\n"
        f" {GOLD}{BOLD}{agent.provider.upper()}{RESET} {DIM}·{RESET} {AMBER}{agent.model_name.split('/')[-1]}{RESET}\n"
        f" {DIM}Sandbox :{RESET} {CYAN}Debian 13 WSL (rossdeb){RESET}\n"
        f" {DIM}Engine  :{RESET} {GREEN}70% Python + 30% Rust{RESET}\n"
        f" {DIM}Session :{RESET} {DIM}{session_id}{RESET}\n"
    )
    
    # Group tools by category
    tools_by_cat = {
        "terminal": "run_terminal_command, view_terminal_logs",
        "filesystem": "create_file, read_file, edit_code",
        "browser": "search_the_web, read_web_page",
        "memory": "save_memory, recall_memory",
        "evolution": "synthesize_skill, reload_plugins",
        "matrix": "computer_mouse_click, computer_type_text"
    }
    
    tools_str = ""
    for cat, tools in tools_by_cat.items():
        tools_str += f"  {AMBER}{cat}:{RESET} {DIM}{tools}{RESET}\n"
    
    skills_by_cat = {
        "autonomous-coding": "codebase-inspector, test-runner, error-debugger",
        "system-ops": "debian-bash-executor, background-cron, port-monitor",
        "creative": "architecture-diagram, graphify-visualizer, ascii-art",
        "memory-vault": "chromadb-vector-rag, habit-profiler, skill-learner"
    }
    
    skills_str = ""
    for cat, skills in skills_by_cat.items():
        skills_str += f"  {AMBER}{cat}:{RESET} {DIM}{skills}{RESET}\n"

    right_text = (
        f"{GOLD}{BOLD}Available Tools{RESET}\n"
        f"{tools_str}\n"
        f"{GOLD}{BOLD}Available Skills{RESET}\n"
        f"{skills_str}\n"
        f"{DIM}{len(agent.tools)} native tools  ·  {len(plugin_registry.funcs)} hot-loaded plugins  ·  {habits_count} learned habits  ·  {GREEN}/help for commands{RESET}"
    )

    # Build side-by-side Table
    grid = Table.grid(expand=True, padding=(0, 2))
    grid.add_column(ratio=3, justify="left")
    grid.add_column(ratio=7, justify="left")
    grid.add_row(Text.from_ansi(left_text), Text.from_ansi(right_text))

    panel = Panel(
        grid,
        title=f"[bold yellow]Openzess Agent v2.5.0 (2026.8.27) · upstream hybrid · local matrix[/bold yellow]",
        border_style="yellow",
        box=ROUNDED,
        padding=(1, 2)
    )
    
    print(OPENZESS_ASCII_LOGO)
    console.print(panel)
    print()


def show_help_menu():
    print(f"\n{GOLD}{BOLD}Available Slash Commands:{RESET}")
    print(f"  {AMBER}/model <provider>{RESET}  Switch active LLM (glm, deepseek, gemini, groq, ollama, lmstudio)")
    print(f"  {AMBER}/habits{RESET}            Inspect learned user habits & adaptive behavioral profile")
    print(f"  {AMBER}/skills{RESET}            List all hot-loaded Python plugins & synthesized tools")
    print(f"  {AMBER}/memory <query>{RESET}    Search ChromaDB vector memory vault semantically")
    print(f"  {AMBER}/clear{RESET}             Reset current conversation context")
    print(f"  {AMBER}/help{RESET}              Display this help menu")
    print(f"  {AMBER}/exit{RESET} or {AMBER}/quit{RESET}     Exit the console cleanly\n")


def run_cli():
    # Load plugins on start
    load_plugins()
    
    current_provider = os.environ.get("OPENZESS_PROVIDER", "glm")
    api_key = os.environ.get("OPENROUTER_API_KEY", os.environ.get("GEMINI_API_KEY", ""))
    session_id = f"{time.strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:6]}"
    
    agent = OpenzessAgent(api_key=api_key, provider=current_provider)
    
    # Render the gorgeous full Hermes-style header box
    render_dashboard_box(agent, session_id)
    
    print(f"{DIM}Welcome to Openzess Agent! Type your prompt or {GOLD}/help{DIM} for commands.{RESET}")
    print(f"{AMBER}✦ Tip:{RESET} {DIM}Openzess automatically profiles your habits and persists skills to Debian WSL.{RESET}\n")

    while True:
        try:
            # Bottom status bar line
            status_line = (
                f"{DIM}────────────────────────────────────────────────────────────────────────────{RESET}\n"
                f"{GOLD}⚡ {agent.provider}:{agent.model_name.split('/')[-1]}{RESET} {DIM}|{RESET} "
                f"{CYAN}Debian: rossdeb{RESET} {DIM}|{RESET} "
                f"{GREEN}Rust: 8100{RESET} {DIM}|{RESET} "
                f"{MAGENTA}Memory: {memory_collection.count() if memory_collection else 0} recs{RESET}\n"
                f"{DIM}💡 Enter prompt · /skills · /habits · /model · /memory · Ctrl+C cancel{RESET}"
            )
            print(status_line)

            user_input = input(f"{AMBER}{BOLD}❯{RESET} ").strip()
            if not user_input:
                continue

            # Slash commands handling
            if user_input.startswith("/"):
                parts = user_input.split(" ", 1)
                cmd = parts[0].lower()
                arg = parts[1].strip() if len(parts) > 1 else ""

                if cmd in ("/exit", "/quit", "/q"):
                    print(f"\n{AMBER}Shutting down Openzess CLI. Have a productive session!{RESET}\n")
                    break

                elif cmd in ("/help", "/h"):
                    show_help_menu()
                    continue

                elif cmd == "/clear":
                    agent.messages = []
                    profile = habit_learner.get_user_profile_prompt()
                    agent.messages.append({"role": "system", "content": f"You are openzess, a self-growing AI agent.{profile}"})
                    print(f"\n{GREEN}✓ Conversation memory cleared.{RESET}\n")
                    continue

                elif cmd == "/habits":
                    habits = habit_learner.get_all_habits()
                    print(f"\n{MAGENTA}{BOLD}🧠 Learned User Habits & Behavioral Profile:{RESET}")
                    if not habits:
                        print(f"  {DIM}No specific habits learned yet. As you talk, Openzess learns automatically.{RESET}")
                    else:
                        for k, v in habits.items():
                            print(f"  {GOLD}• {k.replace('_', ' ').title()}:{RESET} {v}")
                    print()
                    continue

                elif cmd == "/skills":
                    print(f"\n{GOLD}{BOLD}🧬 Hot-Loaded Skills & Plugins:{RESET}")
                    for schema in agent.tools:
                        fn = schema.get("function", {})
                        print(f"  {CYAN}@{fn.get('name')}{RESET}: {DIM}{fn.get('description')[:75]}...{RESET}")
                    print()
                    continue

                elif cmd == "/memory":
                    if not arg:
                        print(f"{AMBER}Usage: /memory <search query>{RESET}")
                    else:
                        print(f"\n{MAGENTA}Querying ChromaDB Vector Vault for '{arg}'...{RESET}")
                        if memory_collection:
                            res = memory_collection.query(query_texts=[arg], n_results=3)
                            if res and res.get("documents") and res["documents"][0]:
                                for i, doc in enumerate(res["documents"][0]):
                                    print(f"  {GOLD}[{i+1}]{RESET} {doc}\n")
                            else:
                                print(f"  {DIM}No matching vector memories found.{RESET}\n")
                    continue

                elif cmd == "/model":
                    if not arg:
                        print(f"{AMBER}Current provider: {current_provider}. Usage: /model <glm|deepseek|gemini|groq|ollama|lmstudio>{RESET}\n")
                    else:
                        current_provider = arg
                        agent = OpenzessAgent(api_key=api_key, provider=current_provider)
                        print(f"\n{GREEN}✓ Active model switched to: {agent.model_name}{RESET}\n")
                    continue

                else:
                    print(f"{AMBER}Unknown slash command '{cmd}'. Type /help for options.{RESET}\n")
                    continue

            # Turn delimiter (Golden bar + prompt header)
            print(f"\n{GOLD}● {user_input}{RESET}")
            print(f"{DIM}Initializing agent...{RESET}")
            print(f"{AMBER}{BOLD}─ ⚡ Openzess ────────────────────────────────────────────────────────────{RESET}")

            t0 = time.time()
            first_token_time = None
            total_chars = 0

            for chunk in agent.chat_stream(user_input):
                ctype = chunk.get("type")
                if ctype == "content":
                    if first_token_time is None:
                        first_token_time = time.time() - t0
                    text = chunk.get("content", "")
                    total_chars += len(text)
                    sys.stdout.write(text)
                    sys.stdout.flush()
                elif ctype == "tool_start":
                    sys.stdout.write(f"\n\n{CYAN}⚙️  Executing @{chunk.get('tool')}...{RESET}\n")
                    sys.stdout.flush()
                elif ctype == "tool_result":
                    output = chunk.get("output", "")
                    preview = str(output)[:140] + ("..." if len(str(output)) > 140 else "")
                    sys.stdout.write(f"{DIM}   ↳ Result: {preview}{RESET}\n\n")
                    sys.stdout.flush()
                elif ctype == "error":
                    sys.stdout.write(f"\n\n{AMBER}❌ Error: {chunk.get('error')}{RESET}\n\n")
                    sys.stdout.flush()

            total_time = time.time() - t0
            lat_str = f"{first_token_time:.2f}s" if first_token_time else f"{total_time:.2f}s"
            print(f"\n{DIM}[Latency: {lat_str} · Total: {total_time:.2f}s]{RESET}\n")

        except KeyboardInterrupt:
            print(f"\n{AMBER}Operation interrupted. Type /exit to quit.{RESET}\n")
        except Exception as e:
            print(f"\n{AMBER}Error: {e}{RESET}\n")


if __name__ == "__main__":
    run_cli()
