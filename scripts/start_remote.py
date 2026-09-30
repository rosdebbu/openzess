"""
Start Openzess with a free public tunnel and local network access.
Allows accessing Openzess from your tablet, phone, or any browser anywhere in the world.
"""
import os
import sys
import subprocess
import time
import re
import socket

# Force UTF-8 stdout on Windows console
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

ROOT_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
os.chdir(ROOT_DIR)

def get_local_ip():
    """Get the true local Wi-Fi / LAN IP address (192.168.x.x or 10.x.x.x)."""
    try:
        host = socket.gethostname()
        candidates = [ip for ip in socket.gethostbyname_ex(host)[2] if ip.startswith("192.168.") or ip.startswith("10.")]
        if candidates:
            return candidates[0]
    except Exception:
        pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(0.5)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return "192.168.1.15"

def main():
    print("=" * 65)
    print("        Starting Openzess Remote Access for Tablet")
    print("=" * 65)

    python_exe = sys.executable
    if os.path.exists(os.path.join(ROOT_DIR, "venv", "Scripts", "python.exe")):
        python_exe = os.path.join(ROOT_DIR, "venv", "Scripts", "python.exe")

    cloudflared_exe = os.path.join(ROOT_DIR, "scripts", "cloudflared.exe")
    if not os.path.exists(cloudflared_exe):
        print(f"[ERROR] cloudflared.exe not found at {cloudflared_exe}")
        sys.exit(1)

    local_ip = get_local_ip()

    # 1. Start FastAPI backend on 0.0.0.0:8000
    print("\n[1/3] Starting Openzess backend engine on port 8000...")
    backend_env = os.environ.copy()
    backend_env["PYTHONPATH"] = os.path.join(ROOT_DIR, "backend")
    
    server_process = subprocess.Popen(
        [python_exe, "-m", "uvicorn", "backend.app.server:app", "--host", "0.0.0.0", "--port", "8000"],
        cwd=ROOT_DIR,
        env=backend_env,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL
    )

    # Give server 2 seconds to initialize
    time.sleep(2)

    # 2. Start Cloudflare Tunnel writing directly to log file to avoid pipe deadlock
    print("[2/3] Establishing secure Cloudflare tunnel to internet...")
    log_path = os.path.join(ROOT_DIR, "cloudflared.log")
    log_file = open(log_path, "w", encoding="utf-8")
    
    tunnel_cmd = [cloudflared_exe, "tunnel", "--url", "http://127.0.0.1:8000"]
    tunnel_process = subprocess.Popen(
        tunnel_cmd,
        stdout=log_file,
        stderr=subprocess.STDOUT,
        cwd=ROOT_DIR
    )

    public_url = None
    print("[3/3] Generating your tablet access link (waiting for Cloudflare edge)...")
    
    start_time = time.time()
    while time.time() - start_time < 30:
        time.sleep(1)
        if os.path.exists(log_path):
            with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
                content = f.read()
                match = re.search(r"https://[a-zA-Z0-9-]+\.trycloudflare\.com", content)
                if match:
                    public_url = match.group(0)
                    break

    if not public_url:
        print("[WARN] Could not automatically capture Cloudflare URL within 30 seconds.")
        print(f"You can still access Openzess on your home Wi-Fi: http://{local_ip}:8000")
        return

    # Save to file for easy access
    link_file = os.path.join(ROOT_DIR, "TABLET_LINK.txt")
    with open(link_file, "w", encoding="utf-8") as f:
        f.write(f"OPENZESS TABLET & MOBILE ACCESS LINKS\n")
        f.write(f"Updated: {time.ctime()}\n\n")
        f.write(f"1. ANYWHERE / COLLEGE LINK (Cloudflare Tunnel):\n   {public_url}\n\n")
        f.write(f"2. HOME WI-FI LINK (Local Network):\n   http://{local_ip}:8000\n")

    print("\n" + "=" * 65)
    print(" >>> OPENZESS IS LIVE! OPEN THIS ON YOUR TABLET:")
    print("=" * 65)
    print(f"\n [A] AT COLLEGE / ANYWHERE IN THE WORLD (Internet):")
    print(f"     URL:  {public_url}\n")
    print(f" [B] AT HOME (Same Wi-Fi Network):")
    print(f"     URL:  http://{local_ip}:8000\n")
    print("=" * 65)
    print(f" Links saved to: {link_file}")
    print(" Keep this window open. Press Ctrl+C to stop.")
    print("=" * 65 + "\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping Openzess server and tunnel...")
        server_process.terminate()
        tunnel_process.terminate()
        print("Done!")

if __name__ == "__main__":
    main()
