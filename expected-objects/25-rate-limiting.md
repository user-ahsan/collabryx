# Table 25: `embedding_rate_limits`

> **Last Updated:** 2026-03-14  
> **Purpose:** Rate limiting for embedding generation to prevent DoS attacks and resource exhaustion (3 requests per hour per user)

---

## Overview

The `embedding_rate_limits` table implements a sliding window rate limiting algorithm to protect the embedding generation service from abuse, DoS attacks, and resource exhaustion. Each user is limited to **3 embedding requests per hour**.

---

## Schema

```sql
CREATE TABLE embedding_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | Primary key |
| `user_id` | UUID | NO | - | Reference to profiles table (ON DELETE CASCADE) |
| `request_count` | INTEGER | NO | 1 | Number of requests in current window |
| `window_start` | TIMESTAMPTZ | NO | NOW() | Start of current sliding window |
| `window_end` | TIMESTAMPTZ | NO | NOW() + 1 hour | End of current sliding window |
| `created_at` | TIMESTAMPTZ | NO | NOW() | When the rate limit record was created |
| `updated_at` | TIMESTAMPTZ | NO | NOW() | Last update timestamp |

---

## Indexes

```sql
CREATE INDEX idx_rate_limit_user_window ON embedding_rate_limits(user_id, window_end);
CREATE INDEX idx_rate_limit_created_at ON embedding_rate_limits(created_at);
```

| Index | Columns | Purpose |
|-------|---------|---------|
| `idx_rate_limit_user_window` | `user_id`, `window_end` | Efficient lookup for rate limit check (user + window validity) |
| `idx_rate_limit_created_at` | `created_at` | Aging analysis, cleanup queries |

---

## Row Level Security (RLS)

```sql
ALTER TABLE embedding_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role can manage all
CREATE POLICY "service_role_manage_rate_limits" ON embedding_rate_limits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own
CREATE POLICY "users_view_own_rate_limits" ON embedding_rate_limits
  FOR SELECT USING (auth.uid() = user_id);
```

### Policies

| Policy | Operations | Condition | Purpose |
|--------|-----------|-----------|---------|
| `service_role_manage_rate_limits` | ALL | `role = 'service_role'` | Python worker and admin full access |
| `users_view_own_rate_limits` | SELECT | `auth.uid() = user_id` | Users can view their own rate limit status |

---

## Realtime

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE embedding_rate_limits;
```

Enabled for live admin dashboard monitoring.

---

## Rate Limit Functions

### `check_embedding_rate_limit(user_id)`

Checks if user has remaining requests and increments counter if allowed.

**Parameters:**
- `p_user_id UUID` - User to check rate limit for

**Returns:**
```typescript
{
  allowed: boolean;    // true if request is allowed
  remaining: number;   // remaining requests in current window
  reset_at: timestamptz // when the window resets
}
```

**Implementation:**
```sql
CREATE OR REPLACE FUNCTION check_embedding_rate_limit(p_user_id UUID)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_record RECORD;
  v_remaining INTEGER;
BEGIN
  -- Get or create rate limit record
  SELECT * INTO v_record
  FROM embedding_rate_limits
  WHERE user_id = p_user_id
    AND window_end > NOW()
  ORDER BY window_end DESC
  LIMIT 1;
  
  -- No record exists, create one
  IF v_record IS NULL THEN
    INSERT INTO embedding_rate_limits (user_id, request_count)
    VALUES (p_user_id, 1)
    RETURNING * INTO v_record;
    
    RETURN QUERY SELECT TRUE, 2, v_record.window_end;
  END IF;
  
  -- Check remaining requests (limit: 3 per hour)
  v_remaining := 3 - v_record.request_count;
  
  IF v_remaining > 0 THEN
    -- Update count
    UPDATE embedding_rate_limits
    SET request_count = request_count + 1,
        updated_at = NOW()
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT TRUE, v_remaining - 1, v_record.window_end;
  ELSE
    -- Rate limit exceeded
    RETURN QUERY SELECT FALSE, 0, v_record.window_end;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Usage Example:**
```typescript
// TypeScript/Node.js
const { data, error } = await supabase
  .rpc('check_embedding_rate_limit', { p_user_id: userId });

