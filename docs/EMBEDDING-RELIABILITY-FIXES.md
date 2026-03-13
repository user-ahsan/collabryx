# 🔧 Embedding System Reliability Fixes - Implementation Plan

**Created:** 2026-03-12  
**Last Updated:** 2026-03-12  
**Priority:** Medium-High  
**Estimated Total Effort:** 12-17 hours  
**Status:** Task 4 Complete ✓

---

## ✅ Implementation Status

### Task 4: Embedding Quality Validation - COMPLETE ✓

**Completed:** 2026-03-12  
**Actual Effort:** ~2 hours

**Deliverables:**
- ✓ `python-worker/embedding_validator.py` - Validator module with ValidationStatus enum, ValidationResult dataclass, EmbeddingValidator class
- ✓ `python-worker/embedding_generator.py` - Updated to validate embeddings after generation
- ✓ `python-worker/main.py` - Updated store_embedding() with validation metadata
- ✓ `supabase/setup/29-validation-constraints.sql` - Database constraints and triggers
- ✓ `components/features/settings/embedding-quality.tsx` - Frontend quality display
- ✓ `python-worker/test_validator.py` - Comprehensive test suite

**Validation Checks Implemented:**
- ✓ Dimension check (must be 384)
- ✓ NaN value detection
- ✓ Infinity value detection
- ✓ All zeros detection
- ✓ Normalization check (magnitude ~1.0 ±5%)
- ✓ Auto-fix normalization
- ✓ Pre-storage validation
- ✓ Validation metadata storage (dimension, magnitude, min/max/mean values, timestamp)
- ✓ Database CHECK constraints
- ✓ BEFORE INSERT/UPDATE triggers

**Testing:**
- All validation scenarios covered in test_validator.py
- Auto-fix normalization verified
- Invalid embeddings properly rejected
- Metadata storage confirmed

---

---

## 📋 Executive Summary

This plan addresses **4 critical reliability gaps** in the Collabryx embedding generation system:

1. **Dead Letter Queue** - Recover failed embeddings automatically
2. **Rate Limiting** - Prevent DoS attacks on embedding service
3. **Onboarding Trigger Reliability** - Ensure all new users get embeddings
4. **Embedding Validation** - Prevent corrupted data storage

---

## 🎯 Task 1: Dead Letter Queue for Failed Embeddings

**Problem:** Failed embeddings are marked as "failed" but never retried  
**Impact:** Users lose embedding functionality permanently  
**Effort:** 3-4 hours

### Implementation Steps

#### 1.1 Database Schema (`supabase/setup/26-dead-letter-queue.sql`)
```sql
-- Dead letter queue for failed embedding requests
CREATE TABLE embedding_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  semantic_text TEXT NOT NULL,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, exhausted
  last_attempt TIMESTAMPTZ,
  next_retry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX idx_dlq_status_retry ON embedding_dead_letter_queue(status, next_retry);
CREATE INDEX idx_dlq_user_id ON embedding_dead_letter_queue(user_id);
CREATE INDEX idx_dlq_created_at ON embedding_dead_letter_queue(created_at);

-- RLS Policies
ALTER TABLE embedding_dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage all
CREATE POLICY "service_role_manage_dlq" ON embedding_dead_letter_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own
CREATE POLICY "users_view_own_dlq" ON embedding_dead_letter_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Realtime enabled
ALTER PUBLICATION supabase_realtime ADD TABLE embedding_dead_letter_queue;
```

#### 1.2 Python Worker Updates (`python-worker/main.py`)

**Add DLQ storage function:**
```python
async def store_in_dead_letter_queue(
    user_id: str,
    semantic_text: str,
    failure_reason: str,
    retry_count: int = 0
):
    """Store failed request in dead letter queue for retry"""
    next_retry = datetime.utcnow() + timedelta(minutes=5 * (retry_count + 1))
    supabase.table("embedding_dead_letter_queue").insert({
        "user_id": user_id,
        "semantic_text": semantic_text,
        "failure_reason": failure_reason,
        "retry_count": retry_count,
        "next_retry": next_retry.isoformat(),
        "status": "pending" if retry_count < 3 else "exhausted"
    }).execute()
```

