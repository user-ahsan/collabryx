# Python Worker Deployment Guide

**For:** Local Docker deployment
**Last Updated:** 2026-06-02

---

## Overview

This guide covers running the optimized Python Worker (~3GB image) using Docker locally.

### Pre-deployment Checklist

- [ ] Supabase credentials ready
- [ ] Environment variables documented
- [ ] Health check endpoint verified
- [ ] Resource requirements understood (2GB RAM minimum)

---

## Docker Deployment

### Step 1: Build Image

```bash
# From the project root
docker build -t collabryx-embedding-service ./python-worker
```

Or from the `python-worker` directory:

```bash
docker build -t collabryx-embedding-service .
```

### Step 2: Configure Environment

Create a `.env` file with your Supabase credentials:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=http://localhost:3000
```

### Step 3: Run Container

```bash
docker run -p 8000:8000 \
  --env-file .env \
  --name embedding-worker \
  collabryx-embedding-service
```

Or with Docker Compose:

```yaml
# docker-compose.yml
version: "3.8"
services:
  embedding-service:
    build: .
    ports:
      - "8000:8000"
    env_file: .env
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 60s
    deploy:
      resources:
        limits:
          memory: 4G
```

### Step 4: Verify Deployment

```bash
# Check health
curl http://localhost:8000/health

# Expected response
{
  "status": "healthy",
  "model_loaded": true
}
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl http://localhost:8000/health
```

**Expected:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "uptime_seconds": >0
}
```

### 2. Test Embedding Generation

```bash
curl -X POST http://localhost:8000/generate-embedding \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Student React Developer passionate about Fintech",
    "user_id": "test-user-123"
  }'
```

**Expected:**
```json
{
  "user_id": "test-user-123",
  "status": "queued",
  "message": "Vector embedding queued for background processing"
}
```

### 3. Check Metrics

```bash
# Model info
curl http://localhost:8000/model-info

# Service info
curl http://localhost:8000/
```

---

## Security Best Practices

### 1. Environment Variables

Never commit `.env` files:

```bash
# Add to .gitignore
.env
.env.*.local
```

### 2. Network Security

```yaml
# docker-compose.yml
networks:
  default:
    name: collabryx-network
    driver: bridge
```

### 3. SSL/TLS

- Use a reverse proxy (e.g., nginx, Caddy) for TLS termination
- Or deploy behind a cloud load balancer with automatic HTTPS

---

## Troubleshooting

### Issue: Service Crashes on Startup

**Solution:**
```bash
# Check logs
docker logs embedding-worker

# Common causes:
# - Missing environment variables
# - Insufficient memory
# - Model loading timeout
```

### Issue: Health Check Fails

**Solution:**
```bash
# Increase start period in docker-compose.yml
healthcheck:
  start_period: 120s  # Increase from 60s

# Check model loading
curl http://localhost:8000/model-info
```

### Issue: High Memory Usage

**Solution:**
```yaml
# Limit concurrent processing
# In main.py:
MAX_CONCURRENT_PROCESSING = 3  # Reduce from 5
```

### Issue: Port 8000 Already in Use

**Solution:**
```bash
# Map to a different host port
docker run -p 8001:8000 collabryx-embedding-service
```

---

## Rollback

```bash
# Stop and remove current container
docker stop embedding-worker
docker rm embedding-worker

# Rebuild with previous image tag
docker build -t collabryx-embedding-service:previous .
```

---

## Next Steps

- [Development Guide](./development.md) - Local development setup
- [Overview](./overview.md) - Service overview and API reference

---

## Support

For issues or questions:
- Check logs: `docker logs embedding-worker`
- Review [Troubleshooting](#troubleshooting) section
- Contact DevOps team
