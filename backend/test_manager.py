import sys
import time
from mcp_manager import mcp_registry

print("Attempting to connect...")
try:
    success = mcp_registry.connect("test_server", "npx", ["-y", "@modelcontextprotocol/server-everything"])
    print("Connect Success:", success)
    status = mcp_registry.get_status()
    print("Status:", status)
    mcp_registry.disconnect("test_server")
except Exception as e:
    print(f"Exception: {e}")
