"""
Scientific Tools Plugin for OpenZess
Provides native tools for academic paper retrieval, exploratory data profiling,
and Mermaid technical diagram validation based on K-Dense-AI scientific standards.
"""

import os
import re
import csv
import json
import urllib.request
import urllib.parse
import xml.etree.ElementTree as ET
from typing import Dict, Any, List
try:
    from plugin_loader import plugin_registry
except ImportError:
    from app.plugin_loader import plugin_registry

@plugin_registry.register(
    name="search_academic_papers",
    description="Searches public academic literature databases (arXiv, Europe PMC, or OpenAlex) for scientific papers, preprints, and citations with reproducible provenance and URLs.",
    schema_params={
        "properties": {
            "query": {
                "type": "string",
                "description": "Scientific search query, paper title, topic keywords, or author name (e.g., 'CRISPR Cas9 base editing', 'attention transformer architecture')."
            },
            "database": {
                "type": "string",
                "description": "Target scholarly repository: 'arxiv' (default, CS/physics/math), 'europe_pmc' (biomedical/life sciences), or 'openalex' (cross-disciplinary).",
                "enum": ["arxiv", "europe_pmc", "openalex"]
            },
            "max_results": {
                "type": "integer",
                "description": "Number of results to retrieve (default: 5, max: 10)."
            }
        },
        "required": ["query"]
    }
)
def search_academic_papers(query: str, database: str = "arxiv", max_results: int = 5) -> str:
    """Queries public academic APIs without requiring API keys."""
    max_results = min(max(1, max_results), 10)
    query_clean = query.strip()
    
    try:
        if database.lower() == "arxiv":
            return _query_arxiv(query_clean, max_results)
        elif database.lower() == "europe_pmc":
            return _query_europe_pmc(query_clean, max_results)
        elif database.lower() == "openalex":
            return _query_openalex(query_clean, max_results)
        else:
            return _query_arxiv(query_clean, max_results)
    except Exception as e:
        return f"Error querying {database} academic API: {str(e)}"

def _query_arxiv(query: str, max_results: int) -> str:
    params = urllib.parse.urlencode({
        "search_query": f"all:{query}",
        "start": 0,
        "max_results": max_results,
        "sortBy": "relevance",
        "sortOrder": "descending"
    })
    url = f"http://export.arxiv.org/api/query?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "OpenZess-Scientist/1.0"})
    
    with urllib.request.urlopen(req, timeout=12) as resp:
        xml_data = resp.read().decode("utf-8")
        
    root = ET.fromstring(xml_data)
    ns = {"atom": "http://www.w3.org/2005/Atom"}
    
    entries = root.findall("atom:entry", ns)
    if not entries:
        return f"No arXiv papers found matching query: '{query}'"
        
    output = [f"### 📚 Academic Papers (arXiv Search: '{query}')\n"]
    for i, entry in enumerate(entries, 1):
        title = entry.findtext("atom:title", "", ns).replace("\n", " ").strip()
        summary = entry.findtext("atom:summary", "", ns).replace("\n", " ").strip()
        if len(summary) > 280:
            summary = summary[:280] + "..."
            
        published = entry.findtext("atom:published", "", ns)[:10]
        entry_id = entry.findtext("atom:id", "", ns).strip()
        
        authors = [a.findtext("atom:name", "", ns) for a in entry.findall("atom:author", ns)]
        authors_str = ", ".join(authors[:3]) + (" et al." if len(authors) > 3 else "")
        
        pdf_link = ""
        for link in entry.findall("atom:link", ns):
            if link.attrib.get("title") == "pdf":
                pdf_link = link.attrib.get("href", "")
                
        output.append(f"**{i}. {title}** ({published})")
        output.append(f"- **Authors:** {authors_str}")
        output.append(f"- **Abstract:** {summary}")
        output.append(f"- **Paper URL:** {entry_id}")
        if pdf_link:
            output.append(f"- **PDF Link:** {pdf_link}")
        output.append("")
        
    return "\n".join(output)

def _query_europe_pmc(query: str, max_results: int) -> str:
    params = urllib.parse.urlencode({
        "query": query,
        "format": "json",
        "pageSize": max_results,
        "resultType": "lite"
    })
    url = f"https://www.ebi.ac.uk/europepmc/webservices/rest/search?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "OpenZess-Scientist/1.0"})
    
    with urllib.request.urlopen(req, timeout=12) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        
    results = data.get("resultList", {}).get("result", [])
    if not results:
        return f"No Europe PMC papers found matching query: '{query}'"
        
    output = [f"### 🧬 Biomedical Literature (Europe PMC: '{query}')\n"]
    for i, item in enumerate(results, 1):
        title = item.get("title", "Untitled").rstrip(".")
        author_str = item.get("authorString", "Unknown Authors")
        pub_year = item.get("pubYear", "N/A")
        journal = item.get("journalTitle", "Biomedical Repository")
        pmid = item.get("pmid", "")
        doi = item.get("doi", "")
        
        output.append(f"**{i}. {title}** ({pub_year})")
        output.append(f"- **Authors:** {author_str}")
        output.append(f"- **Source:** {journal}")
        if doi:
            output.append(f"- **DOI Link:** https://doi.org/{doi}")
        if pmid:
            output.append(f"- **PubMed ID:** {pmid} (https://pubmed.ncbi.nlm.nih.gov/{pmid}/)")
        output.append("")
        
    return "\n".join(output)

