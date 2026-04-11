#!/bin/bash
echo "=============================================="
echo "    Starting Openzess WSL Sandbox Matrix     "
echo "=============================================="

# 1. Start Xvfb: The Invisible Linux Monitor
export DISPLAY=:99
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

echo "[Sys] Booting Python Ecosystem..."
if [ ! -d "venv_wsl" ]; then
    echo "Creating Python Virtual Environment for WSL..."
    python3 -m venv venv_wsl
fi
source venv_wsl/bin/activate

# Ensure internal packages are installed for Linux natively
echo "Installing Python dependencies natively into WSL..."
pip install fastapi uvicorn litellm chromadb duckduckgo-search beautifulsoup4 mcp psutil pyautogui mss pillow requests pydantic httpx --quiet

# Fix Windows CRLF issues dynamically that might crash linux scripts
find . -type f -name "*.py" -exec sed -i 's/\r$//' {} +

# Boot Backend
cd backend
python3 main.py &
BACKEND_PID=$!
echo "[Sys] FastAPI Backend started on port 8000"
cd ..

# Boot Frontend (Node.js must be accessible in WSL)
echo "[Sys] Booting Frontend UI..."
cd frontend
npm install --silent
npm run dev -- --host &
FRONTEND_PID=$!

echo "=============================================="
echo "   Sandboxed OS is LIVE in Matrix. "
echo "   Connect to Web UI from Windows host. "
echo "=============================================="

# Keep alive and catch Ctrl+C to clean everything up
trap "echo 'Shutting down sandbox...'; kill $XVFB_PID $FLUX_PID $BACKEND_PID $FRONTEND_PID; pkill x11vnc; exit" SIGINT SIGTERM

wait
