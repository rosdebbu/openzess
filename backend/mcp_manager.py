import asyncio
import threading
import concurrent.futures
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import psutil

class MCPManager:
    def __init__(self):
        # We need a dedicated event loop in a background thread
        # to handle async streams while providing a sync API to our FastAPI/Agent.
        self._loop = asyncio.new_event_loop()
        self._thread = threading.Thread(target=self._start_event_loop, daemon=True)
        self._thread.start()
        
        self.servers = {} # server_id -> {"session": ..., "stdio": ...}
        self.server_tools = {} # server_id -> [mcp.types.Tool]

    def _start_event_loop(self):
        asyncio.set_event_loop(self._loop)
        self._loop.run_forever()

    def _run_async(self, coro, timeout=120):
        """Helper to run coroutines in the background loop from sync functions"""
        future = asyncio.run_coroutine_threadsafe(coro, self._loop)
        return future.result(timeout=timeout)

    async def _amake_connection(self, server_id: str, command: str, args: list):
        if server_id in self.servers:
            await self._adisconnect(server_id)
            
        print(f"[{server_id}] Connecting MCP stdio via {command} {' '.join(args)}...", flush=True)
        
        import sys
        import os
        
        env = os.environ.copy()
        
        if sys.platform == "win32" and command == "npx":
            command = "npx.cmd"
            
        server_params = StdioServerParameters(command=command, args=args, env=env)
        
        stdio_mgr = stdio_client(server_params)
        read, write = await stdio_mgr.__aenter__()
        
        session_mgr = ClientSession(read, write)
        session = await session_mgr.__aenter__()
        
        await session.initialize()
        
        tools_response = await session.list_tools()
        
        self.servers[server_id] = {
            "stdio_mgr": stdio_mgr,
            "session_mgr": session_mgr,
            "session": session,
            "command": command,
            "args": args
        }
        self.server_tools[server_id] = tools_response.tools
        print(f"[{server_id}] MCP Connected natively. Loaded tools: {[t.name for t in tools_response.tools]}")
        return True

    async def _adisconnect(self, server_id: str):
        if server_id in self.servers:
            srv = self.servers[server_id]
            try:
                await srv["session_mgr"].__aexit__(None, None, None)
            except Exception: pass
            
            # Find PID before tear down if possible
            pid = None
            if hasattr(srv["stdio_mgr"], 'process') and getattr(srv["stdio_mgr"].process, 'pid', None):
                pid = srv["stdio_mgr"].process.pid
                
            try:
                await srv["stdio_mgr"].__aexit__(None, None, None)
            except Exception: pass
            
            # Force kill tree to prevent zombie processes (common with npx on Windows)
            if pid:
                try:
                    parent = psutil.Process(pid)
                    for child in parent.children(recursive=True):
                        child.kill()
                    parent.kill()
                except psutil.NoSuchProcess:
                    pass
                except Exception as e:
                    print(f"[{server_id}] Process cleanup error: {e}")
            
            del self.servers[server_id]
            if server_id in self.server_tools:
                del self.server_tools[server_id]

    async def _acall_tool(self, server_id: str, tool_name: str, args: dict):
        if server_id not in self.servers:
            raise ValueError("Server disconnected")
            
        session = self.servers[server_id]["session"]
        result = await session.call_tool(tool_name, arguments=args)
        
        # Parse MCP text content logic
        if result.isError:
            return f"Error from MCP: {[c.text for c in result.content if hasattr(c, 'text')]}"
            
        return "\n".join([c.text for c in result.content if hasattr(c, "text")])

    # ---- Synchronous EXPOSED API ----
    def connect(self, server_id: str, command: str, args: list) -> bool:
        return self._run_async(self._amake_connection(server_id, command, args))

    def disconnect(self, server_id: str):
        self._run_async(self._adisconnect(server_id))

    def get_status(self):
        return {
            sid: {
                "command": data["command"],
                "args": data["args"],
                "toolNames": [t.name for t in self.server_tools.get(sid, [])]
            } for sid, data in self.servers.items()
        }

    def get_all_tools_for_litellm(self) -> list:
        openai_tools = []
        for sid, tools in self.server_tools.items():
            for t in tools:
                openai_tools.append({
                    "type": "function",
                    "function": {
                        "name": t.name,
                        "description": f"[MCP: {sid}] {t.description}",
                        "parameters": t.inputSchema if t.inputSchema else {"type": "object", "properties": {}}
                    }
                })
        return openai_tools

    def find_server_for_tool(self, tool_name: str) -> str:
        for sid, tools in self.server_tools.items():
            for t in tools:
                if t.name == tool_name:
                    return sid
        return None

    def call_tool(self, tool_name: str, args: dict) -> str:
        sid = self.find_server_for_tool(tool_name)
        if not sid:
            return f"Error: MCP Tool '{tool_name}' not found."
            
        return self._run_async(self._acall_tool(sid, tool_name, args))

# Create our Global Registry
mcp_registry = MCPManager()
