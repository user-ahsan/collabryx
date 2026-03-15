# Remaining Fixes Plan (Items 6-10)

## Status Summary

### ✅ Completed (Items 1-5)

1. **Auth-sync with embedding wait** - ✅ DONE (Commit: 872e159)
   - Auth-sync allows dashboard access while waiting for embedding
   - Shows detailed embedding status with progress indicator
   - Random posts fallback for users without embeddings
   - Feed checks embedding status automatically

2. **Database function `queue_embedding_request`** - ✅ DONE (Commit: 952afcf)
   - Added to `supabase/setup/100-helper-functions.sql`
   - Prevents duplicate embedding requests
   - Creates placeholder in profile_embeddings
   - Returns JSON with success status

3. **Python worker error recovery** - ✅ DONE (Commit: 7a36149)
   - Comprehensive error recovery in `store_in_dead_letter_queue()`
   - Fallback logging for critical failures
   - Guaranteed DLQ storage in pending queue processor
   - Critical logging for manual intervention

4. **Circuit breaker health cache** - ✅ DONE (Commit: 7a36149)
   - Reduced cache TTL from 30s to 10s
   - Reduced circuit breaker timeout from 30s to 15s
   - Faster failure detection and recovery

5. **Random posts for new users** - ✅ DONE (Commit: 872e159)
   - Feed component checks embedding status
   - Fetches random posts when no embedding exists
   - Shows info banner during personalization

---

## 📋 Remaining Fixes (Items 6-10)

### 6. React Query Cache Clearing on Logout
**Severity:** MEDIUM  
**Location:** `app/(auth)/layout.tsx:15-22`, `lib/supabase/client.ts`

**Issue:**
```typescript
// Query client created ONCE at module level
const queryClient = new QueryClient({...})

// Problem: Cache never clears on logout
// User A's data may be visible to User B if they share device
```

**Fix Required:**
```typescript
// Option 1: Clear cache in auth layout on unmount
useEffect(() => {
  return () => {
    queryClient.clear() // Clear cache on unmount
  }
}, [])

// Option 2: Clear cache on logout action
async function handleLogout() {
  await supabase.auth.signOut()
  queryClient.clear() // Clear all cached data
  router.push('/login')
}

// Option 3: Use React Query persistence with user-scoped keys
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: (queryKey) => {
        // Include user ID in cache key
        const userId = getCurrentUserId()
        return `${userId}-${JSON.stringify(queryKey)}`
      }
    }
  }
})
```

**Files to Modify:**
- `app/(auth)/layout.tsx` - Add cache clearing on logout
- `hooks/use-auth.ts` - Add cache clearing to logout function
- `components/providers/query-provider.tsx` - Consider user-scoped caching

**Estimated Time:** 30 minutes  
**Priority:** HIGH (Security issue - data leakage between users)

---

### 7. Missing CSRF Tokens on API Routes
**Severity:** MEDIUM  
**Location:** `app/api/embeddings/generate/route.ts:108`, `lib/csrf.ts`

**Issue:**
```typescript
// API route accepts POST without CSRF validation
export async function POST(request: NextRequest) {
  // No CSRF token validation!
  const supabase = await createClient()
  // ...
}
```

**Fix Required:**
```typescript
import { validateCsrfToken, generateCsrfToken } from '@/lib/csrf'

export async function POST(request: NextRequest) {
  // Validate CSRF token
  const csrfToken = request.headers.get('x-csrf-token')
  const isValid = await validateCsrfToken(csrfToken, request)
  
  if (!isValid) {
    return NextResponse.json(
      { error: 'Invalid CSRF token' },
      { status: 403 }
    )
  }
  
  // ... rest of handler
}

// For GET requests that need CSRF token
export async function GET(request: NextRequest) {
  const token = generateCsrfToken()
  return NextResponse.json({ csrfToken: token })
}
```

**Frontend Changes:**
```typescript
// Add CSRF token to fetch requests
const csrfToken = await getCsrfToken()
await fetch('/api/embeddings/generate', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken
  },
  body: JSON.stringify({ user_id: userId })
})
```

