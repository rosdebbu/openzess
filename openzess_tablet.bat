@echo off
title Openzess - Tablet & Mobile Remote Access
cd /d %~dp0

if exist venv\Scripts\python.exe (
    venv\Scripts\python.exe scripts\start_remote.py
) else (
    python scripts\start_remote.py
)
pause
