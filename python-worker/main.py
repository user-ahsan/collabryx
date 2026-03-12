"""
Collabryx Embedding Service
FastAPI server for generating semantic embeddings using Sentence Transformers
"""

from fastapi import FastAPI, HTTPException, status, BackgroundTasks, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List, Literal
import os
import time
import asyncio
import logging
import signal
import sys
from datetime import datetime, timedelta
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor
import threading

from dotenv import load_dotenv
from supabase import create_client, Client, ClientOptions
from postgrest import SyncPostgrestClient

from embedding_generator import generator, construct_semantic_text

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

SUPABASE_TIMEOUT = 5
MAX_QUEUE_SIZE = 100
MAX_CONCURRENT_PROCESSING = 5
MAX_RETRIES_PER_MESSAGE = 3
HEALTH_PING_INTERVAL = 30

request_queue: asyncio.Queue = asyncio.Queue(maxsize=MAX_QUEUE_SIZE)
processing_semaphore: asyncio.Semaphore = asyncio.Semaphore(MAX_CONCURRENT_PROCESSING)
queue_paused = False
queue_paused_event = asyncio.Event()
shutdown_event = asyncio.Event()

processed_count = 0
failed_count = 0
start_time = time.time()
dead_letter_queue: List[dict] = []
dlq_lock = threading.Lock()

executor = ThreadPoolExecutor(max_workers=4)

supabase: Optional[Client] = None

def validate_env_vars():
    required_vars = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]
    missing = [var for var in required_vars if not os.getenv(var)]
    if missing:
        raise RuntimeError(f"Missing required environment variables: {missing}")

def init_supabase_client():
    global supabase
    if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
        try:
            postgrest_client = SyncPostgrestClient(
                base_url=f"{SUPABASE_URL}/rest/v1",
                headers={"apikey": SUPABASE_SERVICE_ROLE_KEY},
                timeout=SUPABASE_TIMEOUT
            )
            supabase = create_client(
                SUPABASE_URL, 
                SUPABASE_SERVICE_ROLE_KEY,
                options=ClientOptions(postgrest_client=postgrest_client)
            )
            logger.info("Supabase client initialized successfully with timeout")
        except Exception as e:
            logger.error(f"Failed to initialize Supabase client: {e}")
            supabase = None

async def health_monitor():
    global processed_count, failed_count
    while not shutdown_event.is_set():
        try:
            await asyncio.sleep(HEALTH_PING_INTERVAL)
            uptime = time.time() - start_time
            logger.info(
                f"❤️ Health Check | Queue: {request_queue.qsize()}/{MAX_QUEUE_SIZE} | "
                f"Processed: {processed_count} | Failed: {failed_count} | "
                f"Uptime: {uptime/60:.1f}m | Paused: {queue_paused}"
            )
        except Exception as e:
            logger.error(f"Health monitor error: {e}")

@asynccontextmanager
async def lifespan(app: FastAPI):
    validate_env_vars()
    init_supabase_client()
    logger.info("Embedding service starting up...")
    
    monitor_task = asyncio.create_task(health_monitor())
    processor_task = asyncio.create_task(queue_processor())
    
    logger.info("✅ Service ready")
    
    yield
    
    logger.info("Initiating graceful shutdown...")
    shutdown_event.set()
    
    global queue_paused
    queue_paused = True
    queue_paused_event.set()
    
    logger.info(f"Draining queue... {request_queue.qsize()} items remaining")
    try:
        await asyncio.wait_for(request_queue.join(), timeout=30.0)
    except asyncio.TimeoutError:
        logger.warning("Queue drain timeout, forcing shutdown")
    
    processor_task.cancel()
    monitor_task.cancel()
    
    try:
        await asyncio.gather(processor_task, monitor_task, return_exceptions=True)
    except Exception:
        pass
    
    executor.shutdown(wait=False)
    
    with dlq_lock:
        if dead_letter_queue:
            logger.warning(f"DLQ contains {len(dead_letter_queue)} failed messages")
    
    logger.info("Embedding service shut down")

