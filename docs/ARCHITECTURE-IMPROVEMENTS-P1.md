# Architecture Improvements - Phase 2

**Last Updated:** 2026-03-20  
**Version:** 2.0.0

---

## Module Decoupling (P1-26)

### Problem: Tight Coupling Between 8 Modules

**Before:**
```
components/
├── dashboard/     → Directly imports from matches/, posts/, notifications/
├── matches/       → Directly imports from profiles/, connections/
├── posts/         → Directly imports from dashboard/, profiles/
├── notifications/ → Directly imports from dashboard/, matches/
├── messages/      → Directly imports from connections/, profiles/
├── connections/   → Directly imports from matches/, profiles/
├── profile/       → Directly imports from dashboard/, posts/
└── settings/      → Directly imports from all modules
```

**After (Decoupled):**
```
components/
├── shared/
│   ├── event-bus.ts        # Event emitter for cross-module communication
│   ├── types.ts            # Shared type definitions
│   └── hooks/              # Shared hooks
├── dashboard/
│   └── index.ts            # Exports only public API
├── matches/
│   └── index.ts            # Exports only public API
└── ... (all modules follow same pattern)
```

### Implementation

**Event Bus Pattern:**
```typescript
// components/shared/event-bus.ts
type EventMap = {
  'user:updated': { userId: string }
  'post:created': { postId: string }
  'match:accepted': { matchId: string }
  'notification:new': { notificationId: string }
}

class EventBus {
  private listeners: Map<keyof EventMap, Set<(data: any) => void>> = new Map()
  
  on<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }
  
  off<K extends keyof EventMap>(event: K, callback: (data: EventMap[K]) => void) {
    this.listeners.get(event)?.delete(callback)
  }
  
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]) {
    this.listeners.get(event)?.forEach(callback => callback(data))
  }
}

export const eventBus = new EventBus()
```

**Module Public API:**
```typescript
// components/features/matches/index.ts
// Only exports public API, hides implementation

export { MatchCard } from './match-card'
export { MatchList } from './match-list'
export { useMatches } from './hooks/use-matches'
export type { Match, MatchPreferences } from './types'

// Internal modules NOT exported:
// - match-scorer.ts (internal logic)
// - match-filters.ts (internal logic)
```

---

## Supabase Abstraction Layer (P1-27)

### Problem: Direct Supabase Calls Throughout Codebase

**Before:**
```typescript
// Direct Supabase calls scattered everywhere
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
```

**After (Abstraction Layer):**
```typescript
// lib/services/profiles.ts
export class ProfileService {
  constructor(private supabase: SupabaseClient) {}
  
  async getById(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('id, display_name, headline, bio, avatar_url')
      .eq('id', userId)
      .single()
    
    if (error) throw new ProfileError(error.message)
    return data
  }
  
  async update(userId: string, updates: ProfileUpdate): Promise<Profile> {
    const { data, error } = await this.supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw new ProfileError(error.message)
    return data
  }
}

// Usage in components
const profile = await profileService.getById(userId)
```

### Service Layer Structure

```
lib/services/
├── index.ts              # Export all services
├── base.ts               # Base service class
├── profiles.ts           # Profile operations
├── posts.ts              # Post operations
├── matches.ts            # Match operations
├── connections.ts        # Connection operations
├── notifications.ts      # Notification operations
├── messages.ts           # Message operations
├── analytics.ts          # Analytics operations
└── errors.ts             # Custom error classes
```

**Base Service:**
```typescript
// lib/services/base.ts
export abstract class BaseService {
  constructor(protected supabase: SupabaseClient) {}
  
  protected handleError(error: any, context: string): never {
    logger.error(`[${context}]`, error)
    throw new ServiceError(context, error)
  }
  
  protected validateId(id: string, context: string): void {
    if (!id || typeof id !== 'string') {
      throw new ValidationError(`${context}: Invalid ID`)
    }
  }
}
```

---

## Feature Flag System (P1-28)

### Implementation

```typescript
// lib/feature-flags.ts
interface FeatureFlags {
  newDashboard: boolean
  aiMentor: boolean
  matchScoring: boolean
  notificationsV2: boolean
}

const DEFAULT_FLAGS: FeatureFlags = {
  newDashboard: false,
  aiMentor: true,
  matchScoring: true,
  notificationsV2: false,
}

class FeatureFlagService {
  private flags: FeatureFlags = { ...DEFAULT_FLAGS }
  private userFlags: Map<string, FeatureFlags> = new Map()
  
  async initialize(userId?: string) {
    if (userId) {
      const { data } = await supabase
        .from('user_feature_flags')
        .select('flags')
        .eq('user_id', userId)
        .single()
      
      if (data) {
        this.userFlags.set(userId, data.flags)
      }
    }
  }
  
  isEnabled(flag: keyof FeatureFlags, userId?: string): boolean {
    if (userId && this.userFlags.has(userId)) {
      return this.userFlags.get(userId)![flag] ?? this.flags[flag]
    }
    return this.flags[flag]
  }
  
  async setFlag(flag: keyof FeatureFlags, value: boolean, userId?: string) {
    if (userId) {
      await supabase
        .from('user_feature_flags')
        .upsert({ user_id: userId, flags: { [flag]: value } })
    } else {
      this.flags[flag] = value
    }
  }
}

export const featureFlags = new FeatureFlagService()
```

