"""
Supabase client factory with async-safe thread-pool execution.

Provides a module-level singleton Supabase client initialised at application
startup via init_supabase(). All database I/O is dispatched through a dedicated
ThreadPoolExecutor so that synchronous httpx calls never block the asyncio
event loop.

Usage:
    from shared.db import init_supabase, execute, get_client

    # Called once during lifespan startup
    init_supabase()

    # Inside async endpoints / background tasks
    result = await execute(table.select("*"))

Architecture notes
──────────────────
- ThreadPoolExecutor with max_workers=20 prevents event-loop blocking when
  multiple concurrent handlers issue Supabase queries.
- SSL/connection errors (common on Windows with httpx) are retried with
  exponential backoff (1 s, 2 s, 4 s) up to 3 attempts.
- Windows httpx clients are patched at init time with a proper SSL context
  to avoid "EOF occurred in violation of protocol" errors.
"""

from __future__ import annotations

import asyncio
import concurrent.futures
import logging
import os
import ssl

import httpx
from supabase import Client, create_client

logger = logging.getLogger(__name__)

# ── Module-level singleton ──────────────────────────────────────────────────────
supabase: Client | None = None

# Dedicated thread pool for DB I/O — prevents event loop blocking and thread
# pool starvation when multiple microservices issue concurrent queries.
_db_executor = concurrent.futures.ThreadPoolExecutor(
    max_workers=20, thread_name_prefix="db"
)


# ── Public API ──────────────────────────────────────────────────────────────────


def init_supabase() -> Client:
    """Initialise and return the module-level Supabase client.

    Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment.
    SUPABASE_URL falls back to NEXT_PUBLIC_SUPABASE_URL (the Next.js root .env
    convention) so the worker works correctly regardless of working directory.

    Returns:
        The initialised Supabase client.

    Raises:
        RuntimeError: If either required environment variable is missing.
    """
    global supabase

    # Environment resolution ──────────────────────────────────────────────────
    # SUPABASE_URL from python-worker/.env takes precedence.
    # Falls back to NEXT_PUBLIC_SUPABASE_URL from root .env (Next.js convention).
    _raw_supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get(
        "NEXT_PUBLIC_SUPABASE_URL"
    )

    # Defensive: ensure URL has a protocol prefix (httpx requires it)
    if _raw_supabase_url and not _raw_supabase_url.startswith(
        ("http://", "https://")
    ):
        logger.warning(
            "SUPABASE_URL missing protocol prefix ('%s'). "
            "Auto-prepended 'https://'. Fix your environment configuration.",
            _raw_supabase_url,
        )
        _raw_supabase_url = f"https://{_raw_supabase_url}"

    supabase_url: str | None = _raw_supabase_url
    supabase_key: str | None = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    # Validate ----------------------------------------------------------------
    missing: list[str] = []
    if not supabase_url:
        missing.append("SUPABASE_URL")
    if not supabase_key:
        missing.append("SUPABASE_SERVICE_ROLE_KEY")
    if missing:
        msg = f"Missing required environment variables: {', '.join(missing)}"
        logger.critical(msg)
        raise RuntimeError(msg)

    # Client initialisation ───────────────────────────────────────────────────
    try:
        supabase = create_client(supabase_url, supabase_key)

        # Windows SSL workaround ──────────────────────────────────────────────
        # httpx on Windows can fail with "SSL: EOF occurred in violation of
        # protocol" when the system CA bundle is missing. We configure the
        # internal httpx clients with a proper SSL context.
        if os.name == "nt":
            _apply_windows_ssl_workaround(supabase)

        logger.info("Supabase client initialised successfully")
    except Exception as exc:
        supabase = None
        logger.exception("Failed to initialise Supabase client: %s", exc)
        raise RuntimeError(f"Supabase client initialisation failed: {exc}") from exc

    return supabase


