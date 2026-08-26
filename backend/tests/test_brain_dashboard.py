import pytest
from fastapi.testclient import TestClient
from app.server import app

client = TestClient(app)

def test_get_brain_skills():
    """Verify that /api/brain/skills returns registered plugins and tools."""
    response = client.get("/api/brain/skills")
    assert response.status_code == 200
    data = response.json()
    assert "skills" in data
    assert "total_tools" in data
    assert isinstance(data["skills"], list)
    assert len(data["skills"]) >= 1
    # Check that paperbanana_plugin is listed
    plugin_names = [s["filename"] for s in data["skills"]]
    assert any("paperbanana" in name for name in plugin_names)

def test_reload_brain_skills():
    """Verify that /api/brain/skills/reload reloads tools successfully."""
    response = client.post("/api/brain/skills/reload")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "loaded_tools" in data

def test_get_brain_telemetry():
    """Verify that /api/brain/telemetry returns system health and sidecar info."""
    response = client.get("/api/brain/telemetry")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "uptime_seconds" in data
    assert "python_engine" in data
    assert "rust_sidecar" in data
    assert "memory_vault" in data
    assert "skills_active" in data

def test_brain_memories_crud():
    """Verify storing, retrieving, and searching memories in the vault."""
    # 1. Create a memory
    create_res = client.post("/api/brain/memories", json={
        "concept": "Test Hybrid Architecture",
        "details": "Python 70% core AI and Rust 30% sidecar acceleration layer.",
        "tags": "test,architecture,rust"
    })
    assert create_res.status_code == 200
    
    # 2. Retrieve memories
    get_res = client.get("/api/brain/memories")
    assert get_res.status_code == 200
    mem_data = get_res.json()
    assert "memories" in mem_data
    assert "total" in mem_data

    # 3. Query memories with search term
    search_res = client.get("/api/brain/memories?query=architecture")
    assert search_res.status_code == 200
    search_data = search_res.json()
    assert "memories" in search_data
