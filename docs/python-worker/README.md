# Python Worker Deployment Guide

**Service:** Collabryx Embedding Service  
**Version:** 1.1.0  
**Last Updated:** 2026-03-12

---

## Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Development Deployment](./development.md)
4. [Production Deployment](./production.md)
   - [Render](./production.md#render)
   - [Railway](./production.md#railway)
5. [Troubleshooting](#troubleshooting)

---

## Overview

The Python Worker is a self-contained embedding generation service that creates 384-dimensional semantic vectors for user profiles using the `all-MiniLM-L6-v2` model.

### Key Features

- **Optimized Docker Image** - ~3GB (reduced from 12GB)
- **Multi-stage Build** - Builder + Runtime stages for minimal size
- **Health Monitoring** - Real-time health checks with metrics
- **Queue Management** - Pause/resume, dead letter queue, retry logic
- **Graceful Shutdown** - Proper queue draining on shutdown

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Request   │────▶│  Async Queue │────▶│  Processor  │
│   (HTTP)    │     │  (max: 100)  │     │  (max: 5)   │
└─────────────┘     └──────────────┘     └─────────────┘
                                              │
                                              ▼
                                       ┌─────────────┐
                                       │   Supabase  │
                                       │  (Storage)  │
                                       └─────────────┘
```

---

## Quick Start

### Development

```bash
cd python-worker
docker-compose up -d
```

### Production

```bash
# Build optimized image
docker build -t collabryx-embedding-service .

# Deploy to registry
docker tag collabryx-embedding-service registry.com/collabryx-embedding-service:latest
docker push registry.com/collabryx-embedding-service:latest
```

---

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `SUPABASE_URL` | Yes | Supabase project URL | - |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Supabase service role key | - |
| `ALLOWED_ORIGINS` | No | CORS allowed origins | `http://localhost:3000` |
| `PYTHONUNBUFFERED` | No | Disable output buffering | `1` |

### Ports

| Port | Protocol | Description |
|------|----------|-------------|
| 8000 | HTTP | API endpoint |

---

## API Endpoints

### Health & Monitoring

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Service info |
| `/health` | GET | Health check with metrics |
| `/model-info` | GET | Model information |

### Queue Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/queue/status` | GET | Queue status |
| `/queue/pause` | POST | Pause processing |
| `/queue/resume` | POST | Resume processing |
| `/queue/dlq` | GET | View dead letter queue |
| `/queue/dlq/retry` | POST | Retry DLQ messages |

### Embedding Generation

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/generate-embedding` | POST | Generate from text |
| `/generate-embedding-from-profile` | POST | Generate from profile data |

---

## Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2026-03-12T16:09:26.267941",
  "uptime_seconds": 12.77,
  "model_info": {
    "model_name": "all-MiniLM-L6-v2",
    "dimensions": 384,
    "device": "cpu",
    "max_seq_length": 256
  },
  "model_loaded": true,
  "supabase_connected": false,
  "queue_size": 0,
  "queue_capacity": 100,
  "queue_paused": false,
  "processed_count": 0,
  "failed_count": 0,
  "dlq_size": 0,
  "concurrent_processing": 0
}
```

### Health Status Values

- **`healthy`** - All systems operational
- **`degraded`** - Some issues (Supabase disconnected, model not loaded, queue paused)
- **`shutting_down`** - Graceful shutdown in progress

---

## Resource Requirements

### Minimum

- **CPU:** 1 core
- **Memory:** 1GB
- **Storage:** 5GB (for model cache)

### Recommended

- **CPU:** 2 cores
- **Memory:** 2GB
- **Storage:** 10GB

---

## Troubleshooting

### Build Fails

**Issue:** Dependency resolution errors

**Solution:**
```bash
# Clear Docker cache
docker builder prune -a

# Rebuild without cache
docker build --no-cache -t collabryx-embedding-service .
```

### Container Crashes

**Issue:** Out of memory

**Solution:**
```yaml
# Increase memory in docker-compose.yml
deploy:
  resources:
    limits:
      memory: 4G
```

### Health Check Fails

**Issue:** Model not loading

**Solution:**
```bash
# Check logs
docker-compose logs embedding-service

# Increase start period
healthcheck:
  start_period: 60s
```

---

## Files Structure

```
python-worker/
├── Dockerfile              # Multi-stage optimized build
├── docker-compose.yml      # Development configuration
├── requirements.txt        # Python dependencies
├── main.py                 # FastAPI server
├── embedding_generator.py  # Embedding logic
├── tests/                  # Pytest test suite
│   ├── conftest.py
│   ├── test_embedding.py
│   └── __init__.py
├── pytest.ini              # Test configuration
└── README.md               # This file
```

---

## Next Steps

- [Development Guide](./development.md) - Local development setup
- [Production Guide](./production.md) - Deploy to Render or Railway
