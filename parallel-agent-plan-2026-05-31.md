# 🤖 Parallel Sub-Agent Deployment Plan — Collabryx Fixes

**Based on:** `fix-plan-2026-05-31.md` (29 fixes, 4 tiers)  
**Strategy:** Batch parallel agents per tier, no file conflicts within a batch  
**Agents:** CoderAgent subagents, deployed via `task` tool  
**Total agents:** ~12 parallel batches across 4 phases  

---

## ⚠️ CRITICAL: File Conflict Avoidance

No two agents in the same batch may touch the same file. Conflict map:

| File | Touched By (Fix #) | Note |
|------|-------------------|------|
| `lib/services/connections.ts` | Fix 3, Fix 5, Fix 7, Fix 8, Fix 15 | Most-contested file — serialize |
| `lib/services/posts.ts` | Fix 3, Fix 7, Fix 8 | |
| `lib/services/comments.ts` | Fix 3, Fix 7, Fix 8 | |
| `lib/services/notifications.ts` | Fix 3, Fix 7, Fix 8 | |
| `lib/actions/matches.server.ts` | Fix 4, Fix 7, Fix 8, Fix 15 | |
| `lib/services/match-generator.ts` | Fix 5, Fix 13 | |
| `99-master-all-tables.sql` | Fix 1, Fix 12 | Different tiers — OK |
| `hooks/use-posts.ts` | Fix 6 | No conflict |
| `lib/rate-limit.ts` | Fix 9 | No conflict |
| `hooks/use-ai-stream.ts` | Fix 10 | No conflict |

---

## 🚀 PHASE 1: Tier 0 — Root Causes (Parallel → 5 agents in 2 batches)

### Batch 1A (3 agents — no shared files, run simultaneously)

#### Agent A1: Fix `capture_event()` SQL Crash (Fix 1)
- **Type:** CoderAgent
- **File:** `supabase/setup/99-master-all-tables.sql` ~L2909-2952
- **Task:** Replace `COALESCE(NEW.user_id, NEW.author_id, NEW.actor_user_id, NEW.requester_id, NEW.sender_id)` with `CASE TG_TABLE_NAME` branch from `supabase/migrations/20260531_fix_capture_event.sql`
- **Verify:** Read migration file, apply fix, verify SQL syntax

#### Agent A2: Regenerate Database Types (Fix 2)
- **Type:** CoderAgent
- **File:** `types/database.types.ts`
- **Task:** Run `npx supabase gen types typescript --linked`, then manually fix: ProfileEmbedding.embedding type, user_experiences.title required, BlockedUser.updated_at removal, duplicate UserAnalytics, ProfileUpdatePayload fields
- **Verify:** TypeScript compilation passes

#### Agent A3: Fix `match_preferences` Server Action (Fix 4)
- **Type:** CoderAgent
- **File:** `lib/actions/matches.server.ts:128-133`
- **Task:** Replace `{ looking_for, location, skills }` with `{ min_match_percentage, interested_in_types, availability_match }` matching the DB schema at `report-2026-05-31.md` section 6.1
- **Verify:** Read DB schema, apply fix, check TypeScript

---

### Batch 1B (2 agents — sequential within batch, no shared with 1A)

> ⚠️ Fix 3 and Fix 5 both touch `lib/services/connections.ts`. They must run sequentially.

#### Agent A4 (FIRST): Extract + Fix `formatTimeAgo` (Fix 3)
- **Type:** CoderAgent
- **File:** Creates `lib/utils/time-ago.ts` + edits 5 files
- **Task:** 
  1. Create `lib/utils/time-ago.ts` with correct divisor logic (seconds/60, seconds/3600, seconds/86400)
  2. Replace inline implementations in: `lib/services/posts.ts:867`, `lib/services/connections.ts:766`, `lib/services/comments.ts:573`, `lib/services/notifications.ts:493`, `hooks/use-conversations.ts`
- **Verify:** All 5 files import from `@/lib/utils/time-ago`, TypeScript compiles

#### Agent A5 (SECOND, after A4): Consolidate `blocked_users` (Fix 5)
- **Type:** CoderAgent
- **File:** `lib/services/connections.ts:629` + `lib/services/match-generator.ts:229`
- **Task:** 
  1. Change `blockUser()` in connections.ts to INSERT into `blocked_users` table instead of setting `connections.status = "blocked"`
  2. Remove dual check in match-generator.ts, query only `blocked_users`
- **Verify:** Read both files, apply changes, TypeScript compiles

#### Agent A6 (parallel with A4/A5): Fix `removeReaction` (Fix 6)
- **Type:** CoderAgent
- **File:** `hooks/use-posts.ts:66-74`
- **Task:** Add `.eq('emoji', emoji)` filter to the delete query so removing one reaction doesn't delete all
- **Verify:** Read file, apply one-line fix

---

**Phase 1 Gate:** All 6 fixes verified → TypeScript compiles → proceed to Phase 2

---

## 🚀 PHASE 2: Tier 1 — Code Quality Foundation (Parallel → 4 agents)

> Prerequisite: Phase 1 complete (types regenerated, formatTimeAgo extracted)

### Batch 2A (4 agents — domain-split, no file conflicts)

Each agent handles Fix 7 (select('*')) + Fix 8 (Zod + errors) for their domain, plus any domain-specific fixes.

#### Agent B1: Posts + Comments Domain
- **Files:** `lib/actions/posts.server.ts`, `lib/actions/comments.server.ts`, `lib/services/posts.ts`, `lib/services/comments.ts`, `lib/services/post-attachments.ts`, `hooks/use-posts.ts`, `hooks/use-comments.ts`
- **Task:**
  1. Replace all `select('*')` / `select()` with explicit column lists (using regenerated types from Phase 1)
  2. Add Zod validation schemas for server action inputs
  3. Add `if (error)` checks after every Supabase query
  4. Fix `removeReaction` emoji filter (Fix 6, if not done in Phase 1)
  5. Fix optimistic update in `use-comments.ts:217-218` (inverted boolean)
- **Verify:** TypeScript compilation, no runtime errors

#### Agent B2: Connections + Matches Domain
- **Files:** `lib/actions/connections.server.ts`, `lib/actions/matches.server.ts`, `lib/services/connections.ts`, `lib/services/matches.ts`, `lib/services/match-generator.ts`, `lib/services/match-generation.ts`, `app/api/activity/feed/route.ts`
- **Task:**
  1. Replace all `select('*')` / `select()` with explicit column lists
  2. Add Zod validation schemas for server action inputs (connections 5 actions, matches 4 actions)
  3. Add `if (error)` checks after every Supabase query
  4. Fix `.or()` string interpolation in match-generator.ts:231,241 (use parameterized)
  5. Fix `NEXT_PUBLIC_` env var exposure in match-generation.ts:11
- **Verify:** TypeScript compilation

#### Agent B3: Notifications + AI Mentor + Embeddings Domain
- **Files:** `lib/actions/notifications.server.ts`, `lib/actions/ai-mentor.ts`, `lib/services/notifications.ts`, `app/api/chat/route.ts`, `app/api/embeddings/generate/route.ts`, `app/api/embeddings/retry-dlq/route.ts`
- **Task:**
  1. Replace all `select('*')` / `select()` with explicit column lists
  2. Add Zod validation schemas for server action + API route inputs
  3. Add `if (error)` checks after every Supabase query (chat/route.ts has 5 unchecked)
  4. Fix hardcoded AI model names in chat/route.ts:144,164 (use env vars)
- **Verify:** TypeScript compilation

#### Agent B4: Security + Auth + Infrastructure Domain (Fixes 9, 10, 11, 12)
- **Files:** `lib/services/notification-engine.ts`, `app/api/notifications/send/route.ts`, `lib/rate-limit.ts`, `hooks/use-ai-stream.ts`, `lib/services/profiles.ts`, `supabase/setup/99-master-all-tables.sql`
- **Task:**
  1. **Fix 9:** Add authorization checks to notification-engine.ts + API route + DB-backed rate limiting
  2. **Fix 10:** Fix `use-ai-stream.ts:21` — sync sessionId from server response
  3. **Fix 14:** Remove `email` from public profile queries in profiles.ts:34,73
  4. **Fix 12:** Move `posts.version` column into CREATE TABLE in master SQL
- **Also:** Create `lib/services/messages.ts` + `lib/services/conversations.ts` + actions + API routes for core chat (Fix 11)
- **Verify:** TypeScript compilation

---

**Phase 2 Gate:** All 4 agents complete → TypeScript compiles → `npm run build` passes → proceed to Phase 3

---

## 🚀 PHASE 3: Tier 2 — Architecture Cleanup (Parallel → 3 agents)

### Batch 3A (3 agents — no file conflicts)

#### Agent C1: Transaction Wrappers (Fix 15)
- **Files:** `lib/actions/matches.server.ts`, `lib/actions/connections.server.ts`, `lib/actions/comments.server.ts`, `lib/services/matches.ts`
- **Task:** Wrap 6 multi-table operations in Supabase RPC calls or transactions:
  1. Accept Match (4 tables) → create `accept_match` RPC
  2. Create Comment → use `rpc('increment_comment_count')`
  3. Send Connection → wrap in transaction
  4. Accept Connection → wrap in transaction
  5. Connect with Match → fix documented race condition
  6. Comment Count → atomic increment
- **Verify:** TypeScript compilation

#### Agent C2: CSRF + Security Hardening (Fix 16)
- **Files:** `app/api/ai/chat/route.ts`, `app/api/ai/stream/route.ts`, `app/api/auth/login/route.ts`, `app/api/auth/callback/route.ts`
- **Task:**
  1. Add CSRF token validation to all mutating POST endpoints
  2. Fix email exposure in callback debug logs (line 69-70) — remove or redact
  3. Fix `DEVELOPMENT_MODE` bypass — add `NODE_ENV=production` guard
  4. Add CSRF to auth/login route (replace manual regex with Zod `.email()`)
- **Verify:** TypeScript compilation

#### Agent C3: Hook Consolidation (Fix 17)
- **Files:** Multiple hooks in `hooks/` directory
- **Task:**
  1. Merge `use-chat.ts` + `use-conversations.ts` → single hook
  2. Merge `use-connections.ts` + `use-connection-requests.ts` → single React Query hook
  3. Merge `use-profile.ts` + `use-user.ts` + `use-user-profile.ts` → single `use-profile.ts`
  4. Merge `use-activity-feed.ts` + `use-activity-tracking.ts` → single hook
  5. Fix query key collision: `use-user.ts['profile']` → `['profile', 'current']`
  6. Fix remaining hook bugs from report section 10.7:
     - `use-privacy-settings.ts:63` — fix `id` → `user_id`
     - `use-activity-feed.ts:135` — add user_id filter
     - `use-embedding-queue-status.ts:24-29` — reset on userId change
     - `use-profile.ts:86-97` — fix cache key
     - `use-notification-preferences.ts:62-88` — use `.upsert()`
     - `use-conversations.ts:37-39` — fix FK constraint names
- **Verify:** TypeScript compilation

---

**Phase 3 Gate:** All 3 agents complete → TypeScript compiles → `npm run build` passes → proceed to Phase 4

---

## 🚀 PHASE 4: Tier 3 — Seeders & Cleanup (Parallel → 4 agents)

### Batch 4A (2 agents — infrastructure first)

#### Agent D1: Seeder Infrastructure Cleanup (Fixes 18, 19, 20, 28)
- **Files:** `scripts/seed-data/seeders/__init__.py`, `scripts/seed-data/seeders/base_seeder.py`, `scripts/seed-data/check_counts.py`
- **Task:**
  1. Delete 3 legacy files: `content_seeder.py`, `social_seeder.py`, `messaging_seeder.py`
  2. Update `__init__.py` — remove legacy refs, add atomic modules
  3. Add `fetch_existing_ids(table_name, id_field)` to `BaseSeeder`
  4. Update `check_counts.py` for all 36 tables
- **Verify:** Python syntax check

#### Agent D2: Profile + Content Seeders (Fixes 21, 23, 24, 29)
- **Files:** New seeder files in `scripts/seed-data/seeders/`
- **Task:** Create seeders following the template from report section 7:
  1. `match_preferences_seeder.py` (columns now correct from Phase 1 Fix 4)
  2. `embedding_rate_limits_seeder.py`
  3. `post_attachments_seeder.py`
  4. `comment_likes_seeder.py`
  5. `post_impressions_seeder.py`
  6. `feed_seeder.py` (feed_scores + feed_thompson_params)
- **Verify:** Python syntax, follows BaseSeeder pattern

---

### Batch 4B (2 agents — depend on Batch 4A infrastructure)

#### Agent D3: Match System Seeders (Fixes 22, 25)
- **Files:** New seeder files + integration into existing
- **Task:**
  1. `blocked_users_seeder.py` (system consolidated from Phase 1 Fix 5)
  2. `match_activity_seeder.py`
  3. Integrate `match_scores` seeding into `matches_seeder.py`
- **Verify:** Python syntax

#### Agent D4: Analytics + Audit Seeders (Fixes 26, 27)
- **Files:** New seeder files
- **Task:**
  1. `user_analytics_seeder.py` (events pipeline works from Phase 1 Fix 1)
  2. `platform_analytics_seeder.py`
  3. `audit_logs_seeder.py` (references auth.users — handle correctly)
  4. `moderation_logs_seeder.py`
- **Verify:** Python syntax

---

## 📊 AGENT SUMMARY

| Phase | Batch | Agents | Files Touched | Est. Time |
|-------|-------|--------|---------------|-----------|
| **1A** | Parallel | 3 (A1, A2, A3) | 3 files | ~15 min |
| **1B** | Sequential | 2 (A4→A5) + 1 (A6 parallel) | 7 files | ~20 min |
| **2A** | Parallel | 4 (B1, B2, B3, B4) | ~30 files | ~45 min |
| **3A** | Parallel | 3 (C1, C2, C3) | ~15 files | ~30 min |
| **4A** | Parallel | 2 (D1, D2) | ~10 files | ~30 min |
| **4B** | Parallel | 2 (D3, D4) | ~8 files | ~20 min |
| **Total** | 6 batches | **12 agents** | **~73 files** | **~2.5 hrs** |

---

## 🔒 GATE CHECKS (Mandatory Between Phases)

```
Phase 1 Complete?
  ├── TypeScript compiles? (tsc --noEmit)
  ├── All 6 Tier 0 fixes verified?
  └── YES → Phase 2

Phase 2 Complete?
  ├── TypeScript compiles? (tsc --noEmit)
  ├── npm run build passes?
  └── YES → Phase 3

Phase 3 Complete?
  ├── TypeScript compiles? (tsc --noEmit)
  ├── npm run build passes?
  └── YES → Phase 4

Phase 4 Complete?
  ├── Python syntax valid? (python -m py_compile *.py)
  ├── All seeders follow BaseSeeder pattern?
  └── YES → DONE ✅
```

---

## 🎯 CONTEXT BUNDLE

Before deploying any agent, create `.tmp/sessions/2026-05-31-collabryx-fixes/context.md` containing:

1. `AGENTS.md` — project standards (select('*') ban, Zod mandate, etc.)
2. `report-2026-05-31.md` — full audit with chain references
3. Relevant sections of `database.types.ts` (after Phase 1 regeneration)
4. Fix plan with exact line numbers and expected changes

Each agent prompt must include: "Load context from `.tmp/sessions/2026-05-31-collabryx-fixes/context.md` before starting."
