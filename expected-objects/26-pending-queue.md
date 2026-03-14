# Table 26: `embedding_pending_queue`

> **Last Updated:** 2026-03-14  
> **Purpose:** Queue for pending embedding requests from onboarding and other sources, ensuring reliable embedding generation even if API trigger fails

---

## Overview

The `embedding_pending_queue` table implements a reliable queue for embedding generation requests, primarily used during user onboarding. It ensures that embedding generation is **never lost** even if the API trigger fails, using a two-phase commit pattern.

---

## Schema

```sql
CREATE TABLE IF NOT EXISTS public.embedding_pending_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    trigger_source TEXT NOT NULL DEFAULT 'onboarding' CHECK (trigger_source IN ('onboarding', 'manual', 'admin', 'api')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    first_attempt TIMESTAMPTZ,
    last_attempt TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failure_reason TEXT
);
```

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | - | Reference to profiles (UNIQUE, ON DELETE CASCADE) |
| `status` | TEXT | NO | 'pending' | `pending`, `processing`, `completed`, `failed` |
| `trigger_source` | TEXT | NO | 'onboarding' | Source: `onboarding`, `manual`, `admin`, `api` |
| `metadata` | JSONB | YES | `{}` | Additional metadata (flexible schema) |
| `created_at` | TIMESTAMPTZ | NO | NOW() | When the request was queued |
| `first_attempt` | TIMESTAMPTZ | YES | NULL | Timestamp of first processing attempt |
| `last_attempt` | TIMESTAMPTZ | YES | NULL | Timestamp of most recent attempt |
| `completed_at` | TIMESTAMPTZ | YES | NULL | When successfully completed |
| `failure_reason` | TEXT | YES | NULL | Error message if failed |

### UNIQUE Constraint

The `user_id` column has a **UNIQUE** constraint, ensuring only one pending request per user at a time.

---

## Indexes

```sql
CREATE INDEX idx_pending_queue_status ON public.embedding_pending_queue (status);
CREATE INDEX idx_pending_queue_created ON public.embedding_pending_queue (created_at);
CREATE INDEX idx_pending_queue_user_id ON public.embedding_pending_queue (user_id);
```

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_pending_queue_status` | `status` | Filter by status (pending, processing, etc.) |
| `idx_pending_queue_created` | `created_at` | FIFO processing order |
| `idx_pending_queue_user_id` | `user_id` | User-specific lookups |

---

## Row Level Security (RLS)

```sql
ALTER TABLE public.embedding_pending_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage all
CREATE POLICY "service_role_manage_pending_queue" ON public.embedding_pending_queue
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own pending queue status
CREATE POLICY "users_view_own_pending_queue" ON public.embedding_pending_queue
    FOR SELECT USING (auth.uid() = user_id);
```

### Policies

| Policy | Operations | Condition | Purpose |
|--------|-----------|-----------|---------|
| `service_role_manage_pending_queue` | ALL | `role = 'service_role'` | Python worker and admin full access |
| `users_view_own_pending_queue` | SELECT | `auth.uid() = user_id` | Users can view their own queue status |

---

## Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.embedding_pending_queue;
```

Enabled for live onboarding progress tracking.

---

## Database Functions

### `queue_embedding_request(user_id, trigger_source)`

Queues an embedding request with duplicate prevention.

**Parameters:**
- `p_user_id UUID` - User to queue embedding for
- `p_trigger_source TEXT` - Source: `'onboarding'`, `'manual'`, `'admin'`, `'api'`

**Returns:** `UUID` (queue item ID)

