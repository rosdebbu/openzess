@echo off
echo ==============================================
echo       Starting openzess System
echo ==============================================

echo [1/2] Starting FastAPI Backend on port 8000...
start "openzess Backend" cmd /k "cd backend && ..\venv\Scripts\python -m uvicorn server:app --reload --port 8000"

echo [2/2] Starting React Frontend...
start "openzess Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo Both services are starting up! 
echo Check your new terminal windows for logs.
echo ==============================================
