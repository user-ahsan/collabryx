# 🤖 AGENTS.md - Collabryx Development Guide

Project: Collabryx (AI-Powered Collaborative Platform)
Stack: Next.js 16, React 19, TypeScript, Supabase, Tailwind CSS v4
State: Production Ready ✅ (Phase 5 Complete)

## 🛑 PRE-EXECUTION MANDATES (READ FIRST)
Before writing, modifying, or deleting a single line of code, you must execute these mandatory pre-flight checks:

- **Codebase Reconnaissance (No Duplication):** Before creating a new utility, hook, or UI component, you MUST search the existing directory tree. If a component/utility already exists, you are strictly required to use it or extend it. Creating duplicate logic is a fatal exception.
- **Version-Compatible Doc Fetching:** Verify your knowledge against Next.js 16, React 19, and Tailwind v4. If uncertain about an API change, fetch the specific version's documentation. Hallucinating deprecated APIs is forbidden.
- **Framework Best Practices Alignment:** Explicitly align with the official architectural paradigms of the requested technology. Do not use outdated patterns.
- **Impact Assessment:** Before modifying a shared component or utility, assess its import usage across the codebase. You are responsible for ensuring changes do not break dependent routes.

## 🦠 ANTI-ENTROPY & CODEBASE PURITY RULES
To maintain the "best codebase ever," the system must resist entropy. You are bound by the following structural laws:

- **Single Source of Truth (SSOT):** Data models, types, and business logic must exist in one place. Never redefine an interface that already exists in `@/types/database.types.ts`.
- **Zero Dead Code:** Delete commented-out code, unused imports, and orphaned variables before finalizing output. Do not leave "todo" comments unless explicitly tracking a multi-stage prompt.
- **The Boy Scout Rule:** If you open a messy or poorly typed file, leave it cleaner than you found it. Apply strict types and remove any existing `@ts-ignore` flags within the scope of your edit.
- **Strict Component Size Limits:** If a component exceeds 250 lines, logically abstract it. Separate complex state into hooks and break massive JSX blocks into private sub-components.
- **No Orphaned Files:** New files must be exported properly, imported where needed, and logically placed within the feature-based architecture (`components/features/<domain>/`).

## 🎯 ZERO-TOLERANCE IRON RULES
Violating any of these will result in immediate rejection:

1. **NO NEW PACKAGES:** You are strictly forbidden from adding dependencies to `package.json`.
2. **NO VERSION BUMPS:** Never modify package versions under any circumstances.
3. **CONFIG IMMUTABILITY:** Configuration files (`tsconfig.json`, `next.config.ts`) are strictly read-only. Adapt your code to the config, never the reverse.
4. **NO CSS MODULES:** Tailwind CSS v4 is the only permitted styling solution.
5. **NO `any` TYPES:** Strict TypeScript only. Use `unknown` and type narrowing.
6. **NO FILE REWRITES:** Apply minimal, surgical, line-by-line modifications to solve the immediate problem. Never rewrite entire files.
7. **NO ROOT MODIFICATIONS:** Do not touch root directory files unless explicitly commanded.
8. **BUN ONLY:** Always use `bun` for package management, scripts, and running tests. Never use `npm` or `npx`. Use `bunx` instead of `npx`.

## 🏗 ARCHITECTURAL & QUALITY CONSTRAINTS
### TypeScript Strictness
- **The `any` Type is Banned:** Use `unknown` and implement strict runtime type narrowing (Zod parsing or instanceof checks).
- **No `@ts-ignore`:** Silencing the compiler is forbidden. Resolve the underlying TypeScript error.
- **Prop & State Discipline:** Prop drilling beyond two levels is strictly forbidden. Utilize server state (React Query) or URL search parameters to manage global data contextually.

### Next.js 16 Paradigms
- **Server-First Architecture:** Default to Server Components.
- **Client Boundary Restrictions:** Use the `"use client"` directive only at the lowest possible leaf node where interactivity (hooks, DOM events) is absolutely required.
- **Validation:** All forms, API inputs, Server Actions, and URL search parameters MUST be validated using strictly defined Zod schemas.

### Imports & File Organization
- **Absolute Paths Only:** Always use the `@/` alias. Relative paths (`../../`) are banned.
- **Strict Import Ordering:** Force imports into exactly this order: React/Next.js → Third-Party Libraries → Internal Modules → Types.
- **Naming Conventions:** Files must use `kebab-case.ts/tsx`. Components must use `PascalCase`. Hooks must use `camelCase` with a `use` prefix.

### Styling Constraints (Tailwind CSS v4)
- **Dynamic Classes:** Always wrap conditional Tailwind classes using the `cn()` utility from `@/lib/utils/cn`.
- **Design Tokens:** Hardcoded hex codes and magic pixel values are strictly prohibited. Use Shadcn design tokens (e.g., `bg-muted`, `text-primary-foreground`).