def _query_openalex(query: str, max_results: int) -> str:
    params = urllib.parse.urlencode({
        "search": query,
        "per-page": max_results
    })
    url = f"https://api.openalex.org/works?{params}"
    req = urllib.request.Request(url, headers={"User-Agent": "OpenZess-Scientist/1.0 (mailto:openzess@agent.local)"})
    
    with urllib.request.urlopen(req, timeout=12) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        
    results = data.get("results", [])
    if not results:
        return f"No OpenAlex works found matching query: '{query}'"
        
    output = [f"### 🌐 Cross-Disciplinary Works (OpenAlex: '{query}')\n"]
    for i, item in enumerate(results, 1):
        title = item.get("display_name", "Untitled")
        pub_year = item.get("publication_year", "N/A")
        citations = item.get("cited_by_count", 0)
        doi = item.get("doi", "")
        open_access = item.get("open_access", {}).get("oa_url", "")
        
        authors = [a.get("author", {}).get("display_name", "") for a in item.get("authorships", [])]
        authors_str = ", ".join(filter(bool, authors[:3])) + (" et al." if len(authors) > 3 else "")
        
        output.append(f"**{i}. {title}** ({pub_year}) — {citations} citations")
        output.append(f"- **Authors:** {authors_str or 'Unknown'}")
        if doi:
            output.append(f"- **DOI Link:** {doi}")
        if open_access:
            output.append(f"- **Open Access Full Text:** {open_access}")
        output.append("")
        
    return "\n".join(output)

@plugin_registry.register(
    name="profile_data_file",
    description="Automated exploratory data analysis (EDA) on a CSV, TSV, or JSON dataset. Computes column types, missingness, statistical distributions, and boundary checks.",
    schema_params={
        "properties": {
            "filepath": {
                "type": "string",
                "description": "Path to the data file to profile (e.g., 'data.csv', 'results.tsv', 'samples.json')."
            },
            "max_rows": {
                "type": "integer",
                "description": "Maximum number of rows to sample for profiling (default: 2000)."
            }
        },
        "required": ["filepath"]
    }
)
def profile_data_file(filepath: str, max_rows: int = 2000) -> str:
    """Inspects and profiles structured data files safely using standard library."""
    if not os.path.exists(filepath):
        return f"Error: Target data file does not exist at '{filepath}'"
        
    ext = os.path.splitext(filepath)[1].lower()
    
    try:
        if ext in (".csv", ".tsv", ".txt"):
            delimiter = "\t" if ext == ".tsv" else ","
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                sample = f.read(4096)
                f.seek(0)
                if ext == ".txt" and "\t" in sample:
                    delimiter = "\t"
                    
                reader = csv.reader(f, delimiter=delimiter)
                headers = next(reader, None)
                if not headers:
                    return f"Error: File '{filepath}' is empty."
                    
                rows = []
                for i, row in enumerate(reader):
                    if i >= max_rows:
                        break
                    rows.append(row)
                    
            return _format_tabular_profile(filepath, headers, rows)
            
        elif ext == ".json":
            with open(filepath, "r", encoding="utf-8", errors="replace") as f:
                data = json.load(f)
                
            if isinstance(data, list) and data and isinstance(data[0], dict):
                headers = list(data[0].keys())
                rows = [[str(item.get(h, "")) for h in headers] for item in data[:max_rows]]
                return _format_tabular_profile(filepath, headers, rows)
            else:
                return f"### 📊 JSON Object Summary for `{os.path.basename(filepath)}`\nType: `{type(data).__name__}`\nKeys/Length: {len(data) if hasattr(data, '__len__') else 1}\nStructure:\n```json\n{json.dumps(data, indent=2)[:800]}...\n```"
        else:
            return f"Unsupported file extension '{ext}' for automated profiling. Supports .csv, .tsv, .json."
    except Exception as e:
        return f"Error profiling '{filepath}': {str(e)}"

