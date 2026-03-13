"""
Collabryx Embedding Service
FastAPI server for generating semantic embeddings using Sentence Transformers
"""

from fastapi import FastAPI, HTTPException, status, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, List
import os
import time
import asyncio
import logging
from datetime import datetime, timedelta
import httpx
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from supabase import create_client, Client

from embedding_generator import generator, construct_semantic_text
from rate_limiter import RateLimiter

load_dotenv()

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Environment variables
SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

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

# Initialize FastAPI app
app = FastAPI(
    title="Collabryx Embedding Service",
    description="Generate semantic embeddings for user profiles using Sentence Transformers",
    version="1.0.0",
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle with background tasks"""
    validate_env_vars()
    logger.info("Embedding service starting up...")
    
    # Start background tasks
    processor_task = asyncio.create_task(queue_processor())
    dlq_processor_task = asyncio.create_task(process_dead_letter_queue())
    pending_queue_task = asyncio.create_task(process_pending_queue())
    
    yield
    
    # Cleanup
    processor_task.cancel()
    dlq_processor_task.cancel()
    pending_queue_task.cancel()
    try:
        await processor_task
        await dlq_processor_task
        await pending_queue_task
    except asyncio.CancelledError:
        pass
    
    await request_queue.join()
    logger.info("Embedding service shutting down...")


# Add lifespan to app
app.lifespan = lifespan

# CORS middleware with specific origins
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)


class EmbeddingRequest(BaseModel):
    """Request body for embedding generation"""
    text: str = Field(..., description="Text to embed (semantic profile string)")
    user_id: str = Field(..., description="User ID for tracking")
    request_id: Optional[str] = Field(None, description="Optional request ID for tracking")
    
    @validator('text')
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
    user_id: str,
    semantic_text: str,
    failure_reason: str,
    retry_count: int = 0
):
    """Store failed request in dead letter queue for retry"""
    if not supabase:
        logger.warning(f"Supabase not initialized, cannot store in DLQ for {user_id}")
        return
    
    try:
        next_retry = datetime.utcnow() + timedelta(minutes=5 * (retry_count + 1))
        supabase.table("embedding_dead_letter_queue").insert({
            "user_id": user_id,
            "semantic_text": semantic_text,
            "failure_reason": failure_reason,
            "retry_count": retry_count,
            "next_retry": next_retry.isoformat(),
            "status": "pending" if retry_count < 3 else "exhausted"
        }).execute()
        logger.info(f"Stored in DLQ for {user_id}, retry {retry_count}/3")
    except Exception as e:
        logger.error(f"Failed to store in DLQ for {user_id}: {e}")


def store_embedding(user_id: str, embedding: List[float], status: str):
    """Store embedding in Supabase with validation metadata"""
    if not supabase:
        logger.warning(f"Supabase client not initialized. Cannot store embedding for {user_id}")
        return False
    
    try:
        validation_result = EmbeddingValidator.validate(embedding)
        
        if not validation_result.is_valid:
            logger.error(f"Pre-storage validation failed for {user_id}: {validation_result.message}")
            raise ValueError(f"Invalid embedding cannot be stored: {validation_result.message}")
        
        target_dim = 384
        if len(embedding) < target_dim:
            embedding = embedding + [0.0] * (target_dim - len(embedding))
        elif len(embedding) > target_dim:
            embedding = embedding[:target_dim]
        
        supabase.table("profile_embeddings").upsert({
            "user_id": user_id,
            "embedding": embedding,
            "status": status,
            "last_updated": datetime.utcnow().isoformat(),
            "metadata": {
                "validation": validation_result.details,
                "model": "sentence-transformers/all-MiniLM-L6-v2",
                "dimensions": len(embedding),
                "validated_at": datetime.utcnow().isoformat()
            }
        }).execute()
        logger.info(f"Successfully stored embedding for {user_id}", extra={"user_id": user_id})
        return True
    except Exception as e:
        logger.error(f"Failed to store embedding for {user_id}: {e}", extra={"user_id": user_id, "error": str(e)})
        try:
            supabase.table("profile_embeddings").upsert({
                "user_id": user_id,
                "status": "failed",
                "last_updated": datetime.utcnow().isoformat()
            }).execute()
        except Exception as inner_e:
            logger.error(f"Failed to update error status for {user_id}: {inner_e}")
        return False


async def generate_and_store_embedding(text: str, user_id: str, request_id: Optional[str] = None):
    """Async function to generate and save embedding with retry logic"""
    async with processing_semaphore:
        try:
            logger.info(f"Generating embedding for {user_id}", extra={"user_id": user_id, "request_id": request_id})
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
                        "dimensions": len(embedding)
                    }
                )
            else:
                logger.error(f"Failed to store embedding for {user_id}", extra={"user_id": user_id})
                
        except Exception as e:
            logger.error(f"Embedding generation failed for {user_id}: {e}", extra={"user_id": user_id, "request_id": request_id, "error": str(e)})
            
            # Get existing retry count if available
            existing_retry_count = 0
            if supabase:
                try:
                    retry_response = supabase.table("embedding_dead_letter_queue")\
                        .select("retry_count")\
                        .eq("user_id", user_id)\
                        .order("created_at", desc=True)\
                        .limit(1)\
                        .execute()
                    if retry_response.data and len(retry_response.data) > 0:
                        existing_retry_count = retry_response.data[0].get("retry_count", 0)
                except Exception:
                    pass
            
            # Store in DLQ for retry
            await store_in_dead_letter_queue(
                user_id=user_id,
                semantic_text=text,
                failure_reason=str(e),
                retry_count=existing_retry_count
            )
            
            # Update status to failed
            if supabase:
                try:
                    supabase.table("profile_embeddings").upsert({
                        "user_id": user_id,
                        "status": "failed",
                        "last_updated": datetime.utcnow().isoformat()
                    }).execute()
                except Exception as inner_e:
                    logger.error(f"Failed to update error status for {user_id}: {inner_e}")


async def queue_processor():
    """Background task to process queue"""
    while True:
        try:
            text, user_id, request_id = await request_queue.get()
            await generate_and_store_embedding(text, user_id, request_id)
            request_queue.task_done()
        except Exception as e:
            logger.error(f"Queue processor error: {e}")


async def process_dead_letter_queue():
    """Process retryable items from dead letter queue"""
    while True:
        try:
            now = datetime.utcnow().isoformat()
            
            # Get items ready for retry
            response = supabase.table("embedding_dead_letter_queue")\
                .select("*")\
                .eq("status", "pending")\
                .lte("next_retry", now)\
                .lt("retry_count", 3)\
                .limit(10)\
                .execute()
            
            for item in response.data:
                try:
                    # Mark as processing
                    supabase.table("embedding_dead_letter_queue")\
                        .update({"status": "processing", "last_attempt": datetime.utcnow().isoformat()})\
                        .eq("id", item["id"])\
                        .execute()
                    
                    # Generate embedding
                    embedding = await generator.generate_embedding(item["semantic_text"])
                    
                    # Store successfully
                    store_embedding(item["user_id"], embedding, "completed")
                    
                    # Mark DLQ item as completed
                    supabase.table("embedding_dead_letter_queue")\
                        .update({
                            "status": "completed",
                            "resolved_at": datetime.utcnow().isoformat()
                        })\
                        .eq("id", item["id"])\
                        .execute()
                    
                    logger.info(f"DLQ retry successful for {item['user_id']}")
                    
                except Exception as e:
                    logger.warning(f"DLQ retry failed for {item['user_id']}: {e}")
                    # Increment retry count and reschedule
                    new_retry_count = item["retry_count"] + 1
                    if new_retry_count >= 3:
                        status = "exhausted"
                        supabase.table("embedding_dead_letter_queue")\
                            .update({
                                "retry_count": new_retry_count,
                                "status": status
                            })\
                            .eq("id", item["id"])\
                            .execute()
                    else:
                        status = "pending"
                        next_retry = datetime.utcnow() + timedelta(minutes=5 * (new_retry_count + 1))
                        
                        supabase.table("embedding_dead_letter_queue")\
                            .update({
                                "retry_count": new_retry_count,
                                "status": status,
                                "next_retry": next_retry.isoformat()
                            })\
                            .eq("id", item["id"])\
                            .execute()
            
            # Wait before next poll
            await asyncio.sleep(30)
            
        except Exception as e:
            logger.error(f"DLQ processor error: {e}")
            await asyncio.sleep(30)


async def process_pending_queue():
    """Process pending embedding requests from database queue"""
    while True:
        try:
            # Get pending requests
            response = supabase.table("embedding_pending_queue")\
                .select("*")\
                .eq("status", "pending")\
                .order("created_at", asc=True)\
                .limit(20)\
                .execute()
            
            for item in response.data:
                try:
                    # Mark as processing
                    supabase.table("embedding_pending_queue")\
                        .update({
                            "status": "processing",
                            "first_attempt": datetime.utcnow().isoformat()
                        })\
                        .eq("id", item["id"])\
                        .execute()
                    
                    # Get user profile data
                    profile_response = supabase.from_("profiles")\
                        .select("id, display_name, headline, bio, location, looking_for")\
                        .eq("id", item["user_id"])\
                        .single()\
                        .execute()
                    
                    skills_response = supabase.from_("user_skills")\
                        .select("skill_name")\
                        .eq("user_id", item["user_id"])\
                        .execute()
                    
                    interests_response = supabase.from_("user_interests")\
                        .select("interest")\
                        .eq("user_id", item["user_id"])\
                        .execute()
                    
                    # Construct semantic text
                    semantic_text = construct_semantic_text(
                        profile_response.data or {},
                        skills_response.data or [],
                        interests_response.data or []
                    )
                    
                    # Generate embedding
                    embedding = await generator.generate_embedding(semantic_text)
                    
                    # Store embedding
                    store_embedding(item["user_id"], embedding, "completed")
                    
                    # Mark queue item as completed
                    supabase.table("embedding_pending_queue")\
                        .update({
                            "status": "completed",
                            "completed_at": datetime.utcnow().isoformat()
                        })\
                        .eq("id", item["id"])\
                        .execute()
                    
                    logger.info(f"Pending queue processed successfully for {item['user_id']}")
                    
                except Exception as e:
                    logger.error(f"Pending queue processing failed for {item['user_id']}: {e}")
                    supabase.table("embedding_pending_queue")\
                        .update({
                            "status": "failed",
                            "last_attempt": datetime.utcnow().isoformat(),
                            "failure_reason": str(e)
                        })\
                        .eq("id", item["id"])\
                        .execute()
                    
                    # Move to DLQ for retry
                    await store_in_dead_letter_queue(
                        user_id=item["user_id"],
                        semantic_text="",
                        failure_reason=str(e),
                        retry_count=0
                    )
            
            # Wait before next poll
            await asyncio.sleep(10)
            
        except Exception as e:
            logger.error(f"Pending queue processor error: {e}")
            await asyncio.sleep(30)


@app.on_event("startup")
async def startup_event():
    """Validate environment and start queue processor on startup"""
    validate_env_vars()
    logger.info("Embedding service starting up...")
    asyncio.create_task(queue_processor())
    asyncio.create_task(process_dead_letter_queue())


@app.on_event("shutdown")
async def shutdown_event():
    """Wait for queue to finish processing on shutdown"""
    await request_queue.join()
    logger.info("Embedding service shutting down...")


@app.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "message": "Collabryx Embedding Service",
        "model_info": generator.get_model_info(),
        "queue_size": request_queue.qsize()
    }


@app.get("/health")
async def health():
    """Health check endpoint with Supabase connectivity test"""
    supabase_healthy = False
    try:
        if supabase:
            response = supabase.table("profiles").select("id").limit(1).execute()
            supabase_healthy = response.data is not None
    except Exception as e:
        logger.error(f"Supabase health check failed: {e}")
    
    return {
        "status": "healthy" if supabase_healthy else "degraded",
        "timestamp": time.time(),
        "model_info": generator.get_model_info(),
        "supabase_connected": supabase_healthy,
        "queue_size": request_queue.qsize(),
        "queue_capacity": MAX_QUEUE_SIZE
    }


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
                    extra={"user_id": request.user_id}
                )
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail={
                        "error": "Rate limit exceeded",
                        "message": "Maximum 3 embedding requests per hour",
                        "retry_after": rate_limit_result["retry_after"],
                        "reset_at": rate_limit_result["reset_at"],
                        "remaining": rate_limit_result["remaining"]
                    },
                    headers={
                        "Retry-After": str(rate_limit_result["retry_after"]),
                        "X-RateLimit-Remaining": str(rate_limit_result["remaining"]),
                        "X-RateLimit-Reset": rate_limit_result["reset_at"] or ""
                    }
                )
        
        # Check queue capacity
        if request_queue.full():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service at capacity, please try again later"
            )
        
        await request_queue.put((request.text, request.user_id, request.request_id))
        
        logger.info(
            f"Embedding request queued for {request.user_id}",
            extra={"user_id": request.user_id, "request_id": request.request_id}
        )
        
        return EmbeddingResponse(
            user_id=request.user_id,
            status="queued",
            message="Vector embedding queued for background processing",
            request_id=request.request_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error queuing embedding request: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to queue request: {str(e)}"
        )


@app.post("/generate-embedding-from-profile", response_model=EmbeddingResponse)
async def generate_embedding_from_profile(request: ProfileDataRequest):
    """
    Queue embedding generation from complete profile data
    """
    try:
        semantic_text = construct_semantic_text(
            request.profile,
            request.skills,
            request.interests
        )
        
        if request_queue.full():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service at capacity, please try again later"
            )
        
        await request_queue.put((semantic_text, request.user_id, request.request_id))
        
        logger.info(
            f"Profile embedding request queued for {request.user_id}",
            extra={"user_id": request.user_id, "request_id": request.request_id}
        )
        
        return EmbeddingResponse(
            user_id=request.user_id,
            status="queued",
            message="Vector embedding queued for background processing",
            request_id=request.request_id
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error preparing embedding generation: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error preparing embedding generation: {str(e)}"
        )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler for logging"""
    logger.error(f"Unhandled exception: {exc}", extra={"path": request.url.path})
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
