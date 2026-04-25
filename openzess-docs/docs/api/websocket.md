# WebSocket API (Matrix Viewer)

The Matrix Viewer uses a WebSocket connection for bidirectional real-time communication.

## Connection

```javascript
const ws = new WebSocket("ws://localhost:8000/api/matrix/stream");
```

## Server → Client (Video Frames)

The server sends **binary** WebSocket messages containing JPEG-encoded frames at ~15 FPS:

```javascript
ws.onmessage = (event) => {
    if (event.data instanceof Blob) {
        const url = URL.createObjectURL(event.data);
        imageElement.src = url;
    }
};
```

### Frame Specifications

| Property | Value |
|----------|-------|
| Format | JPEG |
| Quality | 65% |
| Resolution | 1280×800 (Xvfb native) |
| Frame Rate | ~15 FPS |
| Encoding | Binary WebSocket frames |

## Client → Server (User Input)

Send JSON text messages to control the virtual desktop:

### Click
```json
{
    "action": "click",
    "x": 0.45,
    "y": 0.32
}
```

::: info
Coordinates are **percentage-based** (0.0 to 1.0), not pixel-based. The server multiplies by the native monitor resolution. This ensures the UI works correctly regardless of browser window size.
:::

### Type Text
```json
{
    "action": "type",
    "text": "hello world"
}
```

### Press Key
```json
{
    "action": "key",
    "key": "enter"
}
```

Supported keys include: `enter`, `tab`, `backspace`, `escape`, `shift`, `ctrl`, `alt`, `up`, `down`, `left`, `right`, `space`, `f1`-`f12`.

## Concurrent Tasks

The WebSocket handler runs two async tasks concurrently:

1. **`send_frames()`** — Continuously captures and sends screen frames
2. **`receive_input()`** — Listens for and processes user input

```python
stream_task = asyncio.create_task(send_frames())
input_task = asyncio.create_task(receive_input())

done, pending = await asyncio.wait(
    [stream_task, input_task],
    return_when=asyncio.FIRST_COMPLETED
)
```

If either task fails (e.g., client disconnects), both are cleaned up gracefully.
