"""
Structured JSON logging configuration with log-noise suppression.

Provides a single ``configure_logging()`` function that sets up Python's
``logging`` module to emit JSON-structured log lines and suppresses noisy
library-level loggers that would otherwise drown out actionable messages.

Noisy loggers suppressed
────────────────────────
1. **httpx** (INFO) — The Supabase Python client uses httpx under the hood.
   httpx logs every single HTTP request and response at INFO level.  With
   multiple microservices each polling Supabase, this produces hundreds of
   lines per hour — none actionable.

2. **httpcore** (INFO) — The underlying HTTP connection pool for httpx.
   Logs connection open/close events at INFO level.  Useful only when
   debugging connection-pool issues.

3. **uvicorn.access** (INFO) — Logs every incoming HTTP request as
   ``127.0.0.1:XXXX - 'GET /health HTTP/1.1' 200 OK``.  Docker HEALTHCHECK
   hits ``/health`` every 30 s, and any external monitors hit it more
   frequently.

All three are demoted to WARNING so that only actual errors (connection
failures, timeouts, protocol errors) appear in the logs.  The application's
own loggers (``__name__``) remain at the configured level for lifecycle
events.

Usage:
    from shared.logging_config import configure_logging

    configure_logging(logging.DEBUG)   # during development
    configure_logging()                 # defaults to INFO
"""

from __future__ import annotations

import logging
import sys


def configure_logging(level: int = logging.INFO) -> None:
    """Configure structured JSON logging for the application.

    Sets up the root logger with a JSON-structured format and a fixed
    date format that is locale-independent and always parseable.

    Suppresses three noisy library loggers (httpx, httpcore, uvicorn.access)
    to WARNING so that actionable messages are not drowned out.

    Args:
        level: The logging level for the application's own loggers.
            Defaults to ``logging.INFO``.
    """
    # ── Root logger configuration ───────────────────────────────────────────
    # Using a fixed ISO-8601 date format avoids locale-dependent date strings
    # and ensures the timestamp is always parseable regardless of system locale.
    logging.basicConfig(
        level=level,
        format=(
            '{"timestamp": "%(asctime)s", '
            '"level": "%(levelname)s", '
            '"logger": "%(name)s", '
            '"message": "%(message)s"}'
        ),
        datefmt="%Y-%m-%dT%H:%M:%S",
        stream=sys.stdout,
        force=True,
    )

    # ── Log-noise suppression ───────────────────────────────────────────────
    # Three library-level loggers produce high-volume, low-signal output that
    # defeats the purpose of sanitised logging (see module docstring for a
    # detailed rationale).  All are demoted to WARNING.
    _NOISY_LOGGERS: list[str] = [
        "httpx",
        "httpcore",
        "uvicorn.access",
    ]

    for logger_name in _NOISY_LOGGERS:
        logging.getLogger(logger_name).setLevel(logging.WARNING)
