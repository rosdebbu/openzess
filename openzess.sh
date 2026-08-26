#!/usr/bin/env bash
# ==============================================
#   Openzess Terminal CLI Launcher (Debian WSL)
# ==============================================
DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
export PYTHONPATH="$DIR/backend"

if [ -f "$DIR/venv/bin/python" ]; then
    "$DIR/venv/bin/python" -m app.cli "$@"
else
    python3 -m app.cli "$@"
fi
