import pytest
import json
from backend.app.agent import OpenzessAgent, run_terminal_command

def test_extract_text_tool_calls_glm_style():
    agent = OpenzessAgent(api_key="test", provider="openai")
    text = (
        'I\'ll do that now — cloning first, then inspecting the contents.'
        '<tool_call>bash_command(command="git clone [https://github.com/rosdebbu/Mindmap.git](https://github.com/rosdebbu/Mindmap.git) test_mindmap")</arg_value>'
        '<arg_key>properties</arg_key><arg_value>{"exit_code": 0}>'
        '<tool_call>bash_command(command="cd test_mindmap && ls -la")</arg_value>'
        '<arg_key>properties</arg_key><arg_value>{"exit_code": 0}>'
        '<tool_call>bash_command(command="cd test_mindmap && find . -type f -not -path \'./.git/*\' | head -50")</arg_value>'
    )
    calls = agent._extract_text_tool_calls(text)
    assert len(calls) == 3
    
    # 1st call
    c1 = calls[0]
    assert c1["function"]["name"] == "run_terminal_command"
    args1 = json.loads(c1["function"]["arguments"])
    assert "https://github.com/rosdebbu/Mindmap.git" in args1["command"]
    assert "[" not in args1["command"]
    assert "]" not in args1["command"]

    # 2nd call
    c2 = calls[1]
    assert c2["function"]["name"] == "run_terminal_command"
    args2 = json.loads(c2["function"]["arguments"])
    assert args2["command"] == "cd test_mindmap && ls -la"

    # 3rd call
    c3 = calls[2]
    assert c3["function"]["name"] == "run_terminal_command"
    args3 = json.loads(c3["function"]["arguments"])
    assert "find ." in args3["command"]

def test_extract_text_tool_calls_json_style():
    agent = OpenzessAgent(api_key="test", provider="openai")
    text = '<tool_call>{"name": "run_terminal_command", "arguments": {"command": "echo test"}}</tool_call>'
    calls = agent._extract_text_tool_calls(text)
    assert len(calls) == 1
    assert calls[0]["function"]["name"] == "run_terminal_command"
    args = json.loads(calls[0]["function"]["arguments"])
    assert args["command"] == "echo test"

def test_run_tool_with_extra_kwargs():
    agent = OpenzessAgent(api_key="test", provider="openai")
    # Should safely drop unexpected kwargs like 'properties' or 'exit_code' without raising TypeError
    res = agent._run_tool("run_terminal_command", {"command": "echo hello_unit_test", "properties": {"exit_code": 0}})
    assert "hello_unit_test" in res or "completed" in res.lower()

def test_run_terminal_command_markdown_sanitization():
    # Verify markdown links inside commands are cleaned before running
    res = run_terminal_command('echo "[hello](https://example.com)"')
    assert "https://example.com" not in res
