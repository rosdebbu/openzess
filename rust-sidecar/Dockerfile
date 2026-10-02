# ── Stage 1: Build Rust Sidecar (Pinned to Bookworm to prevent glibc drift) ──
FROM rust:1-bookworm-slim AS builder
WORKDIR /app

# Cache dependency compilation
COPY Cargo.toml Cargo.lock ./
RUN mkdir src && echo 'fn main() {}' > src/main.rs && cargo build --release && rm -rf src

# Copy real source & clear dummy fingerprints to prevent stale cache bugs
COPY src ./src
RUN rm -f target/release/deps/openzess_sidecar* target/release/openzess-sidecar* \
    && cargo build --release

# ── Stage 2: Minimal Hardened Production Runtime ───────────────────────────
FROM debian:bookworm-slim

WORKDIR /app

# Install curl (container healthcheck) & tini (zombie reaper / clean SIGTERM handler)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    ca-certificates \
    tini \
    && rm -rf /var/lib/apt/lists/*

# Run as dedicated unprivileged non-root user
RUN useradd --create-home --shell /usr/sbin/nologin openzess
USER openzess

# Copy compiled binary from builder
COPY --from=builder /app/target/release/openzess-sidecar /usr/local/bin/openzess-sidecar

ENV SIDECAR_HOST=0.0.0.0 \
    SIDECAR_PORT=8100 \
    RUST_LOG=info

EXPOSE 8100

HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -fsS http://127.0.0.1:8100/health || exit 1

# Tini cleanly forwards SIGTERM to the sidecar, preventing 10-second docker stop hangs
ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/openzess-sidecar"]