async def execute(query, max_retries: int = 3):
    """Execute a Supabase query in the dedicated thread pool.

    Never blocks the event loop — the synchronous ``query.execute()`` call is
    offloaded to the ``_db_executor`` thread pool.

    SSL/connection errors (common on Windows where httpx SSL handshakes can
    intermittently fail) are automatically retried with 1 s / 2 s / 4 s
    exponential backoff.

    Args:
        query: A Supabase query builder instance (e.g. ``table.select("*")``).
        max_retries: Maximum number of attempts for SSL/connection errors.

    Returns:
        The query result.

    Raises:
        ssl.SSLError: If all retries are exhausted.
        httpx.RemoteProtocolError: If all retries are exhausted.
        httpx.ConnectError: If all retries are exhausted.
        httpx.TimeoutException: If all retries are exhausted.
        Exception: Non-SSL errors are re-raised immediately (no retry).
    """
    loop = asyncio.get_event_loop()
    last_error: BaseException | None = None

    for attempt in range(max_retries):
        try:
            return await loop.run_in_executor(_db_executor, query.execute)
        except (
            ssl.SSLError,
            httpx.RemoteProtocolError,
            httpx.ConnectError,
            httpx.TimeoutException,
        ) as ssl_err:
            last_error = ssl_err
            if attempt < max_retries - 1:
                wait = 2**attempt  # 1 s, 2 s, 4 s
                logger.warning(
                    "SSL/connection error (attempt %d/%d), retrying in %ds: %s",
                    attempt + 1,
                    max_retries,
                    wait,
                    ssl_err,
                )
                await asyncio.sleep(wait)
            else:
                logger.error(
                    "SSL/connection error after %d retries: %s",
                    max_retries,
                    ssl_err,
                )
        except Exception:
            # Non-SSL errors — don't retry, just pass through
            raise

    if last_error is not None:
        raise last_error


def get_client() -> Client:
    """Return the initialised Supabase client.

    Returns:
        The module-level Supabase client.

    Raises:
        RuntimeError: If ``init_supabase()`` has not been called yet.
    """
    if supabase is None:
        msg = (
            "Supabase client is not initialised. "
            "Call init_supabase() during application startup."
        )
        raise RuntimeError(msg)
    return supabase


# ── Internal helpers ────────────────────────────────────────────────────────────


def _apply_windows_ssl_workaround(client: Client) -> None:
    """Patch internal httpx clients on Windows with a proper SSL context.

    httpx on Windows can fail with ``SSL: EOF occurred in violation of
    protocol`` when the system CA bundle is unavailable.  This creates a
    default SSL context and patches the postgrest and storage session clients
    while preserving their ``base_url`` and ``headers``.

    This is intentionally best-effort — if patching fails the client continues
    with default settings (transient SSL errors will be handled by the retry
    logic in ``execute()``).
    """
    try:
        ssl_context = ssl.create_default_context()
        ssl_context.check_hostname = True
        ssl_context.verify_mode = ssl.CERT_REQUIRED

        # Patch the internal postgrest HTTP client
        if hasattr(client, "postgrest") and hasattr(client.postgrest, "session"):
            orig_session = client.postgrest.session
            custom_client = httpx.Client(
                base_url=orig_session.base_url,
                headers=orig_session.headers,
                verify=ssl_context,
                timeout=httpx.Timeout(30.0),
            )
            client.postgrest.session = custom_client

        # Patch the internal storage HTTP client
        if hasattr(client, "storage") and hasattr(client.storage, "_client"):
            orig_storage = client.storage._client
            custom_storage = httpx.Client(
                base_url=orig_storage.base_url,
                headers=orig_storage.headers,
                verify=ssl_context,
                timeout=httpx.Timeout(30.0),
            )
            client.storage._client = custom_storage

        logger.debug("Windows SSL workaround applied to httpx clients")
    except Exception as exc:
        logger.warning(
            "SSL configuration note (non-fatal): %s", exc
        )
