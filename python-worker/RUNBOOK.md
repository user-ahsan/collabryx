# Collabryx Python Worker - Alert Runbook

Quick reference guide for responding to monitoring alerts.

---

## Service Down

**Alert:** `EmbeddingServiceDown`  
**Severity:** Critical  
**Trigger:** Service unreachable for 1 minute

### Symptoms
- Health check endpoint returns 503 or times out
- Prometheus `up` metric = 0
- Users cannot generate embeddings

### Investigation Steps

```bash
# 1. Check container status
docker ps -a | grep python-worker

# 2. Check container logs
docker logs python-worker-embedding-service-1 --tail 100

# 3. Check if port is listening
netstat -tlnp | grep 8000

# 4. Try to curl health endpoint
curl http://localhost:8000/health
```

### Resolution

```bash
# Restart service
docker-compose restart

# If container crashed, check logs for OOM
docker inspect python-worker-embedding-service-1 | grep -i oom

# If OOM killed, increase memory limit in docker-compose.yml
# Then restart:
docker-compose up -d
```

### Escalation
If service won't start after restart → Escalate to platform team

---

## High Queue Depth

**Alert:** `EmbeddingQueueHighDepth`  
**Severity:** Warning  
**Trigger:** Queue size > 80 items for 5 minutes

### Symptoms
- Queue size gauge shows >80 items
- Processing speed < request rate
- Users report slow profile updates

### Investigation Steps

```bash
# 1. Check current queue size
curl -s http://localhost:8000/health | jq '.queue_size'

# 2. Check processing speed
curl http://localhost:8000/metrics | grep embedding_service_processing_speed

# 3. Check error rate
curl http://localhost:8000/metrics | grep embedding_service_errors_total

# 4. Check recent logs for errors
docker logs python-worker-embedding-service-1 --tail 50 | grep ERROR
```

### Resolution

```bash
# 1. Check if processor is running (should see "Queue processor loop started" in logs)
docker logs python-worker-embedding-service-1 | grep "Queue processor"

# 2. Check Supabase connectivity
docker logs python-worker-embedding-service-1 | grep "Supabase"

# 3. If processor stuck, restart service
docker-compose restart

# 4. If queue continues growing, scale horizontally
docker-compose up -d --scale embedding-service=2
```

### Prevention
- Monitor queue depth trends in Grafana
- Set up auto-scaling based on queue size
- Review embedding generation performance weekly

---

## Queue at Capacity

**Alert:** `EmbeddingQueueNearCapacity`  
**Severity:** Critical  
**Trigger:** Queue size > 95 items for 2 minutes

### Symptoms
- New requests rejected with 503 Service Unavailable
- Queue size = 100 (MAX_QUEUE_SIZE)
- Users cannot submit embedding requests

### Investigation Steps

```bash
# 1. Confirm queue is full
curl -s http://localhost:8000/health | jq '.queue_size'

# 2. Check error logs for "Queue full" or "503"
docker logs python-worker-embedding-service-1 --tail 100 | grep -i "capacity\|full\|503"

# 3. Check if processor is stuck
docker logs python-worker-embedding-service-1 | grep -i "processor.*error"
```

### Resolution

```bash
# 1. IMMEDIATE: Restart service to clear stuck queue
docker-compose restart

# 2. Check if queue drains after restart
watch -n 2 'curl -s http://localhost:8000/health | jq .queue_size'

# 3. If queue fills again, check for processing bottleneck
#    - Supabase connection issues
#    - Model loading problems
#    - Memory pressure

# 4. Scale service if under heavy load
docker-compose up -d --scale embedding-service=3
```

### Post-Incident
- Review request patterns that led to queue buildup
- Consider increasing MAX_QUEUE_SIZE if legitimate traffic spike
- Add capacity planning ticket

---

## DLQ Size High

**Alert:** `EmbeddingDLQSizeHigh`  
**Severity:** Warning  
**Trigger:** DLQ size > 10 items for 10 minutes

### Symptoms
- Dead letter queue growing
- Embeddings failing and being queued for retry
- Match quality may degrade

### Investigation Steps

```bash
# 1. Check DLQ size
curl -s http://localhost:8000/health | jq '.dlq_size'

# 2. Query Supabase for DLQ items
# Run in Supabase SQL Editor:
# SELECT failure_reason, COUNT(*) 
# FROM embedding_dead_letter_queue 
# WHERE status = 'pending' 
# GROUP BY failure_reason;

# 3. Check logs for DLQ storage events
docker logs python-worker-embedding-service-1 | grep "DLQ\|dead letter"

# 4. Check for common failure patterns
docker logs python-worker-embedding-service-1 | grep "Embedding generation failed"
```

### Resolution

```bash
# 1. Identify root cause from failure reasons
# Common causes:
# - Supabase connection timeout
# - Model not loaded
# - Invalid input data

# 2. Fix underlying issue (e.g., restart if model unloaded)
docker-compose restart

# 3. Monitor DLQ draining
watch -n 5 'curl -s http://localhost:8000/metrics | grep embedding_service_dlq_size'

# 4. If DLQ not draining, check DLQ processor
docker logs python-worker-embedding-service-1 | grep "DLQ processor"
```

### Manual DLQ Recovery

```sql
-- Check exhausted items (retry_count >= 3)
SELECT user_id, failure_reason, created_at
FROM embedding_dead_letter_queue
WHERE status = 'exhausted'
ORDER BY created_at DESC
LIMIT 100;

-- Manually retry specific user (reset status)
UPDATE embedding_dead_letter_queue
SET status = 'pending', retry_count = 0, next_retry = NOW()
WHERE user_id = '<user_id>' AND status = 'exhausted';
```

