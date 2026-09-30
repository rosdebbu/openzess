# ── Stage 1: Build React Frontend ─────────────────────────
FROM node:20-slim AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npx vite build --config vite.config.mjs --configLoader native

# ── Stage 2: Python Backend & Production Runtime ─────────
FROM python:3.12-slim

WORKDIR /app

# Install system dependencies
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

# Production environment configuration
ENV PYTHONUNBUFFERED=1
ENV PORT=8080
ENV FRONTEND_DIST=/app/frontend/dist
ENV OPENZESS_CORS_ORIGINS="*"

EXPOSE 8080

# Cloud Run automatically sets $PORT (defaults to 8080)
CMD ["sh", "-c", "python -m uvicorn backend.app.server:app --host 0.0.0.0 --port ${PORT:-8080}"]
