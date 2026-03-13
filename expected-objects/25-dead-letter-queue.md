# Table 24: `embedding_dead_letter_queue`

> **Last Updated:** 2026-03-14  
> **Purpose:** Dead letter queue for failed embedding generation requests with automatic retry capability

---

## Overview

The `embedding_dead_letter_queue` table stores failed embedding generation attempts and enables automatic retry with exponential backoff. This is a critical component of the embedding reliability system, ensuring that transient failures don't result in permanent data loss.

---

## Schema

```sql
CREATE TABLE embedding_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  semantic_text TEXT NOT NULL,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending',
  last_attempt TIMESTAMPTZ,
  next_retry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);
```

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | - | Reference to profiles table (ON DELETE CASCADE) |
| `semantic_text` | TEXT | NO | - | Original semantic text to be embedded (preserved for retry) |
| `failure_reason` | TEXT | YES | NULL | Error message from failed attempt |
| `retry_count` | INTEGER | NO | 0 | Number of retry attempts made |
| `max_retries` | INTEGER | NO | 3 | Maximum retry attempts before exhaustion |
| `status` | TEXT | NO | 'pending' | `pending`, `processing`, `completed`, `exhausted` |
| `last_attempt` | TIMESTAMPTZ | YES | NULL | Timestamp of last retry attempt |
| `next_retry` | TIMESTAMPTZ | YES | NULL | Scheduled time for next retry (exponential backoff) |
| `created_at` | TIMESTAMPTZ | NO | NOW() | When the failure was recorded |
| `resolved_at` | TIMESTAMPTZ | YES | NULL | When successfully processed or exhausted |

---

## Indexes

```sql
CREATE INDEX idx_dlq_status_retry ON embedding_dead_letter_queue(status, next_retry);
CREATE INDEX idx_dlq_user_id ON embedding_dead_letter_queue(user_id);
CREATE INDEX idx_dlq_created_at ON embedding_dead_letter_queue(created_at);
```

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_dlq_status_retry` | `status`, `next_retry` | Efficient querying for DLQ processor (find items ready for retry) |
| `idx_dlq_user_id` | `user_id` | User-specific DLQ lookups |
| `idx_dlq_created_at` | `created_at` | Chronological ordering, aging analysis |

---

## Row Level Security (RLS)

```sql
ALTER TABLE embedding_dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage all
CREATE POLICY "service_role_manage_dlq" ON embedding_dead_letter_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own
CREATE POLICY "users_view_own_dlq" ON embedding_dead_letter_queue
  FOR SELECT USING (auth.uid() = user_id);
```

### Policies

| Policy | Operations | Condition | Purpose |
|--------|-----------|-----------|---------|
| `service_role_manage_dlq` | ALL | `role = 'service_role'` | Python worker and admin dashboard full access |
| `users_view_own_dlq` | SELECT | `auth.uid() = user_id` | Users can view their own DLQ items |

---

## Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE embedding_dead_letter_queue;
```

Enabled for live admin dashboard updates.

---

## Status Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│              DLQ Status State Machine                       │
└─────────────────────────────────────────────────────────────┘

     ┌──────────┐
     │ pending  │ ──► (DLQ processor picks up)
     └────┬─────┘
          │
          ▼
     ┌──────────┐
     │processing│ ──► (Retry attempt)
     └────┬─────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌─────────┐  ┌──────────┐
│completed│  │ exhausted│ (retry_count >= max_retries)
└─────────┘  └──────────┘
```

### Status Values

| Status | Description | Next Action |
|--------|-------------|-------------|
| `pending` | Waiting for retry (exponential backoff) | DLQ processor will pick up when `next_retry <= NOW()` |
| `processing` | Currently being retried | Python worker is generating embedding |
| `completed` | Successfully processed | No action needed (terminal state) |
| `exhausted` | Max retries reached (3 attempts) | Requires manual intervention |

---

## Retry Strategy

### Exponential Backoff

```
Retry 1: 5 minutes after failure
Retry 2: 10 minutes after failure (5min × 2)
Retry 3: 20 minutes after failure (5min × 4)
Status: exhausted (if all 3 retries fail)
```

### Implementation (Python Worker)

```python
# python-worker/main.py

async def process_dead_letter_queue():
    while True:
        # Fetch items ready for retry
        result = await supabase.from_('embedding_dead_letter_queue')\
            .select('*')\
            .eq('status', 'pending')\
            .lte('next_retry', datetime.now().isoformat())\
            .limit(10)\
            .execute()
        
        for item in result.data:
            # Update status to processing
            await supabase.from_('embedding_dead_letter_queue')\
                .update({'status': 'processing', 'last_attempt': now()})\
                .eq('id', item['id'])\
                .execute()
            
            try:
                # Generate embedding
                embedding = await generate_embedding(item['semantic_text'])
                
                # Store in profile_embeddings
                await store_embedding(item['user_id'], embedding)
                
                # Mark as completed
                await supabase.from_('embedding_dead_letter_queue')\
                    .update({'status': 'completed', 'resolved_at': now()})\
                    .eq('id', item['id'])\
                    .execute()
                    
            except Exception as e:
                retry_count = item['retry_count'] + 1
                
                if retry_count >= item['max_retries']:
                    # Mark as exhausted
                    await supabase.from_('embedding_dead_letter_queue')\
                        .update({
                            'status': 'exhausted',
                            'retry_count': retry_count,
                            'failure_reason': str(e),
                            'resolved_at': now()
                        })\
                        .eq('id', item['id'])\
                        .execute()
                else:
                    # Schedule next retry (exponential backoff)
                    delay_minutes = 5 * (2 ** (retry_count - 1))
                    next_retry = datetime.now() + timedelta(minutes=delay_minutes)
                    
                    await supabase.from_('embedding_dead_letter_queue')\
                        .update({
                            'retry_count': retry_count,
                            'next_retry': next_retry.isoformat(),
                            'status': 'pending',
                            'failure_reason': str(e)
                        })\
                        .eq('id', item['id'])\
                        .execute()
        
        await asyncio.sleep(10)  # Check every 10 seconds