**Update error handler in `process_embedding_request()`:**
```python
except Exception as e:
    logger.error(f"Embedding generation failed for {user_id}: {e}")
    
    # Store in DLQ for retry
    await store_in_dead_letter_queue(
        user_id=user_id,
        semantic_text=text,
        failure_reason=str(e),
        retry_count=existing_retry_count
    )
    
    # Update status to failed
    if supabase:
        supabase.table("profile_embeddings").upsert({
            "user_id": user_id,
            "status": "failed",
            "last_updated": datetime.utcnow().isoformat()
        }).execute()
```

**Add DLQ processor:**
```python
async def process_dead_letter_queue():
    """Process retryable items from dead letter queue"""
    now = datetime.utcnow().isoformat()
    
    # Get items ready for retry
    response = supabase.table("embedding_dead_letter_queue")\
        .select("*")\
        .eq("status", "pending")\
        .lte("next_retry", now)\
        .lt("retry_count", 3)\
        .limit(10)\
        .execute()
    
    for item in response.data:
        try:
            # Mark as processing
            supabase.table("embedding_dead_letter_queue")\
                .update({"status": "processing", "last_attempt": datetime.utcnow().isoformat()})\
                .eq("id", item["id"])\
                .execute()
            
            # Generate embedding
            embedding = await generator.generate_embedding(item["semantic_text"])
            
            # Store successfully
            await store_embedding(item["user_id"], embedding, item["semantic_text"])
            
            # Mark DLQ item as completed
            supabase.table("embedding_dead_letter_queue")\
                .update({
                    "status": "completed",
                    "resolved_at": datetime.utcnow().isoformat()
                })\
                .eq("id", item["id"])\
                .execute()
                
        except Exception as e:
            logger.warning(f"DLQ retry failed for {item['user_id']}: {e}")
            # Increment retry count and reschedule
            new_retry_count = item["retry_count"] + 1
            if new_retry_count >= 3:
                status = "exhausted"
            else:
                status = "pending"
                next_retry = datetime.utcnow() + timedelta(minutes=5 * (new_retry_count + 1))
            
            supabase.table("embedding_dead_letter_queue")\
                .update({
                    "retry_count": new_retry_count,
                    "status": status,
                    "next_retry": next_retry.isoformat() if status == "pending" else None
                })\
                .eq("id", item["id"])\
                .execute()
```

**Add to background tasks in `lifespan()`:**
```python
@app.asynccontextmanager
async def lifespan(app: FastAPI):
    # Start background tasks
    processor_task = asyncio.create_task(queue_processor())
    dlq_processor_task = asyncio.create_task(process_dead_letter_queue())
    
    yield
    
    # Cleanup
    processor_task.cancel()
    dlq_processor_task.cancel()
    try:
        await processor_task
        await dlq_processor_task
    except asyncio.CancelledError:
        pass
```

#### 1.3 Frontend Admin UI (`components/features/settings/embedding-admin.tsx`)
```typescript
// New component for monitoring and manually retrying DLQ items
export function EmbeddingDeadLetterQueueAdmin() {
  const [dlqItems, setDlqItems] = useState<DLQItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to DLQ updates
    const channel = supabase
      .channel('dlq-changes')
      .on('postgres_changes', {
        schema: 'public',
        table: 'embedding_dead_letter_queue',
        event: '*'
      }, () => {
        loadDLQItems();
      })
      .subscribe();

    loadDLQItems();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const loadDLQItems = async () => {
    const { data } = await supabase
      .from('embedding_dead_letter_queue')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setDlqItems(data);
  };

  const handleRetry = async (id: string, userId: string) => {
    await fetch('/api/embeddings/retry-dlq', {
      method: 'POST',
      body: JSON.stringify({ id, user_id: userId })
    });
    toast.success('Retry queued');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Failed Embedding Retries</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Failures</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Next Retry</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dlqItems.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.profiles?.name || item.user_id}</TableCell>
                <TableCell>{item.retry_count}/3</TableCell>
                <TableCell className="max-w-xs truncate">{item.failure_reason}</TableCell>
                <TableCell>{item.next_retry ? formatDistance(new Date(item.next_retry), new Date()) : 'N/A'}</TableCell>
                <TableCell>
                  {item.status === 'pending' && (
                    <Button size="sm" onClick={() => handleRetry(item.id, item.user_id)}>
                      Retry Now
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

#### 1.4 API Route for Manual Retry (`app/api/embeddings/retry-dlq/route.ts`)
```typescript
export async function POST(req: Request) {
  try {
    const { id, user_id } = await req.json();
    
    // Get DLQ item
    const { data: item } = await supabase
      .from('embedding_dead_letter_queue')
      .select('*')
      .eq('id', id)
      .single();
    
    if (!item) {
      return NextResponse.json({ error: 'DLQ item not found' }, { status: 404 });
    }
    
    // Call Python worker to process immediately
    await fetch(`${PYTHON_WORKER_URL}/generate-embedding`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: item.semantic_text,
        user_id: user_id,
        request_id: crypto.randomUUID()
      })
    });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DLQ retry failed:', error);
    return NextResponse.json({ error: 'Retry failed' }, { status: 500 });
  }
}
```

---

## 🎯 Task 2: Rate Limiting for Python Worker

**Problem:** No protection against queue flooding/abuse  
**Impact:** DoS vulnerability, resource exhaustion  
**Effort:** 2-3 hours

### Implementation Steps

#### 2.1 Database Schema (`supabase/setup/27-rate-limiting.sql`)
```sql
-- Rate limiting tracking table
CREATE TABLE embedding_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX idx_rate_limit_user_window ON embedding_rate_limits(user_id, window_end);

