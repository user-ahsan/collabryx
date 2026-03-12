# 🧹 Codebase Cleanup Plan

**Generated:** 2026-03-12  
**Priority:** High-Impact, Low-Risk Changes First  
**Estimated Effort:** 8-12 hours total

---

## 📊 Analysis Summary

- **Total Components:** ~150 files in `components/`
- **Service Files:** 5 main services in `lib/services/`
- **Hooks:** 9 hooks (1 empty: `use-matches.ts`)
- **Console Statements:** 63 instances across lib/components
- **Duplicate Patterns:** Multiple instances of cache logic, initials formatting, data fetching

---

## 🎯 Phase 1: Remove Unused/Empty Files (1 hour)

### 1.1 Delete Empty/Unused Files

```bash
# Files to delete
rm hooks/use-matches.ts                    # Empty file (0 lines)
rm lib/utils/format-date.ts                # Empty file (0 bytes)
rm components/shared/empty-state.tsx       # Empty file (0 bytes)
rm components/shared/main-nav.tsx          # Empty file (0 bytes)
rm components/shared/page-header.tsx       # Empty file (0 bytes)
rm components/shared/user-avatar.tsx       # Empty file (0 bytes)
```

**Risk:** Low - All files are empty  
**Impact:** Cleaner codebase, reduced confusion

---

## 🔧 Phase 2: Extract Duplicate Utilities (2-3 hours)

### 2.1 Create `lib/utils/format-initials.ts`

**Problem:** `formatInitials()` function only exists in `lib/services/matches.ts:359` but is needed in multiple components

**Action:**
```typescript
// lib/utils/format-initials.ts
export function formatInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}
```

**Update imports in:**
- `lib/services/matches.ts` - import from new location
- Any component that formats user initials

### 2.2 Create Custom Hook `use-cache.ts` (2-3 hours)

**Problem:** Identical cache pattern repeated in 4+ components:
- `components/features/dashboard/feed.tsx:48-89`
- `components/features/matches/matches-client.tsx:36-70`
- `components/features/dashboard/suggestions-sidebar.tsx`
- `components/features/dashboard/match_activity-card.tsx`

**Current duplicate pattern:**
```typescript
try {
  const { data, error } = await fetchSomething()
  if (error) throw error
  setData(data)
  setCache(CACHE_KEYS.SOMETHING, data)
} catch {
  const cached = getCache<T>(CACHE_KEYS.SOMETHING)
  if (cached) {
    setData(cached)
    toast.info("Showing cached data")
  }
}
```

**Create:**
```typescript
// hooks/use-cache.ts
interface UseCacheOptions<T> {
  key: string
  fetchFn: () => Promise<{ data: T | null; error: Error | null }>
  fallbackMessage?: string
}

export function useCache<T>({ key, fetchFn, fallbackMessage }: UseCacheOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data, error } = await fetchFn()
      if (error) throw error
      if (data) {
        setData(data)
        setCache(key, data)
      }
    } catch (err) {
      const cached = getCache<T>(key)
      if (cached) {
        setData(cached)
        toast.info(fallbackMessage || "Showing cached data")
      } else {
        setError(err instanceof Error ? err : new Error("Unknown error"))
      }
    } finally {
      setIsLoading(false)
    }
  }, [key, fetchFn, fallbackMessage])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return { data, isLoading, error, refetch: fetchData }
}
```

**Update components to use hook:**
- `feed.tsx` - Replace lines 48-89
- `matches-client.tsx` - Replace lines 36-70
- `suggestions-sidebar.tsx`
- `match-activity-card.tsx`

**Impact:** Eliminates ~150 lines of duplicate code

---

## 🧹 Phase 3: Remove Unused Imports (2 hours)

### 3.1 Run Automated Cleanup

```bash
# Use TypeScript compiler to find unused imports
npx tsc --noEmit 2>&1 | grep "unused"

# Manual review needed for these patterns:
# - Imported but unused types
# - Duplicate imports (cn imported multiple times)
# - Over-imported UI components
```

### 3.2 Common Patterns to Fix

**Pattern 1: Over-imported React hooks**
```typescript
// Before (feed.tsx:3)
import { useState, useEffect, useMemo, useCallback } from "react"

// After (only what's used)
import { useState, useEffect, useMemo, useCallback } from "react"
// ✓ Already correct, but check other files
```

**Pattern 2: Unused type imports**
```typescript
// Check files importing from @/types/database.types
// Only import actually used types
```

