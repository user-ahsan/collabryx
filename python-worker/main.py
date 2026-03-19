"""
Collabryx Embedding Service
FastAPI server for generating semantic embeddings using Sentence Transformers
"""

from fastapi import FastAPI, HTTPException, status, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field, validator
from typing import Optional, List
import os
import time
import asyncio
import logging
import psutil
import shutil
from datetime import datetime, timedelta
import httpx
from contextlib import asynccontextmanager

# Prometheus metrics
from prometheus_client import (
    Counter,
    Histogram,
    Gauge,
    generate_latest,
    CONTENT_TYPE_LATEST,
)

from dotenv import load_dotenv
from supabase import create_client, Client

from embedding_generator import generator, construct_semantic_text
from rate_limiter import RateLimiter
from embedding_validator import EmbeddingValidator
from services.match_generator import MatchGenerator
from services.notification_engine import NotificationEngine
from services.activity_tracker import ActivityTracker
from services.content_moderator import ContentModerator
from services.ai_mentor_processor import AIMentorProcessor
from services.analytics_aggregator import AnalyticsAggregator

load_dotenv()

# Configure structured JSON logging
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}',
)
logger = logging.getLogger(__name__)

# Environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

# External API keys (optional - services have fallbacks)
PERSPECTIVE_API_KEY = os.getenv("PERSPECTIVE_API_KEY")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
HUGGING_FACE_TOKEN = os.getenv("HUGGING_FACE_TOKEN")


# Validate required environment variables
def validate_env_vars():
    required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {missing}")


# Initialize Supabase Client with timeout
supabase: Optional[Client] = None
if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    try:
        supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        logger.info("Supabase client initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize Supabase client: {e}")

# Initialize Rate Limiter
rate_limiter = RateLimiter(supabase) if supabase else None

# In-memory queue with bounded size
MAX_QUEUE_SIZE = 100
request_queue = asyncio.Queue(maxsize=MAX_QUEUE_SIZE)
processing_semaphore = asyncio.Semaphore(5)  # Max 5 concurrent generations

# Graceful shutdown flag
SHUTDOWN_FLAG = False

# =====================================================
# Prometheus Metrics
# =====================================================

# Request counter - tracks total HTTP requests
REQUEST_COUNTER = Counter(
    name="embedding_service_requests_total",
    documentation="Total number of HTTP requests",
    labelnames=["method", "endpoint", "status_code"],
)

# Request duration histogram - tracks request latency
REQUEST_DURATION = Histogram(
    name="embedding_service_request_duration_seconds",
    documentation="Request duration in seconds",
    labelnames=["method", "endpoint"],
    buckets=[0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1.0, 2.5, 5.0, 10.0],
)

# Queue size gauge - current queue depth
QUEUE_SIZE_GAUGE = Gauge(
    name="embedding_service_queue_size",
    documentation="Current number of items in the processing queue",
)

# Error counter - tracks failed requests
ERROR_COUNTER = Counter(
    name="embedding_service_errors_total",
    documentation="Total number of errors",
    labelnames=["error_type", "endpoint"],
)

# Processing speed gauge - embeddings generated per minute
PROCESSING_SPEED_GAUGE = Gauge(
    name="embedding_service_processing_speed",
    documentation="Number of embeddings processed per minute",
)

# Memory usage gauge
MEMORY_USAGE_GAUGE = Gauge(
    name="embedding_service_memory_usage_bytes",
    documentation="Current memory usage in bytes",
    labelnames=["type"],  # "process_rss", "process_vms", "system_available"
)