if (error) throw error;

const { allowed, remaining, reset_at } = data[0];

if (!allowed) {
  // Return 429 Too Many Requests
  return new Response('Rate limit exceeded', {
    status: 429,
    headers: {
      'Retry-After': Math.ceil((reset_at - Date.now()) / 1000).toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': reset_at
    }
  });
}

// Proceed with embedding generation
```

---

### `reset_embedding_rate_limit(user_id)`

Admin function to reset a user's rate limit (for support cases).

**Parameters:**
- `p_user_id UUID` - User to reset rate limit for

**Returns:** `VOID`

**Usage Example:**
```sql
-- Reset rate limit for specific user
SELECT reset_embedding_rate_limit('user-uuid-here');

-- Reset via Supabase client
const { error } = await supabase
  .rpc('reset_embedding_rate_limit', { p_user_id: userId });
```

---

## Sliding Window Algorithm

### How It Works

```
┌─────────────────────────────────────────────────────────────┐
│              Sliding Window Rate Limiting                   │
└─────────────────────────────────────────────────────────────┘

Time:  ──►
       │←───── 1 hour window ─────→│
       │                           │
       ▼                           ▼
   window_start                window_end
   
   Request Count: 3/3 (EXHAUSTED)
   
   When window_end passes:
   - Window slides forward
   - Count resets
   - New requests allowed
```

### Window Lifecycle

1. **First Request**: Creates record with `request_count = 1`, `window_end = NOW() + 1 hour`
2. **Subsequent Requests**: Increments `request_count` if `< 3`
3. **Window Expiry**: When `window_end < NOW()`, next request creates new window
4. **Automatic Reset**: Window slides forward automatically (no manual intervention needed)

---

## Integration Points

### API Route: `/api/embeddings/generate`

```typescript
// app/api/embeddings/generate/route.ts

import { checkRateLimit } from '@/lib/rate-limit';

export async function POST(request: Request) {
  const userId = await getCurrentUserId();
  
  // Check rate limit
  const rateLimitResult = await checkRateLimit(userId);
  
  if (!rateLimitResult.allowed) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'Retry-After': rateLimitResult.retryAfter,
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitResult.resetAt
      }
    });
  }
  
  // Proceed with embedding generation
  // ...
}
```

### Python Worker Integration

```python
# python-worker/rate_limiter.py

class RateLimiter:
    def __init__(self, supabase_client, limit=3, window_hours=1):
        self.supabase = supabase_client
        self.limit = limit
        self.window_hours = window_hours
        self.cache = {}  # In-memory cache (60s TTL)
    
    async def check_rate_limit(self, user_id: str) -> RateLimitResult:
        # Check cache first
        if user_id in self.cache:
            cached = self.cache[user_id]
            if time.time() - cached['timestamp'] < 60:
                return cached['result']
        
        # Query database
        result = await self.supabase.rpc(
            'check_embedding_rate_limit',
            {'p_user_id': user_id}
        ).execute()
        
        rate_limit_result = RateLimitResult(
            allowed=result.data[0]['allowed'],
            remaining=result.data[0]['remaining'],
            reset_at=result.data[0]['reset_at']
        )
        
        # Cache for 60 seconds
        self.cache[user_id] = {
            'timestamp': time.time(),
            'result': rate_limit_result
        }
        
        return rate_limit_result
```

---

## Admin Dashboard

### Rate Limit Monitoring Component

```typescript
// components/features/settings/rate-limit-admin.tsx

