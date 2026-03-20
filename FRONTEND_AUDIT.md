# Frontend Audit: Draft/Session Ownership Verification

**Date:** 2026-03-20  
**Auditor:** Frontend Expert Agent  
**Branch:** `agent/frontend/draft-ownership-review`  
**Base Branch:** `coordinator/session-2026-03-20-draft-ownership`

---

## Executive Summary

The frontend implementation for AI Mentor sessions **relies entirely on backend security** for ownership verification. There are **no client-side ownership checks** before displaying session history. The vulnerability in `getSessionHistory()` (missing `user_id` filter) means any authenticated user could potentially access another user's session messages if they know the session ID.

**Risk Level:** 🔴 HIGH  
**Affected Components:** 2  
**Data Flow:** Session ID flows from Server Component → Client Component → Server Action → Database

---

## 1. Affected Frontend Components

### 1.1 `components/features/assistant/chat-list.tsx` ⚠️

**File:** `D:\Projects\collabryx\components\features\assistant\chat-list.tsx`

**Usage:**
```typescript
import { getSessionHistory } from "@/lib/actions/ai-mentor"

export function ChatList({ sessionId }: ChatListProps) {
    useEffect(() => {
        const loadMessages = async () => {
            const result = await getSessionHistory(sessionId)
            if (result.error) {
                console.error("Failed to load messages:", result.error)
                return  // ❌ No ownership validation
            }
            setMessages(result.data || [])
        }
        loadMessages()
    }, [sessionId])
}
```

**Issues Identified:**
- ❌ No client-side ownership verification before calling `getSessionHistory()`
- ❌ Only checks `if (result.error)` - doesn't validate ownership
- ❌ Displays all returned messages without verification
- ❌ No handling for "access denied" or "unauthorized" scenarios
- ✅ Does guard against null `sessionId`

**Lines Affected:** 7, 27-34

---

### 1.2 `app/(auth)/assistant/page.tsx` ⚠️

**File:** `D:\Projects\collabryx\app\(auth)\assistant\page.tsx`

**Usage:**
```typescript
import { getOrCreateActiveSession } from "@/lib/actions/ai-mentor"

export default function AssistantPage() {
    useEffect(() => {
        const loadSession = async () => {
            const result = await getOrCreateActiveSession()
            if (result.error) {
                toast.error("Failed to load AI Mentor session")
                return
            }
            setSessionId(result.data.id)  // ✅ Session created with user_id filter
        }
        loadSession()
    }, [])

    return <ChatList sessionId={sessionId} />
}
```

**Issues Identified:**
- ✅ `getOrCreateActiveSession()` has proper ownership verification (filters by `user_id`)
- ⚠️ Passes `sessionId` to `ChatList` without any ownership metadata
- ❌ No mechanism to validate that the session belongs to the current user before rendering
- ✅ Protected by `(auth)` route group (requires authentication)

**Lines Affected:** 11, 78-89, 140

---

## 2. Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DATA FLOW: SESSION HISTORY                       │
└─────────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────┐
│   Browser    │     │  Next.js     │     │  Server      │     │Supabase  │
│   (Client)   │     │  App Router  │     │  Action      │     │Database  │
└──────┬───────┘     └──────┬───────┘     └──────┬───────┘     └────┬─────┘
       │                    │                     │                  │
       │ 1. Request /assistant                   │                  │
       │───────────────────>│                     │                  │
       │                    │                     │                  │
       │                    │ 2. getOrCreateActiveSession()          │
       │                    │────────────────────>│                  │
       │                    │                     │                  │
       │                    │                     │ 3. SELECT FROM   │
       │                    │                     │ ai_mentor_sessions│
       │                    │                     │ WHERE user_id = ?│
       │                    │                     │─────────────────>│
       │                    │                     │                  │
       │                    │                     │ 4. Session data  │
       │                    │                     │<─────────────────│
       │                    │                     │ (✅ FILTERED)    │
       │                    │ 5. Session ID      │                  │
       │                    │<────────────────────│                  │
       │ 6. sessionId prop  │                     │                  │
       │<───────────────────│                     │                  │
       │                    │                     │                  │
       │ 7. ChatList component renders            │                  │
       │                    │                     │                  │
       │ 8. useEffect triggers                    │                  │
       │                    │                     │                  │
       │ 9. getSessionHistory(sessionId)          │                  │
       │─────────────────────────────────────────>│                  │
       │                    │                     │                  │
       │                    │                     │ 10. SELECT FROM  │
       │                    │                     │ ai_mentor_messages│
       │                    │                     │ WHERE session_id=│
       │                    │                     │ ❌ NO user_id!   │
       │                    │                     │─────────────────>│
       │                    │                     │                  │
       │                    │                     │ 11. ALL messages │
       │                    │                     │<─────────────────│
       │                    │                     │ (❌ NOT FILTERED)│
       │                    │ 12. Messages data  │                  │
       │                    │<────────────────────│                  │
       │ 13. Display messages│                    │                  │
       │<───────────────────│                     │                  │
       │                    │                     │                  │
       │ ⚠️ VULNERABILITY: If attacker knows session_id,             │
       │ they can access messages from any session                    │
       └──────────────────────────────────────────────────────────────┘
