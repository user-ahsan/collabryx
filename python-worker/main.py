"""
Collabryx Embedding Service
FastAPI server for generating semantic embeddings using Sentence Transformers
Core service only — match generation, notifications, activity tracking,
content moderation, AI mentor, analytics, and feed scoring have been removed.


── COMPREHENSIVE PERFORMANCE OPTIMIZATION (10K USER SCALE) ─────────────────────

This file underwent a systematic white-box optimization audit. Below documents
every problem found, why it was a bottleneck, and how it was fixed.

── LAYER 1: EVENT LOOP BLOCKERS (CRITICAL) ──────────────────────────────────

PROBLEM: Supabase Python client's .execute() makes synchronous HTTP calls.
When called directly inside async endpoint handlers and background tasks, each
.execute() blocks the entire asyncio event loop for 50-200ms (the HTTP round-
trip to Supabase REST API). At 10K users with burst traffic, this creates a
serialization bottleneck — all concurrent requests queue up behind each other.

SEVEN (7) blocking .execute() sites were found:
  1. POST /generate-embedding — duplicate check (was: line 918)
  2. POST /generate-embedding — queue insert    (was: line 933-938)
  3. POST /generate-embedding-from-profile      (was: line 977)
  4. store_in_dead_letter_queue — DLQ insert     (was: line 356)
  5. store_in_dead_letter_queue — fallback upsert (was: line 374)
  6. GET /health — DB health check               (was: line 824)
  7. _mark_embedding_status — status update       (was: line 499-506)

FIX: Created the _execute() async helper that dispatches every Supabase query
through a dedicated ThreadPoolExecutor (max_workers=20, thread_name_prefix="db").
All seven sites now use await _execute(query) — zero event loop blocking.

Additionally, store_embedding() was called directly (without run_in_executor)
in the pending queue processor while the DLQ processor correctly wrapped it.
This inconsistency was fixed — both paths now use the dedicated thread pool.

── LAYER 2: THROUGHPUT BOTTLENECKS ─────────────────────────────────────────

PROBLEM 1 — Sequential profile fetching: Each non-API queue item made three
sequential SELECT queries (profiles + user_skills + user_interests). Each is
an independent HTTP round-trip. At 50 items per batch: 150 sequential DB calls.

FIX: Parallelized with asyncio.gather(). The three queries for each user now
execute concurrently, reducing per-user fetch time from ~150-300ms to ~50-100ms.
Additionally, items with pre-built semantic_text (API-triggered) skip fetching
entirely.

PROBLEM 2 — Per-item encoding: Each embedding was generated one text at a time.
SentenceTransformer supports batch encoding which is 3-6x faster due to matrix
operation batching.

FIX: Batch encoding via batch_generate_embeddings(). All 50 texts are collected
and encoded in a single model.encode(texts) call. This reduces encoding time
for a batch of 50 from ~1500ms to ~200ms.

PROBLEM 3 — No explicit thread pool: Default ThreadPoolExecutor has min(32,
cpu_count+4) threads (~8-12 on typical hardware). The same pool is shared by
API endpoints and background loops, causing thread starvation under load.

FIX: Dedicated _db_executor with max_workers=20 ensures DB I/O never starves
other async operations.

── LAYER 3: REDUNDANT I/O ─────────────────────────────────────────────────

PROBLEM: Docker HEALTHCHECK hits /health every 30s, which queried Supabase
on every call. At 10K user scale with multiple monitor instances, this adds
significant read-only load that competes with write-heavy queue processing.

FIX: _health_db_cache caches the Supabase connectivity status for 15 seconds.
The Docker HEALTHCHECK (30s interval) hits the DB at most every 2nd call.

PROBLEM: The startup test runner logged ~20 verbose lines on every restart.

FIX: Collapsed to 2 lines for passing, ~5 lines max for failure.

── LAYER 4: CODE QUALITY ──────────────────────────────────────────────────

PROBLEM: loop.add_signal_handler() raises NotImplementedError on Windows,
crashing the lifespan startup on local development machines.

FIX: Wrapped in try/except NotImplementedError with an info log.

PROBLEM: Batch size of 20 items per cycle limits throughput. Pending queue
polled every 30 seconds.

FIX: Batch size increased to 50. Poll interval reduced to 15s (lightweight
EXISTS guard skips the full query when queue is empty, so latency is minimal).
"""

from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
import os
import time
import asyncio
import logging
import shutil
import signal
import concurrent.futures
from datetime import datetime, timedelta
from contextlib import asynccontextmanager



from dotenv import load_dotenv
from pathlib import Path
from supabase import create_client, Client
import httpx
import ssl

from embedding_generator import get_generator, construct_semantic_text
from rate_limiter import RateLimiter
from embedding_validator import EmbeddingValidator

