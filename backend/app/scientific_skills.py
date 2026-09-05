"""
OpenZess Scientific Skills Bridge
Scans, categorizes, and provides access to 180+ K-Dense-AI scientific agent skills.
"""

import os
import re
import yaml
from typing import Dict, List, Optional, Any

# Primary skill locations (checked in order)
DEFAULT_SKILL_PATHS = [
    os.path.expanduser(r"~\.gemini\config\skills"),
    r"C:\Users\ROSHNI\.gemini\config\skills",
    os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "skills")),
]

# Category mapping
CATEGORY_MAP = {
    "Literature & Research": [
        "paper-lookup", "literature-review", "citation-management", "bgpt-paper-search",
        "research-lookup", "peer-review", "paperzilla", "venue-templates", "research-grants",
        "open-notebook", "scholar-evaluation", "scientific-writing", "scientific-critical-thinking",
        "scientific-brainstorming", "grant-writing", "grant-writing-support", "clinical-research"
    ],
    "Data Science & Statistics": [
        "exploratory-data-analysis", "scientific-visualization", "statistical-analysis",
        "statsmodels", "polars", "dask", "vaex", "seaborn", "matplotlib", "aeon",
        "timesfm-forecasting", "shap", "scikit-learn", "scikit-survival", "pymc", "pymoo",
        "bayesian-analysis", "bayesian-methods", "time-series", "time-series-forecasting",
        "data-analysis-visualization", "data-visualization", "statistical-power",
        "uncertainty-and-units", "pandas-advanced"
    ],
    "Diagrams & Technical Docs": [
        "markdown-mermaid-writing", "scientific-schematics", "infographics", "scientific-slides",
        "latex-posters", "pptx-posters", "liteparse", "markitdown", "pdf", "docx", "pptx",
        "xlsx", "mermaid-diagrams", "mermaid-scientific-diagrams", "document-processing",
        "document-processor"
    ],
    "Bioinformatics & Genomics": [
        "biopython", "bioservices", "anndata", "scanpy", "scvi-tools", "scvelo",
        "cellxgene-census", "deeptools", "pysam", "polars-bio", "gtars", "geniml",
        "onekgpd", "bulk-rnaseq", "pydeseq2", "scikit-bio", "etetoolkit", "phylogenetics",
        "tiledbvcf", "waypoint-bio", "bids", "pathogen-variant-surveillance",
        "pathway-enrichment", "genomic-coordinates", "genomic-intelligence"
    ],
    "Chemistry & Drug Discovery": [
        "rdkit", "datamol", "deepchem", "medchem", "diffdock", "rowan", "molfeat",
        "torchdrug", "pytdc", "glycoengineering", "molecular-dynamics", "depmap",
        "primekg", "matchms", "pyopenms", "cobrapy", "pkpd-modeling", "protein-engineering"
    ],
    "Lab Automation & CAD": [
        "opentrons-integration", "pylabrobot", "lab-hardware-cad", "benchling-integration",
        "ginkgo-cloud-lab", "omero-integration", "protocolsio-integration",
        "labarchive-integration", "flowio", "pydicom", "imaging-data-commons"
    ],
    "High Performance & Quantum": [
        "optimize-for-gpu", "modal", "pufferlib", "stable-baselines3", "qiskit", "cirq",
        "pennylane", "qutip", "pytorch-lightning", "torch-geometric", "transformers",
        "fluidsim", "openpiv", "simpy", "reinforcement-learning", "reinforcement-learning-pufferlib"
    ],
    "Clinical & Regulatory": [
        "analytical-method-validation", "clinical-reports", "clinical-decision-support",
        "treatment-plans", "iso-standards-readiness", "relsa-severity-assessment", "pyhealth"
    ]
}

# Curated Top Skills with high relevance
TOP_CURATED_SKILLS = {
    "paper-lookup": {"icon": "Search", "badge": "Scholarly Retrieval", "stars": 5},
    "literature-review": {"icon": "BookOpen", "badge": "Systematic Synthesis", "stars": 5},
    "citation-management": {"icon": "Bookmark", "badge": "BibTeX & Validation", "stars": 5},
    "exploratory-data-analysis": {"icon": "BarChart2", "badge": "Automated EDA", "stars": 5},
    "scientific-visualization": {"icon": "PieChart", "badge": "Publication Figures", "stars": 5},
    "statistical-analysis": {"icon": "Activity", "badge": "Hypothesis Testing", "stars": 5},
    "markdown-mermaid-writing": {"icon": "GitFork", "badge": "Technical Diagrams", "stars": 5},
    "biopython": {"icon": "Dna", "badge": "Molecular Sequences", "stars": 4},
    "rdkit": {"icon": "FlaskConical", "badge": "Cheminformatics", "stars": 4},
    "optimize-for-gpu": {"icon": "Cpu", "badge": "CUDA Acceleration", "stars": 4},
    "scientific-schematics": {"icon": "Image", "badge": "Nano Banana AI", "stars": 4},
    "pdf": {"icon": "FileText", "badge": "PDF Intelligence", "stars": 4},
}

def get_skills_root_dir() -> Optional[str]:
    """Finds the first existing skills root directory."""
    custom_env = os.environ.get("OPENZESS_SKILLS_DIR")
    if custom_env and os.path.isdir(custom_env):
        return os.path.abspath(custom_env)

    for path in DEFAULT_SKILL_PATHS:
        if os.path.isdir(path):
            return os.path.abspath(path)
    return None

