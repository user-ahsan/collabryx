# 🏗️ Architecture Guide

Comprehensive guide to Collabryx's project structure and architectural decisions.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Directory Structure](#directory-structure)
- [Architecture Patterns](#architecture-patterns)
- [Tech Stack Deep Dive](#tech-stack-deep-dive)
- [Data Flow](#data-flow)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Authentication Flow](#authentication-flow)
- [Database Schema](#database-schema)
- [API Design](#api-design)

---

## Project Overview

Collabryx is built using **Next.js 16+ App Router** with a feature-based architecture. The application follows modern React best practices, leveraging Server Components for performance and Client Components for interactivity.

### Core Principles

1. **Server-First** - Maximize Server Component usage for better performance
2. **Type Safety** - Strict TypeScript throughout the codebase
3. **Feature-Based** - Organize code by features, not file types
4. **Accessibility** - WCAG 2.1 AA compliance as baseline
5. **Performance** - Optimize for Core Web Vitals

---

## Directory Structure

```
collabryx/
│
├── .agent/                     # AI agent workflows and configurations
│   └── workflows/             # Deployment and automation workflows
│
├── app/                       # Next.js App Router (entry point)
│   ├── (auth)/               # Protected routes (requires authentication)
│   │   ├── dashboard/        # Main dashboard
│   │   ├── chat/            # AI chat interface
│   │   ├── projects/        # Project management
│   │   └── settings/        # User settings
│   │
│   ├── (public)/            # Public routes (no auth required)
│   │   ├── page.tsx        # Landing page
│   │   ├── about/          # About page
│   │   └── pricing/        # Pricing page
│   │
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   └── webhooks/       # External webhooks
│   │
│   ├── globals.css         # Global styles and Tailwind directives
│   ├── layout.tsx          # Root layout component
│   ├── error.tsx           # Global error boundary
│   └── not-found.tsx       # 404 page
│
├── components/               # React components
│   ├── features/           # Feature-specific components
│   │   ├── assistant/      # AI assistant feature
│   │   │   ├── chat-input.tsx
│   │   │   ├── message-list.tsx
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/      # Dashboard feature
│   │   │   ├── stats-card.tsx
│   │   │   ├── recent-activity.tsx
│   │   │   └── index.ts
│   │   │
│   │   └── projects/       # Project management feature
│   │       ├── project-card.tsx
│   │       ├── project-list.tsx
│   │       └── index.ts
│   │
│   ├── shared/             # Shared components across features
│   │   ├── main-nav.tsx   # Navigation bar
│   │   ├── user-avatar.tsx
│   │   ├── theme-toggle.tsx
│   │   └── footer.tsx
│   │
│   └── ui/                 # shadcn/ui primitive components
│       ├── button.tsx
│       ├── card.tsx
│       ├── dialog.tsx
│       └── ...            # Other UI primitives
│
├── hooks/                   # Custom React hooks
│   ├── use-debounce.ts    # Debounce hook
│   ├── use-toast.ts       # Toast notification hook
│   ├── use-user.ts        # User data hook
│   └── use-theme.ts       # Theme management hook
│
├── lib/                     # Library code and utilities
│   ├── supabase/          # Supabase configuration
│   │   ├── client.ts      # Browser client
│   │   ├── server.ts      # Server client
│   │   └── proxy.ts       # Auth middleware
│   │
│   └── utils/             # Utility functions
│       ├── cn.ts          # Class name merger (clsx + tailwind-merge)
│       ├── date.ts        # Date formatting utilities
│       └── api.ts         # API helper functions
│
├── docs/                    # Documentation
│   ├── INSTALLATION.md    # Setup instructions
│   ├── DEVELOPMENT.md     # Development guide
│   ├── ARCHITECTURE.md    # This file
│   ├── DEPLOYMENT.md      # Deployment guide
│   ├── CONTRIBUTING.md    # Contribution guidelines
│   └── API.md            # API documentation
│
├── public/                  # Static assets
│   ├── images/           # Image files
│   ├── icons/            # Icon files
│   └── models/           # 3D models
│
├── supabase/                # Supabase backend
│   ├── functions/         # Edge Functions (Deno)
│   │   ├── generate-embedding/  # Embedding generation endpoint
│   │   ├── get-matches/         # Semantic matching endpoint
│   │   └── ai-assistant/        # AI chat endpoint
│   │
│   ├── migrations/        # Database migrations
│   │   └── *.sql         # Migration files
│   │
│   └── config.toml        # Supabase configuration
│
├── python-worker/          # Self-hosted embedding service
│   ├── Dockerfile         # Container configuration
│   ├── main.py            # FastAPI server
│   ├── embedding_generator.py  # Sentence Transformers logic
│   ├── requirements.txt   # Python dependencies
│   └── test_embeddings.py # Test suite
│
├── types/                   # TypeScript type definitions
│   ├── database.types.ts  # Generated Supabase types
│   ├── globals.d.ts       # Global type declarations
│   └── index.ts           # Exported types
│
├── .gitignore              # Git ignore rules
├── components.json         # shadcn/ui configuration
├── eslint.config.mjs       # ESLint configuration
├── next.config.ts          # Next.js configuration
├── package.json            # Dependencies and scripts
├── postcss.config.mjs      # PostCSS configuration
├── tailwind.config.ts      # Tailwind CSS configuration
└── tsconfig.json           # TypeScript configuration
```

---

## Architecture Patterns

### 1. Feature-Based Architecture

Components are organized by **feature/domain** rather than by technical type.

**Benefits:**
- Better code organization and discoverability
- Easier to scale as features grow
- Natural code splitting boundaries
- Team members can own entire features

**Example:**

```
✅ GOOD (Feature-based)
components/features/
├── assistant/
│   ├── chat-input.tsx
│   ├── message-list.tsx
│   ├── typing-indicator.tsx
│   └── index.ts

❌ BAD (Type-based)
components/
├── inputs/
│   └── chat-input.tsx
├── lists/
│   └── message-list.tsx
└── indicators/
    └── typing-indicator.tsx
```

### 2. Server Component First

By default, all components are **Server Components** unless they need:
- Client-side state (`useState`, `useReducer`)
- Effects (`useEffect`)
- Event handlers (`onClick`, `onChange`)
- Browser APIs

**Benefits:**
- Smaller client bundle size
- Better performance
- Automatic code splitting
- Direct database access

```typescript
// ✅ Server Component (default)
export default async function DashboardPage() {
  const data = await fetchDataFromDB();
  return <DashboardView data={data} />;
}

// ✅ Client Component (when needed)
"use client"
export function InteractiveWidget() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### 3. Route Groups for Organization

Uses Next.js route groups to separate authenticated and public routes:

```
app/
├── (auth)/         # Requires authentication
│   └── layout.tsx  # Shared auth layout
├── (public)/       # Public access
│   └── layout.tsx  # Shared public layout
```

**Benefits:**
- Clear separation of concerns
- Different layouts for auth vs public
- Easier middleware application
- Better code organization

---

## Tech Stack Deep Dive

### Frontend Layer

#### Next.js 16 (App Router)
- **Server Components** for data fetching
- **Client Components** for interactivity
- **Streaming** for progressive rendering
- **Suspense boundaries** for loading states

#### TypeScript 5
- Strict mode enabled
- Path aliases with `@/`
- Generated types from Supabase

#### Tailwind CSS 4
- Utility-first styling
- Custom design tokens
- Responsive by default
- Dark mode support

### UI Component Library

#### shadcn/ui + Radix UI
- **Accessible** - WCAG 2.1 AA compliant
- **Unstyled primitives** - Full control over styling
- **Composable** - Build complex UIs from simple parts
- **Customizable** - Extend and modify as needed

Components are copied into the project (not npm installed), giving full control:
```
components/ui/
├── button.tsx      # Customized button component
├── dialog.tsx      # Accessible modal
└── dropdown.tsx    # Dropdown menu
```

### Backend & Database

#### Supabase
- **PostgreSQL** - Relational database
- **Row Level Security (RLS)** - Database-level authorization
- **Realtime** - WebSocket subscriptions for live data
- **Auth** - Built-in authentication with multiple providers
- **Storage** - File upload and management
- **Edge Functions** - Serverless functions (Deno runtime)
- **pgvector** - Vector similarity search for semantic matching

### Vector Embeddings System

#### Semantic Matching Architecture

Collabryx uses **vector embeddings** to enable semantic matching between users based on their profiles, skills, and interests.

```
┌─────────────────────────────────────────────────────────────┐
│                    Vector Embedding Flow                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Profile → Semantic Text → Embedding → Vector Storage  │
│       (768 dimensions)             (pgvector)               │
│                                                             │
│  Matching: Cosine Similarity Search on Vector Embeddings    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Embedding Generation

1. **Trigger**: On user onboarding completion
2. **Input**: Profile data (role, headline, bio, skills, interests, goals)
3. **Model**: `all-MiniLM-L6-v2` (768 dimensions, self-hosted)
4. **Storage**: `profile_embeddings` table with pgvector

#### Matching Algorithm

```sql
-- Cosine similarity search for semantic matching
SELECT 
    profiles.id,
    1 - (pe.embedding <=> user_embedding) AS similarity
FROM profile_embeddings pe
JOIN profiles ON pe.user_id = profiles.id
WHERE 1 - (pe.embedding <=> user_embedding) > 0.5
ORDER BY similarity DESC
LIMIT 10;
```

#### Components

- **Python Worker**: FastAPI service running Sentence Transformers
- **Edge Function**: `generate-embedding` orchestrates the process
- **Frontend**: Progress UI + automatic generation on onboarding
- **Database**: `profile_embeddings` table with HNSW index

### State Management

#### React Query (TanStack Query)
- Server state management
- Automatic caching
- Background refetching
- Optimistic updates

```typescript
import { useQuery } from "@tanstack/react-query";

const { data, isLoading } = useQuery({
  queryKey: ["projects"],
  queryFn: () => supabase.from("projects").select("*")
});
```

#### Zustand
- Client-side global state
- Minimal boilerplate
- TypeScript-first

```typescript
import { create } from "zustand";

const useStore = create<State>((set) => ({
  user: null,
  setUser: (user) => set({ user })
}));
```

### Animation Libraries

#### Framer Motion
- Declarative animations
- Layout animations
- Gesture support
- Scroll-triggered animations

#### GSAP
- Timeline-based animations
- Complex sequences
- Performance-optimized

#### Lenis
- Smooth scrolling
- Hardware-accelerated
- Customizable easing

### 3D Visualization

#### Three.js + React Three Fiber
- WebGL rendering
- 3D scene management
- Performance optimizations

#### @react-three/drei
- Helper components
- Camera controls
- 3D text, environment maps, etc.

---

## Data Flow

### 1. Server Component Data Flow

```
┌────────────────┐
│  Server Page   │
│   (RSC)        │
└───────┬────────┘
        │
        ├─ Fetch from Supabase
        │
        ▼
┌────────────────┐
│  Render HTML   │
│  + Stream      │
└───────┬────────┘
        │
        ▼
┌────────────────┐
│    Client      │
│  Hydration     │
└────────────────┘
```

### 2. Client Component Data Flow

```
┌────────────────┐
│ Client Comp    │
│ useQuery       │
└───────┬────────┘
        │
        ├─ API Route or Direct Supabase
        │
        ▼
┌────────────────┐
│  Cache (RQ)    │
└───────┬────────┘
        │
        ├─ Revalidate
        │
        ▼
┌────────────────┐
│   Re-render    │
└────────────────┘
```

### 3. Form Submission Flow

```
User Input
    │
    ▼
React Hook Form + Zod Validation
    │
    ├─ Invalid → Show Errors
    │
    ▼ Valid
Server Action / API Route
    │
    ├─ Process Data
    │
    ▼
Supabase Database
    │
    ▼
React Query Invalidation
    │
    ▼
UI Update + Toast Notification
```

---

## Component Architecture

### Component Hierarchy

```
┌─────────────────────────────────────┐
│         Root Layout                 │
│  (Theme, Providers, Global Nav)     │
└─────────────┬───────────────────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼───────────┐  ┌───▼────────────┐
│ Auth Layout   │  │ Public Layout  │
│ (Dashboard)   │  │ (Marketing)    │
└───┬───────────┘  └───┬────────────┘
    │                  │
    │                  │
┌───▼───────────┐  ┌───▼────────────┐
│   Page        │  │    Page        │
│ (Server RSC)  │  │  (Server RSC)  │
└───┬───────────┘  └───┬────────────┘
    │                  │
    │                  │
┌───▼───────────┐  ┌───▼────────────┐
│ Feature Comp  │  │ Feature Comp   │
│ (Mix of RSC   │  │   (Mix of      │
│  & Client)    │  │  RSC & Client) │
└───┬───────────┘  └───┬────────────┘
    │                  │
    │                  │
┌───▼───────────┐  ┌───▼────────────┐
│  UI Primitive │  │  UI Primitive  │
│  (shadcn/ui)  │  │   (shadcn/ui)  │
└───────────────┘  └────────────────┘
```

### Component Types

#### 1. Page Components (`app/**/page.tsx`)
- Entry points for routes
- Server Components by default
- Fetch data directly

#### 2. Layout Components (`app/**/layout.tsx`)
- Shared UI across routes
- Wrap child pages
- Define metadata

#### 3. Feature Components (`components/features/*`)
- Domain-specific logic
- Can be Server or Client
- Compose UI primitives

#### 4. Shared Components (`components/shared/*`)
- Used across multiple features
- Navigation, headers, footers
- Usually Client Components

#### 5. UI Components (`components/ui/*`)
- Primitive, reusable elements
- From shadcn/ui
- Fully customizable

---

## State Management

### Server State (React Query)

**Use for:**
- API data
- Database queries
- Remote resources

```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => fetchUser(userId),
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

### Client State (Zustand)

**Use for:**
- UI state (modals, sidebar)
- User preferences
- Temporary form state

```typescript
const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen }))
}));
```

### Form State (React Hook Form)

**Use for:**
- Form inputs and validation

```typescript
const { register, handleSubmit, formState: { errors } } = useForm({
  resolver: zodResolver(schema)
});
```

---

## Authentication Flow

```
┌──────────────┐
│   User       │
│  Accesses    │
│  /dashboard  │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Middleware  │
│  Check Auth  │
└──────┬───────┘
       │
       ├─ No Session
       │     │
       │     ▼
       │  Redirect to /login
       │
       ├─ Has Session
       │     │
       │     ▼
       │  Allow Access
       │
       ▼
