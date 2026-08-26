"""
User Habit & Behavioral Learning Engine for Openzess.
Inspired by Honcho & Hermes Agent closed learning loop:
Automatically profiles user habits, coding preferences, and environment configurations
and persists them into ChromaDB for seamless multi-session adaptation.
"""

import os
import re
import uuid
from typing import Dict, List, Optional
from .agent import memory_collection


# In-memory fast cache of user habits
_HABIT_CACHE: Dict[str, str] = {}


def record_habit(category: str, detail: str, source: str = "auto_learning") -> str:
    """
    Persists a learned habit into ChromaDB and memory cache.
    Example categories: 'preferred_language', 'coding_style', 'environment', 'workflow'
    """
    category_key = category.lower().strip().replace(" ", "_")
    _HABIT_CACHE[category_key] = detail
    
    if memory_collection is not None:
        try:
            doc_id = f"habit_{category_key}"
            # Check if exists, update or add
            memory_collection.upsert(
                documents=[f"[USER HABIT - {category.upper()}]: {detail}"],
                metadatas=[{
                    "type": "user_habit",
                    "category": category_key,
                    "source": source
                }],
                ids=[doc_id]
            )
            return f"Recorded habit '{category_key}': {detail}"
        except Exception as e:
            return f"Cached in memory (Chroma error: {e})"
            
    return f"Cached in memory: {category_key} = {detail}"


def get_all_habits() -> Dict[str, str]:
    """Retrieves all stored user habits from ChromaDB / cache."""
    habits = dict(_HABIT_CACHE)
    
    if memory_collection is not None:
        try:
            # Query all habits
            results = memory_collection.get(
                where={"type": "user_habit"}
            )
            if results and results.get("documents"):
                for i, doc in enumerate(results["documents"]):
                    meta = results["metadatas"][i] if results.get("metadatas") else {}
                    cat = meta.get("category", f"habit_{i}")
                    clean_detail = re.sub(r"^\[USER HABIT - .*?\]:\s*", "", doc).strip()
                    habits[cat] = clean_detail
                    _HABIT_CACHE[cat] = clean_detail
        except Exception as e:
            print(f"Error fetching habits from ChromaDB: {e}")
            
    return habits


def get_user_profile_prompt() -> str:
    """
    Generates a structured system-prompt block containing learned user habits.
    Injected into OpenzessAgent context to customize reasoning and tool execution.
    """
    habits = get_all_habits()
    if not habits:
        # Default baseline habits if fresh install
        return (
            "\n[LEARNED USER PROFILE]:\n"
            "- Operating System: Windows with Debian 13 WSL2 sandbox (user: rossdeb)\n"
            "- Core Preferences: Fast responses, clean architecture (70% Python + 30% Rust)\n"
        )
    
    profile_lines = ["\n[LEARNED USER PROFILE & ADAPTIVE HABITS]:"]
    for cat, val in sorted(habits.items()):
        formatted_cat = cat.replace("_", " ").title()
        profile_lines.append(f"- {formatted_cat}: {val}")
        
    return "\n".join(profile_lines) + "\n"


def analyze_user_prompt_for_habits(user_prompt: str) -> List[tuple]:
    """
    Lightweight rule-based heuristic extractor that immediately catches explicit habits
    (e.g., 'I prefer Rust', 'I always use Debian', 'Keep answers concise').
    Returns a list of (category, detail) tuples.
    """
    detected = []
    text = user_prompt.lower()
    
    # 1. Language & Framework preferences
    if "i prefer rust" in text or "use rust" in text or "write in rust" in text:
        detected.append(("preferred_language", "Prefers Rust for high-performance modules and low latency."))
    elif "i prefer python" in text or "write in python" in text:
        detected.append(("preferred_language", "Prefers Python for AI logic, FastAPI endpoints, and scripts."))
    elif "i prefer typescript" in text or "use react" in text:
        detected.append(("preferred_language", "Prefers TypeScript + React 19 for frontend interfaces."))
        
    # 2. Communication Style preferences
    if "keep it short" in text or "be concise" in text or "short answer" in text or "no fluff" in text:
        detected.append(("response_style", "Prefers concise, direct answers with actionable code."))
    elif "explain in detail" in text or "step by step" in text:
        detected.append(("response_style", "Prefers thorough step-by-step technical explanations."))
        
    # 3. Environment & Tooling
    if "in wsl" in text or "in debian" in text or "use debian" in text:
        detected.append(("execution_environment", "Prefers executing bash commands inside Debian WSL2 (user: rossdeb)."))
        
    return detected


def extract_and_learn_habits(user_prompt: str, agent_reply: str = "") -> List[str]:
    """
    Extracts habits from interaction and stores them.
    Called automatically after user interactions.
    """
    detected = analyze_user_prompt_for_habits(user_prompt)
    saved = []
    for cat, detail in detected:
        msg = record_habit(cat, detail, source="conversation_heuristic")
        saved.append(msg)
    return saved


def clear_habits():
    """Clears all stored habits."""
    _HABIT_CACHE.clear()
    if memory_collection is not None:
        try:
            results = memory_collection.get(where={"type": "user_habit"})
            if results and results.get("ids"):
                memory_collection.delete(ids=results["ids"])
        except Exception:
            pass
