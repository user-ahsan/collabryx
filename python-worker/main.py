"""
Collabryx Embedding Service
FastAPI server for generating semantic embeddings using Sentence Transformers
"""

from fastapi import FastAPI, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import os
import time
import asyncio
import concurrent.futures
from dotenv import load_dotenv
from supabase import create_client, Client

from embedding_generator import generator, construct_semantic_text

load_dotenv()

# Initialize Supabase Client
supabase_url = os.environ.get("SUPABASE_URL")
supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase: Optional[Client] = create_client(supabase_url, supabase_key) if supabase_url and supabase_key else None

app = FastAPI(
    title="Collabryx Embedding Service",
    description="Generate semantic embeddings for user profiles using Sentence Transformers",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure properly in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class EmbeddingRequest(BaseModel):
    """Request body for embedding generation"""
    text: str = Field(..., description="Text to embed (semantic profile string)")
    user_id: str = Field(..., description="User ID for tracking")
    request_id: Optional[str] = Field(None, description="Optional request ID for tracking")

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

from datetime import datetime

# Thread pool for parallel execution
executor = concurrent.futures.ThreadPoolExecutor(max_workers=4)

def store_embedding(user_id: str, embedding: List[float], status: str):
    """Store embedding in Supabase"""
    if not supabase:
        print(f"Warning: Supabase client not initialized. Cannot store embedding for {user_id}")
        return
        
    try:
        # Pad/slice to 768 dimensions for pgvector
        target_dim = 768
        if len(embedding) < target_dim:
            embedding.extend([0.0] * (target_dim - len(embedding)))
        elif len(embedding) > target_dim:
            embedding = embedding[:target_dim]
            
        supabase.table("profile_embeddings").upsert({
            "user_id": user_id,
            "embedding": embedding,
            "status": status,
            "last_updated": datetime.utcnow().isoformat()
        }).execute()
        print(f"Successfully stored embedding for {user_id}")
    except Exception as e:
        print(f"Failed to store embedding for {user_id}: {e}")
        try:
            supabase.table("profile_embeddings").upsert({
                "user_id": user_id,
                "status": "failed",
                "last_updated": datetime.utcnow().isoformat()
            }).execute()
        except Exception as inner_e:
            print(f"Failed to update error status for {user_id}: {inner_e}")

def generate_and_store_embedding(text: str, user_id: str):
    """Background thread function to generate and save embedding"""
    try:
        print(f"Generating embedding for {user_id}...")
        # Generate the actual embedding
        embedding = generator.generate_embedding(text)
        store_embedding(user_id, embedding, "completed")
    except Exception as e:
        print(f"Embedding generation failed for {user_id}: {e}")
        if supabase:
            try:
                supabase.table("profile_embeddings").upsert({
                    "user_id": user_id,
                    "status": "failed",
                    "last_updated": datetime.utcnow().isoformat()
                }).execute()
            except Exception as inner_e:
                 print(f"Failed to update error status for {user_id}: {inner_e}")

@app.get("/")
async def root():
    """Root endpoint with service info"""
    return {
        "message": "Collabryx Embedding Service",
        "model_info": generator.get_model_info()
    }

@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": time.time(),
        "model_info": generator.get_model_info(),
        "supabase_connected": supabase is not None
    }

@app.get("/model-info")
async def model_info():
    """Get information about the embedding model"""
    return generator.get_model_info()

@app.post("/generate-embedding", response_model=EmbeddingResponse)
async def generate_embedding(request: EmbeddingRequest, background_tasks: BackgroundTasks):
    """
    Queue vector embedding generation for text input
    """
    if not request.text or len(request.text.strip()) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text content is required"
        )
    
    # Delegate heavy lifting to the background thread pool
    background_tasks.add_task(
        lambda: asyncio.get_event_loop().run_in_executor(
            executor, 
            generate_and_store_embedding, 
            request.text, 
            request.user_id
        )
    )
    
    return EmbeddingResponse(
        user_id=request.user_id,
        status="queued",
        message="Vector embedding queued for background processing",
        request_id=request.request_id
    )

@app.post("/generate-embedding-from-profile", response_model=EmbeddingResponse)
async def generate_embedding_from_profile(request: ProfileDataRequest, background_tasks: BackgroundTasks):
    """
    Queue embedding generation from complete profile data
    """
    try:
        # Construct semantic text from profile data (fast)
        semantic_text = construct_semantic_text(
            request.profile,
            request.skills,
            request.interests
        )
        
        # Delegate heavy lifting to the background thread pool
        background_tasks.add_task(
            lambda: asyncio.get_event_loop().run_in_executor(
                executor, 
                generate_and_store_embedding, 
                semantic_text, 
                request.user_id
            )
        )
        
        return EmbeddingResponse(
            user_id=request.user_id,
            status="queued",
            message="Vector embedding queued for background processing",
            request_id=request.request_id
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error preparing embedding generation: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
