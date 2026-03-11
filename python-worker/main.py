"""
Collabryx Embedding Service
FastAPI server for generating semantic embeddings using Sentence Transformers
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
import os
import time
from dotenv import load_dotenv

from embedding_generator import generator, construct_semantic_text

load_dotenv()

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
    embedding: List[float]
    dimensions: int
    model: str
    request_id: Optional[str] = None
    status: str = "success"
    processing_time_ms: float

class ProfileDataRequest(BaseModel):
    """Request body for generating embedding from profile data"""
    user_id: str = Field(..., description="User ID")
    profile: dict = Field(..., description="User profile data")
    skills: List[dict] = Field(default_factory=list, description="User skills")
    interests: List[dict] = Field(default_factory=list, description="User interests")
    request_id: Optional[str] = Field(None, description="Optional request ID")

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
        "model_info": generator.get_model_info()
    }

@app.get("/model-info")
async def model_info():
    """Get information about the embedding model"""
    return generator.get_model_info()

@app.post("/generate-embedding", response_model=EmbeddingResponse)
async def generate_embedding(request: EmbeddingRequest):
    """
    Generate vector embedding for text input
    
    Returns:
        768-dimensional vector embedding
    """
    start_time = time.time()
    
    try:
        if not request.text or len(request.text.strip()) == 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Text content is required"
            )
        
        embedding = generator.generate_embedding(request.text)
        processing_time = (time.time() - start_time) * 1000
        
        return EmbeddingResponse(
            user_id=request.user_id,
            embedding=embedding,
            dimensions=len(embedding),
            model="all-MiniLM-L6-v2",
            request_id=request.request_id,
            status="success",
            processing_time_ms=round(processing_time, 2)
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating embedding: {str(e)}"
        )

@app.post("/generate-embedding-from-profile", response_model=EmbeddingResponse)
async def generate_embedding_from_profile(request: ProfileDataRequest):
    """
    Generate embedding from complete profile data
    
    Constructs semantic text from profile, skills, and interests
    """
    start_time = time.time()
    
    try:
        # Construct semantic text from profile data
        semantic_text = construct_semantic_text(
            request.profile,
            request.skills,
            request.interests
        )
        
        embedding = generator.generate_embedding(semantic_text)
        processing_time = (time.time() - start_time) * 1000
        
        return EmbeddingResponse(
            user_id=request.user_id,
            embedding=embedding,
            dimensions=len(embedding),
            model="all-MiniLM-L6-v2",
            request_id=request.request_id,
            status="success",
            processing_time_ms=round(processing_time, 2)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating embedding: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
