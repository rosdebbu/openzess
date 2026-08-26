"""
Openzess Rust sidecar client (optional acceleration layer).

Architecture: plans/hybrid-python-rust.md

Contract:
    * Enabled only when the SIDECAR_URL environment variable is set.
    * Every call degrades gracefully: if the sidecar is missing, slow, or
      errors, callers transparently fall back to the pure-Python
      implementation. Openzess behavior is identical either way.
    * Sidecar calls return (result, engine) so call sites can verify which
      engine served the request ('rust-sidecar' or 'python-fallback').

The Python side never hard-depends on this module's remote being up.
"""

import asyncio
import io
import logging
import math
import os
from collections import deque
from typing import Any, Dict, List, Optional, Tuple

import requests
from PIL import Image

log = logging.getLogger("openzess.sidecar")

SIDECAR_URL = os.environ.get("SIDECAR_URL", "").strip().rstrip("/")
SIDECAR_TIMEOUT = float(os.environ.get("SIDECAR_TIMEOUT", "2"))


def sidecar_enabled() -> bool:
    """True when SIDECAR_URL is configured."""
    return bool(SIDECAR_URL)


# ── 1. Image Encoding ──────────────────────────────────────────────────────

def encode_image_pil(
    raw_bgra: bytes,
    width: int,
    height: int,
    fmt: str = "JPEG",
    quality: int = 65,
) -> bytes:
    """
    Encode a raw mss BGRA grab exactly like the original Matrix stream path:
    Image.frombytes("RGB", size, bgra, "raw", "BGRX") -> JPEG/PNG bytes.
    """
    img = Image.frombytes("RGB", (width, height), raw_bgra, "raw", "BGRX")
    buffer = io.BytesIO()
    img.save(buffer, format=fmt, quality=quality, optimize=True)
    return buffer.getvalue()


def encode_image_via_sidecar(
    raw_bgra: bytes,
    width: int,
    height: int,
    fmt: str = "JPEG",
    quality: int = 65,
) -> Optional[bytes]:
    """
    Encode via the Rust sidecar. Returns None on ANY failure (disabled,
    unreachable, non-200, empty body) so callers can fall back cleanly.
    """
    if not sidecar_enabled():
        return None
    try:
        resp = requests.post(
            f"{SIDECAR_URL}/image/encode",
            data=raw_bgra,
            headers={
                "x-width": str(width),
                "x-height": str(height),
                "x-layout": "bgrx",
                "x-format": fmt.lower(),
                "x-quality": str(quality),
            },
            timeout=SIDECAR_TIMEOUT,
        )
        if resp.status_code == 200 and resp.content:
            return resp.content
        log.warning("sidecar encode failed (HTTP %s); falling back to PIL", resp.status_code)
    except Exception as exc:  # noqa: BLE001 — degrade silently by design
        log.warning("sidecar unreachable (%s); falling back to PIL", exc)
    return None


def encode_image(
    raw_bgra: bytes,
    width: int,
    height: int,
    fmt: str = "JPEG",
    quality: int = 65,
) -> Tuple[bytes, str]:
    """
    Encode raw BGRA pixels, preferring the Rust sidecar when enabled.
    Returns (encoded_bytes, engine) where engine is 'rust-sidecar' or 'pil'.
    """
    data = encode_image_via_sidecar(raw_bgra, width, height, fmt, quality)
    if data is not None:
        return data, "rust-sidecar"
    return encode_image_pil(raw_bgra, width, height, fmt, quality), "pil"


async def encode_image_async(
    raw_bgra: bytes,
    width: int,
    height: int,
    fmt: str = "JPEG",
    quality: int = 65,
) -> Tuple[bytes, str]:
    """Non-blocking wrapper for async call sites."""
    return await asyncio.to_thread(encode_image, raw_bgra, width, height, fmt, quality)


# ── 2. Vector Similarity & Top-K Nearest Neighbors ──────────────────────────

def cosine_similarity_py(a: List[float], b: List[float]) -> float:
    """Pure-Python fallback for cosine similarity."""
    if not a or len(a) != len(b):
        return 0.0
    dot = sum(x * y for x, y in zip(a, b))
    norm_a = math.sqrt(sum(x * x for x in a))
    norm_b = math.sqrt(sum(y * y for y in b))
    if norm_a == 0.0 or norm_b == 0.0:
        return 0.0
    return max(-1.0, min(1.0, dot / (norm_a * norm_b)))


def vector_top_k_py(
    query: List[float],
    candidates: List[Dict[str, Any]],
    top_k: int = 5,
) -> Dict[str, Any]:
    """Pure-Python reference fallback for top-k vector similarity ranking."""
    if not query or not candidates:
        return {"results": [], "total_evaluated": 0}

    scored = []
    for cand in candidates:
        vec = cand.get("vector", [])
        score = cosine_similarity_py(query, vec)
        item = {"id": cand.get("id", ""), "score": score}
        if "metadata" in cand:
            item["metadata"] = cand["metadata"]
        scored.append(item)

    scored.sort(key=lambda x: x["score"], reverse=True)
    if top_k > 0:
        scored = scored[:top_k]

    return {"results": scored, "total_evaluated": len(candidates)}