**Files to Modify:**
- `app/api/embeddings/generate/route.ts` - Add CSRF validation
- `app/api/embeddings/retry-dlq/route.ts` - Add CSRF validation
- `app/api/chat/route.ts` - Add CSRF validation
- `lib/csrf.ts` - Export helper for frontend
- `hooks/use-csrf.ts` (NEW) - CSRF token management hook

**Estimated Time:** 1-2 hours  
**Priority:** HIGH (Security vulnerability)

---

### 8. Python Worker Graceful Shutdown
**Severity:** MEDIUM  
**Location:** `python-worker/main.py:82-94`

**Issue:**
```python
# Tasks cancelled abruptly
processor_task.cancel()
dlq_processor_task.cancel()
pending_queue_task.cancel()

# No waiting for in-flight embeddings to complete
```

**Fix Required:**
```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage application lifecycle with graceful shutdown"""
    validate_env_vars()
    logger.info("Starting background queue processor...")
    processor_task = asyncio.create_task(queue_processor())
    dlq_processor_task = asyncio.create_task(process_dead_letter_queue())
    pending_queue_task = asyncio.create_task(process_pending_queue())
    
    yield
    
    # Graceful shutdown
    logger.info("Shutting down embedding service...")
    
    # Signal workers to stop accepting new items
    SHUTDOWN_FLAG = True
    
    # Wait for queue to drain (with timeout)
    logger.info("Waiting for queue to drain...")
    try:
        await asyncio.wait_for(request_queue.join(), timeout=30.0)
        logger.info("Queue drained successfully")
    except asyncio.TimeoutError:
        logger.warning("Queue drain timeout - some items may be lost")
    
    # Cancel background tasks
    logger.info("Cancelling background tasks...")
    for task in [processor_task, dlq_processor_task, pending_queue_task]:
        task.cancel()
        try:
            await asyncio.wait_for(task, timeout=5.0)
        except (asyncio.CancelledError, asyncio.TimeoutError):
            pass
    
    logger.info("Embedding service shut down complete")
```

**Files to Modify:**
- `python-worker/main.py` - Add graceful shutdown logic
- `python-worker/main.py` - Add SHUTDOWN_FLAG global
- `python-worker/main.py` - Check SHUTDOWN_FLAG in queue processors

**Estimated Time:** 1 hour  
**Priority:** MEDIUM (Data loss risk during deployments)

---

### 9. Comprehensive Environment Variable Validation
**Severity:** MEDIUM  
**Location:** `lib/supabase/client.ts:4-6`, `lib/supabase/server.ts:7-9`, `lib/validate-env.ts`

**Issue:**
```typescript
// No validation - will throw cryptic errors
process.env.NEXT_PUBLIC_SUPABASE_URL!  // Bang operator hides issue
```

**Fix Required:**
```typescript
// lib/validate-env.ts (enhanced)
export function validateEnv() {
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
  ]
  
  const optional = [
    'PYTHON_WORKER_URL',
    'BACKEND_MODE',
    'BACKEND_URL_DOCKER',
    'BACKEND_URL_RENDER',
  ]
  
  const missing = required.filter(key => !process.env[key])
  
  if (missing.length > 0) {
    const errorMsg = `Missing required environment variables: ${missing.join(', ')}`
    console.error('❌ ENV VALIDATION FAILED:', errorMsg)
    throw new Error(errorMsg)
  }
  
  // Validate Supabase URL format
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl?.startsWith('https://')) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL must start with https://')
    throw new Error('Invalid Supabase URL format')
  }
  
  // Validate Python worker URL if backend mode is not 'edge-only'
  const backendMode = process.env.BACKEND_MODE || 'auto'
  if (backendMode !== 'edge-only') {
    if (backendMode === 'docker' && !process.env.BACKEND_URL_DOCKER) {
      console.warn('⚠️ BACKEND_MODE=docker but BACKEND_URL_DOCKER not set')
    }
    if (backendMode === 'render' && !process.env.BACKEND_URL_RENDER) {
      console.warn('⚠️ BACKEND_MODE=render but BACKEND_URL_RENDER not set')
    }
  }
  
  console.log('✅ Environment validation passed')
}
```

