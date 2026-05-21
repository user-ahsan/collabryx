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
3. **CONFIG IMMUTABILITY:** Configuration files (`tailwind.config.ts`, `tsconfig.json`, `next.config.js`) are strictly read-only. Adapt your code to the config, never the reverse.
4. **NO CSS MODULES:** Tailwind CSS v4 is the only permitted styling solution.
5. **NO `any` TYPES:** Strict TypeScript only. Use `unknown` and type narrowing.
6. **NO FILE REWRITES:** Apply minimal, surgical, line-by-line modifications to solve the immediate problem. Never rewrite entire files.
7. **NO ROOT MODIFICATIONS:** Do not touch root directory files unless explicitly commanded.

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

## 🧪 TESTING MANDATES (VITEST & PLAYWRIGHT)
- **AAA Pattern is Mandatory:** Every test must be visually structured into Arrange, Act, and Assert blocks with clear comments separating the phases.
- **Mock Infrastructure:** Do not hit real databases in unit/component tests. Utilize the existing mock infrastructure (`mockSupabaseClient`, mock data factories) found in `tests/setup/`.
- **Coverage for Failures:** Ensure unit tests handle both expected outcomes and specific edge-case error codes (e.g., PostgreSQL error 23505).

## 📁 EXACT DIRECTORY STRUCTURE
*Reference taken directly from README.md to ensure strict placement.*

```text
collabryx/
├── app/                        # Next.js App Router
│   ├── (auth)/                # Protected routes (dashboard, messages, etc.)
│   ├── (public)/              # Public routes (landing, login, register)
│   └── api/                   # API routes
├── components/
│   ├── features/              # Domain-specific components
│   │   ├── assistant/         # AI assistant feature
│   │   ├── dashboard/         # Dashboard components
│   │   ├── matches/           # Matching system
│   │   ├── messages/          # Messaging
│   │   ├── onboarding/        # Onboarding flow
│   │   └── profile/           # User profile
│   ├── shared/                # Cross-feature components
│   │   ├── glass-card.tsx     # Glassmorphism card
│   │   ├── sidebar-nav.tsx    # Navigation
│   │   └── user-nav-dropdown.tsx
│   └── ui/                    # shadcn/ui primitives
├── hooks/                     # Custom React hooks
│   ├── use-auth.ts            # Authentication
│   ├── use-chat.ts            # Chat functionality
│   ├── use-matches.ts         # Matching logic
│   └── use-settings.ts        # User settings
├── lib/
│   ├── supabase/              # Supabase client setup
│   ├── services/              # Business logic
│   │   ├── embeddings.ts      # Embedding generation
│   │   ├── matches.ts         # Matching service
│   │   └── profiles.ts        # Profile service
│   └── utils/                 # Helper functions
├── tests/                     # Test suite (118 files, 750+ tests)
│   ├── unit/                  # Unit tests (hooks, lib, services, actions)
│   │   ├── hooks/             # 10 hook test files
│   │   ├── lib/               # 30+ library/utility tests
│   │   ├── services/          # 5 service algorithm tests
│   │   └── actions/           # Server action tests
│   ├── components/            # Component tests (25+ files)
│   │   ├── features/          # Domain component tests (auth, matches, messages, etc.)
│   │   ├── ui/                # UI primitive tests (globe, theme toggler, button)
│   │   └── shared/            # Shared component tests (sidebar, notification)
│   ├── integration/           # Cross-layer integration tests (30+ files)
│   │   ├── auth/              # RLS policies, session expiry
│   │   ├── embeddings/        # Embedding pipeline, worker failure, DLQ
│   │   ├── ai-mentor/         # Chat sessions, MVP checklist, Lean Canvas, resilience
│   │   ├── matches/           # Match flow end-to-end
│   │   ├── realtime/          # Chat realtime, event processing
│   │   ├── profile/           # Onboarding flow, CRUD, optimistic updates, cascade delete
│   │   ├── notifications/     # Notification storage flow
│   │   ├── moderation/        # Content scanning & quarantine
│   │   ├── analytics/         # Activity tracking, daily aggregation
│   │   ├── ui/                # Responsive layout, keyboard nav, smooth scroll

│   │   ├── environment/       # Dev server, Docker worker health
│   │   └── seeder/            # DB seeder CLI tests
│   ├── e2e/                   # E2E Playwright tests (6 specs)
│   │   ├── auth-flow.spec.ts
│   │   ├── critical-flows.spec.ts
│   │   ├── onboarding-flow.spec.ts
│   │   ├── ui-components.spec.ts
│   │   └── system-health.spec.ts
│   ├── scripts/               # Shell infrastructure tests
│   │   └── env-setup.test.sh
│   ├── setup/                 # Global mocks & fixtures
│   │   ├── setup.ts           # afterEach cleanup, matchMedia, IntersectionObserver, next/navigation, motion mocks
│   │   ├── mocks.ts           # Supabase client, sonner toast, React Query mocks
│   │   └── fixtures.ts        # Mock data factories (User, Post, Comment, Connection, Notification, etc.)
│   └── README.md              # Test suite documentation (100 TCs mapped)
├── docs/                      # Documentation
│   ├── 01-getting-started/
│   │   ├── development.md
│   │   └── installation.md
│   ├── 02-architecture/
│   │   ├── diagrams.md
│   │   └── overview.md
│   ├── 03-core-features/
│   │   ├── ai-assistant/
│   │   │   └── overview.md
│   │   ├── vector-embeddings/
│   │   │   └── overview.md
│   │   ├── api-reference.md
│   │   ├── authentication.md
│   │   ├── matching-system.md
│   │   └── messaging.md
│   ├── 04-infrastructure/
│   │   ├── database/
│   │   │   ├── embeddings.md
│   │   │   ├── schema.md
│   │   │   └── setup-guide.md
│   │   ├── python-worker/
│   │   │   ├── deployment.md
│   │   │   ├── development.md
│   │   │   └── overview.md
│   │   ├── monitoring.md
│   │   └── performance.md
│   ├── 05-deployment/
│   │   ├── checklist.md
│   │   ├── docker-scripts.md
│   │   ├── overview.md
│   │   └── runbook.md
│   ├── 06-contributing/
│   │   ├── git-workflow.md
│   │   └── guide.md
│   ├── 07-reference/
│   │   ├── commands.md
│   │   ├── environment-variables.md
│   │   └── troubleshooting.md
│   ├── 08-database-seeding/
│   │   ├── QUICK_REFERENCE.md
│   │   └── README.md
│   ├── DESIGN-SYSTEM.md
│   ├── FRONTEND-INTEGRATION-GUIDE.md
│   ├── IMPLEMENTATION_PLAN.md
│   └── SECURITY.md
├── python-worker/             # Python embedding service (FastAPI)
│   ├── embedding_generator.py # Sentence Transformers logic
│   ├── rate_limiter.py        # Database-backed rate limiting
│   ├── embedding_validator.py # Validation & dimension normalization
│   └── main.py                # FastAPI entry point
│   ├── main.py                # FastAPI entry point
│   └── tests/                 # Service tests

│   └── setup/                 # Database schema (31 tables + RLS + triggers)
├── public/                    # Static assets
├── types/                     # TypeScript types
└── expected-objects/          # Backend schema specs
```