```

---

## 3. Session ID Flow Analysis

### 3.1 How Session IDs Are Generated

| Source | Method | Security |
|--------|--------|----------|
| **Initial Load** | `getOrCreateActiveSession()` | ✅ Secure - filters by `user_id` |
| **URL Parameters** | Not used | N/A |
| **LocalStorage** | Not used | N/A |
| **API Response** | `/api/chat/route.ts` | ⚠️ Partial - creates with `user_id` but history fetch missing filter |

### 3.2 Route-Level Protection

**Route Group:** `app/(auth)/assistant/`

- ✅ Protected by authentication requirement (all `(auth)` routes)
- ✅ No middleware required - handled by Supabase client
- ❌ No additional session ownership validation at route level
- ❌ No URL parameter validation (session ID not in URL)

### 3.3 Component Props Flow

```
AssistantPage (Server/Client hybrid)
    └─> sessionId (from getOrCreateActiveSession)
        └─> ChatList (Client Component)
            └─> useEffect → getSessionHistory(sessionId)
                └─> Server Action → Database query
                    └─> ❌ Missing user_id filter
```

---

## 4. Missing Client-Side Checks

### 4.1 Current Error Handling

**chat-list.tsx:**
```typescript
if (result.error) {
    console.error("Failed to load messages:", result.error)
    return  // ❌ Generic error handling
}
```

**Issues:**
- No distinction between "unauthorized" vs "not found" vs "network error"
- No user feedback when access is denied
- Silent failure could mask security issues

### 4.2 Recommended Client-Side Validations

| Component | Missing Check | Priority |
|-----------|--------------|----------|
| `ChatList` | Validate session ownership metadata | 🔴 HIGH |
| `ChatList` | Handle 403/401 responses explicitly | 🔴 HIGH |
| `ChatList` | Show "Access Denied" UI state | 🟡 MEDIUM |
| `AssistantPage` | Verify session.user_id matches current user | 🟡 MEDIUM |
| `ChatInput` | Validate session before sending message | 🟢 LOW (already in `sendMessage`) |

---

## 5. Backend Comparison: Secure vs Vulnerable Functions

### 5.1 ✅ Secure: `sendMessage()`

```typescript
export async function sendMessage(sessionId: string, content: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // ✅ OWNERSHIP VERIFICATION
    const { data: session } = await supabase
        .from('ai_mentor_sessions')
        .select('*')
        .eq('id', sessionId)
        .eq('user_id', user.id)  // ← CRITICAL FILTER
        .single()
    
    if (sessionError || !session) {
        return { error: new Error('Session not found') }
    }
    // ... rest of function
}
```

### 5.2 ❌ Vulnerable: `getSessionHistory()`

```typescript
export async function getSessionHistory(sessionId: string) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (authError || !user) {
        return { error: new Error('Unauthorized') }
    }
    
    // ❌ NO OWNERSHIP VERIFICATION
    const { data, error } = await supabase
        .from('ai_mentor_messages')
        .select('*')
        .eq('session_id', sessionId)  // ← ONLY filters by session_id
        .order('created_at', { ascending: true })
    
    // Missing: .eq('user_id', user.id) or session ownership check
    
    return { data }
}
```

### 5.3 ✅ Secure: `getOrCreateActiveSession()`

```typescript
export async function getOrCreateActiveSession() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    // ✅ FILTERS BY user_id
    const { data: existingSession } = await supabase
        .from('ai_mentor_sessions')
        .select('*')
        .eq('user_id', user.id)  // ← CRITICAL FILTER
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single()
    
    if (existingSession) {
        return { data: existingSession }
    }
    
    return createSession()  // Creates with user_id
}
```

---

## 6. Database-Level Security (RLS)

### 6.1 Current RLS Policies

**Table:** `ai_mentor_sessions`
```sql
CREATE POLICY "Users can view own AI mentor sessions" 
    ON public.ai_mentor_sessions 
    FOR SELECT 
    USING ((SELECT auth.uid()) = user_id);
