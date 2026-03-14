# 🚀 Python Worker Deployment Fix Guide

**Date:** 2026-03-14  
**Issue:** Missing database tables and Python worker errors

---

## 📋 Problem Summary

### Errors Identified:
1. ❌ **Missing DLQ Table**: `embedding_dead_letter_queue` doesn't exist in database
2. ❌ **Missing Rate Limit Function**: `check_embedding_rate_limit()` not deployed
3. ❌ **Missing Pending Queue**: `embedding_pending_queue` not created
4. ⚠️ **Duplicate Embedding Error**: Worker tries to INSERT when record already exists
5. ⚠️ **EmbeddingValidator Import**: Working correctly (module exists)

---

## ✅ Fixes Applied

### 1. Database Migration Script Created
**File:** `supabase/setup/100-embedding-infrastructure-migration.sql`

This script:
- ✅ Creates `embedding_dead_letter_queue` table
- ✅ Creates `embedding_rate_limits` table
- ✅ Creates `embedding_pending_queue` table
- ✅ Deploys `check_embedding_rate_limit()` function
- ✅ Deploys `queue_embedding_request()` function
- ✅ Handles existing realtime publications gracefully
- ✅ Includes verification queries

### 2. Python Worker Code Fixed
**File:** `python-worker/main.py` (lines 205-245)

**Changes:**
- ✅ Check if embedding exists before INSERT
- ✅ Use UPDATE for existing embeddings
- ✅ Use INSERT for new embeddings
- ✅ Prevents unique constraint violations

---

## 🔧 Deployment Steps

### Step 1: Run Database Migration (5 minutes)

1. **Open Supabase Dashboard**
   - Go to: https://supabase.ahsanali.cc
   - Navigate to: **SQL Editor**

2. **Run Migration Script**
   - Open file: `supabase/setup/100-embedding-infrastructure-migration.sql`
   - Copy entire contents
   - Paste into SQL Editor
   - Click **Run**

3. **Verify Success**
   
   You should see output like:
   ```
   Migration Status | ✅ SUCCESS - All tables created
   Function Check   | ✅ Functions created
   
   table_name                | row_count
   --------------------------|-----------
   embedding_dead_letter_queue | 0
   embedding_rate_limits      | 0
   embedding_pending_queue    | 0
   ```

### Step 2: Verify Tables Exist (1 minute)

Run these queries in SQL Editor:

```sql
-- Check tables
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'embedding%'
ORDER BY table_name;

-- Check functions
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname IN ('check_embedding_rate_limit', 'queue_embedding_request');

-- Test rate limit function
SELECT * FROM check_embedding_rate_limit('00000000-0000-0000-0000-000000000000');
```

**Expected Output:**
- 3 tables: `embedding_dead_letter_queue`, `embedding_rate_limits`, `embedding_pending_queue`
- 2 functions: `check_embedding_rate_limit`, `queue_embedding_request`
- Rate limit test should return: `allowed=true, remaining=2, reset_at=<timestamp>`

### Step 3: Restart Python Worker (2 minutes)

```bash
# Navigate to worker directory
cd python-worker

# Restart Docker container
docker-compose restart

# Check logs
docker-compose logs -f
```

**Look for these success messages:**
```
✅ Supabase client initialized successfully
✅ Embedding service starting up...
✅ Embedding model loaded successfully. Using device: cpu
```

### Step 4: Test Embedding Generation (2 minutes)

**Test Health Endpoint:**
```bash
curl http://localhost:8000/health
```

