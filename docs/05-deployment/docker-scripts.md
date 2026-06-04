# 🐳 Docker Management Scripts

Fully automated Docker container management for the Python Worker Embedding Service.

## 📋 Available Commands

### Core Commands

| Command | Description |
|---------|-------------|
| `bun run docker:up` | Start container (auto-builds if image missing) |
| `bun run docker:down` | Stop container gracefully |
| `bun run docker:restart` | Restart container (down + up) |
| `bun run docker:rebuild` | Force rebuild image + restart |
| `bun run docker:clean` | Deep cleanup (removes orphans) |

### Monitoring Commands

| Command | Description |
|---------|-------------|
| `bun run docker:logs` | Stream real-time logs |
| `bun run docker:health` | One-time health check |
| `bun run docker:status` | Comprehensive status report |

## 🚀 Usage Examples

### Starting the Service

```bash
# Start with auto-build and health check
bun run docker:up
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
bun run docker:logs

# With timestamps
bun run docker:logs -- --timestamps

# Follow last 200 lines
bun run docker:logs -- --tail 200
```

### Health Monitoring

```bash
# One-time check
bun run docker:health
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
bun run docker:status
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
bun run docker:down

# Deep cleanup (removes orphans)
bun run docker:clean
```

## 🔧 Advanced Options

### Docker Logs Options

```bash
# Follow mode (default)
bun run docker:logs -- -f

# Show timestamps
bun run docker:logs -- -t

# Last N lines
bun run docker:logs -- --tail 100

# Specific service
bun run docker:logs -- --service embedding-service

# Combine options
bun run docker:logs -- -f -t --tail 200
```



### Cleanup Options

```bash
# Standard cleanup
bun run docker:down

# Deep cleanup (removes orphans and unused networks)
bun run docker:clean

# Rebuild from scratch
bun run docker:rebuild
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
bun run docker:logs

# Rebuild from scratch
bun run docker:rebuild

# Check disk space
docker system df
```

### Health Check Fails

```bash
# Check container status
bun run docker:status

# View recent logs
bun run docker:logs -- --tail 50

# Restart service
bun run docker:restart
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
bun run docker:logs -- --timestamps

# Check environment variables
# Ensure .env file exists in python-worker/ directory
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

1. **Always use bun scripts** - Don't run docker-compose directly
2. **Check health after startup** - Scripts do this automatically
3. **Use clean shutdown** - `bun run docker:down` instead of `docker kill`
4. **Monitor regularly** - Use `bun run docker:health` during development
5. **Clean up periodically** - `bun run docker:clean` weekly

## 🆘 Quick Reference

```bash
# Start service
bun run docker:up

# Stop service
bun run docker:down

# View logs
bun run docker:logs

# Check health
bun run docker:health

# Full status
bun run docker:status

# Restart
bun run docker:restart

# Rebuild
bun run docker:rebuild
```

## 📚 Related Documentation

- [Python Worker Deployment](../04-infrastructure/python-worker/deployment.md)
- [Embedding System](./docs/04-infrastructure/database/embeddings.md)
- [Infrastructure Overview](./docs/04-infrastructure/overview.md)

---

**Last Updated:** 2026-06-02  
**Version:** 2.0.0 (Fully automated scripts)