# DLQ size gauge
DLQ_SIZE_GAUGE = Gauge(
    name="embedding_service_dlq_size",
    documentation="Current number of items in dead letter queue",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle with graceful shutdown"""
    global SHUTDOWN_FLAG
    validate_env_vars()
    logger.info("=" * 60)
    logger.info("EMBEDDING SERVICE STARTING UP")
    logger.info("=" * 60)
    logger.info("Starting background queue processor...")
    processor_task = asyncio.create_task(queue_processor())
    logger.info("Starting DLQ processor...")
    dlq_processor_task = asyncio.create_task(process_dead_letter_queue())
    logger.info("Starting pending queue processor...")
    pending_queue_task = asyncio.create_task(process_pending_queue())
    logger.info("✓ All background tasks started successfully")
    logger.info("=" * 60)

    yield

    # Graceful shutdown
    logger.info("=" * 60)
    logger.info("SHUTTING DOWN EMBEDDING SERVICE")
    logger.info("=" * 60)
    SHUTDOWN_FLAG = True

    # Wait for queue to drain (with timeout)
    logger.info("Waiting for queue to drain (max 30s)...")
    try:
        await asyncio.wait_for(request_queue.join(), timeout=30.0)
        logger.info("✓ Queue drained successfully")
    except asyncio.TimeoutError:
        logger.warning("⚠️ Queue drain timeout - some items may be lost")

    # Cancel background tasks gracefully
    logger.info("Cancelling background tasks...")
    for task_name, task in [
        ("processor", processor_task),
        ("dlq", dlq_processor_task),
        ("pending", pending_queue_task),
    ]:
        task.cancel()
        try:
            await asyncio.wait_for(task, timeout=5.0)
            logger.info(f"✓ {task_name} task cancelled gracefully")
        except (asyncio.CancelledError, asyncio.TimeoutError):
            logger.warning(f"⚠️ {task_name} task forced to stop")

    logger.info("=" * 60)
    logger.info("EMBEDDING SERVICE SHUTDOWN COMPLETE")
    logger.info("=" * 60)


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
    allow_headers=["Authorization", "Content-Type"],
)


# =====================================================
# Metrics Middleware
# =====================================================


@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Middleware to track request metrics with Prometheus"""
    start_time = time.time()

    try:
        response = await call_next(request)

        # Record request counter
        REQUEST_COUNTER.labels(
            method=request.method,
            endpoint=request.url.path,
            status_code=response.status_code,
        ).inc()

        # Record request duration
        duration = time.time() - start_time
        REQUEST_DURATION.labels(
            method=request.method,
            endpoint=request.url.path,
        ).observe(duration)

        # Update queue size gauge
        QUEUE_SIZE_GAUGE.set(request_queue.qsize())

        # Update memory gauges
        process = psutil.Process(os.getpid())
        process_memory = process.memory_info()
        MEMORY_USAGE_GAUGE.labels(type="process_rss").set(process_memory.rss)
        MEMORY_USAGE_GAUGE.labels(type="process_vms").set(process_memory.vms)

        return response

    except Exception as e:
        # Record error counter
        ERROR_COUNTER.labels(
            error_type=type(e).__name__,
            endpoint=request.url.path,
        ).inc()

        # Update queue size gauge even on error
        QUEUE_SIZE_GAUGE.set(request_queue.qsize())

        raise


class EmbeddingRequest(BaseModel):
    """Request body for embedding generation"""

    text: str = Field(..., description="Text to embed (semantic profile string)")
    user_id: str = Field(..., description="User ID for tracking")
    request_id: Optional[str] = Field(
        None, description="Optional request ID for tracking"
    )

    @validator("text")
    def validate_text(cls, v):
        if not v or len(v.strip()) < 10:
            raise ValueError("Text must be at least 10 characters")
        if len(v) > 2000:
            raise ValueError("Text must not exceed 2000 characters")
        return v


class EmbeddingResponse(BaseModel):
    """Response body containing generated embedding"""

    user_id: str
    status: str = "success"
    message: Optional[str] = None
    embedding: Optional[List[float]] = None
    dimensions: Optional[int] = None
    model: Optional[str] = None
    request_id: Optional[str] = None
    processing_time_ms: Optional[float] = None


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
        supabase.table("embedding_dead_letter_queue").insert(
            {
                "user_id": user_id,
                "semantic_text": semantic_text,
                "failure_reason": failure_reason,
                "retry_count": retry_count,
                "next_retry": next_retry.isoformat(),
                "status": "pending" if retry_count < 3 else "exhausted",
            }
        ).execute()
        logger.info(f"✓ Stored in DLQ for {user_id}, retry {retry_count}/3")
        return True
    except Exception as e:
        logger.critical(
            f"CRITICAL: Failed to store in DLQ for {user_id}: {e}", exc_info=True
        )
        # Fallback: Try to update profile_embeddings status to failed at minimum
        try:
            supabase.table("profile_embeddings").upsert(
                {
                    "user_id": user_id,
                    "status": "failed",
                    "error_message": f"DLQ storage failed: {str(e)}",
                    "last_updated": datetime.utcnow().isoformat(),
                },
                on_conflict="user_id",
            ).execute()
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
    """Store embedding in Supabase with validation metadata using UPSERT to avoid race conditions"""
    if not supabase:
        logger.warning(
            f"Supabase client not initialized. Cannot store embedding for {user_id}"
        )
        return False

    try:
        validation_result = EmbeddingValidator.validate(embedding)

        if not validation_result.is_valid:
            logger.error(
                f"Pre-storage validation failed for {user_id}: {validation_result.message}"
            )
            raise ValueError(
                f"Invalid embedding cannot be stored: {validation_result.message}"
            )

        # Normalize to 384 dimensions
        target_dim = 384
        if len(embedding) < target_dim:
            embedding = embedding + [0.0] * (target_dim - len(embedding))
        elif len(embedding) > target_dim:
            embedding = embedding[:target_dim]

        # UPSERT: Insert or update based on user_id constraint
        # This eliminates the race condition from check-then-insert pattern
        supabase.table("profile_embeddings").upsert(
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
            on_conflict="user_id",  # Critical: specify conflict column for UPSERT
        ).execute()

        logger.info(
            f"Successfully stored embedding for {user_id} (status={status})",
            extra={"user_id": user_id},
        )
        return True

    except Exception as e:
        logger.error(
            f"Failed to store embedding for {user_id}: {e}",
            extra={"user_id": user_id, "error": str(e)},
            exc_info=True,
        )
        # Try to mark as failed
        # Try to mark as failed (with UPSERT to avoid duplicate key errors)
        try:
            supabase.table("profile_embeddings").upsert(
                {
                    "user_id": user_id,
                    "status": "failed",
                    "error_message": str(e),
                    "last_updated": datetime.utcnow().isoformat(),
                },
                on_conflict="user_id",
            ).execute()
        except Exception as inner_e:
            logger.error(f"Failed to update error status for {user_id}: {inner_e}")
        return False


async def generate_and_store_embedding(
    text: str, user_id: str, request_id: Optional[str] = None
):
    """Async function to generate and save embedding with retry logic"""
    async with processing_semaphore:
        try:
            logger.info(
                f"Generating embedding for {user_id}",
                extra={"user_id": user_id, "request_id": request_id},
            )
            start_time = time.time()

            embedding = await generator.generate_embedding(text)
            elapsed_ms = (time.time() - start_time) * 1000

            success = store_embedding(user_id, embedding, "completed")

            if success:
                logger.info(
                    f"Embedding generated successfully for {user_id}",
                    extra={
                        "user_id": user_id,
                        "request_id": request_id,
                        "processing_time_ms": elapsed_ms,
                        "dimensions": len(embedding),
                    },
                )
            else:
                logger.error(
                    f"Failed to store embedding for {user_id}",
                    extra={"user_id": user_id},
                )

        except Exception as e:
            logger.error(
                f"Embedding generation failed for {user_id}: {e}",
                extra={"user_id": user_id, "request_id": request_id, "error": str(e)},
            )

            # Get existing retry count if available
            existing_retry_count = 0
            if supabase:
                try:
                    retry_response = (
                        supabase.table("embedding_dead_letter_queue")
                        .select("retry_count")
                        .eq("user_id", user_id)
                        .order("created_at", desc=True)
                        .limit(1)
                        .execute()
                    )
                    if retry_response.data and len(retry_response.data) > 0:
                        existing_retry_count = retry_response.data[0].get(
                            "retry_count", 0
                        )
                except Exception:
                    pass

            # Store in DLQ for retry
            await store_in_dead_letter_queue(
                user_id=user_id,
                semantic_text=text,
                failure_reason=str(e),
                retry_count=existing_retry_count,
            )

            # Update status to failed
            if supabase:
                try:
                    supabase.table("profile_embeddings").upsert(
                        {
                            "user_id": user_id,
                            "status": "failed",
                            "last_updated": datetime.utcnow().isoformat(),
                        }
                    ).execute()
                except Exception as inner_e:
                    logger.error(
                        f"Failed to update error status for {user_id}: {inner_e}"
                    )


async def queue_processor():
    """Background task to process queue with graceful shutdown support"""
    global SHUTDOWN_FLAG
    logger.info("Queue processor loop started")
    while not SHUTDOWN_FLAG:
        try:
            # Use timeout to check shutdown flag periodically
            try:
                text, user_id, request_id = await asyncio.wait_for(
                    request_queue.get(), timeout=1.0
                )
            except asyncio.TimeoutError:
                continue  # Check SHUTDOWN_FLAG

            logger.info(f"Queue processor picked up request for user {user_id}")
            await generate_and_store_embedding(text, user_id, request_id)
            request_queue.task_done()
        except Exception as e:
            if SHUTDOWN_FLAG:
                logger.info("Queue processor stopping due to shutdown")
                break
            logger.error(f"Queue processor error: {e}")


async def process_dead_letter_queue():
    """Process retryable items from dead letter queue"""
    while True:
        try:
            now = datetime.utcnow().isoformat()

            # Get items ready for retry
            response = (
                supabase.table("embedding_dead_letter_queue")
                .select("*")
                .eq("status", "pending")
                .lte("next_retry", now)
                .lt("retry_count", 3)
                .limit(10)
                .execute()
            )

            for item in response.data:
                try:
                    # Mark as processing
                    supabase.table("embedding_dead_letter_queue").update(
                        {
                            "status": "processing",
                            "last_attempt": datetime.utcnow().isoformat(),
                        }
                    ).eq("id", item["id"]).execute()

                    # Generate embedding
                    embedding = await generator.generate_embedding(
                        item["semantic_text"]
                    )

                    # Store successfully
                    store_embedding(item["user_id"], embedding, "completed")

                    # Mark DLQ item as completed
                    supabase.table("embedding_dead_letter_queue").update(
                        {
                            "status": "completed",
                            "resolved_at": datetime.utcnow().isoformat(),
                        }
                    ).eq("id", item["id"]).execute()

                    logger.info(f"DLQ retry successful for {item['user_id']}")

                except Exception as e:
                    logger.warning(f"DLQ retry failed for {item['user_id']}: {e}")
                    # Increment retry count and reschedule
                    new_retry_count = item["retry_count"] + 1
                    if new_retry_count >= 3:
                        status = "exhausted"
                        supabase.table("embedding_dead_letter_queue").update(
                            {"retry_count": new_retry_count, "status": status}
                        ).eq("id", item["id"]).execute()
                    else:
                        status = "pending"
                        next_retry = datetime.utcnow() + timedelta(
                            minutes=5 * (new_retry_count + 1)
                        )

                        supabase.table("embedding_dead_letter_queue").update(
                            {
                                "retry_count": new_retry_count,
                                "status": status,
                                "next_retry": next_retry.isoformat(),
                            }
                        ).eq("id", item["id"]).execute()

            # Wait before next poll (increased from 30s to 60s to reduce DB load)
            await asyncio.sleep(60)

        except Exception as e:
            logger.error(f"DLQ processor error: {e}")
            await asyncio.sleep(60)


async def process_pending_queue():
    """Process pending embedding requests from database queue"""
    while True:
        try:
            # Get pending requests
            response = (
                supabase.table("embedding_pending_queue")
                .select("*")
                .eq("status", "pending")
                .order("created_at")  # Default is ascending
                .limit(20)
                .execute()
            )

            for item in response.data:
                try:
                    # Mark as processing
                    supabase.table("embedding_pending_queue").update(
                        {
                            "status": "processing",
                            "first_attempt": datetime.utcnow().isoformat(),
                        }
                    ).eq("id", item["id"]).execute()

                    # Get user profile data
                    profile_response = (
                        supabase.from_("profiles")
                        .select(
                            "id, display_name, headline, bio, location, looking_for"
                        )
                        .eq("id", item["user_id"])
                        .single()
                        .execute()
                    )

                    skills_response = (
                        supabase.from_("user_skills")
                        .select("skill_name")
                        .eq("user_id", item["user_id"])
                        .execute()
                    )

                    interests_response = (
                        supabase.from_("user_interests")
                        .select("interest")
                        .eq("user_id", item["user_id"])
                        .execute()
                    )

                    # Construct semantic text
                    semantic_text = construct_semantic_text(
                        profile_response.data or {},
                        skills_response.data or [],
                        interests_response.data or [],
                    )

                    # Generate embedding
                    embedding = await generator.generate_embedding(semantic_text)

                    # Store embedding
                    success = store_embedding(item["user_id"], embedding, "completed")

                    if success:
                        # Mark queue item as completed
                        supabase.table("embedding_pending_queue").update(
                            {
                                "status": "completed",
                                "completed_at": datetime.utcnow().isoformat(),
                            }
                        ).eq("id", item["id"]).execute()

                        logger.info(
                            f"Pending queue processed successfully for {item['user_id']}"
                        )
                    else:
                        # Storage failed, move to DLQ
                        supabase.table("embedding_pending_queue").update(
                            {
                                "status": "failed",
                                "last_attempt": datetime.utcnow().isoformat(),
                                "failure_reason": "Failed to store embedding",
                            }
                        ).eq("id", item["id"]).execute()

                        await store_in_dead_letter_queue(
                            user_id=item["user_id"],
                            semantic_text=semantic_text,
                            failure_reason="Failed to store embedding in profile_embeddings",
                            retry_count=0,
                        )

                except Exception as e:
                    logger.error(
                        f"Pending queue processing failed for {item['user_id']}: {e}",
                        exc_info=True,
                    )

                    # Update queue item status
                    try:
                        supabase.table("embedding_pending_queue").update(
                            {
                                "status": "failed",
                                "last_attempt": datetime.utcnow().isoformat(),
                                "failure_reason": str(e),
                            }
                        ).eq("id", item["id"]).execute()
                    except Exception as update_error:
                        logger.critical(
                            f"Failed to update queue status for {item['user_id']}: {update_error}"
                        )

                    # ALWAYS move to DLQ for retry - this is critical for reliability
                    dlq_success = await store_in_dead_letter_queue(
                        user_id=item["user_id"],
                        semantic_text=semantic_text
                        if "semantic_text" in locals()
                        else "",
                        failure_reason=str(e),
                        retry_count=0,
                    )

                    if not dlq_success:
                        logger.critical(
                            f"CRITICAL: DLQ storage failed for {item['user_id']}. Manual intervention required."
                        )

            # Wait before next poll (increased from 10s to 30s to reduce DB load)
            await asyncio.sleep(30)

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
        "model_info": generator.get_model_info(),
        "queue_size": request_queue.qsize(),
    }


