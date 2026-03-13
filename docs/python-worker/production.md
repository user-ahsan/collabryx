# Python Worker Production Deployment Guide

**For:** Production deployment on Render and Railway  
**Last Updated:** 2026-03-12

---

## Overview

This guide covers deploying the optimized Python Worker (~3GB image) to production platforms.

### Pre-deployment Checklist

- [ ] Docker image built and tested locally
- [ ] Supabase credentials ready
- [ ] Environment variables documented
- [ ] Health check endpoint verified
- [ ] Resource requirements understood (2GB RAM minimum)

---

## Render Deployment

### Step 1: Push to Container Registry

```bash
# Build image
docker build -t collabryx-embedding-service .

# Tag for registry (example: Docker Hub)
docker tag collabryx-embedding-service yourusername/collabryx-embedding-service:latest

# Push to registry
docker push yourusername/collabryx-embedding-service:latest
```

### Step 2: Create Render Service

1. **Login to Render Dashboard**: https://dashboard.render.com

2. **Create New Web Service**:
   - Click "New +" → "Web Service"
   - Select "Deploy an existing image from a registry"

3. **Configure Service**:
   ```
   Name: collabryx-embedding-service
   Region: Choose closest to your users
   Branch: main (if connecting to Git)
   ```

4. **Container Configuration**:
   ```
   Image URL: yourusername/collabryx-embedding-service:latest
   Port: 8000
   ```

5. **Environment Variables**:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ALLOWED_ORIGINS=https://your-app.com
   PYTHONUNBUFFERED=1
   ```

6. **Resource Type**:
   ```
   Recommended: Standard (2GB RAM, 0.5 CPU)
   Minimum: Starter (512MB RAM) - Not recommended for production
   ```

7. **Health Check Path**: `/health`

8. **Deploy**:
   - Click "Create Web Service"
   - Wait for deployment (~2-3 minutes for first deploy)

### Step 3: Verify Deployment

```bash
# Check service URL
curl https://collabryx-embedding-service.onrender.com/health

# Expected response
{
  "status": "healthy",
  "model_loaded": true,
  "supabase_connected": true
}
```

### Step 4: Configure Auto-Scaling (Optional)

In Render Dashboard:

```
Scaling:
  - Min Instances: 1
  - Max Instances: 3
  - Target CPU: 70%
```

### Render Pricing Estimate

| Tier | RAM | CPU | Cost/Month |
|------|-----|-----|------------|
| Starter | 512MB | 0.1 | $7 |
| Standard | 2GB | 0.5 | $25 |
| Pro | 4GB | 1.0 | $50 |

**Recommended:** Standard tier for production

---

## Railway Deployment

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login to Railway

```bash
railway login
```

### Step 3: Create New Project

```bash
# Initialize new project
railway init

# Or create from existing
railway up
```

### Step 4: Configure Service

1. **Open Railway Dashboard**: https://railway.app

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose `collabryx/python-worker`

3. **Configure Service**:
   ```
   Service Name: embedding-service
   Root Directory: python-worker
   ```

4. **Add Environment Variables**:
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ALLOWED_ORIGINS=https://your-app.com
   PYTHONUNBUFFERED=1
   ```

5. **Configure Build**:
   ```
   Build Command: docker build -t .
   Dockerfile: python-worker/Dockerfile
   ```

6. **Configure Resources**:
   ```
   Memory: 2048 MB (2GB)
   CPU: 0.5
   ```

### Step 5: Deploy

```bash
# Deploy to Railway
railway up

# Or use dashboard
# Click "Deploy" in Railway dashboard
```

### Step 6: Verify Deployment

```bash
# Get service URL
railway domain

# Check health
curl https://your-service.railway.app/health
```

### Step 7: Configure Health Checks

In Railway Dashboard:

```
Healthcheck Path: /health
Healthcheck Timeout: 5s
Healthcheck Interval: 30s
```

### Railway Pricing Estimate

| Usage | Cost |
|-------|------|
| Pro Plan | $5/month |
| RAM (2GB) | ~$10/month |
| CPU (0.5) | ~$5/month |
| **Total** | **~$20/month** |

---

## Alternative: Self-Hosted VPS

### DigitalOcean Droplet

```bash
# Create droplet (Ubuntu 22.04, 4GB RAM)
doctl compute droplet create embedding-worker \
  --region nyc1 \
  --size s-2vcpu-4gb \
  --image ubuntu-22-04-x64

# SSH into droplet
ssh root@<droplet-ip>

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Copy docker-compose.yml
scp docker-compose.yml root@<droplet-ip>:~/

# Run service
docker-compose up -d
```

