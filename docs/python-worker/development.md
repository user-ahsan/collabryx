# Python Worker Development Guide

**For:** Local development and testing  
**Last Updated:** 2026-03-12

---

## Prerequisites

- Docker Desktop (installed and running)
- Git
- PowerShell or Terminal

---

## Quick Start

### 1. Clone and Navigate

```bash
cd D:\Projects\collabryx\python-worker
```

### 2. Build Docker Image

```bash
docker build -t collabryx-embedding-service .
```

**Expected Output:**
```
✅ Build successful (~3GB image)
```

### 3. Configure Environment

Create a `.env` file:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=http://localhost:3000
```

### 4. Run with Docker Compose

```bash
docker-compose up -d
```

### 5. Verify Health

```bash
# Check container status
docker-compose ps

# Check health endpoint
curl http://localhost:8000/health

# View logs
docker-compose logs -f
```

**Expected Health Response:**
```json
{
  "status": "degraded",
  "model_loaded": true,
  "supabase_connected": false,
  "queue_size": 0
}
```

> **Note:** `status: degraded` is normal in development if Supabase credentials aren't configured. The service still works.

---

## Development Workflow

### View Logs

```bash
# Follow logs
docker-compose logs -f

# Last 50 lines
docker-compose logs --tail=50

# Specific service
docker-compose logs embedding-service
```

### Restart Service

```bash
# Restart
docker-compose restart

# Rebuild and restart
docker-compose up -d --build
```

### Stop Service

```bash
# Stop containers
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Testing

### Run Tests in Container

```bash
# Build test image
docker build -t collabryx-embedding-service-test .

# Run tests
docker run --rm collabryx-embedding-service-test pytest
```

### Run Tests with Coverage

```bash
docker run --rm collabryx-embedding-service-test pytest --cov=. --cov-report=html
```

### Access Test Coverage Report

```bash
# Copy coverage report to host
docker cp $(docker-compose ps -q embedding-service):/app/htmlcov ./coverage

# Open in browser
start ./coverage/index.html
```

---

## API Testing

### Health Check

```bash
curl http://localhost:8000/health
```

### Get Model Info

```bash
curl http://localhost:8000/model-info
```

### Get Queue Status

```bash
curl http://localhost:8000/queue/status
```

### Pause Queue

```bash
curl -X POST http://localhost:8000/queue/pause
```

### Resume Queue

```bash
curl -X POST http://localhost:8000/queue/resume
```

### Generate Embedding (Test)

```bash
curl -X POST http://localhost:8000/generate-embedding \
  -H "Content-Type: application/json" \
  -d "{\"text\": \"Student React Developer passionate about Fintech\", \"user_id\": \"test-123\"}"
```

**Expected Response:**
```json
{
  "user_id": "test-123",
  "status": "queued",
  "message": "Vector embedding queued for background processing"
}
```

---

## Debugging

### Shell into Container

```bash
docker-compose exec embedding-service bash
```

### Check Environment Variables

```bash
docker-compose exec embedding-service env | grep SUPABASE
```

### Check Python Dependencies

```bash
docker-compose exec embedding-service pip list
```

### Check Model Cache

```bash
docker-compose exec embedding-service ls -la ~/.cache/torch/sentence_transformers/
```

---

## Common Issues

### Issue: Build Fails with Dependency Errors

**Solution:**
```bash
# Clear Docker cache
docker builder prune -a

# Rebuild without cache
docker build --no-cache -t collabryx-embedding-service .
```

### Issue: Container Exits Immediately

**Solution:**
```bash
# Check logs
docker-compose logs embedding-service

# Look for errors in startup
```

### Issue: Health Check Fails

**Solution:**
```bash
# Wait 60 seconds for model to load
Start-Sleep -Seconds 60

# Check again
curl http://localhost:8000/health
```

### Issue: Port 8000 Already in Use

**Solution:**
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill process
taskkill /PID <PID> /F

# Or change port in docker-compose.yml
ports:
  - "8001:8000"  # Use port 8001 instead
```

---

## Performance Optimization

### Monitor Resource Usage

```bash
# Docker stats
docker stats python-worker-embedding-service-1
```

### Adjust Worker Count

Edit `docker-compose.yml`:

```yaml
command: uvicorn main:app --host 0.0.0.0 --port 8000 --workers 4
```

### Adjust Queue Size

Edit `main.py`:

```python
MAX_QUEUE_SIZE = 200  # Increase from 100
MAX_CONCURRENT_PROCESSING = 10  # Increase from 5
```

---

## Clean Up

### Remove Containers

```bash
docker-compose down -v
```

### Remove Images

```bash
docker rmi collabryx-embedding-service
```

### Remove All Docker Resources

```bash
# WARNING: This removes all unused Docker resources
docker system prune -a --volumes
```

---

## Next Steps

- [Production Guide](./production.md) - Deploy to Render or Railway
- [Main README](./README.md) - Overview and API reference
