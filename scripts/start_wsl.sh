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
rm -f /tmp/.X100-lock /tmp/.X11-unix/X100 > /dev/null 2>&1 || true
sleep 1

export DISPLAY=:100
Xvfb :100 -screen 0 1280x800x24 -ac -nolisten tcp &
XVFB_PID=$!
echo "[Sys] Virtual Desktop (Xvfb) active on DISPLAY=:100 (PID: $XVFB_PID)"

# 2. Wait for X11 to initialize
sleep 2

# 3. Start Window Manager (Fluxbox) so windows have borders
fluxbox -display :100 > /dev/null 2>&1 &
FLUX_PID=$!
echo "[Sys] Window Manager (fluxbox) active (PID: $FLUX_PID)"



echo "[Sys] Booting Python Ecosystem..."
if [ ! -d ~/openzess_venv ]; then
    echo "Creating Python Virtual Environment natively in Linux..."
    python3 -m venv ~/openzess_venv
fi
source ~/openzess_venv/bin/activate

if ! python3 -c "import fastapi" &> /dev/null; then
    echo "Installing Python dependencies natively into WSL..."
    pip install -r backend/requirements.txt websockify python-multipart
else
    echo "[Sys] Python dependencies already installed. Skipping pip."
fi

# Boot Backend (FastAPI app package)
cd backend
export DISPLAY=:100
python3 -m uvicorn app.server:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
echo "[Sys] FastAPI Backend started on port 8000"
cd ..

# Boot Frontend (web-only, opens in browser)
echo "[Sys] Booting Frontend UI..."
cd frontend
if [ ! -d "node_modules" ] || [ ! -d "node_modules/react" ]; then
    echo "Installing Node modules..."
    npm install
else
    echo "[Sys] Node modules already installed. Skipping npm."
fi
npm run dev -- --host &
FRONTEND_PID=$!

echo "=============================================="
echo "   Sandboxed OS is LIVE in Matrix. "
echo "   Connect to Web UI from Windows host. "
echo "=============================================="

# Keep alive and catch Ctrl+C to clean everything up
trap "echo 'Shutting down sandbox...'; kill $XVFB_PID $FLUX_PID $BACKEND_PID $FRONTEND_PID; exit" SIGINT SIGTERM

wait