```

---

## Usage Examples

### Query DLQ Items Ready for Retry

```sql
SELECT * FROM embedding_dead_letter_queue
WHERE status = 'pending'
  AND next_retry <= NOW()
ORDER BY next_retry ASC
LIMIT 10;
```

### Get User's DLQ Items

```sql
SELECT * FROM embedding_dead_letter_queue
WHERE user_id = 'user-uuid-here'
ORDER BY created_at DESC;
```

### Get DLQ Statistics

```sql
SELECT 
  status,
  COUNT(*) as count,
  AVG(retry_count) as avg_retries
FROM embedding_dead_letter_queue
GROUP BY status;
```

### Manual Retry (Admin)

```sql
-- Reset exhausted item for manual retry
UPDATE embedding_dead_letter_queue
SET 
  status = 'pending',
  retry_count = 0,
  next_retry = NOW(),
  resolved_at = NULL
WHERE id = 'dlq-item-uuid'
  AND status = 'exhausted';
```

---

## Integration with Admin Dashboard

### Component: `components/features/settings/embedding-dlq-admin.tsx`

```typescript
// Real-time subscription to DLQ
useEffect(() => {
  const channel = supabase
    .channel('dlq-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'embedding_dead_letter_queue'
      },
      (payload) => {
        // Update UI with real-time changes
        setDlqItems(prev => updateItems(prev, payload));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

### Retry Button Handler

```typescript
const handleRetry = async (dlqItemId: string) => {
  try {
    const response = await fetch('/api/embeddings/retry-dlq', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dlqItemId })
    });
    
    if (!response.ok) throw new Error('Retry failed');
    
    toast.success('DLQ item queued for retry');
  } catch (error) {
    toast.error('Failed to retry DLQ item');
  }
};
```

---

## Monitoring & Alerts

### Key Metrics

| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| DLQ Size (pending) | > 50 | WARNING |
| DLQ Size (exhausted) | > 10 | CRITICAL |
| Avg Retry Count | > 2 | WARNING |
| Completion Rate | < 90% | WARNING |

### Grafana Dashboard Query

```sql
-- DLQ size by status
SELECT 
  status,
  COUNT(*) as count
FROM embedding_dead_letter_queue
WHERE status != 'completed'
GROUP BY status;

-- DLQ aging (items pending > 1 hour)
SELECT 
  COUNT(*) as aged_items
FROM embedding_dead_letter_queue
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour';
```

---

## Performance Considerations

### Query Optimization

1. **Composite Index**: `idx_dlq_status_retry` on `(status, next_retry)` enables efficient filtering for DLQ processor
2. **User Index**: `idx_dlq_user_id` supports user-specific queries
3. **Time Index**: `idx_dlq_created_at` supports aging analysis

### Cleanup Strategy

```sql
-- Archive completed items older than 30 days
INSERT INTO embedding_dead_letter_queue_archive
SELECT * FROM embedding_dead_letter_queue
WHERE status = 'completed'
  AND resolved_at < NOW() - INTERVAL '30 days';

-- Delete archived items
DELETE FROM embedding_dead_letter_queue
WHERE status = 'completed'
  AND resolved_at < NOW() - INTERVAL '30 days';
```

---

## Error Handling

### Common Failure Reasons

| Error | Cause | Resolution |
|-------|-------|------------|
| `Model loading failed` | Python worker OOM | Restart worker, check memory limits |
| `Supabase connection timeout` | Network issue | Automatic retry handles this |
| `Invalid semantic text` | Corrupted data | Manual inspection required |
| `Dimension mismatch` | Model version change | Update model or regenerate |

### Failure Analysis Query

```sql
SELECT 
  failure_reason,
  COUNT(*) as occurrences,
  MAX(created_at) as last_occurrence
FROM embedding_dead_letter_queue
WHERE status = 'exhausted'
GROUP BY failure_reason
ORDER BY occurrences DESC;
```

---

## Related Tables

- [`profile_embeddings`](./24-profile-embeddings.md) - Target table for embeddings
- [`embedding_rate_limits`](./26-rate-limiting.md) - Rate limiting system
- [`embedding_pending_queue`](./27-pending-queue.md) - Onboarding queue

---

## References

- [Embedding Reliability Fixes](../docs/EMBEDDING-RELIABILITY-FIXES.md)
- [Python Worker Documentation](../docs/python-worker/README.md)
- [Task 4 Completion](../docs/TASK-4-COMPLETION.md)
