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
        # Synchronous worker function to run one agent
        def run_agent_stream(config: Dict[str, Any], queue: asyncio.Queue):
            try:
                agent = OpenzessAgent(
                    api_key=config.get("api_key", ""),
                    provider=config.get("provider", "gemini"),
                    system_instruction=config.get("system_instruction", "You are a swarm agent.")
                )
                
                for chunk in agent.chat_stream(prompt):
                    # Attach the role name to the chunk so the frontend knows whose stream this is
                    chunk["swarm_role"] = config["role_name"]
                    
                    # We use a threadsafe asyncio call to push to the queue
                    # since this is running in a synchronous worker thread
                    try:
                        loop = asyncio.get_event_loop()
                    except RuntimeError:
                        # In case get_event_loop fails cross-thread
                        queue.put_nowait(chunk)
                        continue
                        
                    asyncio.run_coroutine_threadsafe(queue.put(chunk), loop)
                    
            except Exception as e:
                # Send error chunk
                try:
                    loop = asyncio.get_event_loop()
                    asyncio.run_coroutine_threadsafe(queue.put({"type": "error", "error": str(e), "swarm_role": config["role_name"]}), loop)
                except RuntimeError:
                    queue.put_nowait({"type": "error", "error": str(e), "swarm_role": config["role_name"]})
            finally:
                # Signal completion for this specific agent
                try:
                    loop = asyncio.get_event_loop()
                    asyncio.run_coroutine_threadsafe(queue.put({"type": "swarm_done", "swarm_role": config["role_name"]}), loop)
                except RuntimeError:
                    queue.put_nowait({"type": "swarm_done", "swarm_role": config["role_name"]})


        # Create an async queue to aggregate streaming chunks from all threads
        queue = asyncio.Queue()
        
        # Fire off all agents in parallel threads
        loop = asyncio.get_event_loop()
        futures = []
        for config in squad_config:
             futures.append(loop.run_in_executor(self.executor, run_agent_stream, config, queue))
        
        completed_agents = 0
        total_agents = len(squad_config)
        
        # Read from the unified queue and yield async dynamically
        while completed_agents < total_agents:
            chunk = await queue.get()
            
            if chunk.get("type") == "swarm_done":
                completed_agents += 1
            
            yield chunk

swarm_manager = SwarmManager()
