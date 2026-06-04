# Monitoring Guide

Comprehensive monitoring strategy for Collabryx — covering frontend, backend, Python worker, database, and infrastructure.

**Last Updated:** 2026-06-05

---

## Table of Contents

- [Overview](#overview)
- [Frontend Monitoring](#frontend-monitoring)
- [Backend Monitoring](#backend-monitoring)
- [Python Worker Monitoring](#python-worker-monitoring)
- [Database Monitoring](#database-monitoring)
- [Infrastructure Monitoring](#infrastructure-monitoring)
- [Error Tracking](#error-tracking)
- [Alerting](#alerting)
- [Logging](#logging)
- [Performance Monitoring](#performance-monitoring)

---

## Overview

The Collabryx monitoring stack observes five key systems:

| System | Tech Stack | What We Monitor |
|---|---|---|
| **Frontend** | Next.js 16, React 19, Tailwind CSS v4 | Core Web Vitals, error boundaries, console errors |
| **Backend** | Next.js API routes, Server Actions | Route errors, action failures |
| **Python Worker** | FastAPI, Sentence Transformers | Health endpoint, embedding success rate |
| **Database** | PostgreSQL (Supabase) | Connection pool, slow queries, RLS performance |
| **Infrastructure** | Docker | Container health, resource usage |

### Monitoring Philosophy

- **Alert on symptoms, not causes** — a high error rate matters more than which line failed
- **Observability over debugging** — structured logs + metrics + traces > ad-hoc console.log
- **Fail-closed by default** — if monitoring is down, assume the worst

---

## Frontend Monitoring

### Core Web Vitals

Track via [web-vitals](https://github.com/GoogleChrome/web-vitals) library (already a dependency):

```typescript
// lib/utils/web-vitals.ts
'use client'

import { onLCP, onFID, onCLS, onFCP, onTTFB } from 'web-vitals'

export function reportWebVitals() {
  onLCP(metric => sendMetric('web-vitals', { name: 'LCP', value: metric.value }))
  onFID(metric => sendMetric('web-vitals', { name: 'FID', value: metric.value }))
  onCLS(metric => sendMetric('web-vitals', { name: 'CLS', value: metric.value }))
  onFCP(metric => sendMetric('web-vitals', { name: 'FCP', value: metric.value }))
  onTTFB(metric => sendMetric('web-vitals', { name: 'TTFB', value: metric.value }))
}
```

**Target thresholds:**

| Metric | Good | Needs Improvement | Poor |
|---|---|---|---|
| LCP | < 2.5s | 2.5s–4.0s | > 4.0s |
| FID / INP | < 100ms | 100ms–300ms | > 300ms |
| CLS | < 0.1 | 0.1–0.25 | > 0.25 |
| FCP | < 1.8s | 1.8s–3.0s | > 3.0s |
| TTFB | < 800ms | 800ms–1.8s | > 1.8s |

### React Error Boundaries

The project uses a class-based error boundary at `components/shared/error-boundary.tsx`:

```typescript
// Current pattern — logs to console
public componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
  console.error('ErrorBoundary caught an error:', error, errorInfo)
}
```

**Current gaps:**
- Only logs to `console.error` — not sent to any external service
- No error grouping by component
- No user context attached to errors

### Console Error Tracking

**Current approach:** `console.error` scattered across the codebase for:
- Supabase query failures
- Server Action errors
- Rate limit violations
- Python worker communication failures

**Recommended:**
- Replace direct `console.error` calls with a centralized `logger.error()` wrapper
- Instrument the `window.onerror` and `window.onunhandledrejection` handlers

```typescript
// lib/utils/logger.ts
export const logger = {
  error: (message: string, context?: Record<string, unknown>) => {
    console.error(JSON.stringify({ level: 'error', message, ...context, timestamp: new Date().toISOString() }))
    // Future: send to Sentry/Datadog
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    console.warn(JSON.stringify({ level: 'warn', message, ...context, timestamp: new Date().toISOString() }))
  },
  info: (message: string, context?: Record<string, unknown>) => {
    console.info(JSON.stringify({ level: 'info', message, ...context, timestamp: new Date().toISOString() }))
  },
}
```

---

## Backend Monitoring

### API Route Monitoring

Monitor API routes via custom instrumentation to wrap with timing middleware:

```typescript
// lib/utils/api-monitor.ts
export async function monitorRoute(
  handler: () => Promise<Response>,
  routeName: string
): Promise<Response> {
  const start = performance.now()
  try {
    const response = await handler()
    const duration = performance.now() - start
    logger.info(`API ${routeName} completed`, { duration, status: response.status })
    return response
  } catch (error) {
    const duration = performance.now() - start
    logger.error(`API ${routeName} failed`, { duration, error: String(error) })
    throw error
  }
}
```

### Server Action Error Tracking

Server Actions can fail silently if error boundaries aren't set. Wrap actions with tracking:

```typescript
// lib/utils/action-monitor.ts
export async function monitorAction<T>(
  actionName: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    const result = await fn()
    return result
  } catch (error) {
    logger.error(`Server Action "${actionName}" failed`, {
      error: error instanceof Error ? error.message : String(error),
      actionName,
    })
    throw error
  }
}
```

### Rate Limit Monitoring

The Python worker rate limiter returns `429 Too Many Requests`. Track rate limit events:

- Log rate limit hits per user
- Alert if any user exceeds the limit more than 5 times in an hour
- Monitor aggregate rate limit hit rate (should be < 1% of total requests)

---

## Python Worker Monitoring

The embedding service runs as a FastAPI application. It exposes a comprehensive health endpoint.

### Health Endpoint

`GET /health` — returns the following metrics:

```json
{
  "status": "healthy",
  "timestamp": 1717027200.0,
  "model_info": {
    "model_name": "sentence-transformers/all-MiniLM-L6-v2",
    "dimensions": 384,
    "device": "cpu"
  },
  "supabase_connected": true,
  "system": {
    "disk": {
      "percent": 45.2,
      "free_gb": 12.5,
      "total_gb": 50.0,
      "used_gb": 22.5
    }
  }
}
```

**Status values:**
- `healthy` — all systems operational
- `degraded` — Supabase connection failed (core feature may still work)
- `warning` — disk usage > 85%

### Embedding Generation Success Rate

The worker has three critical paths:

| Path | Success Indicator | Failure Handling |
|---|---|---|
| **Direct generation** (`/generate-embedding`) | Returns `status: "queued"` | DLQ on timeout/error |
| **Profile generation** (`/generate-embedding-from-profile`) | Returns `status: "queued"` | DLQ on timeout/error |
| **Pending queue** (background processor) | Completes `embedding_pending_queue` items | DLQ with 3 retries |

**Success rate targets:**
- First-attempt success: > 95%
- After DLQ retry: > 99%
- Exhausted (failed after 3 retries): < 0.5%

### Model Loading Status

The Sentence Transformers model loads at first request. Monitor:

- **Model load time** — should be < 10s on first request
- **Inference time** — per-embedding generation should take < 2s
- **30-second timeout** — generation is wrapped in `asyncio.wait_for(fn, timeout=30.0)`

### Dead Letter Queue (DLQ) Monitoring

The DLQ table (`embedding_dead_letter_queue`) stores failed embeddings for retry:

| Column | Description |
|---|---|
| `status` | `pending` / `processing` / `completed` / `exhausted` |
| `retry_count` | 0–3, incremented per attempt |
| `failure_reason` | Error message from failure |
| `next_retry` | When the item is eligible for retry |

**DLQ health metrics:**
- Count of items with `status = "exhausted"` — requires manual intervention
- Average retry count across all items
- Age of oldest unprocessed item

---

## Database Monitoring

### Supabase Dashboard

Supabase provides a built-in dashboard with:

- **Query performance** — slow query log
- **Connection pool** — active/idle connections
- **Storage** — database size, table sizes
- **API requests** — request volume, error rate

### Connection Pool Usage

Supabase manages connection pooling automatically. Monitor:

- **Active connections** — should be < 80% of pool limit
- **Idle in transaction** — queries left open can exhaust the pool
- **Connection errors** — "too many clients" errors indicate pool saturation

### Slow Query Identification

Use `pg_stat_statements` to find slow queries:

```sql
-- Top 10 slowest queries by mean execution time
SELECT
  query,
  mean_exec_time,
  calls,
  rows,
  shared_blks_hit::float / (shared_blks_hit + shared_blks_read + 1) AS cache_hit_ratio
FROM pg_stat_statements
WHERE query NOT LIKE '%pg_%'
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Common slow query patterns in Collabryx:**
- Text search across `posts.content` without a GIN index
- `ORDER BY ... LIMIT 1` without proper index on the sort column
- N+1 queries from Supabase REST API calls in loops

### RLS Policy Performance

Row-Level Security policies can add overhead. Monitor:

- **Policy evaluation time** — each RLS check adds latency
- **Recursive policy calls** — policies referencing other tables can cascade
- **Index utilization** — RLS filters should use indexed columns

```sql
-- Check if RLS queries are using indexes
EXPLAIN ANALYZE
SELECT * FROM profiles
WHERE id = 'some-user-id';
-- Look for "Index Scan" not "Seq Scan"
```

---

## Infrastructure Monitoring

### Python Worker Health

The Python worker runs locally or via Docker. Key metrics:

- **Response time** — health endpoint should respond in < 500ms
- **Memory usage** — model loading can spike memory; ensure < 80% of available
- **CPU usage** — sustained > 90% indicates under-provisioning

### Docker Container Metrics

If running the Python worker in Docker:

```bash
# Check container health
docker ps --filter "name=embedding-service"
docker stats embedding-service --no-stream

# View logs
docker logs embedding-service --tail 100
```

**Resource limits (recommended):**
| Resource | Minimum | Recommended |
|---|---|---|
| CPU | 1 core | 2 cores |
| Memory | 1 GB | 2 GB |
| Disk | 5 GB | 10 GB |

### Uptime Monitoring

Use an external uptime checker (e.g., UptimeRobot, Better Uptime):

| Endpoint | Frequency | Expected Status |
|---|---|---|
| `https://collabryx.com` | 1 min | 200 |
| `https://collabryx.com/api/health` | 1 min | 200 |

---

## Error Tracking

### Current Error Boundary Pattern

The project has a working `ErrorBoundary` component at `components/shared/error-boundary.tsx`:

```
'use client'

class ErrorBoundaryClass extends Component<Props, State> {
  public componentDidCatch(error: Error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }
}
```

**Limitations:**
- Console-only — no aggregation, no alerting
- No user identification attached
- No breadcrumbs or context

---

## Alerting

### Alert Rules

| Alert | Condition | Severity | Response |
|---|---|---|---|
| **API error rate > 3%** | > 3% of API responses are 5xx in 5 min window | High | Check application, Supabase |
| **Supabase connection failure** | Health check fails 3 consecutive times | Critical | Check Supabase status |
| **Slow queries > 5s** | Any query takes > 5s to execute | Medium | Optimize with DBA review |
| **Service downtime** | External uptime check fails > 2 min | Critical | Incident response |
| **Disk usage > 85%** | Worker `/health` reports warning | Medium | Clean up logs, scale storage |
| **DLQ exhausted items > 5** | More than 5 items with retry_count = 3 | Medium | Manual review needed |

### Alert Channels

Currently, alerts are output to console and application logs. For production deployment, configure external notification channels (e.g., Slack, email) as needed.

### Runbook Links

Each alert should link to a runbook:

- [Embedding Worker Runbook](./python-worker/deployment.md)
- [Database Recovery Runbook](./database/setup-guide.md)
- [Deployment Rollback Runbook](../05-deployment/runbook.md)

---

## Logging

### Current State

The codebase uses a mix of logging patterns:

**Python worker** — structured JSON logging (good):

```python
logging.basicConfig(
    level=logging.INFO,
    format='{"timestamp": "%(asctime)s", "level": "%(levelname)s", "logger": "%(name)s", "message": "%(message)s"}',
)
```

**Frontend/Backend** — ad-hoc `console.log` and `console.error` scattered across files (needs improvement):

```typescript
// ❌ Current — unstructured, no context
console.error('Failed to generate embedding:', error)

// ✅ Future — structured, machine-parseable
logger.error('Embedding generation failed', {
  userId,
  error: error.message,
  queueDepth,
})
```

### Structured Logging Approach

Adopt a consistent structured logging pattern across all layers:

```typescript
// lib/utils/logger.ts
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogEntry {
  level: LogLevel
  message: string
  timestamp: string
  service: string
  requestId?: string
  userId?: string
  duration?: number
  [key: string]: unknown
}

class Logger {
  private service: string

  constructor(service: string) {
    this.service = service
  }

  info(message: string, context?: Record<string, unknown>) {
    this.log('info', message, context)
  }

  error(message: string, context?: Record<string, unknown>) {
    this.log('error', message, context)
  }

  private log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      service: this.service,
      ...context,
    }
    
    // Always output to console
    if (level === 'error') {
      console.error(JSON.stringify(entry))
    } else {
      console.log(JSON.stringify(entry))
    }
  }
}

export const logger = new Logger('collabryx')
```

### Log Aggregation

**Currently:** Logs are visible through:

- **Application logs** — frontend and API route logs
- **`docker logs`** — if running locally

**Recommended next step:** Use a log aggregation service:

| Service | Pros | Cons |
|---|---|---|
| **Axiom** | Generous free tier, Vercel integration | Newer product |
| **Logtail** (Better Stack) | Great UX, affordable | Limited retention on free tier |
| **Grafana Loki** | Open-source, self-hosted | Requires infra to run |

### Python Worker Log Levels

The worker uses standard Python logging levels consistently:

| Level | Usage | Example |
|---|---|---|
| `CRITICAL` | System down, manual intervention needed | DLQ storage failed |
| `ERROR` | Operation failed, retry possible | Embedding generation timeout |
| `WARNING` | Degraded but functional | High disk usage, queue drain timeout |
| `INFO` | Normal operations | Embedding generated successfully |
| `DEBUG` | Detailed troubleshooting | DLQ atomic claim skipped by another worker |

---

## Performance Monitoring

### API Response Time Monitoring

Track response times for critical API endpoints:

| Endpoint | Target (p95) | Alert Threshold |
|---|---|---|
| `POST /generate-embedding` | < 500ms | > 1s |
| `POST /generate-embedding-from-profile` | < 500ms | > 1s |
| Server Action: `createPost` | < 300ms | > 1s |
| Server Action: `getMatches` | < 500ms | > 2s |
| Supabase query: profile fetch | < 100ms | > 500ms |

### Database Query Performance

Monitor via Supabase's query performance dashboard:

```sql
-- Long-running queries (running > 1 second)
SELECT
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query
FROM pg_stat_activity
WHERE state = 'active'
  AND now() - pg_stat_activity.query_start > interval '1 second'
ORDER BY duration DESC;

-- Cache hit ratio (should be > 99%)
SELECT
  'index hit rate' AS name,
  (sum(idx_blks_hit)) / (sum(idx_blks_hit + idx_blks_read) + 1) AS ratio
FROM pg_statio_user_indexes
UNION ALL
SELECT
  'table hit rate',
  (sum(heap_blks_hit)) / (sum(heap_blks_hit + heap_blks_read) + 1)
FROM pg_statio_user_tables;
```

### Performance Budget

| Metric | Budget | Measured By |
|---|---|---|
| LCP | < 2.5s | Web Vitals |
| TTFB | < 800ms | Application logs |
| API p95 response | < 1s | Application logs |
| Embedding generation | < 5s | Worker logs |
| Database query p95 | < 200ms | pg_stat_statements |

---

## Monitoring Checklist

### Pre-Launch

- [ ] Core Web Vitals reporting initialized
- [ ] Python worker `/health` endpoint accessible externally
- [ ] Uptime monitor configured for all services
- [ ] Log aggregation service connected
- [ ] Performance budgets documented and shared

### Ongoing

- [ ] Review DLQ exhausted items weekly
- [ ] Rotate alert on-call schedule
- [ ] Update runbooks after each incident
- [ ] Review slow query log monthly

---

**Related Docs:**

- [Performance Optimization Guide](./performance.md) — bundle, caching, and rendering optimization
- [Python Worker Overview](./python-worker/overview.md) — embedding service architecture
- [Database Schema](./database/schema.md) — table reference with index details
- [Deployment Runbook](../05-deployment/runbook.md) — incident response procedures
