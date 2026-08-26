"""
Unit tests for backend/app/plugins/paperbanana_plugin.py

Covers the three plugin tools registered on ``plugin_registry``:

* ``generate_methodology_diagram``    - PaperBanana SVG engine
* ``generate_statistical_plot``       - matplotlib/seaborn publication plots
* ``render_custom_scientific_figure`` - arbitrary user plotting scripts

The plugin's upload directories are redirected into a temporary folder for
every test, so no artifacts are written to the repository's real
``uploads/`` directories.

Run from the repository root::

    venv\\Scripts\\python.exe -m pytest backend/tests -v
"""

import os
import re

import matplotlib

matplotlib.use("Agg")  # headless backend for CI-safe rendering

import matplotlib.pyplot as plt
import pytest

from app.plugins import paperbanana_plugin as pb


# ─────────────────────────────────────────────────────────────────────────────
# Fixtures
# ─────────────────────────────────────────────────────────────────────────────

@pytest.fixture(autouse=True)
def _close_matplotlib_figures():
    """Prevent figure leaks between tests."""
    yield
    plt.close("all")


@pytest.fixture
def dirs(tmp_path, monkeypatch):
    """Redirect the plugin's static upload directories into tmp_path.

    The plugin reads ``DIAGRAMS_DIR`` / ``PLOTS_DIR`` as module globals at
    call time, so patching them fully isolates filesystem side effects.
    """
    diagrams = tmp_path / "diagrams"
    plots = tmp_path / "plots"
    diagrams.mkdir()
    plots.mkdir()
    monkeypatch.setattr(pb, "DIAGRAMS_DIR", str(diagrams))
    monkeypatch.setattr(pb, "PLOTS_DIR", str(plots))
    return {"diagrams": str(diagrams), "plots": str(plots)}


@pytest.fixture
def sample_nodes():
    """A 2x2 RAG-style pipeline laid out deterministically by the plugin.

    Grid math for 4 nodes: cols=2, rows=2, card=200x90, gaps=70, pad=50x80
    => viewBox "0 0 570 410"; positions:
        docs      -> (50, 80)     retriever -> (320, 80)
        llm       -> (50, 240)    store     -> (320, 240)
    """
    return [
        {"id": "docs", "label": "Input Documents", "subtext": "PDF corpus", "category": "input"},
        {"id": "retriever", "label": "Retriever", "category": "process"},
        {"id": "llm", "label": "LLM Agent", "subtext": "GPT backbone", "category": "agent"},
        {"id": "store", "label": "Vector Store", "category": "storage"},
    ]


@pytest.fixture
def sample_edges():
    return [
        {"from_node": "docs", "to_node": "retriever", "label": "chunks"},
        {"from_node": "retriever", "to_node": "llm"},
        {"from_node": "store", "to_node": "llm", "label": "context injection long label"},
    ]


# ─────────────────────────────────────────────────────────────────────────────
# 1. generate_methodology_diagram
# ─────────────────────────────────────────────────────────────────────────────

def _read_generated_svg(markdown_output: str, diagrams_dir: str) -> str:
    links = [ln for ln in markdown_output.splitlines() if "](/uploads/diagrams/" in ln]
    assert links, f"No diagram link in output:\n{markdown_output}"
    filename = links[0].split("](/uploads/diagrams/")[1].split(")")[0]
    path = os.path.join(diagrams_dir, filename)
    assert os.path.isfile(path)
    with open(path, encoding="utf-8") as f:
        return f.read()


