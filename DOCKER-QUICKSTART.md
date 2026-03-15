# 🐳 Docker Scripts - Quick Start

## ⚡ One-Liner Commands

```bash
# Start the service (auto-builds + health check)
npm run docker:up

# Stop the service
npm run docker:down

# View live logs
npm run docker:logs

# Check if healthy
npm run docker:health

# Full status report
npm run docker:status
```

## 🔄 Common Workflows

### Daily Development
```bash
# Morning: Start service
npm run docker:up

# Check it's working
npm run docker:health

# Evening: Stop service
npm run docker:down
```

### Troubleshooting
```bash
# 1. Check status
npm run docker:status

# 2. View logs
npm run docker:logs

# 3. Restart if needed
npm run docker:restart

# 4. Rebuild from scratch
npm run docker:rebuild
```

### Monitoring
```bash
# Terminal 1: Stream logs
npm run docker:logs

# Terminal 2: Monitor health
npm run docker:health:monitor
```

## 🎯 What Each Script Does

### `npm run docker:up`
1. ✅ Checks Docker is installed and running
2. 📦 Builds image if not found (auto-build)
3. 🚀 Starts container
4. 🏥 Waits for health check (up to 2 min)
5. 📊 Shows success status with endpoint info

### `npm run docker:down`
1. 🛑 Stops all containers gracefully
2. 🧹 Removes containers
3. 🌐 Cleans up networks
4. 📊 Shows cleanup summary

### `npm run docker:logs`
1. 📋 Streams real-time logs
2. 🔍 Filterable by service
3. ⏱️ Optional timestamps
4. 📝 Configurable tail size

### `npm run docker:health`
1. 🏥 Checks HTTP health endpoint
2. ✅ Validates response (200 OK)
3. 📊 Shows detailed service info
4. 🔄 Optional continuous monitoring

### `npm run docker:status`
1. 📦 Container status
2. 🖼️ Image information
3. 💾 Resource usage (CPU, memory, network)
4. 🔌 Port availability check
5. 🌐 Network configuration
6. 📁 Volume mounts
7. 🏥 Health endpoint status

## 🚨 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Docker not running" | Start Docker Desktop |
| "Health check failed" | Run `npm run docker:logs` to see errors |
| "Port 8000 in use" | Stop other services using port 8000 |
| "Container keeps crashing" | Check logs: `npm run docker:logs -- -t` |
| "Build fails" | Run `npm run docker:rebuild` |

## 📋 Full Command List

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start with auto-build + health check |
| `npm run docker:down` | Stop gracefully |
| `npm run docker:down:clean` | Stop + deep cleanup |
| `npm run docker:restart` | Restart (down → up) |
| `npm run docker:rebuild` | Force rebuild + restart |
| `npm run docker:logs` | Stream logs (live) |
| `npm run docker:logs:recent` | Last 50 lines |
| `npm run docker:health` | One-time health check |
| `npm run docker:health:monitor` | Continuous monitoring |
| `npm run docker:status` | Full status report |

## 💡 Pro Tips

1. **Always use npm scripts** - They handle everything automatically
2. **Check health after startup** - Scripts do this for you
3. **Use logs for debugging** - `npm run docker:logs -t`
4. **Monitor during development** - `npm run docker:health:monitor`
5. **Clean up weekly** - `npm run docker:down:clean`

## 🔗 Full Documentation

See [docs/05-deployment/docker-scripts.md](./docs/05-deployment/docker-scripts.md) for complete guide.

---

**Quick Reference Card - Save this for daily use!**
