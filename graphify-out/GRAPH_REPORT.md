# Graph Report - openzess  (2026-04-26)

## Corpus Check
- 57 files · ~97,326 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 319 nodes · 424 edges · 22 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 0% AMBIGUOUS · INFERRED: 86 edges (avg confidence: 0.73)
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
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]

## God Nodes (most connected - your core abstractions)
1. `OpenzessAgent` - 34 edges
2. `MCPManager` - 13 edges
3. `chat()` - 10 edges
4. `start()` - 7 edges
5. `verify_sandbox_environment()` - 7 edges
6. `CronManager` - 6 edges
7. `migrate()` - 6 edges
8. `AgentWatchdogHandler` - 5 edges
9. `WatchManager` - 5 edges
10. `Session` - 5 edges

## Surprising Connections (you probably didn't know these)
- `OpenzessAgent` --uses--> `Dispatches a prompt to multiple specialized agents simultaneously.         squad`  [INFERRED]
  backend\agent.py → backend\swarm_manager.py
- `run_terminal_command()` --calls--> `run()`  [INFERRED]
  backend\agent.py → backend\mcp_test.py
- `start()` --calls--> `start_telegram_listener()`  [INFERRED]
  main.py → backend\telegram_worker.py
- `start()` --calls--> `toggleListen()`  [INFERRED]
  main.py → frontend\src\pages\Chat.tsx
- `Returns parsed stats from the graphify GRAPH_REPORT.md for the frontend panel.` --uses--> `OpenzessAgent`  [INFERRED]
  backend\server.py → backend\agent.py

## Communities

### Community 0 - "Community 0"
Cohesion: 0.08
Nodes (32): OpenzessAgent, BaseModel, add_message(), create_session(), Context manager for safe DB sessions with auto-rollback on errors., Session, anthropic_messages(), AnthropicChatRequest (+24 more)

### Community 1 - "Community 1"
Cohesion: 0.08
Nodes (24): Base, add_or_update_persona(), create_note(), delete_message(), delete_session(), get_all_notes(), get_all_personas(), get_all_sessions() (+16 more)

### Community 2 - "Community 2"
Cohesion: 0.08
Nodes (14): monitor_directory(), Schedules a native agent action to run automatically in the background at an int, Mounts a filesystem watchdog on a folder. When the folder changes, the Agent wil, schedule_background_task(), AgentWatchdogHandler, CronManager, Fire the agent via the internal /api/chat endpoint., WatchManager (+6 more)

### Community 3 - "Community 3"
Cohesion: 0.12
Nodes (10): add_or_update_mcp_server(), get_all_mcp_servers(), MCPManager, Helper to run coroutines in the background loop from sync functions, run(), connect_mcp(), disconnect_mcp(), get_mcp_servers() (+2 more)

### Community 4 - "Community 4"
Cohesion: 0.1
Nodes (6): toggleListen(), start_discord_listener(), stop_discord_listener(), start(), start_discord(), stop_discord()

### Community 5 - "Community 5"
Cohesion: 0.19
Nodes (11): computer_mouse_click(), computer_mouse_move(), computer_press_key(), computer_type_text(), Ensure we are strictly operating inside the WSL Linux sandbox and dependencies l, read_web_page(), run_agent(), run_terminal_command() (+3 more)

### Community 7 - "Community 7"
Cohesion: 0.28
Nodes (3): deletePersona(), fetchPersonas(), handleFileUpload()

### Community 8 - "Community 8"
Cohesion: 0.29
Nodes (7): get_discord_status(), get_telegram_status(), start_telegram(), stop_telegram(), get_status(), start_telegram_listener(), stop_telegram_listener()

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
Cohesion: 0.5
Nodes (2): KnowledgeBase(), useToast()

### Community 19 - "Community 19"
Cohesion: 0.83
Nodes (3): deleteJob(), fetchData(), handleCreate()

### Community 20 - "Community 20"
Cohesion: 0.67
Nodes (2): fetchInstalled(), handleInstall()

### Community 23 - "Community 23"
Cohesion: 0.67
Nodes (2): saveKeys(), setErrorPrompt()

### Community 24 - "Community 24"
Cohesion: 0.67
Nodes (2): get_system_health(), Returns an aggressively formatted string of current PC metrics.

### Community 48 - "Community 48"
Cohesion: 1.0
Nodes (1): Schedules a native agent action to run automatically in the background at an int

### Community 49 - "Community 49"
Cohesion: 1.0
Nodes (1): Mounts a filesystem watchdog on a folder. When the folder changes, the Agent wil

### Community 50 - "Community 50"
Cohesion: 1.0
Nodes (1): Ensure we are strictly operating inside the WSL Linux sandbox and dependencies l

## Knowledge Gaps
- **16 isolated node(s):** `Schedules a native agent action to run automatically in the background at an int`, `Mounts a filesystem watchdog on a folder. When the folder changes, the Agent wil`, `Ensure we are strictly operating inside the WSL Linux sandbox and dependencies l`, `Fire the agent via the internal /api/chat endpoint.`, `Context manager for safe DB sessions with auto-rollback on errors.` (+11 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `Community 11`** (5 nodes): `swarm_manager.py`, `Dispatches a prompt to multiple specialized agents simultaneously.         squad`, `SwarmManager`, `.dispatch_squad_stream()`, `.__init__()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 16`** (4 nodes): `main.js`, `main.ts`, `createWidgetWindow()`, `createWindow()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 18`** (4 nodes): `ToastContext.tsx`, `KnowledgeBase.tsx`, `KnowledgeBase()`, `useToast()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 20`** (4 nodes): `Marketplace.tsx`, `fetchInstalled()`, `handleInstall()`, `isInstalled()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 23`** (4 nodes): `WarRoom.tsx`, `if()`, `saveKeys()`, `setErrorPrompt()`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 24`** (3 nodes): `system_health.py`, `get_system_health()`, `Returns an aggressively formatted string of current PC metrics.`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 48`** (1 nodes): `Schedules a native agent action to run automatically in the background at an int`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 49`** (1 nodes): `Mounts a filesystem watchdog on a folder. When the folder changes, the Agent wil`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Community 50`** (1 nodes): `Ensure we are strictly operating inside the WSL Linux sandbox and dependencies l`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `OpenzessAgent` connect `Community 0` to `Community 11`, `Community 1`, `Community 3`, `Community 5`?**
  _High betweenness centrality (0.091) - this node is a cross-community bridge._
- **Why does `start()` connect `Community 4` to `Community 8`, `Community 2`?**
  _High betweenness centrality (0.059) - this node is a cross-community bridge._
- **Are the 25 inferred relationships involving `OpenzessAgent` (e.g. with `ChatRequest` and `ApprovalRequest`) actually correct?**
  _`OpenzessAgent` has 25 INFERRED edges - model-reasoned connections that need verification._
- **Are the 5 inferred relationships involving `chat()` (e.g. with `create_session()` and `get_session_messages()`) actually correct?**
  _`chat()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **Are the 6 inferred relationships involving `start()` (e.g. with `.__init__()` and `.add_watchdog()`) actually correct?**
  _`start()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **What connects `Schedules a native agent action to run automatically in the background at an int`, `Mounts a filesystem watchdog on a folder. When the folder changes, the Agent wil`, `Ensure we are strictly operating inside the WSL Linux sandbox and dependencies l` to the rest of the system?**
  _16 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.08 - nodes in this community are weakly interconnected._