export function RateLimitAdmin() {
  const [rateLimits, setRateLimits] = useState([]);
  
  useEffect(() => {
    // Real-time subscription
    const channel = supabase
      .channel('rate-limit-changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'embedding_rate_limits'
      }, (payload) => {
        setRateLimits(updateRateLimits(payload));
      })
      .subscribe();
    
    return () => supabase.removeChannel(channel);
  }, []);
  
  return (
    <div>
      <h2>Rate Limit Status</h2>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Requests</TableHead>
            <TableHead>Window End</TableHead>
            <TableHead>Remaining</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rateLimits.map(limit => (
            <TableRow key={limit.id}>
              <TableCell>{limit.user_email}</TableCell>
              <TableCell>{limit.request_count}/3</TableCell>
              <TableCell>{formatDate(limit.window_end)}</TableCell>
              <TableCell>{3 - limit.request_count}</TableCell>
              <TableCell>
                <Button
                  onClick={() => handleReset(limit.user_id)}
                  variant="outline"
                >
                  Reset
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
| Users Rate Limited | > 10/hour | WARNING |
| Repeated Rate Limits (same user) | > 5/hour | CRITICAL |
| Cache Hit Rate | < 80% | WARNING |

### Grafana Dashboard Queries

```sql
-- Users currently rate limited
SELECT COUNT(DISTINCT user_id) as rate_limited_users
FROM embedding_rate_limits
WHERE window_end > NOW()
  AND request_count >= 3;

-- Rate limit violations in last hour
SELECT 
  user_id,
  COUNT(*) as violation_count,
  MAX(window_end) as last_violation
FROM embedding_rate_limits
WHERE request_count >= 3
  AND window_end > NOW() - INTERVAL '1 hour'
GROUP BY user_id
HAVING COUNT(*) > 3
ORDER BY violation_count DESC;
```

---

## Performance Considerations

### Caching Strategy

```python
# Python worker uses in-memory cache to reduce DB load

class RateLimiter:
    def __init__(self):
        self.cache = TTLCache(maxsize=10000, ttl=60)  # 60s TTL
    
    async def check_rate_limit(self, user_id: str):
        # Check cache first (90%+ hit rate expected)
        if user_id in self.cache:
            return self.cache[user_id]
        
        # Query DB only on cache miss
        result = await self.db_query(user_id)
        
        # Cache result
        self.cache[user_id] = result
        
        return result
```

### Database Optimization

1. **Composite Index**: `(user_id, window_end)` enables efficient window lookups
2. **SECURITY DEFINER**: Functions run with elevated privileges (no RLS overhead)
3. **Single Query**: `check_embedding_rate_limit` does get/create/update in one call

---

## Error Handling

### Common Scenarios

| Scenario | Behavior | Response |
|----------|----------|----------|
| First request | Creates record, allows | `allowed: true, remaining: 2` |
| Within limit | Increments count, allows | `allowed: true, remaining: 1` |
| Limit exceeded | Returns current window | `allowed: false, remaining: 0` |
| Window expired | Creates new window, allows | `allowed: true, remaining: 2` |
| DB connection failed | Fail-open (allows) | Logs error, allows request |

### Fail-Open Behavior

```python
async def check_rate_limit(self, user_id: str):
    try:
        return await self.db_query(user_id)
    except Exception as e:
        # Fail-open: allow request but log error
        logger.error(f"Rate limiter failed: {e}")
        return RateLimitResult(
            allowed=True,
            remaining=2,
            reset_at=datetime.now() + timedelta(hours=1)
        )
```

---

## Testing

### Unit Tests

```python
# python-worker/tests/test_rate_limiter.py

async def test_rate_limit_allows_first_three_requests():
    limiter = RateLimiter(supabase)
    
    # First request
    result1 = await limiter.check_rate_limit('user-1')
    assert result1.allowed == True
    assert result1.remaining == 2
    
    # Second request
    result2 = await limiter.check_rate_limit('user-1')
    assert result2.allowed == True
    assert result2.remaining == 1
    
    # Third request
    result3 = await limiter.check_rate_limit('user-1')
    assert result3.allowed == True
    assert result3.remaining == 0
    
    # Fourth request (should be blocked)
    result4 = await limiter.check_rate_limit('user-1')
    assert result4.allowed == False
    assert result4.remaining == 0
```

---

## Related Tables

- [`profile_embeddings`](./24-profile-embeddings.md) - Embedding storage
- [`embedding_dead_letter_queue`](./25-dead-letter-queue.md) - Failed retry queue
- [`embedding_pending_queue`](./27-pending-queue.md) - Onboarding queue

---

## References

- [Embedding Reliability Fixes](../docs/EMBEDDING-RELIABILITY-FIXES.md)
- [Python Worker Documentation](../docs/python-worker/README.md)
- [Rate Limiting Implementation](../python-worker/rate_limiter.py)
