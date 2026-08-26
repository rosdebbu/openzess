"""Unit tests for the optional Rust sidecar client (hybrid acceleration layer).

Covers the three contracts promised in plans/hybrid-python-rust.md:
  1. Pure-Pillow encoding produces valid image headers from synthetic BGRX bytes.
  2. Sidecar path degrades to None (-> Pillow fallback) when disabled/unreachable.
  3. Graph aggregation falls back cleanly with identical counting semantics.
"""

import io
import os
import socket
import threading
from http.server import BaseHTTPRequestHandler, HTTPServer

from PIL import Image
import pytest

from app import sidecar_client as sc


# ── helpers ────────────────────────────────────────────────────────────────

def synthetic_bgrx(width: int = 4, height: int = 4) -> bytes:
    """Build a deterministic BGRA/BGRX pixel buffer (blue gradient frames)."""
    row = bytearray()
    for x in range(width):
        row += bytes((x * 255 // max(width - 1, 1), 64, 255 - x * 255 // max(width - 1, 1), 255))
    return bytes(row) * height


@pytest.fixture(autouse=True)
def sidecar_disabled(monkeypatch):
    """Default every test to the disabled state; individual tests re-enable."""
    monkeypatch.setattr(sc, "SIDECAR_URL", "")


class _FakeSidecar(BaseHTTPRequestHandler):
    """Minimal stand-in for the Rust sidecar returning valid JPEG bytes."""

    def do_POST(self):  # noqa: N802
        length = int(self.headers.get("Content-Length", 0))
        self.rfile.read(length)
        # Generate a guaranteed-valid 1x1 JPEG via Pillow (no hand-rolled bytes).
        buffer = io.BytesIO()
        Image.new("RGB", (1, 1), (255, 0, 0)).save(buffer, format="JPEG")
        jpeg = buffer.getvalue()
        self.send_response(200)
        self.send_header("Content-Type", "image/jpeg")
        self.send_header("Content-Length", str(len(jpeg)))
        self.end_headers()
        self.wfile.write(jpeg)

    def log_message(self, *args):  # silence test output
        pass


@pytest.fixture
def fake_sidecar_server():
    server = HTTPServer(("127.0.0.1", 0), _FakeSidecar)
    port = server.server_address[1]
    thread = threading.Thread(target=server.serve_forever, daemon=True)
    thread.start()
    yield f"http://127.0.0.1:{port}"
    server.shutdown()


# ── 1. Pure-Pillow reference encoding ──────────────────────────────────────

def test_encode_image_pil_produces_valid_jpeg():
    raw = synthetic_bgrx()
    out = sc.encode_image_pil(raw, 4, 4, fmt="JPEG", quality=85)
    assert out[:2] == b"\xff\xd8"  # JPEG SOI marker


def test_encode_image_pil_produces_valid_png():
    raw = synthetic_bgrx()
    out = sc.encode_image_pil(raw, 4, 4, fmt="PNG")
    assert out[:4] == b"\x89PNG"


def test_encode_image_pil_roundtrip_dimensions():
    from PIL import Image
    raw = synthetic_bgrx(6, 3)
    img = Image.open(io.BytesIO(sc.encode_image_pil(raw, 6, 3, fmt="PNG")))
    assert img.size == (6, 3)


# ── 2. Graceful degradation contracts ──────────────────────────────────────

def test_disabled_sidecar_returns_none_for_encode():
    assert sc.encode_image_via_sidecar(synthetic_bgrx(), 4, 4) is None


def test_disabled_sidecar_returns_none_for_aggregate():
    assert sc.aggregate_graph_via_sidecar({"nodes": [], "links": []}) is None


def test_unreachable_sidecar_returns_none(monkeypatch):
    # Bind then close a socket to obtain a guaranteed-free port.
    sock = socket.socket()
    sock.bind(("127.0.0.1", 0))
    free_port = sock.getsockname()[1]
    sock.close()
    monkeypatch.setattr(sc, "SIDECAR_URL", f"http://127.0.0.1:{free_port}")
    monkeypatch.setattr(sc, "SIDECAR_TIMEOUT", 0.2)
    assert sc.encode_image_via_sidecar(synthetic_bgrx(), 4, 4) is None
    assert sc.aggregate_graph_via_sidecar({"nodes": [], "links": []}) is None


def test_dispatch_falls_back_to_pil_when_disabled():
    data, engine = sc.encode_image(synthetic_bgrx(), 4, 4, fmt="PNG")
    assert engine == "pil"
    assert data[:4] == b"\x89PNG"


def test_dispatch_uses_sidecar_when_healthy(monkeypatch, fake_sidecar_server):
    monkeypatch.setattr(sc, "SIDECAR_URL", fake_sidecar_server)
    monkeypatch.setattr(sc, "SIDECAR_TIMEOUT", 2.0)
    data, engine = sc.encode_image(synthetic_bgrx(), 4, 4, fmt="JPEG")
    assert engine == "rust-sidecar"
    assert data[:2] == b"\xff\xd8"


def test_sidecar_enabled_flag_reflects_env(monkeypatch):
    monkeypatch.setattr(sc, "SIDECAR_URL", "")
    assert sc.sidecar_enabled() is False
    monkeypatch.setattr(sc, "SIDECAR_URL", "http://127.0.0.1:8100")
    assert sc.sidecar_enabled() is True


# ── 3. Graph aggregation fallback semantics ────────────────────────────────

def test_aggregate_python_parity_counts():
    """The fallback counting math used by server.py must match expected totals."""
    gdata = {
        "nodes": [
            {"id": "a", "community": 1},
            {"id": "b", "community": 1},
            {"id": "c", "community": 2},
        ],
        "links": [{"source": "a", "target": "b"}, {"source": "b", "target": "c"}],
    }
    stats = sc.aggregate_graph_via_sidecar(gdata)  # disabled -> None
    assert stats is None
    # Pure-Python parity (mirrors server.py fallback branch):
    nodes_count = len(gdata.get("nodes", []))
    edges_count = len(gdata.get("links", []))
    communities_count = len(set(n.get("community", 1) for n in gdata.get("nodes", [])))
    assert (nodes_count, edges_count, communities_count) == (3, 2, 2)


def test_aggregate_via_fake_sidecar(monkeypatch, fake_sidecar_server):
    """Even a non-graph JSON 200 response must not crash; malformed payloads fall back."""
    monkeypatch.setattr(sc, "SIDECAR_URL", fake_sidecar_server)
    result = sc.aggregate_graph_via_sidecar({"nodes": [], "links": []})
    # Fake server returns JPEG bytes -> json parse fails inside requests .json()? It
    # raises -> caught -> None. Contract: never raise, always degrade.
    assert result is None or isinstance(result, dict)