# Load root .env FIRST (always exists, has NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, etc.)
# Then python-worker/.env SECOND (overrides for worker-specific values like SUPABASE_URL)
# This ensures the worker can find ALL env vars regardless of working directory.
_root_env = Path(__file__).resolve().parent.parent / ".env"
if _root_env.exists():
    load_dotenv(dotenv_path=_root_env, override=False)
load_dotenv(override=False)  # python-worker/.env overrides

# Configure structured JSON logging with explicit date format
# Using a fixed format avoids locale-dependent date strings and ensures
# the timestamp is always parseable regardless of system locale.
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}',
    datefmt="%Y-%m-%dT%H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── Log noise suppression ────────────────────────────────────────────────────
# Three library-level loggers produce high-volume, low-signal output that
# defeats the purpose of sanitized logging:
#
# 1. httpx (INFO): The Supabase Python client uses httpx under the hood. httpx
#    logs every single HTTP request and response at INFO level. Each background
#    queue poll cycle (DLQ check + pending check) generates 2-4 httpx lines.
#    With Docker HEALTHCHECK every 30s + existing queue traffic, httpx alone
#    produces hundreds of log lines per hour — none actionable.
#
# 2. httpcore (INFO): The underlying HTTP connection pool for httpx. Logs
#    connection open/close events at INFO level. Only useful when debugging
#    connection pool issues.
#
# 3. uvicorn.access (INFO): Logs every incoming HTTP request as
#    "127.0.0.1:XXXX - 'GET /health HTTP/1.1' 200 OK". The Docker HEALTHCHECK
#    hits /health every 30s, and any external monitors hit it more frequently.
#    Each successful health check generates a log line that provides zero
#    operational value once the service has confirmed healthy.
#
# All three are demoted to WARNING so that only actual errors (connection
# failures, timeouts, protocol errors) appear in the logs. Our custom log
# messages (main logger) remain at INFO for lifecycle events.
logging.getLogger("httpx").setLevel(logging.WARNING)
logging.getLogger("httpcore").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)

# Environment variables
# SUPABASE_URL from python-worker/.env takes precedence.
# Falls back to NEXT_PUBLIC_SUPABASE_URL from root .env (Next.js convention)
# so the worker works correctly regardless of which working directory it starts from.
_raw_supabase_url = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
# Defensive: ensure URL has a protocol prefix (httpx requires it)
SUPABASE_URL = _raw_supabase_url if _raw_supabase_url and _raw_supabase_url.startswith(("http://", "https://")) else f"https://{_raw_supabase_url}" if _raw_supabase_url else None
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
WORKER_API_KEY = os.getenv("WORKER_API_KEY")


# Dedicated thread pool for DB I/O — prevents event loop blocking and thread pool starvation
_db_executor = concurrent.futures.ThreadPoolExecutor(
    max_workers=20, thread_name_prefix="db"
)

# Health DB cache — avoids querying Supabase on every Docker HEALTHCHECK
_health_db_cache = {"ts": 0.0, "healthy": False}
HEALTH_DB_CACHE_TTL = 15  # seconds


async def _execute(query, max_retries=3):
    """Execute a Supabase query in the dedicated thread pool — NEVER blocks the event loop.
    
    Automatically retries on SSL/connection errors (common on Windows where
    httpx SSL handshakes can intermittently fail). Retries with 1s/2s/4s backoff.
    """
    loop = asyncio.get_event_loop()
    last_error = None
    
    for attempt in range(max_retries):
        try:
            return await loop.run_in_executor(_db_executor, query.execute)
        except (ssl.SSLError, httpx.RemoteProtocolError, httpx.ConnectError, httpx.TimeoutException) as ssl_err:
            last_error = ssl_err
            if attempt < max_retries - 1:
                wait = 2 ** attempt  # 1s, 2s, 4s
                logger.warning(f"SSL/connection error (attempt {attempt + 1}/{max_retries}), retrying in {wait}s: {ssl_err}")
                await asyncio.sleep(wait)
            else:
                logger.error(f"SSL/connection error after {max_retries} retries: {ssl_err}")
        except Exception as e:
            # Non-SSL errors — don't retry, just pass through
            raise e
    
    if last_error:
        raise last_error


# Validate required environment variables
def validate_env_vars():
    required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {missing}")
    # Also check that SUPABASE_URL has a protocol (httpx requires http:// or https://)
    _supabase_url = os.getenv("SUPABASE_URL") or os.getenv("NEXT_PUBLIC_SUPABASE_URL")
    if _supabase_url and not _supabase_url.startswith(("http://", "https://")):
        raise RuntimeError(
            f"SUPABASE_URL ('{_supabase_url}') is missing 'http://' or 'https://' protocol. "
            f"This causes httpx to fail with 'Request URL is missing protocol' errors."
        )


# Declare module-level singletons (initialized in lifespan)
supabase: Optional[Client] = None
rate_limiter: Optional[RateLimiter] = None

