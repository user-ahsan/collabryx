# Stage 1: Builder — Install dependencies
# Uses uv for fast, reproducible dependency resolution.
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies (numpy needs a C compiler on some platforms)
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements before code to leverage Docker layer caching
COPY feed-service/requirements.txt .

# Create virtual environment and install dependencies
# Unlike the embedding-service Dockerfile, we do NOT install torch or
# sentence-transformers — this service only needs numpy for Thompson Sampling.
RUN uv venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
RUN uv pip install --no-cache-dir -r requirements.txt


# Stage 2: Runtime — Minimal production image
FROM python:3.11-slim-bookworm AS runtime

WORKDIR /app

# Install security updates and runtime dependencies (curl for healthcheck)
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && apt-get autoremove -y

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/requirements.txt /app/

# Copy shared modules (reusable across all python-worker microservices)
COPY shared/ /app/shared/

# Copy application code
COPY feed-service/main.py /app/main.py
COPY feed-service/scorer.py /app/scorer.py

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser

# Create required directories with proper permissions
RUN mkdir -p /app/.cache /tmp && \
    chown -R appuser:appuser /app /tmp && \
    chmod -R 777 /app/.cache /tmp

# Set ownership before switching user
RUN chown -R appuser:appuser /app

USER appuser

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port
EXPOSE 8000

# Health check with proper timeout
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with single worker (uvicorn with concurrency limit)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--limit-concurrency", "100"]
