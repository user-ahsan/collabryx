# 🐳 Docker Management Scripts

Fully automated Docker container management for the Python Worker Embedding Service.

## 📋 Available Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start container (auto-builds if image missing) |
| `npm run docker:down` | Stop container gracefully |
| `npm run docker:down:clean` | Stop + cleanup orphaned containers/networks |
| `npm run docker:restart` | Restart container (down + up) |
| `npm run docker:rebuild` | Force rebuild image + restart |

### Monitoring Commands

| Command | Description |
|---------|-------------|
| `npm run docker:logs` | Stream real-time logs |
| `npm run docker:logs:recent` | Show last 50 log lines |
| `npm run docker:health` | One-time health check |
| `npm run docker:health:monitor` | Continuous health monitoring |
| `npm run docker:status` | Comprehensive status report |

## 🚀 Usage Examples

### Starting the Service

```bash
# Start with auto-build and health check
npm run docker:up
```

**What happens:**
1. ✅ Checks Docker availability
2. 📦 Builds image if not found
3. 🚀 Starts container
4. 🏥 Waits for health check to pass
5. 📊 Shows success status

### Viewing Logs

```bash
# Real-time streaming
npm run docker:logs

# Show recent logs only
npm run docker:logs:recent

# With timestamps
npm run docker:logs -- --timestamps

# Follow last 200 lines
npm run docker:logs -- --tail 200
```

### Health Monitoring

```bash
# One-time check
npm run docker:health

# Continuous monitoring
npm run docker:health:monitor
```

**Health check returns:**
```json
{
  "status": "healthy",
  "model_info": {
    "model_name": "all-MiniLM-L6-v2",
    "dimensions": 384,
    "device": "cpu"
  },
  "supabase_connected": true,
  "queue_size": 0,
  "queue_capacity": 100
}
```

### Status Check

```bash
# Full status report
npm run docker:status
```

**Shows:**
- Container status (running/stopped)
- Image info (size, created date)
- Resource usage (CPU, memory, network)
- Port availability
- Network configuration
- Volume mounts
- Health endpoint status

### Stopping the Service

```bash
# Graceful shutdown
npm run docker:down

# Deep cleanup (removes orphans)
npm run docker:down:clean
```

## 🔧 Advanced Options

### Docker Logs Options

```bash
# Follow mode (default)
npm run docker:logs -- -f

# Show timestamps
npm run docker:logs -- -t

# Last N lines
npm run docker:logs -- --tail 100

# Specific service
npm run docker:logs -- --service embedding-service

# Combine options
npm run docker:logs -- -f -t --tail 200
```

### Health Check Options

```bash
# Continuous monitoring with interval
npm run docker:health:monitor

# Output: Shows success rate over time
12:34:56 ✅ Health check #1 (Success: 1/1)
12:35:00 ✅ Health check #2 (Success: 2/2)
12:35:03 ✅ Health check #3 (Success: 3/3)
```

### Cleanup Options

```bash
# Standard cleanup
npm run docker:down

# Deep cleanup (removes orphans and unused networks)
npm run docker:down:clean

# Rebuild from scratch
npm run docker:rebuild
```

## 🎯 Script Features

### docker-up.js

- ✅ Auto-detects Docker availability
- ✅ Builds image if not present
- ✅ Starts container with proper configuration
- ✅ Waits for health check (2min timeout)
- ✅ Shows clear progress messages
- ✅ Provides next-step instructions

### docker-down.js

- ✅ Graceful container shutdown
- ✅ Optional deep cleanup (`--clean`)
- ✅ Removes orphaned containers
- ✅ Removes unused networks
- ✅ Shows disk usage summary

### docker-logs.js

- ✅ Real-time log streaming
- ✅ Filter by service name
- ✅ Configurable tail size
- ✅ Timestamp display option
- ✅ Recent logs summary mode

### docker-health.js

- ✅ HTTP health endpoint validation
- ✅ JSON response parsing
- ✅ Detailed service info display
- ✅ Continuous monitoring mode
- ✅ Success rate tracking

### docker-status.js

- ✅ Container status check
- ✅ Image information
- ✅ Resource usage (CPU, memory, network)
- ✅ Port availability check
- ✅ Network configuration
- ✅ Volume information
- ✅ Health endpoint status

## 🛠️ Troubleshooting

### Docker Not Running

```bash
# Error: Docker daemon is not running
# Solution: Start Docker Desktop
```

### Image Build Fails

```bash
# Check Docker logs
npm run docker:logs

# Rebuild from scratch
npm run docker:rebuild

# Check disk space
docker system df
```

### Health Check Fails

```bash
# Check container status
npm run docker:status

# View recent logs
npm run docker:logs:recent

# Restart service
npm run docker:restart
```

### Port Already in Use

```bash
# Check what's using port 8000
netstat -ano | findstr :8000

# Stop other services or change port in docker-compose.yml
```

### Container Keeps Crashing

```bash
# View logs with timestamps
npm run docker:logs -- --timestamps

# Check environment variables
# Ensure .env file exists in python-worker/ directory
```

## 📊 Monitoring Dashboard

For comprehensive monitoring, use these commands together:

```bash
# Terminal 1: Stream logs
npm run docker:logs

# Terminal 2: Monitor health
npm run docker:health:monitor

# Terminal 3: Check status periodically
npm run docker:status
```

## 🔐 Environment Variables

Required environment variables (set in `python-worker/.env`):

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.com
```

## 📝 Configuration

Edit `python-worker/docker-compose.yml` to customize:

- Port mapping (default: 8000)
- Resource limits (default: 2 CPU, 2GB memory)
- Health check intervals
- Volume mounts
- Network configuration

## 🎓 Best Practices

1. **Always use npm scripts** - Don't run docker-compose directly
2. **Check health after startup** - Scripts do this automatically
3. **Use clean shutdown** - `npm run docker:down` instead of `docker kill`
4. **Monitor regularly** - Use `docker:health:monitor` during development
5. **Clean up periodically** - `npm run docker:down:clean` weekly

## 🆘 Quick Reference

```bash
# Start service
npm run docker:up

# Stop service
npm run docker:down

# View logs
npm run docker:logs

# Check health
npm run docker:health

# Full status
npm run docker:status

# Restart
npm run docker:restart

# Rebuild
npm run docker:rebuild
```

## 📚 Related Documentation

- [Python Worker Deployment](./docs/05-deployment/python-worker.md)
- [Embedding System](./docs/04-infrastructure/database/embeddings.md)
- [Infrastructure Overview](./docs/04-infrastructure/overview.md)

---

**Last Updated:** 2026-03-15  
**Version:** 2.0.0 (Fully automated scripts)
