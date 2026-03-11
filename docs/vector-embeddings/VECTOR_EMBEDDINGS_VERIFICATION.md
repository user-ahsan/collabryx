# Vector Embeddings System Verification Guide

This guide helps you verify that the vector embedding system is correctly set up and functional.

## Prerequisites

- Python Worker deployed and accessible
- Supabase project with pgvector extension enabled
- Database schema applied
- Edge Functions deployed
- Frontend running locally or deployed

## Verification Steps

### 1. Verify Python Worker Deployment

**Test Health Endpoint:**
```bash
curl https://your-worker-url.com/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "timestamp": 1234567890.123,
  "model_info": {
    "model_name": "all-MiniLM-L6-v2",
    "dimensions": 768,
    "device": "cpu" | "cuda",
    "max_seq_length": 256
  }
}
```

**Test Embedding Generation:**
```bash
curl -X POST https://your-worker-url.com/generate-embedding \
  -H "Content-Type: application/json" \
  -d '{"text": "Test profile text", "user_id": "test-user-123"}'
```

**Expected Response:**
```json
{
  "user_id": "test-user-123",
  "embedding": [0.1, 0.2, ..., 0.9],  // 768 dimensions
  "dimensions": 768,
  "model": "all-MiniLM-L6-v2",
  "request_id": "uuid",
  "status": "success",
  "processing_time_ms": 45.23
}
```

### 2. Verify Database Setup

**Check Extension:**
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```
Should return one row.

**Check Table:**
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'profile_embeddings';
```
Should return `profile_embeddings`.

**Check Indexes:**
```sql
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'profile_embeddings';
```
Should show:
- `idx_profile_embeddings_embedding` (HNSW index)
- `idx_profile_embeddings_user_id`
- `idx_profile_embeddings_status`

**Check RLS Policies:**
```sql
SELECT policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profile_embeddings';
```
Should show:
- `Users can view own embedding status` (SELECT for authenticated users)
- `Service role can manage embeddings` (ALL for service_role)

### 3. Verify Edge Function

**Test Edge Function locally:**
```bash
supabase functions serve generate-embedding
```

**Test via curl (while serving):**
```bash
curl -X POST http://localhost:54321/functions/v1/generate-embedding \
  -H "Authorization: Bearer <anon-key>" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "<your-user-id>"}'
```

**Verify in Supabase Dashboard:**
1. Go to Database > Extensions
2. Ensure `vector` is enabled
3. Go to Database > Tables > profile_embeddings
4. Check table structure and indexes

### 4. Verify Frontend Integration

**Test API Endpoints:**

1. **Generate Embedding Endpoint:**
   ```bash
   curl -X POST http://localhost:3000/api/embeddings/generate \
     -H "Authorization: Bearer <supabase-access-token>" \
     -H "Content-Type: application/json" \
     -d '{"user_id": "<user-id>"}'
   ```

2. **Check Status Endpoint:**
   ```bash
   curl http://localhost:3000/api/embeddings/status/<user-id> \
     -H "Authorization: Bearer <supabase-access-token>"
   ```

**Test Onboarding Flow:**
1. Register a new user
2. Complete onboarding form
3. Check browser console for embedding generation logs
4. Check Supabase logs for Edge Function execution

### 5. End-to-End Test

**Complete Workflow:**
1. **Register User:**
   - Go to `/register`
   - Create account

2. **Complete Onboarding:**
   - Fill in profile details
   - Add skills and interests
   - Submit onboarding

3. **Check Embedding Status:**
   - After onboarding, check `profile_embeddings` table
   - Status should transition: `pending` → `processing` → `completed`

4. **Verify Semantic Matching:**
   - Create another user with complementary skills
   - Check if match suggestions are generated
   - Verify embeddings are used in similarity search

### 6. Performance Verification

**Check Embedding Generation Time:**
- First request (cold start): 2-3 seconds (model loading)
- Subsequent requests: 10-50ms

**Check Database Query Performance:**
```sql
EXPLAIN ANALYZE
SELECT 
    profiles.id,
    1 - (pe.embedding <=> (SELECT embedding FROM profile_embeddings WHERE user_id = '<user-id>')) AS similarity
FROM profile_embeddings pe
JOIN profiles ON pe.user_id = profiles.id
WHERE 1 - (pe.embedding <=> (SELECT embedding FROM profile_embeddings WHERE user_id = '<user-id>')) > 0.5
ORDER BY similarity DESC
LIMIT 10;
```

### 7. Monitoring & Logs

**Python Worker Logs:**
- Check deployment platform logs (Railway/Render/VPS)
- Look for model loading messages
- Monitor for errors

**Supabase Logs:**
- Go to Logs > Edge Functions
- Search for `generate-embedding`
- Check for errors or timeouts

**Database Logs:**
- Check for constraint violations
- Monitor table size growth

### 8. Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Python worker not reachable | Check URL in `PYTHON_WORKER_URL` env var |
| pgvector not enabled | Run `CREATE EXTENSION vector;` |
| Edge Function timeout | Increase timeout in Supabase dashboard |
| CORS errors | Update Python worker CORS config |
| Embeddings not generating | Check onboarding trigger logic |
| Slow generation | Model loads on first request (normal) |

### 9. Rollback Test

**Simulate Failure:**
1. Stop Python worker
2. Try onboarding a new user
3. Verify status becomes "failed"
4. Check retry functionality

**Recovery:**
1. Restart Python worker
2. Click "Retry" in UI
3. Verify embedding generation succeeds

### 10. Production Checklist

- [ ] Python worker deployed with HTTPS
- [ ] CORS configured for production domain
- [ ] Environment variables set in production
- [ ] Database backups enabled
- [ ] Monitoring alerts configured
- [ ] Rate limiting considered for Python worker
- [ ] Security review completed

## Success Criteria

The system is working correctly if:

1. ✅ Python worker responds to health checks
2. ✅ Embeddings are generated in <100ms (after cold start)
3. ✅ Database stores vectors correctly
4. ✅ Edge Function triggers on onboarding completion
5. ✅ Frontend shows progress during generation
6. ✅ Semantic matching uses embeddings for recommendations
7. ✅ Retry mechanism works for failed generations

## Next Steps

If verification succeeds:
1. Monitor production usage
2. Optimize based on performance metrics
3. Consider model upgrades for better accuracy
4. Implement caching for frequently generated embeddings

If verification fails:
1. Check logs for specific errors
2. Verify each component individually
3. Review configuration settings
4. Consult troubleshooting guide