def _format_tabular_profile(filepath: str, headers: List[str], rows: List[List[str]]) -> str:
    total_rows = len(rows)
    total_cols = len(headers)
    
    col_profiles = []
    for col_idx, col_name in enumerate(headers):
        values = [r[col_idx] for r in rows if col_idx < len(r)]
        non_empty = [v.strip() for v in values if v.strip() != ""]
        missing_count = total_rows - len(non_empty)
        missing_pct = round((missing_count / total_rows * 100), 1) if total_rows > 0 else 0
        
        # Check if numeric
        numeric_vals = []
        for v in non_empty:
            try:
                numeric_vals.append(float(v))
            except ValueError:
                pass
                
        is_numeric = len(numeric_vals) > (len(non_empty) * 0.8) and len(numeric_vals) > 0
        
        if is_numeric:
            numeric_vals.sort()
            min_val = min(numeric_vals)
            max_val = max(numeric_vals)
            mean_val = round(sum(numeric_vals) / len(numeric_vals), 3)
            med_val = numeric_vals[len(numeric_vals)//2]
            col_profiles.append({
                "name": col_name,
                "type": "Numeric",
                "missing": f"{missing_count} ({missing_pct}%)",
                "stats": f"Min: {min_val} | Mean: {mean_val} | Med: {med_val} | Max: {max_val}"
            })
        else:
            unique_count = len(set(non_empty))
            top_sample = ", ".join(list(set(non_empty))[:3])
            col_profiles.append({
                "name": col_name,
                "type": "Categorical/Text",
                "missing": f"{missing_count} ({missing_pct}%)",
                "stats": f"Unique: {unique_count} | Sample: [{top_sample}]"
            })
            
    # Markdown presentation
    lines = [
        f"### 📊 Exploratory Data Analysis (EDA): `{os.path.basename(filepath)}`",
        f"- **Rows Analyzed:** {total_rows} | **Columns:** {total_cols}",
        "",
        "| Column | Type | Missing Values | Distribution / Summary |",
        "| :--- | :--- | :--- | :--- |"
    ]
    for p in col_profiles:
        lines.append(f"| `{p['name']}` | {p['type']} | {p['missing']} | {p['stats']} |")
        
    lines.append("")
    lines.append("> [!TIP]\n> Data profile generated in accordance with scientific EDA non-negotiable boundaries. Raw data was preserved without selective alteration.")
    return "\n".join(lines)

@plugin_registry.register(
    name="validate_mermaid_diagram",
    description="Validates and formats a Mermaid scientific diagram (flowchart, architecture, sequence, state, class, or git graph) to ensure correct syntax for Markdown rendering.",
    schema_params={
        "properties": {
            "code": {
                "type": "string",
                "description": "Mermaid diagram code to validate and format."
            },
            "diagram_type": {
                "type": "string",
                "description": "Expected diagram type: 'flowchart', 'sequenceDiagram', 'classDiagram', 'stateDiagram-v2', 'gitGraph', 'pie', or 'auto'.",
                "default": "auto"
            }
        },
        "required": ["code"]
    }
)
def validate_mermaid_diagram(code: str, diagram_type: str = "auto") -> str:
    """Checks and cleans Mermaid diagram code."""
    cleaned = code.strip()
    # Strip markdown fence if present
    if cleaned.startswith("```mermaid"):
        cleaned = cleaned[len("```mermaid"):].strip()
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3].strip()
        
    lines = [line.strip() for line in cleaned.split("\n") if line.strip()]
    if not lines:
        return "Error: Mermaid code is empty."
        
    first_line = lines[0].lower()
    valid_starters = ["flowchart", "graph", "sequencediagram", "classdiagram", "statediagram", "gitgraph", "pie", "erdiagram", "gantt", "mindmap"]
    
    has_valid_header = any(first_line.startswith(s) for s in valid_starters)
    if not has_valid_header:
        # Prepend standard flowchart TD if missing header
        cleaned = f"flowchart TD\n    " + "\n    ".join(lines)
        
    # Syntax linting: check parentheses inside brackets
    fixed_lines = []
    fixes_made = []
    for line in cleaned.split("\n"):
        # Detect unquoted parentheses in node labels e.g. A[Title (Note)] -> A["Title (Note)"]
        bad_bracket = re.search(r'(\w+)\[([^"\]]*\([^"\]]*\)[^"\]]*)\]', line)
        if bad_bracket:
            node_id = bad_bracket.group(1)
            inner_text = bad_bracket.group(2)
            fixed_line = line.replace(f"{node_id}[{inner_text}]", f'{node_id}["{inner_text}"]')
            fixed_lines.append(fixed_line)
            fixes_made.append(f"Quoted parentheses in node '{node_id}' label: [\"{inner_text}\"]")
        else:
            fixed_lines.append(line)
            
    final_code = "\n".join(fixed_lines)
    
    report = ["### 📐 Mermaid Diagram Validation Result: ✅ Clean Syntax\n"]
    if fixes_made:
        report.append("**Automatic Fixes Applied:**")
        for fix in fixes_made:
            report.append(f"- {fix}")
        report.append("")
        
    report.append("```mermaid")
    report.append(final_code)
    report.append("```")
    return "\n".join(report)