app = FastAPI(
    title="Collabryx Embedding Service",
    description="Generate semantic embeddings for user profiles using Sentence Transformers",
    version="1.1.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["POST", "GET", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

class EmbeddingRequest(BaseModel):
    text: str = Field(..., description="Text to embed (semantic profile string)")
    user_id: str = Field(..., description="User ID for tracking")
    request_id: Optional[str] = Field(None, description="Optional request ID for tracking")
    
    @field_validator('text')
    @classmethod
    def validate_text(cls, v):
        if not v or len(v.strip()) < 10:
            raise ValueError("Text must be at least 10 characters")
        if len(v) > 2000:
            raise ValueError("Text must not exceed 2000 characters")
        return v.strip()

class EmbeddingResponse(BaseModel):
    user_id: str
    status: str = "success"
    message: Optional[str] = None
    embedding: Optional[List[float]] = None
    dimensions: Optional[int] = None
    model: Optional[str] = None
    request_id: Optional[str] = None
    processing_time_ms: Optional[float] = None

class ProfileDataRequest(BaseModel):
    user_id: str = Field(..., description="User ID")
    profile: dict = Field(..., description="User profile data")
    skills: List[dict] = Field(default_factory=list, description="User skills")
    interests: List[dict] = Field(default_factory=list, description="User interests")
    request_id: Optional[str] = Field(None, description="Optional request ID")

class QueuePauseRequest(BaseModel):
    paused: bool = Field(..., description="Pause or resume queue")

class DLQEntry(BaseModel):
    user_id: str
    text: str
    request_id: Optional[str]
    error: str
    retries: int
    timestamp: str

def store_embedding(user_id: str, embedding: List[float], status: str) -> bool:
    if not supabase:
        logger.warning(f"Supabase client not initialized. Cannot store embedding for {user_id}")
        return False
    
    try:
        target_dim = 384
        if len(embedding) < target_dim:
            embedding = embedding + [0.0] * (target_dim - len(embedding))
        elif len(embedding) > target_dim:
            embedding = embedding[:target_dim]
        
        supabase.table("profile_embeddings").upsert({
            "user_id": user_id,
            "embedding": embedding,
            "status": status,
            "last_updated": datetime.utcnow().isoformat()
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

async def generate_embedding_sync(text: str) -> List[float]:
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(
        executor,
        lambda: asyncio.run(generator.generate_embedding(text))
    )

async def generate_and_store_embedding(text: str, user_id: str, request_id: Optional[str] = None, retry_count: int = 0):
    global processed_count, failed_count
    async with processing_semaphore:
        while queue_paused and not shutdown_event.is_set():
            await queue_paused_event.wait()
        
        if shutdown_event.is_set():
            logger.info(f"Shutdown requested, skipping processing for {user_id}")
            request_queue.task_done()
            return
        
        try:
            logger.info(f"Generating embedding for {user_id}", extra={"user_id": user_id, "request_id": request_id})
            start_time = time.time()
            
            embedding = await generate_embedding_sync(text)
            elapsed_ms = (time.time() - start_time) * 1000
            
            success = store_embedding(user_id, embedding, "completed")
            
            if success:
                processed_count += 1
                logger.info(
                    f"✅ Embedding generated for {user_id} | Time: {elapsed_ms:.0f}ms | Dims: {len(embedding)}",
                    extra={
                        "user_id": user_id,
                        "request_id": request_id,
                        "processing_time_ms": elapsed_ms,
                        "dimensions": len(embedding)
                    }
                )
            else:
                failed_count += 1
                logger.error(f"Failed to store embedding for {user_id}", extra={"user_id": user_id})
                
        except Exception as e:
            error_msg = str(e)
            logger.error(f"Embedding generation failed for {user_id}: {error_msg}", extra={"user_id": user_id, "request_id": request_id, "error": error_msg})
            
            if retry_count < MAX_RETRIES_PER_MESSAGE:
                logger.info(f"Retrying {user_id} (attempt {retry_count + 1}/{MAX_RETRIES_PER_MESSAGE})")
                await asyncio.sleep(2 ** retry_count)
                await request_queue.put((text, user_id, request_id, retry_count + 1))
            else:
                failed_count += 1
                with dlq_lock:
                    dead_letter_queue.append({
                        "user_id": user_id,
                        "text": text[:100] + "..." if len(text) > 100 else text,
                        "request_id": request_id,
                        "error": error_msg,
                        "retries": retry_count,
                        "timestamp": datetime.utcnow().isoformat()
                    })
                logger.error(f"Message moved to DLQ after {MAX_RETRIES_PER_MESSAGE} retries: {user_id}")
                
                if supabase:
                    try:
                        supabase.table("profile_embeddings").upsert({
                            "user_id": user_id,
                            "status": "failed",
                            "last_updated": datetime.utcnow().isoformat()
                        }).execute()
                    except Exception as inner_e:
                        logger.error(f"Failed to update error status for {user_id}: {inner_e}")
        finally:
            request_queue.task_done()

async def queue_processor():
    while not shutdown_event.is_set():
        try:
            text, user_id, request_id, retry_count = await request_queue.get()
            asyncio.create_task(generate_and_store_embedding(text, user_id, request_id, retry_count))
        except asyncio.CancelledError:
            break
        except Exception as e:
            logger.error(f"Queue processor error: {e}")
            if not shutdown_event.is_set():
                await asyncio.sleep(1)

@app.get("/")
async def root():
    uptime = time.time() - start_time
    return {
        "message": "Collabryx Embedding Service",
        "version": "1.1.0",
        "model_info": generator.get_model_info(),
        "queue_size": request_queue.qsize(),
        "queue_capacity": MAX_QUEUE_SIZE,
        "queue_paused": queue_paused,
        "uptime_seconds": uptime
    }

@app.get("/health")
async def health():
    global processed_count, failed_count
    uptime = time.time() - start_time
    supabase_healthy = False
    
    try:
        if supabase:
            response = supabase.table("profiles").select("id").limit(1).execute()
            supabase_healthy = response.data is not None
    except Exception as e:
        logger.error(f"Supabase health check failed: {e}")
    
    model_loaded = hasattr(generator, 'model') and generator.model is not None
    
    health_status = "healthy" if (supabase_healthy and model_loaded and not queue_paused) else "degraded"
    if shutdown_event.is_set():
        health_status = "shutting_down"
    
    return {
        "status": health_status,
        "timestamp": datetime.utcnow().isoformat(),
        "uptime_seconds": uptime,
        "model_info": generator.get_model_info(),
        "model_loaded": model_loaded,
        "supabase_connected": supabase_healthy,
        "queue_size": request_queue.qsize(),
        "queue_capacity": MAX_QUEUE_SIZE,
        "queue_paused": queue_paused,
        "processed_count": processed_count,
        "failed_count": failed_count,
        "dlq_size": len(dead_letter_queue),
        "concurrent_processing": MAX_CONCURRENT_PROCESSING - processing_semaphore._value
    }

@app.get("/model-info")
async def model_info():
    return generator.get_model_info()

@app.post("/generate-embedding", response_model=EmbeddingResponse)
async def generate_embedding(request: EmbeddingRequest):
    try:
        if request_queue.full():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Service at capacity, please try again later"
            )
        
        if queue_paused:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Queue is paused, processing disabled"
            )
        
        await request_queue.put((request.text, request.user_id, request.request_id, 0))
        
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
        
        if queue_paused:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Queue is paused, processing disabled"
            )
        
        await request_queue.put((semantic_text, request.user_id, request.request_id, 0))
        
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