class TestGenerateMethodologyDiagram:
    def test_success_returns_markdown_and_writes_svg(self, dirs, sample_nodes, sample_edges):
        result = pb.generate_methodology_diagram(
            title="RAG Pipeline", nodes=sample_nodes, edges=sample_edges
        )

        assert "### 📊 RAG Pipeline (Methodology Diagram)" in result
        assert "](/uploads/diagrams/" in result
        assert "Vector SVG generated successfully" in result

        svg = _read_generated_svg(result, dirs["diagrams"])
        assert '<svg xmlns="http://www.w3.org/2000/svg"' in svg
        assert svg.rstrip().endswith("</svg>")
        assert ">RAG Pipeline</text>" in svg
        assert "PaperBanana Academic Visualizer" in svg
        assert 'marker-end="url(#arrow)"' in svg
        # Every node should be rendered as a card rect
        assert svg.count("<rect ") >= len(sample_nodes)

    def test_grid_layout_viewbox_math(self, dirs, sample_nodes, sample_edges):
        result = pb.generate_methodology_diagram(
            title="Layout", nodes=sample_nodes, edges=sample_edges
        )
        svg = _read_generated_svg(result, dirs["diagrams"])
        # 4 nodes -> cols=2, rows=2 -> width=2*50+2*200+1*70=570, height=2*80+2*90+1*70=410
        assert 'viewBox="0 0 570 410"' in svg

    def test_layout_wraps_after_four_columns(self, dirs):
        nodes = [{"id": f"n{i}", "label": f"N{i}"} for i in range(16)]
        result = pb.generate_methodology_diagram(title="Wide", nodes=nodes, edges=[])
        svg = _read_generated_svg(result, dirs["diagrams"])
        # 16 nodes -> cols=4, rows=4 -> width=100+800+210=1110, height=160+360+210=730
        assert 'viewBox="0 0 1110 730"' in svg

    def test_horizontal_edge_connector_geometry(self, dirs):
        nodes = [
            {"id": "docs", "label": "Docs"},
            {"id": "retriever", "label": "Retriever"},
        ]
        result = pb.generate_methodology_diagram(
            title="H", nodes=nodes,
            edges=[{"from_node": "docs", "to_node": "retriever"}],
        )
        svg = _read_generated_svg(result, dirs["diagrams"])
        # docs card right edge (250, 125.0) -> retriever card left edge (320, 125.0)
        assert '<path d="M 250 125.0 Q 285.0 125.0 320 125.0"' in svg

    def test_vertical_edge_connector_geometry(self, dirs):
        nodes = [
            {"id": "top", "label": "Top"},
            {"id": "other", "label": "Other"},
            {"id": "bottom", "label": "Bottom"},
        ]
        result = pb.generate_methodology_diagram(
            title="V", nodes=nodes,
            edges=[{"from_node": "top", "to_node": "bottom"}],
        )
        svg = _read_generated_svg(result, dirs["diagrams"])
        # top (50, 80) -> bottom (50, 240)
        assert '<path d="M 150.0 170 Q 150.0 205.0 150.0 240"' in svg

    def test_edge_label_rendered_and_truncated_to_14_chars(self, dirs, sample_nodes, sample_edges):
        result = pb.generate_methodology_diagram(
            title="T", nodes=sample_nodes, edges=sample_edges
        )
        svg = _read_generated_svg(result, dirs["diagrams"])
        assert ">chunks</text>" in svg
        assert ">context inject</text>" in svg  # "context injection long label"[:14]


    def test_unlabeled_edge_has_no_extra_label_elements(self, dirs):
        nodes = [{"id": "a", "label": "A"}, {"id": "b", "label": "B"}]
        result = pb.generate_methodology_diagram(
            title="NoLabel", nodes=nodes, edges=[{"from_node": "a", "to_node": "b"}]
        )
        svg = _read_generated_svg(result, dirs["diagrams"])
        # 1 marker path in <defs> + 1 connector path = 2 path elements
        assert svg.count("<path ") == 2
        assert svg.count("<rect ") == 4  # 2 cards + 2 category badges (no label pill)

    def test_dangling_edges_are_skipped_without_failing(self, dirs, sample_nodes):
        result = pb.generate_methodology_diagram(
            title="Dangling",
            nodes=sample_nodes,
            edges=[
                {"from_node": "ghost", "to_node": "docs"},    # unknown source
                {"from_node": "docs", "to_node": "phantom"},  # unknown target
            ],
        )
        assert "Vector SVG generated successfully" in result
        svg = _read_generated_svg(result, dirs["diagrams"])
        # Only the marker path in <defs> exists
        assert svg.count("<path ") == 1

    def test_label_and_subtext_truncation(self, dirs):
        nodes = [{
            "id": "big",
            "label": "An Extremely Long Module Label Exceeding Limits",
            "subtext": "A very long explanatory subtitle that goes past the cap",
        }]
        result = pb.generate_methodology_diagram(title="Truncate", nodes=nodes, edges=[])
        svg = _read_generated_svg(result, dirs["diagrams"])
        assert ">An Extremely Long Modu</text>" in svg       # label[:22]
        assert ">A very long explanatory subt</text>" in svg  # subtext[:28]


    def test_no_subtext_renders_no_subtext_element(self, dirs):
        nodes = [{"id": "plain", "label": "Plain Node"}]
        result = pb.generate_methodology_diagram(title="Plain", nodes=nodes, edges=[])
        svg = _read_generated_svg(result, dirs["diagrams"])
        # Only title, watermark, category badge and label texts exist
        assert svg.count("<text ") == 4

    def test_category_styling_per_theme(self, dirs, sample_nodes):
        result = pb.generate_methodology_diagram(
            title="Styled", nodes=sample_nodes, edges=[], theme="academic"
        )
        svg = _read_generated_svg(result, dirs["diagrams"])
        academic = pb.THEME_PALETTES["academic"]
        for cat in ("input", "process", "agent", "storage"):
            border = academic["categories"][cat]["border"]
            assert f'stroke="{border}"' in svg, f"missing {cat} border {border}"

    def test_unknown_category_defaults_to_process_styling(self, dirs):
        nodes = [{"id": "weird", "label": "Weird", "category": "quantum"}]
        result = pb.generate_methodology_diagram(title="Weird", nodes=nodes, edges=[])
        svg = _read_generated_svg(result, dirs["diagrams"])
        process_border = pb.THEME_PALETTES["academic"]["categories"]["process"]["border"]
        assert f'stroke="{process_border}"' in svg
        assert ">QUANTUM</text>" in svg  # badge still shows the raw category uppercased

    def test_unknown_theme_falls_back_to_academic_palette(self, dirs, sample_nodes):
        result = pb.generate_methodology_diagram(
            title="Fallback", nodes=sample_nodes, edges=[], theme="neon_party"
        )
        svg = _read_generated_svg(result, dirs["diagrams"])
        assert pb.THEME_PALETTES["academic"]["bg"] in svg

    def test_dark_matrix_theme_applied(self, dirs):
        nodes = [{"id": "core", "label": "Core"}]
        result = pb.generate_methodology_diagram(
            title="Matrix", nodes=nodes, edges=[], theme="dark_matrix"
        )
        svg = _read_generated_svg(result, dirs["diagrams"])
        palette = pb.THEME_PALETTES["dark_matrix"]
        assert f'background-color: {palette["bg"]}' in svg

    def test_exception_is_caught_and_reported(self, dirs):
        result = pb.generate_methodology_diagram(title="Boom", nodes=None, edges=[])
        assert result.startswith("Failed to generate methodology diagram:")
        # Nothing should have been written to disk
        assert os.listdir(dirs["diagrams"]) == []

