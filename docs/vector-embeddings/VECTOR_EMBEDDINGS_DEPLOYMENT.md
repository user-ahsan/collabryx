# Vector Embeddings Deployment Guide

Complete guide for deploying the vector embedding system for Collabryx.

## Overview

This deployment guide covers the setup and deployment of:
1. **Python Worker Service** - Self-hosted embedding generator
2. **Supabase Edge Functions** - Orchestration layer
3. **Database Schema** - Vector storage with pgvector
4. **Frontend Integration** - Trigger and status tracking

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│   Next.js App   │────▶│  Supabase Edge   │────▶│  Python Worker   │
│   (Frontend)    │     │   Functions      │     │  (FastAPI)       │
└─────────────────┘     └──────────────────┘     └──────────────────┘
         │                       │                          │
         ▼                       ▼                          ▼
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│ Onboarding      │     │ profile_embeddings│    │  Sentence        │
│ Completion      │────▶│  (pgvector)      │────▶│  Transformers    │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

---

## Phase 1: Deploy Python Worker Service

### Option A: Railway (Recommended)

1. **Push to GitHub**
   ```bash
   cd python-worker
   git init
   git add .
   git commit -m "Add embedding service"
   git push origin main
   ```

2. **Create Railway Service**
   - Go to [Railway](https://railway.app)
   - Click "New Project" → "Deploy from GitHub repo"
   - Select your repository
   - Railway will auto-detect `Dockerfile`
   - Set environment variables (if needed)

3. **Set Environment Variables**
   - No required env vars for basic setup
   - Railway provides `PORT` automatically

4. **Deploy**
   - Railway auto-deploys on git push
   - Find your service URL (e.g., `https://embedding-service.up.railway.app`)

### Option B: Render

1. **Create Web Service**
   - Go to [Render](https://render.com)
   - Click "New" → "Web Service"
   - Connect GitHub repository
   - Settings:
     - Build Command: `pip install -r requirements.txt`
     - Start Command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
     - Runtime: Python 3.11

2. **Deploy**
   - Render auto-deploys on git push

### Option C: Self-Hosted VPS

1. **Install Docker**
   ```bash
   # Ubuntu/Debian
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh
   ```

2. **Build and Run**
   ```bash
   cd python-worker
   docker build -t collabryx-embedding .
   docker run -d -p 8000:8000 --name embedding-service collabryx-embedding
   ```

3. **Set up reverse proxy (optional)**
   ```bash
   # Using Caddy
   caddy reverse-proxy --from your-domain.com --to localhost:8000
   ```

### Verify Deployment

Test your Python worker:
```bash
curl https://your-worker-url.com/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_info": {
    "model_name": "all-MiniLM-L6-v2",
    "dimensions": 768
  }
}
```

---

## Phase 2: Database Setup

### Enable pgvector Extension

1. **Open Supabase SQL Editor**
   - Go to your Supabase dashboard
   - Navigate to SQL Editor

2. **Run Extension Command**
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### Apply Database Schema

Run the following SQL files in order:

1. **Profile Embeddings Table**
   ```sql
   -- Run: supabase/creation/23-profile-embeddings.sql
   ```

2. **Embedding Trigger**
   ```sql
   -- Run: supabase/creation/24-embeddings-trigger.sql
   ```

### Verify Schema

```sql
-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'profile_embeddings';

-- Check if vector extension is enabled
SELECT * FROM pg_extension WHERE extname = 'vector';
```

---

## Phase 3: Deploy Supabase Edge Functions

### Local Testing

1. **Install Supabase CLI**
   ```bash
   npm install -g supabase
   ```

2. **Test locally**
   ```bash
   supabase functions serve generate-embedding
   ```

### Deploy to Production

1. **Set Environment Variables in Supabase**
   - Go to Supabase Dashboard → Project Settings → API
   - Add `PYTHON_WORKER_URL` to Edge Functions environment:
     ```
     PYTHON_WORKER_URL=https://your-worker-url.com
     ```

2. **Deploy Functions**
   ```bash
   supabase functions deploy generate-embedding
   ```

3. **Verify Deployment**
   ```bash
   supabase functions list
   ```

---

## Phase 4: Frontend Configuration

### Environment Variables

Update your `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Python Worker URL
PYTHON_WORKER_URL=https://your-worker-url.com

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Update Onboarding Flow

The onboarding flow now automatically triggers embedding generation:

```typescript
// In app/(auth)/onboarding/actions.ts
// After completing onboarding, embedding generation is triggered automatically
```

### Add Progress UI (Optional)

Use the `EmbeddingProgress` component to show real-time status:

```tsx
import { EmbeddingProgress } from "@/app/(auth)/onboarding/components/EmbeddingProgress"

<EmbeddingProgress 
  userId={userId} 
  onComplete={() => console.log("Embedding ready!")}
  onFailed={() => console.log("Embedding failed, retry available")}
/>
```

---

## Phase 5: Testing

### Test Python Worker

```bash
cd python-worker
python test_embeddings.py
```

Expected output:
```
==================================================
Running Embedding Generator Tests
==================================================

Testing model loading...
✓ Model loaded: all-MiniLM-L6-v2
✓ Dimensions: 768
✓ Device: cpu
✓ Model loading test passed

Testing embedding generation...
✓ Generated embedding of length: 768
✓ Generation time: 45.23ms
✓ Embedding magnitude: 1.000000
✓ Embedding generation test passed

==================================================
✓ ALL TESTS PASSED
==================================================
```

### Test API Endpoints

1. **Test Python Worker Health**
   ```bash
   curl https://your-worker-url.com/health
   ```

2. **Test Embedding Generation**
   ```bash
   curl -X POST https://your-worker-url.com/generate-embedding \
     -H "Content-Type: application/json" \
     -d '{"text": "Test profile text", "user_id": "test-user"}'
   ```

3. **Test Edge Function**
   - Complete onboarding in the app
   - Check Supabase logs for function execution
   - Verify `profile_embeddings` table has new records

### Test End-to-End Flow

1. Register a new user
2. Complete onboarding
3. Check embedding status in `profile_embeddings` table
4. Verify embedding is marked as "completed"

---

## Production Considerations

### Performance Optimization

1. **Cold Start Latency**
   - Python worker loads model on first request (~2-3s)
   - Consider warm-up endpoint for production

2. **Scaling**
   - Railway/Render auto-scale based on traffic
   - For high traffic, consider multiple instances

3. **Caching**
   - Embeddings are stored in database after generation
   - No need to regenerate unless user updates profile

### Security

1. **Python Worker**
   - Add CORS configuration for production domain
   - Consider API key authentication if needed
   - Use HTTPS only in production

2. **Edge Functions**
   - Uses Supabase service role key (keep secret)
   - Validates user authentication
   - Users can only generate embeddings for themselves

3. **Database**
   - RLS policies prevent unauthorized access
   - Embeddings are not exposed to users directly

### Monitoring

1. **Python Worker Logs**
   - Railway/Render provide logs dashboard
   - Monitor for errors in embedding generation

2. **Supabase Logs**
   - Check Edge Function execution logs
   - Monitor for failed embedding generations

3. **Database Monitoring**
   - Track embedding generation success rate
   - Monitor table size growth

---

## Troubleshooting

### Python Worker Issues

| Issue | Solution |
|-------|----------|
| Model fails to load | Check PyTorch/CUDA compatibility |
| Slow first request | Model loads on first request (normal) |
| Memory issues | Use smaller model or upgrade hosting |

### Database Issues

| Issue | Solution |
|-------|----------|
| pgvector not enabled | Run `CREATE EXTENSION vector;` |
| Index creation fails | Check database permissions |
| Embeddings not storing | Check Edge Function logs |

### Frontend Issues

| Issue | Solution |
|-------|----------|
| Embedding never completes | Check Python worker URL is correct |
| CORS errors | Update Python worker CORS config |
| Status shows "failed" | Retry embedding generation |

---

## Rollback Plan

If issues occur:

1. **Disable Embedding Generation**
   - Set `NEXT_PUBLIC_ENABLE_AI_FEATURES=false` in env
   - Users can still use basic matching

2. **Database Rollback**
   ```sql
   -- Remove embeddings table
   DROP TABLE IF EXISTS public.profile_embeddings;
   
   -- Remove trigger
   DROP TRIGGER IF EXISTS trigger_generate_embedding ON public.profiles;
   DROP FUNCTION IF EXISTS public.trigger_embedding_generation();
   ```

3. **Revert Code Changes**
   - Git revert commits for embedding-related changes
   - Deploy previous version to Vercel

---

## Cost Estimation

| Component | Estimated Cost |
|-----------|----------------|
| Python Worker (Railway) | $5-10/month (starter) |
| Supabase Edge Functions | Free tier (1M invocations) |
| Database (pgvector) | Included in Supabase plan |
| Total | ~$5-15/month |

---

## Next Steps

1. ✅ Deploy Python worker
2. ✅ Apply database schema
3. ✅ Deploy Edge Functions
4. ✅ Configure frontend
5. ✅ Test end-to-end flow
6. 🔲 Monitor in production
7. 🔲 Optimize based on usage patterns
