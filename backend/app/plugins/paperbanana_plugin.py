import os
import uuid
import json
import traceback

# Import OpenZess plugin registrar
try:
    from plugin_loader import plugin_registry
except ImportError:
    from app.plugin_loader import plugin_registry

# Configure static upload directories
UPLOADS_DIR = os.path.abspath(os.path.join(os.getcwd(), "uploads"))
DIAGRAMS_DIR = os.path.join(UPLOADS_DIR, "diagrams")
PLOTS_DIR = os.path.join(UPLOADS_DIR, "plots")

os.makedirs(DIAGRAMS_DIR, exist_ok=True)
os.makedirs(PLOTS_DIR, exist_ok=True)


# ─────────────────────────────────────────────────────────────────────────────
# 1. Methodology / Architecture Diagram Generator (PaperBanana SVG Engine)
# ─────────────────────────────────────────────────────────────────────────────

THEME_PALETTES = {
    "academic": {
        "bg": "#f8fafc",
        "card_bg": "#ffffff",
        "border": "#cbd5e1",
        "title": "#0f172a",
        "text": "#334155",
        "accent": "#2563eb",
        "categories": {
            "input": {"bg": "#eff6ff", "border": "#3b82f6", "text": "#1d4ed8"},
            "process": {"bg": "#f0fdf4", "border": "#22c55e", "text": "#15803d"},
            "agent": {"bg": "#faf5ff", "border": "#a855f7", "text": "#7e22ce"},
            "storage": {"bg": "#fffbeb", "border": "#f59e0b", "text": "#b45309"},
            "output": {"bg": "#fef2f2", "border": "#ef4444", "text": "#b91c1c"}
        }
    },
    "dark_matrix": {
        "bg": "#0b0f17",
        "card_bg": "#111827",
        "border": "#1f2937",
        "title": "#38bdf8",
        "text": "#94a3b8",
        "accent": "#00f0ff",
        "categories": {
            "input": {"bg": "#0f172a", "border": "#38bdf8", "text": "#7dd3fc"},
            "process": {"bg": "#064e3b", "border": "#10b981", "text": "#6ee7b7"},
            "agent": {"bg": "#3b0764", "border": "#c084fc", "text": "#e9d5ff"},
            "storage": {"bg": "#451a03", "border": "#f59e0b", "text": "#fde68a"},
            "output": {"bg": "#450a0a", "border": "#f87171", "text": "#fca5a5"}
        }
    },
    "vibrant": {
        "bg": "#faf5ff",
        "card_bg": "#ffffff",
        "border": "#e9d5ff",
        "title": "#4c1d95",
        "text": "#4b5563",
        "accent": "#7c3aed",
        "categories": {
            "input": {"bg": "#ede9fe", "border": "#8b5cf6", "text": "#6d28d9"},
            "process": {"bg": "#e0e7ff", "border": "#6366f1", "text": "#4338ca"},
            "agent": {"bg": "#fae8ff", "border": "#d946ef", "text": "#a21caf"},
            "storage": {"bg": "#fef3c7", "border": "#f59e0b", "text": "#b45309"},
            "output": {"bg": "#fce7f3", "border": "#ec4899", "text": "#be185d"}
        }
    },
    "deep": {
        "bg": "#0f172a",
        "card_bg": "#1e293b",
        "border": "#334155",
        "title": "#5eead4",
        "text": "#94a3b8",
        "accent": "#14b8a6",
        "categories": {
            "input": {"bg": "#134e4a", "border": "#2dd4bf", "text": "#99f6e4"},
            "process": {"bg": "#1e3a8a", "border": "#60a5fa", "text": "#bfdbfe"},
            "agent": {"bg": "#312e81", "border": "#818cf8", "text": "#c7d2fe"},
            "storage": {"bg": "#064e3b", "border": "#34d399", "text": "#a7f3d0"},
            "output": {"bg": "#7c2d12", "border": "#fb923c", "text": "#fed7aa"}
        }
    },
    "minimal": {
        "bg": "#ffffff",
        "card_bg": "#fafafa",
        "border": "#e4e4e7",
        "title": "#18181b",
        "text": "#52525b",
        "accent": "#18181b",
        "categories": {
            "input": {"bg": "#f4f4f5", "border": "#71717a", "text": "#18181b"},
            "process": {"bg": "#f4f4f5", "border": "#71717a", "text": "#18181b"},
            "agent": {"bg": "#f4f4f5", "border": "#71717a", "text": "#18181b"},
            "storage": {"bg": "#f4f4f5", "border": "#71717a", "text": "#18181b"},
            "output": {"bg": "#f4f4f5", "border": "#71717a", "text": "#18181b"}
        }
    }
}