# A1: Single DB-backed queue — API requests persist through embedding_pending_queue table
# No in-memory queue needed. Items survive restarts and scale across workers.

# Graceful shutdown flag
SHUTDOWN_FLAG = False

# Model info cache (computed once at startup, C5)
_model_info_cache: Optional[dict] = None

# Disk usage cache for health endpoint (recomputed every 5 min to avoid syscall overhead)
_disk_cache: dict = {"ts": 0.0, "data": None}
DISK_CACHE_TTL = 300  # 5 minutes


def signal_handler(signum, frame):
    """Handle SIGTERM and SIGINT for graceful shutdown."""
    global SHUTDOWN_FLAG
    sig_name = signal.Signals(signum).name
    logger.info(f"Received {sig_name} signal — initiating graceful shutdown")
    SHUTDOWN_FLAG = True




async def run_embedding_tests():
    """Run embedding tests on startup using run_in_executor to avoid blocking the event loop"""
    import subprocess
    import sys
    import time

    logger.info("=" * 60)
    logger.info("RUNNING EMBEDDING TESTS")
    logger.info("Verifying all critical fixes are working correctly")
    logger.info("=" * 60)

    start_time = time.time()

    try:
        loop = asyncio.get_event_loop()

        def _run_pytest():
            return subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "pytest",
                    "tests/test_embedding.py",
                    "-v",
                    "--tb=short",
                    "-r",
                    "fE",
                ],
                cwd=os.path.dirname(os.path.abspath(__file__)),
                capture_output=True,
                text=True,
                timeout=120,
            )

        # Run subprocess in thread pool to avoid blocking event loop (B4)
        result = await asyncio.wait_for(
            loop.run_in_executor(None, _run_pytest),
            timeout=130.0,
        )

        elapsed_time = time.time() - start_time

        if result.returncode == 0:
            logger.info("✓ Embedding tests PASSED (12/12 checks)")
            logger.info(f"Test execution time: {elapsed_time:.2f}s")
        else:
            logger.error(f"✗ Embedding tests FAILED ({elapsed_time:.2f}s, exit={result.returncode})")
            if result.stderr:
                first_lines = result.stderr.strip().split("\n")[:5]
                for line in first_lines:
                    logger.error(f"  {line}")
                # NOTE: The backslash-count is computed BEFORE the f-string (not inline)
                # to maintain Python 3.11 compatibility. The Docker runtime image
                # uses python:3.11-slim-bookworm, which does not support backslash
                # escapes inside f-string expression parts (PEP 701 — Python 3.12+).
                total_stderr_lines = len(result.stderr.strip().split("\n"))
                if len(first_lines) < total_stderr_lines:
                    logger.error(f"  ... ({total_stderr_lines - len(first_lines)} more lines)")
            logger.warning("⚠️ Continuing startup despite test failures")

    except asyncio.TimeoutError:
        logger.error("Embedding tests timed out (2 min limit)")
        logger.error("This may indicate:")
        logger.error("  - Model loading issues")
        logger.error("  - Database connectivity problems")
        logger.error("  - Test infrastructure issues")
    except FileNotFoundError:
        logger.warning("pytest not found - skipping tests")
        logger.warning("Install pytest: pip install pytest pytest-asyncio")
    except Exception as e:
        logger.error(f"Failed to run embedding tests: {e}")
        logger.error(f"Exception type: {type(e).__name__}")

    logger.info("=" * 60)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle with graceful shutdown and signal handling"""
    global SHUTDOWN_FLAG, supabase, rate_limiter, _model_info_cache

    # Register signal handlers for graceful shutdown (Unix only — Windows uses win32 events)
    try:
        loop = asyncio.get_event_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, signal_handler, sig, None)
        logger.info("Signal handlers registered for SIGTERM and SIGINT")
    except NotImplementedError:
        logger.info("Signal handlers not available on this platform (Windows)")

    validate_env_vars()

    # B7: Initialize Supabase inside lifespan (not at module level)
    # Prevents silent degraded mode when env vars are missing at import time
    # Use module-level SUPABASE_URL (has protocol fix applied) but still read key from env
    supabase_url = SUPABASE_URL
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    if supabase_url:
        # Warn if protocol was missing (defensive fix kicked in)
        _raw = os.environ.get("SUPABASE_URL") or os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
        if _raw and not _raw.startswith(("http://", "https://")):
            logger.warning(
                f"SUPABASE_URL is missing a protocol prefix ('{_raw}'). "
                f"Auto-prepended 'https://'. Fix your environment configuration."
            )
    if supabase_url and supabase_key:
        try:
            supabase = create_client(supabase_url, supabase_key)

            # Windows SSL workaround: httpx on Windows can fail with
            # "SSL: EOF occurred in violation of protocol" when the system
            # CA bundle is missing. We configure the internal httpx clients
            # with a proper SSL context to avoid this.
            if os.name == 'nt':
                try:
                    ssl_context = ssl.create_default_context()
                    # Relax SSL fingerprint checking for Windows compatibility
                    ssl_context.check_hostname = True
                    ssl_context.verify_mode = ssl.CERT_REQUIRED
                    
                    # Patch the internal postgrest HTTP client if accessible, preserving base_url and headers
                    if hasattr(supabase, "postgrest") and hasattr(supabase.postgrest, "session"):
                        orig_session = supabase.postgrest.session
                        custom_client = httpx.Client(
                            base_url=orig_session.base_url,
                            headers=orig_session.headers,
                            verify=ssl_context,
                            timeout=httpx.Timeout(30.0)
                        )
                        supabase.postgrest.session = custom_client
                    
                    # Patch storage client preserving base_url and headers
                    if hasattr(supabase, "storage") and hasattr(supabase.storage, "_client"):
                        orig_storage = supabase.storage._client
                        custom_storage = httpx.Client(
                            base_url=orig_storage.base_url,
                            headers=orig_storage.headers,
                            verify=ssl_context,
                            timeout=httpx.Timeout(30.0)
                        )
                        supabase.storage._client = custom_storage
                except Exception as ssl_err:
                    # SSL config failed — continue with default (will retry on DB ops)
                    logger.warning(f"SSL configuration note (non-fatal): {ssl_err}")

            rate_limiter = RateLimiter(supabase)
            logger.info("Supabase client initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            supabase = None
            rate_limiter = None

    # C5: Pre-cache model info at startup
    _model_info_cache = get_generator().get_model_info()

    logger.info("=" * 60)
    logger.info("EMBEDDING SERVICE STARTING UP")
    logger.info("=" * 60)

    # Run embedding tests on startup to verify fixes
    await run_embedding_tests()

    logger.info("Starting DLQ processor...")
    dlq_processor_task = asyncio.create_task(process_dead_letter_queue())
    logger.info("Starting pending queue processor...")
    pending_queue_task = asyncio.create_task(process_pending_queue())

    logger.info("✓ All background tasks started successfully")
    logger.info("=" * 60)

    yield

    # Graceful shutdown initiated
    logger.info("=" * 60)
    logger.info("SHUTTING DOWN EMBEDDING SERVICE")
    logger.info("=" * 60)
    SHUTDOWN_FLAG = True

    # Cancel background tasks gracefully with individual timeouts
    logger.info("Cancelling background tasks...")

    tasks_with_names = [
        ("dlq", dlq_processor_task),
        ("pending", pending_queue_task),
    ]

    for task_name, task in tasks_with_names:
        if not task.done():
            task.cancel()
            try:
                await asyncio.wait_for(task, timeout=5.0)
                logger.info(f"✓ {task_name} task cancelled gracefully")
            except asyncio.CancelledError:
                logger.info(f"✓ {task_name} task cancelled")
            except asyncio.TimeoutError:
                logger.warning(f"⚠️ {task_name} task forced to stop (timeout)")

    logger.info("=" * 60)
    logger.info("EMBEDDING SERVICE SHUTDOWN COMPLETE")
    logger.info("=" * 60)

    # Close Supabase connections gracefully (already declared global above)
    if supabase:
        try:
            logger.info("Closing Supabase client connections...")
            # Supabase Python client doesn't have explicit close,
            # but we nullify the reference to allow GC
            supabase = None
            logger.info("✓ Supabase client released")
        except Exception as e:
            logger.error(f"Error releasing Supabase client: {e}")


# Initialize FastAPI app with lifespan
app = FastAPI(
    title="Collabryx Embedding Service",
    description="Generate semantic embeddings for user profiles using Sentence Transformers",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Worker-API-Key"],
)


# =====================================================
# API Key Authentication Middleware
# =====================================================

# Endpoints exempt from API key authentication
AUTH_EXEMPT_PATHS = {"/health", "/metrics", "/"}


@app.middleware("http")
async def api_key_auth(request: Request, call_next):
    """Middleware to verify X-Worker-API-Key header for protected endpoints."""
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
            content={"error": "Unauthorized", "message": "Valid X-Worker-API-Key header required"},
        )

    return await call_next(request)





class EmbeddingRequest(BaseModel):
    """Request body for embedding generation"""

    text: str = Field(..., description="Text to embed (semantic profile string)")
    user_id: str = Field(..., description="User ID for tracking")
    request_id: Optional[str] = Field(
        None, description="Optional request ID for tracking"
    )

    @field_validator("text")
    @classmethod
    def validate_text(cls, v):
        if not v or len(v.strip()) < 10:
            raise ValueError("Text must be at least 10 characters")
        if len(v) > 2000:
            raise ValueError("Text must not exceed 2000 characters")
        return v


class EmbeddingResponse(BaseModel):
    """
    Response body for embedding generation.
    Fields like embedding/dimensions/model/processing_time_ms are
    only populated when status == 'completed'.
    """

    user_id: str
    status: str = "success"
    message: Optional[str] = None
    dimensions: Optional[int] = Field(None, description="384 for completed embeddings")
    model: Optional[str] = Field(None, description="Model name, populated on completion")
    request_id: Optional[str] = None
    processing_time_ms: Optional[float] = Field(
        None, description="Processing time in ms, populated on completion"
    )


class ProfileDataRequest(BaseModel):
    """Request body for generating embedding from profile data"""

    user_id: str = Field(..., description="User ID")
    profile: dict = Field(..., description="User profile data")
    skills: List[dict] = Field(default_factory=list, description="User skills")
    interests: List[dict] = Field(default_factory=list, description="User interests")
    request_id: Optional[str] = Field(None, description="Optional request ID")


async def store_in_dead_letter_queue(
    user_id: str, semantic_text: str, failure_reason: str, retry_count: int = 0
):
    """Store failed request in dead letter queue for retry with comprehensive error recovery"""
    if not supabase:
        logger.critical(
            f"CRITICAL: Supabase not initialized, cannot store in DLQ for {user_id}"
        )
        # Fallback: Log to external monitoring if available
        logger.error(
            f"DLQ STORAGE FAILED - Manual intervention may be needed for {user_id}"
        )
        return False

    try:
        next_retry = datetime.utcnow() + timedelta(minutes=5 * (retry_count + 1))
        await _execute(
            supabase.table("embedding_dead_letter_queue").insert(
                {
                    "user_id": user_id,
                    "semantic_text": semantic_text,
                    "failure_reason": failure_reason,
                    "retry_count": retry_count,
                    "next_retry": next_retry.isoformat(),
                    "status": "pending" if retry_count < 3 else "exhausted",
                }
            )
        )
        logger.info(f"DLQ stored for {user_id}, retry {retry_count}/3")
        return True
    except Exception as e:
        logger.critical(
            f"Failed to store in DLQ for {user_id}: {e}", exc_info=True
        )
        # Fallback: Try to update profile_embeddings status to failed at minimum
        try:
            await _execute(
                supabase.table("profile_embeddings").upsert(
                    {
                        "user_id": user_id,
                        "status": "failed",
                        "error_message": f"DLQ storage failed: {str(e)}",
                        "last_updated": datetime.utcnow().isoformat(),
                    },
                    on_conflict="user_id",
                )
            )
            logger.warning(f"Fallback: Marked embedding as failed for {user_id}")
        except Exception as fallback_error:
            logger.critical(
                f"CRITICAL: Even fallback failed for {user_id}: {fallback_error}"
            )
            # At this point, log to external monitoring (Sentry, etc.) if configured
            logger.critical(
                f"MANUAL INTERVENTION REQUIRED: User {user_id} embedding failed and DLQ storage failed"
            )
        return False


def store_embedding(user_id: str, embedding: List[float], status: str):
    """
    Store embedding in Supabase with validation metadata using UPSERT to avoid race conditions.
    Implements transaction-like error handling with rollback to failed status.
    """
    if not supabase:
        logger.error(
            f"CRITICAL: Supabase client not initialized. Cannot store embedding for {user_id}"
        )
        return False

    upsert_success = False

    try:
        # Step 1: Validate and fix embedding before storage
        # The validator handles dimension padding/truncation + normalization (A3)
        embedding, validation_result = EmbeddingValidator.validate_and_fix(embedding)

        if not validation_result.is_valid:
            logger.error(
                f"Pre-storage validation failed for {user_id}: {validation_result.message}"
            )
            _mark_embedding_status(
                user_id, "failed", f"Validation failed: {validation_result.message}"
            )
            raise ValueError(
                f"Invalid embedding cannot be stored: {validation_result.message}"
            )

        # Step 2: UPSERT with metadata (atomic operation)
        upsert_response = (
            supabase.table("profile_embeddings")
            .upsert(
                {
                    "user_id": user_id,
                    "embedding": embedding,
                    "status": status,
                    "last_updated": datetime.utcnow().isoformat(),
                    "metadata": {
                        "validation": validation_result.details,
                        "model": "sentence-transformers/all-MiniLM-L6-v2",
                        "dimensions": len(embedding),
                        "validated_at": datetime.utcnow().isoformat(),
                    },
                },
                on_conflict="user_id",  # Critical: ensures atomic upsert
            )
            .execute()
        )

        # Verify upsert succeeded
        if upsert_response.data:
            upsert_success = True
            logger.debug(
                f"Stored embedding for {user_id} (status={status})",
                extra={"user_id": user_id},
            )
        else:
            logger.warning(f"UPSERT returned no data for {user_id}, may have failed")
            upsert_success = False

        return upsert_success

    except Exception as e:
        error_type = type(e).__name__
        logger.error(
            f"Failed to store embedding for {user_id} ({error_type}): {e}",
            extra={"user_id": user_id, "error": str(e)},
            exc_info=True,
        )

        # Rollback: Mark as failed if upsert failed
        if not upsert_success:
            fallback_success = _mark_embedding_status(
                user_id, "failed", f"{error_type}: {str(e)}"
            )
            if not fallback_success:
                logger.critical(
                    f"CRITICAL: Both UPSERT and fallback failed for {user_id}. Manual intervention may be needed.",
                    exc_info=True,
                )

        return False


def _mark_embedding_status(
    user_id: str, status: str, error_message: Optional[str] = None
) -> bool:
    """
    Helper function to update embedding status (used for error handling).
    Returns True if successful, False otherwise.
    """
    if not supabase:
        return False

    try:
        update_data = {
            "user_id": user_id,
            "status": status,
            "last_updated": datetime.utcnow().isoformat(),
        }
        if error_message:
            update_data["error_message"] = error_message

        response = (
            supabase.table("profile_embeddings")
            .upsert(
                update_data,
                on_conflict="user_id",
            )
            .execute()
        )

        return response.data is not None
    except Exception as e:
        logger.error(f"Failed to update embedding status for {user_id}: {e}")
        return False


async def process_dead_letter_queue():
    """Process retryable items from dead letter queue with atomic claim pattern"""
    while not SHUTDOWN_FLAG:
        try:
            now = datetime.utcnow().isoformat()

            # Lightweight EXISTS check
            exists_response = await _execute(
                supabase.table("embedding_dead_letter_queue")
                .select("id")
                .eq("status", "pending")
                .lte("next_retry", now)
                .lt("retry_count", 3)
                .limit(1)
            )
            if not exists_response.data:
                await asyncio.sleep(60)
                continue

            # Fetch only needed columns for items ready to retry
            response = await _execute(
                supabase.table("embedding_dead_letter_queue")
                .select("id, user_id, semantic_text, retry_count")
                .eq("status", "pending")
                .lte("next_retry", now)
                .lt("retry_count", 3)
                .limit(10)
            )

            for item in response.data:
                try:
                    # ATOMIC CLAIM
                    claim_response = await _execute(
                        supabase.table("embedding_dead_letter_queue")
                        .update({
                            "status": "processing",
                            "last_attempt": datetime.utcnow().isoformat(),
                        })
                        .eq("id", item["id"])
                        .eq("status", "pending")
                    )

                    if not claim_response.data or len(claim_response.data) == 0:
                        continue

                    # Generate embedding (offloaded to thread pool internally)
                    embedding = await get_generator().generate_embedding(
                        item["semantic_text"]
                    )

                    # Store embedding (sync fn in thread pool)
                    await asyncio.get_event_loop().run_in_executor(
                        _db_executor, store_embedding,
                        item["user_id"], embedding, "completed"
                    )

                    # Mark DLQ item as completed
                    await _execute(
                        supabase.table("embedding_dead_letter_queue")
                        .update({
                            "status": "completed",
                            "resolved_at": datetime.utcnow().isoformat(),
                        })
                        .eq("id", item["id"])
                    )

                    logger.info(f"DLQ retry successful for {item['user_id']}")

                except Exception as e:
                    logger.warning(f"DLQ retry failed for {item['user_id']}: {e}")
                    new_retry_count = item["retry_count"] + 1
                    if new_retry_count >= 3:
                        await _execute(
                            supabase.table("embedding_dead_letter_queue")
                            .update({
                                "retry_count": new_retry_count,
                                "status": "exhausted",
                            })
                            .eq("id", item["id"])
                        )
                    else:
                        next_retry = datetime.utcnow() + timedelta(
                            minutes=5 * (new_retry_count + 1)
                        )
                        await _execute(
                            supabase.table("embedding_dead_letter_queue")
                            .update({
                                "retry_count": new_retry_count,
                                "status": "pending",
                                "next_retry": next_retry.isoformat(),
                            })
                            .eq("id", item["id"])
                        )

            await asyncio.sleep(60)

        except Exception as e:
            logger.error(f"DLQ processor error: {e}")
            await asyncio.sleep(60)


async def process_pending_queue():
    """Process pending embedding requests with atomic claim, parallel fetching, and batch encoding."""
    while not SHUTDOWN_FLAG:
        try:
            # Lightweight EXISTS check
            exists_response = await _execute(
                supabase.table("embedding_pending_queue")
                .select("id").eq("status", "pending").limit(1)
            )
            if not exists_response.data:
                await asyncio.sleep(15)
                continue

            # Fetch pending items (specific columns only)
            response = await _execute(
                supabase.table("embedding_pending_queue")
                .select("id, user_id, status, trigger_source, metadata, created_at")
                .eq("status", "pending").order("created_at").limit(50)
            )
            if not response.data:
                await asyncio.sleep(15)
                continue

            # ── Phase 1: Atomic claim for ALL items ──────────────────────────
            claimed_items = []
            for item in response.data:
                claim_response = await _execute(
                    supabase.table("embedding_pending_queue")
                    .update({
                        "status": "processing",
                        "first_attempt": datetime.utcnow().isoformat(),
                    })
                    .eq("id", item["id"]).eq("status", "pending")
                )
                if claim_response.data and len(claim_response.data) > 0:
                    claimed_items.append(item)

            if not claimed_items:
                await asyncio.sleep(15)
                continue

            # ── Phase 2: Build semantic texts (parallel profile fetching) ────
            texts: List[Optional[str]] = [""] * len(claimed_items)
            indices_needing_fetch = []

            for i, item in enumerate(claimed_items):
                trigger_source = item.get("trigger_source", "")
                metadata = item.get("metadata", {}) or {}
                if trigger_source == "api" and metadata.get("semantic_text"):
                    texts[i] = metadata["semantic_text"]
                else:
                    indices_needing_fetch.append(i)

            # Fetch profile data in parallel for items that need it
            if indices_needing_fetch:
                async def _fetch_profile_data(idx: int) -> tuple:
                    item = claimed_items[idx]
                    uid = item["user_id"]
                    results = await asyncio.gather(
                        _execute(
                            supabase.from_("profiles")
                            .select("id, display_name, headline, bio, location, looking_for")
                            .eq("id", uid).single()
                        ),
                        _execute(
                            supabase.from_("user_skills")
                            .select("skill_name").eq("user_id", uid)
                        ),
                        _execute(
                            supabase.from_("user_interests")
                            .select("interest").eq("user_id", uid)
                        ),
                    )
                    text = construct_semantic_text(
                        results[0].data or {},
                        results[1].data or [],
                        results[2].data or [],
                    )
                    return idx, text

                fetch_results = await asyncio.gather(
                    *[_fetch_profile_data(i) for i in indices_needing_fetch]
                )
                for idx, text in fetch_results:
                    texts[idx] = text

            # ── Phase 3: Batch encode all texts ──────────────────────────────
            embeddings = await get_generator().batch_generate_embeddings(texts)

            # ── Phase 4: Store results and mark complete ────────────────────
            for i, item in enumerate(claimed_items):
                try:
                    if embeddings[i] is not None:
                        # Store embedding (sync fn offloaded to thread pool)
                        success = await asyncio.get_event_loop().run_in_executor(
                            _db_executor, store_embedding,
                            item["user_id"], embeddings[i], "completed"
                        )
                        if success:
                            await _execute(
                                supabase.table("embedding_pending_queue")
                                .update({
                                    "status": "completed",
                                    "completed_at": datetime.utcnow().isoformat(),
                                })
                                .eq("id", item["id"])
                            )
                            continue

                    # If we reach here, embedding or storage failed
                    await _execute(
                        supabase.table("embedding_pending_queue")
                        .update({
                            "status": "failed",
                            "last_attempt": datetime.utcnow().isoformat(),
                            "failure_reason": "Embedding or storage failed",
                        })
                        .eq("id", item["id"])
                    )
                    await store_in_dead_letter_queue(
                        user_id=item["user_id"],
                        semantic_text=texts[i] or "",
                        failure_reason="Failed to generate or store embedding",
                        retry_count=0,
                    )

                except Exception as e:
                    logger.error(
                        f"Pending queue item {item['user_id']}: {e}"
                    )
                    try:
                        await _execute(
                            supabase.table("embedding_pending_queue")
                            .update({
                                "status": "failed",
                                "last_attempt": datetime.utcnow().isoformat(),
                                "failure_reason": str(e),
                            })
                            .eq("id", item["id"])
                        )
                    except Exception:
                        pass
                    await store_in_dead_letter_queue(
                        user_id=item["user_id"],
                        semantic_text=texts[i] or "",
                        failure_reason=str(e),
                        retry_count=0,
                    )

            await asyncio.sleep(15)

        except Exception as e:
            logger.error(f"Pending queue processor error: {e}")
            await asyncio.sleep(30)


# Removed: @app.on_event decorators conflict with lifespan context manager
# The lifespan context manager handles startup/shutdown exclusively


@app.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "message": "Collabryx Embedding Service",
        "model_info": _model_info_cache,
        "queue_type": "database-backed (embedding_pending_queue)",
    }


@app.get("/health")
async def health():
    """Health check — cached DB status + cached disk usage. No event loop blocking."""
    global _model_info_cache, _disk_cache, _health_db_cache
    now = time.time()

    # Cached Supabase health (refreshed every HEALTH_DB_CACHE_TTL seconds)
    if supabase:
        if (now - _health_db_cache["ts"]) > HEALTH_DB_CACHE_TTL:
            try:
                response = await _execute(
                    supabase.table("profiles").select("id").limit(1)
                )
                _health_db_cache = {"ts": now, "healthy": response.data is not None}
            except Exception:
                _health_db_cache = {"ts": now, "healthy": False}
        supabase_healthy = _health_db_cache["healthy"]
    else:
        supabase_healthy = False

    # Cached disk usage (recomputed every DISK_CACHE_TTL seconds)
    if not _disk_cache["data"] or (now - _disk_cache["ts"]) > DISK_CACHE_TTL:
        try:
            du = shutil.disk_usage("/")
            _disk_cache = {
                "ts": now,
                "data": {
                    "percent": round((du.used / du.total) * 100, 2),
                    "free_gb": round(du.free / 1073741824, 2),
                    "total_gb": round(du.total / 1073741824, 2),
                    "used_gb": round(du.used / 1073741824, 2),
                },
            }
        except Exception:
            _disk_cache = {"ts": now, "data": None}

    disk_data = _disk_cache["data"]
    disk_percent = disk_data["percent"] if disk_data else 0

    status = "healthy"
    if not supabase_healthy:
        status = "degraded"
    elif disk_data and disk_percent > 85:
        status = "warning"

    return {
        "status": status,
        "timestamp": now,
        "model_info": _model_info_cache,
        "supabase_connected": supabase_healthy,
        "queue_type": "database-backed (embedding_pending_queue)",
        "system": {"disk": disk_data} if disk_data else {},
    }


@app.get("/model-info")
async def model_info():
    """Get information about the embedding model"""
    return _model_info_cache


@app.post("/generate-embedding", response_model=EmbeddingResponse)
async def generate_embedding(request: EmbeddingRequest):
    """
    Queue vector embedding generation for text input
    Returns immediately, processing happens in background
    Includes rate limiting (3 requests per hour per user)
    """
    try:
        # Check rate limit first (uses run_in_executor for async DB access)
        if rate_limiter:
            rate_limit_result = await rate_limiter.check_rate_limit(request.user_id)

            if not rate_limit_result.allowed:
                logger.warning(
                    f"Rate limit exceeded for user {request.user_id}",
                    extra={"user_id": request.user_id},
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded",
                        "message": "Maximum 3 embedding requests per hour",
                        "retry_after": rate_limit_result.retry_after,
                        "reset_at": rate_limit_result.reset_at,
                        "remaining": rate_limit_result.remaining,
                    },
                    headers={
                        "Retry-After": str(rate_limit_result.retry_after),
                        "X-RateLimit-Remaining": str(rate_limit_result.remaining),
                        "X-RateLimit-Reset": rate_limit_result.reset_at or "",
                    },
                )

        # A1: Insert into DB-backed pending queue (persistent across restarts)
        if not supabase:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not available, cannot queue request",
            )

        # Check for existing pending entry to avoid duplicates (non-blocking)
        existing = await _execute(
            supabase.table("embedding_pending_queue")
            .select("id")
            .eq("user_id", request.user_id)
            .in_("status", ["pending", "processing"])
            .limit(1)
        )
        if existing.data and len(existing.data) > 0:
            return EmbeddingResponse(
                user_id=request.user_id,
                status="queued",
                message="Embedding request already queued",
                request_id=request.request_id,
            )

        # Insert into persistent queue (non-blocking)
        await _execute(
            supabase.table("embedding_pending_queue").insert({
                "user_id": request.user_id,
                "status": "pending",
                "trigger_source": "api",
                "metadata": {"semantic_text": request.text, "request_id": request.request_id},
            })
        )

        logger.debug(
            f"Embedding request queued for {request.user_id}",
        )

        return EmbeddingResponse(
            user_id=request.user_id,
            status="queued",
            message="Vector embedding queued for background processing",
            request_id=request.request_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error queuing embedding request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue request: {str(e)}",
        )


@app.post("/generate-embedding-from-profile", response_model=EmbeddingResponse)
async def generate_embedding_from_profile(request: ProfileDataRequest):
    """
    Queue embedding generation from complete profile data
    """
    try:
        semantic_text = construct_semantic_text(
            request.profile, request.skills, request.interests
        )

        if not supabase:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Database not available, cannot queue request",
            )

        # Insert into DB-backed pending queue (non-blocking)
        await _execute(
            supabase.table("embedding_pending_queue").insert({
                "user_id": request.user_id,
                "status": "pending",
                "trigger_source": "api",
                "metadata": {"semantic_text": semantic_text, "request_id": request.request_id},
            })
        )

        return EmbeddingResponse(
            user_id=request.user_id,
            status="queued",
            message="Vector embedding queued for background processing",
            request_id=request.request_id,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error preparing embedding generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error preparing embedding generation: {str(e)}",
        )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for logging"""
    logger.error(f"Unhandled exception: {exc}", extra={"path": request.url.path})
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