@app.post("/queue/pause")
async def pause_queue():
    global queue_paused
    queue_paused = True
    queue_paused_event.clear()
    logger.info("Queue paused by user request")
    return {"status": "paused", "queue_size": request_queue.qsize()}

@app.post("/queue/resume")
async def resume_queue():
    global queue_paused
    queue_paused = False
    queue_paused_event.set()
    logger.info("Queue resumed by user request")
    return {"status": "resumed", "queue_size": request_queue.qsize()}

@app.get("/queue/status")
async def get_queue_status():
    return {
        "paused": queue_paused,
        "size": request_queue.qsize(),
        "capacity": MAX_QUEUE_SIZE,
        "processed_count": processed_count,
        "failed_count": failed_count,
        "dlq_size": len(dead_letter_queue),
        "concurrent_processing": MAX_CONCURRENT_PROCESSING - processing_semaphore._value
    }

@app.get("/queue/dlq")
async def get_dlq() -> List[DLQEntry]:
    with dlq_lock:
        return [DLQEntry(**entry) for entry in dead_letter_queue]

@app.post("/queue/dlq/retry")
async def retry_dlq(user_id: Optional[str] = None):
    with dlq_lock:
        if user_id:
            entries_to_retry = [e for e in dead_letter_queue if e["user_id"] == user_id]
            dead_letter_queue[:] = [e for e in dead_letter_queue if e["user_id"] != user_id]
        else:
            entries_to_retry = dead_letter_queue.copy()
            dead_letter_queue.clear()
    
    for entry in entries_to_retry:
        await request_queue.put((entry["text"], entry["user_id"], entry["request_id"], 0))
    
    logger.info(f"Retried {len(entries_to_retry)} messages from DLQ")
    return {"retried_count": len(entries_to_retry)}

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}", extra={"path": request.url.path})
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
