import asyncio
import concurrent.futures
from typing import List, Dict, Any
import json
from agent import OpenzessAgent

class SwarmManager:
    def __init__(self):
        # We use a ThreadPoolExecutor since native agent tools and chromadb are synchronous
        self.executor = concurrent.futures.ThreadPoolExecutor(max_workers=10)

    async def dispatch_squad_stream(self, prompt: str, squad_config: List[Dict[str, Any]]):
        """
        Dispatches a prompt to multiple specialized agents simultaneously.
        squad_config is a list of dictionaries:
        [
            {"role_name": "Coder", "provider": "openai", "api_key": "...", "system_instruction": "..."},
            {"role_name": "Architect", "provider": "anthropic", "api_key": "...", "system_instruction": "..."}
        ]
        """
        def run_agent_stream(config: Dict[str, Any], queue: asyncio.Queue, main_loop: asyncio.AbstractEventLoop):
            try:
                agent = OpenzessAgent(
                    api_key=config.get("api_key", ""),
                    provider=config.get("provider", "gemini"),
                    system_instruction=config.get("system_instruction", "You are a swarm agent.")
                )
                
                for chunk in agent.chat_stream(prompt):
                    # Attach the role name to the chunk so the frontend knows whose stream this is
                    chunk["swarm_role"] = config["role_name"]
                    main_loop.call_soon_threadsafe(queue.put_nowait, chunk)
                    
            except Exception as e:
                # Send error chunk
                main_loop.call_soon_threadsafe(queue.put_nowait, {"type": "error", "error": str(e), "swarm_role": config["role_name"]})
            finally:
                # Signal completion for this specific agent
                main_loop.call_soon_threadsafe(queue.put_nowait, {"type": "swarm_done", "swarm_role": config["role_name"]})


        # Create an async queue to aggregate streaming chunks from all threads
        queue = asyncio.Queue()
        
        # Fire off all agents in parallel threads
        loop = asyncio.get_running_loop()
        futures = []
        for config in squad_config:
             futures.append(loop.run_in_executor(self.executor, run_agent_stream, config, queue, loop))
        
        completed_agents = 0
        total_agents = len(squad_config)
        
        # Read from the unified queue and yield async dynamically
        while completed_agents < total_agents:
            chunk = await queue.get()
            
            if chunk.get("type") == "swarm_done":
                completed_agents += 1
            
            yield chunk

swarm_manager = SwarmManager()
