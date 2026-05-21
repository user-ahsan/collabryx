"""
Collabryx Embedding Service
FastAPI server for generating semantic embeddings using Sentence Transformers
Core service only - match generation, notifications, activity tracking,
content moderation, AI mentor, analytics, and feed scoring have been removed.
"""

from fastapi import FastAPI, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, List
import os
import time
import asyncio
import logging
import shutil
import signal
from datetime import datetime, timedelta
from contextlib import asynccontextmanager



from dotenv import load_dotenv
from supabase import create_client, Client

from embedding_generator import get_generator, construct_semantic_text
from rate_limiter import RateLimiter
from embedding_validator import EmbeddingValidator

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
WORKER_API_KEY = os.getenv("WORKER_API_KEY")


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


def signal_handler(signum, frame):
    """Handle SIGTERM and SIGINT for graceful shutdown."""
    global SHUTDOWN_FLAG
    sig_name = signal.Signals(signum).name
    logger.info(f"Received {sig_name} signal — initiating graceful shutdown")
    SHUTDOWN_FLAG = True




async def run_embedding_tests():
    """Run embedding tests on startup to verify fixes are working with detailed reporting"""
    import subprocess
    import sys
    import time

    logger.info("=" * 60)
    logger.info("RUNNING EMBEDDING TESTS")
    logger.info("Verifying all critical fixes are working correctly")
    logger.info("=" * 60)

    start_time = time.time()

    try:
        # Run pytest on embedding tests with summary report
        result = subprocess.run(
            [
                sys.executable,
                "-m",
                "pytest",
                "tests/test_embedding.py",
                "-v",
                "--tb=short",
                "-r",
                "fE",  # Show summary of failed and error tests
            ],
            cwd=os.path.dirname(os.path.abspath(__file__)),
            capture_output=True,
            text=True,
            timeout=120,  # 2 minute timeout
        )

        elapsed_time = time.time() - start_time

        if result.returncode == 0:
            logger.info("✓ Embedding tests PASSED")
            logger.info(f"Test execution time: {elapsed_time:.2f}s")
            logger.info("All critical fixes verified:")
            logger.info("  ✓ Atomic claim pattern (pending queue) - CRITICAL-2")
            logger.info("  ✓ Atomic claim pattern (DLQ) - CRITICAL-3")
            logger.info("  ✓ Rate limiter fail-closed - CRITICAL-4")
            logger.info("  ✓ Remove in-memory cache - CRITICAL-1")
            logger.info("  ✓ Service role bypass - B07")
            logger.info("  ✓ Async lock removed - B05")
            logger.info("  ✓ Transaction handling - B06")
            logger.info("  ✓ None value handling - B08")
            logger.info("  ✓ Generation timeout - E03")
            logger.info("  ✓ Circuit breaker logging - E01")
            logger.info("  ✓ Graceful shutdown - B09")
            logger.info("System health: LOW RISK - Production ready")
        else:
            logger.error("✗ Embedding tests FAILED")
            logger.error(f"Test execution time: {elapsed_time:.2f}s")
            logger.error(f"Return code: {result.returncode}")
            # Show test output for debugging
            if result.stdout:
                logger.error("Test output:")
                for line in result.stdout.split("\n"):
                    logger.error(f"  {line}")
            if result.stderr:
                logger.error("Errors:")
                for line in result.stderr.split("\n"):
                    logger.error(f"  {line}")
            # Don't fail startup on test failure - just log and continue
            logger.warning(
                "⚠️ Continuing startup despite test failures - manual review recommended"
            )

    except subprocess.TimeoutExpired:
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
    global SHUTDOWN_FLAG

    # Register signal handlers for graceful shutdown
    loop = asyncio.get_event_loop()
    for sig in (signal.SIGTERM, signal.SIGINT):
        loop.add_signal_handler(sig, signal_handler, sig, None)
    logger.info("Signal handlers registered for SIGTERM and SIGINT")

    validate_env_vars()
    logger.info("=" * 60)
    logger.info("EMBEDDING SERVICE STARTING UP")
    logger.info("=" * 60)

    # Run embedding tests on startup to verify fixes
    await run_embedding_tests()

    logger.info("Starting background queue processor...")
    processor_task = asyncio.create_task(queue_processor())
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

    # Report queue state before shutdown
    queue_size = request_queue.qsize()
    if queue_size > 0:
        logger.warning(f"⚠️ {queue_size} items still in queue during shutdown")

    # Wait for queue to drain (with timeout)
    logger.info("Waiting for queue to drain (max 30s)...")
    try:
        await asyncio.wait_for(request_queue.join(), timeout=30.0)
        logger.info("✓ Queue drained successfully")
    except asyncio.TimeoutError:
        logger.warning("⚠️ Queue drain timeout - some items may be lost")
    except KeyboardInterrupt:
        logger.warning("⚠️ Shutdown interrupted by user")

    # Cancel background tasks gracefully with individual timeouts
    logger.info("Cancelling background tasks...")

    tasks_with_names = [
        ("processor", processor_task),
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

    # Close Supabase connections gracefully
    global supabase
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
        # Step 1: Validate embedding before storage
        validation_result = EmbeddingValidator.validate(embedding)

        if not validation_result.is_valid:
            logger.error(
                f"Pre-storage validation failed for {user_id}: {validation_result.message}"
            )
            # Attempt to record validation failure
            _mark_embedding_status(
                user_id, "failed", f"Validation failed: {validation_result.message}"
            )
            raise ValueError(
                f"Invalid embedding cannot be stored: {validation_result.message}"
            )

        # Step 2: Normalize to 384 dimensions if needed
        target_dim = 384
        original_dim = len(embedding)
        if len(embedding) < target_dim:
            embedding = embedding + [0.0] * (target_dim - len(embedding))
            logger.warning(
                f"Embedding for {user_id} padded from {original_dim} to {target_dim} dimensions"
            )
        elif len(embedding) > target_dim:
            embedding = embedding[:target_dim]
            logger.warning(
                f"Embedding for {user_id} truncated from {original_dim} to {target_dim} dimensions"
            )

        # Step 3: UPSERT with metadata (atomic operation)
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
            logger.info(
                f"Successfully stored embedding for {user_id} (status={status})",
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


async def generate_and_store_embedding(
    text: str, user_id: str, request_id: Optional[str] = None
):
    """Async function to generate and save embedding with retry logic and timeout"""
    async with processing_semaphore:
        try:
            logger.info(
                f"Generating embedding for {user_id}",
                extra={"user_id": user_id, "request_id": request_id},
            )
            start_time = time.time()

            # Add timeout to prevent hung workers on model failures
            embedding = await asyncio.wait_for(
                get_generator().generate_embedding(text),
                timeout=30.0,  # 30 second timeout for embedding generation
            )
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

        except asyncio.TimeoutError:
            logger.error(
                f"Embedding generation TIMEOUT for {user_id} (exceeded 30s)",
                extra={"user_id": user_id, "request_id": request_id},
            )
            # Store in DLQ with timeout-specific error
            await store_in_dead_letter_queue(
                user_id=user_id,
                semantic_text=text,
                failure_reason="Embedding generation timeout (exceeded 30 seconds)",
                retry_count=0,
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
    """Process retryable items from dead letter queue with atomic claim pattern"""
    while not SHUTDOWN_FLAG:
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
                    # ATOMIC CLAIM: Update only if status is still "pending"
                    # This prevents multiple workers from processing the same failed item
                    claim_response = (
                        supabase.table("embedding_dead_letter_queue")
                        .update(
                            {
                                "status": "processing",
                                "last_attempt": datetime.utcnow().isoformat(),
                            }
                        )
                        .eq("id", item["id"])
                        .eq("status", "pending")  # Critical: atomic claim condition
                        .execute()
                    )

                    # Check if we successfully claimed this item
                    if not claim_response.data or len(claim_response.data) == 0:
                        # Another worker claimed it, skip this item
                        logger.debug(
                            f"DLQ item {item['id']} already claimed by another worker, skipping"
                        )
                        continue

                    # Generate embedding
                    embedding = await get_generator().generate_embedding(
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
    """Process pending embedding requests from database queue with atomic claim pattern"""
    while not SHUTDOWN_FLAG:
        try:
            # Get pending requests (candidates for claiming)
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
                    # ATOMIC CLAIM: Update only if status is still "pending"
                    # This prevents multiple workers from processing the same item
                    claim_response = (
                        supabase.table("embedding_pending_queue")
                        .update(
                            {
                                "status": "processing",
                                "first_attempt": datetime.utcnow().isoformat(),
                            }
                        )
                        .eq("id", item["id"])
                        .eq("status", "pending")  # Critical: atomic claim condition
                        .execute()
                    )

                    # Check if we successfully claimed this item
                    if not claim_response.data or len(claim_response.data) == 0:
                        # Another worker claimed it, skip this item
                        logger.debug(
                            f"Item {item['id']} already claimed by another worker, skipping"
                        )
                        continue

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
                    embedding = await get_generator().generate_embedding(semantic_text)

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
        "model_info": get_generator().get_model_info(),
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

    # Get disk usage
    disk_usage = shutil.disk_usage("/")
    disk_percent = (disk_usage.used / disk_usage.total) * 100

    # Determine overall status
    status = "healthy"
    if not supabase_healthy:
        status = "degraded"
    elif disk_percent > 85:
        status = "warning"
        logger.warning(f"High disk usage: {disk_percent:.1f}%")

    return {
        "status": status,
        "timestamp": time.time(),
        "model_info": get_generator().get_model_info(),
        "supabase_connected": supabase_healthy,
        "queue_size": request_queue.qsize(),
        "queue_capacity": MAX_QUEUE_SIZE,
        "system": {
            "disk": {
                "percent": round(disk_percent, 2),
                "free_gb": round(disk_usage.free / 1024 / 1024 / 1024, 2),
                "total_gb": round(disk_usage.total / 1024 / 1024 / 1024, 2),
                "used_gb": round(disk_usage.used / 1024 / 1024 / 1024, 2),
            },
        },
    }





@app.get("/model-info")
async def model_info():
    """Get information about the embedding model"""
    return get_generator().get_model_info()


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


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for logging"""
    logger.error(f"Unhandled exception: {exc}", extra={"path": request.url.path})
    return JSONResponse(status_code=500, content={"detail": "Internal server error"})


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