**Exceptions:**
- `23505` (unique_violation) - Request already pending
- Custom exception - User already has completed embedding

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION public.queue_embedding_request(
    p_user_id UUID,
    p_trigger_source TEXT DEFAULT 'onboarding'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Check if already queued or processing
    IF EXISTS (
        SELECT 1 FROM public.embedding_pending_queue
        WHERE user_id = p_user_id AND status IN ('pending', 'processing')
    ) THEN
        RAISE EXCEPTION 'Embedding request already pending for user %', p_user_id USING ERRCODE = '23505';
    END IF;
    
    -- Check if user already has completed embedding
    IF EXISTS (
        SELECT 1 FROM public.profile_embeddings
        WHERE user_id = p_user_id AND status = 'completed'
    ) THEN
        RAISE EXCEPTION 'User already has completed embedding';
    END IF;
    
    -- Insert pending request
    INSERT INTO public.embedding_pending_queue (user_id, trigger_source, status)
    VALUES (p_user_id, p_trigger_source, 'pending')
    RETURNING id INTO v_id;
    
    -- Notify workers via NOTIFY (optional, for real-time triggering)
    NOTIFY embedding_queue_changed;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage Example:**
```typescript
// app/(auth)/onboarding/actions.ts

export async function completeOnboarding(formData: FormData) {
  const userId = await getCurrentUserId();
  
  // Phase 1: Queue in DB (source of truth)
  const { data: queueData, error: queueError } = await supabase
    .rpc('queue_embedding_request', {
      p_user_id: userId,
      p_trigger_source: 'onboarding'
    });
  
  if (queueError) {
    // Handle duplicate (already queued) gracefully
    if (queueError.code === '23505') {
      logger.info('Embedding already queued', { userId });
    } else {
      throw queueError;
    }
  }
  
  // Phase 2: Trigger API (best effort)
  try {
    await fetch(`${appUrl}/api/embeddings/generate`, {
      method: 'POST',
      signal: AbortSignal.timeout(5000)
    });
  } catch (error) {
    // API trigger failed, but queue ensures processing will happen
    logger.warn('Embedding API trigger failed, but queue will handle', {
      userId,
      error
    });
  }
  
  return { success: true };
}
```

---

### `get_pending_queue_stats()`

Returns count of pending requests grouped by status.

**Returns:**
```typescript
[
  { status: 'pending', count: 12 },
  { status: 'processing', count: 3 },
  { status: 'completed', count: 1245 },
  { status: 'failed', count: 7 }
]
```

**Usage Example:**
```typescript
// Admin dashboard statistics
const { data: stats } = await supabase
  .rpc('get_pending_queue_stats');

// Display in stats cards
<StatsGrid>
  <StatCard label="Pending" value={stats.find(s => s.status === 'pending')?.count || 0} />
  <StatCard label="Processing" value={stats.find(s => s.status === 'processing')?.count || 0} />
  <StatCard label="Completed" value={stats.find(s => s.status === 'completed')?.count || 0} />
  <StatCard label="Failed" value={stats.find(s => s.status === 'failed')?.count || 0} />
</StatsGrid>
```

---

## Status Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│           Pending Queue Status State Machine                │
└─────────────────────────────────────────────────────────────┘

     ┌──────────┐
     │ pending  │ ──► (Python worker picks up)
     └────┬─────┘
          │
          ▼
     ┌──────────┐
     │processing│ ──► (Generate embedding)
     └────┬─────┘
          │
    ┌─────┴─────┐
    │           │
    ▼           ▼
┌─────────┐  ┌────────┐
│completed│  │ failed │
└─────────┘  └────────┘
```

### Status Values

| Status | Description | Next Action |
|--------|-------------|-------------|
| `pending` | Waiting to be processed | Python worker will pick up from queue |
| `processing` | Currently being processed | Generating embedding |
| `completed` | Successfully completed | No action needed (terminal state) |
| `failed` | Processing failed | Manual review or retry |

---

## Two-Phase Commit Pattern

### Problem: Fire-and-Forget is Unreliable

```
OLD FLOW (UNRELIABLE):
Onboarding Complete → API Trigger → Python Worker
                                      │
                                      └─► ❌ If API fails, embedding never generated!
```

### Solution: Queue + Trigger

```
NEW FLOW (RELIABLE):
Onboarding Complete
       │
       ├──► Phase 1: Queue in DB (source of truth) ✅
       │
       └──► Phase 2: API Trigger (best effort)
                       │
                       ├─► SUCCESS → Python Worker → Complete
                       │
                       └─► FAILURE → Background processor still handles it!
```

### Why This Works

1. **DB Queue is Source of Truth** - Never lost, ACID guarantees
2. **API Trigger is Best Effort** - Fast path when it works
3. **Background Processor** - Ensures completion even if API fails
4. **Duplicate Prevention** - UNIQUE constraint prevents double-processing

---

## Python Worker Integration

### Queue Processor

```python
# python-worker/main.py

async def process_pending_queue():
    """Background task that processes pending embedding requests."""
    
    while True:
        try:
            # Fetch pending items (FIFO order)
            result = await supabase.from_('embedding_pending_queue')\
                .select('*')\
                .eq('status', 'pending')\
                .order('created_at', desc=False)\
                .limit(10)\
                .execute()
            
            for item in result.data:
                # Update to processing
                await supabase.from_('embedding_pending_queue')\
                    .update({
                        'status': 'processing',
                        'first_attempt': datetime.now().isoformat()
                    })\
                    .eq('id', item['id'])\
                    .execute()
                
                try:
                    # Get user profile data
                    profile = await get_user_profile(item['user_id'])
                    
                    # Generate semantic text
                    semantic_text = build_semantic_text(profile)
                    
                    # Generate embedding
                    embedding = await generate_embedding(semantic_text)
                    
                    # Store in profile_embeddings
                    await store_embedding(item['user_id'], embedding)
                    
                    # Mark as completed
                    await supabase.from_('embedding_pending_queue')\
                        .update({
                            'status': 'completed',
                            'completed_at': datetime.now().isoformat()
                        })\
                        .eq('id', item['id'])\
                        .execute()
                    
                except Exception as e:
                    # Mark as failed
                    await supabase.from_('embedding_pending_queue')\
                        .update({
                            'status': 'failed',
                            'failure_reason': str(e),
                            'last_attempt': datetime.now().isoformat()
                        })\
                        .eq('id', item['id'])\
                        .execute()
            
            # Wait before next batch
            await asyncio.sleep(10)
            
        except Exception as e:
            logger.error(f"Pending queue processor error: {e}")
            await asyncio.sleep(10)
```

---

## Admin Dashboard

### Queue Admin Page

**Location:** `app/(auth)/dashboard/embedding-queue-admin/page.tsx`

```typescript
export default function EmbeddingQueueAdmin() {
  const [stats, setStats] = useState<QueueStats>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  });
  
  const [pendingItems, setPendingItems] = useState<PendingQueueItem[]>([]);
  
  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('pending-queue-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'embedding_pending_queue'
      }, (payload) => {
        // Update UI with real-time changes
        updateQueueItems(payload);
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, []);
  
  return (
    <div>
      <h1>Embedding Queue Administration</h1>
      
      {/* Statistics Cards */}
      <StatsGrid>
        <StatCard label="Pending" value={stats.pending} variant="warning" />
        <StatCard label="Processing" value={stats.processing} variant="info" />
        <StatCard label="Completed" value={stats.completed} variant="success" />
        <StatCard label="Failed" value={stats.failed} variant="error" />
      </StatsGrid>
      
      {/* Pending Queue Table */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Source</TableHead>
            <TableHead>Created</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pendingItems.map(item => (
            <TableRow key={item.id}>
              <TableCell>
                <UserAvatar userId={item.user_id} />
                {item.user_email}
              </TableCell>
              <TableCell>
                <Badge>{item.trigger_source}</Badge>
              </TableCell>
              <TableCell>{formatDate(item.created_at)}</TableCell>
              <TableCell>
                <StatusBadge status={item.status} />
              </TableCell>
              <TableCell>
                <Button
                  onClick={() => handleRetry(item.id)}
                  variant="outline"
                  size="sm"
                >
                  Retry
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
```

---

## Monitoring & Alerts

### Key Metrics

| Metric | Threshold | Alert Level |
|--------|-----------|-------------|
| Pending Queue Size | > 50 | WARNING |
| Processing Time (p95) | > 5 minutes | WARNING |
| Failure Rate | > 10% | CRITICAL |
| Queue Age (oldest pending) | > 1 hour | CRITICAL |

### Grafana Dashboard Queries

```sql
-- Queue size by status
SELECT 
  status,
  COUNT(*) as count
FROM embedding_pending_queue
GROUP BY status;

-- Queue aging (pending > 1 hour)
SELECT 
  id,
  user_id,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at)) / 3600 as age_hours
FROM embedding_pending_queue
WHERE status = 'pending'
  AND created_at < NOW() - INTERVAL '1 hour'
ORDER BY created_at ASC;

-- Failure analysis (last 24 hours)
SELECT 
  failure_reason,
  COUNT(*) as occurrences,
  MAX(created_at) as last_occurrence
FROM embedding_pending_queue
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY failure_reason
ORDER BY occurrences DESC;
```

---

## Usage Examples

### Get User's Queue Status

```typescript
const { data } = await supabase
  .from('embedding_pending_queue')
  .select('status, created_at, completed_at')
  .eq('user_id', userId)
  .single();

if (data?.status === 'completed') {
  // Embedding ready, proceed with matching
} else if (data?.status === 'processing') {
  // Still generating, show loading state
} else if (data?.status === 'failed') {
  // Show error, offer retry
}
```

### Manual Queue Insertion (Admin)

```sql
-- Queue embedding for user manually
INSERT INTO embedding_pending_queue (user_id, trigger_source, status)
VALUES ('user-uuid-here', 'manual', 'pending')
ON CONFLICT (user_id) DO UPDATE
SET 
  status = 'pending',
  trigger_source = 'manual',
  created_at = NOW();
```

### Retry Failed Items

```sql
-- Reset failed items for retry
UPDATE embedding_pending_queue
SET 
  status = 'pending',
  failure_reason = NULL,
  last_attempt = NULL
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '7 days';
```

---

## Performance Considerations

### Query Optimization

1. **Status Index**: Enables efficient filtering for processor
2. **Created Index**: Supports FIFO ordering
3. **User Index**: Supports user-specific lookups
4. **UNIQUE Constraint**: Prevents duplicate processing

### Batch Processing

```python
# Process in batches of 10 to avoid overload
LIMIT 10

# Wait between batches
await asyncio.sleep(10)

# Semaphore for concurrency control
semaphore = asyncio.Semaphore(5)  # Max 5 concurrent
```

---

## Error Handling

### Common Failure Reasons

| Error | Cause | Resolution |
|-------|-------|------------|
| `Profile not found` | User deleted profile | Mark as failed, manual review |
| `Incomplete profile` | Missing required fields | Wait for profile completion |
| `Model loading failed` | Python worker OOM | Restart worker |
| `Supabase timeout` | Network issue | Automatic retry |

---

## Related Tables

- [`profile_embeddings`](./24-profile-embeddings.md) - Target embedding storage
- [`embedding_dead_letter_queue`](./25-dead-letter-queue.md) - Failed retry queue
- [`embedding_rate_limits`](./26-rate-limiting.md) - Rate limiting system

---

## References

- [Embedding Reliability Fixes](../docs/EMBEDDING-RELIABILITY-FIXES.md)
- [Task 4 Completion](../docs/TASK-4-COMPLETION.md)
- [Python Worker Documentation](../docs/python-worker/README.md)
