#!/bin/bash
echo "=== Fixing Xvfb Display ==="

# Kill all existing X processes
pkill -9 -f Xvfb 2>/dev/null || true
pkill -9 -f fluxbox 2>/dev/null || true
sleep 1

# Remove ALL stale X11 sockets and lock files
rm -f /tmp/.X*-lock 2>/dev/null || true
rm -rf /tmp/.X11-unix 2>/dev/null || true
mkdir -p /tmp/.X11-unix
chmod 1777 /tmp/.X11-unix
sleep 1

echo "[1/3] Starting fresh Xvfb on :100..."
Xvfb :100 -screen 0 1280x800x24 -ac &
XVFB_PID=$!
sleep 2

echo "[2/3] Checking X11 socket..."
ls -la /tmp/.X11-unix/

echo "[3/3] Testing display connectivity..."
DISPLAY=:100 xdpyinfo 2>&1 | head -5

echo ""
echo "=== Xvfb PID: $XVFB_PID ==="
echo "=== Now restart the backend with: export DISPLAY=:100 && cd backend && python3 server.py ==="
