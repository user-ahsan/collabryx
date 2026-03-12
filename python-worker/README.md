# Collabryx Embedding Service

Optimized Python worker service for generating semantic embeddings using Sentence Transformers.

## 🎯 Features

- **Semantic Embeddings** - 384-dimensional vectors using `all-MiniLM-L6-v2`
- **Async Queue Processing** - Background job processing with configurable concurrency
- **Health Monitoring** - Real-time health checks with terminal pings every 30s
- **Dead Letter Queue** - Automatic retry logic with poison pill handling
- **Pause/Resume** - Control queue processing without restart
- **Graceful Shutdown** - Proper queue draining on shutdown
- **Comprehensive Testing** - Pytest suite with 80%+ coverage

## 📦 Quick Start

### Build & Run

```bash
# Build Docker image (~1.5-2GB optimized)
make build

# Run service
make run

# View logs
make logs

# Check health
make health
```

### Environment Variables

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
ALLOWED_ORIGINS=http://localhost:3000
```

## 🔧 Make Commands

| Command | Description |
|---------|-------------|
| `make build` | Build Docker image |
| `make run` | Start service |
| `make stop` | Stop service |
| `make logs` | View logs |
| `make health` | Check health |
| `make pause` | Pause queue |
| `make resume` | Resume queue |
| `make queue-status` | Queue status |
| `make dlq` | View DLQ |
| `make dlq-retry` | Retry DLQ |
| `make test` | Run tests |

## 📊 API Endpoints

### Health & Monitoring

```bash
# Health check
GET /health

# Model info
GET /model-info

# Service info
GET /
```

### Queue Management

```bash
# Pause processing
POST /queue/pause

# Resume processing
POST /queue/resume

# Queue status
GET /queue/status

# View dead letter queue
GET /queue/dlq

# Retry DLQ messages
POST /queue/dlq/retry
```

### Generate Embeddings

```bash
# From text
POST /generate-embedding
{
  "text": "Student React Developer passionate about Fintech",
  "user_id": "user-123",
  "request_id": "req-456"
}

# From profile data
POST /generate-embedding-from-profile
{
  "user_id": "user-123",
  "profile": {...},
  "skills": [...],
  "interests": [...]
}
```

## 🏗️ Architecture

### Queue System

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

### Retry Logic

- **Max Retries:** 3 attempts per message
- **Backoff:** Exponential (2s, 4s, 8s)
- **DLQ:** Failed messages moved after 3 retries
- **Manual Retry:** `/queue/dlq/retry` endpoint

### Health Check Response

```json
{
  "status": "healthy",
  "timestamp": "2026-03-12T10:30:00",
  "uptime_seconds": 3600,
  "model_loaded": true,
  "supabase_connected": true,
  "queue_size": 5,
  "queue_capacity": 100,
  "queue_paused": false,
  "processed_count": 150,
  "failed_count": 3,
  "dlq_size": 2,
  "concurrent_processing": 2
}
```

## 🧪 Testing

```bash
# Run all tests
make test

# With coverage
make test-cov

# View coverage report
open htmlcov/index.html
```

### Test Structure

```
tests/
├── conftest.py          # Fixtures
├── test_embedding.py    # Embedding tests
└── __init__.py
```

## 🐳 Docker Optimization

### Image Size Comparison

| Stage | Size | Notes |
|-------|------|-------|
| Original | ~12GB | Full PyTorch CUDA |
| Optimized | ~1.5-2GB | CPU-only, multi-stage |

### Optimization Techniques

1. **Multi-stage build** - Builder + Runtime stages
2. **CPU-only PyTorch** - `torch==2.5.1+cpu`
3. **uv package manager** - 10-15x faster than pip
4. **Slim base image** - `python:3.11-slim-bookworm`
5. **No build tools** - Removed gcc/g++ from runtime
6. **.dockerignore** - Exclude unnecessary files

## 📈 Monitoring

### Terminal Health Pings

Every 30 seconds:
```
❤️ Health Check | Queue: 5/100 | Processed: 150 | Failed: 3 | Uptime: 60.0m | Paused: False
```

### Key Metrics

- **Queue Size** - Current pending jobs
- **Processed Count** - Total successful embeddings
- **Failed Count** - Total failures
- **DLQ Size** - Messages awaiting retry
- **Concurrent Processing** - Active workers
- **Uptime** - Service uptime

## 🔒 Security

- **Non-root user** - Runs as `appuser`
- **Environment variables** - No hardcoded secrets
- **Supabase timeouts** - 5s query timeout
- **Input validation** - Pydantic v2 validators
- **CORS** - Configured origins only

## 🐛 Troubleshooting

### Queue Stuck

```bash
# Check status
make queue-status

# Pause and resume
make pause
make resume
```

### High Failure Rate

```bash
# View DLQ
make dlq

# Retry failed
make dlq-retry

# Check logs
make logs-error
```

### Memory Issues

```bash
# Check resource limits in docker-compose.yml
# Default: 2G memory, 2 CPU
```

## 📝 Changelog

### v1.1.0 (2026-03-12)

- ✅ Fixed Pydantic v2 validators
- ✅ Added Supabase timeouts
- ✅ Fixed CPU-bound blocking with thread pool
- ✅ Added queue pause/resume
- ✅ Added health monitor with terminal pings
- ✅ Added dead letter queue
- ✅ Added graceful shutdown
- ✅ Optimized Docker image (12GB → ~2GB)
- ✅ Added comprehensive pytest suite

### v1.0.0

- Initial release

## 📄 License

Proprietary - Collabryx
