# Graph Report - openzess  (2026-04-23)

## Corpus Check
- 55 files · ~66,167 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 305 nodes · 409 edges · 19 communities detected
- Extraction: 81% EXTRACTED · 19% INFERRED · 0% AMBIGUOUS · INFERRED: 79 edges (avg confidence: 0.73)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 14|Community 14]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]

## God Nodes (most connected - your core abstractions)
1. `OpenzessAgent` - 32 edges
2. `MCPManager` - 13 edges
3. `chat()` - 10 edges
4. `start()` - 7 edges
5. `verify_sandbox_environment()` - 7 edges
6. `CronManager` - 6 edges
7. `AgentWatchdogHandler` - 5 edges
8. `WatchManager` - 5 edges
9. `add_message()` - 5 edges
10. `swarm_debate_stream()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `Dispatches a prompt to multiple specialized agents simultaneously.         squad` --uses--> `OpenzessAgent`  [INFERRED]
  backend\swarm_manager.py → backend\agent.py
- `run_terminal_command()` --calls--> `run()`  [INFERRED]
  backend\agent.py → backend\mcp_test.py
- `start_telegram_listener()` --calls--> `start()`  [INFERRED]
  backend\telegram_worker.py → main.py
- `toggleListen()` --calls--> `start()`  [INFERRED]
  frontend\src\pages\Chat.tsx → main.py
- `SwarmManager` --uses--> `OpenzessAgent`  [INFERRED]
  backend\swarm_manager.py → backend\agent.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.09
Nodes (28): OpenzessAgent, BaseModel, add_message(), create_session(), Session, anthropic_messages(), AnthropicChatRequest, AnthropicMessage (+20 more)

### Community 1 - "Community 1"
Cohesion: 0.09
Nodes (21): Base, add_or_update_mcp_server(), add_or_update_persona(), create_note(), delete_message(), delete_session(), get_all_notes(), get_all_personas() (+13 more)

### Community 2 - "Community 2"
Cohesion: 0.09
Nodes (13): monitor_directory(), Schedules a native agent action to run automatically in the background at an int, Mounts a filesystem watchdog on a folder. When the folder changes, the Agent wil, schedule_background_task(), AgentWatchdogHandler, CronManager, WatchManager, FileSystemEventHandler (+5 more)

### Community 3 - "Community 3"
Cohesion: 0.13
Nodes (9): get_all_mcp_servers(), remove_mcp_server(), MCPManager, Helper to run coroutines in the background loop from sync functions, run(), disconnect_mcp(), init_active_mcps(), list_tools() (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (6): toggleListen(), start_discord_listener(), stop_discord_listener(), start(), start_discord(), stop_discord()

### Community 5 - "Community 5"
Cohesion: 0.21
Nodes (11): computer_mouse_click(), computer_mouse_move(), computer_press_key(), computer_type_text(), Ensure we are strictly operating inside the WSL Linux sandbox and dependencies l, read_web_page(), run_agent(), run_terminal_command() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.25
Nodes (8): get_discord_status(), get_mcp_servers(), get_telegram_status(), start_telegram(), stop_telegram(), get_status(), start_telegram_listener(), stop_telegram_listener()

### Community 8 - "Community 8"
Cohesion: 0.28
Nodes (3): deletePersona(), fetchPersonas(), handleFileUpload()

### Community 9 - "Community 9"
Cohesion: 0.29
Nodes (4): load_plugins(), Decorator to register a custom python tool into the agent native ecosystem!, Scans the designated plugins directory and hot-loads all valid python modules na, ToolRegistrar

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (5): import_persona(), parse_tavern_json(), parse_tavern_png(), Fallback parser for direct JSON character files., Parses a SillyTavern Character Card (PNG) to extract the hidden base64 'chara' J

### Community 11 - "Community 11"
Cohesion: 0.4
Nodes (2): Dispatches a prompt to multiple specialized agents simultaneously.         squad, SwarmManager

### Community 13 - "Community 13"
Cohesion: 0.7
Nodes (4): fetchServers(), handleAddCustom(), handleDeleteSaved(), toggleServer()

### Community 14 - "Community 14"
Cohesion: 0.7
Nodes (4): handleDeleteCustomSkill(), handleSaveCustomSkill(), loadSkills(), resetForm()

### Community 16 - "Community 16"
Cohesion: 0.67
Nodes (2): createWidgetWindow(), createWindow()

### Community 18 - "Community 18"
Cohesion: 0.83
Nodes (3): deleteJob(), fetchData(), handleCreate()

### Community 19 - "Community 19"
Cohesion: 0.5
Nodes (2): KnowledgeBase(), useToast()

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (2): fetchInstalled(), handleInstall()

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (2): saveKeys(), setErrorPrompt()

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (2): get_system_health(), Returns an aggressively formatted string of current PC metrics.

## Knowledge Gaps
- **9 isolated node(s):** `Schedules a native agent action to run automatically in the background at an int`, `Mounts a filesystem watchdog on a folder. When the folder changes, the Agent wil`, `Ensure we are strictly operating inside the WSL Linux sandbox and dependencies l`, `Helper to run coroutines in the background loop from sync functions`, `Decorator to register a custom python tool into the agent native ecosystem!` (+4 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 11`** (5 nodes): `swarm_manager.py`, `Dispatches a prompt to multiple specialized agents simultaneously.         squad`, `SwarmManager`, `.dispatch_squad_stream()`, `.__init__()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (4 nodes): `main.js`, `main.ts`, `createWidgetWindow()`, `createWindow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 19`** (4 nodes): `ToastContext.tsx`, `KnowledgeBase.tsx`, `KnowledgeBase()`, `useToast()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (4 nodes): `Marketplace.tsx`, `fetchInstalled()`, `handleInstall()`, `isInstalled()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (4 nodes): `WarRoom.tsx`, `if()`, `saveKeys()`, `setErrorPrompt()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (3 nodes): `system_health.py`, `get_system_health()`, `Returns an aggressively formatted string of current PC metrics.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OpenzessAgent` connect `Community 0` to `Community 11`, `Community 1`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `start()` connect `Community 4` to `Community 2`, `Community 7`?**
  _High betweenness centrality (0.061) - this node is a cross-community bridge._
- **Are the 23 inferred relationships involving `OpenzessAgent` (e.g. with `ChatRequest` and `ApprovalRequest`) actually correct?**
  _`OpenzessAgent` has 23 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `chat()` (e.g. with `create_session()` and `get_session_messages()`) actually correct?**
  _`chat()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `start()` (e.g. with `.__init__()` and `.add_watchdog()`) actually correct?**
  _`start()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Schedules a native agent action to run automatically in the background at an int`, `Mounts a filesystem watchdog on a folder. When the folder changes, the Agent wil`, `Ensure we are strictly operating inside the WSL Linux sandbox and dependencies l` to the rest of the system?**
  _9 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._