def vector_top_k_via_sidecar(
    query: List[float],
    candidates: List[Dict[str, Any]],
    top_k: int = 5,
) -> Optional[Dict[str, Any]]:
    """Compute Top-K vector similarities via the Rust sidecar."""
    if not sidecar_enabled():
        return None
    try:
        resp = requests.post(
            f"{SIDECAR_URL}/vector/topk",
            json={"query": query, "candidates": candidates, "top_k": top_k},
            timeout=SIDECAR_TIMEOUT,
        )
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, dict) and "results" in data:
                return data
        log.warning("sidecar vector_topk failed (HTTP %s); falling back to Python", resp.status_code)
    except Exception as exc:  # noqa: BLE001
        log.warning("sidecar unreachable (%s); falling back to Python", exc)
    return None


def vector_top_k(
    query: List[float],
    candidates: List[Dict[str, Any]],
    top_k: int = 5,
) -> Tuple[Dict[str, Any], str]:
    """
    Rank candidate vectors by cosine similarity to query vector.
    Returns (result_dict, engine) where engine is 'rust-sidecar' or 'python-fallback'.
    """
    res = vector_top_k_via_sidecar(query, candidates, top_k)
    if res is not None:
        return res, "rust-sidecar"
    return vector_top_k_py(query, candidates, top_k), "python-fallback"


async def vector_top_k_async(
    query: List[float],
    candidates: List[Dict[str, Any]],
    top_k: int = 5,
) -> Tuple[Dict[str, Any], str]:
    """Async wrapper for vector_top_k."""
    return await asyncio.to_thread(vector_top_k, query, candidates, top_k)


# ── 3. Graphify Knowledge-Graph Traversal & Aggregation ──────────────────────

def aggregate_graph_py(gdata: dict) -> dict:
    """Pure-Python reference fallback for Graphify stats aggregation."""
    nodes = gdata.get("nodes", []) if isinstance(gdata, dict) else []
    links = gdata.get("links", []) if isinstance(gdata, dict) else []
    communities = {n.get("community", 1) for n in nodes if isinstance(n, dict)}
    return {
        "nodes": len(nodes),
        "edges": len(links),
        "communities": len(communities),
    }


def aggregate_graph_via_sidecar(gdata: dict) -> Optional[dict]:
    """Aggregate a Graphify knowledge-graph payload via the Rust sidecar."""
    if not sidecar_enabled():
        return None
    try:
        resp = requests.post(
            f"{SIDECAR_URL}/graphify/report",
            json=gdata,
            timeout=SIDECAR_TIMEOUT,
        )
        if resp.status_code == 200:
            stats = resp.json()
            if isinstance(stats, dict) and "nodes" in stats:
                return stats
        log.warning("sidecar graphify failed (HTTP %s); using pure-Python", resp.status_code)
    except Exception as exc:  # noqa: BLE001
        log.warning("sidecar unreachable (%s); using pure-Python graphify", exc)
    return None


def aggregate_graph(gdata: dict) -> Tuple[dict, str]:
    """
    Aggregate Graphify report statistics.
    Returns (stats_dict, engine) where engine is 'rust-sidecar' or 'python-fallback'.
    """
    res = aggregate_graph_via_sidecar(gdata)
    if res is not None:
        return res, "rust-sidecar"
    return aggregate_graph_py(gdata), "python-fallback"


async def aggregate_graph_async(gdata: dict) -> Tuple[dict, str]:
    """Async wrapper of aggregate_graph."""
    return await asyncio.to_thread(aggregate_graph, gdata)


def graph_shortest_path_py(gdata: dict, source: str, target: str) -> Dict[str, Any]:
    """Pure-Python reference BFS shortest-path between nodes in graph."""
    source = source.strip()
    target = target.strip()
    if not source or not target:
        return {"found": False, "path": [], "distance": 0}
    if source == target:
        return {"found": True, "path": [source], "distance": 0}

    links = gdata.get("links", []) if isinstance(gdata, dict) else []
    adj: Dict[str, List[str]] = {}
    for link in links:
        s = str(link.get("source", ""))
        t = str(link.get("target", ""))
        if s and t:
            adj.setdefault(s, []).append(t)
            adj.setdefault(t, []).append(s)

    visited = {source}
    parent = {}
    queue = deque([source])
    target_found = False

    while queue:
        curr = queue.popleft()
        if curr == target:
            target_found = True
            break
        for neighbor in adj.get(curr, []):
            if neighbor not in visited:
                visited.add(neighbor)
                parent[neighbor] = curr
                queue.append(neighbor)

    if not target_found:
        return {"found": False, "path": [], "distance": 0}

    path = [target]
    curr = target
    while curr in parent:
        curr = parent[curr]
        path.append(curr)
        if curr == source:
            break
    path.reverse()
    return {"found": True, "path": path, "distance": max(0, len(path) - 1)}