### AWS ECS Fargate

```yaml
# task-definition.json
{
  "family": "embedding-service",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "1024",
  "memory": "3072",
  "containerDefinitions": [
    {
      "name": "embedding-service",
      "image": "yourusername/collabryx-embedding-service:latest",
      "portMappings": [{"containerPort": 8000}],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

---

## Post-Deployment Verification

### 1. Health Check

```bash
curl https://your-service-url/health
```

**Expected:**
```json
{
  "status": "healthy",
  "model_loaded": true,
  "supabase_connected": true,
  "uptime_seconds": >0
}
```

### 2. Test Embedding Generation

```bash
curl -X POST https://your-service-url/generate-embedding \
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

### 3. Monitor Logs

**Render:**
```bash
# Via dashboard: Logs tab
# Or CLI
render logs --service collabryx-embedding-service
```

**Railway:**
```bash
# Via dashboard: Deployments → Logs
# Or CLI
railway logs
```

### 4. Check Metrics

```bash
# Queue status
curl https://your-service-url/queue/status

# Model info
curl https://your-service-url/model-info
```

---

## Monitoring & Alerts

### Health Check Monitoring

Set up monitoring for `/health` endpoint:

- **Render:** Built-in monitoring in dashboard
- **Railway:** Built-in monitoring in dashboard
- **External:** UptimeRobot, Pingdom, or Datadog

### Key Metrics to Monitor

| Metric | Alert Threshold |
|--------|-----------------|
| Memory Usage | >80% |
| CPU Usage | >70% |
| Queue Size | >80 |
| Failed Count | >10/hour |
| Uptime | <99.9% |

### Log Aggregation

**Recommended Tools:**
- Papertrail (free tier available)
- Logtail
- Datadog
- Grafana Loki

---

## Scaling Strategies

### Horizontal Scaling

```yaml
# docker-compose.yml (for swarm mode)
deploy:
  replicas: 3
  resources:
    limits:
      cpus: '2.0'
      memory: 4G
```

### Vertical Scaling

Increase resources in platform dashboard:
- **Render:** Upgrade to Pro tier (4GB RAM)
- **Railway:** Increase RAM/CPU allocation

### Queue Optimization

For high load:

```python
# main.py
MAX_QUEUE_SIZE = 500  # Increase from 100
MAX_CONCURRENT_PROCESSING = 15  # Increase from 5
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

### 3. Rate Limiting

Add to `main.py`:

```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter

@app.post("/generate-embedding")
@limiter.limit("10/minute")
async def generate_embedding(request: Request, ...):
    ...
```

### 4. SSL/TLS

- **Render:** Automatic HTTPS
- **Railway:** Automatic HTTPS
- **Custom Domain:** Use Let's Encrypt

---

## Cost Optimization

### Render

- Use Starter tier for development
- Use Standard tier for production
- Enable auto-sleep for non-critical services

### Railway

- Use Hobby plan for development ($5/month)
- Use Pro plan for production
- Set usage limits to prevent overages

### General

- Monitor resource usage weekly
- Scale down during low-traffic periods
- Use spot instances for non-critical workloads

---

## Troubleshooting

### Issue: Service Crashes on Startup

**Solution:**
```bash
# Check logs
railway logs
# or Render dashboard → Logs

# Common causes:
# - Missing environment variables
# - Insufficient memory
# - Model loading timeout
```

### Issue: Health Check Fails

**Solution:**
```bash
# Increase start period
healthcheck:
  start_period: 60s  # Increase from 40s

# Check model loading
curl https://your-service-url/model-info
```

### Issue: High Memory Usage

**Solution:**
```yaml
# Limit concurrent processing
# In main.py:
MAX_CONCURRENT_PROCESSING = 3  # Reduce from 5

# Reduce queue size
MAX_QUEUE_SIZE = 50  # Reduce from 100
```

### Issue: Slow Response Times

**Solution:**
```bash
# Check queue status
curl https://your-service-url/queue/status

# If queue is full, scale up:
# - Increase worker count
# - Add more instances
```

---

## Rollback Procedure

### Render

1. Go to service dashboard
2. Click "Deployments"
3. Select previous version
4. Click "Rollback"

### Railway

```bash
# List deployments
railway deployments

# Rollback to previous
railway rollback <deployment-id>
```

---

## Next Steps

- [Development Guide](./development.md) - Local development setup
- [Main README](./README.md) - Overview and API reference

---

## Support

For issues or questions:
- Check logs in platform dashboard
- Review [Troubleshooting](#troubleshooting) section
- Contact DevOps team
