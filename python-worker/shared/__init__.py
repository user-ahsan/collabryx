"""
shared — Reusable modules for Collabryx Python microservices.

This package provides common infrastructure components shared across
notification, feed, and match microservices:

  - db:              Supabase client factory with async-safe thread-pool execution
  - middleware:       FastAPI API-key auth middleware and CORS configuration
  - logging_config:   Structured JSON logging setup with log-noise suppression

Usage:
    from shared.db import init_supabase, execute, get_client
    from shared.middleware import add_cors_middleware, api_key_auth
    from shared.logging_config import configure_logging
"""
