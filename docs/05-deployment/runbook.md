# Deployment Runbook

Step-by-step deployment procedures for Collabryx production and staging environments.

---

## Table of Contents

- [Pre-Deployment Checks](#pre-deployment-checks)
- [Deployment Steps](#deployment-steps)
  - [Frontend (Next.js on Vercel)](#frontend-nextjs-on-vercel)
  - [Python Worker (Docker)](#python-worker-docker)
- [Post-Deployment Verification](#post-deployment-verification)
- [Rollback Procedure](#rollback-procedure)
- [Environment Variable Checklist](#environment-variable-checklist)
- [Common Issues & Troubleshooting](#common-issues--troubleshooting)

---

## Pre-Deployment Checks

### Code Quality
- [ ] `npm run build` passes with no errors
- [ ] `npm run lint` passes with no errors
- [ ] `npm run typecheck` passes
- [ ] `npm run test` passes (all 750+ tests)
- [ ] No `console.log` or debug statements in production code
- [ ] No hardcoded secrets or API keys

### Python Worker
- [ ] Docker image builds successfully: `cd python-worker && docker compose build`
- [ ] Health endpoint responds: `curl http://localhost:8000/health`
- [ ] No dependency conflicts in `requirements.txt`

### Database
- [ ] Supabase project is healthy (check dashboard)
- [ ] All migrations applied (`supabase db push`)
- [ ] RLS policies verified (100 policies active)
- [ ] Backup taken before migration

### Infrastructure
- [ ] Docker Compose services start cleanly: `docker compose up -d`
- [ ] All health checks pass within 60s
- [ ] Log rotation configured (max-size: 10m, max-file: 3)
- [ ] Collabryx Worker accessible (Local port 8000)

---

## Deployment Steps

### Frontend (Next.js on Vercel)

1. **Push to main branch**
   ```bash
   git add .
   git commit -m "deploy: production release"
   git push origin main
   ```

2. **Verify Vercel build**
   - Go to Vercel dashboard → Deployments
   - Monitor build progress (~2-5 minutes)
   - Check build logs for errors

3. **Verify deployment**
   ```bash
   curl -I https://collabryx.vercel.app
   # Expected: HTTP/2 200
   ```

### Python Worker (Docker)

1. **Build and deploy**
   ```bash
   cd python-worker

   # Production (all services)
   docker compose --profile production up -d --build

    # Or development only
    docker compose --profile dev up -d --build
    ```

  2. **Verify health**
   ```bash
   # Wait for startup (60s start_period)
   sleep 60

    # Check health
    curl http://localhost:8000/health | jq .status
    # Expected: "healthy" or "degraded"
    ```

  3. **Verify Docker health**
   ```bash
   docker compose ps
    # All services should show "healthy"
    ```

---

## Post-Deployment Verification

### Functional Tests
- [ ] User login works
- [ ] User registration works
- [ ] Profile creation works
- [ ] Match suggestions appear
- [ ] Messaging works
- [ ] AI mentor responds

### Performance Checks
- [ ] Page load < 3s (Lighthouse)
- [ ] API response < 500ms
- [ ] Python worker /health response < 2s

### Log Verification
```bash
# Check worker logs
docker compose logs --tail=50 collabryx-worker

# Check for errors
docker compose logs collabryx-worker | grep -i error

# Check log rotation
docker inspect collabryx-worker | grep -A5 LogPath
```

---

## Rollback Procedure

### Emergency Rollback (Vercel Frontend)

1. **Immediate rollback**
   ```bash
   # Via Vercel CLI
   vercel rollback

   # Or via dashboard: Deployments → Previous → Promote to Production
   ```

2. **Verify rollback**
   ```bash
   curl -I https://collabryx.vercel.app
   ```

### Python Worker Rollback

1. **Stop current deployment**
   ```bash
   cd python-worker
   docker compose down
   ```

2. **Deploy previous image**
   ```bash
   # If using tagged images
   docker compose --profile production up -d

   # Or rebuild from previous commit
   git checkout <previous-commit>
   docker compose --profile production up -d --build
   ```

3. **Verify rollback**
   ```bash
   sleep 60
   curl http://localhost:8000/health | jq .status
   ```

### Database Rollback

1. **Via Supabase Dashboard**
   - Go to Settings → Database
   - Use Point-in-Time Recovery (if enabled)
   - Or restore from manual backup

2. **Via CLI**
   ```bash
   # Restore from backup
   psql -h YOUR-DB-HOST -U postgres -d postgres < backup.sql
   ```

### Rollback Communication
- [ ] Update status page
- [ ] Notify team in Slack
- [ ] Document incident in post-mortem

---

## Environment Variable Checklist

### Required (All Environments)
| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role | `eyJ...` |
| `NEXT_PUBLIC_APP_URL` | App base URL | `https://collabryx.com` |
| `PYTHON_WORKER_URL` | Worker API URL | `http://localhost:8000` |
| `ALLOWED_ORIGINS` | CORS allowed origins | `http://localhost:3000` |

### AI Features
| Variable | Description | Example |
|----------|-------------|---------|
| `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` | LLM provider key | `sk-...` |
| `LLM_PROVIDER` | Provider name | `openai` or `anthropic` |


### Staging-Specific
| Variable | Description | Example |
|----------|-------------|---------|
| `STAGING` | Staging flag | `true` |

| `WORKER_API_KEY` | Worker auth key | `staging-key-...` |

---

## Common Issues & Troubleshooting

### Issue: Worker fails to start

**Symptoms:**
- `docker compose ps` shows worker as "unhealthy"
- Health check returns non-200

**Diagnosis:**
```bash
docker compose logs collabryx-worker | tail -50
```

**Common causes:**
1. **Missing env vars**: Check `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
2. **Model loading timeout**: Increase `start_period` to 120s
3. **Port conflict**: Ensure port 8000 is not in use
4. **Memory limit**: Check `docker stats` — may need to increase memory limit

**Fix:**
```bash
# Check env vars
docker compose exec collabryx-worker env | grep SUPABASE

# Check memory
docker stats --no-stream collabryx-worker

# Restart with more time
docker compose down && docker compose --profile production up -d
```

### Issue: High memory usage

**Symptoms:**
- Worker memory > 90% of limit
- Health check returns "warning" status

**Diagnosis:**
```bash
# Check memory
curl http://localhost:8000/health | jq .system.memory

# Check Docker stats
docker stats --no-stream collabryx-worker
```

**Fix:**
1. Increase memory limit in `docker-compose.yml` (currently 1G)
2. Check for memory leaks in queue processing
3. Restart worker: `docker compose restart collabryx-worker`

### Issue: Log files growing too large

**Symptoms:**
- Disk space filling up
- Docker logs consuming GBs

**Diagnosis:**
```bash
# Check log size
docker inspect --format='{{.LogPath}}' collabryx-worker
ls -lh /var/lib/docker/containers/*/ *-json.log
```

**Fix:**
- Verify log rotation is configured (max-size: 10m, max-file: 3)
- Clean old logs: `docker system prune`
- Restart service to apply new log config

---

## Quick Reference Commands

```bash
# Start all production services
cd python-worker && docker compose --profile production up -d

# Start dev worker only
docker compose --profile dev up -d

# View all service status
docker compose ps

# View logs
docker compose logs -f collabryx-worker

# Restart a service
docker compose restart collabryx-worker

# Rebuild and restart
docker compose --profile production up -d --build

# Stop everything
docker compose down

# Check health
curl http://localhost:8000/health | jq .
```

---

**Last Updated:** May 2026  
**Version:** 1.0.0  
**Maintained By:** DevOps Team