# ─────────────────────────────────────────────────────────────────────────────
# 2. generate_statistical_plot
# ─────────────────────────────────────────────────────────────────────────────

def _assert_plot_saved(markdown_output: str, plots_dir: str, expected_title: str) -> str:
    assert markdown_output.startswith(f"### 📈 {expected_title}")
    assert "High-resolution 300 DPI figure saved to" in markdown_output
    link_lines = [ln for ln in markdown_output.splitlines() if "](/uploads/plots/" in ln]
    assert link_lines, f"No plot link in output:\n{markdown_output}"
    filename = link_lines[0].split("](/uploads/plots/")[1].split(")")[0]
    assert filename.startswith("plot_") and filename.endswith(".png")
    path = os.path.join(plots_dir, filename)
    assert os.path.isfile(path)
    with open(path, "rb") as f:
        header = f.read(8)
    assert header.startswith(b"\x89PNG"), "saved artifact is not a PNG file"
    return path


class TestGenerateStatisticalPlot:
    def test_bar_plot_with_labels_and_axis_titles(self, dirs):
        result = pb.generate_statistical_plot(
            plot_type="bar",
            title="Benchmark",
            data={"labels": ["Model A", "Model B"], "values": [81.4, 77.9]},
            x_label="Models",
            y_label="Accuracy (%)",
        )
        _assert_plot_saved(result, dirs["plots"], "Benchmark")

    def test_line_plot_multi_series(self, dirs):
        result = pb.generate_statistical_plot(
            plot_type="line",
            title="Training Curves",
            data={
                "series": [
                    {"name": "Ours", "x": [0, 1, 2], "y": [1, 4, 9]},
                    {"name": "Baseline", "x": [0, 1, 2], "y": [1, 2, 3]},
                ]
            },
        )
        _assert_plot_saved(result, dirs["plots"], "Training Curves")

    def test_line_plot_single_series_fallback(self, dirs):
        result = pb.generate_statistical_plot(
            plot_type="line",
            title="Simple Line",
            data={"labels": ["a", "b", "c"], "values": [3, 1, 4]},
        )
        _assert_plot_saved(result, dirs["plots"], "Simple Line")

    def test_scatter_plot(self, dirs):
        result = pb.generate_statistical_plot(
            plot_type="scatter",
            title="Correlation",
            data={"x": [1, 2, 3, 4], "y": [2.1, 3.9, 6.2, 8.1]},
        )
        _assert_plot_saved(result, dirs["plots"], "Correlation")

    def test_heatmap_with_tick_labels(self, dirs):
        result = pb.generate_statistical_plot(
            plot_type="heatmap",
            title="Attention Map",
            data={
                "matrix": [[0.1, 0.7], [0.9, 0.2]],
                "x_ticks": ["Tok A", "Tok B"],
                "y_ticks": ["Tok A", "Tok B"],
            },
            y_label="Query",
        )
        _assert_plot_saved(result, dirs["plots"], "Attention Map")

    @pytest.mark.parametrize(
        "style",
        ["academic_classic", "vibrant", "matrix_dark", "deep", "unknown_style"],
    )
    def test_heatmap_resolves_all_palette_styles(self, dirs, style):
        # The plugin must translate seaborn palette names into valid
        # matplotlib colormaps before calling sns.heatmap().
        result = pb.generate_statistical_plot(
            plot_type="heatmap",
            title=f"Heat {style}",
            data={"matrix": [[0.1, 0.7], [0.9, 0.2]]},
            palette_style=style,
        )
        _assert_plot_saved(result, dirs["plots"], f"Heat {style}")

    def test_box_plot_from_series(self, dirs):
        result = pb.generate_statistical_plot(
            plot_type="box",
            title="Score Distributions",
            data={
                "series": [
                    {"name": "Group A", "values": [1, 2, 2, 3, 3, 3, 4]},
                    {"name": "Group B", "values": [2, 2, 3, 4, 4, 5]},
                ]
            },
        )
        _assert_plot_saved(result, dirs["plots"], "Score Distributions")

    def test_box_plot_group_labels_default_when_names_missing(self, dirs):
        result = pb.generate_statistical_plot(
            plot_type="box",
            title="Anonymous Groups",
            data={"series": [{"values": [1, 2, 3]}, {"values": [2, 3, 4]}]},
        )
        _assert_plot_saved(result, dirs["plots"], "Anonymous Groups")

    def test_unimplemented_plot_type_still_saves_a_figure(self, dirs):
        # "histogram" is advertised in the schema enum but has no drawing
        # branch yet; today the plugin renders an empty styled figure rather
        # than failing. This test pins that behaviour.
        result = pb.generate_statistical_plot(
            plot_type="histogram", title="Hist", data={"values": [1, 2, 3]}
        )
        _assert_plot_saved(result, dirs["plots"], "Hist")

    def test_invalid_data_payload_reports_failure(self, dirs):
        result = pb.generate_statistical_plot(plot_type="bar", title="Bad", data=None)
        assert result.startswith("Failed to generate statistical plot:")
        assert os.listdir(dirs["plots"]) == []

    @pytest.mark.parametrize(
        "style",
        ["academic_classic", "vibrant", "matrix_dark", "deep", "unknown_style"],
    )
    def test_all_palette_styles_resolve(self, dirs, style):
        result = pb.generate_statistical_plot(
            plot_type="bar",
            title=f"Style {style}",
            data={"labels": ["x"], "values": [1]},
            palette_style=style,
        )
        _assert_plot_saved(result, dirs["plots"], f"Style {style}")