## 🗄 SUPABASE & DATA FETCHING CONSTRAINTS
- **Targeted Queries:** Never use `select('*')`. Explicitly define the exact columns required to optimize payload size and memory footprint.
- **Immediate Error Trapping:** Supabase requests must be immediately followed by a strict `if (error)` check. Never assume successful data retrieval.
- **Row Level Security (RLS) Compliance:** Assume all tables have RLS. Ensure queries account for authenticated user contexts and never attempt to bypass RLS policies in standard API routes.
- **Environment-Strict Clients:** Use the server client (`@/lib/supabase/server`) for Server Components/Actions and the browser client (`@/lib/supabase/client`) for Client Components. Mixing them is a fatal error.

## 🧪 TESTING (PYTHON EMBEDDING SERVICE)
- **Python Worker Tests:** Test files live in `python-worker/tests/` (Pytest).
- **Manual Testing:** Run `bun run dev` and verify features work end-to-end.
- **Type Safety:** Ensure TypeScript remains strict — no `any`, no `@ts-ignore`.

## 📁 EXACT DIRECTORY STRUCTURE
*Reference taken directly from README.md to ensure strict placement.*

```text
collabryx/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yml              # Continuous integration
│       └── security.yml        # Security scanning
├── app/                        # Next.js App Router
│   ├── (auth)/                # Protected routes (dashboard, messages, etc.)
│   ├── (public)/              # Public routes (landing, login, register)
│   └── api/                   # API routes (22+ endpoints)
├── components/
│   ├── features/              # Domain-specific components (16 domains)
│   │   ├── ai-mentor/         # AI mentor chat
│   │   ├── analytics/         # Analytics dashboard
│   │   ├── auth/              # Authentication forms
│   │   ├── connections/       # User connections
│   │   ├── dashboard/         # Dashboard (posts, comments, feed)
│   │   ├── landing/           # Landing page components
│   │   ├── matches/           # Matching system
│   │   ├── messages/          # Messaging
│   │   ├── moderation/        # Content moderation
│   │   ├── notifications/     # Notifications
│   │   ├── onboarding/        # Onboarding flow
│   │   ├── posts/             # Post attachments
│   │   ├── profile/           # User profile
│   │   ├── requests/          # Connection requests
│   │   ├── search/            # Global search
│   │   └── settings/          # User settings
│   ├── shared/                # Cross-feature components (23)
│   │   ├── glass-card.tsx     # Glassmorphism card
│   │   ├── sidebar-nav.tsx    # Navigation
│   │   └── user-nav-dropdown.tsx
│   ├── ui/                    # shadcn/ui primitives (58 components)
│   └── providers/             # React context providers
├── hooks/                     # Custom React hooks (30)
│   ├── use-auth.ts            # Authentication
│   ├── use-messages.ts        # Messaging
│   ├── use-matches-query.ts   # Matching logic
│   └── use-settings.ts        # User settings
├── lib/
│   ├── actions/               # Server Actions (10)
│   ├── ai/                    # AI provider system
│   │   └── providers/         # Provider implementations
│   ├── config/                # Configuration modules
│   ├── constants/             # Constants
│   ├── data/                  # Data definitions
│   ├── errors/                # Error types
│   ├── prompt/                # AI prompt templates
│   ├── rag/                   # RAG pipeline
│   ├── services/              # Business logic (21 services)
│   ├── supabase/              # Supabase client setup
│   ├── utils/                 # Utility functions
│   └── validations/           # Zod schemas
├── scripts/                   # Automation scripts
│   ├── *.mjs                  # Docker management scripts
│   └── seed-data/             # Database seeding
├── docs/                      # Documentation (33 files)
│   ├── 01-getting-started/
│   ├── 02-architecture/
│   │   ├── diagrams.md
│   │   ├── overview.md
│   │   └── user-stories-and-sequence-diagrams.md
│   ├── 03-core-features/
│   │   ├── ai-assistant/
│   │   ├── vector-embeddings/
│   │   ├── api-reference.md
│   │   ├── authentication.md
│   │   ├── matching-system.md
│   │   └── messaging.md
│   ├── 04-infrastructure/
│   │   ├── database/
│   │   ├── python-worker/
│   │   ├── monitoring.md
│   │   └── performance.md
│   ├── 05-deployment/
│   │   ├── checklist.md
│   │   ├── docker-scripts.md
│   │   ├── overview.md
│   │   └── runbook.md
│   ├── 06-contributing/
│   ├── 07-reference/
│   ├── 08-database-seeding/
│   ├── IMPLEMENTATION_PLAN.md
│   └── SECURITY.md
├── python-worker/             # Python embedding service (FastAPI)
│   ├── main.py                # FastAPI entry point
│   ├── embedding_generator.py # Sentence Transformers logic
│   ├── rate_limiter.py        # Database-backed rate limiting
│   ├── embedding_validator.py # Validation & dimension normalization
│   └── tests/                 # Pytest suite
├── supabase/                  # Database config
│   ├── config.toml            # Supabase configuration
│   ├── migrations/            # Migration files
│   └── setup/                 # Schema setup (39 tables + RLS + triggers)
├── public/                    # Static assets
│   ├── icons/                 # ~154 Lucide icons
│   ├── images/                # SVG assets
│   └── Models/                # 3D models (GLTF)
├── types/                     # TypeScript type definitions (6 files)
├── AGENTS.md                  # AI agent development guide (this file)
├── proxy.ts                   # Auth middleware
├── render.yaml                # Render deployment config
└── expected-objects/          # Backend schema specs
```