def graph_shortest_path_via_sidecar(
    gdata: dict,
    source: str,
    target: str,
) -> Optional[Dict[str, Any]]:
    """Query shortest path via the Rust sidecar."""
    if not sidecar_enabled():
        return None
    try:
        resp = requests.post(
            f"{SIDECAR_URL}/graphify/path",
            json={"graph": gdata, "source": source, "target": target},
            timeout=SIDECAR_TIMEOUT,
        )
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, dict) and "found" in data:
                return data
        log.warning("sidecar graph_path failed (HTTP %s); falling back to Python", resp.status_code)
    except Exception as exc:  # noqa: BLE001
        log.warning("sidecar unreachable (%s); falling back to Python", exc)
    return None


def graph_shortest_path(
    gdata: dict,
    source: str,
    target: str,
) -> Tuple[Dict[str, Any], str]:
    """
    Find shortest path between source and target nodes in Graphify data.
    Returns (path_result, engine) where engine is 'rust-sidecar' or 'python-fallback'.
    """
    res = graph_shortest_path_via_sidecar(gdata, source, target)
    if res is not None:
        return res, "rust-sidecar"
    return graph_shortest_path_py(gdata, source, target), "python-fallback"


async def graph_shortest_path_async(
    gdata: dict,
    source: str,
    target: str,
) -> Tuple[Dict[str, Any], str]:
    """Async wrapper for graph_shortest_path."""
    return await asyncio.to_thread(graph_shortest_path, gdata, source, target)


# ── 4. Code & Token Statistics ──────────────────────────────────────────────

def code_quick_stats_py(text: str) -> Dict[str, Any]:
    """Pure-Python fallback for code metrics and token estimation."""
    char_count = len(text)
    word_count = len(text.split())
    lines = text.splitlines()
    line_count = len(lines)
    non_empty = sum(1 for l in lines if l.strip())

    approx_tokens = max(word_count, math.ceil(char_count / 3.8))

    stack = []
    is_balanced = True
    for ch in text:
        if ch in "([{":
            stack.append(ch)
        elif ch == ")":
            if not stack or stack.pop() != "(":
                is_balanced = False
                break
        elif ch == "]":
            if not stack or stack.pop() != "[":
                is_balanced = False
                break
        elif ch == "}":
            if not stack or stack.pop() != "{":
                is_balanced = False
                break
    if stack:
        is_balanced = False

    return {
        "char_count": char_count,
        "word_count": word_count,
        "line_count": line_count,
        "non_empty_lines": non_empty,
        "estimated_tokens": approx_tokens,
        "is_balanced": is_balanced,
    }


def code_quick_stats_via_sidecar(text: str) -> Optional[Dict[str, Any]]:
    """Compute code stats via the Rust sidecar."""
    if not sidecar_enabled():
        return None
    try:
        resp = requests.post(
            f"{SIDECAR_URL}/code/stats",
            json={"text": text},
            timeout=SIDECAR_TIMEOUT,
        )
        if resp.status_code == 200:
            data = resp.json()
            if isinstance(data, dict) and "estimated_tokens" in data:
                return data
        log.warning("sidecar code_stats failed (HTTP %s); falling back to Python", resp.status_code)
    except Exception as exc:  # noqa: BLE001
        log.warning("sidecar unreachable (%s); falling back to Python", exc)
    return None


def code_quick_stats(text: str) -> Tuple[Dict[str, Any], str]:
    """
    Analyze code string for token count, line count, and balanced delimiters.
    Returns (stats_dict, engine) where engine is 'rust-sidecar' or 'python-fallback'.
    """
    res = code_quick_stats_via_sidecar(text)
    if res is not None:
        return res, "rust-sidecar"
    return code_quick_stats_py(text), "python-fallback"


async def code_quick_stats_async(text: str) -> Tuple[Dict[str, Any], str]:
    """Async wrapper for code_quick_stats."""
    return await asyncio.to_thread(code_quick_stats, text)


# ── Liveness Probe ──────────────────────────────────────────────────────────

async def sidecar_healthy_async() -> bool:
    """Async liveness probe against /health (False when disabled/unreachable)."""
    if not sidecar_enabled():
        return False

    def _probe() -> bool:
        try:
            resp = requests.get(f"{SIDECAR_URL}/health", timeout=SIDECAR_TIMEOUT)
            return resp.status_code == 200
        except Exception:  # noqa: BLE001
            return False

    return await asyncio.to_thread(_probe)
