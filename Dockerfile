# ── Stage 1: Build React Frontend ─────────────────────────
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npx vite build --config vite.config.mjs --configLoader native

# ── Stage 2: Build Rust Sidecar ───────────────────────────
FROM rust:1-slim AS sidecar-builder
WORKDIR /app/sidecar

COPY rust-sidecar/Cargo.toml rust-sidecar/Cargo.lock ./
# Cache dependencies: build a stub first so deps compile & cache,
# then the real source copy recompiles only our crate.
RUN mkdir src && echo 'fn main() {}' > src/main.rs && cargo build --release && rm -rf src

COPY rust-sidecar/src ./src
RUN touch src/main.rs && cargo build --release

# ── Stage 3: Python Backend & Production Runtime ──────────
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies (curl needed for HEALTHCHECK)
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy backend codebase
COPY backend/ ./backend/

# Copy built static frontend from Stage 1
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Copy Rust sidecar binary from Stage 2
COPY --from=sidecar-builder /app/sidecar/target/release/openzess-sidecar /usr/local/bin/openzess-sidecar

# Production environment configuration
ENV PYTHONUNBUFFERED=1 \
    PORT=8080 \
    FRONTEND_DIST=/app/frontend/dist \
    # CORS must be set per-deployment (Cloud Run env vars / compose); no wildcard by default.
    OPENZESS_CORS_ORIGINS=""

# ── Harden: run as dedicated non-root user ────────────────
RUN useradd --create-home --shell /usr/sbin/nologin openzess \
    && mkdir -p /app/data /app/uploads \
    && chown -R openzess:openzess /app /app/data /app/uploads
USER openzess

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=25s --retries=3 \
    CMD curl -fsS "http://127.0.0.1:${PORT:-8080}/v1/models" > /dev/null || exit 1

# Start the Rust sidecar (optional, auto-fallback if it dies) + the API server.
# Cloud Run automatically sets $PORT (defaults to 8080).
CMD ["sh", "-c", "openzess-sidecar & python -m uvicorn backend.app.server:app --host 0.0.0.0 --port ${PORT:-8080}"]