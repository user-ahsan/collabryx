# Deployment Guide

**Last Updated:** 2026-03-16  
**Version:** 1.0.0

Complete deployment instructions for Collabryx production infrastructure.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Vercel Deployment](#vercel-deployment)
- [Python Worker Deployment](#python-worker-deployment)
- [Database Setup](#database-setup)
- [Post-Deployment Checklist](#post-deployment-checklist)
- [Monitoring & Alerts](#monitoring--alerts)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Accounts

- [ ] **Vercel Account** - For frontend hosting
- [ ] **Supabase Project** - Database and backend services
- [ ] **Render/Railway Account** - Python worker hosting
- [ ] **Domain Name** - For production URL (optional for staging)

### Required Tools

- [ ] **Node.js 20+** - Runtime environment
- [ ] **npm 10+** - Package manager
- [ ] **Git** - Version control
- [ ] **Docker** - Local worker testing
- [ ] **Supabase CLI** (optional) - Database management

### Pre-Deployment Verification

```bash
# Verify Node.js version
node --version  # Should be v20.x or higher

# Verify npm version
npm --version  # Should be v10.x or higher

# Verify Docker (for local testing)
docker --version
docker-compose --version
```

---

## Environment Variables

### Frontend (Vercel)

Configure these in **Vercel Project Settings > Environment Variables**:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | `eyJhbG...` | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbG...` | ✅ Yes |
| `PYTHON_WORKER_URL` | Python worker endpoint | `https://worker.railway.app` | ✅ Yes |
| `NEXT_PUBLIC_APP_URL` | Production app URL | `https://collabryx.com` | ❌ No |
| `NODE_ENV` | Environment | `production` | Auto-set |

**⚠️ Security Notes:**
- Never commit `.env.local` to Git
- Use Vercel's encrypted environment variables
- Rotate keys regularly (every 90 days recommended)
- Use different keys for staging/production

### Python Worker (Render/Railway)

Configure these in your platform's environment variables:

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | `eyJhbG...` | ✅ Yes |
| `ALLOWED_ORIGINS` | CORS allowed origins | `https://collabryx.com` | ✅ Yes |
| `PORT` | Server port | `8000` | Auto-set |
| `LOG_LEVEL` | Logging level | `INFO` | ❌ No |

---

## Vercel Deployment

### Step 1: Connect Repository

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your GitHub repository
4. Select the `collabryx` repository

### Step 2: Configure Build Settings

**Framework Preset:** Next.js  
**Root Directory:** `./`  
**Build Command:** `npm run build`  
**Output Directory:** `.next`  
**Install Command:** `npm install`

```json
// vercel.json (auto-generated, do not modify)
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install"
}
```

### Step 3: Set Environment Variables

Add all frontend environment variables in Vercel dashboard:

```
Project Settings > Environment Variables > Add New
```

**Production:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG...
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
PYTHON_WORKER_URL=https://worker.railway.app
NEXT_PUBLIC_APP_URL=https://collabryx.com
```

**Preview (Staging):**
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbG... (staging key)
SUPABASE_SERVICE_ROLE_KEY=eyJhbG... (staging key)
PYTHON_WORKER_URL=https://worker-staging.railway.app
NEXT_PUBLIC_APP_URL=https://staging.collabryx.com
```

### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (~2-3 minutes)
3. Verify deployment succeeds

**Expected Output:**
```
✓ Build completed successfully
✓ Page generation: 10.2s
✓ Static pages: 15
✓ Server-side pages: 8
✓ API routes: 12
```

### Step 5: Configure Custom Domain (Optional)

1. Go to **Project Settings > Domains**
2. Add your domain: `collabryx.com`
3. Add www subdomain: `www.collabryx.com`
4. Update DNS records as instructed

**DNS Configuration:**
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com

Type: ALIAS/ANAME
Name: @
Value: 76.76.21.21
```

---

## Python Worker Deployment

### Option 1: Railway Deployment (Recommended)

#### Step 1: Connect GitHub

1. Go to [railway.app](https://railway.app)
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose `collabryx` repository

#### Step 2: Configure Service

**Root Directory:** `python-worker`  
**Build Command:** `docker-compose build`  
**Start Command:** `docker-compose up`

#### Step 3: Add Environment Variables

In Railway dashboard:
```
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# API Configuration
ALLOWED_ORIGINS=https://collabryx.com,https://staging.collabryx.com
PORT=8000

# External APIs (optional - features work without them)
PERSPECTIVE_API_KEY=...  # Google Perspective API for content moderation
GEMINI_API_KEY=...       # Google Gemini API for AI mentor
```

#### Step 4: Deploy

1. Click **"Deploy"**
2. Wait for container build (~3-5 minutes first time)
3. Verify health check passes

**Expected Health Response:**
```json
{
  "status": "healthy",
  "services": {
    "embedding_generator": "operational",
    "match_generator": "operational",
    "notification_engine": "operational",
    "activity_tracker": "operational",
    "feed_scorer": "operational",
    "content_moderator": "operational",
    "ai_mentor_processor": "operational",
    "event_processor": "operational",
    "analytics_aggregator": "operational"
  },
  "model_info": {
    "model_name": "all-MiniLM-L6-v2",
    "dimensions": 384,
    "device": "cpu"
  },
  "external_apis": {
    "perspective_api": "configured",
    "gemini_api": "configured"
  },
  "supabase_connected": true,
  "queue_size": 0,
  "queue_capacity": 100,
  "uptime": "24h 15m"
}
```

#### Step 5: Get Public URL

Railway provides a public URL automatically:
```
https://collabryx-worker-production.up.railway.app
```

Add this URL to Vercel's `PYTHON_WORKER_URL` environment variable.

### Option 2: Render Deployment

#### Step 1: Create Web Service

1. Go to [render.com](https://render.com)
2. Click **"New +"** > **"Web Service"**
3. Connect GitHub repository

#### Step 2: Configure Service

**Name:** `collabryx-worker`  
**Environment:** `Docker`  
**Build Command:** `cd python-worker && docker-compose build`  
**Start Command:** `cd python-worker && docker-compose up`

#### Step 3: Set Environment Variables

```
# Supabase
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...

# API Configuration
ALLOWED_ORIGINS=https://collabryx.com
PORT=8000

# External APIs (optional)
PERSPECTIVE_API_KEY=...  # Google Perspective API for content moderation
GEMINI_API_KEY=...       # Google Gemini API for AI mentor
```

#### Step 4: Choose Instance Type

**Recommended:**
- **Instance:** Standard (Free tier for testing)
- **CPU:** 1 vCPU
- **Memory:** 1 GB
- **Health Check Path:** `/health`

#### Step 5: Deploy

1. Click **"Create Web Service"**
2. Wait for deployment (~5 minutes)
3. Verify health check passes

### Option 3: Docker Deployment (Self-Hosted)

#### Prerequisites

- Docker installed on server
- Server with 2+ CPU, 4+ GB RAM
- Public IP address
- SSL certificate (Let's Encrypt)

#### Step 1: Clone Repository

```bash
git clone https://github.com/user-ahsan/collabryx.git
cd collabryx/python-worker
```

#### Step 2: Create Environment File

```bash
cat > .env << EOF
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbG...
ALLOWED_ORIGINS=https://collabryx.com
PORT=8000
EOF
```

#### Step 3: Build and Run

```bash
# Build container
docker-compose build

# Start service
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

#### Step 4: Configure Nginx Reverse Proxy

```nginx
server {
    listen 80;
    server_name worker.collabryx.com;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Step 5: Enable HTTPS

```bash
sudo certbot --nginx -d worker.collabryx.com
```

---

## Database Setup

### Step 1: Access Supabase SQL Editor

1. Go to Supabase Dashboard
2. Select your project
3. Navigate to **SQL Editor**

### Step 2: Run Migration Script

Execute the master migration file:

```sql
-- Copy contents of supabase/setup/99-master-all-tables.sql
-- Paste into SQL Editor and run
```

**Expected Output:**
```
✓ 26 tables created
✓ 89 indexes created
✓ 78 RLS policies created
✓ 15 triggers created
✓ Storage buckets configured
```

### Step 3: Verify Tables

```sql
-- Check table count
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Should return 26

-- Check extensions
SELECT * FROM pg_extension WHERE extname = 'vector';
-- Should return 1 row
```

### Step 4: Enable Realtime

For each table that needs real-time updates:

1. Go to **Database > Replication**
2. Enable realtime for:
   - `posts`
   - `comments`
   - `messages`
   - `conversations`
   - `notifications`
   - `connections`

### Step 5: Configure Storage Buckets

Create storage buckets in Supabase Dashboard:

**Bucket 1: `post-media`**
- Public: false
- File size limit: 52428800 (50MB)
- Allowed MIME types: `image/*`, `video/*`

**Bucket 2: `profile-media`**
- Public: true
- File size limit: 10485760 (10MB)
- Allowed MIME types: `image/*`

**Bucket 3: `project-media`**
- Public: true
- File size limit: 10485760 (10MB)
- Allowed MIME types: `image/*`

---

## Post-Deployment Checklist

### ✅ Frontend Verification

- [ ] **Homepage loads** - `https://collabryx.com`
- [ ] **Login works** - Test authentication flow
- [ ] **Registration works** - Create test account
- [ ] **Dashboard loads** - Protected route accessible
- [ ] **Profile page loads** - User data displays
- [ ] **File uploads work** - Test image upload
- [ ] **Real-time updates work** - Open two tabs, verify sync
- [ ] **No console errors** - Check browser DevTools
- [ ] **Mobile responsive** - Test on mobile device
- [ ] **Dark mode works** - Toggle theme

### ✅ Backend Verification

- [ ] **Database connected** - Query returns data
- [ ] **RLS policies active** - Test user isolation
- [ ] **Realtime subscriptions** - Live updates working
- [ ] **Storage buckets** - Files upload/download
- [ ] **Edge functions** - Test if applicable

### ✅ Python Worker Verification

- [ ] **Health endpoint responds** - `GET /health`
- [ ] **Queue processing** - Add test item to queue
- [ ] **Embedding generation** - Verify vector created
- [ ] **Rate limiting** - Test 100 req/min limit
- [ ] **DLQ retry** - Test failure recovery
- [ ] **Logs accessible** - Check error logs

### ✅ Security Verification

- [ ] **HTTPS enforced** - No HTTP access
- [ ] **CORS configured** - Only allowed origins
- [ ] **Rate limiting active** - Test API limits
- [ ] **CSRF protection** - Forms have tokens
- [ ] **Bot detection** - Test suspicious user agents
- [ ] **RLS policies** - Verify data isolation

### ✅ Performance Verification

- [ ] **Page load < 3s** - Use Lighthouse
- [ ] **First Contentful Paint < 1.5s**
- [ ] **Time to Interactive < 3.5s**
- [ ] **API response < 500ms**
- [ ] **Database queries < 100ms**
- [ ] **No memory leaks** - Monitor over 24h

---

## Monitoring & Alerts

### Vercel Analytics

Enable in **Project Settings > Analytics**:

**Metrics to Track:**
- Page views
- Web Vitals (FCP, LCP, CLS)
- Geolocation
- Device types

**Alerts:**
- Error rate > 5%
- Page load > 5s
- Bounce rate > 70%

### Supabase Monitoring

**Dashboard Metrics:**
- Database connections
- API response times
- Storage usage
- Realtime connections

**Recommended Alerts:**
```sql
-- High CPU usage
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Monitor slow queries
SELECT query, calls, total_time, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### Python Worker Monitoring

**Health Check Endpoint:**
```bash
curl https://worker.collabryx.com/health
```

**Service-Specific Metrics:**

| Service | Metric | Alert Threshold |
|---------|--------|-----------------|
| All Services | Error rate | > 5% |
| All Services | Response time | > 2s |
| embedding_generator | Queue depth | > 100 |
| embedding_generator | DLQ size | > 10 |
| embedding_generator | Processing time | > 5s |
| match_generator | Match generation failures | > 10/hour |
| notification_engine | Delivery failures | > 5% |
| content_moderator | API errors | > 10% |
| ai_mentor_processor | Gemini API rate limit | > 5/hour |
| event_processor | Event backlog | > 1000 |
| analytics_aggregator | Aggregation failures | > 1/day |

**Logging:**
```python
# python-worker/main.py
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

logger.info(f"Queue depth: {queue_size}")
logger.error(f"Embedding failed: {error}")
```

### Error Tracking

**Sentry Integration:**
```typescript
// sentry.client.config.ts
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

---

## Troubleshooting

### Build Failures

**Issue:** `npm run build` fails  
**Solution:**
```bash
# Clear cache and rebuild
rm -rf .next node_modules
npm install
npm run build

# Check for TypeScript errors
npm run typecheck

# Check for linting errors
npm run lint
```

### Database Connection Issues

**Issue:** Cannot connect to Supabase  
**Solution:**
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
curl https://xxx.supabase.co/rest/v1/profiles \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```

### Python Worker Issues

**Issue:** Worker not processing embeddings  
**Solution:**
```bash
# Check container status
docker ps | grep python-worker

# View logs
docker logs python-worker-embedding-service-1

# Restart container
docker-compose restart

# Check health
curl http://localhost:8000/health
```

**Issue:** High queue depth  
**Solution:**
```bash
# Check queue size via API
curl https://worker.collabryx.com/health

# If queue > 100, scale worker
# Railway: Upgrade instance type
# Render: Increase CPU/memory

# Clear DLQ (if stuck)
curl -X POST https://worker.collabryx.com/embeddings/retry-dlq
```

### Real-time Issues

**Issue:** Real-time updates not working  
**Solution:**
```sql
-- Check if realtime is enabled
SELECT * FROM pg_publication WHERE pubname = 'supabase_realtime';

-- Enable for specific table
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

### Performance Issues

**Issue:** Slow page loads  
**Solution:**
```bash
# Run Lighthouse audit
npm run lighthouse

# Check bundle size
npm run build
# Look for large chunks in output

# Optimize images
# - Use next/image
# - Convert to WebP
# - Set proper dimensions

# Enable caching
# - React Query staleTime
# - ISR for static pages
```

**Issue:** Slow database queries  
**Solution:**
```sql
-- Find slow queries
SELECT schemaname, tablename, query, mean_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_posts_user_id ON posts(user_id);

-- Analyze table statistics
ANALYZE posts;
```

### Rollback Procedure

**Frontend Rollback:**
1. Go to Vercel Dashboard
2. Select deployment
3. Click **"..."** > **"Redeploy"**
4. Select previous stable version

**Database Rollback:**
```sql
-- Supabase has point-in-time recovery
-- Contact Supabase support for critical rollbacks

-- For schema changes, keep migration scripts versioned
-- Run previous version to rollback
```

**Worker Rollback:**
```bash
# Railway/Render: Redeploy previous image
# Docker: Pull previous tag
docker pull registry.example.com/collabryx-worker:previous-tag
docker-compose up -d
```

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System design and data flow
- [API Reference](./API-REFERENCE.md) - All API endpoints
- [Docker Scripts](./05-deployment/docker-scripts.md) - Local development
- [Environment Variables](./07-reference/environment-variables.md) - Complete reference
- [Security Guide](./SECURITY.md) - Security features

---

**Document Version:** 1.0.0  
**Last Reviewed:** 2026-03-16  
**Maintained By:** DevOps Team
