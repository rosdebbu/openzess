# 📊 PaperBanana Visualization Engine

**PaperBanana** is a native visualization plugin bundled with Openzess that generates publication-grade 300 DPI figures, statistical charts, and benchmark diagrams directly from agent reasoning.

---

## 🎨 Publication Palettes

PaperBanana ships with four curated aesthetic themes:

1. **`academic`** — Clean, serif-styled aesthetic suitable for IEEE / Nature / arXiv papers.
2. **`dark_matrix`** — High-contrast cyberpunk palette with emerald and lime highlights.
3. **`vibrant`** — Modern presentation palette with bold gradients.
4. **`deep`** — Elegant muted palette for dark mode dashboards.

---

## 💻 Invoking PaperBanana

You can prompt Openzess naturally to create plots:

```text
"Plot a benchmark comparison between Python, Rust, and Openzess Hybrid engine at 300 DPI using the dark_matrix palette."
```

Under the hood, Openzess invokes `@generate_paperbanana_plot` from `backend/app/plugins/paperbanana_plugin.py`, renders the figure using `matplotlib` & `seaborn`, and returns the high-resolution PNG directly.