**Usage:**
```typescript
// app/layout.tsx (already done)
if (process.env.NODE_ENV === 'development') {
  validateEnv()
}

// Add runtime validation for production
export async function validateEnvRuntime() {
  if (process.env.NODE_ENV === 'production') {
    validateEnv()
  }
}
```

**Files to Modify:**
- `lib/validate-env.ts` - Enhance with comprehensive validation
- `app/layout.tsx` - Already calls validateEnv (done)
- `lib/supabase/client.ts` - Add runtime check
- `lib/supabase/server.ts` - Add runtime check

**Estimated Time:** 45 minutes  
**Priority:** MEDIUM (Better error messages, prevents silent failures)

---

### 10. Auth Callback Error Logging
**Severity:** LOW  
**Location:** `app/api/auth/callback/route.ts:23`

**Issue:**
```typescript
// Error logged nowhere
if (!error) {
  // redirect
}
// Error silently ignored, user redirected to login
```

**Fix Required:**
```typescript
import { createClient } from "@/lib/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const code = searchParams.get("code")
    const next = searchParams.get("next") ?? "/dashboard"

    if (code) {
        const supabase = await createClient()
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        
        if (!error) {
            const forwardedHost = request.headers.get("x-forwarded-host")
            const isLocalEnv = process.env.NODE_ENV === "development"
            
            // Log successful auth
            console.log('✅ Auth callback successful, redirecting to:', next)
            
            if (isLocalEnv) {
                return NextResponse.redirect(`${origin}${next}`)
            } else if (forwardedHost) {
                return NextResponse.redirect(`https://${forwardedHost}${next}`)
            } else {
                return NextResponse.redirect(`${origin}${next}`)
            }
        } else {
            // Log error with details
            console.error('❌ Auth callback error:', {
                error: error.message,
                status: error.status,
                code: error.code,
                timestamp: new Date().toISOString(),
                url: request.url,
            })
            
            // Send to external monitoring if configured (Sentry, etc.)
            if (process.env.SENTRY_DSN) {
                // await Sentry.captureException(error, {
                //     tags: { type: 'auth_callback_error' },
                //     extra: { url: request.url }
                // })
            }
            
            // Redirect with error message
            return NextResponse.redirect(
                `${origin}/login?error=${encodeURIComponent(error.message)}`
            )
        }
    }

    // Missing code parameter
    console.error('❌ Auth callback missing code parameter')
    return NextResponse.redirect(`${origin}/login?error=auth_callback_error`)
}
```

**Files to Modify:**
- `app/api/auth/callback/route.ts` - Add comprehensive error logging
- Consider adding Sentry integration for production error tracking

**Estimated Time:** 30 minutes  
**Priority:** LOW (Better debugging, monitoring)

---

## 📊 Implementation Priority

### Immediate (This Week)
- [ ] **#6: React Query cache clearing** - Security issue
- [ ] **#7: CSRF tokens** - Security vulnerability

### Short-term (Next Sprint)
- [ ] **#8: Python worker graceful shutdown** - Data loss prevention
- [ ] **#9: Environment validation** - Better DX

### Medium-term (Backlog)
- [ ] **#10: Auth callback logging** - Better debugging

---

## 🎯 Testing Plan

### For Each Fix:

1. **Unit Tests**
   - Write tests for new functions
   - Test edge cases

2. **Integration Tests**
   - Test with Supabase local development
   - Test Python worker locally with Docker

3. **E2E Tests**
   - Test complete user flows
   - Test error scenarios

4. **Manual Testing**
   - Test in development environment
   - Test in staging environment (if available)

---

## 📝 Notes

- All fixes should follow existing code conventions
- Use TypeScript strict mode (no `any` types)
- Add comments for complex logic
- Update AGENTS.md after completion
- Create migration guide if database changes needed

---

**Last Updated:** 2026-03-16  
**Author:** Development Team  
**Status:** Items 1-5 Complete, Items 6-10 Pending
