"""
Openzess Rust sidecar client (optional acceleration layer).

Architecture: plans/hybrid-python-rust.md

Contract:
    * Enabled only when the SIDECAR_URL environment variable is set.
    * Every call degrades gracefully: if the sidecar is missing, slow, or
      errors, callers transparently fall back to the pure-Python (Pillow)
      implementation. Openzess behavior is identical either way.
    * encode_image() returns (bytes, engine) so call sites can log which
      engine served the request ('rust-sidecar' or 'pil').

The Python side never hard-depends on this module's remote being up.
"""

import asyncio
import io
import logging
import os
from typing import Optional, Tuple

import requests
from PIL import Image

log = logging.getLogger("openzess.sidecar")

SIDECAR_URL = os.environ.get("SIDECAR_URL", "").strip().rstrip("/")
SIDECAR_TIMEOUT = float(os.environ.get("SIDECAR_TIMEOUT", "2"))


def sidecar_enabled() -> bool:
    """True when SIDECAR_URL is configured."""
    return bool(SIDECAR_URL)


# ── Pure-Python reference implementation (always available) ────────────────

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


# ── Rust sidecar path ──────────────────────────────────────────────────────

def encode_image_via_sidecar(
    raw_bgra: bytes,
    width: int,
    height: int,
    fmt: str = "JPEG",
    quality: int = 65,
) -> Optional[bytes]:
    """
    Encode via the Rust sidecar. Returns None for ANY failure (disabled,
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
    except Exception as exc:  # noqa: BLE001 — any network hiccup must degrade silently
        log.warning("sidecar unreachable (%s); falling back to PIL", exc)
    return None


# ── Public dispatch API ────────────────────────────────────────────────────

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
    """Non-blocking wrapper for async call sites (runs the sync path in a thread)."""
    return await asyncio.to_thread(encode_image, raw_bgra, width, height, fmt, quality)


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


# ── Graphify JSON aggregation ──────────────────────────────────────────────

def aggregate_graph_via_sidecar(gdata: dict) -> Optional[dict]:
    """
    Aggregate a Graphify knowledge-graph payload via the Rust sidecar.

    Expects {"nodes": [...], "links": [...]} and returns
    {"nodes": int, "edges": int, "communities": int} — or None on ANY failure
    (disabled, unreachable, malformed response) so callers fall back to the
    pure-Python implementation with identical output.
    """
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
    except Exception as exc:  # noqa: BLE001 — degrade silently by design
        log.warning("sidecar unreachable (%s); using pure-Python graphify", exc)
    return None


async def aggregate_graph_async(gdata: dict) -> Optional[dict]:
    """Non-blocking wrapper of aggregate_graph_via_sidecar for async call sites."""
    return await asyncio.to_thread(aggregate_graph_via_sidecar, gdata)