# ─────────────────────────────────────────────────────────────────────────────
# 3. render_custom_scientific_figure
# ─────────────────────────────────────────────────────────────────────────────

class TestRenderCustomScientificFigure:
    def test_successful_execution_saves_png(self, dirs):
        result = pb.render_custom_scientific_figure(
            title="Custom Curve",
            python_code=(
                "xs = np.linspace(0, 6, 50)\n"
                "plt.plot(xs, np.sin(xs))\n"
                "plt.title(figure_title)\n"
            ),
        )
        assert result.startswith("### 🔬 Custom Curve (Custom Scientific Render)")
        assert "Custom publication figure rendered and saved to" in result

        link_lines = [ln for ln in result.splitlines() if "](/uploads/plots/" in ln]
        assert link_lines
        filename = link_lines[0].split("](/uploads/plots/")[1].split(")")[0]
        assert filename.startswith("custom_fig_") and filename.endswith(".png")
        path = os.path.join(dirs["plots"], filename)
        assert os.path.isfile(path)
        with open(path, "rb") as f:
            assert f.read(8).startswith(b"\x89PNG")

    def test_seaborn_namespace_is_available(self, dirs):
        result = pb.render_custom_scientific_figure(
            title="sns Check",
            python_code="sns.set_theme(); plt.plot([1, 2], [3, 4])",
        )
        assert "Custom Scientific Render" in result

    def test_unique_filenames_across_calls(self, dirs):
        first = pb.render_custom_scientific_figure(title="One", python_code="plt.plot([1])")
        second = pb.render_custom_scientific_figure(title="Two", python_code="plt.plot([2])")
        name_1 = first.split("](/uploads/plots/")[1].split(")")[0]
        name_2 = second.split("](/uploads/plots/")[1].split(")")[0]
        assert name_1 != name_2
        assert sorted(os.listdir(dirs["plots"])) == sorted([name_1, name_2])

    def test_syntax_error_is_caught(self, dirs):
        result = pb.render_custom_scientific_figure(
            title="Broken", python_code="this is not valid python !!!"
        )
        assert result.startswith("Error executing custom scientific figure script:")
        assert os.listdir(dirs["plots"]) == []

    def test_runtime_error_is_caught(self, dirs):
        result = pb.render_custom_scientific_figure(
            title="Runtime Boom", python_code="undefined_variable_name"
        )
        assert result.startswith("Error executing custom scientific figure script:")
        assert os.listdir(dirs["plots"]) == []