┌──────────────┐
│   Dashboard  │
│   Renders    │
└──────────────┘
```

### Authentication Implementation

```typescript
// proxy.ts
export async function updateSession(request: NextRequest) {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session && request.nextUrl.pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  
  return NextResponse.next();
}
```

---

## Database Schema

### Core Tables

#### `users`
- Extends Supabase Auth users
- Profile information
- Preferences

#### `projects`
- User projects
- Collaboration settings
- Metadata

#### `messages`
- AI chat messages
- User conversations
- Context history

### Row Level Security (RLS)

All tables have RLS policies:

```sql
-- Users can only read their own data
CREATE POLICY "Users can view own profile"
ON users FOR SELECT
USING (auth.uid() = id);

-- Users can only update their own data
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);
```

---

## API Design

### Route Handlers (`app/api/**/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  // Handle GET request
  return NextResponse.json({ data: "..." });
}

export async function POST(request: NextRequest) {
  // Handle POST request
  const body = await request.json();
  return NextResponse.json({ success: true });
}
```

### Server Actions (Recommended)

```typescript
"use server"
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const name = formData.get("name");
  
  // Validate
  // Save to DB
  
  revalidatePath("/dashboard");
  return { success: true };
}
```

---

## Performance Considerations

### Bundle Optimization

1. **Code Splitting**
   - Automatic with App Router
   - Dynamic imports for large components

2. **Image Optimization**
   - Use `next/image`
   - Automatic format conversion (WebP)
   - Lazy loading

3. **Font Optimization**
   - Self-hosted fonts
   - Subset only needed characters

### Rendering Strategy

- **Static** - Pre-rendered at build time
- **Dynamic** - Rendered on-demand
- **Streaming** - Incremental rendering

---

## Security Best Practices

1. **Environment Variables**
   - Never commit secrets
   - Use `NEXT_PUBLIC_` prefix for client-exposed vars

2. **Authentication**
   - Always validate on the server
   - Use Supabase RLS for database security

3. **Input Validation**
   - Zod schemas for all inputs
   - Sanitize user content

4. **CORS**
   - Restrict API access
   - Validate origins

---

## Additional Resources

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Supabase Documentation](https://supabase.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [React Query Guides](https://tanstack.com/query/latest/docs)

---

**Questions?** See [Development Guide](./DEVELOPMENT.md) or [Contributing Guide](./CONTRIBUTING.md).

[← Back to README](../README.md) | [Deployment Guide →](./DEPLOYMENT.md)