### Usage in Components

```typescript
// components/features/dashboard/dashboard-view.tsx
'use client'

export function DashboardView() {
  const { user } = useAuth()
  const isNewDashboard = featureFlags.isEnabled('newDashboard', user?.id)
  
  if (isNewDashboard) {
    return <NewDashboard />
  }
  
  return <LegacyDashboard />
}
```

### Feature Flag Database Schema

```sql
-- user_feature_flags table
CREATE TABLE user_feature_flags (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  flags JSONB NOT NULL DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
CREATE POLICY "Users can read own flags"
ON user_feature_flags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can update all flags"
ON user_feature_flags FOR ALL
USING (auth.jwt()->>'role' = 'admin');
```

---

## Component Refactoring (P1-35)

### Large Components (>500 lines) Refactored

| Component | Before | After | Strategy |
|-----------|--------|-------|----------|
| `dashboard-view.tsx` | 650 lines | 180 lines | Extract sub-components |
| `profile-settings.tsx` | 580 lines | 150 lines | Split by tab |
| `match-card.tsx` | 520 lines | 120 lines | Extract logic to hooks |
| `chat-window.tsx` | 700 lines | 200 lines | Extract message types |

### Refactoring Pattern

**Before:**
```typescript
// 650-line monolithic component
export function DashboardView() {
  // 50 lines of state
  // 100 lines of effects
  // 200 lines of handlers
  // 300 lines of JSX
  
  return (
    <div>
      {/* Everything here */}
    </div>
  )
}
```

**After:**
```typescript
// Main component - 180 lines
export function DashboardView() {
  const { posts, loading } = useDashboardData()
  const { user } = useAuth()
  
  if (loading) return <DashboardSkeleton />
  
  return (
    <DashboardShell user={user}>
      <Feed posts={posts} />
      <SuggestionsSidebar />
      <ActivityWidget />
    </DashboardShell>
  )
}

// Extracted sub-components
function Feed({ posts }) { ... }
function SuggestionsSidebar() { ... }
function ActivityWidget() { ... }

// Custom hook for data fetching
function useDashboardData() { ... }
```

---

## Duplicate Code Removal (P1-36)

### Identified Duplicates

| Pattern | Occurrences | Resolution |
|---------|-------------|------------|
| Form validation | 12 | Extract to `lib/validations/` |
| Toast messages | 23 | Extract to `lib/constants/toast-messages.ts` |
| Error handling | 15 | Extract to `lib/errors/` |
| Loading states | 18 | Create reusable `LoadingSpinner` |
| Empty states | 10 | Create `EmptyState` component |

### Shared Utilities Created

```typescript
// lib/utils/form-helpers.ts
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function validatePassword(password: string): ValidationResult {
  const errors: string[] = []
  if (password.length < 8) errors.push('Min 8 characters')
  if (!/[A-Z]/.test(password)) errors.push('Uppercase required')
  if (!/[0-9]/.test(password)) errors.push('Number required')
  return { valid: errors.length === 0, errors }
}

// lib/constants/toast-messages.ts
export const TOAST_MESSAGES = {
  PROFILE: {
    UPDATE_SUCCESS: 'Profile updated successfully',
    UPDATE_ERROR: 'Failed to update profile',
  },
  POST: {
    CREATE_SUCCESS: 'Post created',
    DELETE_SUCCESS: 'Post deleted',
    DELETE_ERROR: 'Failed to delete post',
  },
  // ... all shared messages
} as const

// Usage
toast.success(TOAST_MESSAGES.PROFILE.UPDATE_SUCCESS)
```

---

## JSDoc Documentation (P1-37)

### Standard

```typescript
/**
 * Generates a CSRF token for form protection.
 * 
 * @returns Promise resolving to a 64-character hex token
 * 
 * @example
 * ```ts
 * const token = await generateCSRFToken()
 * ```
 * 
 * @security This token should be stored in a cookie and validated on submission
 */
export async function generateCSRFToken(): Promise<string> {
  // Implementation
}

/**
 * Validates a CSRF token format.
 * 
 * @param token - The token to validate
 * @returns True if token is valid 64-char hex string
 * 
 * @example
 * ```ts
 * const isValid = validateCSRFToken('abc123...')
 * ```
 */
export function validateCSRFToken(token: string): boolean {
  // Implementation
}
```

### Documented Exports

All exported functions in:
- `lib/` - 100% documented
- `hooks/` - 100% documented  
- `components/shared/` - 100% documented
- `lib/services/` - 100% documented

---

## Related Documentation

- [API Reference](./API-REFERENCE.md)
- [Deployment Runbook](./DEPLOYMENT-RUNBOOK.md)
- [Security Guide](./SECURITY.md)

---

**Document Version:** 2.0.0  
**Last Reviewed:** 2026-03-20  
**Maintained By:** Architecture Team
