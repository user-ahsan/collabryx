"""
Collabryx Feed Scoring Service
FastAPI server for personalised feed ranking using Thompson Sampling.

Routes
──────
- ``GET  /health``      — Health check (returns {"status": "healthy"})
- ``POST /score-by-id`` — Score a single post for a user context
- ``POST /score-feed``  — Score a batch of posts, sorted by relevance
- ``POST /persist``     — Persist scored results to the ``feed_scores`` table

Dependencies
────────────
- ``shared.db`` — Supabase client factory (reused across microservices)
- ``shared.middleware`` — CORS and API-key auth middleware
- ``shared.logging_config`` — Structured JSON logging setup
"""

from __future__ import annotations

import asyncio
import logging
import os
import signal
from contextlib import asynccontextmanager
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from pathlib import Path

from scorer import score_post, score_feed, persist_scores

# ── Environment ─────────────────────────────────────────────────────────────────
# Load root .env FIRST (has NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).
# Then python-worker/.env SECOND (overrides for worker-specific values).
_root_env = Path(__file__).resolve().parent.parent.parent / ".env"
if _root_env.exists():
    load_dotenv(dotenv_path=_root_env, override=False)
load_dotenv(override=False)  # python-worker/.env overrides (if present)

# ── Logging ─────────────────────────────────────────────────────────────────────
from shared.logging_config import configure_logging

configure_logging()
logger = logging.getLogger(__name__)

# ── Supabase client ─────────────────────────────────────────────────────────────
from shared.db import init_supabase, get_client

supabase = None
SHUTDOWN_FLAG = False


# ── Lifespan ────────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialise Supabase client on startup, gracefully tear down on shutdown."""
    global supabase, SHUTDOWN_FLAG

    # Register signal handlers for graceful shutdown (Unix only)
    try:
        loop = asyncio.get_event_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, lambda s=sig: set_shutdown_flag(s))
    except (NotImplementedError, AttributeError):
        logger.info("Signal handlers not available on this platform")

    # Initialise Supabase
    try:
        supabase = init_supabase()
        logger.info("Supabase client initialised successfully")
    except RuntimeError as exc:
        logger.warning("Supabase init skipped (will degrade gracefully): %s", exc)
        supabase = None

    logger.info("=" * 50)
    logger.info("FEED SERVICE STARTED")
    logger.info("=" * 50)

    yield

    SHUTDOWN_FLAG = True
    logger.info("=" * 50)
    logger.info("FEED SERVICE SHUTDOWN COMPLETE")
    logger.info("=" * 50)


def set_shutdown_flag(sig):
    """Set the shutdown flag when a termination signal is received."""
    global SHUTDOWN_FLAG
    sig_name = signal.Signals(sig).name
    logger.info("Received %s signal — initiating graceful shutdown", sig_name)
    SHUTDOWN_FLAG = True


# ── FastAPI app ─────────────────────────────────────────────────────────────────
app = FastAPI(
    title="Collabryx Feed Scoring Service",
    description="Thompson Sampling + hybrid scoring for personalised feed ranking",
    version="1.0.0",
    lifespan=lifespan,
)

# ── Middleware ───────────────────────────────────────────────────────────────────
from shared.middleware import add_cors_middleware, api_key_auth

add_cors_middleware(app)
app.middleware("http")(api_key_auth)


# ── Pydantic models ─────────────────────────────────────────────────────────────


class ScoreByIdRequest(BaseModel):
    """Request body for ``POST /score-by-id``.

    Matches the ``FeedScorerInput`` schema from the TypeScript source
    (``lib/services/feed-scorer.ts`` lines 43–51).
    """

    post_id: str = Field(..., description="Unique identifier for the post")
    semantic: float = Field(..., ge=0.0, le=1.0, description="Semantic similarity score (0–1)")
    engagement_successes: int = Field(..., ge=0, description="Past engagement successes")
    engagement_failures: int = Field(..., ge=0, description="Past engagement failures")
    hours_old: float = Field(..., ge=0.0, description="Age of the post in hours")
    is_connected: bool = Field(..., description="Whether the user is connected to the author")
    has_shared_interests: bool = Field(..., description="Whether user shares interests with author")
    intent_match: bool = Field(..., description="Whether the post matches user intent")


