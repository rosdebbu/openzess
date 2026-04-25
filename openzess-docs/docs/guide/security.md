# Security & Sandboxing

Security is a core design principle of OpenZess. Every potentially dangerous operation is isolated inside a sandboxed environment.

## The WSL Sandbox

All terminal commands executed by the agent run inside **Debian WSL** (Windows Subsystem for Linux). This creates a hard isolation boundary:

```
┌──────────────────────────────┐
│       Windows Host           │
│  ┌────────────────────────┐  │
│  │    Debian WSL Sandbox  │  │
│  │  ┌──────────────────┐  │  │
│  │  │  Agent Commands   │  │  │
│  │  │  (bash, python3)  │  │  │
│  │  └──────────────────┘  │  │
│  │  ┌──────────────────┐  │  │
│  │  │  Xvfb Display     │  │  │
│  │  │  (invisible GUI)  │  │  │
│  │  └──────────────────┘  │  │
│  └────────────────────────┘  │
│                              │
│  Browser ←→ FastAPI Server   │
└──────────────────────────────┘
```

### Key Security Measures

1. **Command Isolation**: `subprocess.run(["wsl", "-d", "Debian", "bash", "-c", command])` — the agent cannot escape the WSL boundary
2. **Timeout Protection**: All commands have a 15-second timeout to prevent infinite loops
3. **Matrix Safety**: PyAutoGUI's `FAILSAFE` is disabled in the sandbox to prevent accidental interference, but the sandbox itself prevents any interaction with the real Windows desktop
4. **Tool Approval**: Before executing any tool call, the frontend displays an approval dialog. The user must explicitly approve dangerous actions.

## The X11 Sandbox

The Matrix Viewer uses a completely separate display from your real monitor:

- **Xvfb** creates a virtual framebuffer on Display `:100`
- **Fluxbox** provides a minimal window manager
- The agent's `DISPLAY` environment variable points to `:100`
- Your real Windows desktop is on a completely different display stack

::: danger
Never change `os.environ["DISPLAY"]` in `agent.py` to point to your real display. This would allow the agent to control your actual mouse and keyboard.
:::