@plugin_registry.register(
    name="generate_methodology_diagram",
    description="Generates a publication-grade scientific methodology or system architecture diagram. Automatically constructs clean vector SVG with styled nodes, category badges, and directional connecting flow arrows.",
    schema_params={
        "properties": {
            "title": {"type": "string", "description": "Title of the architecture or workflow diagram."},
            "nodes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "id": {"type": "string", "description": "Unique identifier for the node (e.g. 'input_docs')"},
                        "label": {"type": "string", "description": "Human-readable label/name of the module"},
                        "subtext": {"type": "string", "description": "Short explanation or parameters"},
                        "category": {"type": "string", "enum": ["input", "process", "agent", "storage", "output"], "description": "Semantic category"}
                    },
                    "required": ["id", "label"]
                },
                "description": "List of pipeline or system components/stages."
            },
            "edges": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "from_node": {"type": "string", "description": "Source node id"},
                        "to_node": {"type": "string", "description": "Target node id"},
                        "label": {"type": "string", "description": "Connection or data transfer label"}
                    },
                    "required": ["from_node", "to_node"]
                },
                "description": "Dataflow and sequence connections between nodes."
            },
            "theme": {
                "type": "string",
                "enum": ["academic", "dark_matrix", "vibrant", "deep", "minimal"],
                "description": "Visual theme style for the publication figure."
            }
        },
        "required": ["title", "nodes", "edges"]
    }
)
def generate_methodology_diagram(title: str, nodes: list, edges: list, theme: str = "academic") -> str:
    """
    Constructs a vector SVG methodology diagram, saves it, and returns the markdown embed link.
    """
    try:
        palette = THEME_PALETTES.get(theme, THEME_PALETTES["academic"])
        node_count = len(nodes)
        
        # Calculate visual layout (grid-based or horizontal flow)
        cols = min(4, max(2, int(node_count ** 0.5 + 0.5)))
        rows = (node_count + cols - 1) // cols
        
        card_w = 200
        card_h = 90
        gap_x = 70
        gap_y = 70
        padding_x = 50
        padding_y = 80
        
        width = padding_x * 2 + cols * card_w + (cols - 1) * gap_x
        height = padding_y * 2 + rows * card_h + (rows - 1) * gap_y
        
        # Compute positions
        node_pos = {}
        for idx, node in enumerate(nodes):
            c = idx % cols
            r = idx // cols
            x = padding_x + c * (card_w + gap_x)
            y = padding_y + r * (card_h + gap_y)
            node_pos[node["id"]] = {"x": x, "y": y, "cx": x + card_w / 2, "cy": y + card_h / 2}

        # Build SVG Elements
        svg_parts = [
            f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}" width="100%" height="auto" style="background-color: {palette["bg"]}; border-radius: 12px; font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif;">',
            '<defs>',
            '  <filter id="shadow" x="-5%" y="-5%" width="115%" height="120%">',
            '    <feDropShadow dx="0" dy="4" stdDeviation="6" flood-opacity="0.08"/>',
            '  </filter>',
            f'  <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">',
            f'    <path d="M 0 1 L 10 5 L 0 9 z" fill="{palette["accent"]}"/>',
            '  </marker>',
            '</defs>',
            # Title Header
            f'<text x="{padding_x}" y="45" font-size="18" font-weight="700" fill="{palette["title"]}">{title}</text>',
            f'<text x="{width - padding_x}" y="45" text-anchor="end" font-size="11" font-weight="500" fill="{palette["text"]}" opacity="0.7">PaperBanana Academic Visualizer</text>'
        ]

        # Draw Edges (Connector Lines)
        for edge in edges:
            src = node_pos.get(edge.get("from_node"))
            dst = node_pos.get(edge.get("to_node"))
            if src and dst:
                edge_label = edge.get("label", "")
                mid_x = (src["cx"] + dst["cx"]) / 2
                mid_y = (src["cy"] + dst["cy"]) / 2
                
                # Determine connector anchor points
                if abs(dst["cx"] - src["cx"]) >= abs(dst["cy"] - src["cy"]):
                    # Horizontal connection
                    x1 = src["x"] + card_w if dst["cx"] > src["cx"] else src["x"]
                    y1 = src["cy"]
                    x2 = dst["x"] if dst["cx"] > src["cx"] else dst["x"] + card_w
                    y2 = dst["cy"]
                else:
                    # Vertical connection
                    x1 = src["cx"]
                    y1 = src["y"] + card_h if dst["cy"] > src["cy"] else src["y"]
                    x2 = dst["cx"]
                    y2 = dst["y"] if dst["cy"] > src["cy"] else dst["y"] + card_h

                svg_parts.append(
                    f'<path d="M {x1} {y1} Q {mid_x} {mid_y} {x2} {y2}" stroke="{palette["accent"]}" stroke-width="2" fill="none" stroke-dasharray="4 2" marker-end="url(#arrow)"/>'
                )
                if edge_label:
                    svg_parts.append(
                        f'<rect x="{mid_x - 40}" y="{mid_y - 12}" width="80" height="18" rx="4" fill="{palette["bg"]}" stroke="{palette["border"]}" stroke-width="1"/>'
                    )
                    svg_parts.append(
                        f'<text x="{mid_x}" y="{mid_y}" text-anchor="middle" font-size="10" font-weight="600" fill="{palette["text"]}">{edge_label[:14]}</text>'
                    )

        # Draw Nodes (Components)
        for node in nodes:
            pos = node_pos.get(node["id"])
            if not pos:
                continue
            cat = node.get("category", "process")
            cat_style = palette["categories"].get(cat, palette["categories"]["process"])
            label = node.get("label", node["id"])
            subtext = node.get("subtext", "")

            # Card container
            svg_parts.append(
                f'<rect x="{pos["x"]}" y="{pos["y"]}" width="{card_w}" height="{card_h}" rx="8" fill="{palette["card_bg"]}" stroke="{cat_style["border"]}" stroke-width="1.5" filter="url(#shadow)"/>'
            )
            # Category Pill Badge
            svg_parts.append(
                f'<rect x="{pos["x"] + 12}" y="{pos["y"] + 12}" width="{len(cat)*8 + 14}" height="16" rx="4" fill="{cat_style["bg"]}" stroke="{cat_style["border"]}" stroke-width="0.5"/>'
            )
            svg_parts.append(
                f'<text x="{pos["x"] + 19}" y="{pos["y"] + 24}" font-size="9" font-weight="700" fill="{cat_style["text"]}">{cat.upper()}</text>'
            )
            # Label
            svg_parts.append(
                f'<text x="{pos["x"] + 12}" y="{pos["y"] + 48}" font-size="13" font-weight="600" fill="{palette["title"]}">{label[:22]}</text>'
            )
            # Subtext
            if subtext:
                svg_parts.append(
                    f'<text x="{pos["x"] + 12}" y="{pos["y"] + 68}" font-size="10" fill="{palette["text"]}">{subtext[:28]}</text>'
                )

        svg_parts.append('</svg>')
        svg_content = "\n".join(svg_parts)

        file_id = f"diagram_{uuid.uuid4().hex[:8]}.svg"
        file_path = os.path.join(DIAGRAMS_DIR, file_id)
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(svg_content)

        relative_url = f"/uploads/diagrams/{file_id}"
        return f"""### 📊 {title} (Methodology Diagram)

![{title}]({relative_url})

*Vector SVG generated successfully. Saved to `{relative_url}`.*
"""
    except Exception as e:
        traceback.print_exc()
        return f"Failed to generate methodology diagram: {e}"


