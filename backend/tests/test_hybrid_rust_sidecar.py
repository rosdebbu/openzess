"""
Unit tests for the Openzess Hybrid Python (70%) + Rust (30%) acceleration layer.
Verifies both the pure-Python reference fallbacks and sidecar client contracts.
"""

import math
import pytest
from app import sidecar_client
from app.agent import native_tool_funcs, NATIVE_TOOL_SCHEMAS


def test_cosine_similarity_py():
    # Identical vectors
    assert math.isclose(sidecar_client.cosine_similarity_py([1.0, 2.0, 3.0], [1.0, 2.0, 3.0]), 1.0, rel_tol=1e-5)
    # Orthogonal vectors
    assert math.isclose(sidecar_client.cosine_similarity_py([1.0, 0.0], [0.0, 1.0]), 0.0, abs_tol=1e-5)
    # Opposite vectors
    assert math.isclose(sidecar_client.cosine_similarity_py([1.0, 0.0], [-1.0, 0.0]), -1.0, rel_tol=1e-5)
    # Empty / mismatched length
    assert sidecar_client.cosine_similarity_py([], [1.0]) == 0.0
    assert sidecar_client.cosine_similarity_py([1.0, 2.0], [1.0]) == 0.0


def test_vector_top_k_py():
    query = [1.0, 0.0, 0.0]
    candidates = [
        {"id": "doc1", "vector": [0.0, 1.0, 0.0], "metadata": {"tag": "orthogonal"}},
        {"id": "doc2", "vector": [0.9, 0.1, 0.0], "metadata": {"tag": "close"}},
        {"id": "doc3", "vector": [1.0, 0.0, 0.0], "metadata": {"tag": "exact"}},
    ]

    res, engine = sidecar_client.vector_top_k(query, candidates, top_k=2)
    assert engine in ("rust-sidecar", "python-fallback")
    assert res["total_evaluated"] == 3
    assert len(res["results"]) == 2
    assert res["results"][0]["id"] == "doc3"
    assert res["results"][1]["id"] == "doc2"


def test_graph_shortest_path_py():
    graph_data = {
        "nodes": [{"id": "A"}, {"id": "B"}, {"id": "C"}, {"id": "D"}],
        "links": [
            {"source": "A", "target": "B"},
            {"source": "B", "target": "C"},
            {"source": "C", "target": "D"},
        ]
    }

    res, engine = sidecar_client.graph_shortest_path(graph_data, "A", "D")
    assert engine in ("rust-sidecar", "python-fallback")
    assert res["found"] is True
    assert res["distance"] == 3
    assert res["path"] == ["A", "B", "C", "D"]

    # Unreachable node test
    unreachable_res, _ = sidecar_client.graph_shortest_path(graph_data, "A", "Z")
    assert unreachable_res["found"] is False
    assert unreachable_res["path"] == []


def test_code_quick_stats_py():
    code = (
        "def hello_world():\n"
        "    # A sample function\n"
        "    print('Hello Openzess!')\n"
        "    return 42\n"
    )
    stats, engine = sidecar_client.code_quick_stats(code)
    assert engine in ("rust-sidecar", "python-fallback")
    assert stats["line_count"] == 4
    assert stats["non_empty_lines"] == 4
    assert stats["is_balanced"] is True
    assert stats["estimated_tokens"] > 0

    # Test unbalanced code
    bad_code = "def broken(): return [1, 2"
    bad_stats, _ = sidecar_client.code_quick_stats(bad_code)
    assert bad_stats["is_balanced"] is False


def test_aggregate_graph_py():
    graph_data = {
        "nodes": [
            {"id": "1", "community": 1},
            {"id": "2", "community": 1},
            {"id": "3", "community": 2},
        ],
        "links": [
            {"source": "1", "target": "2"},
            {"source": "2", "target": "3"},
        ]
    }
    stats, engine = sidecar_client.aggregate_graph(graph_data)
    assert engine in ("rust-sidecar", "python-fallback")
    assert stats["nodes"] == 3
    assert stats["edges"] == 2
    assert stats["communities"] == 2


def test_agent_native_tools_registered():
    assert "analyze_code_metrics" in native_tool_funcs
    assert "synthesize_skill" in native_tool_funcs
    assert "save_memory" in native_tool_funcs
    assert "recall_memory" in native_tool_funcs

    schema_names = [s["function"]["name"] for s in NATIVE_TOOL_SCHEMAS]
    assert "analyze_code_metrics" in schema_names
    assert "synthesize_skill" in schema_names
    assert "save_memory" in schema_names
    assert "recall_memory" in schema_names


def test_analyze_code_metrics_tool():
    tool_func = native_tool_funcs["analyze_code_metrics"]
    output = tool_func("print('test')")
    assert "[CODE METRICS (" in output
    assert "Lines: 1" in output
