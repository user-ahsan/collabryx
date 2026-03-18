# Stage 1: Builder - Install dependencies and compile
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements
COPY requirements.txt .

# Create virtual environment and install dependencies
RUN uv venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
RUN uv pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
RUN uv pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime - Minimal production image
FROM python:3.11-slim-bookworm AS runtime

# Metadata labels for security and maintenance
LABEL maintainer="Collabryx Team"
LABEL version="1.0.0"
LABEL description="Python embedding generation service for Collabryx platform"
LABEL security.policy="restricted"
LABEL org.opencontainers.image.source="https://github.com/user-ahsan/collabryx"

WORKDIR /app

# Install security updates and runtime dependencies
RUN apt-get update && apt-get upgrade -y && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean \
    && apt-get autoremove -y

# Copy virtual environment from builder
COPY --from=builder /app/.venv /app/.venv
COPY --from=builder /app/requirements.txt /app/

# Copy application code
COPY main.py .
COPY embedding_generator.py .
COPY embedding_validator.py .
COPY rate_limiter.py .

# Create non-root user for security
RUN useradd --create-home --shell /bin/bash appuser

# Create required directories with proper permissions
RUN mkdir -p /app/logs /tmp && chown -R appuser:appuser /app /tmp

# Set ownership before switching user
RUN chown -R appuser:appuser /app

# Declare volume mount point for logs (persisted externally)
VOLUME ["/app/logs"]

USER appuser

# Set environment variables
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

# Expose port
EXPOSE 8000

# Health check with proper timeout
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

# Run with single worker (background tasks run per-process)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--limit-concurrency", "100"]
