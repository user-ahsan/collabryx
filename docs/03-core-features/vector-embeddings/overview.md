# Vector Embeddings System

Complete guide to Collabryx's vector embeddings system for semantic matching.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Implementation](#implementation)
- [Database Schema](#database-schema)
- [Embedding Generation](#embedding-generation)
- [Matching Algorithm](#matching-algorithm)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)

---

## Overview

Collabryx uses **vector embeddings** to enable semantic matching between users based on their profiles, skills, and interests. This allows the platform to suggest meaningful connections beyond simple keyword matching.

### How It Works

```
User Profile → Semantic Text → Embedding (768 dimensions) → Vector Storage → Cosine Similarity Search
```

### Key Benefits

- **Semantic Understanding**: Matches based on meaning, not keywords
- **Scalable**: Efficient similarity search with HNSW index
- **Dynamic**: Updates automatically when profiles change
- **Accurate**: Uses industry-standard sentence transformers

---

## Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────┐
│                    Vector Embedding Flow                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. User completes onboarding                               │
│         ↓                                                   │
│  2. Profile data collected (skills, interests, bio)         │
│         ↓                                                   │
│  3. Text concatenation & normalization                      │
│         ↓                                                   │
│  4. Python Worker generates embedding (768 dim)             │
│         ↓                                                   │
│  5. Store in profile_embeddings table (pgvector)            │
│         ↓                                                   │
│  6. Cosine similarity search for matches                    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Component Overview

| Component | Purpose | Technology |
|-----------|---------|------------|
| **Python Worker** | Embedding generation | FastAPI + Sentence Transformers |
| **Edge Function** | Orchestration layer | Supabase Edge Functions (Deno) |
| **Database** | Vector storage | PostgreSQL + pgvector |
| **Frontend** | Progress UI | React + React Query |

---

## Implementation

### Embedding Model

- **Model**: `all-MiniLM-L6-v2`
- **Dimensions**: 768
- **Type**: Sentence Transformer
- **Use Case**: Semantic text similarity

### Text Construction

Profile text is constructed from:

```typescript
const profileText = [
  user.role,
  user.headline,
  user.bio,
  ...user.skills.map(s => s.name),
  ...user.interests.map(i => i.name),
  user.looking_for,
  user.goals
].filter(Boolean).join(' ')
```

---

## Database Schema

### profile_embeddings Table

```sql
CREATE TABLE profile_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  embedding vector(768),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Indexes

```sql
-- HNSW index for fast similarity search
CREATE INDEX profile_embeddings_embedding_idx 
ON profile_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

### Triggers

```sql
-- Auto-update updated_at
CREATE TRIGGER update_profile_embeddings_timestamp
  BEFORE UPDATE ON profile_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## Embedding Generation

### Python Worker API

#### Endpoint: `POST /embed`

**Request:**
```json
{
  "text": "Software Engineer skilled in React, Node.js, Python..."
}
```

**Response:**
```json
{
  "embedding": [0.0234, -0.0156, 0.0891, ...],
  "dimensions": 768,
  "model": "all-MiniLM-L6-v2"
}
```

#### Endpoint: `GET /health`

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

### Edge Function Flow

```typescript
// supabase/functions/generate-embedding/index.ts
import { serve } from 'https://deno.land/std@http/server.ts'

serve(async (req) => {
  const { profile } = await req.json()
  
  // 1. Construct profile text
  const text = constructProfileText(profile)
  
  // 2. Call Python worker
  const response = await fetch(PYTHON_WORKER_URL, {
    method: 'POST',
    body: JSON.stringify({ text })
  })
  
  const { embedding } = await response.json()
  
  // 3. Store in database
  await supabase
    .from('profile_embeddings')
    .upsert({ user_id: profile.id, embedding })
  
  return new Response(JSON.stringify({ success: true }))
})
```

---

## Matching Algorithm

### Cosine Similarity Search

```sql
-- Find top 10 matches with similarity > 0.5
SELECT 
  profiles.id,
  profiles.name,
  profiles.headline,
  1 - (pe.embedding <=> query_embedding) AS similarity
FROM profile_embeddings pe
JOIN profiles ON pe.user_id = profiles.id
WHERE pe.user_id != current_user_id
  AND 1 - (pe.embedding <=> query_embedding) > 0.5
ORDER BY similarity DESC
LIMIT 10;
```

### Similarity Thresholds

| Score | Match Quality | Action |
|-------|---------------|--------|
| 0.8+ | Excellent | Highlight as top match |
| 0.6-0.8 | Good | Show in suggestions |
| 0.5-0.6 | Fair | Include in extended matches |
| < 0.5 | Poor | Exclude from results |

---

## Deployment

### Python Worker Deployment

#### Option 1: Railway

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd python-worker
railway init
railway up
```

#### Option 2: Render

1. Create new Web Service
2. Connect GitHub repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables

#### Option 3: Docker

```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables

```env
# Python Worker
PYTHON_WORKER_URL=https://your-worker.railway.app

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key
```

---

## Troubleshooting

### Common Issues

#### Issue 1: Embedding Generation Fails

**Symptoms:**
- Error: "Failed to generate embedding"
- Python worker returns 500

**Solutions:**
1. Check Python worker health: `curl https://your-worker/health`
2. Verify model loaded: Check worker logs
3. Restart worker service
4. Check memory allocation (minimum 512MB)

#### Issue 2: Slow Similarity Search

**Symptoms:**
- Match queries take > 2 seconds
- Database CPU spikes

**Solutions:**
1. Verify HNSW index exists
2. Check index parameters (m=16, ef_construction=64)
3. Add WHERE clause filters
4. Limit results (MAX 100)

#### Issue 3: Dimension Mismatch

**Symptoms:**
- Error: "expected 768 dimensions, got 384"
- Migration from old embeddings

**Solutions:**
1. Run migration: `25-migrate-384-dimensions.sql`
2. Regenerate all embeddings
3. Update model version

#### Issue 4: pgvector Not Enabled

**Symptoms:**
- Error: "type 'vector' does not exist"

**Solutions:**
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify
SELECT * FROM pg_extension WHERE extname = 'vector';
```

### Performance Optimization

#### Index Tuning

```sql
-- For better recall (more accurate, slower)
CREATE INDEX ON profile_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 32, ef_construction = 128);

-- For better speed (faster, less accurate)
CREATE INDEX ON profile_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 8, ef_construction = 32);
```

#### Query Optimization

```sql
-- Use approximate search for large datasets
SET hnsw.ef_search = 64;

-- Combine with filters
WHERE created_at > NOW() - INTERVAL '30 days'
  AND similarity > 0.5
```

---

## Testing

### Local Testing

```bash
# Test Python worker
cd python-worker
python test_embeddings.py

# Expected output:
# ✓ Model loaded successfully
# ✓ Generated embedding: 768 dimensions
# ✓ Similarity test passed
```

### Integration Testing

```typescript
// Test embedding generation
const { data, error } = await supabase.functions.invoke('generate-embedding', {
  body: { profile: testProfile }
})

expect(error).toBeNull()
expect(data.embedding).toHaveLength(768)
```

---

## Monitoring

### Metrics to Track

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Embedding latency | < 500ms | > 1000ms |
| Search latency | < 100ms | > 500ms |
| Success rate | > 99% | < 95% |
| Worker uptime | > 99.9% | < 99% |

### Logging

```python
# Python worker logging
import logging

logging.info(f"Generated embedding for user {user_id}")
logging.error(f"Embedding failed: {error}")
```

---

## Resources

- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Sentence Transformers](https://www.sbert.net/)
- [HNSW Index Guide](https://github.com/nmslib/hnswlib)
- [Supabase Vector Similarity](https://supabase.com/docs/guides/database/extensions/pgvector)

---

**Last Updated**: 2026-03-14  
**Version**: 2.0.0

[← Back to Docs](../../README.md) | [Python Worker Setup →](../python-worker/overview.md)
