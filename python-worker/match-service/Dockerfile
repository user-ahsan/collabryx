# Stage 1: Builder — Install dependencies with uv
# Uses ghcr.io/astral-sh/uv which bundles Python 3.11 + uv in a slim image.
# No torch/sentence-transformers needed — this service only does numpy vector
# operations and HTTP calls to Supabase.  The image is ~180 MB vs ~2.1 GB for
# the embedding service (which loads a HuggingFace model).
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies (gcc/gcc for numpy compilation on first install)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for layer caching
COPY match-service/requirements.txt .

# Create virtual environment and install dependencies
RUN uv venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
RUN uv pip install --no-cache-dir -r requirements.txt


# Stage 2: Runtime — Minimal production image
FROM python:3.11-slim-bookworm AS runtime

WORKDIR /app

# Install security updates + curl for healthcheck
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && apt-get autoremove -y

# Copy virtual environment from builder (no torch — much lighter)
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/requirements.txt /app/requirements.txt

# Copy shared modules (used by all microservices)
# docker-compose context is set to python-worker/ so shared/ is accessible
COPY shared/ ./shared/

# Copy match-service application code
COPY match-service/main.py ./match-service/main.py
COPY match-service/generator.py ./match-service/generator.py
COPY match-service/learner.py ./match-service/learner.py
COPY match-service/skill_categories.py ./match-service/skill_categories.py

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser

# Create required directories with proper permissions
RUN mkdir -p /tmp && \
    chown -R appuser:appuser /app /tmp

# Set ownership before switching user
RUN chown -R appuser:appuser /app

USER appuser

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Add /app to Python path so `from shared.db import ...` works
# when running uvicorn from /app/match-service
ENV PYTHONPATH=/app

# Expose port
EXPOSE 8000

# Health check with proper timeout
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run from match-service directory so imports resolve correctly:
# - 'main' module is found at /app/match-service/main.py (cwd)
# - 'shared' module is found at /app/shared/ (via PYTHONPATH)
# - 'generator' module is found at /app/match-service/generator.py (cwd)
WORKDIR /app/match-service

# Single worker — match generation is CPU-bound (numpy vector ops), and
# multiple workers would compete for CPU without throughput benefit.
# limit-concurrency prevents connection pile-up under burst load.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--limit-concurrency", "100"]
