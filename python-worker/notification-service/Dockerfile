# Stage 1: Builder — Install dependencies
FROM ghcr.io/astral-sh/uv:python3.11-bookworm-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements (relative to build context = python-worker/)
COPY notification-service/requirements.txt .

# Create virtual environment and install dependencies
RUN uv venv /app/.venv
ENV PATH="/app/.venv/bin:$PATH"
RUN uv pip install --no-cache-dir -r requirements.txt

# Stage 2: Runtime — Minimal production image (no torch/sentence-transformers)
FROM python:3.11-slim-bookworm AS runtime

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

# Copy application code and shared modules (paths relative to build context)
COPY notification-service/main.py ./main.py
COPY notification-service/sender.py ./sender.py
COPY notification-service/digester.py ./digester.py
COPY notification-service/cleaner.py ./cleaner.py
COPY shared/ ./shared/

# Create non-root user
RUN useradd --create-home --shell /bin/bash appuser && \
    mkdir -p /tmp && \
    chown -R appuser:appuser /app /tmp && \
    chmod -R 777 /tmp

USER appuser

# Environment
ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONUNBUFFERED=1
ENV PYTHONDONTWRITEBYTECODE=1

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD curl -f http://localhost:8000/health || exit 1

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--limit-concurrency", "100"]
