# Contributing to Openzess

First off, thanks for taking the time to contribute! 🎉

Openzess is a provider-agnostic, multi-agent AI workspace — contributions from
AI engineers, full-stack developers, and open-source enthusiasts are welcome.

## 🛠️ Project Setup

### Prerequisites
- **Python 3.12+**
- **Node.js 20+**
- (Optional) Docker for PostgreSQL — SQLite fallback works out of the box

### Quick Start
```bash
# Windows — one-click (creates venv, installs deps, launches everything)
start.bat

# Or manually:
python -m venv venv
venv\Scripts\pip install -r backend\requirements.txt   # Linux/WSL: venv/bin/pip
cd backend && ..\venv\Scripts\python -m uvicorn app.server:app --reload --port 8000
cd frontend && npm install && npm run dev
```

## 🔄 Development Workflow

1. **Fork** the repository
2. **Create a feature branch**
   ```bash
   git checkout -b feat/your-feature
   ```
3. **Make your changes**, following the conventions below
4. **Verify before pushing**
   ```bash
   cd frontend && npm run build      # type-check + build must pass
   cd backend && python -m compileall app tools
   ```
5. **Commit** using conventional commits
   ```bash
   git commit -m "feat: add your feature"
   ```
6. **Push** and open a Pull Request against `main`

## 📝 Conventions

| Type | Prefix | Example |
|---|---|---|
| New feature | `feat:` | `feat: add voice input to chat` |
| Bug fix | `fix:` | `fix: plugin loader path in package mode` |
| Docs | `docs:` | `docs: update architecture diagram` |
| Refactor/chore | `chore:` / `refactor:` | `chore: bump litellm` |

### Frontend
- TypeScript types for all new props and interfaces
- Follow existing component/page patterns in `frontend/src`
- Tailwind CSS v4 utility classes; keep theme tokens (`bg-brand`, dark mode variants)

### Backend
- New tools belong in `backend/app/agent.py` or as plugins in `backend/app/plugins/`
- Keep modules package-relative (`from .agent import ...`)
- Runtime data (DBs, logs, vector stores) must never be committed

## ✅ Pull Request Checklist

- [ ] `npm run build` passes (frontend)
- [ ] Backend modules compile without errors
- [ ] Tested with at least **two** LLM providers if behavior is provider-related
- [ ] Documentation updated for user-facing changes
- [ ] No API keys or secrets in the diff

## 🐛 Found a Bug?

Open an [issue](https://github.com/rosdebbu/openzess/issues/new?template=bug_report.md)
with reproduction steps and your environment details.

## 💬 Questions?

Start a [Discussion](https://github.com/rosdebbu/openzess/discussions) — we're happy to help!
