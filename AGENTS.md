# 🤖 AGENTS.md - Collabryx Development Guide

**Project:** Collabryx - AI-Powered Collaborative Platform  
**Stack:** Next.js 16, React 19, TypeScript, Supabase, Tailwind CSS v4  
**Repo:** https://github.com/user-ahsan/collabryx.git

---

## 🎯 Quick Commands

### Build & Development
```bash
npm run dev              # Dev server (localhost:3000)
npm run dev:skip-docker  # Dev without Docker check
npm run build            # Production build
npm run start            # Start production server
```

### Testing
```bash
npm run test                     # Run all tests (Vitest)
npm run test -- --watch          # Watch mode
npm run test -- <pattern>        # Run specific test (e.g., sanitize.test.ts)
npm run test -- --coverage       # With coverage
npm run test:e2e                 # E2E tests (Playwright)
```

### Code Quality
```bash
npm run lint             # ESLint check
npm run typecheck        # TypeScript type check
```

### Docker (Python Worker)
```bash
npm run docker:up        # Start with health check
npm run docker:down      # Stop gracefully
npm run docker:health    # Check health endpoint
npm run docker:logs      # View logs
npm run docker:status    # Full status report
```

---

## 📜 Code Style Guidelines

### Imports & Organization
```typescript
// 1. React/Next.js
import React from 'react'
import { Suspense } from 'react'

// 2. Third-party libraries
import { createClient } from '@supabase/supabase-js'
import { zodResolver } from '@hookform/resolvers/zod'

// 3. Internal modules (use @/ alias)
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import { useAuth } from '@/hooks/use-auth'

// 4. Types
import { Database } from '@/types/database.types'
import { Post } from '@/types'

// 5. Styles (Tailwind only - NO CSS modules)
```

**Rules:**
- Use absolute imports with `@/` (configured in tsconfig.json)
- Import order: React → Third-party → Internal → Types
- Named imports preferred over default (e.g., `import { Button }`)
- Specific icon imports: `import { Menu } from "lucide-react"` (not all)

### TypeScript Standards
```typescript
// ✅ GOOD: Strict typing, no any
interface UserProps {
  id: string
  name: string | null
  avatar_url?: string
}

const UserProfile: React.FC<UserProps> = ({ id, name, avatar_url }) => {
  // Use unknown, then narrow
  const data: unknown = await fetchData()
  if (isUser(data)) {
    // TypeScript knows it's User
  }
}

// ❌ BAD: Any types, @ts-ignore
const data: any = await fetchData() // NEVER
```

**Rules:**
- **NO `any` types** - Use `unknown` and narrow
- **NO `@ts-ignore`** - Fix the type error
- Use interfaces for component props
- Import database types from `@/types/database.types.ts`
- Enable strict mode (already in tsconfig.json)

### Naming Conventions
```typescript
// Files: kebab-case
// user-profile.tsx, use-auth.ts, database.types.ts

// Components: PascalCase
export const UserProfile = () => {}
export const GlassCard = () => {}

// Hooks: camelCase with use prefix
export const useAuth = () => {}
export const useDebounce = () => {}

// Utilities: camelCase
export const sanitizeText = () => {}
export const formatInitials = () => {}

// Types: PascalCase
interface UserProfile { }
type MatchScore = number
```

### Component Structure
```typescript
'use client' // Only when needed (hooks, events)

import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'

// Schema validation (ALWAYS use Zod)
const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
})

type FormData = z.infer<typeof formSchema>

// Component (functional, export const)
export function UserProfile() {
  // Hooks first
  const { user } = useAuth()
  
  // State
  const [loading, setLoading] = React.useState(false)
  
  // Effects (cleanup if needed)
  React.useEffect(() => {
    return () => {
      // Cleanup
    }
  }, [])
  
  // Handlers
  const handleSubmit = async (data: FormData) => {
    try {
      setLoading(true)
      await updateUser(data)
    } catch (error) {
      // Handle specific error codes
      if (error.code === '401') {
        toast.error('Unauthorized')
      }
    } finally {
      setLoading(false)
    }
  }
  
  // Guard clauses
  if (!user) return null
  
  // JSX
  return (
    <div className={cn('flex w-full flex-col md:w-1/2')}>
      {/* Content */}
    </div>
  )
}
```

### Tailwind CSS & UI
```typescript
// ✅ GOOD: Use cn() for conditional classes
<div className={cn(
  'flex flex-col',
  loading && 'opacity-50',
  className // Allow external overrides
)} />

// ✅ GOOD: Use design tokens
<div className="bg-muted text-primary-foreground" />

// ✅ GOOD: Mobile-first responsive
<div className="w-full md:w-1/2 lg:w-1/3" />

// ❌ BAD: Magic values
<div className="w-[342px]" /> // Use design system values
```

**Rules:**
- **ALWAYS** use `cn()` from `@/lib/utils/cn` for conditional classes
- Use shadcn design tokens (`bg-muted`, `text-primary`)
- Mobile-first approach (`w-full md:w-1/2`)
- **NO CSS modules** - Tailwind only

### Error Handling
```typescript
// ✅ GOOD: Guard clauses, specific errors
async function updateUser(data: FormData) {
  if (!data.id) {
    throw new Error('User ID required')
  }
  
  const { error } = await supabase
    .from('profiles')
    .update(data)
    .eq('id', data.id)
  
  if (error) {
    // Handle specific codes
    if (error.code === '23505') {
      toast.error('Email already exists')
      return
    }
    
    toast.error('Failed to update profile')
    logger.error('Update failed', error)
    throw error
  }
  
  toast.success('Profile updated')
}
```

