"""
Collabryx Notification Service
FastAPI server for sending and managing user notifications.
Routes: /send, /send-bulk, /digest, /cleanup, /health.
"""

import logging
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from shared.db import init_supabase, execute, get_client
from shared.logging_config import configure_logging
from shared.middleware import add_cors_middleware, api_key_auth

from sender import (
    NotificationInput,
    send_notification,
    send_bulk_notifications,
)
from digester import generate_digest
from cleaner import cleanup_expired_notifications

# ── Load environment variables (root .env first, then python-worker/.env) ─────
_root_env = Path(__file__).resolve().parent.parent / ".env"
if _root_env.exists():
    load_dotenv(dotenv_path=_root_env, override=False)
load_dotenv(override=False)

# ── Logging ───────────────────────────────────────────────────────────────────
configure_logging()
logger = logging.getLogger(__name__)


# ── Request Models ────────────────────────────────────────────────────────────


class SendBulkRequest(BaseModel):
    """Wrapper for bulk notification payload — accepts camelCase JSON."""
    inputs: list[NotificationInput]


class DigestRequest(BaseModel):
    """Optional parameters for digest generation."""
    date: Optional[str] = None
    batchSize: Optional[int] = Field(default=100, ge=1, le=1000)
    dryRun: Optional[bool] = False


class CleanupRequest(BaseModel):
    """Optional parameters for notification cleanup."""
    olderThanDays: Optional[int] = Field(default=30, ge=1)
    batchSize: Optional[int] = Field(default=500, ge=1, le=5000)
    dryRun: Optional[bool] = False
    userId: Optional[str] = None


# ── Lifespan ──────────────────────────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle — startup and shutdown."""
    logger.info("=" * 60)
    logger.info("NOTIFICATION SERVICE STARTING UP")
    logger.info("=" * 60)

    try:
        init_supabase()
        logger.info("Supabase client initialised successfully")
    except RuntimeError as e:
        logger.error("Failed to initialise Supabase: %s", e)

    yield

    logger.info("=" * 60)
    logger.info("NOTIFICATION SERVICE SHUTDOWN COMPLETE")
    logger.info("=" * 60)


# ── FastAPI Application ───────────────────────────────────────────────────────

app = FastAPI(
    title="Collabryx Notification Service",
    description="Send and manage user notifications",
    version="1.0.0",
    lifespan=lifespan,
)

add_cors_middleware(app)
app.middleware("http")(api_key_auth)


# ── Routes ────────────────────────────────────────────────────────────────────


@app.get("/health")
async def health():
    """Health check — validates Supabase connectivity."""
    supabase_connected = False
    try:
        client = get_client()
        result = await execute(client.table("notifications").select("id").limit(1))
        supabase_connected = result.data is not None
    except Exception:
        supabase_connected = False

    return {
        "status": "healthy" if supabase_connected else "degraded",
        "supabase_connected": supabase_connected,
    }


@app.post("/send")
async def send(input_data: NotificationInput):
    """Send a single notification after preference checking."""
    client = get_client()
    return await send_notification(client, input_data)


@app.post("/send-bulk")
async def send_bulk(body: SendBulkRequest):
    """Send multiple notifications concurrently."""
    client = get_client()
    return await send_bulk_notifications(client, body.inputs)


@app.post("/digest")
async def digest(body: DigestRequest = DigestRequest()):
    """Generate daily digests from unread notifications."""
    client = get_client()
    return await generate_digest(client, body.model_dump())


@app.post("/cleanup")
async def cleanup(body: CleanupRequest = CleanupRequest()):
    """Delete expired notifications older than the configured threshold."""
    client = get_client()
    return await cleanup_expired_notifications(client, body.model_dump())


# ── Global Exception Handler ──────────────────────────────────────────────────


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch-all: log and return 500."""
    logger.error("Unhandled exception on %s: %s", request.url.path, exc)
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
