import os
import json
import pytest
from app import experiential_client
from app.agent import OpenzessAgent, PROVIDER_MODELS


def test_classify_task_complexity():
    # Simple tasks should be classified as fast tier
    assert experiential_client.classify_task_complexity("hello") == "fast"
    assert experiential_client.classify_task_complexity("list files") == "fast"
    assert experiential_client.classify_task_complexity("what is 2 + 2") == "fast"

    # Complex programming / architecture tasks should trigger reasoning tier
    assert experiential_client.classify_task_complexity("refactor the async database connection to avoid race condition") == "reasoning"
    assert experiential_client.classify_task_complexity("fix bug in distributed consensus algorithm") == "reasoning"
    assert experiential_client.classify_task_complexity("```python\ndef solve(): pass\n```") == "reasoning"


def test_format_terminal_link():
    # Web URL
    url_link = experiential_client.format_terminal_link("OpenZess Docs", "https://openzess-docs.vercel.app")
    assert "\033]8;;https://openzess-docs.vercel.app\033\\OpenZess Docs\033]8;;\033\\" == url_link

    # Local file path should normalize with file:/// prefix
    file_link = experiential_client.format_terminal_link("agent.py", "backend/app/agent.py")
    assert "file:///" in file_link
    assert "\033]8;;" in file_link


def test_is_gateway_healthy_probe():
    # Quick probe on an inactive local port should return False without crashing or hanging
    status = experiential_client.is_gateway_healthy("http://127.0.0.1:59999/v1", timeout=0.05)
    assert status is False


def test_record_otel_trace(tmp_path, monkeypatch):
    # Redirect working directory for traces to temp path
    monkeypatch.chdir(tmp_path)
    
    experiential_client.record_otel_trace(
        session_id="test_sess_1",
        prompt="Write a quick test",
        model="openai/gpt-4o-mini",
        latency_seconds=0.45,
        tokens=120,
        tools_used=["create_file"],
        success=True
    )
    
    trace_file = tmp_path / ".exp" / "traces.otel.jsonl"
    assert trace_file.exists()
    
    with open(trace_file, "r", encoding="utf-8") as f:
        lines = f.readlines()
        assert len(lines) == 1
        data = json.loads(lines[0])
        assert data["session_id"] == "test_sess_1"
        assert data["model"] == "openai/gpt-4o-mini"
        assert data["status"] == "SUCCESS"
        assert "create_file" in data["tools_called"]


def test_agent_initialization_experiential():
    agent = OpenzessAgent(provider="experiential")
    assert agent.provider == "experiential"
    assert agent.api_base == experiential_client.DEFAULT_GATEWAY_BASE
    assert agent.model_name == "openai/default"

    agent_exp = OpenzessAgent(provider="exp")
    assert agent_exp.provider == "exp"
    assert agent_exp.api_base == experiential_client.DEFAULT_GATEWAY_BASE

    agent_smart = OpenzessAgent(provider="exp:smart")
    assert agent_smart.provider == "exp:smart"
    assert agent_smart.api_base == experiential_client.DEFAULT_GATEWAY_BASE
