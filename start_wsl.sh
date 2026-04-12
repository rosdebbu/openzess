#!/bin/bash
echo "=============================================="
echo "    Starting Openzess WSL Sandbox Matrix     "
echo "=============================================="

# 1. Start Xvfb: The Invisible Linux Monitor
export DISPLAY=:99
mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix
rm -f /tmp/.X11-unix/X99
Xvfb :99 -screen 0 1280x800x24 -ac -nolisten tcp &
XVFB_PID=$!
echo "[Sys] Virtual Desktop (Xvfb) active on DISPLAY=:99 (PID: $XVFB_PID)"

# 2. Wait for X11 to initialize
sleep 2

# 3. Start Window Manager (Fluxbox) so windows have borders
fluxbox -display :99 > /dev/null 2>&1 &
FLUX_PID=$!
echo "[Sys] Window Manager (fluxbox) active (PID: $FLUX_PID)"

# 4. Start X11VNC to allow the user to spy on the matrix visually!
x11vnc -display :99 -forever -shared -bg -nopw -quiet
echo "[Sys] VNC Server active on internal WSL port 5900. You can connect via Windows!"

# 5. Start websockify to bridge VNC (TCP) to WebSockets for the Browser Matrix Viewer
websockify --web /usr/share/novnc 6080 localhost:5900 &
WEBSOCKIFY_PID=$!
echo "[Sys] Websockify Proxy active on ws://localhost:6080"

echo "[Sys] Booting Python Ecosystem..."
# Construct VENV natively in Linux home directory (/home/user/) to bypass brutal /mnt/c/ IO speed bottlenecks
if [ ! -d ~/openzess_venv ]; then
    echo "Creating Python Virtual Environment natively in Linux..."
    python3 -m venv ~/openzess_venv
fi
source ~/openzess_venv/bin/activate

# Ensure internal packages are installed for Linux natively
echo "Installing Python dependencies natively into WSL (this will be fast now!)..."
pip install fastapi uvicorn litellm chromadb duckduckgo-search beautifulsoup4 mcp psutil pyautogui mss pillow requests pydantic httpx apscheduler watchdog sqlalchemy gtts python-dotenv python-multipart websockify pyTelegramBotAPI telebot

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
npm install
npm run dev -- --host &
FRONTEND_PID=$!

echo "=============================================="
echo "   Sandboxed OS is LIVE in Matrix. "
echo "   Connect to Web UI from Windows host. "
echo "=============================================="

# Keep alive and catch Ctrl+C to clean everything up
trap "echo 'Shutting down sandbox...'; kill $XVFB_PID $FLUX_PID $WEBSOCKIFY_PID $BACKEND_PID $FRONTEND_PID; pkill x11vnc; exit" SIGINT SIGTERM

wait