**Pattern 3: Duplicate UI imports**
```typescript
// Some files import Button multiple times from different locations
# Consolidate to single import
```

---

## 🔄 Phase 4: Consolidate Overlapping Code (3-4 hours)

### 4.1 Merge Duplicate Rate Limit Utilities

**Files:**
- `lib/rate-limit.ts`
- `lib/utils/rate-limit.ts`

**Action:**
1. Compare both files
2. Keep the better implementation
3. Delete the duplicate
4. Update imports

### 4.2 Standardize Data Fetching Pattern

**Problem:** Inconsistent patterns across components

**Current patterns:**
1. `useEffect` + direct fetch (some components)
2. `useCallback` + `useEffect` (feed.tsx, matches-client.tsx)
3. React Query (not currently used, but installed)

**Action:** Standardize on React Query pattern (already in dependencies)

**Example migration:**
```typescript
// Before (matches-client.tsx)
const [matches, setMatches] = useState<UIMatch[]>([])
const [isLoading, setIsLoading] = useState(true)

useEffect(() => {
  fetchMatchesData()
}, [])

// After (using React Query)
const { data: matches = [], isLoading } = useQuery({
  queryKey: ['matches'],
  queryFn: fetchMatches,
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

**Files to update:**
- `components/features/dashboard/feed.tsx`
- `components/features/matches/matches-client.tsx`
- `components/features/dashboard/suggestions-sidebar.tsx`
- `components/features/dashboard/match-activity-card.tsx`

**Impact:** Better caching, deduping, automatic refetch

### 4.3 Consolidate Toast Messages

**Problem:** Inconsistent toast messages for similar actions

**Current examples:**
- `"Couldn't load latest posts. Showing cached data."` (feed.tsx)
- `"Showing cached matches"` (matches-client.tsx)
- `"Showing cached activity data"` (match-activity-card.tsx)

**Action:** Create `lib/constants/toast-messages.ts`
```typescript
export const TOAST_MESSAGES = {
  CACHE_FALLBACK: (resource: string) => `Couldn't load latest ${resource}. Showing cached data.`,
  SUCCESS: (action: string) => `${action} successful`,
  ERROR: (action: string) => `Failed to ${action}`,
}
```

---

## 🧪 Phase 5: Clean Up Console Statements (1 hour)

### 5.1 Review Console Statements

**Current count:** 63 console statements

**Action:**
```bash
# Find all console statements
grep -r "console\." --include="*.ts" --include="*.tsx" lib/ components/
```

**Categories:**
1. **Debug logs** - Remove (e.g., `console.log("state:", state)`)
2. **Error logs** - Keep with proper context (e.g., `console.error("Error fetching matches:", error)`)
3. **Info logs** - Evaluate case-by-case

**Replace debug logs with proper logging service:**
```typescript
// lib/logger.ts (create new)
export const logger = {
  debug: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.debug(`[DEBUG] ${message}`, data)
    }
  },
  error: (message: string, error?: Error) => {
    console.error(`[ERROR] ${message}`, error)
  },
  info: (message: string, data?: unknown) => {
    console.info(`[INFO] ${message}`, data)
  },
}
```

---

## 📦 Phase 6: Organize Lib Directory (1 hour)

### 6.1 Restructure Lib Directory

**Current:**
```
lib/
├── services/
├── utils/
├── validations/
├── supabase/
├── mock-data/
├── constants/
├── bot-detection.ts
├── cache-tags.ts
├── csrf.ts
├── dashboard-cache.ts
├── database-optimization.ts
├── prefetch.ts
├── rate-limit.ts
└── utils.ts
```

**Proposed:**
```
lib/
├── api/                    # Rename from services/
│   ├── posts.ts
│   ├── matches.ts
│   ├── profiles.ts
│   ├── development.ts
│   └── index.ts
├── auth/                   # New: auth utilities
│   ├── supabase-client.ts  # Move from supabase/
│   └── providers.ts
├── cache/                  # New: cache utilities
│   ├── dashboard-cache.ts
│   ├── cache-tags.ts
│   └── prefetch.ts
├── db/                     # New: database utilities
│   ├── optimization.ts
│   └── types.ts            # Move database types here
├── security/               # New: security utilities
│   ├── csrf.ts
│   ├── bot-detection.ts
│   └── rate-limit.ts
├── utils/                  # Keep, consolidate
│   ├── cn.ts               # Rename from utils.ts
│   ├── format-initials.ts  # New
│   ├── format-date.ts      # Implement (currently empty)
│   ├── sanitize.ts
│   └── file-validation.ts
├── validations/            # Keep
├── constants/              # Keep
├── mock-data/              # Keep
└── logger.ts               # New
```

**Migration steps:**
1. Create new directory structure
2. Move files one at a time
3. Update all imports
4. Test after each move
5. Run `npm run build` to catch errors

---

## ✅ Verification Checklist

After each phase:

```bash
# TypeScript check
npm run typecheck  # or npx tsc --noEmit