# ─────────────────────────────────────────────────────────────────────────────
# 4. Plugin registry integration
# ─────────────────────────────────────────────────────────────────────────────

class TestPluginRegistry:
    def test_all_three_tools_are_registered(self):
        for name in (
            "generate_methodology_diagram",
            "generate_statistical_plot",
            "render_custom_scientific_figure",
        ):
            assert name in pb.plugin_registry.funcs

    def test_registered_funcs_point_at_the_decorated_functions(self):
        registry = pb.plugin_registry.funcs
        assert registry["generate_methodology_diagram"] is pb.generate_methodology_diagram
        assert registry["generate_statistical_plot"] is pb.generate_statistical_plot
        assert registry["render_custom_scientific_figure"] is pb.render_custom_scientific_figure

    @pytest.mark.parametrize(
        ("tool_name", "required"),
        [
            ("generate_methodology_diagram", ["title", "nodes", "edges"]),
            ("generate_statistical_plot", ["plot_type", "title", "data"]),
            ("render_custom_scientific_figure", ["title", "python_code"]),
        ],
    )
    def test_schema_required_params_match_signatures(self, tool_name, required):
        schema = next(s for s in pb.plugin_registry.schemas if s["function"]["name"] == tool_name)
        assert schema["type"] == "function"
        assert schema["function"]["parameters"]["required"] == required
        assert schema["function"]["description"].strip()
        properties = schema["function"]["parameters"]["properties"]
        for param in required:
            assert param in properties


# ─────────────────────────────────────────────────────────────────────────────
# 5. Theme palette engine (v1.2 — four publication themes)
# ─────────────────────────────────────────────────────────────────────────────

