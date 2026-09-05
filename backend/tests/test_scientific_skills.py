import os
import sys
import tempfile
import pytest

# Ensure backend root is on sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.scientific_skills import (
    list_scientific_skills,
    get_skill_content,
    build_swarm_persona,
    assign_category,
    parse_frontmatter
)
from app.plugins.scientific_tools_plugin import (
    profile_data_file,
    validate_mermaid_diagram,
    search_academic_papers
)

def test_parse_frontmatter():
    sample = """---
name: test-skill
description: A test scientific skill
metadata:
  version: "1.2"
  skill-author: K-Dense Inc.
---
# Overview
This is a test skill.
"""
    meta, body = parse_frontmatter(sample)
    assert meta["name"] == "test-skill"
    assert meta["description"] == "A test scientific skill"
    assert meta["metadata"]["skill-author"] == "K-Dense Inc."
    assert "This is a test skill." in body

def test_assign_category():
    assert assign_category("paper-lookup") == "Literature & Research"
    assert assign_category("exploratory-data-analysis") == "Data Science & Statistics"
    assert assign_category("markdown-mermaid-writing") == "Diagrams & Technical Docs"
    assert assign_category("biopython") == "Bioinformatics & Genomics"
    assert assign_category("rdkit") == "Chemistry & Drug Discovery"
    assert assign_category("opentrons-integration") == "Lab Automation & CAD"
    assert assign_category("optimize-for-gpu") == "High Performance & Quantum"

def test_skills_discovery():
    skills = list_scientific_skills()
    assert len(skills) > 0, "Should discover scientific skills from repository"
    
    first = skills[0]
    assert "id" in first
    assert "name" in first
    assert "keyword" in first
    assert "category" in first
    assert "description" in first
    assert "author" in first
    assert "version" in first

def test_get_skill_content():
    content = get_skill_content("paper-lookup")
    assert content is not None
    assert content["id"] == "paper-lookup"
    assert "Paper Lookup" in content["name"]
    assert "full_markdown" in content
    assert len(content["full_markdown"]) > 50

def test_build_swarm_persona():
    persona = build_swarm_persona("exploratory-data-analysis")
    assert persona is not None
    assert persona["key"] == "exploratory-data-analysis"
    assert "Scientist" in persona["name"]
    assert "NON-NEGOTIABLE BOUNDARIES" in persona["instruction"]
    assert persona["tools"]["run_terminal_command"] is True

def test_profile_data_file():
    with tempfile.NamedTemporaryFile(mode="w", suffix=".csv", delete=False, encoding="utf-8") as f:
        f.write("gene_id,expression_level,tissue,quality_score\n")
        f.write("BRCA1,45.2,breast,0.95\n")
        f.write("TP53,88.1,lung,0.99\n")
        f.write("EGFR,12.4,brain,0.88\n")
        f.write("MYC,,colon,0.91\n")
        temp_path = f.name

    try:
        report = profile_data_file(temp_path)
        assert "Exploratory Data Analysis" in report
        assert "**Rows Analyzed:** 4" in report
        assert "expression_level" in report
        assert "Numeric" in report
        assert "quality_score" in report
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

def test_validate_mermaid_diagram():
    raw_code = """
    flowchart TD
        A[Data Input (Raw)] --> B[Preprocess]
        B --> C[Model Inference]
    """
    result = validate_mermaid_diagram(raw_code)
    assert "Clean Syntax" in result
    assert "```mermaid" in result
    assert 'A["Data Input (Raw)"]' in result  # Parentheses should be safely quoted
