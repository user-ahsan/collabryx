# Collabryx Deployment Plan

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COLLABRYX PRODUCTION                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  VERCEL (Free)                         SUPABASE (Free)              │
│  ┌──────────────────────────┐         ┌────────────────────┐        │
│  │  Next.js 16 Frontend     │         │  PostgreSQL DB     │        │
│  │  - 27 pages              │◄───────►│  - 38 tables       │        │
│  │  - 20 API routes         │  RLS    │  - Supabase Auth   │        │
│  │  - Server Actions        │  direct │  - Storage buckets │        │
│  │  - SSR + ISR             │         │  - Realtime        │        │
│  │  collabryx.vercel.app    │         │  .supabase.co      │        │
│  └────────┬─────────────────┘         └────────────────────┘        │
│           │                                                         │
│           │  HTTP calls via lib/worker-client.ts                    │
│           │  (each microservice has its own URL)                    │
│           ▼                                                         │
│  ┌──────────────────────────────────────────────────────────┐       │
│  │                   PYTHON MICROSERVICES                    │       │
│  ├──────────────────────────────┬───────────────────────────┤       │
│  │ RENDER (Free Tier)           │ HF SPACES (Free CPU)      │       │
│  │                              │                           │       │
│  │ collabryx-notification-svc   │ collabryx-embedding-svc   │       │
│  │ .onrender.com:8002           │ .hf.space:7860            │       │
│  │ /send, /digest, /cleanup     │ /generate-embedding       │       │
│  │                              │ /health                   │       │
│  │ collabryx-feed-svc           │ /model-info               │       │
│  │ .onrender.com:8003           │                           │       │
│  │ /score-feed, /persist        │ Model: all-MiniLM-L6-v2   │       │
│  │                              │ Dims: 384                 │       │
│  │ collabryx-match-svc          │ 2 vCPU / 16GB RAM         │       │
│  │ .onrender.com:8004           │ CPU (no GPU)              │       │
│  │ /generate, /generate-batch   │                           │       │
│  │                              │                           │       │
│  │ Limitation: spins down       │ Limitation: spins down    │       │
│  │ after 15 min idle (30s       │ after 48h idle (10s      │       │
│  │ cold start)                  │ cold start)               │       │
│  └──────────────────────────────┴───────────────────────────┘       │
│                                                                     │
│  OPENROUTER AI (Free credits)                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │  deepseek/deepseek-v4-flash (AI chat, AI Mentor)              │   │
│  │  text-embedding-3-small (fallback embedding, OpenAI API)       │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

## Deployment Order

**Must deploy in this exact sequence:**

### Step 1: Supabase ✅ (Already Live)
- URL: `https://fwmlglizkkkwldoyujwl.supabase.co`
- All migrations applied, RLS active
- Storage buckets, auth configured

### Step 2: Hugging Face Spaces (Embedding Service)
- **Cost:** Free (CPU tier, 16GB RAM, 2 vCPU)
- **Target:** `https://huggingface.co/spaces/{username}/collabryx-embedding-service`
- **Setup:**
  1. Go to `huggingface.co/new-space`
  2. Name: `collabryx-embedding-service`
  3. SDK: **Docker**
  4. Hardware: **CPU (free)**
  5. Space can be public
- **Files to push:**
  - `python-worker/main.py`
  - `python-worker/embedding_generator.py`
  - `python-worker/embedding_validator.py`
  - `python-worker/rate_limiter.py`
  - `python-worker/shared/` (db.py, middleware.py, logging_config.py)
  - `python-worker/requirements.txt`
  - HF-specific `Dockerfile` (port 7860)
  - HF-specific `README.md` (Space config frontmatter)
- **Secrets to set (HF Space Settings → Repository Secrets):**
  - `SUPABASE_URL` = Supabase project URL
  - `SUPABASE_SERVICE_ROLE_KEY` = Service role key
  - `ALLOWED_ORIGINS` = `https://collabryx.vercel.app`