# ─────────────────────────────────────────────────────────────────────────────
# 2. Publication Statistical Plot Generator (Matplotlib / Seaborn Engine)
# ─────────────────────────────────────────────────────────────────────────────

@plugin_registry.register(
    name="generate_statistical_plot",
    description="Generates publication-quality scientific & statistical plots (bar charts, line graphs, box plots, scatter plots, heatmaps). Produces high-DPI figures styled for research papers and benchmarks.",
    schema_params={
        "properties": {
            "plot_type": {
                "type": "string",
                "enum": ["bar", "line", "scatter", "box", "histogram", "heatmap"],
                "description": "Type of statistical chart."
            },
            "title": {"type": "string", "description": "Title of the research figure."},
            "x_label": {"type": "string", "description": "Label for the X-axis."},
            "y_label": {"type": "string", "description": "Label for the Y-axis."},
            "data": {
                "type": "object",
                "description": "Chart data payload. For simple bar/line: {'labels': [...], 'values': [...]}. For multi-series: {'series': [{'name': 'Model A', 'x': [...], 'y': [...]}]}. For heatmap: {'matrix': [[...]], 'x_ticks': [...], 'y_ticks': [...]}"
            },
            "palette_style": {
                "type": "string",
                "enum": ["academic_classic", "vibrant", "matrix_dark", "deep"],
                "description": "Aesthetic color theme."
            }
        },
        "required": ["plot_type", "title", "data"]
    }
)
def generate_statistical_plot(plot_type: str, title: str, data: dict, x_label: str = "", y_label: str = "", palette_style: str = "academic_classic") -> str:
    """
    Renders a high-resolution publication plot using matplotlib/seaborn.
    """
    try:
        import matplotlib
        matplotlib.use("Agg")  # Non-GUI thread-safe backend
        import matplotlib.pyplot as plt
        import seaborn as sns
        import numpy as np

        # Apply publication styling
        plt.style.use("seaborn-v0_8-whitegrid" if "seaborn-v0_8-whitegrid" in plt.style.available else "default")
        fig, ax = plt.subplots(figsize=(8, 5), dpi=300)

        palettes = {
            "academic_classic": "deep",
            "vibrant": "Set2",
            "matrix_dark": "mako",
            "deep": "crest"
        }
        color_palette = palettes.get(palette_style, "deep")

        if plot_type == "bar":
            labels = data.get("labels", [])
            values = data.get("values", [])
            colors = sns.color_palette(color_palette, len(labels))
            bars = ax.bar(labels, values, color=colors, edgecolor="black", linewidth=0.7, alpha=0.85)
            # Annotate values on top of bars
            for bar in bars:
                height = bar.get_height()
                ax.annotate(f'{height:.2f}' if isinstance(height, float) else f'{height}',
                            xy=(bar.get_x() + bar.get_width() / 2, height),
                            xytext=(0, 3), textcoords="offset points",
                            ha='center', va='bottom', fontsize=9, fontweight='bold')

        elif plot_type == "line":
            series_list = data.get("series", [])
            if series_list:
                for idx, s in enumerate(series_list):
                    ax.plot(s.get("x", []), s.get("y", []), marker="o", label=s.get("name", f"Series {idx+1}"), linewidth=2)
                ax.legend(frameon=True, facecolor="white", edgecolor="none")
            else:
                x_vals = data.get("labels", list(range(len(data.get("values", [])))))
                y_vals = data.get("values", [])
                ax.plot(x_vals, y_vals, marker="o", color="#2563eb", linewidth=2.5, label="Data")

        elif plot_type == "scatter":
            x_vals = data.get("x", [])
            y_vals = data.get("y", [])
            ax.scatter(x_vals, y_vals, color="#2563eb", alpha=0.75, edgecolors="black", s=60)

        elif plot_type == "heatmap":
            matrix = np.array(data.get("matrix", []))
            x_ticks = data.get("x_ticks", None)
            y_ticks = data.get("y_ticks", None)
            heatmap_cmap = "crest" if color_palette in ["deep", "academic_classic"] else color_palette
            sns.heatmap(matrix, annot=True, fmt=".2f", cmap=heatmap_cmap, ax=ax,
                        xticklabels=x_ticks if x_ticks else "auto",
                        yticklabels=y_ticks if y_ticks else "auto",
                        cbar_kws={'label': y_label if y_label else 'Magnitude'})

        elif plot_type == "box":
            series_data = data.get("series", [])
            labels = [s.get("name", f"Group {i}") for i, s in enumerate(series_data)]
            values = [s.get("values", []) for s in series_data]
            # matplotlib >= 3.9 renamed `labels` -> `tick_labels`; resolve at runtime.
            import inspect
            box_kw = (
                {"tick_labels": labels}
                if "tick_labels" in inspect.signature(ax.boxplot).parameters
                else {"labels": labels}
            )
            ax.boxplot(values, patch_artist=True, **box_kw)

        elif plot_type == "histogram":
            values = data.get("values", [])
            if not values and "series" in data:
                for s in data.get("series", []):
                    sns.histplot(s.get("values", []), label=s.get("name", "Series"), kde=True, ax=ax, alpha=0.6)
                ax.legend(frameon=True, facecolor="white", edgecolor="none")
            else:
                bins = data.get("bins", 20)
                sns.histplot(values, bins=bins, kde=True, ax=ax, color="#2563eb", edgecolor="black", alpha=0.7)



        ax.set_title(title, fontsize=14, fontweight="bold", pad=15)
        if x_label:
            ax.set_xlabel(x_label, fontsize=11, fontweight="medium")
        if y_label:
            ax.set_ylabel(y_label, fontsize=11, fontweight="medium")

        # Publication-grade tick formatting: clean numeric ticks on both axes.
        ax.tick_params(axis="both", which="major", labelsize=9, length=4, width=0.8)
        ax.tick_params(axis="x", rotation=0)
        try:
            ax.xaxis.set_major_formatter(plt.FuncFormatter(lambda v, _p: f"{v:g}"))
            ax.yaxis.set_major_formatter(plt.FuncFormatter(lambda v, _p: f"{v:g}"))
        except Exception:
            pass

        plt.tight_layout()

        file_id = f"plot_{uuid.uuid4().hex[:8]}.png"
        file_path = os.path.join(PLOTS_DIR, file_id)
        plt.savefig(file_path, dpi=300, bbox_inches="tight")
        plt.close(fig)

        relative_url = f"/uploads/plots/{file_id}"
        return f"""### 📈 {title}

![{title}]({relative_url})

*High-resolution 300 DPI figure saved to `{relative_url}`.*
"""
    except Exception as e:
        traceback.print_exc()
        return f"Failed to generate statistical plot: {e}"


