"""
In-process sliding-window rate limiter for FastAPI.

Zero external dependencies (no Redis) - suitable for single-instance
deployments. For multi-instance production use a shared Redis backend.

Key Hardening Features:
- Thread-safe sliding-window algorithm guarded by mutex.
- SHA-256 token fingerprinting (prevents JWT header collision across users).
- Automatic route path normalization (prevents ID explosion & memory leak).
- Automatic memory reclamation and stale bucket eviction.
- CORS preflight (OPTIONS), health checks, and doc endpoints exempt.
- Dynamic environment variable parsing (OPENZESS_RATE_LIMIT).

Usage:
    @app.get("/api/chat")
    def chat(request: Request):
        check_rate_limit(request, limit=30, window_seconds=60)

Environment:
    OPENZESS_RATE_LIMIT: default requests/min for /api endpoints
                         (default 240). 0 or "disable" disables limiting.
"""

import hashlib
import os
import threading
import time
from collections import defaultdict, deque
from typing import Any, Dict, Optional, Tuple
from fastapi import HTTPException, Request, status

# ── Dynamic Configuration ──────────────────────────────────────────────────

def get_rate_limit_config() -> Tuple[bool, int]:
    """Read OPENZESS_RATE_LIMIT dynamically with support for disable strings."""
    raw = os.environ.get("OPENZESS_RATE_LIMIT", "240").strip().lower()
    if raw in ("0", "false", "no", "off", "disable", "disabled"):
        return False, 0
    try:
        limit = int(raw)
        return limit > 0, max(0, limit)
    except ValueError:
        return True, 240

# Initial default limit for backward-compatibility with module imports
_enabled, _default_limit = get_rate_limit_config()

# Data structures: client_key -> path -> deque of timestamps
_hits: Dict[str, Dict[str, deque]] = defaultdict(lambda: defaultdict(deque))
_lock = threading.Lock()
_last_prune = 0.0
_PRUNE_INTERVAL = 120.0  # prune stale client entries every 2 minutes
_MAX_TRACKED_CLIENTS = 10000

# Endpoints exempt from default limiting (polling, health, docs, metrics)
_EXEMPT_PREFIXES = (
    "/api/channels/telegram/status",
    "/api/channels/discord/status",
    "/metrics",
    "/api/rate-limit/status",
    "/health",
    "/api/health",
    "/docs",
    "/redoc",
    "/openapi.json",
    "/favicon.ico",
    "/uploads",
    "/graphify",
)


def _normalize_path(path: str) -> str:
    """Normalize parameterized paths to prevent memory explosion & bypasses."""
    for prefix, template in (
        ("/api/sessions/", "/api/sessions/{id}"),
        ("/api/messages/", "/api/messages/{id}"),
        ("/api/notes/", "/api/notes/{id}"),
        ("/api/personas/", "/api/personas/{id}"),
        ("/api/memory/", "/api/memory/{id}"),
        ("/api/mcp/", "/api/mcp/{id}"),
        ("/api/cron/", "/api/cron/{id}"),
        ("/api/watchdog/", "/api/watchdog/{id}"),
        ("/api/repo-sentry/", "/api/repo-sentry/{id}"),
    ):
        if path.startswith(prefix):
            return template
    return path


def _client_key(request: Request) -> str:
    """
    Identify the client:
    1. Bearer Token: SHA-256 fingerprint of the full token (prevents JWT header collision).
    2. Client IP: Handles forwarded IPs safely with client fallback.
    """
    headers = getattr(request, "headers", {})
    auth = headers.get("authorization", "") if isinstance(headers, dict) or hasattr(headers, "get") else ""
    if isinstance(auth, str) and auth.lower().startswith("bearer ") and len(auth) > 7:
        token = auth[7:].strip()
        # Hash the full token so users don't share the same generic eyJhbGciOiJIUzI1Ni header bucket
        token_hash = hashlib.sha256(token.encode("utf-8")).hexdigest()[:16]
        return "tok:" + token_hash

    # IP resolution
    forwarded = headers.get("x-forwarded-for", "") if hasattr(headers, "get") else ""
    if forwarded and isinstance(forwarded, str):
        ip = forwarded.split(",")[0].strip()
    else:
        client = getattr(request, "client", None)
        ip = client.host if client and hasattr(client, "host") else "unknown"
    return "ip:" + ip


def _prune_stale_buckets(now: float, window_seconds: int = 60) -> None:
    """Evict expired timestamps and empty client buckets to prevent memory leaks."""
    global _last_prune
    if now - _last_prune < _PRUNE_INTERVAL and len(_hits) < _MAX_TRACKED_CLIENTS:
        return

    _last_prune = now
    cutoff = now - max(window_seconds, 300)
    empty_clients = []

    for client_key, paths in list(_hits.items()):
        empty_paths = []
        for path, bucket in list(paths.items()):
            while bucket and bucket[0] <= cutoff:
                bucket.popleft()
            if not bucket:
                empty_paths.append(path)
        for p in empty_paths:
            paths.pop(p, None)
        if not paths:
            empty_clients.append(client_key)

    for c in empty_clients:
        _hits.pop(c, None)

    # Hard cap emergency safeguard
    if len(_hits) > _MAX_TRACKED_CLIENTS:
        keys_to_drop = list(_hits.keys())[: len(_hits) // 5]
        for k in keys_to_drop:
            _hits.pop(k, None)


def check_rate_limit(
    request: Request,
    limit: Optional[int] = None,
    window_seconds: int = 60,
    scope: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Enforce a sliding-window rate limit. Raises HTTP 429 when exceeded.

    Args:
        request: FastAPI Request object.
        limit: Max allowed hits in window. If None, uses OPENZESS_RATE_LIMIT env (default 240).
        window_seconds: Window duration in seconds (default 60).
        scope: Optional bucket name. If None, uses normalized request path.

    Returns:
        {"remaining": n, "limit": limit, "window": window_seconds}
    """
    # Preflight requests (CORS OPTIONS) are always exempt
    if getattr(request, "method", "").upper() == "OPTIONS":
        return {"remaining": -1, "limit": 0, "window": window_seconds}

    enabled, default_limit = get_rate_limit_config()
    is_active = (limit is not None) or enabled
    if not is_active:
        return {"remaining": -1, "limit": 0, "window": window_seconds}

    path = getattr(request.url, "path", "")
    for prefix in _EXEMPT_PREFIXES:
        if path.startswith(prefix):
            return {"remaining": -1, "limit": 0, "window": window_seconds}

    max_hits = limit if limit is not None else default_limit
    if max_hits <= 0:
        return {"remaining": -1, "limit": 0, "window": window_seconds}

    norm_path = scope or _normalize_path(path)
    key = _client_key(request)
    now = time.monotonic()

    with _lock:
        _prune_stale_buckets(now, window_seconds)
        bucket = _hits[key][norm_path]

        while bucket and bucket[0] <= now - window_seconds:
            bucket.popleft()

        if len(bucket) >= max_hits:
            oldest = bucket[0]
            retry_after = max(1, int(window_seconds - (now - oldest)) + 1)
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded ({max_hits} req/{window_seconds}s). Retry in {retry_after}s.",
                headers={"Retry-After": str(retry_after)},
            )

        bucket.append(now)
        remaining = max_hits - len(bucket)

    return {"remaining": remaining, "limit": max_hits, "window": window_seconds}


def reset_rate_limits() -> None:
    """Clear all buckets (used by tests)."""
    with _lock:
        _hits.clear()