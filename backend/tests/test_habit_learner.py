import pytest
from app import habit_learner
from app.agent import OpenzessAgent


def test_habit_recording_and_retrieval():
    """Verify storing and retrieving user habits."""
    habit_learner.record_habit("preferred_language", "Prefers Rust and Python hybrid architecture.", source="test")
    habits = habit_learner.get_all_habits()
    assert "preferred_language" in habits
    assert "Rust and Python" in habits["preferred_language"]


def test_user_profile_prompt_generation():
    """Verify that user profile generates formatted prompt lines."""
    habit_learner.record_habit("test_style", "Prefers unit tests for every new feature.", source="test")
    profile = habit_learner.get_user_profile_prompt()
    assert "[LEARNED USER PROFILE" in profile
    assert "Test Style" in profile


def test_heuristic_habit_extractor():
    """Verify that analyze_user_prompt_for_habits catches language & style keywords."""
    detected = habit_learner.analyze_user_prompt_for_habits("I prefer Rust for writing fast code, keep it short")
    categories = [cat for cat, _ in detected]
    assert "preferred_language" in categories
    assert "response_style" in categories


def test_agent_context_includes_habits():
    """Verify that newly initialized OpenzessAgent incorporates learned habits."""
    habit_learner.record_habit("favorite_os", "Debian Linux WSL2 user rossdeb", source="test")
    agent = OpenzessAgent(provider="glm")
    sys_msg = agent.messages[0]["content"]
    assert "LEARNED USER PROFILE" in sys_msg
    assert "Favorite Os" in sys_msg
