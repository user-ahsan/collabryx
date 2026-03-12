# 🤖 Collabryx Agent Context

**Project:** Collabryx - Next-Generation Collaborative Platform with AI-Powered Features
**Repository:** https://github.com/user-ahsan/collabryx.git
**Last Updated:** 2026-03-12
**Context Fingerprint:** `collabryx-context-2026-03-12`

---

## 📋 Project Overview

Collabryx is a cutting-edge collaborative platform combining real-time collaboration features with AI integration, 3D visualizations, and premium UX. Built with Next.js 16, TypeScript, React 19, and Supabase.

### Key Metrics

- **Framework:** Next.js 16.1.5 (App Router)
- **React:** 19.2.3
- **TypeScript:** 5.x (Strict Mode)
- **Database:** Supabase (PostgreSQL)
- **State Management:** Zustand 5.0.8, React Query 5.90.11
- **UI Library:** Radix UI + shadcn/ui + Tailwind CSS v4
- **3D Graphics:** Three.js, React Three Fiber, Drei
- **Animations:** Framer Motion 12, GSAP 3.13, Lenis

---

## 🏗️ Architecture

### Tech Stack

```
Frontend: Next.js 16 (App Router) + React 19 + TypeScript
Backend: Supabase (PostgreSQL, Auth, Realtime, Edge Functions)
Styling: Tailwind CSS v4 + Radix UI + shadcn/ui
3D/Visual: Three.js, R3F, Drei, Cobe, Maath, GSAP, Lenis, OGL, Postprocessing
State: Zustand (client), React Query (server)
Forms: React Hook Form + Zod validation
AI: face-api.js (face detection/recognition)
```

### Project Structure