**Expected Response:**
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
  "queue_capacity": 100
}
```

**Test Embedding Generation:**
```bash
curl -X POST http://localhost:8000/generate-embedding \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "YOUR-USER-ID-HERE",
    "semantic_text": "Full stack developer with React and Node.js experience"
  }'
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Embedding request queued successfully",
  "user_id": "YOUR-USER-ID-HERE"
}
```

### Step 5: Monitor Logs (5 minutes)

```bash
# Watch for successful embedding generation
docker-compose logs -f python-worker | grep -E "(Successfully|stored|updated)"
```

**Success Pattern:**
```
✅ Successfully stored new embedding for <user-id>
OR
✅ Successfully updated embedding for <user-id>
```

**No More Errors:**
- ❌ `Could not find the table 'public.embedding_dead_letter_queue'`
- ❌ `Could not find the function public.check_embedding_rate_limit`
- ❌ `name 'EmbeddingValidator' is not defined`
- ❌ `duplicate key value violates unique constraint`

---

## 🧪 Verification Checklist

Run these checks to confirm everything is working:

- [ ] **Database Tables**
  - [ ] `embedding_dead_letter_queue` exists
  - [ ] `embedding_rate_limits` exists
  - [ ] `embedding_pending_queue` exists

- [ ] **Database Functions**
  - [ ] `check_embedding_rate_limit()` works
  - [ ] `queue_embedding_request()` works

- [ ] **Python Worker**
  - [ ] Docker container is running
  - [ ] Health endpoint returns 200 OK
  - [ ] No DLQ table errors in logs
  - [ ] No rate limit function errors in logs
  - [ ] No EmbeddingValidator import errors

- [ ] **Embedding Generation**
  - [ ] Can generate new embeddings
  - [ ] Can update existing embeddings (no duplicate errors)
  - [ ] Failed embeddings go to DLQ
  - [ ] Rate limiting works (3 requests/hour)

---

## 🐛 Troubleshooting

### Issue: "relation already exists" Error

**Solution:** Migration script already has `IF NOT EXISTS` clauses. Safe to re-run.

### Issue: "function already exists" Error

**Solution:** Function is replaced with `CREATE OR REPLACE`. Safe to re-run.

### Issue: Python Worker Still Shows DLQ Errors

**Possible Causes:**
1. Migration not run yet
2. Wrong database connection
3. Container needs restart

**Fix:**
```bash
# Stop container
docker-compose down

# Clear any cached data
docker-compose rm -f

# Restart fresh
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Issue: Duplicate Embedding Error Persists

**Check:** Verify the fix was applied to `main.py`:

```bash
grep -A 5 "Check if embedding already exists" python-worker/main.py
```

Should show the existence check code.

---

## 📊 Monitoring Queries

### Check DLQ Status
```sql
SELECT 
  status,
  COUNT(*) as count,
  MAX(created_at) as latest
FROM embedding_dead_letter_queue
GROUP BY status
ORDER BY status;
```

### Check Rate Limits
```sql
SELECT 
  user_id,
  request_count,
  window_end,
  NOW() > window_end as expired
FROM embedding_rate_limits
ORDER BY window_end DESC
LIMIT 10;
```

### Check Pending Queue
```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(EXTRACT(EPOCH FROM (NOW() - created_at))/60) as avg_age_minutes
FROM embedding_pending_queue
GROUP BY status;
```

### Check Embedding Generation Success Rate
```sql
SELECT 
  status,
  COUNT(*) as count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER(), 2) as percentage
FROM profile_embeddings
GROUP BY status;
```

---

## 📝 Rollback Plan

If issues occur, rollback with:

```sql
-- Drop tables
DROP TABLE IF EXISTS embedding_dead_letter_queue CASCADE;
DROP TABLE IF EXISTS embedding_rate_limits CASCADE;
DROP TABLE IF EXISTS embedding_pending_queue CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS check_embedding_rate_limit(UUID);
DROP FUNCTION IF EXISTS reset_embedding_rate_limit(UUID);
DROP FUNCTION IF EXISTS queue_embedding_request(UUID, TEXT);
```

Then investigate and re-run migration.

---

## 🎯 Success Criteria

Migration is successful when:

1. ✅ All 3 tables exist in database
2. ✅ Both RPC functions execute without errors
3. ✅ Python worker logs show no DLQ/table errors
4. ✅ Health endpoint returns `supabase_connected: true`
5. ✅ New embeddings are stored successfully
6. ✅ Existing embeddings are updated (no duplicate errors)
7. ✅ Failed embeddings are queued in DLQ
8. ✅ Rate limiting prevents >3 requests/hour

---

## 📞 Support

If issues persist:
1. Check logs: `docker-compose logs -f`
2. Verify database: Run verification queries
3. Test manually: Use SQL Editor to insert test data
4. Check network: Ensure worker can reach Supabase

---

**Last Updated:** 2026-03-14  
**Migration Version:** 100  
**Target Environment:** Production (supabase.ahsanali.cc)