### Step 3: Render (3 Lightweight Microservices)
- **Cost:** Free (3 × 750 hrs/month, spin down after 15 min idle)
- **Target URLs:**
  - `https://collabryx-notification-service.onrender.com`
  - `https://collabryx-feed-service.onrender.com`
  - `https://collabryx-match-service.onrender.com`
- **Setup:**
  1. Render Dashboard → **New → Blueprint**
  2. Connect GitHub repo
  3. Read config from `render.yaml`
- **Secrets to set per service (sync: false):**
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Vercel (Frontend — Deploy Last)
- **Cost:** Free tier
- **Target:** `https://collabryx.vercel.app`
- **Setup:**
  1. Vercel Dashboard → **Add New → Project**
  2. Import GitHub repo
  3. Framework: **Next.js** (auto-detected)
  4. Build command: `bun install --frozen-lockfile && bun run build`
- **Environment Variables (15 total):**

| Variable | Source | Type |
|----------|--------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Secret |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | Secret |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role | Secret |
| `NEXT_PUBLIC_APP_URL` | `https://collabryx.vercel.app` | Plain |
| `OPENROUTER_API_KEY` | OpenRouter key | Secret |
| `OPENROUTER_MODEL` | `deepseek/deepseek-v4-flash` | Plain |
| `OPENROUTER_MAX_TOKENS` | `8192` | Plain |
| `OPENROUTER_TEMPERATURE` | `0.7` | Plain |
| `EMBEDDING_SERVICE_URL` | HF Spaces URL (from Step 2) | Secret |
| `NOTIFICATION_SERVICE_URL` | Render notif URL (from Step 3) | Secret |
| `FEED_SERVICE_URL` | Render feed URL (from Step 3) | Secret |
| `MATCH_SERVICE_URL` | Render match URL (from Step 3) | Secret |
| `BACKEND_MODE` | `render` | Plain |
| `NODE_ENV` | `production` | Plain |
| `LOG_LEVEL` | `info` | Plain |

## Code Changes Required

### 1. `python-worker/Dockerfile.hfspaces` — NEW FILE
HF Spaces requires port 7860. Clone of existing Dockerfile with:
- `EXPOSE 7860`
- `CMD uvicorn main:app --host 0.0.0.0 --port 7860`

### 2. `python-worker/README.md` — NEW FILE (for HF Spaces)
HF Spaces YAML frontmatter:
```yaml
title: Collabryx Embedding Service
emoji: 🧠
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
```

### 3. `python-worker/main.py` — Lines 1212-1215
- Change default port from hardcoded 8000 to env `PORT` (HF Spaces sets this)
- `port = int(os.environ.get("PORT", 8000))`
- Works both locally and on HF Spaces

### 4. `lib/config/environment.ts`
- Add Vercel-aware branches to ALL service URLs
- When `process.env.VERCEL === '1'`, each service reads its dedicated env var
- Worker (embedding): `EMBEDDING_SERVICE_URL`
- Notification: `NOTIFICATION_SERVICE_URL` (already supported)
- Feed: `FEED_SERVICE_URL` (already supported)
- Match: `MATCH_SERVICE_URL` (already supported)
- When not on Vercel: keep existing Docker/localhost fallback behavior

### 5. `lib/worker-client.ts`
- `WorkerClient` currently uses `config.worker.url`
- Add fallback: check `EMBEDDING_SERVICE_URL` env var first
- This mirrors how `NotificationClient`, `FeedClient`, `MatchClient` already work

### 6. `render.yaml`
- Remove the database section (using Supabase)
- Remove the frontend section (using Vercel)
- Remove the embedding service (using HF Spaces)
- Keep only 3 services on **free** plan
- Each with `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`

### 7. `lib/config/backend.ts` — Minor Updates
- The `BACKEND_URL_RENDER` concept was for a single backend
- Now each service has its own URL via env vars
- Keep backward compat but deprecate `getBackendUrl()`
- Update `NOTIFICATION_SERVICE_URL`, `FEED_SERVICE_URL`, `MATCH_SERVICE_URL` defaults to check Vercel context

