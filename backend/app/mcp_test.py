import asyncio
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

async def run():
    print("Testing connection...")
    server_params = StdioServerParameters(command="npx", args=["-y", "@modelcontextprotocol/server-everything"])
    async with stdio_client(server_params) as (read, write):
        async with ClientSession(read, write) as session:
            await session.initialize()
            tools = await session.list_tools()
            print(f"Loaded tools: {[t.name for t in tools.tools]}")

if __name__ == "__main__":
    asyncio.run(run())
