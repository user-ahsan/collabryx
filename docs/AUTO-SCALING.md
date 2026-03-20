# Auto-Scaling Configuration

**P1-31: Configure Auto-Scaling**

This document describes the auto-scaling configuration for Collabryx infrastructure.

## Overview

Collabryx implements auto-scaling across multiple layers:

1. **Vercel (Frontend/API)** - Automatic scaling based on demand
2. **Docker/Kubernetes (Python Worker)** - Configurable replica scaling
3. **Supabase (Database)** - Managed scaling

---

## Vercel Auto-Scaling

### Configuration

Vercel automatically scales based on traffic. Configuration is in `vercel.json`:

```json
{
  "functions": {
    "maxDuration": 60,
    "memory": 1024
  }
}
```

### Scaling Triggers

- **Request volume**: Automatic scaling based on concurrent requests
- **Geographic distribution**: Edge functions scale per region
- **Cold start mitigation**: Pre-warmed instances for critical paths

### Limits

| Plan | Max Duration | Memory | Concurrent Requests |
|------|-------------|---------|-------------------|
| Pro | 60s | 1024MB | Automatic |
| Enterprise | 900s | 3072MB | Custom |

### Monitoring

- Vercel Analytics dashboard
- Function execution metrics
- Cold start monitoring

---

## Docker Auto-Scaling

### Configuration

Docker Compose scaling configuration in `python-worker/docker-compose.scaling.yml`:

```yaml
services:
  embedding-worker:
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1.0'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### Scaling Commands

```bash
# Scale workers manually
docker-compose up -d --scale embedding-worker=5

# With scaling config
docker-compose -f docker-compose.scaling.yml up -d
```

### Resource Limits

| Resource | Limit | Reservation |
|----------|-------|-------------|
| CPU | 1.0 cores | 0.5 cores |
| Memory | 1GB | 512MB |

### Health Checks

```yaml
healthcheck:
  test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
  interval: 30s
  timeout: 5s
  retries: 3
  start_period: 40s
```

---

## Load Balancing

### Nginx Configuration

Load balancer configuration in `python-worker/nginx.conf`:

- **Algorithm**: Least connections
- **Health checks**: Automatic failover
- **Rate limiting**: 10 requests/second per IP
- **Connection limits**: 10 concurrent per IP

### Upstream Configuration

```nginx
upstream python_workers {
    least_conn;
    server embedding-worker-1:8000 weight=1 max_fails=3 fail_timeout=30s;
    server embedding-worker-2:8000 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
}
```

---

## Kubernetes (Production)

### HPA Configuration

For Kubernetes deployments, use Horizontal Pod Autoscaler:

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: worker-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: embedding-worker
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Scaling Triggers

- **CPU utilization**: Scale when > 70%
- **Memory utilization**: Scale when > 80%
- **Custom metrics**: Queue depth, request latency

---

## Render Auto-Scaling

### Configuration

Render.com scaling in `render.yaml`:

```yaml
services:
  - type: web
    name: collabryx-embedding-worker
    plan: standard
    autoDeploy: true
```

### Scaling Options

| Plan | Min Instances | Max Instances |
|------|--------------|---------------|
| Standard | 1 | 1 |
| Pro | 1 | 3 |

---

## Monitoring & Alerts

### Metrics to Monitor

1. **Request Rate**: Requests per second
2. **Latency**: P50, P95, P99 response times
3. **Error Rate**: 4xx and 5xx errors
4. **Resource Utilization**: CPU, memory, disk
5. **Queue Depth**: Pending requests/tasks

### Alert Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| CPU | 70% | 90% |
| Memory | 80% | 95% |
| Error Rate | 1% | 5% |
| Latency (P95) | 1s | 3s |

### Monitoring Tools

- **Vercel Analytics**: Frontend metrics
- **Supabase Dashboard**: Database metrics
- **Prometheus/Grafana**: Custom metrics
- **Sentry**: Error tracking

---

## Best Practices

### 1. Scale Proactively

- Monitor trends and scale before reaching limits
- Use scheduled scaling for predictable traffic patterns

### 2. Implement Circuit Breakers

- Prevent cascade failures
- Allow graceful degradation

### 3. Use Connection Pooling

- Reduce connection overhead
- Improve resource utilization

### 4. Enable Health Checks

- Automatic failure detection
- Quick recovery from issues

### 5. Test Scaling

- Regular load testing
- Validate scaling policies
- Document scaling behavior

---

## Troubleshooting

### Scaling Not Triggering

1. Check metrics are being collected
2. Verify threshold configurations
3. Review resource quotas
4. Check autoscaler logs

### Slow Scaling

1. Reduce scale-up cooldown period
2. Increase replica increment
3. Pre-warm instances during peak hours
4. Use predictive scaling

### Over-Scaling

1. Increase scale-down delay
2. Adjust threshold hysteresis
3. Set appropriate max replicas
4. Review metric aggregation period

---

## Cost Optimization

### Strategies

1. **Right-size instances**: Match resources to actual usage
2. **Use spot instances**: For non-critical workloads
3. **Schedule scaling**: Reduce during off-hours
4. **Monitor waste**: Identify underutilized resources

### Cost Monitoring

- Track cost per request
- Monitor idle resource costs
- Review scaling event frequency
- Analyze traffic patterns

---

## Related Documentation

- [Database Pooling](./DATABASE-POOLING.md)
- [Request Timeout](./REQUEST-TIMEOUT.md)
- [Log Rotation](./LOG-ROTATION.md)
- [Deployment](./DEPLOYMENT.md)

---

**Last Updated:** 2026-03-20  
**Status:** Production Ready ✅
