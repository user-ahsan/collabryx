"""
Collabryx Match Service
FastAPI server for generating match suggestions using vector similarity
(scoped to this service only — embedding generation runs in the embedding service).

── ENDPOINTS ───────────────────────────────────────────────────────────────────
POST /generate          Generate match suggestions for a single user
POST /generate-batch    Generate matches for multiple users
GET  /health            Liveness probe with DB connectivity check

── SHARED MODULES ─────────────────────────────────────────────────────────────
All DB I/O uses shared.db.execute() which dispatches queries through a dedicated
ThreadPoolExecutor (never blocks the event loop).  Auth uses the standard
shared.middleware.api_key_auth middleware with X-Worker-API-Key header.
"""

from __future__ import annotations

import asyncio
import logging
import os
import signal
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Configure structured JSON logging first (before any other imports that
# might trigger loggers like httpx or uvicorn.access).
from shared.logging_config import configure_logging

configure_logging()
logger = logging.getLogger(__name__)

# ── Environment ───────────────────────────────────────────────────────────────
# Load root .env FIRST (has NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY).
# Then python-worker/.env SECOND (overrides for worker-specific SUPABASE_URL).
# This ensures all env vars are found regardless of working directory.
_root_env = Path(__file__).resolve().parent.parent / ".env"
if _root_env.exists():
    load_dotenv(dotenv_path=_root_env, override=False)
load_dotenv(override=False)

from shared.db import init_supabase, execute
from shared.middleware import add_cors_middleware, api_key_auth

from generator import generate_matches_for_user, generate_batch_matches
from learner import refresh_learned_data


# ── Module-level state ────────────────────────────────────────────────────────
supabase = None
SHUTDOWN_FLAG = False
learner_task = None


def signal_handler(signum: int, frame) -> None:  # type: ignore[type-arg]
    """Set the shutdown flag for graceful termination."""
    global SHUTDOWN_FLAG
    sig_name = signal.Signals(signum).name
    logger.info("Received %s signal — initiating graceful shutdown", sig_name)
    SHUTDOWN_FLAG = True


# ── Lifespan ──────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle with graceful shutdown."""
    # pylint: disable=global-statement
    global supabase

    # Register signal handlers (Unix only — Windows uses win32 events)
    try:
        loop = asyncio.get_event_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, signal_handler, sig, None)
        logger.info("Signal handlers registered for SIGTERM and SIGINT")
    except NotImplementedError:
        logger.info("Signal handlers not available on this platform (Windows)")

    # Initialise Supabase inside lifespan (not at module level) so that
    # missing env vars are caught early rather than causing silent degradation.
    try:
        supabase = init_supabase()
        logger.info("Supabase client initialised successfully")
    except RuntimeError as exc:
        logger.critical("Failed to initialise Supabase: %s", exc)
        supabase = None

    logger.info("=" * 60)
    logger.info("MATCH SERVICE STARTED")
    logger.info("=" * 60)

    # ── Start background learner refresh ──────────────────────────────────────
    async def refresh_learner_periodically():
        """Refresh learned algorithm data every hour."""
        while not SHUTDOWN_FLAG:
            try:
                result = await refresh_learned_data(supabase)
                logger.info(
                    "Learner refresh complete: %d pairs learned, %d weights updated",
                    result.get("pairs_learned", 0),
                    result.get("weights_updated", 0),
                )
            except Exception as exc:
                logger.warning("Learner refresh failed (will retry): %s", exc)
            # Wait 1 hour before next refresh
            for _ in range(60):
                if SHUTDOWN_FLAG:
                    break
                await asyncio.sleep(60)

    global learner_task
    learner_task = asyncio.create_task(refresh_learner_periodically())
    logger.info("Background learner refresh started (every 60 min)")

    yield  # ── Application runs here ──

    # ── Graceful shutdown ──────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("MATCH SERVICE SHUTTING DOWN")
    logger.info("=" * 60)
    global SHUTDOWN_FLAG  # noqa: PLW0602 — Python 3.11 needs explicit global
    SHUTDOWN_FLAG = True

    # Cancel background learner task
    if learner_task:
        learner_task.cancel()
        logger.info("Background learner task cancelled")

    if supabase:
        supabase = None
        logger.info("Supabase client released")


# ── FastAPI app ───────────────────────────────────────────────────────────────

app = FastAPI(
    title="Collabryx Match Service",
    description="Generate match suggestions using complementary skill-gap matching with data-learned weights",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — reads ALLOWED_ORIGINS env var, defaults to http://localhost:3000
add_cors_middleware(app)

# API-key auth middleware — exempts /health, /metrics, /
app.middleware("http")(api_key_auth)


# =====================================================
# PYDANTIC MODELS
# =====================================================


class GenerateRequest(BaseModel):
    """POST /generate request body."""

    user_id: str = Field(..., description="User ID to generate matches for", min_length=1)
    limit: int = Field(20, ge=1, le=100, description="Maximum suggestions to return")
    min_score: int = Field(50, ge=0, le=100, description="Minimum match percentage threshold")


class GenerateBatchRequest(BaseModel):
    """POST /generate-batch request body."""

    user_ids: Optional[list[str]] = Field(None, description="User IDs to process (omit for all users)")
    limit_per_user: int = Field(20, ge=1, le=100, description="Max suggestions per user")


# =====================================================
# ROUTES
# =====================================================


@app.post("/generate")
async def generate(req: GenerateRequest) -> dict:
    """Generate match suggestions for a single user.

    Fetches the user's embedding, computes cosine similarity against all
    other users, applies weighted scoring, and persists top matches.

    Returns:
        Dict with success, suggestions list, and matches_generated count.
    """
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    try:
        result = await generate_matches_for_user(
            supabase,
            req.user_id,
            limit=req.limit,
            min_score=req.min_score,
        )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Match generation failed for user %s", req.user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Match generation failed: {exc}",
        )


@app.post("/generate-batch")
async def generate_batch(req: GenerateBatchRequest) -> dict:
    """Generate match suggestions for multiple users.

    Processes users sequentially.  If ``user_ids`` is omitted, fetches all
    users with completed embeddings from the database.

    Returns:
        Dict with status, users_count, and processed_count.
    """
    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available",
        )

    try:
        result = await generate_batch_matches(
            supabase,
            user_ids=req.user_ids,
            limit_per_user=req.limit_per_user,
        )
        return result
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Batch match generation failed")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Batch match generation failed: {exc}",
        )


@app.get("/health")
async def health() -> dict:
    """Health check with cached Supabase connectivity check.

    Returns:
        Dict with status and supabase_connected flag.
    """
    db_healthy = False
    if supabase:
        try:
            response = await execute(
                supabase.from_("profiles").select("id").limit(1)
            )
            db_healthy = response.data is not None
        except Exception:
            db_healthy = False

    return {
        "status": "healthy" if db_healthy else "degraded",
        "supabase_connected": db_healthy,
    }


@app.get("/")
async def root() -> dict:
    """Root endpoint with service info."""
    return {
        "message": "Collabryx Match Service",
        "docs": "/docs",
    }


# =====================================================
# GLOBAL EXCEPTION HANDLER
# =====================================================


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Catch-all exception handler — logs and returns 500."""
    logger.error("Unhandled exception at %s: %s", request.url.path, exc)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# =====================================================
# ENTRY POINT
# =====================================================

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