---

## High Error Rate

**Alert:** `EmbeddingHighErrorRate`  
**Severity:** Warning  
**Trigger:** Error rate > 5% for 5 minutes

### Symptoms
- Increased 5xx responses
- Users report embedding failures
- Error counter metrics increasing

### Investigation Steps

```bash
# 1. Check error rate
curl http://localhost:8000/metrics | grep embedding_service_errors_total

# 2. Identify error types
curl http://localhost:8000/metrics | grep embedding_service_errors_total | grep -v "^#"

# 3. Check recent error logs
docker logs python-worker-embedding-service-1 --tail 100 | grep ERROR

# 4. Check for specific error patterns
docker logs python-worker-embedding-service-1 | grep -E "TimeoutError|ConnectionError|HTTPException"
```

### Resolution

```bash
# 1. Identify error type from metrics/logs

# 2. Common fixes by error type:
# - TimeoutError: Check Supabase connectivity, increase timeouts
# - ConnectionError: Restart service, check network
# - HTTPException: Check request validation, rate limiting
# - MemoryError: Increase memory limit, restart service

# 3. Restart if transient issue
docker-compose restart

# 4. If persistent, check recent deployments
git log --oneline -10
```

---

## High Memory Usage

**Alert:** `EmbeddingHighMemoryUsage`  
**Severity:** Warning  
**Trigger:** Process RSS > 1.5GB for 5 minutes

### Symptoms
- Memory usage gauge increasing
- Potential OOM risk
- Service may become slow

### Investigation Steps

```bash
# 1. Check current memory usage
curl -s http://localhost:8000/health | jq '.system.process_memory'

# 2. Check memory metrics
curl http://localhost:8000/metrics | grep embedding_service_memory_usage_bytes

# 3. Check for memory leaks in logs
docker logs python-worker-embedding-service-1 | grep -i "memory\|leak"

# 4. Monitor memory trend
watch -n 5 'curl -s http://localhost:8000/metrics | grep embedding_service_memory_usage_bytes{type="process_rss"}'
```

### Resolution

```bash
# 1. IMMEDIATE if near 1.8GB: Restart service
docker-compose restart

# 2. Check docker memory limit
docker inspect python-worker-embedding-service-1 | grep -i memory

# 3. If limit too low, update docker-compose.yml:
# services:
#   embedding-service:
#     deploy:
#       resources:
#         limits:
#           memory: 2G

# 4. Restart with new limits
docker-compose up -d
```

### Long-term Fix
- Profile memory usage with `memory_profiler`
- Check for unclosed connections or resources
- Optimize model loading (lazy load, shared instances)

---

## High Latency

**Alert:** `EmbeddingHighLatency`  
**Severity:** Warning  
**Trigger:** p95 latency > 2s for 5 minutes

### Symptoms
- Slow embedding generation
- Request timeouts
- Poor user experience

### Investigation Steps

```bash
# 1. Check latency metrics
curl http://localhost:8000/metrics | grep embedding_service_request_duration_seconds

# 2. Calculate p95 latency
# Use Prometheus query:
# histogram_quantile(0.95, rate(embedding_service_request_duration_seconds_bucket[5m]))

# 3. Check CPU usage
docker stats python-worker-embedding-service-1 --no-stream

# 4. Check if model is loaded correctly
curl http://localhost:8000/model-info
```

### Resolution

```bash
# 1. Check if model loading is causing delays
docker logs python-worker-embedding-service-1 | grep "Model loaded"

# 2. Check Supabase query performance
docker logs python-worker-embedding-service-1 | grep "Supabase.*slow"

# 3. Restart if model degraded
docker-compose restart

# 4. If persistent, check for resource contention
# - CPU throttling
# - Disk I/O
# - Network latency to Supabase
```

---

## Low Throughput

**Alert:** `EmbeddingLowThroughput`  
**Severity:** Warning  
**Trigger:** Processing speed < 10 embeddings/min for 15 minutes

### Symptoms
- Queue growing slowly or not draining
- Low embedding generation rate
- Backlog building up

### Investigation Steps

```bash
# 1. Check current processing speed
curl http://localhost:8000/metrics | grep embedding_service_processing_speed

# 2. Check queue drain rate
watch -n 10 'curl -s http://localhost:8000/health | jq .queue_size'

# 3. Check for processing bottlenecks
docker logs python-worker-embedding-service-1 | grep "Generating embedding"

# 4. Measure time per embedding
docker logs python-worker-embedding-service-1 | grep "processing_time_ms"
```

### Resolution

```bash
# 1. Check if semaphore limit is too low (default: 5 concurrent)
# Edit main.py: processing_semaphore = asyncio.Semaphore(5)
# Increase to 10 if CPU allows

# 2. Check CPU usage
docker stats python-worker-embedding-service-1 --no-stream

# 3. If CPU not saturated, increase concurrency
# Restart after config change

# 4. If CPU saturated, scale horizontally
docker-compose up -d --scale embedding-service=2
```

---

## Contact & Escalation

### On-Call Rotation
- **Primary:** Check PagerDuty schedule
- **Secondary:** Platform team lead

### Slack Channels
- `#monitoring-alerts` - Alert notifications
- `#platform-incidents` - Incident coordination
- `#embedding-service` - Service-specific discussion

### Escalation Path
1. **L1:** On-call engineer (first 30 minutes)
2. **L2:** Platform team lead (after 30 minutes)
3. **L3:** VP Engineering (critical, customer-impacting)

### Post-Incident
- Create incident report in `/docs/incidents/`
- Update runbook if new resolution discovered
- Schedule post-mortem for critical incidents

---

**Last Updated:** 2026-03-19  
**Version:** 1.0.0
