# openzess-sidecar 🦀

Optional Rust acceleration service for Openzess (hybrid architecture — see
[`plans/hybrid-python-rust.md`](../plans/hybrid-python-rust.md)). The Python
core works perfectly without it; when it is running **and** `SIDECAR_URL` is
set, eligible CPU-bound work is transparently offloaded here with automatic
fallback on any failure.

## Endpoints

| Endpoint        | Method | Purpose                                                                                                   |
| --------------- | ------ | --------------------------------------------------------------------------------------------------------- |
| `/health`       | GET    | liveness + version JSON                                                                                   |
| `/image/encode` | POST   | raw pixels (headers: `x-width`, `x-height`, `x-layout`, `x-format`, `x-quality`) → encoded JPEG/PNG bytes |

## Run

Requires the Rust toolchain (<https://rustup.rs>), on Windows natively or inside WSL:

```bash
cd rust-sidecar
cargo run --release          # listens on http://127.0.0.1:8100
```

Then enable it in Openzess `.env`:

```
SIDECAR_URL=http://127.0.0.1:8100
```

## Quick smoke test

```bash
curl http://127.0.0.1:8100/health
curl -X POST http://127.0.0.1:8100/image/encode \
     -H "x-width: 2" -H "x-height: 1" -H "x-layout: bgrx" \
     -H "x-format: jpeg" -H "x-quality: 90" \
     --data-binary $'\x00\x00\xff\xff\x00\xff\x00\xff' -o test.jpg
```

## Tests

```bash
cargo test
```

## Design notes

- Encoding runs inside `tokio::task::spawn_blocking` so heavy frames never
  stall the async reactor.
- The wire format is deliberately dumb: raw pixel rows matching `mss`'s
  `sct_img.bgra` (`BGRX`) — no base64, no JSON envelope, minimal overhead.
- Responses carry `x-encoded-by: rust-sidecar` so the Python layer can log
  which engine actually served each request.
