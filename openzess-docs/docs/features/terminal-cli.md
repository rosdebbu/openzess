# 📟 Cyberpunk Terminal TUI

Openzess features a Hermes-grade interactive terminal interface designed for ultra-fast, developer-first workflows.

```text
  ██████╗ ██████╗ ███████╗███╗   ██╗███████╗███████╗███████╗
 ██╔═══██╗██╔══██╗██╔════╝████╗  ██║╚══███╔╝██╔════╝██╔════╝
 ██║   ██║██████╔╝█████╗  ██╔██╗ ██║  ███╔╝ █████╗  ███████╗
 ██║   ██║██╔═══╝ ██╔══╝  ██║╚██╗██║ ███╔╝  ██╔══╝  ╚════██║
 ╚██████╔╝██║     ███████╗██║ ╚████║███████╗███████╗███████║
  ╚═════╝ ╚═╝     ╚══════╝╚═╝  ╚═══╝╚══════╝╚══════╝╚══════╝
```

---

## 🚀 Quick Launch

### Windows PowerShell
```powershell
.\openzess.bat
```

### Linux / Debian WSL2
```bash
openzess
# or
./openzess.sh
```

---

## 🎨 Interface Features

1. **3D ASCII Lizard Mascot:**
   * Styled in **Deep/Olive Lizard Green (`#16a34a`)** with neon lime accents.
2. **Metadata & Capabilities Card:**
   * Displays active model, sandbox target (`Debian 13 WSL2`), engine status, and session hash.
   * Categorized tools breakdown (`terminal`, `filesystem`, `browser`, `memory`, `evolution`, `matrix`).
   * Categorized skills breakdown (`autonomous-coding`, `system-ops`, `creative`, `memory-vault`).
3. **Turn Headers & Streaming:**
   * Turn delimiter (`● user prompt` $\rightarrow$ `─ ⚡ Openzess ─`).
   * Real-time token streaming with first-token latency calculation (`[Latency: 0.62s · Total: 1.84s]`).
4. **Bottom Status Line:**
   * Shows active model, sandbox target, Rust engine status, and vector memory count.

---

## ⌨️ Slash Commands

| Command | Action |
|---|---|
| **`/model [provider]`** | Switch active model (`glm`, `deepseek`, `gemini`, `openai`, `anthropic`, `groq`, `ollama`, `lmstudio`) |
| **`/habits`** | Inspect learned user habits & adaptive behavioral profile |
| **`/skills`** | List all hot-loaded Python plugins and synthesized capabilities |
| **`/memory [query]`** | Search ChromaDB vector memory vault semantically |
| **`/clear`** | Reset conversation memory while keeping learned habits |
| **`/help`** | Display interactive help menu |
| **`/exit`** | Disconnect and exit cleanly |