@app.get("/health")
async def health():
    """Health check endpoint with comprehensive system metrics"""
    supabase_healthy = False
    try:
        if supabase:
            response = supabase.table("profiles").select("id").limit(1).execute()
            supabase_healthy = response.data is not None
    except Exception as e:
        logger.error(f"Supabase health check failed: {e}")

    # Get memory usage
    memory_info = psutil.virtual_memory()
    process = psutil.Process(os.getpid())
    process_memory = process.memory_info()

    # Get disk usage
    disk_usage = shutil.disk_usage("/")
    disk_percent = (disk_usage.used / disk_usage.total) * 100

    # Determine overall status
    status = "healthy"
    if not supabase_healthy:
        status = "degraded"
    elif memory_info.percent > 90:
        status = "warning"
        logger.warning(f"High memory usage: {memory_info.percent:.1f}%")
    elif disk_percent > 85:
        status = "warning"
        logger.warning(f"High disk usage: {disk_percent:.1f}%")

    return {
        "status": status,
        "timestamp": time.time(),
        "model_info": generator.get_model_info(),
        "supabase_connected": supabase_healthy,
        "queue_size": request_queue.qsize(),
        "queue_capacity": MAX_QUEUE_SIZE,
        "system": {
            "memory": {
                "percent": memory_info.percent,
                "available_mb": round(memory_info.available / 1024 / 1024, 2),
                "total_mb": round(memory_info.total / 1024 / 1024, 2),
                "used_mb": round(memory_info.used / 1024 / 1024, 2),
            },
            "process_memory": {
                "rss_mb": round(process_memory.rss / 1024 / 1024, 2),
                "vms_mb": round(process_memory.vms / 1024 / 1024, 2),
            },
            "disk": {
                "percent": round(disk_percent, 2),
                "free_gb": round(disk_usage.free / 1024 / 1024 / 1024, 2),
                "total_gb": round(disk_usage.total / 1024 / 1024 / 1024, 2),
                "used_gb": round(disk_usage.used / 1024 / 1024 / 1024, 2),
            },
        },
    }


