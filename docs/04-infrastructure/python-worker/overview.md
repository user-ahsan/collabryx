# Python Worker

Self-hosted embedding generation service for semantic matching.

---

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Development](#development)
- [Deployment](#deployment)
- [API Reference](#api-reference)
- [Troubleshooting](#troubleshooting)

---

## Overview

The Python Worker is a FastAPI service that generates vector embeddings using Sentence Transformers. It's used by Collabryx for semantic profile matching.

### Key Features

- **Model**: `all-MiniLM-L6-v2` (768 dimensions)
- **Framework**: FastAPI
- **Performance**: ~100ms per embedding
- **Scalability**: Stateless, horizontally scalable

---

## Setup

### Prerequisites

- Python 3.9+
- pip
- 512MB+ RAM

### Installation

```bash
cd python-worker

# Create virtual environment
python -m venv venv

# Activate environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### Requirements

```txt
fastapi==0.104.1
uvicorn[standard]==0.24.0
sentence-transformers==2.2.2
torch==2.1.0
pydantic==2.5.0
python-dotenv==1.0.0
```

---

## Development

### Start Development Server

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Test Endpoints

```bash
# Health check
curl http://localhost:8000/health

# Generate embedding
curl -X POST http://localhost:8000/embed \
  -H "Content-Type: application/json" \
  -d '{"text": "Software engineer skilled in React"}'
```

### Run Tests

```bash
python test_embeddings.py
```

---

## Deployment

### Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize and deploy
railway init
railway up
```

**Environment Variables:**
- `PORT`: 8000 (auto-set by Railway)
- `PYTHON_VERSION`: 3.10

### Render

1. Create new **Web Service**
2. Connect repository
3. **Build Command**: `pip install -r requirements.txt`
4. **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Set environment variables

### Docker

```bash
# Build image
docker build -t collabryx-embedding-worker .

# Run container
docker run -p 8000:8000 collabryx-embedding-worker
```

---

## API Reference

### `GET /health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "model_info": {
    "model_name": "all-MiniLM-L6-v2",
    "dimensions": 768
  }
}
```

### `POST /embed`

Generate embedding for text.

**Request:**
```json
{
  "text": "Software Engineer with 5 years experience..."
}
```

**Response:**
```json
{
  "embedding": [0.0234, -0.0156, ...],
  "dimensions": 768,
  "model": "all-MiniLM-L6-v2",
  "processing_time_ms": 95
}
```

### `POST /embed/batch`

Generate embeddings for multiple texts.

**Request:**
```json
{
  "texts": ["text 1", "text 2", "text 3"]
}
```

**Response:**
```json
{
  "embeddings": [
    [0.0234, -0.0156, ...],
    [0.0891, 0.0123, ...],
    [-0.0456, 0.0789, ...]
  ],
  "count": 3,
  "total_time_ms": 250
}
```

---

## Troubleshooting

### Issue: Model Loading Fails

**Symptoms:**
- Error: "Error loading model"
- 500 on first request

**Solutions:**
1. Check disk space (model needs ~500MB)
2. Verify internet connection for initial download
3. Pre-download model: `python -c "from sentence_transformers import SentenceTransformer; SentenceTransformer('all-MiniLM-L6-v2')"`

### Issue: High Memory Usage

**Symptoms:**
- Worker crashes with OOM
- Memory > 1GB

**Solutions:**
1. Reduce batch size
2. Use CPU-only mode (slower but less memory)
3. Increase container memory limit

### Issue: Slow Embedding Generation

**Symptoms:**
- Embedding takes > 1 second
- Queue builds up

**Solutions:**
1. Enable GPU acceleration
2. Scale horizontally (multiple workers)
3. Use model quantization

---

**Last Updated**: 2026-03-14  
**Version**: 2.0.0

[← Back to Docs](../../README.md) | [Vector Embeddings →](../vector-embeddings/overview.md)