-- RLS Policies
ALTER TABLE embedding_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role can manage all
CREATE POLICY "service_role_manage_rate_limits" ON embedding_rate_limits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own
CREATE POLICY "users_view_own_rate_limits" ON embedding_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Function to check rate limit
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

#### 2.2 Python Worker Rate Limiter (`python-worker/rate_limiter.py`)
```python
from datetime import datetime, timedelta
from typing import Optional, Dict
import asyncio

class RateLimiter:
    """Rate limiter for embedding generation requests"""
    
    def __init__(self, supabase_client):
        self.supabase = supabase_client
        self.cache: Dict[str, dict] = {}
        self.cache_ttl = 60  # seconds
    
    async def check_rate_limit(self, user_id: str) -> dict:
        """
        Check if user is within rate limits
        Returns: {allowed: bool, remaining: int, reset_at: str, retry_after: int}
        """
        # Check cache first
        if user_id in self.cache:
            cached = self.cache[user_id]
            if datetime.utcnow().timestamp() < cached['expires']:
                return cached['result']
        
        # Call database function
        try:
            response = self.supabase.rpc(
                "check_embedding_rate_limit",
                {"p_user_id": user_id}
            ).execute()
            
            if response.data and len(response.data) > 0:
                result = response.data[0]
                rate_limit_result = {
                    "allowed": result["allowed"],
                    "remaining": result["remaining"],
                    "reset_at": result["reset_at"],
                    "retry_after": self._calculate_retry_after(result["reset_at"])
                }
                
                # Cache result
                self.cache[user_id] = {
                    "result": rate_limit_result,
                    "expires": datetime.utcnow().timestamp() + self.cache_ttl
                }
                
                return rate_limit_result
            
            # Fallback: allow if DB check fails
            return {"allowed": True, "remaining": 3, "reset_at": None, "retry_after": 0}
            
        except Exception as e:
            logger.error(f"Rate limit check failed: {e}")
            # Fail open - allow request if rate limiting fails
            return {"allowed": True, "remaining": 3, "reset_at": None, "retry_after": 0}
    
    def _calculate_retry_after(self, reset_at: str) -> int:
        """Calculate seconds until rate limit resets"""
        if not reset_at:
            return 0
        reset_time = datetime.fromisoformat(reset_at.replace('Z', '+00:00'))
        delta = reset_time - datetime.utcnow()
        return max(0, int(delta.total_seconds()))
    
    def clear_cache(self, user_id: str):
        """Clear rate limit cache for user (e.g., after successful generation)"""
        if user_id in self.cache:
            del self.cache[user_id]
```

#### 2.3 Integrate Rate Limiter (`python-worker/main.py`)
```python
# Add rate limiter instance
rate_limiter = RateLimiter(supabase)

@app.post("/generate-embedding")
async def generate_embedding_endpoint(request: EmbeddingRequest):
    """Generate embedding for user with rate limiting"""
    
    # Check rate limit
    rate_limit_result = await rate_limiter.check_rate_limit(request.user_id)
    
    if not rate_limit_result["allowed"]:
        logger.warning(f"Rate limit exceeded for user {request.user_id}")
        raise HTTPException(
            status_code=429,
            detail={
                "error": "Rate limit exceeded",
                "message": "Maximum 3 embedding requests per hour",
                "retry_after": rate_limit_result["retry_after"],
                "reset_at": rate_limit_result["reset_at"]
            },
            headers={
                "Retry-After": str(rate_limit_result["retry_after"]),
                "X-RateLimit-Remaining": str(rate_limit_result["remaining"]),
                "X-RateLimit-Reset": rate_limit_result["reset_at"] or ""
            }
        )
    
    # Continue with normal processing...
```

