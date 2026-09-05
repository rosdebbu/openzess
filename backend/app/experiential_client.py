"""
Experiential Adaptive Gateway Client for OpenZess.
Provides:
- Non-blocking circuit breaker (<150ms probe) to prevent crashes if local gateway is offline
- Task complexity classifier ('fast' vs 'reasoning') to slash token latency and costs
- OpenTelemetry (OTel) trace exporter to feed .exp/traces.otel.jsonl for model optimization
- OSC 8 clickable terminal hyperlink formatting for VS Code and Windows Terminal
"""

import os
import time
import json
import socket
import urllib.parse
from typing import Dict, Any, Optional, List

# Cache gateway health status to prevent repeated network overhead
_GATEWAY_HEALTH_CACHE: Dict[str, Any] = {"healthy": None, "timestamp": 0.0}
_CACHE_TTL_SECONDS = 3.0

DEFAULT_GATEWAY_BASE = "http://127.0.0.1:8000/v1"


def is_gateway_healthy(base_url: Optional[str] = None, timeout: float = 0.15) -> bool:
    """
    Rapid, non-blocking probe to verify if the Experiential gateway is responding.
    Uses socket connect test first for sub-5ms determination, falling back to cached state.
    """
    global _GATEWAY_HEALTH_CACHE
    now = time.time()
    
    # Check cache first
    if _GATEWAY_HEALTH_CACHE["healthy"] is not None and (now - _GATEWAY_HEALTH_CACHE["timestamp"]) < _CACHE_TTL_SECONDS:
        return _GATEWAY_HEALTH_CACHE["healthy"]

    url_to_probe = base_url or os.environ.get("EXP_GATEWAY_BASE", DEFAULT_GATEWAY_BASE)

    try:
        parsed = urllib.parse.urlparse(url_to_probe)
        host = parsed.hostname or "127.0.0.1"
        port = parsed.port or (443 if parsed.scheme == "https" else 80)

        # Quick TCP socket probe
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()

        is_up = (result == 0)
        _GATEWAY_HEALTH_CACHE = {"healthy": is_up, "timestamp": now}
        return is_up
    except Exception:
        _GATEWAY_HEALTH_CACHE = {"healthy": False, "timestamp": now}
        return False


def classify_task_complexity(prompt: str) -> str:
    """
    Categorizes prompt complexity to enable dynamic smart routing:
    - 'fast': simple lookups, shell commands, quick summaries, greetings
    - 'reasoning': architectural planning, multi-file refactoring, debugging race conditions, code snippets
    """
    if not prompt:
        return "fast"

    prompt_lower = prompt.lower().strip()

    # Code blocks and definitions immediately require reasoning
    if "```" in prompt or "def " in prompt or "class " in prompt or "struct " in prompt:
        return "reasoning"

    # High complexity indicator keywords
    deep_reasoning_keywords = [
        "architecture", "refactor", "race condition", "deadlock", "algorithm",
        "benchmark", "optimize", "memory leak", "multi-agent", "implement",
        "debug", "fix bug", "async", "concurrency", "distributed", "security audit"
    ]

    for kw in deep_reasoning_keywords:
        if kw in prompt_lower:
            return "reasoning"

    # Fast-path for short commands, questions, or greetings
    if len(prompt.split()) < 6:
        return "fast"

    # If prompt is lengthy (>60 words), escalate to reasoning
    if len(prompt.split()) > 60:
        return "reasoning"

    return "fast"


def get_model_for_complexity(complexity: str, base_model: Optional[str] = None) -> str:
    """
    Maps complexity tier to active model alias for Experiential gateway.
    """
    if base_model and base_model not in ("default", "exp:smart", "openai/default"):
        return base_model

    if complexity == "fast":
        # Fast tier: sub-second latency for lightweight tasks
        return os.environ.get("EXP_FAST_MODEL", "openai/gpt-4o-mini")
    else:
        # Reasoning tier: deep thinking models for coding and architecture
        return os.environ.get("EXP_REASONING_MODEL", "openai/gpt-4o")


def record_otel_trace(
    session_id: str,
    prompt: str,
    model: str,
    latency_seconds: float,
    tokens: int = 0,
    tools_used: Optional[List[str]] = None,
    success: bool = True,
    error_msg: str = ""
) -> None:
    """
    Appends a structured OpenTelemetry (OTel) execution trace to .exp/traces.otel.jsonl.
    Allows Experiential to ingest production traces via `exp build` and optimize routing.
    """
    try:
        exp_dir = os.path.join(os.getcwd(), ".exp")
        os.makedirs(exp_dir, exist_ok=True)
        trace_file = os.path.join(exp_dir, "traces.otel.jsonl")

        trace_entry = {
            "trace_id": f"trace_{int(time.time() * 1000)}",
            "session_id": session_id,
            "timestamp": time.time(),
            "model": model,
            "latency_ms": round(latency_seconds * 1000, 2),
            "estimated_tokens": tokens or max(1, len(prompt.split()) * 2),
            "prompt_length": len(prompt),
            "tools_called": tools_used or [],
            "status": "SUCCESS" if success else "ERROR",
            "error": error_msg,
            "attributes": {
                "agent": "openzess",
                "engine": "hybrid_python_rust",
                "framework": "experiential_gateway"
            }
        }

        with open(trace_file, "a", encoding="utf-8") as f:
            f.write(json.dumps(trace_entry) + "\n")
    except Exception:
        # Non-critical telemetry failure should never impede agent execution
        pass


def format_terminal_link(title: str, uri: str) -> str:
    """
    Generates standard OSC 8 ANSI hyperlink sequences.
    In VS Code integrated terminal and Windows Terminal, clicking this directly opens
    the file (file:///path) or webpage (https://url).
    """
    if not uri:
        return title
    
    # Normalize Windows local paths to file:/// URLs
    if not uri.startswith("http://") and not uri.startswith("https://") and not uri.startswith("file:///"):
        norm_path = os.path.abspath(uri).replace("\\", "/")
        uri = f"file:///{norm_path}"

    # OSC 8 escape sequence: \033]8;;URI\033\TITLE\033]8;;\033\
    return f"\033]8;;{uri}\033\\{title}\033]8;;\033\\"
