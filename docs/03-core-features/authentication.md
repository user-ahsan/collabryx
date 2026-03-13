# Authentication

Complete guide to Collabryx's authentication system using Supabase Auth.

---

## Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Authentication Flow](#authentication-flow)
- [Protected Routes](#protected-routes)
- [Session Management](#session-management)
- [Row Level Security](#row-level-security)

---

## Overview

Collabryx uses **Supabase Auth** for user authentication with the following features:

- Email/password authentication
- OAuth providers (Google, GitHub, etc.)
- Magic link authentication
- Session management
- Row Level Security (RLS)

---

## Setup

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Supabase Client

```typescript
// lib/supabase/client.ts (Client Components)
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

// lib/supabase/server.ts (Server Components)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // In Server Components, can't set cookies
          }
        },
      },
    }
  )
}
```

---

## Authentication Flow

### Sign Up

```typescript
import { createClient } from '@/lib/supabase/client'

async function signUp(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  
  if (error) throw error
  return data
}
```

### Sign In

```typescript
async function signIn(email: string, password: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  
  if (error) throw error
  return data
}
```

### Sign Out

```typescript
async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
}
```

---

## Protected Routes

### Route Groups

```
app/
├── (auth)/              # Protected routes
│   ├── dashboard/
│   ├── messages/
│   └── profile/
└── (public)/            # Public routes
    ├── landing/
    ├── login/
    └── register/
```

### Middleware Protection

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: createCookieUtils(request) }
  )
  
  const { data: { session } } = await supabase.auth.getSession()
  
  // Protect auth routes
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}
```

---

## Session Management

### Get Current User

```typescript
// Server Component
import { createClient } from '@/lib/supabase/server'

export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return <LoginPrompt />
  
  return <Dashboard user={user} />
}

// Client Component
import { createClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function UserProfile() {
  const [user, setUser] = useState(null)
  const supabase = createClient()
  
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])
  
  return <div>{user?.email}</div>
}
```

### Auth State Changes

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (event, session) => {
      if (event === 'SIGNED_IN') {
        console.log('User signed in')
      }
      if (event === 'SIGNED_OUT') {
        console.log('User signed out')
      }
    }
  )
  
  return () => subscription.unsubscribe()
}, [])
```

---

## Row Level Security

### Enable RLS

```sql
-- Enable RLS on table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own data
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Create policy for users to update their own data
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

### Query with RLS

```typescript
// RLS automatically applied based on user session
const { data, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()

// If user doesn't have permission, data will be null
```

---

## Best Practices

### ✅ DO

- Use Server Components for initial auth check
- Implement proper loading states
- Handle auth errors gracefully
- Use RLS on all tables
- Refresh sessions properly

### ❌ DON'T

- Don't expose service role key to client
- Don't skip RLS policies
- Don't store auth state in global state only
- Don't forget to handle session expiration

---

**Last Updated**: 2026-03-14  
**Version**: 2.0.0

[← Back to Docs](../README.md)
