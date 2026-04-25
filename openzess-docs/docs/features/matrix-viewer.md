# Matrix Viewer

The Matrix Viewer is OpenZess's most unique feature — a real-time window into an invisible Linux desktop that your AI agent can control autonomously.

## How It Works

### The Virtual Display Stack

```
┌─────────────────────────────────────────┐
│  Your Browser (Matrix Viewer tab)       │
│  ┌───────────────────────────────────┐  │
│  │   Live JPEG stream @ 15 FPS      │  │
│  │   (WebSocket binary frames)      │  │
│  └───────────────┬───────────────────┘  │
│                  │                       │
│  Click/Type ─────┼──→ WebSocket JSON     │
└──────────────────┼───────────────────────┘
                   │
┌──────────────────┼───────────────────────┐
│  FastAPI Server  │                       │
│  ┌───────────────┴───────────────────┐   │
│  │  /api/matrix/stream (WebSocket)   │   │
│  │  ┌─────────┐  ┌────────────────┐  │   │
│  │  │  mss    │  │  PyAutoGUI     │  │   │
│  │  │ (grab)  │  │ (click/type)   │  │   │
│  │  └────┬────┘  └───────┬────────┘  │   │
│  └───────┼───────────────┼───────────┘   │
│          │               │               │
│  ┌───────┴───────────────┴───────────┐   │
│  │      Xvfb (Display :100)          │   │
│  │      1280x800x24 virtual screen   │   │
│  │      + Fluxbox window manager     │   │
│  └───────────────────────────────────┘   │
└──────────────────────────────────────────┘
```

### Frame Capture

The server uses `mss` (a fast screen capture library) to grab frames from the Xvfb display at ~15 FPS:

```python
sct = mss.mss()
monitor = sct.monitors[0]

sct_img = sct.grab(monitor)
img = Image.frombytes("RGB", sct_img.size, sct_img.bgra, "raw", "BGRX")

buffer = io.BytesIO()
img.save(buffer, format="JPEG", quality=65, optimize=True)
await websocket.send_bytes(buffer.getvalue())
```

### User Input

When you click or type inside the Matrix Viewer, the frontend sends JSON messages over the same WebSocket:

```json
// Click
{"action": "click", "x": 0.45, "y": 0.32}

// Type
{"action": "type", "text": "hello world"}

// Key press
{"action": "key", "key": "enter"}
```

The coordinates are sent as percentages (0.0 to 1.0) since the UI image scales responsively. The server converts them to native pixel coordinates.

## Troubleshooting

### "Can't connect to display"
Ensure `DISPLAY=:100` is set in both `start_wsl.sh` and `agent.py`.

### Matrix is blank
Check that `fluxbox` started correctly. Run `ps aux | grep fluxbox` inside WSL.

### Low frame rate
Reduce the Xvfb resolution or increase JPEG compression quality in `server.py`.
