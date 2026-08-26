@echo off
echo ==============================================
echo       Starting openzess (Web Version)
echo ==============================================

REM ── Setup Python virtual environment if missing ──
if not exist venv (
    echo [setup] Creating Python virtual environment...
    python -m venv venv
)

REM ── Install backend dependencies if missing ──
venv\Scripts\python -c "import fastapi" >nul 2>&1
if errorlevel 1 (
    echo [setup] Installing backend requirements...
    venv\Scripts\python -m pip install --upgrade pip >nul
    venv\Scripts\python -m pip install -r backend\requirements.txt
)

REM ── Check .env ──
if not exist .env (
    echo [warn] No .env found. Copying .env.example - add your API keys!
    copy .env.example .env >nul
)

REM ── Start FastAPI backend on port 8000 ──
echo [1/2] Starting FastAPI Backend on port 8000...
start "openzess Backend" cmd /k "cd backend && ..\venv\Scripts\python -m uvicorn app.server:app --host 0.0.0.0 --reload --port 8000"

REM ── Start React (Vite) frontend - opens in your browser ──
echo [2/2] Starting Web Frontend (opens in browser)...
start "openzess Frontend" cmd /k "cd frontend && npm install && npm run dev"

echo.
REM ── OPTIONAL: launch Rust sidecar if binary exists ──
if exist "rust-sidecar\target\release\openzess-sidecar.exe" (
    echo [opt] Starting Rust sidecar on port 8100...
    start "openzess Sidecar" /min cmd /c "cd /d %~dp0rust-sidecar && target\release\openzess-sidecar.exe"
)

echo.
echo ==============================================
echo   All services are launching!
echo   Backend  : http://localhost:8000
echo   Frontend : http://localhost:5173
echo ==============================================

REM ── Open browser to frontend ──
ping 127.0.0.1 -n 3 >nul
start http://localhost:5173