#### 2.4 Frontend Rate Limit Handling (`lib/services/embeddings.ts`)
```typescript
export class RateLimitError extends Error {
  retryAfter: number;
  resetAt: string;
  remaining: number;

  constructor(message: string, retryAfter: number, resetAt: string, remaining: number) {
    super(message);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.resetAt = resetAt;
    this.remaining = remaining;
  }
}

export async function generateUserEmbedding(userId: string): Promise<EmbeddingStatus> {
  try {
    const response = await fetch('/api/embeddings/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    });

    if (response.status === 429) {
      const data = await response.json();
      throw new RateLimitError(
        data.detail.message,
        data.detail.retry_after,
        data.detail.reset_at,
        data.detail.remaining
      );
    }

    if (!response.ok) {
      throw new Error(`Embedding generation failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    if (error instanceof RateLimitError) {
      toast.error(
        `Embedding rate limit exceeded. Try again in ${Math.ceil(error.retryAfter / 60)} minutes.`,
        { duration: 5000 }
      );
    }
    throw error;
  }
}
```

#### 2.5 API Route Rate Limit Response (`app/api/embeddings/generate/route.ts`)
```typescript
// Add to error handling in POST handler
if (workerResponse.status === 429) {
  const rateLimitData = await workerResponse.json();
  return NextResponse.json(rateLimitData.detail, {
    status: 429,
    headers: {
      'Retry-After': rateLimitData.detail.retry_after.toString(),
      'X-RateLimit-Remaining': rateLimitData.detail.remaining.toString(),
      'X-RateLimit-Reset': rateLimitData.detail.reset_at || ''
    }
  });
}
```

---

## 🎯 Task 3: Reliable Onboarding Trigger

**Problem:** Fire-and-forget trigger may fail silently  
**Impact:** New users may not get embeddings generated  
**Effort:** 3-4 hours

### Implementation Steps

#### 3.1 Database Schema (`supabase/setup/28-pending-embeddings.sql`)
```sql
-- Queue for pending embedding requests from onboarding
CREATE TABLE embedding_pending_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  trigger_source TEXT NOT NULL DEFAULT 'onboarding', -- onboarding, manual, admin
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  first_attempt TIMESTAMPTZ,
  last_attempt TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  failure_reason TEXT
);

-- Index for efficient querying
CREATE INDEX idx_pending_queue_status ON embedding_pending_queue(status);
CREATE INDEX idx_pending_queue_created ON embedding_pending_queue(created_at);

-- RLS Policies
ALTER TABLE embedding_pending_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage all
CREATE POLICY "service_role_manage_pending_queue" ON embedding_pending_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own
CREATE POLICY "users_view_own_pending_queue" ON embedding_pending_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Realtime enabled
ALTER PUBLICATION supabase_realtime ADD TABLE embedding_pending_queue;

