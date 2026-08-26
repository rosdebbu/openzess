@echo off
REM ==============================================
REM   Openzess Terminal CLI Launcher (Windows)
REM ==============================================
setlocal
cd /d %~dp0

if exist venv (
    set "PY_EXE=%~dp0venv\Scripts\python.exe"
) else (
    set "PY_EXE=python"
)

set "PYTHONPATH=%~dp0backend"
"%PY_EXE%" -m app.cli %*