**Rules:**
- Guard clauses for null/undefined (return early)
- Handle specific error codes (401, 404, 23505, etc.)
- Use `toast.error()` for user feedback
- Use `logger.error()` for debugging
- Error boundaries in `error.tsx` for route segments

### React & Next.js Patterns
```typescript
// ✅ Server Component (default)
import { createClient } from '@/lib/supabase/server'

export default async function Dashboard() {
  const supabase = createClient()
  const { data } = await supabase.from('posts').select()
  
  return <DashboardContent posts={data} />
}

// ✅ Client Component (when needed)
'use client'

export function DashboardContent({ posts }) {
  const { data, isLoading } = usePosts() // React Query
  
  if (isLoading) return <LoadingSpinner />
  
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <PostsList posts={data} />
    </Suspense>
  )
}
```

**Rules:**
- **Server-first**: Default to Server Components
- Use `"use client"` only for hooks/events
- Fetch data in Server Components, not `useEffect`
- Use `<Suspense>` and `loading.tsx` for slow data
- React Query for server state (staleTime configured)

### Supabase Patterns
```typescript
// ✅ Client Component
import { createBrowserClient } from '@/lib/supabase/client'
import { Database } from '@/types/database.types'

const supabase = createBrowserClient<Database>()

const { data, error } = await supabase
  .from('profiles')
  .select('id, name, avatar_url') // Specific fields, not *
  .eq('id', userId)
  .single()

if (error) {
  logger.error('Fetch failed', error)
  return null
}
```

**Rules:**
- Use `<Database>` generics for type safety
- Select specific fields, not `*`
- Check `if (error)` immediately
- Row Level Security (RLS) on all tables
- Use typed clients from `@/lib/supabase/`

---

## 🚫 IRON RULES (NEVER BREAK)

1. **NO NEW PACKAGES** - Use only existing dependencies in package.json
2. **NO VERSION BUMPS** - Never modify package versions
3. **CONFIG FILES ARE READ-ONLY** - Adapt code to config, not vice versa
4. **NO CSS MODULES** - Tailwind CSS only
5. **NO `any` TYPES** - Strict TypeScript, no @ts-ignore
6. **NO FILE REWRITES** - Make minimal changes, edit line-by-line
7. **NO root directory files** - Unless explicitly asked

---

## 📁 File Structure

```
app/
├── (auth)/           # Protected routes (dashboard, messages, etc.)
├── (public)/         # Public routes (landing, login, register)
└── api/              # API routes

components/
├── features/<domain>/ # Domain-specific (auth, dashboard, posts)
├── shared/           # Cross-feature (glass-card, sidebar)
└── ui/               # shadcn/ui primitives

hooks/                # Custom React hooks
lib/
├── supabase/         # Client setup (client.ts, server.ts)
├── utils/            # Helpers (sanitize.ts, cn.ts)
└── validations/      # Zod schemas

tests/
├── unit/             # Unit tests (*.test.ts)
└── components/       # Component tests (*.test.tsx)

types/                # TypeScript types
```

**Rules:**
- Feature-based architecture (`components/features/<domain>/`)
- Maintain `(auth)` and `(public)` route separation
- Test files: `*.test.ts` or `*.test.tsx`
- NO `pages/` directory (App Router only)

---

## 🧪 Testing Guidelines

### Unit Test Example
```typescript
import { describe, it, expect, vi } from 'vitest'
import { sanitizeText } from '@/lib/utils/sanitize'

describe('sanitize', () => {
  it('should handle plain text', () => {
    expect(sanitizeText('Hello')).toBe('Hello')
  })
  
  it('should respect maxLength', () => {
    expect(sanitizeText('Hello World', { maxLength: 5 })).toBe('Hello')
  })
})
```

### Component Test Example
```typescript
import { render, screen } from '@testing-library/react'
import { Button } from '@/components/ui/button'

describe('Button', () => {
  it('renders with children', () => {
    render(<Button>Click me</Button>)
    expect(screen.getByText('Click me')).toBeInTheDocument()
  })
})
```

**Running Tests:**
```bash
# All tests
npm run test

# Specific test file
npm run test -- sanitize.test.ts

# Watch mode
npm run test -- --watch

# Coverage
npm run test -- --coverage
```

---

## 📚 Documentation

- **Architecture:** `docs/ARCHITECTURE.md`
- **Deployment:** `docs/DEPLOYMENT.md`
- **API Reference:** `docs/API-REFERENCE.md`
- **Database Schema:** `supabase/setup/99-master-all-tables.sql`
- **Security:** `docs/SECURITY.md`

---

## 🔐 Security Checklist

- [ ] Environment variables via `process.env` only (NEVER hardcode)
- [ ] Zod validation on all inputs (forms, API, search params)
- [ ] Supabase RLS policies on all tables
- [ ] Protected routes in `(auth)/` group
- [ ] Input sanitization with `sanitize.ts`
- [ ] CSRF protection with `lib/csrf.ts`
- [ ] Rate limiting (100 req/15min general, 10/min strict)

---

**Last Updated:** 2026-03-19  
**Phase:** 5 Complete  
**Status:** Production Ready ✅