-- Function to queue embedding request
CREATE OR REPLACE FUNCTION queue_embedding_request(
  p_user_id UUID,
  p_trigger_source TEXT DEFAULT 'onboarding'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  -- Check if already queued or completed
  IF EXISTS (
    SELECT 1 FROM embedding_pending_queue
    WHERE user_id = p_user_id AND status IN ('pending', 'processing')
  ) THEN
    RAISE EXCEPTION 'Embedding request already pending for user %', p_user_id;
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM profile_embeddings
    WHERE user_id = p_user_id AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'User already has completed embedding';
  END IF;
  
  -- Insert pending request
  INSERT INTO embedding_pending_queue (user_id, trigger_source, status)
  VALUES (p_user_id, p_trigger_source, 'pending')
  RETURNING id INTO v_id;
  
  -- Notify workers via realtime
  NOTIFY embedding_queue_changed;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

#### 3.2 Update Onboarding Server Action (`app/(auth)/onboarding/actions.ts`)
```typescript
'use server';

import { createServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function completeOnboarding(formData: FormData) {
  const supabase = createServerClient();
  
  // ... existing profile save logic ...
  
  // RELIABLE: Queue embedding request in database FIRST
  try {
    const { data: queueData, error: queueError } = await supabase
      .rpc('queue_embedding_request', {
        p_user_id: result.userId,
        p_trigger_source: 'onboarding'
      });
    
    if (queueError) {
      console.error('Failed to queue embedding:', queueError);
      // Don't fail onboarding, but log for monitoring
    } else {
      console.log('Embedding queued successfully:', queueData);
    }
  } catch (error) {
    console.error('Embedding queue exception:', error);
  }
  
  // THEN trigger API (best effort)
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/embeddings/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: result.userId }),
      signal: AbortSignal.timeout(5000) // 5s timeout
    });
  } catch (error) {
    // Already queued in DB, background processor will handle
    console.error('Embedding API trigger failed (DB queue will handle):', error);
  }
  
  revalidatePath('/dashboard');
  redirect('/dashboard');
}
```

#### 3.3 Background Processor for Pending Queue (`python-worker/main.py`)
```python
async def process_pending_queue():
    """Process pending embedding requests from database queue"""
    while True:
        try:
            # Get pending requests
            response = supabase.table("embedding_pending_queue")\
                .select("*")\
                .eq("status", "pending")\
                .order("created_at", asc=True)\
                .limit(20)\
                .execute()
            
            for item in response.data:
                try:
                    # Mark as processing
                    supabase.table("embedding_pending_queue")\
                        .update({
                            "status": "processing",
                            "first_attempt": datetime.utcnow().isoformat()
                        })\
                        .eq("id", item["id"])\
                        .execute()
                    
                    # Get user profile data
                    profile_response = supabase.from("profiles")\
                        .select("id, display_name, headline, bio, location")\
                        .eq("id", item["user_id"])\
                        .single()\
                        .execute()
                    
                    skills_response = supabase.from("user_skills")\
                        .select("skill")\
                        .eq("user_id", item["user_id"])\
                        .execute()
                    
                    interests_response = supabase.from("user_interests")\
                        .select("interest")\
                        .eq("user_id", item["user_id"])\
                        .execute()
                    
                    # Construct semantic text
                    semantic_text = construct_semantic_text(
                        profile_response.data,
                        skills_response.data,
                        interests_response.data
                    )
                    
                    # Generate embedding
                    embedding = await generator.generate_embedding(semantic_text)
                    
                    # Store embedding
                    await store_embedding(item["user_id"], embedding, semantic_text)
                    
                    # Mark queue item as completed
                    supabase.table("embedding_pending_queue")\
                        .update({
                            "status": "completed",
                            "completed_at": datetime.utcnow().isoformat()
                        })\
                        .eq("id", item["id"])\
                        .execute()
                    
                except Exception as e:
                    logger.error(f"Pending queue processing failed for {item['user_id']}: {e}")
                    supabase.table("embedding_pending_queue")\
                        .update({
                            "status": "failed",
                            "last_attempt": datetime.utcnow().isoformat(),
                            "failure_reason": str(e)
                        })\
                        .eq("id", item["id"])\
                        .execute()
                    
                    # Move to DLQ for retry
                    await store_in_dead_letter_queue(
                        user_id=item["user_id"],
                        semantic_text="",
                        failure_reason=str(e),
                        retry_count=0
                    )
            
            # Wait before next poll
            await asyncio.sleep(10)
            
        except Exception as e:
            logger.error(f"Pending queue processor error: {e}")
            await asyncio.sleep(30)
```

**Add to lifespan:**
```python
dlq_processor_task = asyncio.create_task(process_dead_letter_queue())
pending_queue_task = asyncio.create_task(process_pending_queue())

yield

dlq_processor_task.cancel()
pending_queue_task.cancel()
try:
    await dlq_processor_task
    await pending_queue_task
except asyncio.CancelledError:
    pass
```

#### 3.4 Admin Dashboard UI (`app/(auth)/dashboard/embedding-queue-admin/page.tsx`)
```typescript
'use client';

export default function EmbeddingQueueAdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Embedding Queue Administration</h1>
      
      <EmbeddingPendingQueue />
      <EmbeddingDeadLetterQueueAdmin />
    </div>
  );
}

function EmbeddingPendingQueue() {
  const [pending, setPending] = useState([]);
  
  useEffect(() => {
    const channel = supabase
      .channel('pending-queue-changes')
      .on('postgres_changes', {
        schema: 'public',
        table: 'embedding_pending_queue',
        event: '*'
      }, () => loadPending())
      .subscribe();
    
    loadPending();
    return () => { supabase.removeChannel(channel); };
  }, []);
  
  const loadPending = async () => {
    const { data } = await supabase
      .from('embedding_pending_queue')
      .select('*, profiles(name, email)')
      .order('created_at', { ascending: false })
      .limit(50);
    if (data) setPending(data);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Pending Embedding Requests</CardTitle>
        <CardDescription>
          Users waiting for embedding generation from onboarding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Queued At</TableHead>
              <TableHead>Attempts</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {pending.map(item => (
              <TableRow key={item.id}>
                <TableCell>{item.profiles?.name || item.user_id}</TableCell>
                <TableCell>
                  <Badge variant={item.trigger_source === 'onboarding' ? 'default' : 'secondary'}>
                    {item.trigger_source}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={
                    item.status === 'completed' ? 'default' :
                    item.status === 'failed' ? 'destructive' :
                    'secondary'
                  }>
                    {item.status}
                  </Badge>
                </TableCell>
                <TableCell>{formatDistance(new Date(item.created_at), new Date())} ago</TableCell>
                <TableCell>{item.last_attempt ? 'Yes' : 'No'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
```

#### 3.5 Monitoring Hook (`hooks/use-embedding-queue-status.ts`)
```typescript
'use client';

export function useEmbeddingQueueStatus(userId: string) {
  const [status, setStatus] = useState<{
    pending: boolean;
    processing: boolean;
    completed: boolean;
    failed: boolean;
  } | null>(null);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`embedding-queue-${userId}`)
      .on('postgres_changes', {
        schema: 'public',
        table: 'embedding_pending_queue',
        filter: `user_id=eq.${userId}`,
        event: '*'
      }, async () => {
        await loadStatus();
      })
      .subscribe();

    loadStatus();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const loadStatus = async () => {
    const { data } = await supabase
      .from('embedding_pending_queue')
      .select('status')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (data && data.length > 0) {
      setStatus({
        pending: data[0].status === 'pending',
        processing: data[0].status === 'processing',
        completed: data[0].status === 'completed',
        failed: data[0].status === 'failed'
      });
    }
  };

  return status;
}
```

---

## 🎯 Task 4: Embedding Quality Validation

**Problem:** No validation of generated embeddings before storage  
**Impact:** Corrupted embeddings may be stored and used for matching  
**Effort:** 2-3 hours

### Implementation Steps

#### 4.1 Validation Module (`python-worker/embedding_validator.py`)
```python
import math
from typing import List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum

class ValidationStatus(Enum):
    VALID = "valid"
    INVALID_DIMENSION = "invalid_dimension"
    CONTAINS_NAN = "contains_nan"
    CONTAINS_INF = "contains_inf"
    NOT_NORMALIZED = "not_normalized"
    ALL_ZEROS = "all_zeros"

@dataclass
class ValidationResult:
    is_valid: bool
    status: ValidationStatus
    message: str
    details: dict

class EmbeddingValidator:
    """Validates embedding quality before storage"""
    
    EXPECTED_DIMENSION = 384
    NORMALIZATION_TOLERANCE = 0.05  # Allow 5% deviation from 1.0
    MIN_MAGNITUDE = 1.0 - NORMALIZATION_TOLERANCE
    MAX_MAGNITUDE = 1.0 + NORMALIZATION_TOLERANCE
    
    @classmethod
    def validate(cls, embedding: List[float]) -> ValidationResult:
        """
        Validate embedding quality
        Returns ValidationResult with is_valid flag and details
        """
        # Check 1: Dimension
        if len(embedding) != cls.EXPECTED_DIMENSION:
            return ValidationResult(
                is_valid=False,
                status=ValidationStatus.INVALID_DIMENSION,
                message=f"Expected {cls.EXPECTED_DIMENSION} dimensions, got {len(embedding)}",
                details={"expected": cls.EXPECTED_DIMENSION, "actual": len(embedding)}
            )
        
        # Check 2: NaN values
        if any(math.isnan(v) for v in embedding):
            nan_count = sum(1 for v in embedding if math.isnan(v))
            return ValidationResult(
                is_valid=False,
                status=ValidationStatus.CONTAINS_NAN,
                message=f"Embedding contains {nan_count} NaN values",
                details={"nan_count": nan_count}
            )
        
        # Check 3: Infinity values
        if any(math.isinf(v) for v in embedding):
            inf_count = sum(1 for v in embedding if math.isinf(v))
            return ValidationResult(
                is_valid=False,
                status=ValidationStatus.CONTAINS_INF,
                message=f"Embedding contains {inf_count} Infinity values",
                details={"inf_count": inf_count}
            )
        
        # Check 4: All zeros
        if all(v == 0 for v in embedding):
            return ValidationResult(
                is_valid=False,
                status=ValidationStatus.ALL_ZEROS,
                message="Embedding is all zeros",
                details={"magnitude": 0}
            )
        
        # Check 5: Normalization (magnitude should be ~1.0 for normalized embeddings)
        magnitude = math.sqrt(sum(v * v for v in embedding))
        if magnitude < cls.MIN_MAGNITUDE or magnitude > cls.MAX_MAGNITUDE:
            return ValidationResult(
                is_valid=False,
                status=ValidationStatus.NOT_NORMALIZED,
                message=f"Embedding magnitude {magnitude:.4f} outside acceptable range [{cls.MIN_MAGNITUDE:.4f}, {cls.MAX_MAGNITUDE:.4f}]",
                details={
                    "magnitude": magnitude,
                    "min_allowed": cls.MIN_MAGNITUDE,
                    "max_allowed": cls.MAX_MAGNITUDE
                }
            )
        
        # All checks passed
        return ValidationResult(
            is_valid=True,
            status=ValidationStatus.VALID,
            message="Embedding validation passed",
            details={
                "dimension": len(embedding),
                "magnitude": magnitude,
                "min_value": min(embedding),
                "max_value": max(embedding),
                "mean_value": sum(embedding) / len(embedding)
            }
        )
    
    @classmethod
    def normalize(cls, embedding: List[float]) -> List[float]:
        """Normalize embedding to unit vector"""
        magnitude = math.sqrt(sum(v * v for v in embedding))
        if magnitude == 0:
            return embedding
        return [v / magnitude for v in embedding]
    
    @classmethod
    def validate_and_fix(cls, embedding: List[float]) -> Tuple[List[float], ValidationResult]:
        """
        Validate embedding and attempt to fix minor issues
        Returns (fixed_embedding, validation_result)
        """
        # First validate
        result = cls.validate(embedding)
        
        if result.is_valid:
            return embedding, result
        
        # Attempt fixes for specific issues
        if result.status == ValidationStatus.NOT_NORMALIZED:
            # Try normalizing
            normalized = cls.normalize(embedding)
            new_result = cls.validate(normalized)
            if new_result.is_valid:
                return normalized, new_result
        
        # Cannot fix, return original with validation error
        return embedding, result
```

#### 4.2 Integrate Validator (`python-worker/embedding_generator.py`)
```python
from embedding_validator import EmbeddingValidator, ValidationResult

class EmbeddingGenerator:
    # ... existing code ...
    
    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding with validation"""
        # ... existing generation logic ...
        
        # VALIDATE before returning
        embedding, validation_result = EmbeddingValidator.validate_and_fix(raw_embedding)
        
        if not validation_result.is_valid:
            logger.error(f"Embedding validation failed: {validation_result.message}")
            raise ValueError(f"Invalid embedding: {validation_result.message}")
        
        logger.info(f"Embedding validated: {validation_result.details}")
        return embedding
```

#### 4.3 Update Store Function (`python-worker/main.py`)
```python
async def store_embedding(user_id: str, embedding: List[float], semantic_text: str):
    """Store embedding with validation metadata"""
    try:
        # Double-check validation before storage
        validation_result = EmbeddingValidator.validate(embedding)
        
        if not validation_result.is_valid:
            logger.error(f"Pre-storage validation failed: {validation_result.message}")
            raise ValueError(f"Invalid embedding cannot be stored: {validation_result.message}")
        
        # Store with validation metadata
        supabase.table("profile_embeddings").upsert({
            "user_id": user_id,
            "embedding": embedding,
            "status": "completed",
            "last_updated": datetime.utcnow().isoformat(),
            "metadata": {
                "validation": validation_result.details,
                "model": "sentence-transformers/all-MiniLM-L6-v2",
                "dimensions": len(embedding),
                "validated_at": datetime.utcnow().isoformat()
            }
        }).execute()
        
        logger.info(f"Embedding stored successfully for {user_id}")
        
    except Exception as e:
        logger.error(f"Failed to store embedding for {user_id}: {e}")
        raise
```

#### 4.4 Database Validation Constraints (`supabase/setup/29-validation-constraints.sql`)
```sql
-- Add validation check constraint
ALTER TABLE profile_embeddings
ADD CONSTRAINT check_embedding_dimension 
CHECK (vector_dims(embedding) = 384);

-- Add validation check for NaN/Infinity (PostgreSQL vector type doesn't support these)
-- This is implicit in the vector type, but we add a trigger for extra safety

CREATE OR REPLACE FUNCTION validate_embedding_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Check dimension
  IF vector_dims(NEW.embedding) != 384 THEN
    RAISE EXCEPTION 'Invalid embedding dimension: expected 384, got %', vector_dims(NEW.embedding);
  END IF;
  
  -- Check for null values (should not happen with vector type)
  IF NEW.embedding IS NULL THEN
    RAISE EXCEPTION 'Embedding cannot be null';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_embedding
  BEFORE INSERT OR UPDATE ON profile_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION validate_embedding_before_insert();
```

#### 4.5 Frontend Validation Display (`components/features/settings/embedding-quality.tsx`)
```typescript
'use client';

export function EmbeddingQualityIndicator({ userId }: { userId: string }) {
  const [quality, setQuality] = useState<{
    status: 'valid' | 'invalid' | 'unknown';
    details?: any;
  } | null>(null);

  useEffect(() => {
    const loadQuality = async () => {
      const { data } = await supabase
        .from('profile_embeddings')
        .select('metadata')
        .eq('user_id', userId)
        .single();
      
      if (data?.metadata?.validation) {
        setQuality({
          status: 'valid',
          details: data.metadata.validation
        });
      } else if (data) {
        setQuality({ status: 'unknown' });
      } else {
        setQuality({ status: 'invalid' });
      }
    };

    loadQuality();
  }, [userId]);

  if (quality?.status === 'valid' && quality.details) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Embedding Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Dimensions:</span>
              <span className="ml-2 font-mono">{quality.details.dimension}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Magnitude:</span>
              <span className="ml-2 font-mono">{quality.details.magnitude?.toFixed(4)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Value Range:</span>
              <span className="ml-2 font-mono">
                [{quality.details.min_value?.toFixed(4)}, {quality.details.max_value?.toFixed(4)}]
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Validated:</span>
              <span className="ml-2">
                {formatDistance(new Date(quality.details.validated_at), new Date())} ago
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
}
```

---

## 📊 Implementation Timeline

| Week | Tasks | Estimated Hours |
|------|-------|-----------------|
| **Week 1** | Task 1 (DLQ) + Task 4 (Validation) | 5-7 hours |
| **Week 2** | Task 2 (Rate Limiting) + Task 3 (Onboarding) | 5-7 hours |
| **Week 3** | Testing, Documentation, Deployment | 3-4 hours |

---

## 🧪 Testing Requirements

### Unit Tests
- [ ] `embedding_validator.py` - All validation scenarios
- [ ] `rate_limiter.py` - Rate limit boundary conditions
- [ ] DLQ processor - Retry logic

### Integration Tests
- [ ] End-to-end onboarding flow with embedding
- [ ] Rate limit enforcement (429 responses)
- [ ] DLQ retry mechanism
- [ ] Pending queue processing

### Load Tests
- [ ] 100 concurrent embedding requests
- [ ] Queue overflow scenarios
- [ ] Python worker restart with pending items

---

## 📝 Migration Steps

1. **Run SQL migrations** (in order):
   - `26-dead-letter-queue.sql`
   - `27-rate-limiting.sql`
   - `28-pending-embeddings.sql`
   - `29-validation-constraints.sql`

2. **Deploy Python worker updates**:
   - Add `embedding_validator.py`
   - Add `rate_limiter.py`
   - Update `main.py` with DLQ processor, pending queue, rate limiting
   - Update `embedding_generator.py` with validation

3. **Deploy frontend updates**:
   - Add admin UI components
   - Update onboarding actions
   - Add rate limit error handling

4. **Verify**:
   - Check all tables exist
   - Test embedding generation flow
   - Verify rate limiting works
   - Confirm DLQ captures failures

---

## ✅ Success Criteria

- [ ] Failed embeddings automatically retried (max 3 attempts)
- [ ] Rate limiting enforced (3 requests/hour/user)
- [ ] Onboarding never fails due to embedding issues
- [ ] All stored embeddings pass validation
- [ ] Admin dashboard shows queue status
- [ ] No corrupted embeddings in database
