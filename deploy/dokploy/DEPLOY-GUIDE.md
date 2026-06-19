# Collabryx — Dokploy Deployment Guide

Deploy all 5 services (Next.js + 4 Python microservices) on your self-hosted Dokploy instance.

---

## Prerequisites

- A server with **Dokploy installed** (see [docs.dokploy.com](https://docs.dokploy.com/docs/core/installation))
- A **domain** pointed to your server's IP (A record to Dokploy server IP)
- Your **Git repository** containing Collabryx
- Your **Supabase project** credentials (same as local/Vercel)

---

## Step-by-Step (takes 3 minutes)

### 1. Create the Compose Service in Dokploy

| Setting | Value |
|---------|-------|
| **Service type** | `Compose` |
| **Source type** | `Git` |
| **Provider** | GitHub/GitLab/Bitbucket |
| **Repository** | `your-username/collabryx` |
| **Branch** | `main` |
| **Compose path** | `deploy/dokploy/docker-compose.yml` |
| **Compose type** | `docker-compose` |

### 2. Paste Environment Variables

Go to **Environment** tab in Dokploy. Paste the entire contents of [`env-template.dokploy`](./env-template.dokploy).

**Then change these 3 values:**

| Variable | What to set |
|----------|-------------|
| `DOMAIN` | `collabryx.yourdomain.com` ← your actual domain |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service key (same as .env) |
| `WORKER_API_KEY` | Generate: `openssl rand -base64 32` |

Everything else in the template has your actual Supabase and OpenRouter keys already.

**That's it. Everything else is automatic:**
- ✅ Domain routing → `${DOMAIN}` env var in Traefik labels
- ✅ SSL/HTTPS → Let's Encrypt via `websecure` entrypoint
- ✅ Internal service URLs → Docker DNS (`embedding:8000`, etc.)
- ✅ Volume → auto-created by Docker (`collabryx-model-cache`)

### 3. Deploy

Click **Deploy**. Wait 5-15 minutes for first build.

After deployment:
- All 5 containers auto-connect to `dokploy-network`
- Traefik reads your `DOMAIN` env var, routes traffic to Next.js on port 3000
- SSL certificate auto-generates via Let's Encrypt (takes ~10s after deploy)
- Python microservices are internal-only (not web-exposed)

Visit `https://collabryx.yourdomain.com` — done.

---

## What Gets Created Automatically

| Resource | How it's created |
|----------|-----------------|
| `collabryx-model-cache` volume | Defined in `volumes:` in compose file — Docker auto-creates |
| `dokploy-network` | Already exists (created by Dokploy install) |
| Traefik routes | From compose labels using `Host(\`${DOMAIN}\`)` |
| SSL certificate | Let's Encrypt via `certResolver=letsencrypt` |

---

## Troubleshooting

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| Container restarts loop | Missing env var | Check all required vars in Environment tab |
| `embedding` unhealthy | Model still loading | Wait — start_period is 120s |
| 502 Bad Gateway | `DOMAIN` not set, or DNS not propagated | Verify A record + `DOMAIN` env var |
| SSL error | Let's Encrypt hasn't fired yet | Wait 30s after deploy, then refresh |
| OOM for embedding | Not enough RAM | Increase server RAM or reduce memory limit |
| Can't reach Supabase | Wrong `SERVICE_ROLE_KEY` | Double-check the key from Supabase dashboard |

---

## Resource Requirements

| Resource | Minimum | Recommended |
|----------|---------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 6 GB | 8 GB |
| Disk | 20 GB | 40 GB |