def parse_frontmatter(content: str) -> tuple[Dict[str, Any], str]:
    """Extracts YAML frontmatter and remaining markdown body."""
    pattern = r"^---\s*\n(.*?)\n---\s*\n(.*)$"
    match = re.match(pattern, content, re.DOTALL)
    if not match:
        return {}, content
    
    yaml_text = match.group(1)
    body_text = match.group(2)
    try:
        data = yaml.safe_load(yaml_text) or {}
        return data, body_text
    except Exception:
        return {}, content

def assign_category(skill_name: str) -> str:
    """Matches a skill name against categorized lists."""
    name_clean = skill_name.lower().strip()
    for cat, skills in CATEGORY_MAP.items():
        if name_clean in skills or any(name_clean.startswith(s) for s in skills):
            return cat
    return "Specialized Science"

def list_scientific_skills() -> List[Dict[str, Any]]:
    """Discovers all skills in the root directory and parses metadata."""
    root_dir = get_skills_root_dir()
    if not root_dir or not os.path.isdir(root_dir):
        return []

    skills = []
    for item in sorted(os.listdir(root_dir)):
        skill_dir = os.path.join(root_dir, item)
        skill_file = os.path.join(skill_dir, "SKILL.md")

        if os.path.isdir(skill_dir) and os.path.exists(skill_file):
            try:
                with open(skill_file, "r", encoding="utf-8", errors="replace") as f:
                    content = f.read()

                meta, body = parse_frontmatter(content)
                name = meta.get("name", item)
                desc = meta.get("description", "")
                category = assign_category(item)

                # Summary snippet
                if not desc:
                    lines = [line.strip() for line in body.split("\n") if line.strip() and not line.startswith("#")]
                    desc = lines[0] if lines else "Scientific agent skill."

                is_curated = item in TOP_CURATED_SKILLS
                curated_info = TOP_CURATED_SKILLS.get(item, {})

                skills.append({
                    "id": item,
                    "name": name.replace("-", " ").title(),
                    "keyword": item,
                    "category": category,
                    "description": desc,
                    "version": meta.get("metadata", {}).get("version", "1.0") if isinstance(meta.get("metadata"), dict) else "1.0",
                    "author": meta.get("metadata", {}).get("skill-author", "K-Dense Inc.") if isinstance(meta.get("metadata"), dict) else "K-Dense Inc.",
                    "license": meta.get("license", "MIT"),
                    "allowed_tools": meta.get("allowed-tools", "Read Write Bash"),
                    "is_curated": is_curated,
                    "icon": curated_info.get("icon", "Wand2"),
                    "badge": curated_info.get("badge", category),
                    "stars": curated_info.get("stars", 3),
                    "has_scripts": os.path.isdir(os.path.join(skill_dir, "scripts"))
                })
            except Exception as e:
                print(f"[ScientificSkills] Error loading skill '{item}': {e}")

    # Sort: curated top skills first, then alphabetical
    skills.sort(key=lambda s: (-int(s["is_curated"]), s["category"], s["name"]))
    return skills

def get_skill_content(skill_id: str) -> Optional[Dict[str, Any]]:
    """Retrieves full SKILL.md guide and files for a specific skill."""
    root_dir = get_skills_root_dir()
    if not root_dir:
        return None

    clean_id = os.path.basename(skill_id)
    skill_file = os.path.join(root_dir, clean_id, "SKILL.md")
    if not os.path.exists(skill_file):
        return None

    try:
        with open(skill_file, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        meta, body = parse_frontmatter(content)
        scripts_dir = os.path.join(root_dir, clean_id, "scripts")
        scripts = os.listdir(scripts_dir) if os.path.isdir(scripts_dir) else []

        return {
            "id": clean_id,
            "name": meta.get("name", clean_id).replace("-", " ").title(),
            "keyword": clean_id,
            "category": assign_category(clean_id),
            "metadata": meta,
            "body": body,
            "scripts": scripts,
            "full_markdown": content
        }
    except Exception as e:
        print(f"[ScientificSkills] Error reading skill content '{skill_id}': {e}")
        return None

def build_swarm_persona(skill_id: str) -> Optional[Dict[str, Any]]:
    """Constructs an OpenZess Swarm Persona from a scientific skill."""
    detail = get_skill_content(skill_id)
    if not detail:
        return None

    keyword = detail["keyword"]
    name = f"{detail['name']} (Scientist)"
    desc = detail.get("metadata", {}).get("description", "")

    # Build focused system instruction incorporating the skill's instructions
    instruction = (
        f"You are the OpenZess {name}.\n"
        f"Role & Methodology: {desc}\n\n"
        f"GUIDELINES & NON-NEGOTIABLE BOUNDARIES:\n"
        f"1. Follow rigorous scientific methodology. Verify all assertions, outputs, and citations.\n"
        f"2. Never hallucinate data, papers, or computational results. State confidence margins honestly.\n"
        f"3. Use standard Linux/Python environments and verify outputs deterministically.\n"
        f"4. Provide structured, reproducible summaries with clean markdown tables and diagrams.\n\n"
        f"SKILL REFERENCE MANUAL:\n"
        f"{detail['body'][:4000]}"
    )

    return {
        "key": keyword,
        "name": name,
        "instruction": instruction,
        "tools": {
            "run_terminal_command": True,
            "search_the_web": True,
            "read_web_page": True,
            "create_file": True,
            "read_file": True,
            "edit_code": True
        }
    }