# ─────────────────────────────────────────────────────────────────────────────
# 3. Custom Scientific Figure Script Runner
# ─────────────────────────────────────────────────────────────────────────────

@plugin_registry.register(
    name="render_custom_scientific_figure",
    description="Executes a custom Python matplotlib/seaborn visualization script and saves the resulting figure. Provide standard matplotlib code that configures `plt`.",
    schema_params={
        "properties": {
            "title": {"type": "string", "description": "Title of the scientific plot."},
            "python_code": {
                "type": "string",
                "description": "Python code using matplotlib.pyplot as plt and seaborn as sns. Do not call plt.show(); the plugin automatically handles saving."
            }
        },
        "required": ["title", "python_code"]
    }
)
def render_custom_scientific_figure(title: str, python_code: str) -> str:
    """
    Executes custom plotting code securely and returns the saved figure link.
    """
    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        import seaborn as sns
        import numpy as np

        plt.clf()
        plt.close('all')

        local_vars = {
            "plt": plt,
            "sns": sns,
            "np": np,
            "figure_title": title
        }

        # Execute the custom visualization script
        exec(python_code, {}, local_vars)

        file_id = f"custom_fig_{uuid.uuid4().hex[:8]}.png"
        file_path = os.path.join(PLOTS_DIR, file_id)
        plt.savefig(file_path, dpi=300, bbox_inches="tight")
        plt.close('all')

        relative_url = f"/uploads/plots/{file_id}"
        return f"""### 🔬 {title} (Custom Scientific Render)

![{title}]({relative_url})

*Custom publication figure rendered and saved to `{relative_url}`.*
"""
    except Exception as e:
        traceback.print_exc()
        return f"Error executing custom scientific figure script: {e}"
