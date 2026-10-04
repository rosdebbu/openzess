"""Generate frontend/public/llms-full.txt: a concatenated, LLM-digestible
markdown digest of the Openzess foundational docs (README + VitePress docs).

Usage:
    python scripts/generate_llms_full.py
"""

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "frontend" / "public" / "llms-full.txt"

SECTIONS = [
    ("Project README", [ROOT / "README.md"]),
    (
        "Guide",
        [
            ROOT / "openzess-docs" / "docs" / "guide" / "introduction.md",
            ROOT / "openzess-docs" / "docs" / "guide" / "getting-started.md",
            ROOT / "openzess-docs" / "docs" / "guide" / "configuration.md",
            ROOT / "openzess-docs" / "docs" / "guide" / "architecture.md",
            ROOT / "openzess-docs" / "docs" / "guide" / "hybrid-engine.md",
            ROOT / "openzess-docs" / "docs" / "guide" / "database.md",
            ROOT / "openzess-docs" / "docs" / "guide" / "security.md",
        ],
    ),
    (
        "Features",
        [
            ROOT / "openzess-docs" / "docs" / "features" / "terminal-cli.md",
            ROOT / "openzess-docs" / "docs" / "features" / "habit-learner.md",
            ROOT / "openzess-docs" / "docs" / "features" / "agent-core.md",
            ROOT / "openzess-docs" / "docs" / "features" / "tools.md",
            ROOT / "openzess-docs" / "docs" / "features" / "memory-vault.md",
            ROOT / "openzess-docs" / "docs" / "features" / "mcp-plugins.md",
            ROOT / "openzess-docs" / "docs" / "features" / "custom-plugins.md",
            ROOT / "openzess-docs" / "docs" / "features" / "swarm.md",
            ROOT / "openzess-docs" / "docs" / "features" / "tavern.md",
            ROOT / "openzess-docs" / "docs" / "features" / "matrix-viewer.md",
            ROOT / "openzess-docs" / "docs" / "features" / "channels.md",
            ROOT / "openzess-docs" / "docs" / "features" / "automation.md",
            ROOT / "openzess-docs" / "docs" / "features" / "paperbanana.md",
        ],
    ),
    (
        "API Reference",
        [
            ROOT / "openzess-docs" / "docs" / "api" / "rest-api.md",
            ROOT / "openzess-docs" / "docs" / "api" / "openai-compat.md",
            ROOT / "openzess-docs" / "docs" / "api" / "websocket.md",
        ],
    ),
    (
        "Meta",
        [
            ROOT / "CHANGELOG.md",
            ROOT / "CONTRIBUTING.md",
            ROOT / "SECURITY.md",
        ],
    ),
]

HEADER = """# Openzess — Complete Documentation Digest (llms-full.txt)

> Openzess is an open-source, provider-agnostic autonomous AI workspace and
> cyberpunk terminal agent. This file concatenates every foundational doc into
> a single markdown document for zero-shot LLM ingestion.
> Site: https://openzess.vercel.app · Docs: https://openzess-docs.vercel.app ·
> Repo: https://github.com/rosdebbu/openzess (MIT License)

---
"""


def main() -> None:
    parts = [HEADER]
    included = 0
    for section_name, files in SECTIONS:
        parts.append(f"\n# {section_name}\n")
        for path in files:
            if not path.exists():
                print(f"skip (missing): {path}")
                continue
            body = path.read_text(encoding="utf-8", errors="replace").strip()
            rel = path.relative_to(ROOT).as_posix()
            parts.append(f"\n---\n\n<!-- source: {rel} -->\n\n{body}\n")
            included += 1
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text("".join(parts), encoding="utf-8")
    size_kb = OUT.stat().st_size // 1024
    print(f"wrote {OUT} ({included} docs, {size_kb} KB)")


if __name__ == "__main__":
    main()