```
collabryx/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Protected routes
│   │   ├── assistant/            # AI assistant feature
│   │   ├── dashboard/            # Main dashboard
│   │   ├── matches/              # Matches feature
│   │   ├── messages/             # Messaging feature
│   │   ├── my-profile/           # User profile
│   │   ├── notifications/        # Notifications
│   │   ├── onboarding/           # Onboarding flow
│   │   ├── post/                 # Post creation/view
│   │   ├── profile/              # Profile management
│   │   └── requests/             # Connection requests
│   ├── (public)/                 # Public routes
│   │   ├── landing/              # Landing page
│   │   ├── login/                # Login page
│   │   ├── register/             # Registration page
│   │   └── auth-sync/            # Auth sync handler
│   ├── api/                      # API routes
│   ├── globals.css               # Global styles (Tailwind)
│   ├── layout.tsx                # Root layout
│   ├── loading.tsx               # Loading UI
│   ├── error.tsx                 # Error boundary
│   └── not-found.tsx             # 404 page
├── components/
│   ├── features/                 # Domain-specific components
│   │   ├── assistant/            # AI assistant components
│   │   ├── auth/                 # Authentication components
│   │   ├── dashboard/            # Dashboard components
│   │   ├── landing/              # Landing page components
│   │   ├── matches/              # Matches feature components
│   │   ├── messages/             # Messaging components
│   │   ├── onboarding/           # Onboarding components
│   │   ├── profile/              # Profile components
│   │   ├── requests/             # Connection requests components
│   │   └── settings/             # Settings components
│   ├── shared/                   # Cross-feature components
│   │   ├── glass-card.tsx        # Glassmorphism card
│   │   ├── glass-dropdown-menu.tsx
│   │   ├── match-score.tsx       # Match score display
│   │   ├── mobile-nav.tsx        # Mobile navigation
│   │   ├── sidebar-context.tsx   # Sidebar context
│   │   ├── sidebar-nav.tsx       # Sidebar navigation
│   │   └── user-nav-dropdown.tsx # User dropdown
│   ├── providers/                # Context providers
│   │   ├── query-provider.tsx    # React Query provider
│   │   └── smooth-scroll-provider.tsx
│   └── ui/                       # shadcn/ui primitives
├── hooks/                        # Custom React hooks
│   ├── use-auth.ts               # Authentication hook
│   ├── use-chat.ts               # Chat hook
│   ├── use-debounce.ts           # Debounce hook
│   ├── use-matches.ts            # Matches hook
│   ├── use-media-query.ts        # Media query hook
│   ├── use-messages.ts           # Messages hook
│   ├── use-profile.ts            # Profile hook
│   ├── use-settings.ts           # Settings hook
│   └── use-viewport-animation.ts # Viewport animation hook
├── lib/
│   ├── constants/                # App constants
│   ├── mock-data/                # Mock data for development
│   ├── services/                 # Business logic services
│   │   ├── development.ts        # Development service
│   │   ├── embeddings.ts         # Embedding generation service
│   │   ├── matches.ts            # Matches service
│   │   ├── posts.ts              # Posts service
│   │   └── profiles.ts           # Profiles service
│   ├── supabase/                 # Supabase client setup
│   │   ├── client.ts             # Client-side Supabase
│   │   └── server.ts             # Server-side Supabase
│   ├── utils/                    # Helper functions
│   │   └── format-date.ts        # Date formatting utility
│   └── validations/              # Zod schemas
├── types/                        # TypeScript type definitions
│   ├── database.types.ts         # Supabase database types
│   ├── index.ts                  # Type exports
│   └── next-auth.d.ts            # NextAuth type extensions
├── docs/                         # Documentation
│   ├── core/                     # Core documentation
│   │   ├── Collabryx-AI-integeration.md
│   │   ├── Collabryx-development-debugging.md
│   │   ├── Collabryx-implementation.md
│   │   └── Required_API_Endpoints.md
│   ├── vector-embeddings/        # Vector embedding documentation
│   ├── ARCHITECTURE.md           # Architecture guide
│   ├── DEVELOPMENT.md            # Development workflow
│   ├── DEPLOYMENT.md             # Deployment guide
│   ├── INSTALLATION.md           # Setup instructions
│   └── CONTRIBUTING.md           # Contribution guidelines
├── supabase/
│   ├── functions/                # Edge Functions
│   └── setup/                    # Database setup scripts
├── python-worker/                # Python background workers
│   ├── main.py                   # Main worker entry
│   ├── embedding_generator.py    # Embedding generation
│   ├── test_embeddings.py        # Embedding tests
│   ├── Dockerfile                # Worker container
│   └── docker-compose.yml        # Docker compose config
├── public/                       # Static assets
│   ├── Models/                   # 3D models
│   ├── icons/                    # Icon assets
│   └── images/                   # Image assets
└── .agent/                       # Agent rules and behaviors
    └── rules/
        ├── behaviour.md          # Agent communication style
        ├── coding-protocol.md    # Coding standards
        ├── code.md               # Code quality rules
        └── files-structure.md    # File organization
```

### Key Components

- **FluidGlass.tsx** - Glassmorphism UI component
- **GridScan.tsx** - 3D grid scanning visualization
- **LogoLoop.tsx** - Animated logo component
- **ModelViewer.tsx** - 3D model viewer
- **Orb.tsx** - 3D orb visualization
- **ScrollFloat.tsx** - Scroll-based animations
- **ScrollReveal.tsx** - Scroll reveal animations
- **ScrollStack.tsx** - Stacked scroll component
- **CountUp.tsx** - Number counter animation

---

## 🔧 Development Environment

### Prerequisites

- Node.js (LTS)
- Bun (package manager - bun.lock present)
- Git
- Supabase account

### Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### Scripts

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint check
```

### Configuration Files (READ-ONLY)

- `tsconfig.json` - TypeScript config (strict mode, absolute imports @/*)
- `next.config.ts` - Next.js config
- `tailwind.config.ts` - Tailwind CSS v4 config
- `postcss.config.mjs` - PostCSS config
- `eslint.config.mjs` - ESLint config
- `components.json` - shadcn/ui config
- `package.json` - Dependencies and scripts

---

## 📜 Agent Protocols

### Behavioral Protocol

**Role:** Implementation Architect focused on building features, not DevOps

**Communication Style:**

- Direct, no-BS tech professional
- Clear, everyday language
- Scannable chunks (bullets/numbers)
- Actionable advice over formality
- High-impact, low-complexity solutions first

**Expertise Areas:**

- Full-stack development (React, Next.js, Node.js, Python)
- Frontend optimization and performance
- Backend architecture and scalability
- Database optimization (PostgreSQL, Supabase)
- Security best practices
- Technical debt management

**Approach:**

- Prioritize scalability and maintainability
- Balance quick wins vs. long-term architecture
- Focus on high-impact, low-complexity solutions first
- Provide specific, actionable steps rather than theory
- Include rough time/effort estimates when relevant

### Coding Protocol (IRON RULES)

#### 🛑 STRICT PROHIBITIONS

1. **NO NEW PACKAGES** - Use only existing dependencies in package.json
2. **NO VERSION BUMPS** - Never modify package versions
3. **CONFIG FILES ARE READ-ONLY** - Adapt code to existing config, not vice versa
4. **NO CSS MODULES** - Use Tailwind CSS only
5. **NO `any` TYPES** - Strict TypeScript, no @ts-ignore
6. **NO FILE REWRITES** - Make minimal changes, edit line-by-line
7. **NO MULTIPLE REPLACEMENTS** - Single line changes only

#### ✅ BEST PRACTICES

1. **Custom utilities over packages** - Write helpers in `lib/utils/`
2. **Feature-based architecture** - `components/features/<domain>/`
3. **Server actions + React Query** - For data fetching
4. **Absolute imports** - `@/` prefix (e.g., `@/lib/utils/cn`)
5. **Verify imports exist** - Don't hallucinate components
6. **Minimal changes** - Change as little code as possible

#### 🎯 Tech Standards

- **Components:** Functional with `export const`
- **Styling:** Tailwind CSS + shadcn/ui primitives
- **State:** Zustand (client), React Query (server state)
- **Forms:** React Hook Form + Zod validation
- **Security:** Environment variables via `process.env` only

---

## 🔒 Code Quality Assurance Protocol

### TypeScript & Data Validation

- **Strict Typing:** Use `unknown` instead of `any`, then narrow types
- **Database Types:** Import from `@/types/database.types.ts`
- **Runtime Validation:** Use Zod for all inputs (forms, API params, search params)
- **Guard Clauses:** Return early to reduce nesting

### React & Next.js Patterns

- **Server-First:** Default to Server Components, use `"use client"` only when needed
- **Server Fetching:** Fetch data in Server Components, not `useEffect`
- **Suspense:** Use `loading.tsx` or `<Suspense>` for slow data
- **Composition:** Break complex UIs into small, single-responsibility components

### Tailwind CSS & UI

- **Utility Merger:** ALWAYS use `cn()` for conditional classes
- **Design Tokens:** Use `text-primary`, `bg-muted` (shadcn tokens)
- **Responsive:** Mobile-first approach (`w-full md:w-1/2`)
- **No Magic Values:** Avoid `w-[342px]`, use design system values

### Error Handling

- **Guard Clauses:** Handle null/undefined early
- **Granular Errors:** Handle specific error codes (401 vs 404)
- **User Feedback:** Use `toast.error()` for client-side failures
- **Error Boundaries:** Use `error.tsx` for route segments

### Performance Rules

1. **Image Optimization:** Always use `next/image` with defined dimensions
2. **Debouncing:** Use `useDebounce` for input-driven fetches
3. **Memoization:** Wrap expensive computations in `useMemo`
4. **Bundle Size:** Import specific icons (`import { Menu } from "lucide-react"`)

### Supabase & Database

- **Typed Clients:** Always use `<Database>` generics
- **Specific Selects:** `.select('id, name, avatar_url')` not `*`
- **Error Handling:** Check `if (error)` immediately after queries
- **RLS:** Row Level Security on all tables

---

## 📁 File Structure Rules

### Directory Map

- **`app/(auth)/`**: Protected routes requiring user session
- **`app/(public)/`**: Publicly accessible routes (marketing, login, register)
- **`components/features/<domain>/`**: Domain-specific components
- **`components/shared/`**: Cross-feature components
- **`components/ui/`**: shadcn/ui primitives
- **`hooks/`**: Custom React hooks
- **`lib/supabase/`**: Supabase client initialization
- **`supabase/functions/`**: Deno-based Edge Functions

### File Creation Rules

- **NEVER** create files in root directory unless explicitly asked
- **NEVER** create `pages/` directory (App Router only)
- **ALWAYS** check existing `components/features/` structure first
- **Maintain** `(auth)` and `(public)` route group separation

### Naming Conventions

- **File names:** `kebab-case` (e.g., `user-profile.tsx`)
- **Component names:** `PascalCase` (e.g., `UserProfile`)
- **Imports:** Use `@/` alias (e.g., `import { Button } from "@/components/ui/button"`)

### Supabase Patterns

- **Client:** `createBrowserClient` from `@/lib/supabase/client` in Client Components
- **Server:** `createServerClient` from `@/lib/supabase/server` in Server Components/Actions
- **Edge Functions:** Business logic in `supabase/functions/`

---

## 📚 Reference Directories

### @expected-objects/ - Backend Schema Specification

**Purpose:** Complete backend schema specification derived from frontend codebase

**Contents:**
- `00-overview.md` - Entity relationship diagram and table index
- `01-profiles.md` through `22-theme-preferences.md` - Individual table specifications
- `onboarding-flow.md` - Onboarding embedding flow documentation

**22 Tables Documented:**
1. **User Management:** `profiles`, `user_skills`, `user_interests`, `user_experiences`, `user_projects`
2. **Social Features:** `posts`, `post_attachments`, `post_reactions`, `comments`, `comment_likes`, `connections`
3. **Matching System:** `match_suggestions`, `match_scores`, `match_activity`, `match_preferences`
4. **Messaging:** `conversations`, `messages`
5. **Notifications:** `notifications`, `notification_preferences`
6. **AI Features:** `ai_mentor_sessions`, `ai_mentor_messages`
7. **Preferences:** `theme_preferences`

**Usage:** Reference these specs when working with database types, API responses, or Supabase queries

### @supabase/setup/ - Database Setup Scripts

**Purpose:** Production-ready SQL scripts for database schema deployment

**Contents:**
- `01-profiles.sql` through `22-theme-preferences.sql` - Individual table setup (run in order)
- `23-profile-embeddings.sql` - Vector embeddings for profile matching
- `24-embeddings-trigger.sql` - Automatic embedding generation triggers
- `98-storage-buckets.sql` - Storage bucket configuration
- `99-master-all-tables.sql` - Complete schema in one file

**Each SQL File Includes:**
- Table creation with constraints
- Optimized indexes for common queries
- Triggers for `updated_at` timestamps
- Row Level Security (RLS) policies
- Realtime publication enabled

**Storage Buckets:**
| Bucket | Purpose | Max Size |
|--------|---------|----------|
| `post-media` | Posts, messages, comments | 50MB |
| `profile-media` | Avatars, banners | 10MB |
| `project-media` | Project images | 10MB |

**Usage:** Run `99-master-all-tables.sql` in Supabase SQL Editor for complete setup, or run individual files in order (01-22)

**Helper Functions:**
- `get_conversation(user1, user2)` - Get conversation between two users
- `are_connected(user1, user2)` - Check if users are connected

**Profile Completion Logic:**
- 25% - Basic profile (name, headline)
- 50% - Skills added (at least 1 skill)
- 90% - Interests & goals (interests + looking_for)
- 100% - Complete (experience, projects, or links)

---

## 🎯 Key Features & Capabilities

### Authentication & Authorization

- Supabase Auth with Row Level Security (RLS)
- Protected routes in `app/(auth)/`
- Session management via `@supabase/ssr`
- Auth sync flow with GSAP animations

### Real-time Collaboration

- Supabase Realtime subscriptions
- Live data synchronization
- Collaborative editing support

### 3D Visualizations

- Interactive globes (Cobe)
- 3D model viewers (Three.js + R3F)
- Scroll-based animations (GSAP + Lenis)
- WebGL effects and shaders (OGL, Postprocessing)

### AI Integration

- Face detection/recognition (face-api.js)
- Python worker for embedding generation
- Vector embeddings for onboarding flow
- AI assistant feature

### UI/UX Excellence

- Dark mode support (next-themes)
- Smooth scroll (Lenis)
- Toast notifications (Sonner)
- Accessible components (Radix UI)
- Micro-interactions (Framer Motion)
- Glassmorphism effects (FluidGlass)

---

## 📈 Performance KPIs to Track

### Performance Metrics

- Page load time & Core Web Vitals
- API response times
- Database query performance
- Cache hit rates
- Error rates & recovery time

### Code Quality Metrics

- Test coverage percentage
- Code complexity scores
- Technical debt ratio
- Code review completion time
- Bug resolution time

### User Experience Metrics

- Time to First Byte (TTFB)
- First Contentful Paint (FCP)
- Time to Interactive (TTI)
- User engagement metrics
- Feature adoption rates

### Development Efficiency

- Sprint velocity
- Deployment frequency
- Time to recovery
- Pull request cycle time
- Build time optimization

---

## 🔐 Security Best Practices

1. **Environment Variables** - Never hardcode secrets
2. **Supabase RLS** - Row Level Security on all tables
3. **Input Validation** - Zod schemas for all inputs
4. **Type Safety** - No `any` types, strict TypeScript
5. **Access Control** - Protected routes in `(auth)/` group
6. **API Security** - Validate all API inputs/outputs

---

## 🚀 Deployment

### Platform

- **Hosting:** Vercel (`.vercel/` directory present)
- **Database:** Supabase
- **Edge Functions:** Supabase Edge Functions
- **Background Workers:** Python workers in `python-worker/` (Docker)

### Deployment Checklist

- [X] Environment variables configured in Vercel
- [X] Supabase setup scripts applied
- [ ] Edge functions deployed
- [X] Python workers running (Docker)
- [X] Build passes (`npm run build`)
- [X] Linting passes (`npm run lint`)

---

## 📚 Documentation Links

- [Architecture Guide](./docs/ARCHITECTURE.md)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Installation Guide](./docs/INSTALLATION.md)
- [Contributing Guide](./docs/CONTRIBUTING.md)
- [AI Integration](./docs/core/Collabryx-AI-integeration.md)
- [API Endpoints](./docs/core/Required_API_Endpoints.md)

---

## 🆘 Quick Troubleshooting

### Common Issues

1. **Build fails** - Check TypeScript errors, ensure all types are defined
2. **Auth issues** - Verify Supabase env vars are set correctly
3. **3D not rendering** - Check WebGL support, Three.js imports
4. **Styling broken** - Ensure Tailwind classes are correct, no CSS conflicts
5. **API errors** - Check Supabase RLS policies, edge function logs
6. **Embedding failures** - Check Python worker is running

### Getting Help

- Check documentation in `docs/`
- Review agent rules in `.agent/rules/`
- Check git history for recent changes

---

## 🎯 Session Workflow

### Start of Session

1. Review current branch: `git status`
2. Check recent commits: `git log --oneline -5`
3. Read relevant docs in `docs/`

### During Work

- Follow coding protocol (no new packages, config files read-only)
- Use feature-based architecture
- Write full files, no placeholders
- Maintain type safety

### End of Session

```bash
# Stage changes
git add .

# Commit with message
git commit -m "feat: description of changes"

# Push to remote
git push
```

---

**Last Context Capture:** 2026-03-12
**Context Type:** Comprehensive
**Storage Format:** Markdown
**Semantic Tags:** #nextjs #typescript #supabase #react #3d #ai #collaboration #realtime
