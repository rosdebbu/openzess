"""
Benchmark: Pillow vs Rust sidecar JPEG encoding of Matrix-stream frames.

Generates synthetic 1080p BGRX frames (identical bytes fed to both engines),
then measures latency distribution and estimated stream FPS for:

    1. Pure-Python path  : sidecar_client.encode_image_pil
    2. Rust sidecar path : sidecar_client.encode_image_via_sidecar
                           (skipped automatically when SIDECAR_URL is unset
                            or the sidecar is unreachable)

Usage:
    python scripts/bench_sidecar.py [--frames 60] [--width 1920] [--height 1080]

Interpretation guide lives in plans/hybrid-python-rust.md (Phase 4).
"""

import argparse
import os
import statistics
import sys
import time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "backend"))

from app.sidecar_client import (  # noqa: E402
    encode_image_pil,
    encode_image_via_sidecar,
    sidecar_enabled,
)


def make_frame(width: int, height: int) -> bytes:
    """Synthetic BGRX frame: horizontal gradient + vertical stripes (compressible,
    closer to real desktop content than pure noise)."""
    row = bytearray(width * 4)
    for x in range(width):
        b = (x * 255 // max(width - 1, 1))
        g = (x * 128 // max(width - 1, 1)) ^ (0xFF if (x // 8) % 2 else 0)
        r = 255 - b
        row[x * 4 : x * 4 + 4] = bytes((b, g, r, 255))
    return bytes(row) * height


def bench(label: str, fn, frames: list, quality: int) -> dict:
    timings_ms = []
    total_bytes = 0
    for raw in frames:
        t0 = time.perf_counter()
        out = fn(raw)
        dt = (time.perf_counter() - t0) * 1000.0
        timings_ms.append(dt)
        total_bytes += len(out)

    timings_ms.sort()
    mean = statistics.fmean(timings_ms)
    p50 = timings_ms[len(timings_ms) // 2]
    p95 = timings_ms[int(len(timings_ms) * 0.95) - 1]
    fps = 1000.0 / mean if mean > 0 else float("inf")
    print(f"\n[{label}]")
    print(f"  frames       : {len(timings_ms)}")
    print(f"  mean         : {mean:8.2f} ms")
    print(f"  p50          : {p50:8.2f} ms")
    print(f"  p95          : {p95:8.2f} ms")
    print(f"  est. stream  : {fps:8.1f} fps (encode-only ceiling)")
    print(f"  avg size     : {total_bytes // len(timings_ms):,} bytes/frame")
    return {"mean": mean, "p50": p50, "p95": p95}


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--frames", type=int, default=60)
    parser.add_argument("--width", type=int, default=1920)
    parser.add_argument("--height", type=int, default=1080)
    parser.add_argument("--quality", type=int, default=65)
    args = parser.parse_args()

    print(f"Generating {args.frames} frames @ {args.width}x{args.height} (BGRX)...")
    frames = [make_frame(args.width, args.height) for _ in range(args.frames)]

    results = {}
    results["pil"] = bench(
        f"Pillow (pure-Python)  q={args.quality}",
        lambda raw: encode_image_pil(raw, args.width, args.height, "JPEG", args.quality),
        frames,
        args.quality,
    )

    if sidecar_enabled():
        # Warm-up + reachability probe happens implicitly on first call.
        probe = encode_image_via_sidecar(frames[0], args.width, args.height, "JPEG", args.quality)
        if probe is None:
            print("\n[rust sidecar] UNREACHABLE — start it with: cd rust-sidecar && cargo run --release")
        else:
            results["rust"] = bench(
                f"Rust sidecar          q={args.quality}",
                lambda raw: encode_image_via_sidecar(raw, args.width, args.height, "JPEG", args.quality),
                frames,
                args.quality,
            )
    else:
        print("\n[rust sidecar] SKIPPED — SIDECAR_URL is not set in the environment.")

    if "rust" in results and "pil" in results:
        speedup = results["pil"]["mean"] / results["rust"]["mean"]
        print(f"\n=== Verdict: Rust sidecar is {speedup:.2f}x faster on mean encode latency ===")
        print("If speedup > 1.3x consistently, wiring the Matrix stream through the")
        print("sidecar (Phase 3) is justified. Otherwise keep the flag off.")
    elif "pil" in results:
        print("\nSet SIDECAR_URL and re-run to compare against the Rust sidecar.")


if __name__ == "__main__":
    main()