## Key Architectural Decisions

### Why per-service URLs instead of a single backend?
The old architecture had ONE embedding service doing everything. Now each microservice runs independently:
- Embedding on HF Spaces (needs 16GB RAM for ML model)
- Notification/Feed/Match on Render (lightweight, no ML)
- Each can scale independently

### How does the frontend find services on Vercel?
- `lib/config/environment.ts` checks `process.env.VERCEL`
- On Vercel: reads `EMBEDDING_SERVICE_URL`, `NOTIFICATION_SERVICE_URL`, etc.
- In Docker: uses `host.docker.internal:PORT`
- Locally: uses `localhost:PORT`
- All three paths work without changing app code

### How does onboarding trigger embedding generation?
The onboarding flow:
1. User completes 5-step onboarding wizard
2. `app/(auth)/onboarding/actions.ts` calls `triggerEmbeddingGeneration()`
3. This hits `/api/embeddings/generate` which proxies to the embedding service
4. The embedding service queue on HF Spaces processes it asynchronously
5. Frontend polls `/api/embeddings/status/[userId]` until complete
6. API routes use `lib/worker-client.ts` → `WorkerClient` → configured URL

### API Route → Microservice Call Chain
```
/embeddings/generate ───────────► lib/services/embeddings.ts ─────► worker-client.ts
                                                                        │
/notifications/send ────────────► lib/services/notifications.ts ───────► NotificationClient
                                                                        │
/feed/score ────────────────────► lib/services/posts.ts ───────────────► FeedClient
                                                                        │
/matches/generate ──────────────► lib/services/matches.ts ─────────────► MatchClient
                                                                        │
                                                        ALL read URLs from config
```

## Free Tier Limitations & Mitigations

| Issue | Impact | Mitigation |
|-------|--------|------------|
| Render cold starts (30s) | First request after 15min idle is slow | Acceptable for dev/demo; upgrade to paid for production |
| HF Spaces cold starts (10s) | Model reload after 48h idle | Keep embedding queue; requests queue until service is warm |
| No embedding service HA | Single point of failure | OpenAI text-embedding-3-small fallback in `vector-retriever.ts` |
| Supabase 500MB DB limit | May fill with embeddings | Monitor usage; each embedding row is ~1.5KB |
| Vercel 100GB bandwidth | High traffic may exhaust | Fine for typical dev deployment |

## Verification Checklist

After deployment, verify these flows work end-to-end:

- [ ] `GET /` — Landing page loads
- [ ] `GET /login` — Login page renders
- [ ] `POST /api/auth/login` — Auth works
- [ ] `GET /api/health` — Health check returns healthy
- [ ] `POST /api/embeddings/generate` — Embedding service reachable
- [ ] `GET /api/embeddings/status/[userId]` — Status checks work
- [ ] `POST /api/feed/score` — Feed scoring hits Render service
- [ ] `POST /api/notifications/send` — Notifications hit Render service
- [ ] `POST /api/matches/generate` — Match gen hits Render service
- [ ] Dashboard feed loads (personalized feed)
- [ ] Onboarding completes → triggers embedding
- [ ] AI Mentor chat works (OpenRouter API)
- [ ] User profiles load (Supabase direct)
- [ ] Messages send/receive
- [ ] Notifications appear in real-time
- [ ] PDC simulation: `python pdc/notification_fanout/main.py` (local only)

## Cost Breakdown

| Service | Plan | Monthly Cost |
|---------|------|-------------|
| Vercel Frontend | Free (Hobby) | $0 |
| Supabase DB | Free | $0 |
| HF Spaces (CPU) | Free | $0 |
| Render (3 services) | Free | $0 |
| OpenRouter API | Pay-as-you-go | ~$1-3/mo |
| **Total** | | **~$1-3/mo** |

For production launch, upgrade to:
- Render: Standard × 3 (~$21/mo)
- HF Spaces: CPU paid (~$7/mo)
- Supabase: Pro ($25/mo)
- **Total: ~$53/mo**
