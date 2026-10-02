"""
Tests for the new full-stack features:
- JWT auth (register/login/me, password hashing, token expiry, admin gate)
- Rate limiting (sliding window, 429, exemption, reset)
- Metrics (counters, Prometheus render format)
- Database ownership columns (user_id auto-migration)
"""

import os
import time
import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("OPENZESS_JWT_SECRET", "test-secret-key-for-pytest-only")
os.environ.setdefault("OPENZESS_RATE_LIMIT", "0")  # disabled by default; tests opt in

from app import database
from app import auth as auth_module
from app import rate_limit as rl
from app import metrics as metrics_module


@pytest.fixture()
def client():
    """TestClient against the real app with rate limiting disabled."""
    from app.server import app
    with TestClient(app) as c:
        yield c


@pytest.fixture()
def auth_headers(client):
    """Register a throwaway user and return valid Bearer headers."""
    suffix = str(time.time_ns())
    r = client.post(
        "/api/auth/register",
        json={
            "email": f"u{suffix}@test.dev",
            "username": f"user{suffix}",
            "password": "supersecret123",
        },
    )
    assert r.status_code == 200, r.text
    token = r.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


# ══════════════════════════════════════════════════════════════════
# AUTH
# ══════════════════════════════════════════════════════════════════
class TestAuth:
    def test_password_hash_roundtrip(self):
        h = auth_module.hash_password("mypassword123")
        assert h != "mypassword123"
        assert h.startswith("$2")
        assert auth_module.verify_password("mypassword123", h)
        assert not auth_module.verify_password("wrongpass", h)

    def test_hash_rejects_short_password(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            auth_module.hash_password("short")
        assert exc.value.status_code == 400

    def test_register_and_login_flow(self, client):
        suffix = str(time.time_ns())
        reg = client.post(
            "/api/auth/register",
            json={"email": f"x{suffix}@test.dev", "username": f"x{suffix}", "password": "password123"},
        )
        assert reg.status_code == 200
        body = reg.json()
        assert body["token_type"] == "bearer"
        assert body["access_token"]
        assert body["user"]["email"] == f"x{suffix}@test.dev"

        # Duplicate email -> 409
        dup = client.post(
            "/api/auth/register",
            json={"email": f"x{suffix}@test.dev", "username": f"y{suffix}", "password": "password123"},
        )
        assert dup.status_code == 409

        # Login with email
        login = client.post(
            "/api/auth/login", json={"identifier": f"x{suffix}@test.dev", "password": "password123"}
        )
        assert login.status_code == 200

        # Login with username
        login2 = client.post(
            "/api/auth/login", json={"identifier": f"x{suffix}", "password": "password123"}
        )
        assert login2.status_code == 200

        # Wrong password -> 401 (uniform error, no user enumeration)
        bad = client.post(
            "/api/auth/login", json={"identifier": f"x{suffix}@test.dev", "password": "wrongpass1"}
        )
        assert bad.status_code == 401

    def test_register_validation(self, client):
        bad_email = client.post(
            "/api/auth/register",
            json={"email": "not-an-email", "username": "abc123", "password": "password123"},
        )
        assert bad_email.status_code == 400

        short_user = client.post(
            "/api/auth/register",
            json={"email": "ok@test.dev", "username": "ab", "password": "password123"},
        )
        assert short_user.status_code == 400

        short_pass = client.post(
            "/api/auth/register",
            json={"email": "ok2@test.dev", "username": "abcd", "password": "short"},
        )
        assert short_pass.status_code == 400

    def test_me_endpoint(self, client, auth_headers):
        r = client.get("/api/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert "email" in r.json()["user"]

    def test_me_requires_token(self, client):
        r = client.get("/api/auth/me")
        assert r.status_code == 401

    def test_me_rejects_garbage_token(self, client):
        r = client.get("/api/auth/me", headers={"Authorization": "Bearer garbage.token.here"})
        assert r.status_code == 401

    def test_expired_token_rejected(self):
        from fastapi import HTTPException
        user = auth_module.User(
            id="expired-user", email="e@e.com", username="exp",
            password_hash="", is_admin=0, is_active=1,
        )
        token = auth_module.create_access_token(user, expires_minutes=-1)
        with pytest.raises(HTTPException) as exc:
            auth_module.decode_access_token(token)
        assert exc.value.status_code == 401

    def test_admin_gate(self, client, auth_headers):
        # Regular user cannot ping admin
        r = client.get("/api/auth/admin/ping", headers=auth_headers)
        assert r.status_code == 403

    def test_admin_ping_with_admin(self, client):
        # Bootstrap admin via env then login
        os.environ["OPENZESS_ADMIN_EMAIL"] = f"admin{time.time_ns()}@test.dev"
        os.environ["OPENZESS_ADMIN_PASSWORD"] = "adminpass123"
        os.environ["OPENZESS_ADMIN_USERNAME"] = "adminboss"
        try:
            auth_module.ensure_admin_bootstrap()
            login = client.post(
                "/api/auth/login",
                json={"identifier": "adminboss", "password": "adminpass123"},
            )
            assert login.status_code == 200
            token = login.json()["access_token"]
            r = client.get("/api/auth/admin/ping", headers={"Authorization": f"Bearer {token}"})
            assert r.status_code == 200
            assert r.json()["admin"] == "adminboss"
        finally:
            os.environ.pop("OPENZESS_ADMIN_EMAIL", None)
            os.environ.pop("OPENZESS_ADMIN_PASSWORD", None)
            os.environ.pop("OPENZESS_ADMIN_USERNAME", None)


# ══════════════════════════════════════════════════════════════════
# RATE LIMITING
# ══════════════════════════════════════════════════════════════════
class FakeReq:
    class url:
        path = "/api/tools"
    headers = {}
    client = None


class TestRateLimit:
    def test_allows_under_limit(self):
        rl.reset_rate_limits()
        for _ in range(3):
            result = rl.check_rate_limit(FakeReq(), limit=5, window_seconds=60)
            assert result["remaining"] >= 0

    def test_blocks_over_limit(self):
        rl.reset_rate_limits()
        from fastapi import HTTPException
        with pytest.raises(HTTPException) as exc:
            for _ in range(7):
                rl.check_rate_limit(FakeReq(), limit=5, window_seconds=60)
        assert exc.value.status_code == 429
        assert "Retry-After" in exc.value.headers

    def test_exempt_paths(self):
        rl.reset_rate_limits()

        class MetricsReq:
            class url:
                path = "/metrics"
            headers = {}
            client = None

        for _ in range(200):
            result = rl.check_rate_limit(MetricsReq(), limit=2, window_seconds=60)
            assert result["remaining"] == -1

    def test_window_expiry(self):
        rl.reset_rate_limits()
        # Simulate old hits by manipulating the bucket directly
        key = rl._client_key(FakeReq())
        old_time = time.monotonic() - 120  # older than any window
        with rl._lock:
            rl._hits[key]["/api/tools"].append(old_time)
        result = rl.check_rate_limit(FakeReq(), limit=2, window_seconds=60)
        assert result["remaining"] >= 1  # old hit expired, not counted


# ══════════════════════════════════════════════════════════════════
# METRICS
# ══════════════════════════════════════════════════════════════════
class TestMetrics:
    def test_record_and_render(self):
        metrics_module.record_request("GET", "/api/tools", 200, 0.05)
        metrics_module.record_request("GET", "/api/tools", 200, 0.15)
        metrics_module.record_request("POST", "/api/chat", 500, 2.0)
        metrics_module.record_rate_limited()

        text = metrics_module.render_metrics(active_sessions=3)
        assert 'openzess_http_requests_total{method="GET",path="/api/tools",status="200"} 2' in text
        assert 'openzess_http_requests_total{method="POST",path="/api/chat",status="500"} 1' in text
        assert "openzess_rate_limited_total 1" in text
        assert "openzess_active_sessions 3" in text
        assert 'openzess_http_request_duration_seconds_count{path="/api/tools"} 2' in text
        assert 'openzess_http_request_duration_seconds_bucket{path="/api/tools",le="0.1"} 1' in text

    def test_path_normalization(self):
        assert metrics_module._normalize_path("/api/notes/some-uuid") == "/api/notes/{id}"
        assert metrics_module._normalize_path("/api/chat") == "/api/chat"

    def test_metrics_endpoint_live(self, client):
        # Hit an endpoint first so there is data
        client.get("/api/tools")
        r = client.get("/metrics")
        assert r.status_code == 200
        assert "openzess_http_requests_total" in r.text
        assert "text/plain" in r.headers["content-type"]


# ══════════════════════════════════════════════════════════════════
# DATABASE OWNERSHIP (user_id)
# ══════════════════════════════════════════════════════════════════
class TestDatabaseOwnership:
    def test_user_id_columns_exist(self):
        for model in (database.Session, database.Message, database.Note, database.Persona):
            assert hasattr(model, "user_id"), f"{model.__tablename__} missing user_id"

    def test_create_session_with_user(self):
        sid = database.create_session(title="Owned session", user_id="user-abc")
        sessions = database.get_all_sessions()
        match = [s for s in sessions if s["id"] == sid]
        assert match and match[0].get("user_id") == "user-abc"
        database.delete_session(sid)

    def test_create_note_with_user(self):
        nid = database.create_note("T", "C", "General", user_id="user-xyz")
        notes = database.get_all_notes()
        match = [n for n in notes if n["id"] == nid]
        assert match and match[0].get("user_id") == "user-xyz"
        database.delete_note(nid)

    def test_legacy_calls_still_work(self):
        # Backward-compat: user_id defaults to None
        sid = database.create_session(title="Legacy")
        assert sid
        database.delete_session(sid)