# Linting
npm run lint

# Build test
npm run build

# Manual testing
npm run dev
# - Test dashboard feed
# - Test matches page
# - Test onboarding flow
# - Test profile pages
```

---

## 📋 Implementation Order

### Week 1 (Quick Wins)
- [ ] Phase 1: Delete empty files (1 hour)
- [ ] Phase 2.1: Extract `formatInitials` utility (30 min)
- [ ] Phase 3: Remove unused imports (2 hours)
- [ ] Phase 5: Clean console statements (1 hour)

**Total Week 1:** ~4.5 hours

### Week 2 (Medium Complexity)
- [ ] Phase 2.2: Create `use-cache` hook (3 hours)
- [ ] Phase 4.1: Merge rate-limit utilities (1 hour)
- [ ] Phase 4.3: Consolidate toast messages (1 hour)

**Total Week 2:** ~5 hours

### Week 3 (Higher Complexity)
- [ ] Phase 4.2: Migrate to React Query (4-6 hours)
- [ ] Phase 6: Reorganize lib directory (2-3 hours)
- [ ] Final testing and bug fixes (2 hours)

**Total Week 3:** ~8-11 hours

---

## 🎯 Expected Outcomes

### Code Reduction
- **Files removed:** 6 empty files
- **Lines removed:** ~200-250 lines (duplicate code)
- **Imports cleaned:** ~30-40 unused imports

### Quality Improvements
- **Reduced duplication:** Cache logic in 1 hook instead of 4+ components
- **Better organization:** Logical lib directory structure
- **Consistent patterns:** Standardized data fetching
- **Cleaner logs:** Proper logging instead of console statements

### Developer Experience
- **Easier maintenance:** Single source of truth for common utilities
- **Faster debugging:** Organized structure, proper logging
- **Better onboarding:** Clear file organization
- **Type safety:** Removed unused types, stricter imports

---

## ⚠️ Risk Mitigation

### High-Risk Changes
1. **React Query migration** - Test thoroughly, rollback plan ready
2. **Lib reorganization** - Do last, after all other changes stable
3. **Cache hook extraction** - Keep old pattern as fallback initially

### Rollback Strategy
- Commit after each phase
- Use feature flags for React Query migration
- Test on staging/development first
- Keep backup of original files during reorganization

---

## 📝 Notes

### Tools to Use
```bash
# Find unused exports
npx ts-prune

# Find duplicate code
npx jscpd

# Auto-fix imports
npx eslint --fix

# Format code
npx prettier --write .
```

### Files Requiring Careful Review
- `lib/services/matches.ts` - Core matching logic
- `components/features/dashboard/feed.tsx` - Main feed component
- `components/features/onboarding/` - Critical user flow
- `lib/supabase/` - Authentication core

### Don't Touch (Unless Broken)
- `components/ui/` - shadcn/ui primitives
- `lib/supabase/client.ts` and `server.ts` - Core auth setup
- `app/(auth)/layout.tsx` - Main layout structure
- `tailwind.config.ts`, `tsconfig.json` - Config files (read-only per protocol)

---

## 🚀 Getting Started

**First command to run:**
```bash
# Create cleanup branch
git checkout -b cleanup/codebase-maintenance

# Start with Phase 1
# Delete empty files
rm hooks/use-matches.ts
rm lib/utils/format-date.ts
rm components/shared/empty-state.tsx
rm components/shared/main-nav.tsx
rm components/shared/page-header.tsx
rm components/shared/user-avatar.tsx

# Commit
git add .
git commit -m "chore: remove empty unused files"
```

**Next steps:**
1. Review this plan with team
2. Prioritize phases based on timeline
3. Start with Phase 1 (lowest risk)
4. Test thoroughly after each phase

---

**Last Updated:** 2026-03-12  
**Status:** Ready for implementation  
**Approved By:** Pending review