@app.get("/metrics")
async def metrics():
    """
    Prometheus metrics endpoint.
    Returns metrics in Prometheus exposition format for scraping.
    """
    # Update DLQ size gauge (query database)
    if supabase:
        try:
            dlq_response = (
                supabase.table("embedding_dead_letter_queue")
                .select("id")
                .eq("status", "pending")
                .execute()
            )
            DLQ_SIZE_GAUGE.set(len(dlq_response.data or []))
        except Exception as e:
            logger.error(f"Failed to query DLQ size: {e}")
            DLQ_SIZE_GAUGE.set(0)

    # Generate Prometheus metrics
    return Response(
        content=generate_latest(),
        media_type=CONTENT_TYPE_LATEST,
    )


@app.get("/model-info")
async def model_info():
    """Get information about the embedding model"""
    return generator.get_model_info()


@app.post("/generate-embedding", response_model=EmbeddingResponse)
async def generate_embedding(request: EmbeddingRequest):
    """
    Queue vector embedding generation for text input
    Returns immediately, processing happens in background
    Includes rate limiting (3 requests per hour per user)
    """
    try:
        # Check rate limit first
        if rate_limiter:
            rate_limit_result = await rate_limiter.check_rate_limit(request.user_id)

            if not rate_limit_result["allowed"]:
                logger.warning(
                    f"Rate limit exceeded for user {request.user_id}",
                    extra={"user_id": request.user_id},
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded",
                        "message": "Maximum 3 embedding requests per hour",
                        "retry_after": rate_limit_result["retry_after"],
                        "reset_at": rate_limit_result["reset_at"],
                        "remaining": rate_limit_result["remaining"],
                    },
                    headers={
                        "Retry-After": str(rate_limit_result["retry_after"]),
                        "X-RateLimit-Remaining": str(rate_limit_result["remaining"]),
                        "X-RateLimit-Reset": rate_limit_result["reset_at"] or "",
                    },
                )

        # Check queue capacity
        if request_queue.full():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service at capacity, please try again later",
            )

        await request_queue.put((request.text, request.user_id, request.request_id))

        logger.info(
            f"Embedding request queued for {request.user_id}",
            extra={"user_id": request.user_id, "request_id": request.request_id},
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

        if request_queue.full():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service at capacity, please try again later",
            )

        await request_queue.put((semantic_text, request.user_id, request.request_id))

        logger.info(
            f"Profile embedding request queued for {request.user_id}",
            extra={"user_id": request.user_id, "request_id": request.request_id},
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


# =====================================================
# Match Generation Endpoints (Tasks 1.2.7-1.2.9)
# =====================================================


class MatchGenerateRequest(BaseModel):
    """Request body for match generation"""

    user_id: str = Field(..., description="User ID to generate matches for")
    limit: int = Field(default=20, ge=1, le=50, description="Max matches to generate")


class MatchBatchRequest(BaseModel):
    """Request body for batch match generation"""

    user_ids: Optional[List[str]] = Field(None, description="Specific users to process")
    limit_per_user: int = Field(default=20, ge=1, le=50)


class MatchResponse(BaseModel):
    """Response body for match generation"""

    suggestions_created: int
    matches: List[dict]
    error: Optional[str] = None


@app.post("/api/matches/generate", response_model=MatchResponse)
async def generate_matches(request: MatchGenerateRequest):
    """
    Generate match suggestions for a single user.
    Task: 1.2.8
    """
    try:
        if not supabase:
            raise HTTPException(
                status_code=503, detail="Database connection not available"
            )

        generator = MatchGenerator(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        result = await generator.generate_matches_for_user(
            user_id=request.user_id, limit=request.limit
        )

        if result.get("error"):
            raise HTTPException(status_code=400, detail=result["error"])

        logger.info(
            f"Generated {result['suggestions_created']} matches for user {request.user_id}"
        )
        return MatchResponse(
            suggestions_created=result["suggestions_created"],
            matches=result["matches"],
            error=None,
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating matches: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Failed to generate matches: {str(e)}"
        )


@app.post("/api/matches/generate/batch")
async def generate_matches_batch(
    request: MatchBatchRequest, background_tasks: BackgroundTasks
):
    """
    Generate matches for multiple users in background.
    Task: 1.2.9
    """
    try:
        if not supabase:
            raise HTTPException(
                status_code=503, detail="Database connection not available"
            )

        # Get users to process
        if request.user_ids:
            users_to_process = request.user_ids
        else:
            # Get users without recent suggestions
            response = await asyncio.to_thread(
                supabase.rpc("get_users_needing_matches").execute
            )
            users_to_process = [u["id"] for u in (response.data or [])][:50]

        if not users_to_process:
            return {
                "status": "no_users",
                "message": "No users need match generation",
                "processed_count": 0,
            }

        # Process in background
        async def process_batch():
            generator = MatchGenerator(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
            total_created = 0

            for user_id in users_to_process:
                try:
                    result = await generator.generate_matches_for_user(
                        user_id=user_id, limit=request.limit_per_user
                    )
                    total_created += result.get("suggestions_created", 0)
                    await asyncio.sleep(0.5)  # Rate limiting
                except Exception as e:
                    logger.error(f"Error generating matches for {user_id}: {str(e)}")

            logger.info(
                f"Batch complete: {total_created} matches created for {len(users_to_process)} users"
            )

        background_tasks.add_task(process_batch)

        return {
            "status": "processing",
            "message": f"Batch match generation started for {len(users_to_process)} users",
            "users_count": len(users_to_process),
            "limit_per_user": request.limit_per_user,
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting batch match generation: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start batch: {str(e)}")


@app.get("/health/matches")
async def matches_health():
    """Health check for match generation service"""
    try:
        # Check if we can query match_suggestions
        response = await asyncio.to_thread(
            supabase.table("match_suggestions").select("id").limit(1).execute
        )

        return {
            "status": "healthy",
            "service": "match_generator",
            "database_connected": True,
            "timestamp": datetime.now().isoformat(),
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "service": "match_generator",
            "database_connected": False,
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


# =====================================================
# Notification Endpoints (Tasks 1.3.6-1.3.7)
# =====================================================


class NotificationSendRequest(BaseModel):
    """Request body for sending notification"""

    user_id: str
    type: str
    actor_id: str
    content: str
    resource_type: Optional[str] = None
    resource_id: Optional[str] = None
    priority: Optional[str] = None


class NotificationDigestRequest(BaseModel):
    """Request body for daily digest"""

    user_id: str


class NotificationCleanupRequest(BaseModel):
    """Request body for notification cleanup"""

    days: int = Field(default=30, ge=1, le=365)


@app.post("/api/notifications/send")
async def send_notification(request: NotificationSendRequest):
    """
    Send a single notification.
    Task: 1.3.6
    """
    try:
        engine = NotificationEngine(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        result = await engine.send_notification(
            user_id=request.user_id,
            type=request.type,
            actor_id=request.actor_id,
            content=request.content,
            resource_type=request.resource_type,
            resource_id=request.resource_id,
            priority=request.priority,
        )

        if result["status"] == "failed":
            raise HTTPException(
                status_code=500, detail=result.get("error", "Failed to send")
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/notifications/digest/send")
async def send_digest(request: NotificationDigestRequest):
    """
    Send daily digest to user.
    Task: 1.3.6
    """
    try:
        engine = NotificationEngine(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        result = await engine.send_daily_digest(user_id=request.user_id)

        if result["status"] == "failed":
            raise HTTPException(
                status_code=500, detail=result.get("error", "Failed to send digest")
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending digest: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# =====================================================
# Activity Tracker Endpoints (Tasks 1.4.5-1.4.7)
# =====================================================


class ActivityTrackViewRequest(BaseModel):
    """Request body for tracking profile view"""

    viewer_id: str
    target_id: str


class ActivityTrackMatchRequest(BaseModel):
    """Request body for tracking match building"""

    user_id: str
    matched_user_id: str


class ActivityFeedRequest(BaseModel):
    """Request body for activity feed"""

    user_id: str
    limit: int = Field(default=20, ge=1, le=50)


@app.post("/api/activity/track/view")
async def track_profile_view(request: ActivityTrackViewRequest):
    """
    Track profile view.
    Task: 1.4.5
    """
    try:
        tracker = ActivityTracker(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        result = await tracker.track_profile_view(
            viewer_id=request.viewer_id, target_id=request.target_id
        )

        if result["status"] == "failed":
            raise HTTPException(
                status_code=500, detail=result.get("error", "Failed to track")
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error tracking profile view: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/activity/track/build")
async def track_match_building(request: ActivityTrackMatchRequest):
    """
    Track match building.
    Task: 1.4.5
    """
    try:
        tracker = ActivityTracker(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        result = await tracker.track_match_building(
            user_id=request.user_id, matched_user_id=request.matched_user_id
        )

        if result["status"] == "failed":
            raise HTTPException(
                status_code=500, detail=result.get("error", "Failed to track")
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error tracking match building: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/activity/feed")
async def get_activity_feed(user_id: str, limit: int = 20):
    """
    Get activity feed for user.
    Task: 1.4.5
    """
    try:
        tracker = ActivityTracker(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        activities = await tracker.get_activity_feed(user_id=user_id, limit=limit)

        return {"activities": activities}

    except Exception as e:
        logger.error(f"Error getting activity feed: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/notifications/cleanup")
async def cleanup_notifications(request: NotificationCleanupRequest):
    """
    Cleanup old notifications (admin only).
    Task: 1.3.6
    """
    try:
        engine = NotificationEngine(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        result = await engine.cleanup_old_notifications(days=request.days)

        if result["status"] == "failed":
            raise HTTPException(
                status_code=500, detail=result.get("error", "Failed to cleanup")
            )

        return result

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cleaning up notifications: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


# ============================================================================
# MISSING API ENDPOINTS - IMPLEMENTATION COMPLETE
# ============================================================================


# --------------------------------------------
# Content Moderation Endpoint
# --------------------------------------------
class ModerateRequest(BaseModel):
    content: str = Field(..., description="Content to moderate")
    content_type: str = Field(
        default="post", description="Type of content (post, comment, message)"
    )


class ModerateResponse(BaseModel):
    approved: bool
    flag_for_review: bool
    auto_reject: bool
    risk_score: float
    action: str
    details: dict
    error: Optional[str] = None


@app.post("/api/moderate", response_model=ModerateResponse)
async def moderate_content_endpoint(request: ModerateRequest):
    """
    Moderate content for toxicity, spam, NSFW, and PII.
    Uses Google Perspective API with fallback to keyword-based detection.
    """
    try:
        moderator = ContentModerator(
            SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PERSPECTIVE_API_KEY
        )
        result = await moderator.moderate_content(
            content=request.content, content_type=request.content_type
        )

        logger.info(
            f"Content moderation: {result['action']} (risk: {result['risk_score']:.2f})"
        )

        return ModerateResponse(**result)

    except Exception as e:
        logger.error(f"Error moderating content: {str(e)}")
        # Return safe fallback - reject on error
        return ModerateResponse(
            approved=False,
            flag_for_review=False,
            auto_reject=True,
            risk_score=1.0,
            action="auto_reject",
            details={"error": str(e)},
            error=str(e),
        )


# --------------------------------------------
# AI Mentor Message Endpoint
# --------------------------------------------
class MentorMessageRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    message: str = Field(..., description="User message to AI mentor")
    session_id: Optional[str] = Field(
        None, description="Existing session ID (optional)"
    )


class MentorMessageResponse(BaseModel):
    response: str
    action_items: List[dict]
    session_id: str
    message_id: Optional[str]
    suggested_next_steps: List[str]
    error: Optional[str] = None


@app.post("/api/ai-mentor/message", response_model=MentorMessageResponse)
async def ai_mentor_message(request: MentorMessageRequest):
    """
    Send message to AI mentor and get response.
    Uses Google Gemini API with fallback to predefined responses.
    """
    try:
        processor = AIMentorProcessor(
            SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, GEMINI_API_KEY
        )
        result = await processor.generate_response(
            user_id=request.user_id,
            message=request.message,
            session_id=request.session_id,
        )

        logger.info(f"AI mentor response generated for user {request.user_id}")

        return MentorMessageResponse(**result)

    except Exception as e:
        logger.error(f"Error generating AI mentor response: {str(e)}")
        # Return helpful fallback response
        return MentorMessageResponse(
            response="I apologize, but I'm experiencing technical difficulties at the moment. Please try again in a few minutes. In the meantime, consider reviewing your profile and exploring potential matches!",
            action_items=[],
            session_id=request.session_id or "",
            message_id=None,
            suggested_next_steps=[
                "Review your profile completeness",
                "Explore your match suggestions",
                "Update your skills and interests",
            ],
            error=str(e),
        )


# --------------------------------------------
# Analytics Daily Aggregation Endpoint
# --------------------------------------------
class AnalyticsDailyRequest(BaseModel):
    date: Optional[str] = Field(
        None, description="Date in ISO format (YYYY-MM-DD), defaults to today"
    )


class AnalyticsDailyResponse(BaseModel):
    status: str
    date: str
    metrics: dict
    error: Optional[str] = None


@app.post("/api/analytics/daily", response_model=AnalyticsDailyResponse)
async def aggregate_daily_analytics(request: AnalyticsDailyRequest):
    """
    Aggregate daily platform analytics.
    Calculates DAU, MAU, WAU, and other platform metrics.
    """
    try:
        aggregator = AnalyticsAggregator(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

        # Parse date if provided
        target_date = None
        if request.date:
            try:
                target_date = datetime.fromisoformat(
                    request.date.replace("Z", "+00:00")
                )
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid date format. Use ISO format (YYYY-MM-DD)",
                )

        result = await aggregator.aggregate_daily_stats(date=target_date)

        if result.get("status") == "error":
            raise HTTPException(
                status_code=500, detail=result.get("error", "Aggregation failed")
            )

        logger.info(f"Daily analytics aggregated for {result.get('date')}")

        return AnalyticsDailyResponse(**result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error aggregating daily analytics: {str(e)}")
        return AnalyticsDailyResponse(
            status="error",
            date=request.date or datetime.now().isoformat(),
            metrics={},
            error=str(e),
        )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for logging"""
    logger.error(f"Unhandled exception: {exc}", extra={"path": request.url.path})
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
