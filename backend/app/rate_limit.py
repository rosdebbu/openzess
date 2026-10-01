"""
In-process sliding-window rate limiter for FastAPI.

Zero external dependencies (no Redis) - suitable for single-instance
deployments. For multi-instance production use a shared Redis backend.

Usage:
    @app.get("/api/chat")
    def chat(request: Request):
        check_rate_limit(request, limit=30, window_seconds=60)

Environment:
    OPENZESS_RATE_LIMIT: default requests/min for /api endpoints
                         (default 240). 0 disables limiting.
"""

import os
import time
import threading
from collections import defaultdict, deque
from fastapi import HTTPException, Request, status

_enabled = os.environ.get("OPENZESS_RATE_LIMIT", "240").strip() != "0"
_default_limit = int(os.environ.get("OPENZESS_RATE_LIMIT", "240") or "240")

_hits: dict = defaultdict(lambda: defaultdict(deque))
_lock = threading.Lock()

# Endpoints exempt from default limiting (polling/status endpoints)
_EXEMPT_PREFIXES = (
    "/api/channels/telegram/status",
    "/api/channels/discord/status",
    "/metrics",
    "/api/rate-limit/status",
)


def _client_key(request: Request) -> str:
    """Identify the client: authenticated user id > forwarded-for > ip."""
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer ") and len(auth) > 7:
        # JWT tokens carry a unique jti; the sub claim needs decoding which
        # is done by auth routes. Using the raw token suffix is stable per user.
        return "tok:" + auth[7:].strip()[:32]
    forwarded = request.headers.get("x-forwarded-for", "")
    ip = forwarded.split(",")[0].strip() if forwarded else (request.client.host if request.client else "unknown")
    return "ip:" + ip


def check_rate_limit(request: Request, limit: int = None, window_seconds: int = 60) -> dict:
    """Enforce a sliding-window rate limit. Raises HTTP 429 when exceeded.

    Returns {"remaining": n, "limit": limit, "window": seconds} on success.
    """
    is_active = (limit is not None) or (os.environ.get("OPENZESS_RATE_LIMIT", "240").strip() != "0")
    if not is_active:
        return {"remaining": -1, "limit": 0, "window": window_seconds}

    path = request.url.path
    for prefix in _EXEMPT_PREFIXES:
        if path.startswith(prefix):
            return {"remaining": -1, "limit": 0, "window": window_seconds}

    max_hits = limit if limit is not None else _default_limit
    key = _client_key(request)
    now = time.monotonic()
    bucket = _hits[key][path]

    with _lock:
        while bucket and bucket[0] <= now - window_seconds:
            bucket.popleft()
        if len(bucket) >= max_hits:
            retry_after = int(window_seconds - (now - bucket[0])) + 1
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Rate limit exceeded ({max_hits} req/{window_seconds}s). Retry in {retry_after}s.",
                headers={"Retry-After": str(retry_after)},
            )
        bucket.append(now)

    return {"remaining": max_hits - len(bucket), "limit": max_hits, "window": window_seconds}


def reset_rate_limits() -> None:
    """Clear all buckets (used by tests)."""
    with _lock:
        _hits.clear()