"""
FastAPI middleware helpers for API-key authentication and CORS.

Provides two pluggable components used by notification, feed, and match
microservices:

  - ``add_cors_middleware`` — configures CORS with a list of allowed origins
    (defaults to the ``ALLOWED_ORIGINS`` env var or ``http://localhost:3000``).
  - ``api_key_auth`` — FastAPI ``@app.middleware("http")`` handler that
    validates the ``X-Worker-API-Key`` header on every request except
    exempt endpoints (``/health``, ``/metrics``, ``/``).

Usage:
    from fastapi import FastAPI
    from shared.middleware import add_cors_middleware, api_key_auth

    app = FastAPI()
    add_cors_middleware(app)
    app.middleware("http")(api_key_auth)
"""

from __future__ import annotations

import logging
import os

from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

logger = logging.getLogger(__name__)

# ── Configuration (read from environment at import time) ────────────────────────

# Endpoints exempt from API key authentication — health checks, metrics, and
# the root path need to be accessible without credentials so that Docker
# HEALTHCHECK, Prometheus scraping, and simple liveness probes work.
AUTH_EXEMPT_PATHS: frozenset[str] = frozenset({"/health", "/metrics", "/"})

# Worker API key for inter-service authentication.
# If this is not set (None / empty), ALL requests are allowed (dev mode).
WORKER_API_KEY: str | None = os.getenv("WORKER_API_KEY")


# ── Public API ──────────────────────────────────────────────────────────────────


def add_cors_middleware(
    app: FastAPI,
    origins: list[str] | None = None,
) -> None:
    """Add CORS middleware with the given origins.

    Args:
        app: The FastAPI application instance.
        origins: List of allowed origins.  Defaults to the ``ALLOWED_ORIGINS``
            environment variable (comma-separated).  If that is also unset,
            falls back to ``http://localhost:3000``.
    """
    if origins is None:
        origins_str = os.getenv(
            "ALLOWED_ORIGINS", "http://localhost:3000"
        )
        origins = [o.strip() for o in origins_str.split(",") if o.strip()]

    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["POST", "GET", "OPTIONS"],
        allow_headers=["Authorization", "Content-Type", "X-Worker-API-Key"],
    )
    logger.info(
        "CORS middleware configured for %d origin(s)", len(origins)
    )


async def api_key_auth(request: Request, call_next):
    """FastAPI middleware that verifies the ``X-Worker-API-Key`` header.

    Skips authentication for paths in ``AUTH_EXEMPT_PATHS`` (``/health``,
    ``/metrics``, ``/``).

    If ``WORKER_API_KEY`` is not configured (development mode), all requests
    pass through without authentication.

    Args:
        request: The incoming HTTP request.
        call_next: The next middleware or route handler.

    Returns:
        The response from the next handler, or a 401 JSON response if the
        API key is missing or invalid.
    """
    # Skip auth for health, metrics, and root endpoints
    if request.url.path in AUTH_EXEMPT_PATHS:
        return await call_next(request)

    # If no API key is configured, allow all requests (dev mode)
    if not WORKER_API_KEY:
        return await call_next(request)

    # Check for API key in header
    api_key = request.headers.get("X-Worker-API-Key")
    if not api_key or api_key != WORKER_API_KEY:
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "error": "Unauthorized",
                "message": "Valid X-Worker-API-Key header required",
            },
        )

    return await call_next(request)
