#!/bin/bash
echo "=============================================="
echo "    Starting Openzess WSL Sandbox Matrix     "
echo "=============================================="

# 1. Start Xvfb: The Invisible Linux Monitor
echo "[Sys] Cleaning up any previous ghost displays..."
pkill -9 -f Xvfb > /dev/null 2>&1 || true
pkill -9 -f fluxbox > /dev/null 2>&1 || true
pkill -9 -f x11vnc > /dev/null 2>&1 || true
pkill -9 -f websockify > /dev/null 2>&1 || true
rm -f /tmp/.X99-lock /tmp/.X11-unix/X99 > /dev/null 2>&1 || true
sleep 1

export DISPLAY=:99
Xvfb :99 -screen 0 1280x800x24 -ac -nolisten tcp &
XVFB_PID=$!
echo "[Sys] Virtual Desktop (Xvfb) active on DISPLAY=:99 (PID: $XVFB_PID)"

# 2. Wait for X11 to initialize
sleep 2

# 3. Start Window Manager (Fluxbox) so windows have borders
fluxbox -display :99 > /dev/null 2>&1 &
FLUX_PID=$!
echo "[Sys] Window Manager (fluxbox) active (PID: $FLUX_PID)"



echo "[Sys] Booting Python Ecosystem..."
# Construct VENV natively in Linux home directory (/home/user/) to bypass brutal /mnt/c/ IO speed bottlenecks
if [ ! -d ~/openzess_venv ]; then
    echo "Creating Python Virtual Environment natively in Linux..."
    python3 -m venv ~/openzess_venv
fi
source ~/openzess_venv/bin/activate

# Ensure internal packages are installed for Linux natively
echo "Installing Python dependencies natively into WSL (this will be fast now!)..."
pip install fastapi uvicorn litellm chromadb duckduckgo-search beautifulsoup4 mcp psutil pyautogui mss pillow requests pydantic httpx apscheduler watchdog sqlalchemy gtts python-dotenv python-multipart websockify pyTelegramBotAPI telebot discord.py

# Removed CRLF fix that caused massive file I/O bottleneck


# Boot Backend
cd backend
python3 server.py &
BACKEND_PID=$!
echo "[Sys] FastAPI Backend started on port 8000"
cd ..

# Boot Frontend
echo "[Sys] Booting Frontend UI..."
cd frontend
if [ -f "node_modules/electron/dist/electron.exe" ]; then
    echo "[Sys] Purging Windows electron.exe to fetch Linux binary..."
    rm -rf node_modules/electron
fi
npm install
npm run dev -- --host &
FRONTEND_PID=$!

echo "=============================================="
echo "   Sandboxed OS is LIVE in Matrix. "
echo "   Connect to Web UI from Windows host. "
echo "=============================================="

# Keep alive and catch Ctrl+C to clean everything up
trap "echo 'Shutting down sandbox...'; kill $XVFB_PID $FLUX_PID $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

wait