```

**Table:** `ai_mentor_messages`
```sql
CREATE POLICY "Users can view own AI mentor messages" 
    ON public.ai_mentor_messages
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.ai_mentor_sessions s 
            WHERE s.id = ai_mentor_messages.session_id 
            AND s.user_id = (SELECT auth.uid())
        )
    );
```

### 6.2 RLS Effectiveness

| Layer | Protection | Status |
|-------|-----------|--------|
| **Database RLS** | `ai_mentor_messages` joins with sessions table | ✅ Should block unauthorized access |
| **Server Action** | `getSessionHistory()` missing user_id filter | ❌ Relies on RLS only |
| **Client Component** | No ownership validation | ❌ No protection |

**⚠️ Critical Finding:** While RLS policies exist, the frontend should implement **defense in depth** - not rely solely on database-level security.

---

## 7. API Route Analysis

### 7.1 `/api/chat/route.ts`

**Lines 117-123:**
```typescript
// Get conversation history
const { data: messages } = await supabase
    .from('ai_mentor_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(10)
```

**Issues:**
- ❌ No ownership verification before fetching messages
- ⚠️ Relies on RLS policies only
- ✅ Session creation includes `user_id` (line 97-102)

**Usage from Frontend:**
- Currently NOT used by `app/(auth)/assistant/page.tsx`
- Uses Server Actions instead (`lib/actions/ai-mentor.ts`)
- Hook `useAIMentor()` in `hooks/use-new-endpoints.ts` exists but not integrated

---

## 8. Recommendations

### 8.1 Immediate Fixes (Frontend)

#### 8.1.1 Add Ownership Metadata to Session

**File:** `app/(auth)/assistant/page.tsx`

```typescript
// Current
const result = await getOrCreateActiveSession()
setSessionId(result.data.id)

// Recommended
const result = await getOrCreateActiveSession()
if (result.data) {
    setSessionId(result.data.id)
    setSessionOwnerId(result.data.user_id)  // Track owner
}
```

#### 8.1.2 Validate in ChatList Component

**File:** `components/features/assistant/chat-list.tsx`

```typescript
const loadMessages = async () => {
    setIsLoading(true)
    try {
        const result = await getSessionHistory(sessionId)
        
        if (result.error) {
            // ✅ Handle specific error codes
            if (result.error.code === '401' || result.error.code === '403') {
                toast.error("You don't have access to this session")
                setAccessDenied(true)
                return
            }
            console.error("Failed to load messages:", result.error)
            return
        }
        
        // ✅ Validate ownership if metadata available
        if (result.data && result.data.length > 0) {
            // Check session ownership via separate call
            const sessionCheck = await validateSessionOwnership(sessionId)
            if (!sessionCheck.isOwner) {
                setAccessDenied(true)
                return
            }
        }
        
        setMessages(result.data || [])
    } catch (error) {
        console.error("Error loading messages:", error)
    } finally {
        setIsLoading(false)
    }
}
```

#### 8.1.3 Add Access Denied UI State

**File:** `components/features/assistant/chat-list.tsx`

```typescript
const [accessDenied, setAccessDenied] = useState(false)

// Add UI state
if (accessDenied) {
    return (
        <div className="flex items-center justify-center h-full">
            <AlertCircle className="h-8 w-8 text-destructive" />
            <p className="ml-2 text-destructive">Access Denied</p>
        </div>
    )
}
```

### 8.2 Backend Fixes (Required)

**File:** `lib/actions/ai-mentor.ts`

```typescript
export async function getSessionHistory(sessionId: string) {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
        return { error: new Error('Unauthorized') }
    }

    // ✅ ADD OWNERSHIP VERIFICATION
    const { data: session } = await supabase
        .from('ai_mentor_sessions')
        .select('user_id')
        .eq('id', sessionId)
        .eq('user_id', user.id)  // ← CRITICAL
        .single()

    if (!session) {
        return { error: new Error('Session not found or access denied') }
    }

    const { data, error } = await supabase
        .from('ai_mentor_messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })

    if (error) {
        return { error }
    }

    return { data }
}
```

### 8.3 Long-term Improvements

1. **Add Session Ownership Hook**
   ```typescript
   // hooks/use-session-ownership.ts
   export function useSessionOwnership(sessionId: string) {
       const [isOwner, setIsOwner] = useState<boolean | null>(null)
       
       useEffect(() => {
           validateSessionOwnership(sessionId).then(setIsOwner)
       }, [sessionId])
       
       return { isOwner, isLoading: isOwner === null }
   }
   ```

2. **Implement Middleware Protection**
   ```typescript
   // middleware.ts
   export async function middleware(request: NextRequest) {
       if (request.nextUrl.pathname.startsWith('/assistant')) {
           const sessionId = request.nextUrl.searchParams.get('session')
           if (sessionId) {
               // Validate ownership before rendering
               const isValid = await validateSessionAccess(sessionId)
               if (!isValid) {
                   return NextResponse.redirect('/assistant')
               }
           }
       }
   }
   ```

3. **Add Audit Logging**
   ```typescript
   // Log all session access attempts
   await supabase.from('audit_logs').insert({
       user_id: user.id,
       action: 'session_access',
       resource_id: sessionId,
       success: !!session,
   })
   ```

---

## 9. Security Assessment Summary

| Component | Current State | Risk Level | Fix Priority |
|-----------|--------------|------------|--------------|
| `getSessionHistory()` | ❌ No ownership check | 🔴 HIGH | P0 |
| `ChatList` | ❌ No validation | 🔴 HIGH | P0 |
| `AssistantPage` | ✅ Creates secure | 🟢 LOW | P2 |
| `sendMessage()` | ✅ Has ownership | 🟢 N/A | N/A |
| `/api/chat/route.ts` | ⚠️ Partial | 🟡 MEDIUM | P1 |
| RLS Policies | ✅ Configured | 🟢 N/A | N/A |

---

## 10. Testing Recommendations

### 10.1 Unit Tests

```typescript
// tests/unit/getSessionHistory.test.ts
describe('getSessionHistory', () => {
    it('should reject access to another user session', async () => {
        const otherUserSessionId = 'uuid-of-other-user-session'
        const result = await getSessionHistory(otherUserSessionId)
        
        expect(result.error).toBeDefined()
        expect(result.error.message).toBe('Session not found or access denied')
        expect(result.data).toBeUndefined()
    })
    
    it('should allow access to own session', async () => {
        const ownSessionId = 'uuid-of-own-session'
        const result = await getSessionHistory(ownSessionId)
        
        expect(result.error).toBeUndefined()
        expect(result.data).toBeDefined()
    })
})
```

### 10.2 Integration Tests

```typescript
// tests/integration/assistant-ownership.test.ts
describe('Assistant Page Ownership', () => {
    it('should show access denied for unauthorized session', async () => {
        // Login as user A
        await login('user-a@example.com')
        
        // Try to access user B's session via URL manipulation
        await page.goto('/assistant?session=' + userBSessionId)
        
        // Should show error or redirect
        await expect(page.locator('text=Access Denied')).toBeVisible()
    })
})
```

---

## 11. Conclusion

### 11.1 Key Findings

1. **Backend vulnerability** in `getSessionHistory()` is the primary security gap
2. **Frontend relies entirely on backend** for ownership verification
3. **No client-side defense in depth** - single point of failure
4. **RLS policies provide backup** but shouldn't be the only protection
5. **Error handling is generic** - doesn't distinguish unauthorized access

### 11.2 Risk Assessment

- **Current Risk:** 🔴 HIGH - If RLS is misconfigured or bypassed, unauthorized access possible
- **Attack Vector:** Attacker needs to know session ID (UUID guessing required)
- **Impact:** Exposure of private AI mentor conversations
- **Likelihood:** 🟡 MEDIUM - UUIDs are hard to guess, but not impossible

### 11.3 Next Steps

1. **Backend fix first** - Add ownership verification to `getSessionHistory()`
2. **Frontend validation** - Add client-side ownership checks
3. **Error handling** - Implement specific unauthorized access UI
4. **Testing** - Add unit and integration tests for ownership validation
5. **Audit logging** - Track all session access attempts

---

## Appendix A: Files Reviewed

| File | Status | Notes |
|------|--------|-------|
| `lib/actions/ai-mentor.ts` | ❌ Vulnerable | `getSessionHistory()` missing filter |
| `components/features/assistant/chat-list.tsx` | ❌ No validation | Relies on backend |
| `app/(auth)/assistant/page.tsx` | ✅ Secure | Uses `getOrCreateActiveSession()` |
| `components/features/assistant/chat-input.tsx` | ✅ Secure | Uses `sendMessage()` with verification |
| `app/api/chat/route.ts` | ⚠️ Partial | History fetch missing filter |
| `hooks/use-new-endpoints.ts` | ⚠️ Unused | Hook exists but not integrated |
| `supabase/setup/*.sql` | ✅ Secure | RLS policies configured |

---

## Appendix B: Git Commit

```bash
git add FRONTEND_AUDIT.md
git commit -m "[Frontend] Audit draft ownership - trace data flow and identify affected components"
git push -u origin agent/frontend/draft-ownership-review
```

---

**Audit Complete:** 2026-03-20  
**Status:** Ready for Backend Fix → Frontend Implementation  
**Handoff:** Coordinator
