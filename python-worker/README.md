# Collabryx Embedding Service

Self-hosted vector embedding service for Collabryx user profiles.

## Overview

This service generates semantic embeddings for user profiles using the `all-MiniLM-L6-v2` model from Sentence Transformers. These embeddings are used for semantic matching to connect users with complementary collaborators.

## Model Information

- **Model**: `sentence-transformers/all-MiniLM-L6-v2`
- **Dimensions**: 768
- **Max Sequence Length**: 256 tokens
- **Optimization**: Optimized for semantic search

## Features

- **Fast**: Optimized model with low latency
- **Lightweight**: Small model size (~80MB)
- **Self-hosted**: No external API dependencies
- **Accurate**: State-of-the-art semantic understanding

## Directory Structure

```
python-worker/
├── Dockerfile              # Container configuration
├── docker-compose.yml      # Local development
├── requirements.txt        # Python dependencies
├── main.py                 # FastAPI server
├── embedding_generator.py  # Core embedding logic
├── test_embeddings.py      # Test suite
└── README.md              # This file
```

## Installation

### Local Development

1. **Install Python dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

2. **Run the server**:
   ```bash
   uvicorn main:app --host 0.0.0.0 --port 8000 --reload
   ```

### Docker Deployment

1. **Build the image**:
   ```bash
   docker build -t collabryx-embedding-service .
   ```

2. **Run the container**:
   ```bash
   docker run -p 8000:8000 collabryx-embedding-service
   ```

3. **Or use docker-compose**:
   ```bash
   docker-compose up
   ```

## API Endpoints

### GET /

Returns service information.

**Response**:
```json
{
  "message": "Collabryx Embedding Service",
  "model_info": {
    "model_name": "all-MiniLM-L6-v2",
    "dimensions": 768,
    "device": "cuda" | "cpu",
    "max_seq_length": 256
  }
}
```

### GET /health

Health check endpoint.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": 1234567890.123,
  "model_info": { ... }
}
```

### POST /generate-embedding

Generate embedding for text input.

**Request**:
```json
{
  "text": "Role: Student. Headline: React Developer...",
  "user_id": "uuid-of-user",
  "request_id": "optional-request-id"
}
```

**Response**:
```json
{
  "user_id": "uuid-of-user",
  "embedding": [0.1, 0.2, ..., 0.9],  // 768 dimensions
  "dimensions": 768,
  "model": "all-MiniLM-L6-v2",
  "request_id": "optional-request-id",
  "status": "success",
  "processing_time_ms": 45.23
}
```

### POST /generate-embedding-from-profile

Generate embedding from complete profile data.

**Request**:
```json
{
  "user_id": "uuid-of-user",
  "profile": {
    "role": "Student",
    "headline": "React Developer",
    "bio": "...",
    "looking_for": ["cofounder", "teammate"],
    "location": "San Francisco"
  },
  "skills": [
    {"skill_name": "React", "proficiency": "advanced"}
  ],
  "interests": [
    {"interest": "Fintech"}
  ],
  "request_id": "optional-request-id"
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PYTHONUNBUFFERED` | Disable output buffering | 1 |

## Deployment

### Railway (Recommended)

1. Push this directory to GitHub
2. Connect to Railway
3. Set environment variables
4. Deploy

### Render

1. Create new Web Service
2. Connect to GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Self-hosted VPS

1. Install Docker
2. Pull or build the image
3. Run with proper networking

## Testing

Run the test suite:

```bash
python test_embeddings.py
```

## Integration with Collabryx

The Python worker is called by the Supabase Edge Function (`generate-embedding`) which:

1. Fetches user profile data from Supabase
2. Constructs semantic text from profile, skills, and interests
3. Calls this service via HTTP
4. Stores the resulting embedding in the `profile_embeddings` table

## Performance

- **Cold start**: ~2-3 seconds (model loading)
- **Inference**: ~10-50ms per embedding
- **Memory usage**: ~200MB (model + dependencies)

## Notes

- The model loads on first request (lazy loading)
- Consider warming up the model on startup for production
- GPU acceleration is automatically used if available

## License

MIT License
