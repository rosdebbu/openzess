# ⚡ Hybrid Python/Rust Architecture

Openzess uses a hybrid engine architecture: **70% Python** for agent reasoning and dynamic plugin hot-loading, combined with **30% Rust** for CPU-bound performance tasks.

---

## 🏛️ Architecture Overview

```
┌────────────────────────────────────────────────────────┐
│                   Openzess Agent                       │
│      (Python 3.12/3.13 + LiteLLM + FastAPI + Rich)     │
└───────────────────────────┬────────────────────────────┘
                            │ HTTP / IPC Loopback
                            ▼
┌────────────────────────────────────────────────────────┐
│               Rust Acceleration Sidecar                │
│              (Axum Microservice : 8100)                │
│   • /image/encode (TurboJPEG frame compression)        │
│   • Compute-intensive token transforms                 │
│   • Sub-millisecond latency offloading                 │
└────────────────────────────────────────────────────────┘
```

---

## 🛡️ Zero-Downtime Pure Python Fallback

If the Rust sidecar binary is offline or compiling:
- The Python engine automatically detects the sidecar state and falls back seamlessly to **Pillow (`PIL.Image`)** and native asyncio loops.
- **Zero errors or tracebacks** are surfaced to the user.
- As soon as the Rust sidecar boots on port `8100`, high-performance offloading resumes automatically.

---

## 🚀 Running the Rust Sidecar

```bash
cd rust-sidecar
cargo run --release
```
The sidecar binds to `http://127.0.0.1:8100` and reports health metrics directly to the Openzess backend.
