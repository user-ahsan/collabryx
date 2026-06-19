# Environment Variables Comparison

## Local Development vs Vercel vs Dokploy

**Legend:** ✅ = explicit value | ❌ = not set | 🟡 = auto-set | 🔄 = derived

---

## 1. SUPABASE (Same Everywhere — No Changes)

| Variable | Local | Vercel | Dokploy |
|----------|-------|--------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ `https://fwml...` | ✅ same | ✅ same |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ `eyJhbG...` | ✅ same | ✅ same |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ your key | ✅ same | ✅ same |

> Supabase is external (cloud-hosted). All 3 environments use the same project.

---

## 2. APP CONFIG — WHAT CHANGES

| Variable | Local | Vercel | Dokploy | Change? |
|----------|-------|--------|---------|---------|
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | `https://collabryx.vercel.app` | **`https://${DOMAIN}`** | ⚠️ **Yes — set via env** |
| `NODE_ENV` | `development` | `production` 🟡 | **`production`** | ⚠️ **Yes** |
| `NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION` | `true` | `false` | **`false`** | ⚠️ **Yes** |
| `VERCEL` | ❌ | `1` 🟡 | ❌ | Not needed |
| `IN_DOCKER_CONTAINER` | ❌ | ❌ | ✅ **`true`** | ⚠️ **NEW** (hardcoded in compose) |

---

## 3. MICROSERVICE ROUTING — BIGGEST DIFFERENCE

**How routing works in each environment:**
- **Local**: `NODE_ENV=development` → `environment.ts` uses `localhost:8000-8004`
- **Vercel**: `NODE_ENV=production` → reads `BACKEND_DOMAIN` or `*_SERVICE_URL` env vars
- **Dokploy**: All containers on same Docker network → **Docker DNS service names**

| Variable | Local | Vercel | Dokploy | How it's set on Dokploy |
|----------|-------|--------|---------|------------------------|
| `EMBEDDING_SERVICE_URL` | 🔄 localhost:8000 | ✅ external URL | **`http://embedding:8000`** | Hardcoded in compose `environment:` |
| `NOTIFICATION_SERVICE_URL` | 🔄 localhost:8002 | ✅ external URL | **`http://notification:8000`** | Hardcoded in compose `environment:` |
| `FEED_SERVICE_URL` | 🔄 localhost:8003 | ✅ external URL | **`http://feed:8000`** | Hardcoded in compose `environment:` |
| `MATCH_SERVICE_URL` | 🔄 localhost:8004 | ✅ external URL | **`http://match:8000`** | Hardcoded in compose `environment:` |
| `BACKEND_DOMAIN` | ❌ | ✅ `ahsanali.cc` | ❌ | Not needed — internal DNS |
| `PYTHON_WORKER_URL` | `http://localhost:8000` | ❌ | ❌ | Not used in production |
| `NEXT_PUBLIC_WORKER_API_URL` | ❌ | ✅ external URL | ❌ | Not needed |

> **Key**: In `docker-compose.yml`, the `environment:` block sets these 4 URLs + `IN_DOCKER_CONTAINER=true`. You **don't** need to set them in the Dokploy UI.

---

## 4. CORS

| Variable | Local | Vercel | Dokploy |
|----------|-------|--------|---------|
| `ALLOWED_ORIGINS` | `http://localhost:3000` | `https://collabryx.vercel.app` | **`https://${DOMAIN}`** |

---

## 5. AI PROVIDERS (Same Everywhere)

| Variable | Local/Vercel/Dokploy |
|----------|---------------------|
| `OPENROUTER_API_KEY` | ✅ `sk-or-v1-...` (same) |
| `OPENROUTER_BASE_URL` | ✅ `https://openrouter.ai/api/v1` |
| `OPENROUTER_MODEL` | ✅ `deepseek/deepseek-v4-flash` |
| `OPENROUTER_REFERER` | **Change to `https://${DOMAIN}`** ⚠️ |
| `OPENROUTER_TITLE` | ✅ `Collabryx` |

---

## 6. WHAT TO SET IN DOKPLOY UI

**In Environment tab — paste these:**

```ini
DOMAIN=collabryx.yourdomain.com
NEXT_PUBLIC_SUPABASE_URL=https://fwmlglizkkkwldoyujwl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=https://${DOMAIN}
NODE_ENV=production
NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION=false
ALLOWED_ORIGINS=https://${DOMAIN}
OPENROUTER_API_KEY=sk-or-v1-...
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-v4-flash
OPENROUTER_REFERER=https://${DOMAIN}
OPENROUTER_TITLE=Collabryx
OPENROUTER_MAX_TOKENS=8192
OPENROUTER_TEMPERATURE=0.7
OPENROUTER_TIMEOUT=120000
PYTHONUNBUFFERED=1
LOG_LEVEL=INFO
WORKER_API_KEY=<generated key>
```

**Already in compose `environment:` (don't set in UI):**
```
IN_DOCKER_CONTAINER=true
EMBEDDING_SERVICE_URL=http://embedding:8000
NOTIFICATION_SERVICE_URL=http://notification:8000
FEED_SERVICE_URL=http://feed:8000
MATCH_SERVICE_URL=http://match:8000
```
