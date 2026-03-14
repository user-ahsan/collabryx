# 🧠 Vector Embeddings System

Complete overview of the embedding generation system for semantic matching.

---

## Table of Contents

- [System Overview](#system-overview)
- [Architecture](#architecture)
- [Components](#components)
- [Database Schema](#database-schema)
- [Reliability Features](#reliability-features)
- [API Reference](#api-reference)
- [Monitoring](#monitoring)
- [Troubleshooting](#troubleshooting)

---

## System Overview

The embedding system converts user profile data into 384-dimensional vectors for semantic matching, enabling intelligent profile recommendations based on skills, interests, and goals.

### Key Features

- **384-dimensional vectors** using `all-MiniLM-L6-v2` model
- **Automatic generation** on profile updates
- **Reliability system** with retry queue and rate limiting
- **Background processing** via Python worker
- **Real-time monitoring** and health checks

### Performance Metrics

| Metric | Target | Current |
|--------|--------|---------|
| Embedding Dimensions | 384 | ✅ 384 |
| Processing Time | <2s | ~1.5s |
| Queue Capacity | 100 | ✅ 100 |
| Max Concurrent | 5 | ✅ 5 |
| Rate Limit | 3/min | ✅ 3/min |

---

## Architecture

```
┌─────────────────┐
│  User Updates   │
│    Profile      │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Supabase       │
│  Database       │
│  (profiles)     │
└────────┬────────┘
         │
         ▼ (Trigger)
┌─────────────────┐
│  Pending Queue  │
│  (onboarding)   │
└────────┬────────┘
         │
         ▼ (Rate Limited)
┌─────────────────┐
│  Python Worker  │
│  (FastAPI)      │
└────────┬────────┘
         │
         ├──────────────┐
         │              │
         ▼              ▼
┌─────────────────┐  ┌──────────────────┐
│  Success        │  │  Failed (DLQ)    │
│  (embeddings)   │  │  (retry queue)   │
└─────────────────┘  └──────────────────┘
```

---

## Components

### 1. Python Worker

**Location:** `python-worker/`

FastAPI service for embedding generation.

**Features:**
- Model: `sentence-transformers/all-MiniLM-L6-v2`
- Dimensions: 384
- Device: CPU (GPU optional)
- Health endpoint: `/health`

**Endpoints:**

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check with queue metrics |
| `/model-info` | GET | Model information |
| `/generate-embedding` | POST | Generate embedding for text |
| `/queue/status` | GET | Queue status |

### 2. Database Tables

#### `profile_embeddings`

Stores generated embeddings for profile matching.

```sql
CREATE TABLE profile_embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  embedding vector(384),
  skills_text TEXT,
  interests_text TEXT,
  looking_for TEXT,
  headline TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `embedding_dead_letter_queue`

Failed embeddings for retry.

```sql
CREATE TABLE embedding_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  profile_data JSONB NOT NULL,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  next_retry_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `embedding_rate_limits`

Rate limiting tracking.

```sql
CREATE TABLE embedding_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `embedding_pending_queue`

Onboarding embedding queue.

```sql
CREATE TABLE embedding_pending_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  profile_data JSONB NOT NULL,
  status pending_status DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);
```

### 3. Triggers

Automatic embedding generation on profile updates:

```sql
CREATE OR REPLACE FUNCTION queue_profile_embedding()
RETURNS TRIGGER AS $$
BEGIN
  -- Add to pending queue
  INSERT INTO embedding_pending_queue (user_id, profile_data)
  VALUES (NEW.id, row_to_json(NEW))
  ON CONFLICT (user_id) DO UPDATE
  SET profile_data = row_to_json(NEW), status = 'pending';
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION queue_profile_embedding();
```

---

## Reliability Features

### 1. Dead Letter Queue (DLQ)

**Purpose:** Retry failed embeddings

**Workflow:**
1. Embedding generation fails
2. Error logged to DLQ
3. Retry count incremented
4. Automatic retry after delay
5. Max 3 retries before manual intervention

**Retry Schedule:**
- Retry 1: 5 minutes after failure
- Retry 2: 30 minutes after failure
- Retry 3: 2 hours after failure

### 2. Rate Limiting

**Purpose:** Prevent API abuse and model overload

**Limits:**
- 3 requests per minute per user
- 100 requests per minute total
- Sliding window (1 minute)

**Implementation:**
```python
# main.py
async def check_rate_limit(user_id: str) -> bool:
    # Check Supabase rate_limits table
    # Return True if within limits
```

### 3. Pending Queue

**Purpose:** Queue embeddings for new users during onboarding

**Features:**
- One entry per user (unique constraint)
- Status tracking (pending, processing, completed, failed)
- Batch processing support

### 4. Concurrent Processing

**Purpose:** Maximize throughput without overload

**Configuration:**
```python
MAX_CONCURRENT_PROCESSING = 5
MAX_QUEUE_SIZE = 100
```

---

## Database Schema

### Complete ERD

```
┌──────────────────────┐
│      profiles        │
│──────────────────────│
│ id (PK)              │
│ user_id (FK → auth)  │
│ name                 │
│ headline             │
│ skills               │
│ interests            │
│ looking_for          │
└──────────┬───────────┘
           │
           │ (1:1)
           ▼
┌──────────────────────┐
│  profile_embeddings  │
│──────────────────────│
│ id (PK)              │
│ user_id (FK, UNIQUE) │
│ embedding vector(384)│
│ skills_text          │
│ interests_text       │
└──────────────────────┘
           │
           │ (trigger)
           ▼
┌──────────────────────┐
│ embedding_pending_   │
│      queue           │
│──────────────────────│
│ id (PK)              │
│ user_id (UNIQUE)     │
│ profile_data (JSONB) │
│ status               │
└──────────────────────┘
           │
           │ (processing)
           ▼
┌──────────────────────┐
│ embedding_dead_      │
│     letter_queue     │
│──────────────────────│
│ id (PK)              │
│ user_id              │
│ error_message        │
│ retry_count          │
└──────────────────────┘
```

---

## API Reference

### Python Worker API

#### GET `/health`

Health check with queue metrics.

**Response:**
```json
{
  "status": "healthy",
  "model_info": {
    "model_name": "all-MiniLM-L6-v2",
    "dimensions": 384,
    "device": "cpu"
  },
  "supabase_connected": true,
  "queue_size": 0,
  "queue_capacity": 100,
  "failed_count": 0
}
```

#### POST `/generate-embedding`

Generate embedding for text.

**Request:**
```json
{
  "text": "React Developer with 5 years experience",
  "user_id": "user-123"
}
```

**Response:**
```json
{
  "user_id": "user-123",
  "status": "queued",
  "message": "Vector embedding queued for background processing"
}
```

#### GET `/queue/status`

Get current queue status.

**Response:**
```json
{
  "queue_size": 5,
  "queue_capacity": 100,
  "processing": 2,
  "failed": 0,
  "rate_limit_remaining": 8
}
```

---

## Monitoring

### Health Check Endpoint

```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "supabase_connected": true,
  "queue_size": 0
}
```

### Queue Metrics

Monitor these metrics:

| Metric | Warning | Critical |
|--------|---------|----------|
| Queue Size | >50 | >80 |
| Failed Count | >5 | >10 |
| Processing Time | >3s | >5s |
| Rate Limit Hits | >20/min | >50/min |

### Logging

```python
# Success
logger.info(f"Embedding generated for user {user_id}")

# Failure
logger.error(f"Embedding failed for user {user_id}: {error}")

# Rate limit
logger.warning(f"Rate limit exceeded for user {user_id}")
```

---

## Troubleshooting

### Issue: Embeddings Not Generating

**Symptoms:**
- `profile_embeddings` table empty
- No errors in logs

**Solution:**
```sql
-- Check if trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_profile_update';

-- Check pending queue
SELECT * FROM embedding_pending_queue WHERE status = 'pending';

-- Manually trigger embedding
INSERT INTO embedding_pending_queue (user_id, profile_data)
SELECT id, row_to_json(profiles)
FROM profiles
WHERE id = 'user-id';
```

### Issue: Queue Backlog

**Symptoms:**
- Queue size > 50
- Processing time increasing

**Solution:**
```bash
# Scale Python worker
# Increase MAX_CONCURRENT_PROCESSING to 10
# Deploy additional worker instances
```

### Issue: High Failure Rate

**Symptoms:**
- DLQ growing rapidly
- Embedding failures in logs

**Solution:**
```python
# Check model loading
curl http://localhost:8000/model-info

# Verify Supabase connection
curl http://localhost:8000/health

# Check error messages in DLQ
SELECT error_message, COUNT(*) 
FROM embedding_dead_letter_queue 
GROUP BY error_message;
```

### Issue: Rate Limiting Too Aggressive

**Symptoms:**
- Users hitting rate limits frequently
- Legitimate requests blocked

**Solution:**
```sql
-- Increase rate limits
UPDATE embedding_rate_limits
SET request_count = request_count - 10
WHERE window_start > NOW() - INTERVAL '1 minute';

-- Or adjust limits in main.py
RATE_LIMIT_PER_MINUTE = 10  -- Increase from 3
```

---

## Deployment

### Local Development

```bash
cd python-worker
docker-compose up -d

# Verify
curl http://localhost:8000/health
```

### Production

See [Python Worker Deployment Guide](./python-worker/deployment.md)

**Platforms:**
- Render (recommended)
- Railway
- Self-hosted (Docker)

### Environment Variables

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=https://your-app.com
PYTHONUNBUFFERED=1
```

---

## Performance Optimization

### Batch Processing

For initial data migration:

```python
# Process in batches of 50
async def process_batch(user_ids: List[str]):
    tasks = [generate_embedding(user_id) for user_id in user_ids]
    await asyncio.gather(*tasks)
```

### Caching

Cache frequently accessed embeddings:

```python
from functools import lru_cache

@lru_cache(maxsize=1000)
def get_embedding(user_id: str):
    # Fetch from Supabase
```

### Index Optimization

Add index for faster lookups:

```sql
CREATE INDEX idx_profile_embeddings_user_id 
ON profile_embeddings(user_id);

-- Vector similarity index
CREATE INDEX idx_profile_embeddings_embedding 
ON profile_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);
```

---

## Security

### API Authentication

```python
# Validate API key
async def validate_api_key(request: Request):
    api_key = request.headers.get("X-API-Key")
    if api_key != os.getenv("API_KEY"):
        raise HTTPException(status_code=401)
```

### Input Validation

```python
from pydantic import BaseModel, Field

class EmbeddingRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=1000)
    user_id: str = Field(..., min_length=1)
```

### Rate Limiting

Already implemented in `embedding_rate_limits` table.

---

## Cost Estimation

### Render Deployment

| Tier | RAM | CPU | Cost/Month |
|------|-----|-----|------------|
| Standard | 2GB | 0.5 | $25 |
| Pro | 4GB | 1.0 | $50 |

**Recommended:** Standard tier for most use cases

### Railway Deployment

| Resource | Usage | Cost/Month |
|----------|-------|------------|
| RAM | 2GB | ~$10 |
| CPU | 0.5 | ~$5 |
| **Total** | | **~$15** |

---

## Future Improvements

### Planned Features

- [ ] GPU acceleration for faster processing
- [ ] Multi-model support (different embedding models)
- [ ] Advanced analytics dashboard
- [ ] A/B testing for matching algorithms
- [ ] Real-time embedding updates

### Performance Goals

- Reduce processing time to <1s
- Increase queue capacity to 500
- Add distributed processing support
- Implement embedding compression

---

## Additional Resources

- [Sentence Transformers Documentation](https://www.sbert.net/)
- [Supabase pgvector Guide](https://supabase.com/docs/guides/database/extensions/pgvector)
- [Python Worker Deployment](./python-worker/deployment.md)

---

**Need help?** Check [Troubleshooting](#troubleshooting) or contact DevOps.

[← Back to Infrastructure](../README.md) | [Python Worker →](../python-worker/README.md)
