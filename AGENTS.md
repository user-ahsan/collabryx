# AGENTS.md — Collabryx Development Guide

Stack: **Next.js 16, React 19, TypeScript 5, Supabase, Tailwind CSS v4**  
State: Production ready ✅ (Phase 5 complete)

---

## Commands

| Command | What it does | Note |
|---------|-------------|------|
| `bun run dev` | Dev server on `:3000` | **Auto-checks Docker health** first (runs `scripts/check-docker.mjs`) |
| `bun run dev:skip-docker` | Dev server, no Docker check | Use when Python worker isn't needed |
| `bun run build` | Production build | Requires `typecheck` to pass first |
| `bun run typecheck` | `tsc --noEmit` | Run **before** build (CI chain: `typecheck` → `build`) |
| `bun run lint` | ESLint | 0 errors expected, ~26 intentional warnings |
| `bun run lint -- --fix` | Auto-fix lint issues |
| `bun run test` | Vitest (JS/TS) | No JS tests exist yet; placeholder |
| `bun run perf:budget` | Bundle-size budget check | Requires production build first |
| `bun docker:*` | 8 Docker scripts | `up`, `down`, `rebuild`, `clean`, `logs`, `health`, `status`, `inspect` |

**CI pipeline** (`.github/workflows/ci.yml`): `bun install --frozen-lockfile` → `rm -rf .next` → `bun run typecheck` → `bun run build`

**Python worker tests** (the only test suite today):
```bash
cd python-worker && python -m pytest -v
```

**Database seeding** (Python interactive CLI):
```bash
cd scripts/seed-data && python main.py [--all | --profiles | --posts | ...]
```

---

## Iron rules (don't violate)

1. **Bun only.** Never `npm`/`npx`. Use `bunx` instead of `npx`.
2. **No new packages.** Never add to `package.json`.
3. **Config is read-only.** `tsconfig.json`, `next.config.ts`, `postcss.config.mjs` — do not touch.
4. **No CSS modules.** Tailwind CSS v4 only. Imported at `app/globals.css` via `@import "tailwindcss"`.
5. **No `any`.** Use `unknown` + narrowing. No `@ts-ignore` either.
6. **No file rewrites.** Surgical line edits only; never rewrite entire files.
7. **No root-file modifications** unless explicitly commanded.
8. **Zero dead code.** Delete unused imports, orphaned vars, commented-out blocks.

---

## Architecture notes

- **Route groups**: `app/(auth)/` (protected) and `app/(public)/` (landing, login, register).
- **API routes**: `app/api/` — 14 endpoint groups (auth, ai, embeddings, matches, feed, etc.).
- **Middleware**: `/proxy.ts` handles auth guarding, bot detection, CSRF, body-size limits.
- **SSOT for types**: `@/types/database.types.ts` — never redefine types already there.
- **Supabase clients**: Server → `@/lib/supabase/server`; Browser → `@/lib/supabase/client`. Never mix them.
- **Supabase queries**: Never `select('*')`. Always name columns. Always `if (error)` check immediately after.
- **RLS**: Assume all 39 tables have Row Level Security.
- **Server Actions**: `@/lib/actions/` (10 files). All inputs validated via Zod (`@/lib/validations/`).
- **AI Provider system**: Multi-provider registry with priority-based failover (`@/lib/ai/providers/`). Supports OpenAI-compatible, Anthropic native, MiniMax.
- **Microservices**: 4 Python/FastAPI services run via `python-worker/docker-compose.yml`. All share `collabryx-network` bridge.
  | Service | Port | Directory | Role |
  |---------|------|-----------|------|
  | embedding-service | :8000 | `python-worker/embedding-service/` | Sentence Transformers vector embeddings |
  | notification-service | :8002 | `python-worker/notification-service/` | Send/digest/cleanup notifications |
  | feed-service | :8003 | `python-worker/feed-service/` | Thompson Sampling feed scoring |
  | match-service | :8004 | `python-worker/match-service/` | Cosine similarity + Jaccard match gen |
- **Web → microservice**: `lib/worker-client.ts` has `NotificationClient`, `FeedClient`, `MatchClient` classes. Next.js API routes call them via HTTP instead of direct imports.
- **Old TS services deleted**: `notification-engine.ts`, `feed-scorer.ts`, `match-generator.ts`, `match-generation.ts` were ported to Python. Backup at `.tmp/backup/services/`.

---

## Style & conventions

- **Path alias**: `@/` maps to project root. Relative imports are banned.
- **Import order**: React/Next → Third-party → `@/lib`/`@/components` → Types.
- **Naming**: Files `kebab-case.ts(x)`, components `PascalCase`, hooks `camelCase` with `use` prefix.
- **`"use client"`**: Only at the lowest leaf node where interactivity is needed. Default to Server Components.
- **`cn()`**: Import from `@/lib/utils`. Use for all conditional Tailwind classes.
- **Design tokens**: Use shadcn CSS variables (`bg-muted`, `text-primary-foreground`, etc.). No hardcoded hex codes.
- **Icon library**: Phosphor (`@phosphor-icons/react`). Not Lucide.
- **Theme system**: `next-themes` + `@wrksz/themes` + shadcn dark mode (`.dark` class).
- **Envs with `NEXT_PUBLIC_`** prefix are browser-visible. Server-only envs have no prefix.
- **Required envs**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_APP_URL`.