class FeedPostParams(BaseModel):
    """Scoring parameters for a single post in a batch feed request."""

    post_id: str = Field(..., description="Unique identifier for the post")
    semantic: float = Field(..., ge=0.0, le=1.0)
    engagement_successes: int = Field(..., ge=0)
    engagement_failures: int = Field(..., ge=0)
    hours_old: float = Field(..., ge=0.0)
    is_connected: bool = Field(...)
    has_shared_interests: bool = Field(...)
    intent_match: bool = Field(...)

    def to_scorer_input(self) -> dict[str, Any]:
        """Convert to the dict format expected by ``scorer.score_post()``."""
        return {
            "postId": self.post_id,
            "params": {
                "semantic": self.semantic,
                "engagement_successes": self.engagement_successes,
                "engagement_failures": self.engagement_failures,
                "hours_old": self.hours_old,
                "is_connected": self.is_connected,
                "has_shared_interests": self.has_shared_interests,
                "intent_match": self.intent_match,
            },
        }


class ScoreFeedRequest(BaseModel):
    """Request body for ``POST /score-feed``."""

    posts: list[FeedPostParams] = Field(..., min_length=1, description="List of posts to score")


class PersistRequest(BaseModel):
    """Request body for ``POST /persist``.

    Takes a list of scored post results (as returned by ``/score-by-id`` or
    ``/score-feed``) and a user ID to persist under.
    """

    scores: list[dict[str, Any]] = Field(
        ..., description="List of scored post dicts (output from scoring endpoints)"
    )
    user_id: str = Field(..., description="User ID to persist scores for")

    @field_validator("scores")
    @classmethod
    def validate_scores(cls, v):
        if not v:
            raise ValueError("scores list must not be empty")
        for i, s in enumerate(v):
            if "post_id" not in s:
                raise ValueError(f"scores[{i}]: missing required field 'post_id'")
            if "score" not in s:
                raise ValueError(f"scores[{i}]: missing required field 'score'")
        return v


# ── Routes ──────────────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    """Health check endpoint.

    Returns a simple ``{"status": "healthy"}`` response. This endpoint is exempt
    from API-key authentication so that Docker HEALTHCHECK works without
    credentials.
    """
    return {"status": "healthy"}


@app.post("/score-by-id")
async def score_by_id(request: ScoreByIdRequest):
    """Score a single post for a given user context.

    Accepts the same parameters as the TypeScript ``scorePostForUser()``
    function and returns a ``ScoredPost``-compatible response.
    """
    try:
        params = {
            "semantic": request.semantic,
            "engagement_successes": request.engagement_successes,
            "engagement_failures": request.engagement_failures,
            "hours_old": request.hours_old,
            "is_connected": request.is_connected,
            "has_shared_interests": request.has_shared_interests,
            "intent_match": request.intent_match,
        }
        result = score_post(request.post_id, params)
        return result
    except Exception as exc:
        logger.exception("Failed to score post %s", request.post_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Scoring failed: {exc}",
        )


@app.post("/score-feed")
async def score_feed_endpoint(request: ScoreFeedRequest):
    """Score a batch of posts, returned sorted by score descending.

    Accepts an array of posts with their scoring parameters and returns the
    scored results sorted by relevance (highest score first).
    """
    try:
        posts = [p.to_scorer_input() for p in request.posts]
        results = score_feed(posts)
        return results
    except Exception as exc:
        logger.exception("Failed to score feed batch")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Feed scoring failed: {exc}",
        )


@app.post("/persist")
async def persist(request: PersistRequest):
    """Persist scored feed results to the ``feed_scores`` table.

    Upserts on conflict ``(user_id, post_id)`` to allow incremental updates.
    """
    global supabase

    if supabase is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database not available — Supabase client not initialised",
        )

    try:
        result = await persist_scores(
            supabase_client=supabase,
            user_id=request.user_id,
            scores=request.scores,
        )
        return result
    except Exception as exc:
        logger.exception("Failed to persist scores for user %s", request.user_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Persistence failed: {exc}",
        )


# ── Exception handlers ──────────────────────────────────────────────────────────


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all exception handler that logs and returns a 500."""
    logger.exception("Unhandled exception on %s", request.url.path)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )


# ── Entry point ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
