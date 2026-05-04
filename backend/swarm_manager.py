import asyncio
import concurrent.futures
from typing import List, Dict, Any
import json
import time
import random
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
        def run_agent_stream(config: Dict[str, Any], queue: asyncio.Queue, main_loop: asyncio.AbstractEventLoop, delay_ms: int):
            try:
                # Add a synthetic stagger to prevent Windows WinError 10038 socket exhaustion and OpenRouter incomplete chunk limits
                if delay_ms > 0:
                    time.sleep(delay_ms / 1000.0)

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
        
        # Fire off all agents in parallel threads with a stagger (250ms per agent) to prevent socket limits
        loop = asyncio.get_running_loop()
        futures = []
        for i, config in enumerate(squad_config):
             delay = i * 400  # 400ms stagger between each API call launch
             futures.append(loop.run_in_executor(self.executor, run_agent_stream, config, queue, loop, delay))
        
        completed_agents = 0
        total_agents = len(squad_config)
        
        # Read from the unified queue and yield async dynamically
        while completed_agents < total_agents:
            chunk = await queue.get()
            
            if chunk.get("type") == "swarm_done":
                completed_agents += 1
            
            yield chunk

    async def debate_stream(self, prompt: str, squad_config: List[Dict[str, Any]], max_rounds: int = 3, judge_config: Dict[str, Any] = None):
        """
        Orchestrates a real multi-round debate where agents see each other's arguments.
        Each round, every agent speaks sequentially, seeing the full transcript so far.
        Detects [CONSENSUS REACHED] to terminate early.
        After debate, a Judge agent synthesizes the final verdict.
        """
        transcript = f"DEBATE TOPIC: {prompt}\n\n"
        start_time = time.time()
        consensus_reached = False

        for round_num in range(1, max_rounds + 1):
            if consensus_reached:
                break

            # Emit round start marker
            yield {
                "type": "round_start",
                "round": round_num,
                "total_rounds": max_rounds,
                "phase": "opening" if round_num == 1 else "rebuttal"
            }

            for agent_idx, config in enumerate(squad_config):
                if consensus_reached:
                    break

                role_name = config["role_name"]
                
                # Emit agent start
                yield {
                    "type": "agent_start",
                    "swarm_role": role_name,
                    "round": round_num,
                    "elapsed_ms": int((time.time() - start_time) * 1000)
                }

                # Build the system instruction with debate context
                phase_label = "Opening Statement" if round_num == 1 else f"Rebuttal Round {round_num}"
                debate_system = (
                    f"{config.get('system_instruction', 'You are a debate agent.')}\n\n"
                    f"--- DEBATE RULES ---\n"
                    f"You are the '{role_name}' in a live multi-agent debate (Round {round_num}/{max_rounds}: {phase_label}).\n"
                    f"Below is the full transcript of the debate so far. Read it carefully.\n"
                    f"You MUST directly reference, critique, agree with, or build upon specific points made by other agents.\n"
                    f"Do NOT repeat what others have already said. Add NEW value.\n"
                    f"If you believe the team has reached a perfect, complete solution with nothing left to add, output exactly: [CONSENSUS REACHED]\n"
                    f"Keep your response focused and under 400 words.\n\n"
                    f"--- TRANSCRIPT ---\n{transcript}\n"
                    f"--- YOUR TURN ({role_name}, Round {round_num}) ---"
                )

                # Run agent synchronously in thread pool
                agent_text = ""
                loop = asyncio.get_running_loop()
                queue = asyncio.Queue()

                def run_single_agent(sys_inst, q, main_loop):
                    try:
                        agent = OpenzessAgent(
                            api_key=config.get("api_key", ""),
                            provider=config.get("provider", "gemini"),
                            system_instruction=sys_inst
                        )
                        for chunk in agent.chat_stream(prompt):
                            chunk["swarm_role"] = role_name
                            chunk["round"] = round_num
                            chunk["elapsed_ms"] = int((time.time() - start_time) * 1000)
                            main_loop.call_soon_threadsafe(q.put_nowait, chunk)
                    except Exception as e:
                        main_loop.call_soon_threadsafe(q.put_nowait, {
                            "type": "error", "error": str(e),
                            "swarm_role": role_name, "round": round_num
                        })
                    finally:
                        main_loop.call_soon_threadsafe(q.put_nowait, {"type": "agent_done", "swarm_role": role_name})

                # Add stagger between agents in the same round
                if agent_idx > 0:
                    await asyncio.sleep(0.3)

                await loop.run_in_executor(self.executor, run_single_agent, debate_system, queue, loop)

                # Drain the queue for this single agent
                agent_finished = False
                while not agent_finished:
                    chunk = await queue.get()
                    if chunk.get("type") == "agent_done":
                        agent_finished = True
                    elif chunk.get("type") == "content":
                        agent_text += chunk.get("content", "")
                        yield chunk
                    elif chunk.get("type") == "error":
                        yield chunk
                        agent_text += f"\n[ERROR: {chunk.get('error', 'unknown')}]"
                        agent_finished = True
                    else:
                        yield chunk

                # Append to transcript
                transcript += f"\n[{role_name} — Round {round_num}]:\n{agent_text}\n"

                # Check for consensus
                if "[CONSENSUS REACHED]" in agent_text:
                    consensus_reached = True
                    yield {
                        "type": "consensus",
                        "swarm_role": role_name,
                        "round": round_num,
                        "elapsed_ms": int((time.time() - start_time) * 1000)
                    }

                # Emit agent complete
                yield {
                    "type": "agent_complete",
                    "swarm_role": role_name,
                    "round": round_num,
                    "word_count": len(agent_text.split()),
                    "elapsed_ms": int((time.time() - start_time) * 1000)
                }

            # Emit round end marker
            yield {
                "type": "round_end",
                "round": round_num,
                "elapsed_ms": int((time.time() - start_time) * 1000)
            }

        # ── Final Judge Synthesis ──
        if judge_config and judge_config.get("api_key"):
            yield {
                "type": "judge_start",
                "elapsed_ms": int((time.time() - start_time) * 1000)
            }

            judge_system = (
                "You are the FINAL JUDGE of a multi-agent debate. "
                "You must synthesize ALL arguments into a definitive verdict.\n\n"
                "Rules:\n"
                "1. Credit the best ideas to their source agent by name\n"
                "2. Identify which agent made the strongest case\n"
                "3. Note any unresolved disagreements\n"
                "4. Provide the FINAL ANSWER that incorporates the best of all perspectives\n"
                "5. Format your response with clear sections using Markdown\n\n"
                f"--- FULL DEBATE TRANSCRIPT ---\n{transcript}"
            )

            judge_queue = asyncio.Queue()
            loop = asyncio.get_running_loop()

            def run_judge(sys_inst, q, main_loop):
                try:
                    agent = OpenzessAgent(
                        api_key=judge_config["api_key"],
                        provider=judge_config.get("provider", "gemini"),
                        system_instruction=sys_inst
                    )
                    for chunk in agent.chat_stream(f"Synthesize the final verdict for: {prompt}"):
                        chunk["swarm_role"] = "Judge"
                        chunk["round"] = 0
                        chunk["is_judge"] = True
                        chunk["elapsed_ms"] = int((time.time() - start_time) * 1000)
                        main_loop.call_soon_threadsafe(q.put_nowait, chunk)
                except Exception as e:
                    main_loop.call_soon_threadsafe(q.put_nowait, {
                        "type": "error", "error": str(e),
                        "swarm_role": "Judge", "is_judge": True
                    })
                finally:
                    main_loop.call_soon_threadsafe(q.put_nowait, {"type": "judge_done"})

            await loop.run_in_executor(self.executor, run_judge, judge_system, judge_queue, loop)

            judge_finished = False
            while not judge_finished:
                chunk = await judge_queue.get()
                if chunk.get("type") == "judge_done":
                    judge_finished = True
                    yield {
                        "type": "judge_complete",
                        "elapsed_ms": int((time.time() - start_time) * 1000)
                    }
                else:
                    yield chunk

        # Final done
        yield {
            "type": "debate_complete",
            "consensus_reached": consensus_reached,
            "total_elapsed_ms": int((time.time() - start_time) * 1000)
        }


swarm_manager = SwarmManager()
