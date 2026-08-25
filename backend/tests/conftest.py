"""Pytest configuration for OpenZess backend tests."""

import os
import sys

# Ensure the backend package root is importable so plugin modules resolve
# their `from app.plugin_loader import plugin_registry` fallback import.
BACKEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
if BACKEND_DIR not in sys.path:
    sys.path.insert(0, BACKEND_DIR)
