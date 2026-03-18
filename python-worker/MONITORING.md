# Collabryx Python Worker - Monitoring Guide

Complete monitoring and alerting configuration for the Collabryx Embedding Service.

## Table of Contents

- [Health Check Endpoints](#health-check-endpoints)
- [Prometheus Metrics](#prometheus-metrics)
- [Alerting Rules](#alerting-rules)
- [Grafana Dashboard](#grafana-dashboard)
- [Log Aggregation](#log-aggregation)

---

## Health Check Endpoints

### `/health` - Comprehensive Health Check

**Endpoint:** `GET /health`

**Purpose:** Overall service health status with system metrics

**Response:**
```json
{
  "status": "healthy",
  "timestamp": 1710864000,
  "model_info": {
    "model_name": "sentence-transformers/all-MiniLM-L6-v2",
    "dimensions": 384,
    "device": "cpu"
  },
  "supabase_connected": true,
  "queue_size": 5,
  "queue_capacity": 100,
  "system": {
    "memory": {
      "percent": 45.2,
      "available_mb": 8192.5,
      "total_mb": 16384.0,
      "used_mb": 8191.5
    },
    "process_memory": {
      "rss_mb": 512.25,
      "vms_mb": 1024.5
    },
    "disk": {
      "percent": 62.1,
      "free_gb": 150.5,
      "total_gb": 400.0,
      "used_gb": 249.5
    }
  }
}
```

**Status Values:**
- `healthy` - All systems operational
- `degraded` - Non-critical system failing (e.g., Supabase disconnected)
- `warning` - Resource thresholds exceeded (>90% memory, >85% disk)

**Usage:**
```bash
# Quick health check
curl http://localhost:8000/health

# Check only status
curl -s http://localhost:8000/health | jq -r '.status'
```

---

### `/metrics` - Prometheus Metrics

**Endpoint:** `GET /metrics`

**Purpose:** Prometheus exposition format metrics for scraping

**Content-Type:** `text/plain; version=0.0.4; charset=utf-8`

**Usage:**
```bash
# View raw metrics
curl http://localhost:8000/metrics

# Scrape with Prometheus
# Add to prometheus.yml:
# - job_name: 'embedding-service'
#   static_configs:
#     - targets: ['localhost:8000']
```

---

### `/` - Root Endpoint

**Endpoint:** `GET /`

**Purpose:** Basic service info and queue status

**Response:**
```json
{
  "message": "Collabryx Embedding Service",
  "model_info": {
    "model_name": "sentence-transformers/all-MiniLM-L6-v2",
    "dimensions": 384,
    "device": "cpu"
  },
  "queue_size": 5
}
```

---

## Prometheus Metrics

### Request Metrics

#### `embedding_service_requests_total` (Counter)

Total number of HTTP requests processed.

**Labels:**
- `method` - HTTP method (GET, POST, etc.)
- `endpoint` - Request path
- `status_code` - HTTP status code

**Example:**
```prometheus
embedding_service_requests_total{method="POST",endpoint="/generate-embedding",status_code="200"} 1542
embedding_service_requests_total{method="GET",endpoint="/health",status_code="200"} 8921
```

**Query Examples:**
```prometheus
# Requests per minute
rate(embedding_service_requests_total[1m]) * 60

# Error rate (5xx responses)
sum(rate(embedding_service_requests_total{status_code=~"5.."}[5m])) 
/ 
sum(rate(embedding_service_requests_total[5m]))
```

---

#### `embedding_service_request_duration_seconds` (Histogram)

Request duration in seconds with predefined buckets.

**Labels:**
- `method` - HTTP method
- `endpoint` - Request path

**Buckets:** 0.001s, 0.005s, 0.01s, 0.025s, 0.05s, 0.1s, 0.25s, 0.5s, 1.0s, 2.5s, 5.0s, 10.0s

**Example:**
```prometheus
embedding_service_request_duration_seconds_bucket{method="POST",endpoint="/generate-embedding",le="0.1"} 1200
embedding_service_request_duration_seconds_bucket{method="POST",endpoint="/generate-embedding",le="0.5"} 1450
embedding_service_request_duration_seconds_sum{method="POST",endpoint="/generate-embedding"} 245.67
embedding_service_request_duration_seconds_count{method="POST",endpoint="/generate-embedding"} 1542
```

**Query Examples:**
```prometheus
# Average request latency
rate(embedding_service_request_duration_seconds_sum[5m]) 
/ 
rate(embedding_service_request_duration_seconds_count[5m])

# 95th percentile latency
histogram_quantile(0.95, 
  rate(embedding_service_request_duration_seconds_bucket[5m])
)
```

---

#### `embedding_service_errors_total` (Counter)

Total number of errors by error type.

**Labels:**
- `error_type` - Exception class name
- `endpoint` - Request path where error occurred

**Example:**
```prometheus
embedding_service_errors_total{error_type="HTTPException",endpoint="/generate-embedding"} 23
embedding_service_errors_total{error_type="TimeoutError",endpoint="/api/matches/generate"} 5
```

**Query Examples:**
```prometheus
# Errors per minute
rate(embedding_service_errors_total[1m]) * 60

# Error rate by type
sum by (error_type) (rate(embedding_service_errors_total[1h]))
```

---

### Queue Metrics

#### `embedding_service_queue_size` (Gauge)

Current number of items waiting in the processing queue.

**Range:** 0-100 (MAX_QUEUE_SIZE)

**Example:**
```prometheus
embedding_service_queue_size 12
```

**Query Examples:**
```prometheus
# Queue depth trend
embedding_service_queue_size

# Queue growth rate
deriv(embedding_service_queue_size[5m])
```

---

#### `embedding_service_dlq_size` (Gauge)

Current number of items in the dead letter queue awaiting retry.

**Example:**
```prometheus
embedding_service_dlq_size 3
```

**Query Examples:**
```prometheus
# DLQ items pending retry
embedding_service_dlq_size

# DLQ growth (items not being processed)
deriv(embedding_service_dlq_size[1h])
```

---

### System Metrics

#### `embedding_service_memory_usage_bytes` (Gauge)

Memory usage in bytes.

**Labels:**
- `type` - Memory type (`process_rss`, `process_vms`, `system_available`)

**Example:**
```prometheus
embedding_service_memory_usage_bytes{type="process_rss"} 536870912
embedding_service_memory_usage_bytes{type="process_vms"} 1073741824
embedding_service_memory_usage_bytes{type="system_available"} 8589934592
```

---

#### `embedding_service_processing_speed` (Gauge)

Number of embeddings processed per minute.

**Example:**
```prometheus
embedding_service_processing_speed 45.5
```

---

## Alerting Rules

See `alerts.yml` for complete Prometheus alerting rules configuration.

### Alert Severity Levels

- **critical** - Immediate action required (service down, data loss)
- **warning** - Action needed soon (high resource usage, elevated errors)
- **info** - Awareness (unusual patterns, capacity planning)

---

## Grafana Dashboard

### Recommended Panels

#### 1. Service Health Overview

| Panel | Type | Query |
|-------|------|-------|
| Service Status | Stat | `probe_success{job="embedding-service"}` |
| Queue Size | Gauge | `embedding_service_queue_size` |
| DLQ Size | Gauge | `embedding_service_dlq_size` |
| Memory Usage | Gauge | `embedding_service_memory_usage_bytes{type="process_rss"} / 1024 / 1024` |

#### 2. Request Metrics

| Panel | Type | Query |
|-------|------|-------|
| Requests/min | Time Series | `rate(embedding_service_requests_total[1m]) * 60` |
| Error Rate | Time Series | `sum(rate(embedding_service_errors_total[5m])) / sum(rate(embedding_service_requests_total[5m]))` |
| Latency (p50, p95, p99) | Time Series | `histogram_quantile(0.XX, rate(embedding_service_request_duration_seconds_bucket[5m]))` |

#### 3. Queue Health

| Panel | Type | Query |
|-------|------|-------|
| Queue Depth | Time Series | `embedding_service_queue_size` |
| Queue Growth Rate | Time Series | `deriv(embedding_service_queue_size[5m])` |
| DLQ Items | Time Series | `embedding_service_dlq_size` |

#### 4. System Resources

| Panel | Type | Query |
|-------|------|-------|
| Memory Usage | Time Series | `embedding_service_memory_usage_bytes{type="process_rss"} / 1024 / 1024` |
| Available Memory | Time Series | `embedding_service_memory_usage_bytes{type="system_available"} / 1024 / 1024` |

---

### Dashboard JSON Import

A pre-built Grafana dashboard is available. Import via Grafana UI:
1. Go to Dashboards → Import
2. Upload dashboard JSON or use ID (if published to Grafana.com)

---

## Log Aggregation

### Recommended Stack: Loki + Promtail + Grafana

#### Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌──────────┐
│  Python Worker  │────▶│   Promtail   │────▶│   Loki   │
│  (JSON logs)    │     │  (Log shipper)│    │  (Store) │
└─────────────────┘     └──────────────┘     └──────────┘
                                                   │
                                                   ▼
                                            ┌──────────┐
                                            │ Grafana  │
                                            │ (Query)  │
                                            └──────────┘
```

---

### Step 1: Configure Structured Logging

The service already outputs JSON-formatted logs:

```json
{"timestamp": "2026-03-19T10:30:00.000Z", "level": "INFO", "logger": "embedding_service", "message": "Embedding generated successfully", "user_id": "abc123"}
```

---

### Step 2: Install Promtail

**Docker Compose:**
```yaml
version: '3.8'
services:
  promtail:
    image: grafana/promtail:latest
    volumes:
      - /var/log:/var/log:ro
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    networks:
      - loki-network
```

---

### Step 3: Promtail Configuration (`promtail-config.yml`)

```yaml
server:
  http_listen_port: 9080
  grpc_listen_port: 0

positions:
  filename: /tmp/positions.yaml

clients:
  - url: http://loki:3100/loki/api/v1/push

scrape_configs:
  - job_name: embedding-service
    static_configs:
      - targets:
          - localhost
        labels:
          job: embedding-service
          __path__: /var/log/embedding-service/*.log
    
    pipeline_stages:
      - json:
          expressions:
            level: level
            message: message
            user_id: user_id
            timestamp: timestamp
      
      - labels:
          level:
          user_id:
      
      - timestamp:
          source: timestamp
          format: RFC3339
```

---

### Step 4: Loki Configuration (`loki-config.yml`)

```yaml
auth_enabled: false

server:
  http_listen_port: 3100
  grpc_listen_port: 9096

common:
  instance_addr: 127.0.0.1
  path_prefix: /tmp/loki
  storage:
    filesystem:
      chunks_directory: /tmp/loki/chunks
      rules_directory: /tmp/loki/rules
  replication_factor: 1
  ring:
    kvstore:
      store: inmemory

query_range:
  results_cache:
    cache:
      embedded_cache:
        enabled: true
        max_size_mb: 100

schema_config:
  configs:
    - from: 2020-10-24
      store: tsdb
      object_store: filesystem
      schema: v13
      index:
        prefix: index_
        period: 24h

ruler:
  alertmanager_url: http://localhost:9093

limits_config:
  retention_period: 744h  # 31 days
```

---

### Step 5: Docker Compose (Complete Stack)

```yaml
version: '3.8'
services:
  # Embedding Service
  embedding-service:
    build: .
    ports:
      - "8000:8000"
    environment:
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
    volumes:
      - ./logs:/app/logs
    networks:
      - monitoring-network

  # Prometheus
  prometheus:
    image: prom/prometheus:latest
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus-data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
    networks:
      - monitoring-network

  # Grafana
  grafana:
    image: grafana/grafana:latest
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
      - GF_INSTALL_PLUGINS=grafana-clock-panel,grafana-piechart-panel
    volumes:
      - grafana-data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    networks:
      - monitoring-network

  # Loki
  loki:
    image: grafana/loki:latest
    ports:
      - "3100:3100"
    volumes:
      - ./loki-config.yml:/etc/loki/config.yml
      - loki-data:/loki
    command: -config.file=/etc/loki/config.yml
    networks:
      - monitoring-network

  # Promtail
  promtail:
    image: grafana/promtail:latest
    volumes:
      - ./logs:/var/log:ro
      - ./promtail-config.yml:/etc/promtail/config.yml
    command: -config.file=/etc/promtail/config.yml
    networks:
      - monitoring-network

volumes:
  prometheus-data:
  grafana-data:
  loki-data:

networks:
  monitoring-network:
    driver: bridge
```

---

### Step 6: Prometheus Configuration (`prometheus.yml`)

```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

alerting:
  alertmanagers:
    - static_configs:
        - targets:
          - alertmanager:9093

rule_files:
  - "alerts.yml"

scrape_configs:
  - job_name: 'embedding-service'
    static_configs:
      - targets: ['embedding-service:8000']
    metrics_path: '/metrics'
    scrape_interval: 10s

  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']
```

---

## Log Queries (LogQL)

### Common Log Queries

```logql
# All error logs
{job="embedding-service"} |= "ERROR"

# Errors for specific user
{job="embedding-service"} | json | user_id = "abc123" |= "ERROR"

# DLQ storage failures
{job="embedding-service"} | json | message =~ "DLQ.*failed"

# High memory warnings
{job="embedding-service"} | json | message =~ "High memory usage"

# Request rate per minute
sum(rate({job="embedding-service"} |= "Embedding generated" [1m]))

# Error rate by type
sum by (error_type) (rate({job="embedding-service"} |= "ERROR" [5m]))
```

---

## Monitoring Best Practices

### 1. Set Up Alerts

Configure alerts for critical conditions (see `alerts.yml`):
- Service down
- High queue depth (>80)
- High error rate (>5%)
- High memory usage (>90%)
- DLQ exhaustion

### 2. Create Runbooks

For each alert, document:
- What the alert means
- How to investigate
- Steps to resolve
- Escalation path

### 3. Regular Reviews

- Weekly: Review alert frequency and adjust thresholds
- Monthly: Analyze trends and capacity planning
- Quarterly: Review and update monitoring configuration

### 4. Dashboard Access

- Make dashboards accessible to all team members
- Display key metrics on team monitors
- Set up mobile notifications for critical alerts

---

## Troubleshooting

### Service Not Responding

```bash
# Check health endpoint
curl http://localhost:8000/health

# Check logs
docker logs embedding-service

# Check metrics endpoint
curl http://localhost:8000/metrics
```

### High Queue Depth

```bash
# Check queue size
curl -s http://localhost:8000/health | jq '.queue_size'

# Check processing speed
# Query Prometheus: embedding_service_processing_speed

# Check for errors in logs
curl -s "http://loki:3100/loki/api/v1/query_range?query={job=%22embedding-service%22}%20%7C=%20%22ERROR%22"
```

### DLQ Growing

```bash
# Check DLQ size
curl -s http://localhost:8000/health | jq '.dlq_size'

# Query pending DLQ items
# Check Supabase: SELECT * FROM embedding_dead_letter_queue WHERE status = 'pending'
```

---

## Contact

For monitoring issues or questions:
- **On-Call:** Check PagerDuty rotation
- **Slack:** #monitoring-alerts
- **Runbooks:** `/docs/runbooks/`

---

**Last Updated:** 2026-03-19  
**Version:** 1.0.0
