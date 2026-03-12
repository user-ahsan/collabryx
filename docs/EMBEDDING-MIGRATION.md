# Embedding Service Migration Guide (768d → 384d)

## Overview
Migrating from 768-dimensional embeddings to 384-dimensional embeddings to match the `all-MiniLM-L6-v2` model.

---

## Step 1: Database Migration

Run the migration script in **Supabase SQL Editor**:

```bash
# Option A: Run the migration file
# Open Supabase SQL Editor and paste contents of:
supabase/setup/25-migrate-384-dimensions.sql
```

**What this does:**
1. Clears existing 768d embeddings (sets to NULL)
2. Alters column type from `vector(768)` to `vector(384)`
3. Recreates HNSW index for 384 dimensions
4. Sets all embeddings to `pending` status for regeneration

**Expected Output:**
```
 column_name | data_type | udt_name
-------------+-----------+-----------
 embedding   | USER-DEFINED | vector

 status  | count
---------+-------
 pending | 150
```

---

## Step 2: Deploy Python Worker

### Option A: Docker Deployment

```bash
cd python-worker

# Build the updated image
docker build -t collabryx-embedding-service .

# Stop existing container
docker-compose down

# Start new container
docker-compose up -d

# Check logs
docker-compose logs -f embedding-service
```

### Option B: Local Development

```bash
cd python-worker

# Install dependencies
pip install -r requirements.txt

# Run tests
python test_embeddings.py

# Start server
python main.py
```

**Expected Output:**
```
Loading embedding model...
Embedding model loaded successfully. Using device: cpu
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## Step 3: Verify Health

```bash
curl http://localhost:8000/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": 1710234567.890,
  "model_info": {
    "model_name": "all-MiniLM-L6-v2",
    "dimensions": 384,
    "device": "cpu",
    "max_seq_length": 256
  },
  "supabase_connected": true,
  "queue_size": 0,
  "queue_capacity": 100
}
```

---

## Step 4: Regenerate Embeddings

### Trigger for All Users

Run this in **Supabase SQL Editor** to trigger regeneration for all users with completed embeddings:

```sql
-- Update all completed embeddings to pending for regeneration
UPDATE profile_embeddings
SET status = 'pending',
    last_updated = NOW()
WHERE status = 'completed';

-- Verify count
SELECT status, COUNT(*)
FROM profile_embeddings
GROUP BY status;
```

### Trigger via API (Recommended)

For each user, call the embedding generation endpoint:

```bash
# Get list of user IDs
curl -X GET "YOUR_SUPABASE_URL/rest/v1/profiles?id=not.null" \
  -H "apikey: YOUR_SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer YOUR_SUPABASE_SERVICE_ROLE_KEY"

# Trigger embedding for each user
curl -X POST "http://localhost:3000/api/embeddings/generate" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_SERVICE_ROLE_KEY" \
  -d '{"user_id": "USER_ID_HERE"}'
```

---

## Step 5: Monitor Progress

### Check Status in Database

```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM profile_embeddings
GROUP BY status;
```

### Real-time Monitoring

Use Supabase Realtime in your frontend:

```typescript
import { subscribeToEmbeddingStatus } from '@/lib/services/embeddings'

const unsubscribe = subscribeToEmbeddingStatus(userId, (status) => {
  console.log(`Embedding status for ${userId}:`, status.status)
  
  if (status.status === 'completed') {
    console.log('✓ Embedding generation complete!')
  }
})
```

---

## Step 6: Deploy Edge Function (Optional)

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
npx supabase functions deploy generate-embedding

# Set environment variables
npx supabase secrets set \
  SUPABASE_URL=YOUR_SUPABASE_URL \
  SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY \
  PYTHON_WORKER_URL=http://localhost:8000
```

---

## Step 7: Test End-to-End

### Test 1: Direct Python Worker

```bash
curl -X POST http://localhost:8000/generate-embedding \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Student React Developer passionate about Fintech",
    "user_id": "test-user-id"
  }'
```

**Expected Response:**
```json
{
  "user_id": "test-user-id",
  "status": "queued",
  "message": "Vector embedding queued for background processing"
}
```

### Test 2: Next.js API Route

```bash
curl -X POST http://localhost:3000/api/embeddings/generate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -d '{"user_id": "YOUR_USER_ID"}'
```

### Test 3: Check Database

```sql
SELECT 
  user_id,
  status,
  embedding IS NOT NULL as has_embedding,
  array_length(embedding::real[], 1) as dimensions,
  last_updated
FROM profile_embeddings
WHERE user_id = 'YOUR_USER_ID';
```

**Expected:**
```
 user_id |  status   | has_embedding | dimensions |      last_updated
---------+-----------+---------------+------------+------------------------
 abc123  | completed | true          |        384 | 2026-03-12 10:30:00+00
```

---

## Troubleshooting

### Error: "expected 384 dimensions, not 768"

**Cause:** Old embeddings still in database with 768 dimensions.

**Solution:**
```sql
-- Clear all existing embeddings
UPDATE profile_embeddings 
SET embedding = NULL, 
    status = 'pending',
    last_updated = NOW();

-- Verify column type
SELECT 
  column_name, 
  udt_name,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'profile_embeddings' 
  AND column_name = 'embedding';
```

### Error: "Python worker unavailable"

**Cause:** Python worker not running or unreachable.

**Solution:**
1. Check worker is running: `docker-compose ps`
2. Check logs: `docker-compose logs embedding-service`
3. Verify URL: `echo $PYTHON_WORKER_URL`
4. Test health endpoint: `curl http://localhost:8000/health`

### Error: "Queue full"

**Cause:** Too many concurrent requests (>100).

**Solution:**
- Wait for queue to process
- Increase `MAX_QUEUE_SIZE` in `main.py`
- Scale worker instances

### Fallback Activated

If logs show "Using local embedding generation fallback":

**Meaning:** Python worker is unreachable, Edge Function generated a basic TF-IDF embedding.

**Action:**
1. Check Python worker health
2. Review network connectivity
3. Consider setting `USE_LOCAL_FALLBACK=false` to force Python worker

---

## Performance Benchmarks

After migration, expect:

| Metric | Target | Measurement |
|--------|--------|-------------|
| Embedding dimensions | 384 | Check DB schema |
| Generation time | < 5s | Monitor logs |
| Queue capacity | 100 | Health endpoint |
| Success rate | > 95% | Status counts |
| Fallback usage | < 5% | Response flag |

---

## Rollback Plan

If issues occur, revert to 768d:

```sql
-- Revert to 768 dimensions
UPDATE profile_embeddings 
SET embedding = NULL, 
    status = 'pending';

ALTER TABLE profile_embeddings 
ALTER COLUMN embedding TYPE vector(768);

-- Recreate index
DROP INDEX IF EXISTS idx_profile_embeddings_embedding;
CREATE INDEX idx_profile_embeddings_embedding 
    ON profile_embeddings 
    USING hnsw (embedding vector_cosine_ops);
```

Then update Python worker to use `all-mpnet-base-v2` model.

---

## Post-Migration Checklist

- [ ] Database column is `vector(384)`
- [ ] All embeddings regenerated (status = 'completed')
- [ ] Python worker responding to health checks
- [ ] Next.js API route using fallback correctly
- [ ] Realtime subscriptions working
- [ ] Matching queries return results
- [ ] No errors in logs
- [ ] Performance within targets

---

**Last Updated:** 2026-03-12  
**Version:** 1.1.0 (384 dimensions)