class TestThemePalettes:
    def test_four_core_themes_are_fully_defined(self):
        for theme in ("academic", "dark_matrix", "vibrant", "deep"):
            palette = pb.THEME_PALETTES[theme]
            for key in ("bg", "card_bg", "border", "title", "text", "accent", "categories"):
                assert key in palette, f"{theme} missing '{key}'"
            # Every theme must style all five semantic node categories.
            for category in ("input", "process", "agent", "storage", "output"):
                cat = palette["categories"][category]
                assert {"bg", "border", "text"} <= set(cat), f"{theme}/{category} incomplete"

    def test_dark_matrix_uses_cyberpunk_slate_and_cyan(self):
        palette = pb.THEME_PALETTES["dark_matrix"]
        assert palette["bg"].lower() == "#0b0f17"
        assert palette["accent"].lower() == "#00f0ff"

    def test_deep_theme_uses_navy_with_teal_accent(self):
        palette = pb.THEME_PALETTES["deep"]
        assert palette["bg"].lower() == "#0f172a"
        assert palette["accent"].lower() == "#14b8a6"

    def test_vibrant_theme_is_purple_indigo_family(self):
        palette = pb.THEME_PALETTES["vibrant"]
        assert palette["accent"].lower() == "#7c3aed"
        assert palette["categories"]["process"]["border"].lower() == "#6366f1"

    def test_diagram_schema_exposes_all_five_themes(self):
        schema = next(
            s for s in pb.plugin_registry.schemas
            if s["function"]["name"] == "generate_methodology_diagram"
        )
        enum = schema["function"]["parameters"]["properties"]["theme"]["enum"]
        assert set(enum) >= {"academic", "dark_matrix", "vibrant", "deep"}

    @pytest.mark.parametrize("theme", ["academic", "dark_matrix", "vibrant", "deep"])
    def test_diagram_renders_under_every_theme(self, dirs, sample_nodes, sample_edges, theme):
        result = pb.generate_methodology_diagram(
            title=f"Theme Check — {theme}", nodes=sample_nodes, edges=sample_edges, theme=theme
        )
        assert result.startswith("###")
        # Parse the FIRST artifact URL only (the footer also mentions the path).
        match = re.search(r"/uploads/diagrams/([\w.\-]+)", result)
        assert match, f"no diagram URL in output: {result[:200]}"
        assert os.path.exists(os.path.join(dirs["diagrams"], match.group(1)))

    @pytest.mark.parametrize(
        "plot_type",
        ["bar", "line", "scatter", "heatmap", "box", "histogram"],
    )
    def test_all_six_plot_types_render_at_300_dpi(self, dirs, plot_type):
        data = {
            "bar": {"labels": ["A", "B"], "values": [3, 5]},
            "line": {"labels": [1, 2, 3], "values": [2, 4, 6]},
            "scatter": {"x": [1, 2, 3], "y": [5, 3, 8]},
            "heatmap": {"matrix": [[0.1, 0.9], [0.4, 0.6]], "x_ticks": ["x1", "x2"], "y_ticks": ["y1", "y2"]},
            "box": {"series": [{"name": "G1", "values": [1, 2, 3]}, {"name": "G2", "values": [2, 3, 4]}]},
            "histogram": {"values": [1, 2, 2, 3, 3, 3]},
        }[plot_type]
        result = pb.generate_statistical_plot(
            plot_type=plot_type, title=f"DPI Check {plot_type}", data=data,
            x_label="X", y_label="Y", palette_style="vibrant",
        )
        assert result.startswith("### 📈"), result
        # Parse the FIRST artifact URL only (the footer also mentions the path).
        match = re.search(r"/uploads/plots/([\w.\-]+)", result)
        assert match, f"no plot URL in output: {result[:200]}"
        from PIL import Image
        with Image.open(os.path.join(dirs["plots"], match.group(1))) as img:
            assert img.info.get("dpi", (0,))[0] >= 299  # 300 DPI output

    def test_unknown_theme_falls_back_to_academic(self, dirs, sample_nodes, sample_edges):
        result = pb.generate_methodology_diagram(
            title="Fallback", nodes=sample_nodes, edges=sample_edges, theme="does_not_exist"
        )
        assert result.startswith("###")  # no crash -> graceful default
