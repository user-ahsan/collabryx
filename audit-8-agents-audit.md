# 🔍 COLLABRYX — 8-AGENT COMPLETE AUDIT: ALL 311 ISSUES A–Z

**Date:** 2026-05-26 | **Scope:** Full codebase (~500 files) | **Method:** Static analysis, read-only  
**8 parallel sub-agents:** Database, API, Backend, Docker, Seeding, Frontend, Security, Tests

---

## EXECUTIVE SUMMARY

| Severity | Count | % |
|----------|:-----:|:-:|
| 🔴 CRITICAL | 65 | 21% |
| 🟠 HIGH | 87 | 28% |
| 🟡 MEDIUM | 109 | 35% |
| 🔵 LOW | 49 | 16% |
| **TOTAL** | **311** | **100%** |

---

## COMPLETE ISSUE INDEX (1–311)
### Listed A–Z by file path

---

### ISSUE #1
- **Severity:** 🔴 CRITICAL
- **File:** `.env:25`
- **Agent:** 4 (Docker), 7 (Security)
- **Issue:** `SUPABASE_SERVICE_ROLE_KEY` committed to git — full-privilege admin key exposed in version control
- **Fix:** Rotate key. Add `.env` to `.gitignore`. Use secrets manager.

### ISSUE #2
- **Severity:** 🟡 MEDIUM
- **File:** `.env:12`
- **Agent:** 5 (Seeding/Env)
- **Issue:** `BACKEND_URL_RENDER` commented out in `.env` — dead config
- **Fix:** Either uncomment and populate, or remove.

### ISSUE #3
- **Severity:** 🟡 MEDIUM
- **File:** `.env:34`
- **Agent:** 5 (Seeding/Env)
- **Issue:** `DEVELOPMENT_MODE=testing` but `.env.example` documents it as `true` — inconsistency
- **Fix:** Align the value or update documentation.

### ISSUE #4
- **Severity:** 🟡 MEDIUM
- **File:** `.env:49`
- **Agent:** 4 (Docker)
- **Issue:** `OPENAI_API_KEY=sk-placeholder-add-your-key` — placeholder could trigger SAST scanners
- **Fix:** Use empty string or a clearly fake value that won't trip scanners.

### ISSUE #5
- **Severity:** 🟡 MEDIUM
- **File:** `.env:54`
- **Agent:** 5 (Seeding/Env)
- **Issue:** `LOG_LEVEL` and `ENABLE_PERFORMANCE_LOGS` in `.env` but missing from `.env.example`
- **Fix:** Add to `.env.example` documentation.

### ISSUE #6
- **Severity:** 🔴 CRITICAL
- **File:** `.env.example:78-125`
- **Agent:** 5 (Seeding/Env)
- **Issue:** `AI_PROVIDER_N_*` system fully documented in `.env.example` but zero code consumes it — dead documentation
- **Fix:** Either implement the provider config system or remove dead docs.

### ISSUE #7
- **Severity:** 🟡 MEDIUM
- **File:** `.env.example:39,41,45,143`
- **Agent:** 5 (Seeding/Env)
- **Issue:** Feature flag env vars documented but never referenced in any code
- **Fix:** Either implement the features or remove dead documentation.

### ISSUE #8
- **Severity:** 🟡 MEDIUM
- **File:** `.env.example:133`
- **Agent:** 5 (Seeding/Env)
- **Issue:** `DEVELOPMENT_MODE` documented as `true` but actual `.env` uses `testing` — inconsistency
- **Fix:** Align documentation with actual values.

### ISSUE #9
- **Severity:** 🟠 HIGH
- **File:** `.github/workflows/ci.yml`
- **Agent:** 4 (Docker)
- **Issue:** No Docker build or test in CI — broken Dockerfile only caught at deployment time
- **Fix:** Add Docker build + test step to CI workflow.

### ISSUE #10
- **Severity:** 🟡 MEDIUM
- **File:** `.github/workflows/ci.yml:29,53,80,107`
- **Agent:** 4 (Docker)
- **Issue:** `rm -rf .next` before every job loses cached compiled output
- **Fix:** Only clean `.next` when necessary.

### ISSUE #11
- **Severity:** 🟡 MEDIUM
- **File:** `.github/workflows/ci.yml:58-62`
- **Agent:** 4 (Docker)
- **Issue:** Coverage artifacts uploaded but never consumed — no enforcement
- **Fix:** Add coverage threshold enforcement and PR comments.

### ISSUE #12
- **Severity:** 🟠 HIGH
- **File:** `.github/workflows/ci.yml:91`
- **Agent:** 4 (Docker)
- **Issue:** CI build uses real Supabase credentials from `.env` — `SUPABASE_SERVICE_ROLE_KEY` accessible in CI logs/artifacts
- **Fix:** Use CI secrets, not committed `.env` file.

### ISSUE #13
- **Severity:** 🟡 MEDIUM
- **File:** `.github/workflows/security.yml:14`
- **Agent:** 4 (Docker)
- **Issue:** Uses Node.js 20 while `ci.yml` uses Node.js 22 — version mismatch means audit may not reflect same dependency tree
- **Fix:** Align Node.js versions across workflows.

### ISSUE #14
- **Severity:** 🟠 HIGH
- **File:** `app/(auth)/admin/moderation/page.tsx`
- **Agent:** 6 (Frontend)
- **Issue:** Missing `error.tsx` and `loading.tsx` — error shows blank white screen
- **Fix:** Add error boundary and loading state files.

### ISSUE #15
- **Severity:** 🟠 HIGH
- **File:** `app/(auth)/bookmarks/page.tsx`
- **Agent:** 6 (Frontend)
- **Issue:** Missing `error.tsx` and `loading.tsx` — error shows blank white screen
- **Fix:** Add error boundary and loading state files.

### ISSUE #16
- **Severity:** 🔴 CRITICAL
- **File:** `app/(auth)/bookmarks/page.tsx:9`
- **Agent:** 6 (Frontend)
- **Issue:** Uses hardcoded `MOCK_BOOKMARKS` data instead of fetching from API — users see fake data in production
- **Fix:** Replace with actual API data fetching.

### ISSUE #17
- **Severity:** 🟠 HIGH
- **File:** `app/(auth)/help/page.tsx`
- **Agent:** 6 (Frontend)
- **Issue:** Missing `error.tsx` and `loading.tsx` — error shows blank white screen
- **Fix:** Add error boundary and loading state files.

### ISSUE #18
- **Severity:** 🔴 CRITICAL
- **File:** `app/(auth)/layout.tsx:1`
- **Agent:** 6 (Frontend)
- **Issue:** Entire auth layout is `"use client"` — defeats SSR benefits for all protected routes. All 15+ route pages sent as client JS
- **Fix:** Split into server wrapper with client-only interactive parts.

### ISSUE #19
- **Severity:** 🟡 MEDIUM
- **File:** `app/(auth)/messages/[id]/page.tsx:19-24`
- **Agent:** 6 (Frontend)
- **Issue:** Server-side conversation fetch doesn't handle Supabase throwing (not just returning null) — error propagates to missing error boundary
- **Fix:** Wrap query in try/catch.

### ISSUE #20
- **Severity:** 🔴 CRITICAL
- **File:** `app/(auth)/onboarding/actions.ts:190-217`
- **Agent:** 6 (Frontend — from previous audit)
- **Issue:** Profile upsert marks `onboarding_completed: true` BEFORE skills, interests, and experiences are upserted. If those fail, user has `onboarding_completed=true` with ZERO data and no recovery path
- **Fix:** Move `onboarding_completed=true` AFTER all related inserts succeed.

### ISSUE #21
- **Severity:** 🟠 HIGH
- **File:** `app/(auth)/onboarding/layout.tsx`
- **Agent:** 6 (Frontend — from previous audit)
- **Issue:** No redirect enforcement for incomplete onboarding on dashboard access
- **Fix:** Add middleware check to redirect incomplete profiles.

### ISSUE #22
- **Severity:** 🟠 HIGH
- **File:** `app/(auth)/onboarding/page.tsx:33-87` vs `lib/validations/onboarding.ts:18-65`
- **Agent:** 6 (Frontend — from previous audit)
- **Issue:** Duplicate Zod schemas with incompatible shapes — server rejects valid client data
- **Fix:** Import schemas from shared module, remove inline definitions.

### ISSUE #23
- **Severity:** 🟠 HIGH
- **File:** `app/(auth)/post/[id]/page.tsx`
- **Agent:** 6 (Frontend)
- **Issue:** Missing `error.tsx` and `loading.tsx` — error shows blank white screen
- **Fix:** Add error boundary and loading state files.

### ISSUE #24
- **Severity:** 🟠 HIGH
- **File:** `app/(auth)/privacy/page.tsx`
- **Agent:** 6 (Frontend)
- **Issue:** Missing `error.tsx` and `loading.tsx` — error shows blank white screen
- **Fix:** Add error boundary and loading state files.

### ISSUE #25
- **Severity:** 🟠 HIGH
- **File:** `app/(auth)/terms/page.tsx`
- **Agent:** 6 (Frontend)
- **Issue:** Missing `error.tsx` and `loading.tsx` — error shows blank white screen
- **Fix:** Add error boundary and loading state files.

### ISSUE #26
- **Severity:** 🔴 CRITICAL
- **File:** `app/api/auth/callback/route.ts:62-68`
- **Agent:** 7 (Security)
- **Issue:** Auth callback open redirect — `next` query parameter used in redirect URL with zero validation. Attacker crafts `?next=//evil.com` to redirect to phishing site after OAuth
- **Fix:** Validate `next` against path allowlist, reject URLs with protocol/host.

### ISSUE #27
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/auth/login/route.ts`
- **Agent:** 7 (Security)
- **Issue:** No CSRF on login POST (minor — SameSite:strict provides protection)
- **Fix:** Add CSRF validation for defense-in-depth.

### ISSUE #28
- **Severity:** 🟠 HIGH
- **File:** `app/api/auth/login/route.ts:45`
- **Agent:** 2 (API)
- **Issue:** Entire 270-line route is dead code — auth uses `supabase.auth.signInWithPassword()` directly, not this API route
- **Fix:** Remove or repurpose the route.

### ISSUE #29
- **Severity:** 🟠 HIGH
- **File:** `app/api/auth/login/route.ts:79`
- **Agent:** 7 (Security)
- **Issue:** Account lockout bypass via IP spoofing — key is `email:ip`, attacker cycles through spoofed `x-forwarded-for` IPs
- **Fix:** Add email-only lockout tracking regardless of IP.

### ISSUE #30
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/auth/callback/route.ts:86`
- **Agent:** 7 (Security)
- **Issue:** Raw Supabase error messages forwarded to URL params — information disclosure
- **Fix:** Sanitize error messages before exposing to URL.

### ISSUE #31
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/auth/callback/route.ts:24`
- **Agent:** 7 (Security)
- **Issue:** No `state` parameter validation in OAuth callback — CSRF on OAuth possible
- **Fix:** Implement state parameter validation.

### ISSUE #32
- **Severity:** 🟠 HIGH
- **File:** `app/api/ai/stream/route.ts:9`
- **Agent:** 2 (API), 7 (Security)
- **Issue:** No CSRF protection on streaming AI endpoint — unlike all other mutation endpoints
- **Fix:** Add CSRF validation consistent with other endpoints.

### ISSUE #33
- **Severity:** 🟠 HIGH
- **File:** `app/api/ai/stream/route.ts:11-12`
- **Agent:** 2 (API)
- **Issue:** No Zod input validation on streaming AI endpoint — raw body destructuring
- **Fix:** Add Zod validation for request body.

### ISSUE #34
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/ai/chat/route.ts:47-50`
- **Agent:** 7 (Security)
- **Issue:** If `preferredProvider` doesn't exist in registry, `registry.getProvider()` throws — crashes request
- **Fix:** Add fallback/error handling for unknown providers.

### ISSUE #35
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/ai/chat/route.ts`
- **Agent:** 7 (Security)
- **Issue:** No rate limiting on AI chat endpoint — attacker could exhaust AI API credits
- **Fix:** Add rate limiting.

### ISSUE #36
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/ai/chat/route.ts:120`
- **Agent:** 2 (API)
- **Issue:** Hardcoded `.limit(10)` for messages — larger conversations lose context
- **Fix:** Make limit configurable or implement pagination.

### ISSUE #37
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/analytics/daily/route.ts:68`
- **Agent:** 2 (API)
- **Issue:** Admin role cached without TTL — stale admin permissions until page refresh
- **Fix:** Add TTL to admin role check.

### ISSUE #38
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/activity/feed/route.ts:30-31`
- **Agent:** 2 (API)
- **Issue:** No Zod validation — query params parsed with raw `parseInt`
- **Fix:** Add Zod validation for all query parameters.

### ISSUE #39
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/embeddings/generate/route.ts`
- **Agent:** 7 (Security)
- **Issue:** No HTTP-level rate limiting on embedding endpoint — rate limiting only in Python worker, bypassable
- **Fix:** Add rate limiting at Next.js API level.

### ISSUE #40
- **Severity:** 🔴 CRITICAL
- **File:** `app/api/embeddings/generate/route.ts:317-332`
- **Agent:** 2 (API)
- **Issue:** Unreachable catch block — any error inside the `if (backendConfig.endpoint)` block is caught by the inner `catch (workerError)` at line 301, NOT the outer catch. The outer catch is dead code
- **Fix:** Remove dead catch block or restructure error handling.

### ISSUE #41
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/embeddings/generate/route.ts:118-127`
- **Agent:** 7 (Security)
- **Issue:** Error response leaks validation details: `details: String(validationResult.error)` — exposes schema internals
- **Fix:** Log details server-side, return generic error to client.

### ISSUE #42
- **Severity:** 🟠 HIGH
- **File:** `app/api/embeddings/status/[userId]/route.ts`
- **Agent:** 2 (API)
- **Issue:** Orphaned API route — no frontend caller. Embedding status checked via Realtime subscription
- **Fix:** Remove or connect to frontend.

### ISSUE #43
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/health/route.ts:58-59`
- **Agent:** 7 (Security)
- **Issue:** Health endpoint returns raw database error messages
- **Fix:** Sanitize health endpoint responses.

### ISSUE #44
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/health/route.ts:17`
- **Agent:** 7 (Security)
- **Issue:** Creates new Supabase server client for every health check — could contribute to connection pool exhaustion on heavily monitored systems
- **Fix:** Reuse client instance for health checks.

### ISSUE #45
- **Severity:** 🔴 CRITICAL
- **File:** `app/api/matches/generate/route.ts:67`
- **Agent:** 2 (API), 7 (Security)
- **Issue:** Calls `rateLimit(request, 'matches')` but `'matches'` key doesn't exist in `RATE_LIMITS` config. Returns `undefined` → `config.interval` throws `Cannot read properties of undefined`. **Endpoint crashes on every call**
- **Fix:** Add `'matches'` key to `RATE_LIMITS` config.

### ISSUE #46
- **Severity:** 🟠 HIGH
- **File:** `app/api/matches/generate/batch/route.ts`
- **Agent:** 2 (API)
- **Issue:** Orphaned route — admin-only but no admin UI calls it. Service layer calls Python worker directly, bypassing this route
- **Fix:** Remove or connect to admin UI.

### ISSUE #47
- **Severity:** 🟠 HIGH
- **File:** `app/api/matches/health/route.ts`
- **Agent:** 2 (API)
- **Issue:** Orphaned route — no monitoring dashboard consumes it
- **Fix:** Remove or connect to monitoring.

### ISSUE #48
- **Severity:** 🔴 CRITICAL
- **File:** `app/api/notifications/cleanup/route.ts:59-61`
- **Agent:** 7 (Security)
- **Issue:** Admin check uses `user.user_metadata.role` which is **user-controlled** — attacker can set `role: "service_role"` via signup to gain admin access
- **Fix:** Query the `profiles` table for role, don't trust user metadata.

### ISSUE #49
- **Severity:** 🔴 CRITICAL
- **File:** `app/api/notifications/digest/route.ts:60-61`
- **Agent:** 7 (Security)
- **Issue:** Same broken admin check via `user_metadata.role` — user-controlled metadata
- **Fix:** Query profiles table for admin role.

### ISSUE #50
- **Severity:** 🟠 HIGH
- **File:** `app/api/upload/sign/route.ts`
- **Agent:** 2 (API)
- **Issue:** Orphaned route — `/api/upload` is used but signed variant is orphaned
- **Fix:** Remove or connect to frontend.

### ISSUE #51
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/upload/sign/route.ts:90`
- **Agent:** 7 (Security)
- **Issue:** `Math.random()` used for filename generation — predictable filenames allow enumeration
- **Fix:** Use `crypto.randomUUID()`.

### ISSUE #52
- **Severity:** 🟡 MEDIUM
- **File:** `app/api/upload/route.ts:97`
- **Agent:** 7 (Security)
- **Issue:** Upload path uses raw `user.id` as directory name — path traversal possible if UUID validation fails
- **Fix:** Validate user ID format before using in path.

### ISSUE #53
- **Severity:** 🟠 HIGH
- **File:** `app/api/ai/chat/route.ts:12`
- **Agent:** 7 (Security)
- **Issue:** User-supplied `startupContext` destructured from request body and passed to `assembleAndBuildPrompt` — could inject malicious data into AI prompts
- **Fix:** Sanitize and validate user-supplied context before passing to prompt assembly.

### ISSUE #54
- **Severity:** 🟠 HIGH
- **File:** `app/api/ai/stream/route.ts:42`
- **Agent:** 7 (Security)
- **Issue:** Same pattern — user-supplied `startupContext` passed to prompt assembly without validation
- **Fix:** Validate and sanitize startupContext.

### ISSUE #55
- **Severity:** 🟡 MEDIUM
- **File:** `app/layout.tsx:77-90`
- **Agent:** 6 (Frontend)
- **Issue:** `validateEnv()` runs on EVERY SSR request — adds latency per page load
- **Fix:** Only validate on server start, not per request.

### ISSUE #56
- **Severity:** 🔵 LOW
- **File:** `app/error.tsx:23`
- **Agent:** 6 (Frontend)
- **Issue:** Raw `error.message` rendered to users — information disclosure
- **Fix:** Show generic error message to users, log details server-side.

### ISSUE #57
- **Severity:** 🔵 LOW
- **File:** `app/loading.tsx`
- **Agent:** 6 (Frontend)
- **Issue:** Root loading is `"use client"` when it doesn't need to be
- **Fix:** Remove unnecessary `"use client"` directive.

### ISSUE #58
- **Severity:** 🟠 HIGH
- **File:** `components/features/dashboard/notifications-widget.tsx:192,197`
- **Agent:** 6 (Frontend)
- **Issue:** `console.log("Accept connection:", id)` and `console.log("Ignore connection:", id)` — debug logs in production
- **Fix:** Remove or replace with proper logger.

### ISSUE #59
- **Severity:** 🟠 HIGH
- **File:** `components/features/matches/match-filters.tsx:124`
- **Agent:** 6 (Frontend)
- **Issue:** `console.log("Searching with:", { project, bio })` — debug log in production
- **Fix:** Remove.

### ISSUE #60
- **Severity:** 🟠 HIGH
- **File:** `components/features/profile/profile-tabs.tsx:41-69`
- **Agent:** 6 (Frontend)
- **Issue:** Large hardcoded placeholder defaults for bio, lookingFor, skills, experiences — will NEVER match real user data, creates misleading preview
- **Fix:** Use null/default states instead of fabricated content.

### ISSUE #61
- **Severity:** 🟠 HIGH
- **File:** `components/features/settings/privacy-settings-form.tsx:80`
- **Agent:** 6 (Frontend)
- **Issue:** `// TODO: Implement actual data export functionality` — feature marked complete but not implemented
- **Fix:** Implement data export or remove TODO.

### ISSUE #62
- **Severity:** 🟠 HIGH
- **File:** `components/shared/file-upload.tsx:86-93`
- **Agent:** 6 (Frontend)
- **Issue:** Simulated upload progress using `setInterval` with fake increments — shows "90%" when request hasn't reached server
- **Fix:** Use real progress events from XMLHttpRequest.

### ISSUE #63
- **Severity:** 🔴 CRITICAL
- **File:** `components/shared/mobile-nav.tsx:43-46`
- **Agent:** 6 (Frontend)
- **Issue:** Direct `setState` call in render body — triggers cascading re-renders on every route change
- **Fix:** Move to `useEffect` with `pathname` dependency.

### ISSUE #64
- **Severity:** 🟠 HIGH
- **File:** `components/shared/session-expiry-warning.tsx:32-71`
- **Agent:** 6 (Frontend)
- **Issue:** Polling via `setInterval` for session expiry — stale state if session refreshes between intervals. Prefer `onAuthStateChange` listener
- **Fix:** Replace polling with auth state change listener.

### ISSUE #65
- **Severity:** 🟠 HIGH
- **File:** `components/shared/sidebar-nav.tsx:1`
- **Agent:** 6 (Frontend)
- **Issue:** Missing `"use client"` directive — uses `usePathname()`, `useUser()`, `useEffect` but no directive. Build error or forces parent to be client boundary
- **Fix:** Add `"use client"` directive.

### ISSUE #66
- **Severity:** 🟠 HIGH
- **File:** `components/theme-provider.tsx:49`
- **Agent:** 6 (Frontend)
- **Issue:** `localStorage.getItem(STORAGE_KEY) as Theme` — TypeScript cast without runtime validation. Garbage stored value gets used
- **Fix:** Add Zod validation for stored theme value.

### ISSUE #67
- **Severity:** 🟠 HIGH
- **File:** `components/theme-provider.tsx:28`
- **Agent:** 6 (Frontend)
- **Issue:** Cookie set for theme without `Secure` flag — sent over HTTP if HTTPS not enforced
- **Fix:** Add `Secure` flag in production.

### ISSUE #68
- **Severity:** 🟡 MEDIUM
- **File:** `components/ui/animated-theme-toggler.tsx:48`
- **Agent:** 6 (Frontend)
- **Issue:** `localStorage.setItem("theme")` called directly instead of through `setTheme` context — bypasses ThemeProvider state synchronization
- **Fix:** Use ThemeProvider's setTheme function.

### ISSUE #69
- **Severity:** 🟡 MEDIUM
- **File:** `components/shared/notification-dropdown.tsx:161`
- **Agent:** 6 (Frontend)
- **Issue:** `window.location.reload()` on error — loses all client state
- **Fix:** Implement soft error recovery instead of hard reload.

### ISSUE #70
- **Severity:** 🟡 MEDIUM
- **File:** `components/shared/error-boundary.tsx:48`
- **Agent:** 6 (Frontend)
- **Issue:** Same hard reload pattern on error boundary
- **Fix:** Implement soft recovery.

### ISSUE #71
- **Severity:** 🟡 MEDIUM
- **File:** `components/shared/skeletons.tsx`
- **Agent:** 6 (Frontend)
- **Issue:** Missing `role="status"` or `aria-label` on skeleton loaders
- **Fix:** Add accessibility attributes.

### ISSUE #72
- **Severity:** 🟡 MEDIUM
- **File:** `hooks/use-activity-tracking.ts:122,165`
- **Agent:** 6 (Frontend)
- **Issue:** `document.cookie` read without try/catch — throws in private browsing mode
- **Fix:** Add try/catch wrapper.

### ISSUE #73
- **Severity:** 🔴 CRITICAL
- **File:** `hooks/use-activity-tracking.ts:211-215`
- **Agent:** 2 (API)
- **Issue:** `fetchActivityFeed` checks `!result.success` but actual API returns `{ data, count, hasMore }` — NO `success` field. The check is always `true`. **Entire hook is broken**
- **Fix:** Remove duplicate, use the version from `use-activity-feed.ts`.

### ISSUE #74
- **Severity:** 🟡 MEDIUM
- **File:** `hooks/use-activity-tracking.ts:256-257`
- **Agent:** 2 (API)
- **Issue:** `console.warn` swallowing errors — no user-facing feedback for tracking failures
- **Fix:** Add user-facing feedback for critical failures.

### ISSUE #75
- **Severity:** 🟠 HIGH
- **File:** `hooks/use-ai-stream.ts:22-29`
- **Agent:** 6 (Frontend)
- **Issue:** SSR hydration mismatch — `sessionStorage` and `crypto.randomUUID()` in `useState` initializer. Server generates different session ID than client
- **Fix:** Guard with `typeof window !== 'undefined'` and use `useEffect` for browser-only init.

### ISSUE #76
- **Severity:** 🔴 CRITICAL
- **File:** `hooks/use-ai-stream.ts:36`
- **Agent:** 6 (Frontend)
- **Issue:** `useCallback` with `options` as dependency — since `options` is new object every render, callback recreated every render, breaking memoization
- **Fix:** Use `useRef` for options or memoize at caller.

### ISSUE #77
- **Severity:** 🟠 HIGH
- **File:** `hooks/use-ai-stream.ts:36-119`
- **Agent:** 6 (Frontend)
- **Issue:** No AbortController created or passed to fetch call — if component unmounts while streaming, fetch continues indefinitely
- **Fix:** Add AbortController, cleanup on unmount.

### ISSUE #78
- **Severity:** 🔴 CRITICAL
- **File:** `hooks/use-cache.ts:96-108`
- **Agent:** 6 (Frontend)
- **Issue:** `setData(cached)` called directly in render body — side effect during render, violates React rules
- **Fix:** Use `useState` initializer or `useEffect`.

### ISSUE #79
- **Severity:** 🟠 HIGH
- **File:** `hooks/use-chat.ts:96-120`
- **Agent:** 2 (API), 6 (Frontend)
- **Issue:** Realtime subscription has broad filter `event: "*"` on conversations table — excessive invalidations
- **Fix:** Narrow event filter to relevant events only.

### ISSUE #80
- **Severity:** 🟡 MEDIUM
- **File:** `hooks/use-chat.ts:58`
- **Agent:** 6 (Frontend)
- **Issue:** `(data || []).map(...)` correctly handles null but `data` typed from Supabase query could have mixed types if schema is wrong
- **Fix:** Add runtime type check.

### ISSUE #81
- **Severity:** 🔵 LOW
- **File:** `hooks/use-chat.ts:67`
- **Agent:** 2 (API), 6 (Frontend)
- **Issue:** `isMountedRef` pattern redundant with React Query's internal handling
- **Fix:** Remove unnecessary ref.

### ISSUE #82
- **Severity:** 🔴 CRITICAL
- **File:** `hooks/use-connection-requests.ts:77`
- **Agent:** 6 (Frontend)
- **Issue:** 145 lines of dead code duplicating `use-connections.ts` React Query hooks. No cleanup/abort controller — setState on unmounted component risk
- **Fix:** Remove or refactor to use existing hooks.

### ISSUE #83
- **Severity:** 🟡 MEDIUM
- **File:** `hooks/use-connection-requests.ts:54-62`
- **Agent:** 2 (API)
- **Issue:** Calls `supabase.auth.getUser()` on every render — not cached
- **Fix:** Use React Query caching or external store.

### ISSUE #84
- **Severity:** 🔵 LOW
- **File:** `hooks/use-conversations.ts:27`
- **Agent:** 2 (API), 6 (Frontend)
- **Issue:** `_conversationsError` unused variable (underscore prefix)
- **Fix:** Use the error variable for error UI or remove it.

### ISSUE #85
- **Severity:** 🟡 MEDIUM
- **File:** `hooks/use-embedding-queue-status.ts:27-29`
- **Agent:** 2 (API)
- **Issue:** `initialized.current = true` before async initialization completes — no retry on failure. Also prevents re-fetching when userId changes
- **Fix:** Set initialized flag after async completes, reset on userId change.

### ISSUE #86
- **Severity:** 🟠 HIGH
- **File:** `hooks/use-feed.ts:52-55`
- **Agent:** 6 (Frontend)
- **Issue:** `document.cookie` read without try/catch wrapper — throws in private browsing
- **Fix:** Add try/catch with fallback.

### ISSUE #87
- **Severity:** 🟡 MEDIUM
- **File:** `hooks/use-feed.ts:57`
- **Agent:** 2 (API)
- **Issue:** `scorePosts` mutation doesn't re-fetch feed after scoring — user must manually refresh
- **Fix:** Invalidate feed query cache after scoring.

### ISSUE #88
- **Severity:** 🔴 CRITICAL
- **File:** `hooks/use-login-data.ts:183`
- **Agent:** 6 (Frontend)
- **Issue:** `retryCount` state in `useEffect` dep array combined with `setTimeout(() => setRetryCount(...), 2000)` on failure — potential infinite loop edge case
- **Fix:** Use `useRef` for retry count, not state.

### ISSUE #89
- **Severity:** 🟡 MEDIUM
- **File:** `hooks/use-match-generation.ts:64`
- **Agent:** 2 (API), 6 (Frontend)
- **Issue:** CSRF token extraction `|| ''` — sends empty token if cookie is missing, endpoint rejects. No retry logic
- **Fix:** Add retry or better error handling for missing CSRF token.

### ISSUE #90
- **Severity:** 🟠 HIGH
- **File:** `hooks/use-match-generation.ts:118-120`
- **Agent:** 2 (API)
- **Issue:** `useMutation` type mismatch — `onSuccess` expects `MatchGenerationResponse` but receives `{ data: MatchGenerationResponse | null, error }`
- **Fix:** Fix type expectations in `onSuccess` callback.

### ISSUE #91
- **Severity:** 🟡 MEDIUM
- **File:** `hooks/use-messages.ts:234`
- **Agent:** 2 (API)
- **Issue:** Missing `.catch()` for `sendMessage` — error toast never shown to user
- **Fix:** Add error handling with user feedback.

### ISSUE #92
- **Severity:** 🟠 HIGH
- **File:** `hooks/use-messages.ts:103,202`
- **Agent:** 6 (Frontend)
- **Issue:** Read receipts never delivered — broadcast on `read:${conversationId}` but listener subscribes via `postgres_changes` to `messages:${conversationId}`. Different channel names. `'broadcast' as any` type cast shows this was never typed correctly
- **Fix:** Match broadcast channel name with listener channel name.

### ISSUE #93
- **Severity:** 🟡 MEDIUM
- **File:** `hooks/use-messages.ts:158-229`
- **Agent:** 2 (API)
- **Issue:** Realtime subscription recreated on every conversationId change — channel leak risk
- **Fix:** Clean up previous channel before creating new one.

### ISSUE #94
- **Severity:** 🟡 MEDIUM
- **File:** `hooks/use-messages.ts:202`
- **Agent:** 6 (Frontend)
- **Issue:** `'broadcast' as any` bypasses TypeScript type checking — hides potential type errors
- **Fix:** Properly type the broadcast channel.

### ISSUE #95
- **Severity:** 🟡 MEDIUM
- **File:** `hooks/use-new-endpoints.ts:15-17`
- **Agent:** 6 (Frontend)
- **Issue:** Only file with proper `typeof document === 'undefined'` SSR guard — good pattern, but no other CSRF cookie readers follow it
- **Fix:** Extract to shared utility used by all consumers.

### ISSUE #96
- **Severity:** 🟠 HIGH
- **File:** `hooks/use-notifications.ts:165-201`
- **Agent:** 6 (Frontend)
- **Issue:** Unhandled promise rejection in `useEffect` — `.then()` on `supabase.auth.getUser()` without `.catch()`. If `getUser()` fails, channel is never set up
- **Fix:** Add `.catch()` with error logging.

### ISSUE #97
- **Severity:** 🟠 HIGH
- **File:** `hooks/use-notifications.ts:47`
- **Agent:** 6 (Frontend)
- **Issue:** Query key includes `options` object directly — if created inline, key identity changes every render, causing refetch loops
- **Fix:** Use stable query key with serialized values.

### ISSUE #98
- **Severity:** 🟡 MEDIUM
- **File:** `hooks/use-notifications.ts:173`
- **Agent:** 6 (Frontend)
- **Issue:** Cleanup runs with `channel === null` if component unmounts before `getUser()` resolves — subscription never cleaned up
- **Fix:** Use cleanup flag pattern or AbortController.

### ISSUE #99
- **Severity:** 🟠 HIGH
- **File:** `hooks/use-reduced-motion.ts:12-13`
- **Agent:** 6 (Frontend)
- **Issue:** Hydration mismatch — `window.matchMedia` in `useState` initializer. SSR returns `false`, client may return `true`
- **Fix:** Use `useSyncExternalStore` with server snapshot returning `false`.

### ISSUE #100
- **Severity:** 🔴 CRITICAL
- **File:** `hooks/use-typing-indicator.ts:84-104`
- **Agent:** 6 (Frontend)
- **Issue:** Typing indicators silently fail + memory leak. `sendTypingEvent` creates new Supabase channel on EVERY call but NEVER calls `.subscribe()` before `.send()`. Orphaned channels accumulate
- **Fix:** Call `.subscribe()` before `.send()`, reuse channel instance, cleanup on unmount.

### ISSUE #101
- **Severity:** 🔵 LOW
- **File:** `lib/actions/ai-mentor.ts:36`
- **Agent:** 5 (Seeding/Env)
- **Issue:** `DASHSCOPE_API_KEY` used in code but missing from ALL env files — will crash if `LLM_PROVIDER=qwen`
- **Fix:** Add to all env files or document as required for qwen provider.

### ISSUE #102
- **Severity:** 🟠 HIGH
- **File:** `lib/actions/connections.server.ts:30`
- **Agent:** 7 (Security)
- **Issue:** SQL injection via `.or()` with `${targetUserId}` and `${user.id}` interpolated directly
- **Fix:** Use parameterized queries.

### ISSUE #103
- **Severity:** 🟠 HIGH
- **File:** `lib/actions/connections.server.ts:185`
- **Agent:** 7 (Security)
- **Issue:** SQL injection via `.or()` with `${userId}` and `${user.id}` in `removeConnection()`
- **Fix:** Use parameterized queries.

### ISSUE #104
- **Severity:** 🟠 HIGH
- **File:** `lib/actions/connections.server.ts:212`
- **Agent:** 2 (API)
- **Issue:** `cancelConnectionRequest` uses `.eq('user_id', user.id)` but `connections` table has `requester_id`/`receiver_id`, NOT `user_id`. Silently fails to match rows — cancellation never works
- **Fix:** Change to `.eq('requester_id', user.id)`.

### ISSUE #105
- **Severity:** 🟡 MEDIUM
- **File:** `lib/ai/providers/index.ts:27-69`
- **Agent:** 3 (Backend)
- **Issue:** Provider priority inverted: minimax(10) > openai(20) > anthropic(30). Lower number = higher priority. No comments explaining rationale
- **Fix:** Add comments explaining priority ordering or reorder as intended.

### ISSUE #106
- **Severity:** 🔴 CRITICAL
- **File:** `lib/ai/providers/registry.ts:93-98`
- **Agent:** 3 (Backend)
- **Issue:** `Promise.race` timeout without AbortController — timed-out requests continue consuming server resources and API billing quotas. No `.abort()` call
- **Fix:** Create AbortController for each request, call `.abort()` on timeout.

### ISSUE #107
- **Severity:** 🟠 HIGH
- **File:** `lib/ai/providers/registry.ts:112`
- **Agent:** 3 (Backend)
- **Issue:** `autoRegisterProviders` silently `continue`s when `BASE_URL` is missing — providers silently unregistered without warning
- **Fix:** Add warning log when skipping due to missing config.

### ISSUE #108
- **Severity:** 🟠 HIGH
- **File:** `lib/ai/providers/anthropic-native.ts:150`
- **Agent:** 3 (Backend)
- **Issue:** Hardcoded beta header `anthropic-beta: message-batches-2024-09-24` sent for EVERY chat request. Anthropic may deprecate beta headers, causing 400 errors
- **Fix:** Only send beta header for batch-specific operations.

### ISSUE #109
- **Severity:** 🟠 HIGH
- **File:** `lib/ai/providers/openai-compatible.ts:60-64`
- **Agent:** 3 (Backend)
- **Issue:** `withRetry` wraps entire `chat` method — on retry, full prompt context sent again. Double billing on retries for paid APIs
- **Fix:** Cache request body, only retry network call.

### ISSUE #110
- **Severity:** 🔵 LOW
- **File:** `lib/ai/providers/openai-compatible.ts:127-139`
- **Agent:** 3 (Backend)
- **Issue:** `extraHeaders` can override `Authorization` header — empty or incorrect auth sent
- **Fix:** Prevent Authorization from being overridden by extraHeaders.

### ISSUE #111
- **Severity:** 🟡 MEDIUM
- **File:** `lib/ai/providers/minimax.ts:68-69`
- **Agent:** 3 (Backend)
- **Issue:** `Retry-After` header parsed but never used — hardcoded exponential backoff instead of server-recommended wait
- **Fix:** Use `Retry-After` header value when available.

### ISSUE #112
- **Severity:** 🟡 MEDIUM
- **File:** `lib/config/backend.ts:9`
- **Agent:** 5 (Seeding/Env)
- **Issue:** `BackendMode` type missing `'edge-only'` mode that `validate-env.ts` allows — type inconsistency
- **Fix:** Add `'edge-only'` to the type union.

### ISSUE #113
- **Severity:** 🔵 LOW
- **File:** `lib/config/backend.ts:41,63,295-296,315-316`
- **Agent:** 6 (Frontend)
- **Issue:** Circuit breaker state logging to console in production — should use proper logger
- **Fix:** Remove or use proper logging.

### ISSUE #114
- **Severity:** 🟡 MEDIUM
- **File:** `lib/config/database.ts:37-52`
- **Agent:** 5 (Seeding/Env)
- **Issue:** Pool sizes hardcoded — should be env-driven for production tuning
- **Fix:** Make pool sizes configurable via env vars.

### ISSUE #115
- **Severity:** 🔴 CRITICAL
- **File:** `lib/config/environment.ts:28-29`
- **Agent:** 5 (Seeding/Env)
- **Issue:** Non-null assertions (`!`) on `process.env.NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`. If either is missing, app crashes at module evaluation time with opaque error — BEFORE `validateEnv()` runs
- **Fix:** Use runtime validation with clear error messages instead of non-null assertions.

### ISSUE #116
- **Severity:** 🟡 MEDIUM
- **File:** `lib/config/environment.ts:33`
- **Agent:** 5 (Seeding/Env)
- **Issue:** `NEXT_PUBLIC_WORKER_API_URL` fallback uses `host.docker.internal:8000` in Docker but actual `.env` uses `PYTHON_WORKER_URL` — nobody knows to set this
- **Fix:** Standardize to one env var name.

### ISSUE #117
- **Severity:** 🟡 MEDIUM
- **File:** `lib/config/session.ts:15`
- **Agent:** 5 (Seeding/Env)
- **Issue:** Session duration hardcoded to 7 days — must manually keep in sync with Supabase Dashboard setting
- **Fix:** Make session duration configurable via env var.

### ISSUE #118
- **Severity:** 🟠 HIGH
- **File:** `lib/csrf.ts:71`
- **Agent:** 7 (Security)
- **Issue:** `httpOnly: false` — comment says `httpOnly: true prevents XSS` but code sets `false`. CSRF token readable by JavaScript
- **Fix:** Either set `httpOnly: true` or remove redundant CSRF layer (SameSite:strict provides protection).

### ISSUE #119
- **Severity:** 🟡 MEDIUM
- **File:** `lib/csrf.ts:102`
- **Agent:** 7 (Security)
- **Issue:** Plaintext token comparison (not constant-time) — potential timing side-channel
- **Fix:** Use constant-time comparison.

### ISSUE #120
- **Severity:** 🟡 MEDIUM
- **File:** `lib/csrf.ts:72`
- **Agent:** 7 (Security)
- **Issue:** `secure` flag based on `NODE_ENV === 'production'` — misconfigures if proxied HTTPS in non-production
- **Fix:** Always set Secure when connection is HTTPS.

### ISSUE #121
- **Severity:** 🟡 MEDIUM
- **File:** `lib/csrf.ts:27-33`
- **Agent:** 7 (Security)
- **Issue:** SHA-256 fallback when `crypto.subtle` unavailable — non-cryptographic hash. Fallback virtually never reached (all modern runtimes support crypto.subtle)
- **Fix:** Throw error instead of silently degrading.

### ISSUE #122
- **Severity:** 🟡 MEDIUM
- **File:** `lib/dashboard-cache.ts:24-51`
- **Agent:** 6 (Frontend)
- **Issue:** Empty array check `parsed.data.length === 0` prematurely rejects valid empty data
- **Fix:** Remove premature empty rejection.

### ISSUE #123
- **Severity:** 🟡 MEDIUM
- **File:** `lib/database-connection-manager.ts:273`
- **Agent:** 7 (Security)
- **Issue:** Circuit breaker 30s timeout — ALL DB operations fail fast during window. No health endpoint to reset
- **Fix:** Add circuit breaker reset endpoint.

### ISSUE #124
- **Severity:** 🔵 LOW
- **File:** `lib/database-connection-manager.ts:429`
- **Agent:** 1 (Database)
- **Issue:** `executeProtectedQuery` has convoluted type casting that could hide type mismatches
- **Fix:** Simplify type cast logic.

### ISSUE #125
- **Severity:** 🟠 HIGH
- **File:** `lib/database-optimization.ts:1,125`
- **Agent:** 1 (Database)
- **Issue:** Imports browser Supabase client (`@/lib/supabase/client`) but used in server-side context — may not have proper cookie handling
- **Fix:** Import from `@/lib/supabase/server` instead.

### ISSUE #126
- **Severity:** 🟡 MEDIUM
- **File:** `lib/data/job-titles-database.ts:131`
- **Agent:** 5 (Seeding/Env)
- **Issue:** `ENT` industry has leading space: `" ENT"` — data quality issue
- **Fix:** Trim whitespace from industry names.

### ISSUE #127
- **Severity:** 🟡 MEDIUM
- **File:** `lib/errors/match-errors.ts:54-126`
- **Agent:** 3 (Backend)
- **Issue:** String code '429' check is dead code — Supabase returns status as number, not string
- **Fix:** Remove dead code path.

### ISSUE #128
- **Severity:** 🟠 HIGH
- **File:** `lib/logger.ts:35`
- **Agent:** 7 (Security)
- **Issue:** `JSON.stringify(context)` can include sensitive data (user IDs, request bodies with PII) — PII leaked to production logs
- **Fix:** Add redaction for known PII fields.

### ISSUE #129
- **Severity:** 🟡 MEDIUM
- **File:** `lib/rate-limit.ts:63`
- **Agent:** 3 (Backend), 7 (Security)
- **Issue:** TODO for distributed rate limiting — in-memory only, reset on server restart, doesn't work across serverless instances
- **Fix:** Implement distributed rate limiting via Supabase RPC or Upstash Redis.

### ISSUE #130
- **Severity:** 🟡 MEDIUM
- **File:** `lib/rate-limit.ts:75`
- **Agent:** 3 (Backend)
- **Issue:** `setInterval(cleanup, 5*60*1000)` never cleared — memory leak in long-running processes
- **Fix:** Clear interval on server shutdown.

### ISSUE #131
- **Severity:** 🟠 HIGH
- **File:** `lib/rate-limit.ts:157`
- **Agent:** 7 (Security)
- **Issue:** Rate limiting uses `x-forwarded-for` header as fingerprint — trivially spoofed by attackers
- **Fix:** Use combination of IP + user ID + session for fingerprinting.

### ISSUE #132
- **Severity:** 🟠 HIGH
- **File:** `lib/rate-limit.ts:88`
- **Agent:** 7 (Security)
- **Issue:** `matches` rate limit type called but not in `RATE_LIMITS` config — crash or bypass
- **Fix:** Add match rate limit configuration.

### ISSUE #133
- **Severity:** 🟠 HIGH
- **File:** `lib/services/bm25.ts:16`
- **Agent:** 3 (Backend)
- **Issue:** Each `index()` call replaces internal state but does NOT clear previous data first. Concurrent calls corrupt internal state
- **Fix:** Add mutex lock, clear state before re-indexing.

### ISSUE #134
- **Severity:** 🟡 MEDIUM
- **File:** `lib/services/circuit-breaker.ts:45-46`
- **Agent:** 3 (Backend)
- **Issue:** Half-open transition on EVERY request after timeout — can cause open→half→fail→open cycles under sustained load
- **Fix:** Implement proper half-open with single probe request.

### ISSUE #135
- **Severity:** 🟡 MEDIUM
- **File:** `lib/services/connections.ts:311`
- **Agent:** 3 (Backend)
- **Issue:** `.single()` on connection check throws if multiple rows exist — generic error to user
- **Fix:** Handle multiple rows gracefully with specific error message.

### ISSUE #136
- **Severity:** 🟡 MEDIUM
- **File:** `lib/services/connections.ts:226-233`
- **Agent:** 7 (Security)
- **Issue:** String interpolation in `.or()` filter with `${user.id}` and `${receiverId}` — potential injection vector
- **Fix:** Use parameterized `.or()` filters.

### ISSUE #137
- **Severity:** 🟠 HIGH
- **File:** `lib/services/connections.ts:151,230,561,629`
- **Agent:** 7 (Security)
- **Issue:** SQL injection via `.or()` interpolation — user IDs directly interpolated into `.or()` filter strings in 4+ locations
- **Fix:** Use parameterized queries with `.in()` and array parameters.

### ISSUE #138
- **Severity:** 🟠 HIGH
- **File:** `lib/services/development.ts:41-58`
- **Agent:** 3 (Backend)
- **Issue:** Module-level side effects run on import — dev mode config runs in production too
- **Fix:** Guard side effects behind runtime check.

### ISSUE #139
- **Severity:** 🟠 HIGH
- **File:** `lib/services/embeddings.ts:50-93`
- **Agent:** 3 (Backend)
- **Issue:** Uses `supabase.auth.getSession()` instead of `getUser()` — stale/expired session token could pass auth checks
- **Fix:** Use `getUser()` which verifies token with Supabase.

### ISSUE #140
- **Severity:** 🟡 MEDIUM
- **File:** `lib/services/embeddings.ts:240-287`
- **Agent:** 3 (Backend)
- **Issue:** `checkEmbeddingRateLimit` fail-open — returns `{ allowed: true, remaining: 3 }` on error, allowing unlimited embedding generation when rate limit RPC is down
- **Fix:** Fail-closed when rate limit check fails.

### ISSUE #141
- **Severity:** 🟠 HIGH
- **File:** `lib/services/feed-scorer.ts:146-156`
- **Agent:** 3 (Backend)
- **Issue:** Three connection boosts multiply: `score * 1.5 * 1.2 * 1.1 = 1.98x`. Nonlinear and unbounded, soft-capped at 1.0. Masks true user interests
- **Fix:** Cap individual boosts and use additive or weighted combination.

### ISSUE #142
- **Severity:** 🟡 MEDIUM
- **File:** `lib/services/match-generation.ts:9`
- **Agent:** 3 (Backend)
- **Issue:** `NEXT_PUBLIC_PYTHON_WORKER_URL` used as public env var — exposes internal worker URL to client bundle
- **Fix:** Remove `NEXT_PUBLIC_` prefix, use server-side env var only.

### ISSUE #143
- **Severity:** 🟠 HIGH
- **File:** `lib/services/match-generation.ts:330`
- **Agent:** 3 (Backend)
- **Issue:** Silent partial failure when upserting match suggestions — errors logged but execution continues to `persistMatchScores()` on potentially partial data
- **Fix:** Stop execution on upsert failure.

### ISSUE #144
- **Severity:** 🟠 HIGH
- **File:** `lib/services/match-generator.ts:162-191`
- **Agent:** 3 (Backend)
- **Issue:** `persistMatchScores` N+1 — each suggestion triggers `.single()` + upsert. 40 queries for 20 suggestions. DB connection storm under load
- **Fix:** Batch queries using `.in()` filter and bulk upsert.

### ISSUE #145
- **Severity:** 🔴 CRITICAL
- **File:** `lib/services/match-generator.ts:240`
- **Agent:** 3 (Backend), 7 (Security)
- **Issue:** `excludeList.join(",")` concatenates user IDs into raw SQL `in` clause — injection-adjacent
- **Fix:** Use `.not.in()` with array parameter.

### ISSUE #146
- **Severity:** 🔴 CRITICAL
- **File:** `lib/services/match-generator.ts:117-126`
- **Agent:** 7 (Security)
- **Issue:** Service role client bypasses ALL RLS — reads ALL user embeddings, skills, interests, profiles. Any authenticated user triggering match generation exposes all data
- **Fix:** Restrict admin client usage to truly admin-only endpoints.

### ISSUE #147
- **Severity:** 🟠 HIGH
- **File:** `lib/services/matches.ts:237`
- **Agent:** 3 (Backend)
- **Issue:** Race condition in match connection rollback — manual rollback by deleting connection if update fails. Between insert and rollback delete, another process reads the pending connection. If delete also fails, orphaned records persist
- **Fix:** Use database transactions instead of manual rollback.

### ISSUE #148
- **Severity:** 🟡 MEDIUM
- **File:** `lib/services/match-scores.ts:105-115`
- **Agent:** 3 (Backend)
- **Issue:** Synthetic match score breakdowns — not real dimension-level scores. All categories within ±3% of each other, derived deterministically from overall score
- **Fix:** Implement real dimension-level scoring.

### ISSUE #149
- **Severity:** 🟠 HIGH
- **File:** `lib/services/notification-engine.ts:105-113`
- **Agent:** 3 (Backend)
- **Issue:** Real-time broadcast never works — creates Supabase channel and calls `.send()` but never calls `.subscribe()` first. Broadcasts silently dropped per Supabase docs
- **Fix:** Call `.subscribe()` before `.send()`.

### ISSUE #150
- **Severity:** 🔴 CRITICAL
- **File:** `lib/services/notification-engine.ts:48-59`
- **Agent:** 7 (Security)
- **Issue:** Service role client bypasses ALL RLS for notification operations — exposed via API routes
- **Fix:** Restrict admin client usage.

### ISSUE #151
- **Severity:** 🔵 LOW
- **File:** `lib/services/posts.ts:167`
- **Agent:** 3 (Backend)
- **Issue:** `author_role` hardcoded to "Member" — ignores actual role in database
- **Fix:** Fetch actual role from database.

### ISSUE #152
- **Severity:** 🟠 HIGH
- **File:** `lib/services/profiles.ts:24`
- **Agent:** 6 (Frontend — from previous audit)
- **Issue:** Imports browser Supabase client (`@/lib/supabase/client`) for use in server context — AGENTS.md explicitly mandates server client
- **Fix:** Import from `@/lib/supabase/server`.

### ISSUE #153
- **Severity:** 🟠 HIGH
- **File:** `lib/services/profiles.ts:63-97`
- **Agent:** 7 (Security)
- **Issue:** `fetchProfileById()` does NOT check if requesting user has permission — any user can enumerate all profiles
- **Fix:** Add authorization check.

### ISSUE #154
- **Severity:** 🟠 HIGH
- **File:** `lib/services/profiles.ts:133-153`
- **Agent:** 7 (Security)
- **Issue:** `fetchUserSkills()` takes `userId` without verifying relationship — any user can view any other user's skills
- **Fix:** Add authorization check.

### ISSUE #155
- **Severity:** 🟠 HIGH
- **File:** `lib/services/profiles.ts:214-233`
- **Agent:** 7 (Security)
- **Issue:** `fetchUserInterests()` same issue — no authorization check
- **Fix:** Add authorization check.

### ISSUE #156
- **Severity:** 🟠 HIGH
- **File:** `lib/services/profiles.ts:295-315`
- **Agent:** 7 (Security)
- **Issue:** `fetchUserExperiences()` same issue — no authorization check
- **Fix:** Add authorization check.

### ISSUE #157
- **Severity:** 🟠 HIGH
- **File:** `lib/services/profiles.ts:33,72,141,222,302,388`
- **Agent:** 6 (Frontend — from previous audit), 7 (Security)
- **Issue:** All 6 query functions use `.select('*')` — violates project AGENTS.md rule, causes over-fetching
- **Fix:** Select only required columns.

### ISSUE #158
- **Severity:** 🟡 MEDIUM
- **File:** `lib/rag/context-assembler.ts:64`
- **Agent:** 3 (Backend)
- **Issue:** Hardcoded `messages.slice(-10)` history truncation — context window overflow possible with long messages (20K tokens)
- **Fix:** Token-aware truncation instead of message-count truncation.

### ISSUE #159
- **Severity:** 🟡 MEDIUM
- **File:** `lib/rag/context-fetcher.ts:43`
- **Agent:** 3 (Backend)
- **Issue:** Only fetches `is_primary: true` skills — 15 non-primary skills invisible to AI context
- **Fix:** Include non-primary skills in AI context.

### ISSUE #160
- **Severity:** 🟡 MEDIUM
- **File:** `lib/rag/session-summarizer.ts:66`
- **Agent:** 3 (Backend)
- **Issue:** Hardcoded `gpt-3.5-turbo` model — if deprecated, summarization fails. No fallback
- **Fix:** Make model configurable via env var with fallback chain.

### ISSUE #161
- **Severity:** 🟡 MEDIUM
- **File:** `lib/rag/startup-prompts.ts:43-69`
- **Agent:** 3 (Backend)
- **Issue:** User PII (display_name, headline) sent to AI provider in system prompt — if provider logs prompts, PII exposed
- **Fix:** Anonymize PII in system prompts.

### ISSUE #162
- **Severity:** 🔴 CRITICAL
- **File:** `lib/rag/vector-retriever.ts:23`
- **Agent:** 7 (Security)
- **Issue:** `new OpenAI({ apiKey: process.env.OPENAI_API_KEY })` module-level singleton — crashes on first import if key missing. No graceful degradation
- **Fix:** Lazy initialization with error handling and fallback.

### ISSUE #163
- **Severity:** 🟠 HIGH
- **File:** `lib/rag/vector-retriever.ts:85-92`
- **Agent:** 3 (Backend)
- **Issue:** Vector retriever calls OpenAI directly for embeddings with no fallback — if OpenAI down, entire RAG pipeline fails silently
- **Fix:** Add fallback to Python worker embeddings.

### ISSUE #164
- **Severity:** 🟠 HIGH
- **File:** `lib/rag/vector-retriever.ts:149-152`
- **Agent:** 3 (Backend)
- **Issue:** BM25 fetches ALL profiles with `limit(100)` — any profiles beyond 100 invisible to keyword search. No pagination
- **Fix:** Implement pagination or increase limit.

### ISSUE #165
- **Severity:** 🟠 HIGH
- **File:** `lib/rag/vector-retriever.ts:138-177`
- **Agent:** 7 (Security)
- **Issue:** BM25 cache grows unbounded — module-level mutable cache never prunes old entries. Memory leak in long-running containers
- **Fix:** Add cache size limit with LRU eviction.

### ISSUE #166
- **Severity:** 🟠 HIGH
- **File:** `lib/rag/vector-retriever.ts:9`
- **Agent:** 7 (Security)
- **Issue:** `bm25Cache` is module-level — in serverless (Vercel), cold starts create new cache. Warm instances share it. Cache consistency issues
- **Fix:** Use external cache or scoped instance.

### ISSUE #167
- **Severity:** 🔵 LOW
- **File:** `lib/rag/vector-retriever.ts:6`
- **Agent:** 3 (Backend)
- **Issue:** Module-level `openaiInstance` never reset — stale key persists until server restart
- **Fix:** Add ability to refresh the instance.

### ISSUE #168
- **Severity:** 🟠 HIGH
- **File:** `lib/services/encryption.ts`
- **Agent:** 7 (Security)
- **Issue:** Service role key has two different env var names: `SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_KEY` — one may be set while the other isn't, causing silent fallback
- **Fix:** Standardize to one env var name.

### ISSUE #169
- **Severity:** 🟡 MEDIUM
- **File:** `lib/supabase/server.ts:14-15`
- **Agent:** 7 (Security — from previous audit)
- **Issue:** Non-null assertions on env vars passed to `createServerClient` — silently passes `undefined`
- **Fix:** Add proper validation before passing to client creation.

### ISSUE #170
- **Severity:** 🟡 MEDIUM
- **File:** `lib/utils/rate-limit.ts:35-36`
- **Agent:** 7 (Security)
- **Issue:** Production rate limiting relies on `KV_REST_API_URL` which may not be set — falls back to in-memory (non-functional on serverless)
- **Fix:** Ensure KV_REST_API_URL is set in production.

### ISSUE #171
- **Severity:** 🔴 CRITICAL
- **File:** `lib/utils/sanitize.ts:44-45`
- **Agent:** 7 (Security)
- **Issue:** `new DOMParser()` is a browser-only API. Throws `ReferenceError` in Server Components, API routes, Server Actions. Server-rendered user content crashes with 500
- **Fix:** Use server-safe sanitizer (e.g., `sanitize-input.ts`) for SSR contexts.

### ISSUE #172
- **Severity:** 🟡 MEDIUM
- **File:** `lib/utils/sanitize.ts:118`
- **Agent:** 7 (Security)
- **Issue:** Sanitizer uses `innerHTML` to output — if sanitization has holes, XSS possible
- **Fix:** Use safe DOM methods instead of innerHTML in sanitizer output.

### ISSUE #173
- **Severity:** 🟡 MEDIUM
- **File:** `lib/utils/sanitize.ts:134-139`
- **Agent:** 7 (Security)
- **Issue:** Regex-based markdown sanitization insufficient — `<scr<script>ipt>` bypasses regex `<script>` removal
- **Fix:** Use proper parser-based sanitization for markdown output.

### ISSUE #174
- **Severity:** 🟡 MEDIUM
- **File:** `lib/utils/sanitize.ts:89`
- **Agent:** 7 (Security)
- **Issue:** `data:image/` protocols allowed in `src` attributes — could contain SVG with `<script>` tags
- **Fix:** Block `data:` protocol in HTML src attributes.

### ISSUE #175
- **Severity:** 🟡 MEDIUM
- **File:** `lib/utils/file-validation.ts:140`
- **Agent:** 7 (Security)
- **Issue:** `Math.random().toString(36)` used for filename randomness — predictable
- **Fix:** Use `crypto.randomUUID()`.

### ISSUE #176
- **Severity:** 🟡 MEDIUM
- **File:** `lib/utils/file-validation.ts:157`
- **Agent:** 7 (Security)
- **Issue:** Magic byte validation is optional (`if (buffer)`) — client can skip by omitting buffer. SVG uploads with embedded scripts not blocked
- **Fix:** Make magic byte validation mandatory.

### ISSUE #177
- **Severity:** 🟡 MEDIUM
- **File:** `lib/utils/file-validation.ts:134-143`
- **Agent:** 7 (Security)
- **Issue:** File extension extracted by `file.name.split(".").pop()` — no allowed-list validation
- **Fix:** Implement strict extension allowlist.

### ISSUE #178
- **Severity:** 🟠 HIGH
- **File:** `lib/validate-env.ts:3-14`
- **Agent:** 5 (Seeding/Env)
- **Issue:** Zod schema only validates 12 of 28+ env vars used in codebase — false sense of security
- **Fix:** Add all consumed env vars to validation schema.

### ISSUE #179
- **Severity:** 🟠 HIGH
- **File:** `lib/validate-env.ts:80-84`
- **Agent:** 5 (Seeding/Env)
- **Issue:** `validateEnvRuntime()` only runs in production — dev environments skip validation, missing vars only caught at runtime crash in production
- **Fix:** Run validation in all environments with non-fatal warnings in dev.

### ISSUE #180
- **Severity:** 🟡 MEDIUM
- **File:** `lib/validate-env.ts:52-60`
- **Agent:** 5 (Seeding/Env)
- **Issue:** No validation of `BACKEND_URL_RENDER` when mode is `render`
- **Fix:** Add conditional validation.

### ISSUE #181
- **Severity:** 🟡 MEDIUM
- **File:** `lib/validate-env.ts:28-32`
- **Agent:** 5 (Seeding/Env)
- **Issue:** Zod marks `SUPABASE_SERVICE_ROLE_KEY` as `.optional()` but runtime code requires it — contradiction
- **Fix:** Make it required in Zod schema too.

### ISSUE #182
- **Severity:** 🔴 CRITICAL
- **File:** `lib/worker-client.ts:46-57`
- **Agent:** 3 (Backend)
- **Issue:** `generateEmbedding()` sends NO `X-Worker-API-Key` header. Python worker's auth middleware requires this. ALL embedding requests silently fail with 401 in production
- **Fix:** Add `X-Worker-API-Key` header from `process.env.WORKER_API_KEY`.

### ISSUE #183
- **Severity:** 🟠 HIGH
- **File:** `lib/worker-client.ts:51`
- **Agent:** 3 (Backend)
- **Issue:** No handling for 413 (Payload Too Large), 429 (Rate Limit), 503 (Service Unavailable) — all status codes treated the same
- **Fix:** Differentiate error handling by status code.

### ISSUE #184
- **Severity:** 🟠 HIGH
- **File:** `lib/worker-client.ts:36-43`
- **Agent:** 3 (Backend)
- **Issue:** `healthCheck` doesn't parse response body — could report "healthy" while worker is degraded (`status: "degraded"`, `supabase_connected: false`)
- **Fix:** Parse response body for detailed health status.

### ISSUE #185
- **Severity:** 🟡 MEDIUM
- **File:** `lib/worker-client.ts:59-66`
- **Agent:** 3 (Backend)
- **Issue:** `isHealthy` swallows ALL errors with no logging — zero visibility into worker health check failures
- **Fix:** Add logging to catch block.

### ISSUE #186
- **Severity:** 🔵 LOW
- **File:** `lib/worker-client.ts:8`
- **Agent:** 3 (Backend)
- **Issue:** `config.worker.url` could be `undefined` — `fetch(undefined/health)` throws TypeError with misleading error message
- **Fix:** Validate URL before fetch.

### ISSUE #187
- **Severity:** 🟡 MEDIUM
- **File:** `next.config.ts:56`
- **Agent:** 7 (Security)
- **Issue:** CSP includes `'unsafe-inline'` and `'unsafe-eval'` — significantly weakens XSS protection
- **Fix:** Remove unsafe directives where possible, use nonces or hashes.

### ISSUE #188
- **Severity:** 🟡 MEDIUM
- **File:** `next.config.ts:59`
- **Agent:** 7 (Security)
- **Issue:** CSP `img-src` allows `https:` — effectively all HTTPS domains. Permissive for production
- **Fix:** Restrict `img-src` to specific domains.

### ISSUE #189
- **Severity:** 🟠 HIGH
- **File:** `proxy.ts:67`
- **Agent:** 7 (Security)
- **Issue:** Proxy middleware skips ALL auth checks when Supabase config is missing — fails open, not closed
- **Fix:** Fail closed — reject requests when auth config is missing.

### ISSUE #190
- **Severity:** 🟡 MEDIUM
- **File:** `python-worker/.dockerignore:27-29`
- **Agent:** 4 (Docker)
- **Issue:** `.env` excluded from Docker build context (correct), but docker-compose expects `.env` alongside compose file — if missing, container starts with no env vars
- **Fix:** Ensure `.env` exists at expected location or provide defaults.

### ISSUE #191
- **Severity:** 🔴 CRITICAL
- **File:** `python-worker/Dockerfile`
- **Agent:** 4 (Docker)
- **Issue:** Render disk mount mismatch — service mounts at `/root/.cache`, Dockerfile writes model to `/app/.cache/huggingface`. Model (80MB) re-downloads on every container restart
- **Fix:** Align all paths to the persistent disk mount point.

### ISSUE #192
- **Severity:** 🟡 MEDIUM
- **File:** `python-worker/Dockerfile:42-43`
- **Agent:** 4 (Docker)
- **Issue:** Model pre-downloaded as root with `chmod -R 777` — security anti-pattern
- **Fix:** Download as appuser, restrict permissions.

### ISSUE #193
- **Severity:** 🟡 MEDIUM
- **File:** `python-worker/Dockerfile:18-19`
- **Agent:** 4 (Docker)
- **Issue:** Torch installed separately from requirements.txt but torch also listed as dependency — layer cache invalidates on any requirements.txt change
- **Fix:** Split requirements into base and ML files.

### ISSUE #194
- **Severity:** 🟡 MEDIUM
- **File:** `python-worker/Dockerfile:83`
- **Agent:** 4 (Docker)
- **Issue:** `--limit-concurrency 100` with 1GB RAM and read-only filesystem — unrealistic concurrency limit
- **Fix:** Reduce to realistic concurrency (10-20).

### ISSUE #195
- **Severity:** 🔵 LOW
- **File:** `python-worker/Dockerfile:56-58`
- **Agent:** 4 (Docker)
- **Issue:** Two chown/chmod RUN layers that could be combined — reduces image layers
- **Fix:** Combine into single RUN command.

### ISSUE #196
- **Severity:** 🔵 LOW
- **File:** `python-worker/Dockerfile:27-31`
- **Agent:** 4 (Docker)
- **Issue:** `apt-get upgrade -y` on every build — breaks layer caching, adds ~30s per build
- **Fix:** Remove or make conditional.

### ISSUE #197
- **Severity:** 🔴 CRITICAL
- **File:** `python-worker/docker-compose.yml:10`
- **Agent:** 4 (Docker)
- **Issue:** References `.env` in `python-worker/` subdirectory but actual `.env` is at project root — builds with empty env vars
- **Fix:** Either copy `.env` to `python-worker/` or change `env_file` path.

### ISSUE #198
- **Severity:** 🟡 MEDIUM
- **File:** `python-worker/docker-compose.yml:53`
- **Agent:** 4 (Docker)
- **Issue:** No Next.js service in Docker Compose — latent gap if frontend is ever dockerized
- **Fix:** Add Next.js service definition.

### ISSUE #199
- **Severity:** 🟡 MEDIUM
- **File:** `python-worker/docker-compose.yml:46-51`
- **Agent:** 4 (Docker)
- **Issue:** Healthcheck `start_period` differs between compose (60s) and Dockerfile (40s) — inconsistent
- **Fix:** Align start_period values.

### ISSUE #200
- **Severity:** 🔵 LOW
- **File:** `python-worker/docker-compose.yml:61-63`
- **Agent:** 4 (Docker)
- **Issue:** Volume `collabryx-data` declared but never mounted by any service — dead configuration
- **Fix:** Remove unused volume.

### ISSUE #201
- **Severity:** 🔵 LOW
- **File:** `python-worker/docker-compose.yml:15`
- **Agent:** 4 (Docker)
- **Issue:** `ALLOWED_ORIGINS` split on comma — trailing comma creates empty origin, rejected by FastAPI CORS
- **Fix:** Filter empty strings after split.

### ISSUE #202
- **Severity:** 🔴 CRITICAL
- **File:** `python-worker/main.py:542-554`
- **Agent:** 3 (Backend)
- **Issue:** `model.encode()` is synchronous and blocks the asyncio event loop. Wrapping in `asyncio.wait_for` doesn't make it non-blocking. ALL concurrent workers are serialized
- **Fix:** Run `model.encode()` in a thread pool executor via `loop.run_in_executor()`.

### ISSUE #203
- **Severity:** 🔴 CRITICAL
- **File:** `python-worker/main.py:539-555`
- **Agent:** 3 (Backend)
- **Issue:** `asyncio.wait_for` does NOT cancel the underlying thread — when timeout fires, `model.encode()` continues running. Embedding computed but discarded. Orphaned inference threads accumulate
- **Fix:** Use `concurrent.futures` with proper cancellation.

### ISSUE #204
- **Severity:** 🟠 HIGH
- **File:** `python-worker/main.py:967-1026`
- **Agent:** 3 (Backend)
- **Issue:** Rate limit check uses synchronous `self.supabase.rpc(...).execute()` — blocks event loop. The async semaphore adds concurrency control AFTER the blocking call
- **Fix:** Wrap synchronous DB calls in `run_in_executor()`.

### ISSUE #205
- **Severity:** 🟠 HIGH
- **File:** `python-worker/main.py:670-677`
- **Agent:** 3 (Backend)
- **Issue:** DLQ processor uses synchronous `.execute()` calls inside async loop — each query blocks event loop
- **Fix:** Use async Supabase client or `run_in_executor()`.

### ISSUE #206
- **Severity:** 🟠 HIGH
- **File:** `python-worker/main.py:86-168`
- **Agent:** 3 (Backend)
- **Issue:** Lifespan function calls `await run_embedding_tests()` which runs pytest as subprocess with 120s timeout — delays startup by 2 minutes if pytest not installed
- **Fix:** Make startup tests optional with env flag, run in background.

### ISSUE #207
- **Severity:** 🟡 MEDIUM
- **File:** `python-worker/main.py:352-403`
- **Agent:** 3 (Backend)
- **Issue:** DLQ storage failure permanently loses the embedding request — logged at CRITICAL but no retry
- **Fix:** Add retry logic for DLQ storage failures.

### ISSUE #208
- **Severity:** 🟡 MEDIUM
- **File:** `python-worker/main.py:745-746`
- **Agent:** 3 (Backend)
- **Issue:** DLQ poll interval of 60 seconds — stale match results for over a minute
- **Fix:** Reduce poll interval to 10-15 seconds.

### ISSUE #209
- **Severity:** 🔵 LOW
- **File:** `python-worker/main.py:322`
- **Agent:** 3 (Backend)
- **Issue:** Validation error message leaks exact boundaries: "Text must be between 10 and 2000 characters"
- **Fix:** Use generic validation error message.

### ISSUE #210
- **Severity:** 🟡 MEDIUM
- **File:** `python-worker/main.py:292-303`
- **Agent:** 4 (Docker)
- **Issue:** `WORKER_API_KEY` read from env but never defined in any env file — falls through to "no API key = allow all" in production
- **Fix:** Generate and configure a worker API key.

### ISSUE #211
- **Severity:** 🔴 CRITICAL
- **File:** `python-worker/docker-compose.yml` + frontend
- **Agent:** 4 (Docker)
- **Issue:** Python worker stripped to embeddings only (header comment confirms). Frontend `match-generation.ts` still calls removed endpoints — 404 responses
- **Fix:** Remove frontend calls to removed endpoints or restore worker functionality.

### ISSUE #212
- **Severity:** 🟠 HIGH
- **File:** `render.yaml:48`
- **Agent:** 4 (Docker)
- **Issue:** Frontend configured as `env: static` with `staticPublishPath: ./.next`. Next.js 16 Server Components, API routes, and middleware WILL NOT EXECUTE
- **Fix:** Change to `env: node` with proper start command.

### ISSUE #213
- **Severity:** 🟠 HIGH
- **File:** `render.yaml:65-70`
- **Agent:** 4 (Docker)
- **Issue:** Frontend envVars missing critical values: `NEXT_PUBLIC_APP_URL`, `PYTHON_WORKER_URL`, `BACKEND_MODE`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`. Defaults to `localhost:8000` (doesn't exist on Render)
- **Fix:** Add all required env vars to render.yaml.

### ISSUE #214
- **Severity:** 🟡 MEDIUM
- **File:** `render.yaml:16-17`
- **Agent:** 4 (Docker)
- **Issue:** Auto-scaling (1-3 instances) — each new instance downloads the 80MB model separately due to disk mount path mismatch
- **Fix:** Fix disk mount path alignment.

### ISSUE #215
- **Severity:** 🟡 MEDIUM
- **File:** `render.yaml:86-89`
- **Agent:** 4 (Docker)
- **Issue:** Double pooling: connection pooler (pool size 20) + Python supabase client pooling — connection exhaustion under load
- **Fix:** Configure supabase client to use single connection per instance.

### ISSUE #216
- **Severity:** 🟡 MEDIUM
- **File:** `render.yaml:33`
- **Agent:** 4 (Docker)
- **Issue:** `ALLOWED_ORIGINS` has hardcoded Vercel URL but deployment is on Render — split deployment strategy not documented
- **Fix:** Align origins with actual deployment URL or document split strategy.

### ISSUE #217
- **Severity:** 🟠 HIGH
- **File:** `scripts/docker-up.mjs:70`
- **Agent:** 4 (Docker)
- **Issue:** Uses `docker-compose` (hyphenated/V1) — fails on Docker Compose V2-only systems
- **Fix:** Change to `docker compose` (space form).

### ISSUE #218
- **Severity:** 🟠 HIGH
- **File:** `scripts/docker-logs.mjs:94`
- **Agent:** 4 (Docker)
- **Issue:** Same hyphenated `docker-compose` — fails on V2-only systems
- **Fix:** Change to `docker compose`.

### ISSUE #219
- **Severity:** 🟠 HIGH
- **File:** `scripts/docker-status.mjs:58`
- **Agent:** 4 (Docker)
- **Issue:** Same hyphenated `docker-compose ps` — fails on V2-only systems
- **Fix:** Change to `docker compose ps`.

### ISSUE #220
- **Severity:** 🟡 MEDIUM
- **File:** `scripts/docker-rebuild.mjs:126`
- **Agent:** 4 (Docker)
- **Issue:** `--no-cache` every time — 2-5 minute builds for routine dependency updates
- **Fix:** Only use `--no-cache` with explicit flag.

### ISSUE #221
- **Severity:** 🟡 MEDIUM
- **File:** `scripts/docker-inspect.mjs:85`
- **Agent:** 4 (Docker)
- **Issue:** Health check template doesn't handle nil Health object — empty output silently
- **Fix:** Add null check on Health object.

### ISSUE #222
- **Severity:** 🔵 LOW
- **File:** `scripts/docker-down.mjs:33-34`
- **Agent:** 4 (Docker)
- **Issue:** Try/catch swallows Docker daemon errors — exits 0 even when Docker daemon unreachable
- **Fix:** Propagate fatal errors.

### ISSUE #223
- **Severity:** 🔵 LOW
- **File:** `scripts/docker-clean.mjs:65`
- **Agent:** 4 (Docker)
- **Issue:** Inconsistent error handling — `execVerbose` throws, `exec` catches silently
- **Fix:** Standardize error handling patterns.

### ISSUE #224
- **Severity:** 🔵 LOW
- **File:** `scripts/docker-status.mjs:120-221`
- **Agent:** 4 (Docker)
- **Issue:** `_displayStatus` defined but never called — dead code
- **Fix:** Remove dead code.

### ISSUE #225
- **Severity:** 🟡 MEDIUM
- **File:** `scripts/seed-data/config.py:21-22`
- **Agent:** 5 (Seeding/Env)
- **Issue:** `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` default to `""` with no guard — silent failure with opaque HTTP errors
- **Fix:** Add validation with clear error messages.

### ISSUE #226
- **Severity:** 🟠 HIGH
- **File:** `scripts/seed-data/config.py:39`
- **Agent:** 5 (Seeding/Env)
- **Issue:** `SEED_USER_PASSWORD` default `"DemoPass123!"` — `.env` has `DEFAULT_PASSWORD` not `SEED_USER_PASSWORD`. Env var is never read, default always used
- **Fix:** Align env var name between `.env` and `config.py`.

### ISSUE #227
- **Severity:** 🟡 MEDIUM
- **File:** `scripts/seed-data/interactive_menu.py:33`
- **Agent:** 5 (Seeding/Env)
- **Issue:** Uses `msvcrt` (Windows-only) — crashes on Linux/macOS
- **Fix:** Add cross-platform fallback.

### ISSUE #228
- **Severity:** 🟡 MEDIUM
- **File:** `scripts/seed-data/requirements.txt`
- **Agent:** 5 (Seeding/Env)
- **Issue:** Dependencies use `>=` ranges (e.g., `httpx>=0.24.0`) — could break with breaking changes
- **Fix:** Pin versions.

### ISSUE #229
- **Severity:** 🟡 MEDIUM
- **File:** `scripts/seed-data/seeders/connections_seeder.py:138-142`
- **Agent:** 5 (Seeding/Env)
- **Issue:** Reverse connection for "accepted" creates duplicate rows on re-seed
- **Fix:** Check for existing connection before insert.

### ISSUE #230
- **Severity:** 🟡 MEDIUM
- **File:** `scripts/seed-data/seeders/notifications_seeder.py:26-34`
- **Agent:** 5 (Seeding/Env)
- **Issue:** Notification type names use snake_case but TypeScript `NotificationType` uses different naming — mismatch causes display failures for seeded data
- **Fix:** Align notification type names with TypeScript types.

### ISSUE #231
- **Severity:** 🟡 MEDIUM
- **File:** `scripts/seed-data/seeders/matches_seeder.py:139`
- **Agent:** 5 (Seeding/Env)
- **Issue:** Hardcoded limit to first 50 users — undocumented behavior when >50 profiles exist
- **Fix:** Make configurable or document the limitation.

### ISSUE #232
- **Severity:** 🟠 HIGH
- **File:** `scripts/seed-data/seeders/posts_seeder.py:248-273`
- **Agent:** 5 (Seeding/Env)
- **Issue:** `create_reactions_batch()` has unreachable `try` block — second `try` after first `try/catch` returns. Dead code
- **Fix:** Remove dead code block.

### ISSUE #233
- **Severity:** 🔵 LOW
- **File:** `scripts/seed-data/main.py:7`
- **Agent:** 5 (Seeding/Env)
- **Issue:** Docstring mentions CLI arguments but there's no argument parsing — CLI args silently ignored
- **Fix:** Implement CLI argument parsing or update docstring.

### ISSUE #234
- **Severity:** 🔵 LOW
- **File:** `scripts/seed-data/seeders/mentor_seeder.py:200`
- **Agent:** 5 (Seeding/Env)
- **Issue:** All AI mentor messages use same template `"Can you give me advice on {topic.lower()}?"` — unrealistically repetitive
- **Fix:** Use varied message templates.

### ISSUE #235
- **Severity:** 🔵 LOW
- **File:** `scripts/seed-data/templates/profile_templates.json:308`
- **Agent:** 5 (Seeding/Env)
- **Issue:** Only 10 `looking_for` combinations — with 100+ profiles, many repeat
- **Fix:** Increase template variety.

### ISSUE #236
- **Severity:** 🟡 MEDIUM
- **File:** `supabase/setup/99-master-all-tables.sql:2065`
- **Agent:** 1 (Database)
- **Issue:** GRANT for `find_similar_users` lists 3 parameters but function has 6 — PostgreSQL throws "function does not exist". **Aborts entire setup script**
- **Fix:** Change GRANT to match function signature.

### ISSUE #237
- **Severity:** 🟡 MEDIUM
- **File:** `supabase/setup/99-master-all-tables.sql:256`
- **Agent:** 1 (Database)
- **Issue:** `match_scores.updated_at` column exists but NO auto-update trigger — value never advances past INSERT timestamp
- **Fix:** Add trigger to `match_scores`.

### ISSUE #238
- **Severity:** 🟡 MEDIUM
- **File:** `supabase/setup/99-master-all-tables.sql:553`
- **Agent:** 1 (Database)
- **Issue:** `user_analytics.updated_at` column exists but NO auto-update trigger
- **Fix:** Add trigger to `user_analytics`.

### ISSUE #239
- **Severity:** 🟡 MEDIUM
- **File:** `supabase/setup/99-master-all-tables.sql:605`
- **Agent:** 1 (Database)
- **Issue:** `platform_analytics.updated_at` column exists but NO auto-update trigger
- **Fix:** Add trigger to `platform_analytics`.

### ISSUE #240
- **Severity:** 🔴 CRITICAL
- **File:** `supabase/setup/99-master-all-tables.sql:1799`
- **Agent:** 1 (Database)
- **Issue:** `p.id != COALESCE(exclude_user_id, p.id)` — when `exclude_user_id` is NULL (default), collapses to `p.id != p.id` which is **always FALSE**. Returns zero users by default
- **Fix:** Replace with `WHERE (exclude_user_id IS NULL OR p.id != exclude_user_id)`.

### ISSUE #241
- **Severity:** 🟠 HIGH
- **File:** `supabase/setup/99-master-all-tables.sql:2920`
- **Agent:** 1 (Database)
- **Issue:** `capture_event` trigger uses `auth.uid()` inside trigger body — may be NULL when operation by service_role. Wrong `target_id_val` logged for connection events
- **Fix:** Use `NEW.requester_id` directly in trigger context.

### ISSUE #242
- **Severity:** 🟡 MEDIUM
- **File:** `supabase/setup/99-master-all-tables.sql:1106`
- **Agent:** 1 (Database)
- **Issue:** `retry_failed_embedding` increments `retry_count` on ANY profile update while in 'failed' state — not just when relevant columns change. Retry inflation
- **Fix:** Only increment retry_count when relevant columns change.

### ISSUE #243
- **Severity:** 🟡 MEDIUM
- **File:** `supabase/setup/99-master-all-tables.sql:841`
- **Agent:** 1 (Database)
- **Issue:** `embedding_pending_queue` processor uses `ORDER BY created_at ASC` for FIFO — less efficient than `DESC` index for queue processing pattern
- **Fix:** Use `ORDER BY created_at DESC` or add descending index.

### ISSUE #244
- **Severity:** 🟠 HIGH
- **File:** `supabase/setup/99-master-all-tables.sql:2432`
- **Agent:** 1 (Database)
- **Issue:** `content_moderation_logs` has no SELECT policy for any role — admin dashboard cannot read moderation logs without service_role
- **Fix:** Add SELECT policy for admin users.

### ISSUE #245
- **Severity:** 🟡 MEDIUM
- **File:** `supabase/setup/99-master-all-tables.sql:2278-2280`
- **Agent:** 1 (Database)
- **Issue:** `match_scores` has no SELECT policy for authenticated users — users cannot view their own match scores
- **Fix:** Add SELECT policy for own records.

### ISSUE #246
- **Severity:** 🟡 MEDIUM
- **File:** `supabase/setup/99-master-all-tables.sql:2409-2411`
- **Agent:** 1 (Database)
- **Issue:** `events` table has no INSERT policy for authenticated users — partially mitigated by SECURITY DEFINER triggers
- **Fix:** Add INSERT policy or document intentional design.

### ISSUE #247
- **Severity:** 🟡 MEDIUM
- **File:** `supabase/setup/99-master-all-tables.sql:2510`
- **Agent:** 1 (Database)
- **Issue:** Storage bucket upload uses `auth.jwt()->>'role'` instead of `auth.role()` — works but inconsistent with rest of schema
- **Fix:** Use canonical `auth.role()` function.

### ISSUE #248
- **Severity:** 🔵 LOW
- **File:** `supabase/setup/99-master-all-tables.sql:928,1754`
- **Agent:** 1 (Database)
- **Issue:** Two BEFORE UPDATE triggers on `posts` both set `updated_at = NOW()` — redundant
- **Fix:** Remove duplicate from one trigger.

### ISSUE #249
- **Severity:** 🔵 LOW
- **File:** `supabase/setup/99-master-all-tables.sql:872-873`
- **Agent:** 1 (Database)
- **Issue:** Indexes on `dau` and `new_users` in `platform_analytics` (365 rows/year) provide negligible benefit
- **Fix:** Remove or justify with query patterns.

### ISSUE #250
- **Severity:** 🔴 CRITICAL
- **File:** `tests/components/features/messages/chat-window.test.tsx:305`
- **Agent:** 8 (Tests)
- **Issue:** `expect(markAsReadMock).toBeDefined()` — always passes since mock defined at line 274. False positive — actual behavior never verified
- **Fix:** Assert on actual outcome (function called with correct args).

### ISSUE #251
- **Severity:** 🔴 CRITICAL
- **File:** `tests/e2e/auth-flow.spec.ts:3-43`
- **Agent:** 8 (Tests)
- **Issue:** Only tests login page renders client-side validation. Never performs actual login, never verifies authenticated state, never tests protected route access
- **Fix:** Implement actual login flow in E2E tests.

### ISSUE #252
- **Severity:** 🔴 CRITICAL
- **File:** `tests/e2e/critical-flows.spec.ts:55-65`
- **Agent:** 8 (Tests)
- **Issue:** Uses `.catch(() => false)` for every assertion — tests pass even if elements never found. Registration validation test has zero real coverage
- **Fix:** Remove catch-based suppression, use proper assertion patterns.

### ISSUE #253
- **Severity:** 🔴 CRITICAL
- **File:** `tests/e2e/critical-flows.spec.ts:80-138`
- **Agent:** 8 (Tests)
- **Issue:** Post Creation, Messaging, Match Generation, Navigation flows use `if (currentUrl.includes('/dashboard'))` — tests silently pass when auth redirect prevents reaching these pages. Non-deterministic
- **Fix:** Ensure authenticated state before running protected tests.

### ISSUE #254
- **Severity:** 🔴 CRITICAL
- **File:** `tests/integration/ai-mentor/chat-session.test.ts:70-87`
- **Agent:** 8 (Tests)
- **Issue:** Builds JSON payload and parses it back — NEVER makes an actual API call or calls any real function. Tests JSON serialization, not integration
- **Fix:** Test actual API routes or function calls.

### ISSUE #255
- **Severity:** 🔴 CRITICAL
- **File:** `tests/integration/ai-mentor/chat-session.test.ts:145-156`
- **Agent:** 8 (Tests)
- **Issue:** Creates AbortController, verifies `timeoutMs === 30000` and `controller.signal.aborted === true` — tests nothing about the system. Literal self-verification. Always passes
- **Fix:** Remove or replace with actual system behavior test.

### ISSUE #256
- **Severity:** 🔴 CRITICAL
- **File:** `tests/integration/ai-mentor/chat-session.test.ts:159-238`
- **Agent:** 8 (Tests)
- **Issue:** "Profile context awareness" section builds strings and runs `expect(string).toContain(...)` — no system code executed. Data structure tests, not integration tests
- **Fix:** Test actual context assembly pipeline functions.

### ISSUE #257
- **Severity:** 🔴 CRITICAL
- **File:** `tests/integration/messaging/chat-pagination.test.ts`
- **Agent:** 8 (Tests)
- **Issue:** Entire file tests locally-defined pagination math (ranges, offsets). No real hooks, no real Supabase calls, no real API interactions. Tests arithmetic, not integration
- **Fix:** Test actual pagination implementation in hooks/services.

### ISSUE #258
- **Severity:** 🔴 CRITICAL
- **File:** `tests/integration/matches/match-flow.test.ts`
- **Agent:** 8 (Tests)
- **Issue:** Implements complete in-memory `MockSupabaseDB` class (lines 52-117) duplicating real schema. Tests verify against synthetic in-memory DB, not real queries
- **Fix:** Test against actual Supabase query layer or integration test helper.

### ISSUE #259
- **Severity:** 🔴 CRITICAL
- **File:** `tests/setup/mocks.ts:56-66`
- **Agent:** 8 (Tests)
- **Issue:** All Supabase mocks return same singleton `mockSupabaseClient` — shared mutable state between tests. Tests that mutate mock affect subsequent tests. Test isolation compromised
- **Fix:** Create fresh mock instance per test with `beforeEach`.

### ISSUE #260
- **Severity:** 🔴 CRITICAL
- **File:** `tests/unit/auth/oauth.test.ts:25-36`
- **Agent:** 8 (Tests)
- **Issue:** Tests a locally-defined `signInWithOAuth` helper instead of importing the actual OAuth handler. Duplicates logic — passes even when real handler is broken
- **Fix:** Test the actual imported OAuth implementation.

### ISSUE #261
- **Severity:** 🔴 CRITICAL
- **File:** `tests/unit/onboarding-validation.test.ts:7-46`
- **Agent:** 8 (Tests)
- **Issue:** Duplicates Zod schemas verbatim from production code. Any schema change requires test update — extremely brittle. False negatives/positives on schema drift
- **Fix:** Import schemas from production code instead of duplicating.

### ISSUE #262
- **Severity:** 🔴 CRITICAL
- **File:** `tests/unit/services/` (all)
- **Agent:** 8 (Tests)
- **Issue:** 19 service files exist in `lib/services/` but only 6 have test files. **Untested:** `profiles.ts`, `matches.ts`, `posts.ts`, `comments.ts`, `connections.ts`, `notifications.ts`, `embeddings.ts`, `analytics.ts`, `development.ts`, `circuit-breaker.ts`, `post-attachments.ts`, `bm25.ts`
- **Fix:** Add unit tests for all untested services.

### ISSUE #263
- **Severity:** 🔴 CRITICAL
- **File:** `tests/unit/hooks/` (all)
- **Agent:** 8 (Tests)
- **Issue:** 33 hook files exist but only 11 have test files. **26 hooks untested** including `use-auth`, `use-chat`, `use-posts`, `use-comments`, `use-notifications`, `use-feed`, `use-analytics`, `use-settings`, `use-profile`
- **Fix:** Add tests for all untested hooks.

### ISSUE #264
- **Severity:** 🟠 HIGH
- **File:** `vitest.config.ts:27-33`
- **Agent:** 8 (Tests)
- **Issue:** Coverage thresholds set at 80% but `app/` and `app/api/` directories are excluded. API routes and page components have ZERO coverage requirement
- **Fix:** Include app directory in coverage or set separate threshold.

### ISSUE #265
- **Severity:** 🟠 HIGH
- **File:** `vitest.config.ts:39`
- **Agent:** 8 (Tests)
- **Issue:** Resolves `@testing-library/user-event` to a mock file — actual `user-event` library is NOT installed. Component interaction tests using user-event test a mock, not real behavior
- **Fix:** Install the actual user-event library.

### ISSUE #266
- **Severity:** 🟠 HIGH
- **File:** `playwright.config.ts:22`
- **Agent:** 8 (Tests)
- **Issue:** `webServer.command: 'npm run dev:skip-docker'` — if this script doesn't exist, all E2E tests silently skip
- **Fix:** Verify script exists or use standard `npm run dev`.

### ISSUE #267
- **Severity:** 🟠 HIGH
- **File:** `tests/e2e/onboarding-flow.spec.ts:324,348`
- **Agent:** 8 (Tests)
- **Issue:** Uses `waitForTimeout(2000)` — fixed timeouts are fragile across environments and increase test runtime unnecessarily
- **Fix:** Use `waitForSelector` or `waitForURL` instead of fixed timeouts.

### ISSUE #268
- **Severity:** 🟠 HIGH
- **File:** `tests/e2e/ui-components.spec.ts:275-301`
- **Agent:** 8 (Tests)
- **Issue:** Visual regression tests require manual baseline generation — never generated on CI without manual intervention. Tests flaky by design on first run
- **Fix:** Auto-generate baselines on first CI run or use consistent snapshot storage.

### ISSUE #269
- **Severity:** 🟠 HIGH
- **File:** `tests/integration/auth/flow.test.ts`
- **Agent:** 8 (Tests)
- **Issue:** Builds complete mock auth client (lines 34-86) duplicating Supabase Auth behavior. Tests only verify this mock's internal state machine. No real Supabase auth tested
- **Fix:** Test against real Supabase auth or use official test helpers.

### ISSUE #270
- **Severity:** 🟠 HIGH
- **File:** `tests/integration/profile/crud-operations.test.ts`
- **Agent:** 8 (Tests)
- **Issue:** Uses shared `mockSupabaseClient` singleton — table mocks set up per test via `vi.mocked(...).mockImplementation(...)`. Tests can interfere with each other
- **Fix:** Use `beforeEach` to reset mocks and create fresh instances.

### ISSUE #271
- **Severity:** 🟠 HIGH
- **File:** `tests/components/features/ai-mentor/ai-mentor-interface.test.tsx:18-25`
- **Agent:** 8 (Tests)
- **Issue:** `useAIStream` entirely mocked — core streaming behavior (message handling, responses) never tested at component level
- **Fix:** Add integration-style tests with realistic hook behavior.

### ISSUE #272
- **Severity:** 🟠 HIGH
- **File:** `tests/components/features/auth/login-form.test.tsx:108`
- **Agent:** 8 (Tests)
- **Issue:** Error toast test calls mock but NEVER asserts the toast was shown — only verifies mock was called. Potential false positive
- **Fix:** Assert on actual toast UI appearance.

### ISSUE #273
- **Severity:** 🟠 HIGH
- **File:** `tests/unit/lib/rate-limiter.test.ts:42-44,57-58,88-89`
- **Agent:** 8 (Tests)
- **Issue:** Uses 100+ iterations of `rateLimit()` in a loop to exhaust rate limits. Integration pattern in unit test — slow, fragile, depends on iteration count matching limit exactly
- **Fix:** Mock time for rate limit testing.

### ISSUE #274
- **Severity:** 🟠 HIGH
- **File:** `tests/unit/api/` (all)
- **Agent:** 8 (Tests)
- **Issue:** Only 1 API route tested (posts). All other API routes (auth, matches, messages, profiles, AI mentor, notifications, comments, connections, uploads, moderation, analytics) are untested
- **Fix:** Add route tests for all API endpoints.

### ISSUE #275
- **Severity:** 🟠 HIGH
- **File:** `tests/unit/csrf.test.ts:190-208`
- **Agent:** 8 (Tests)
- **Issue:** Test labeled "Integration" but tests `token === token` — always passes. False positive
- **Fix:** Test actual CSRF protection flow.

### ISSUE #276
- **Severity:** 🟡 MEDIUM
- **File:** `tests/setup/setup.ts:16-18`
- **Agent:** 8 (Tests)
- **Issue:** Both `clearAllMocks()` and `resetAllMocks()` called in `afterEach` — redundant. `resetAllMocks` already clears call history
- **Fix:** Remove one of the calls.

### ISSUE #277
- **Severity:** 🟡 MEDIUM
- **File:** `tests/setup/setup.ts:77-85`
- **Agent:** 8 (Tests)
- **Issue:** Next/Image mock returns raw DOM element, not React component — could cause rendering issues in component tests
- **Fix:** Return proper React component from mock.

### ISSUE #278
- **Severity:** 🟡 MEDIUM
- **File:** `tests/unit/lib/ai/streaming.test.ts:15,37`
- **Agent:** 8 (Tests)
- **Issue:** Uses `timeout` counter with `-= 10` for loop control — tests could hang or give false results if stream takes longer
- **Fix:** Use proper async patterns with timeouts.

### ISSUE #279
- **Severity:** 🟡 MEDIUM
- **File:** `tests/unit/services/match-scores.test.ts:55-57`
- **Agent:** 8 (Tests)
- **Issue:** `parseMatchScoreBreakdown` uses randomness — `maxValue <= 15` could be flaky with different random seeds
- **Fix:** Use deterministic seed or mock random.

### ISSUE #280
- **Severity:** 🟡 MEDIUM
- **File:** `tests/unit/sanitize.test.ts:48-58`
- **Agent:** 8 (Tests)
- **Issue:** `sanitizeMarkdown` tested with only 2 cases — insufficient for comprehensive XSS coverage
- **Fix:** Add comprehensive XSS vector test cases.

### ISSUE #281
- **Severity:** 🟡 MEDIUM
- **File:** `tests/components/features/onboarding/step-experience.test.tsx:9-52`
- **Agent:** 8 (Tests)
- **Issue:** 4 `vi.mock` blocks mock entire rendering surface — test is testing mock composition, not real component behavior
- **Fix:** Reduce mocking, test real rendering.

### ISSUE #282
- **Severity:** 🟡 MEDIUM
- **File:** `tests/components/features/messages/chat-window.test.tsx:33-34`
- **Agent:** 8 (Tests)
- **Issue:** `MESSAGE_QUERY_KEYS` exported from mock — duplicates production logic. If production keys change, test won't fail
- **Fix:** Import from production code instead of duplicating in mock.

### ISSUE #283
- **Severity:** 🟡 MEDIUM
- **File:** `tests/components/ui/button.test.tsx:37-39`
- **Agent:** 8 (Tests)
- **Issue:** Verifies variant classes via `toHaveClass('border')` — string-matching Tailwind class names is fragile if classes are renamed
- **Fix:** Test behavior/styling through visual or snapshot tests.

### ISSUE #284
- **Severity:** 🟡 MEDIUM
- **File:** `tests/integration/embeddings/vector-retriever.test.ts:56-92`
- **Agent:** 8 (Tests)
- **Issue:** Complex mock setup with nested chaining — extremely brittle. Mock structure change breaks test
- **Fix:** Simplify mock setup or use integration test pattern.

### ISSUE #285
- **Severity:** 🟡 MEDIUM
- **File:** `tests/integration/embeddings/pipeline.test.ts`
- **Agent:** 8 (Tests)
- **Issue:** Good failure scenario coverage but mock setup is overly complex with nested mock chaining
- **Fix:** Abstract mock setup into reusable helpers.

### ISSUE #286
- **Severity:** 🟡 MEDIUM
- **File:** `playwright.config.ts:7`
- **Agent:** 8 (Tests)
- **Issue:** `retries: process.env.CI ? 2 : 0` — no retries locally. Combined with timeout-only assertions, flaky tests easily missed during development
- **Fix:** Enable retries locally too.

### ISSUE #287
- **Severity:** 🟡 MEDIUM
- **File:** `.github/workflows/ci.yml`
- **Agent:** 8 (Tests)
- **Issue:** No E2E test step visible in CI workflow — E2E tests may only run locally
- **Fix:** Add E2E test step to CI pipeline.

### ISSUE #288
- **Severity:** 🟡 MEDIUM
- **File:** No `.env.test` file found
- **Agent:** 8 (Tests)
- **Issue:** No dedicated test env config — tests use `.env` which has real `SUPABASE_SERVICE_ROLE_KEY`. Could accidentally hit real database
- **Fix:** Create `.env.test` with test-specific credentials.

### ISSUE #289
- **Severity:** 🟡 MEDIUM
- **File:** `tests/unit/lib/` (env-validation tests)
- **Agent:** 8 (Tests)
- **Issue:** No tests for `validate-env.ts` covering the 16+ env vars not in the validation schema
- **Fix:** Add comprehensive env validation tests.

### ISSUE #290
- **Severity:** 🟡 MEDIUM
- **File:** `tests/components/features/messages/`
- **Agent:** 8 (Tests)
- **Issue:** Message components tested in isolation — no test for typing indicator, realtime subscription, or end-to-end message flow
- **Fix:** Add integration-style tests for message send/receive flow.

### ISSUE #291
- **Severity:** 🔵 LOW
- **File:** `tests/unit/lib/services/` (existing tests)
- **Agent:** 8 (Tests)
- **Issue:** Feed scorer, notification engine, content moderator tests have good AAA structure but limited edge case coverage
- **Fix:** Add edge case tests (empty, error, boundary).

### ISSUE #292
- **Severity:** 🔵 LOW
- **File:** `tests/integration/environment/dev-server.test.ts`
- **Agent:** 8 (Tests)
- **Issue:** Tests actual environment features — good pattern. Should be replicated for other integration areas
- **Fix:** Use as template for other integration tests.

### ISSUE #293
- **Severity:** 🔵 LOW
- **File:** `tests/e2e/system-health.spec.ts`
- **Agent:** 8 (Tests)
- **Issue:** Best E2E tests in the suite — valid JSON schema assertions, status value checks, cache-control header verification. Benchmark for other tests
- **Fix:** Use as template for improving other E2E tests.

### ISSUE #294
- **Severity:** 🔴 CRITICAL
- **File:** `types/database.types.ts:425-457` and `471-504`
- **Agent:** 1 (Database)
- **Issue:** `UserAnalytics` interface defined TWICE with different fields. First missing `last_calculated_at`. Causes TypeScript compilation error
- **Fix:** Remove duplicate at line 425, keep complete version at line 471.

### ISSUE #295
- **Severity:** 🔴 CRITICAL
- **File:** `types/database.types.ts:720-932`
- **Agent:** 1 (Database)
- **Issue:** Missing TypeScript types for `post_impressions` and `feed_thompson_params` — two tables exist in SQL but have no type interfaces. Zero type safety
- **Fix:** Add interfaces and Database type entries for both tables.

### ISSUE #296
- **Severity:** 🟠 HIGH
- **File:** `types/database.types.ts:57`
- **Agent:** 1 (Database)
- **Issue:** `user_experiences.title` marked optional (`title?: string`) but SQL column is `title TEXT NOT NULL` — INSERT fails when TS code passes undefined
- **Fix:** Make `title` non-optional in TypeScript.

### ISSUE #297
- **Severity:** 🟠 HIGH
- **File:** `types/database.types.ts:515`
- **Agent:** 1 (Database)
- **Issue:** `BlockedUser.updated_at` exists in TypeScript but `blocked_users` SQL table has no `updated_at` column — code accessing it always gets undefined
- **Fix:** Either add `updated_at` to SQL table or remove from TS type.

### ISSUE #298
- **Severity:** 🟡 MEDIUM
- **File:** `types/database.types.ts:540`
- **Agent:** 1 (Database)
- **Issue:** `PrivacySetting.updated_at` marked optional in TS but NOT NULL in SQL — the column is always populated by the DB
- **Fix:** Make non-optional in TypeScript.

### ISSUE #299
- **Severity:** 🟡 MEDIUM
- **File:** `types/database.types.ts:201`
- **Agent:** 1 (Database)
- **Issue:** `MatchScore.insights` typed as `string[]` but SQL column is `JSONB` — JSONB can hold heterogeneous data, not just string arrays
- **Fix:** Change TypeScript type to match JSONB capabilities.

### ISSUE #300
- **Severity:** 🔴 CRITICAL
- **File:** Cross-cutting — 4 different env var names for the same worker URL
- **Agent:** 4 (Docker), 5 (Seeding/Env)
- **Issue:** `NEXT_PUBLIC_PYTHON_WORKER_URL` (match-generation.ts), `NEXT_PUBLIC_WORKER_API_URL` (environment.ts), `PYTHON_WORKER_URL` (.env, validate-env.ts), `BACKEND_URL_DOCKER` (.env, backend.ts) — all for the same URL
- **Fix:** Standardize to one env var name across entire codebase.

### ISSUE #301
- **Severity:** 🟠 HIGH
- **File:** Cross-cutting — 6+ files
- **Agent:** 6 (Frontend)
- **Issue:** Fragile CSRF token cookie parsing pattern duplicated across 6+ files — `document.cookie.split('; ').find(row => row.startsWith('csrf_token='))?.split('=')[1] || ''`. Silently returns empty string if cookie missing or in private browsing
- **Fix:** Extract to shared `getCSRFToken()` utility with try/catch and SSR guard.

### ISSUE #302
- **Severity:** 🟠 HIGH
- **File:** Cross-cutting — all pages
- **Agent:** 2 (API), 6 (Frontend)
- **Issue:** No ErrorBoundary or error.tsx on any auth-route page — blank white screen on any render error
- **Fix:** Add error.tsx and loading.tsx to every route segment.

### ISSUE #303
- **Severity:** 🟠 HIGH
- **File:** Cross-cutting — all pages
- **Agent:** 2 (API), 6 (Frontend)
- **Issue:** No Suspense boundaries on any page with data fetching — unhandled promise rejections crash the page
- **Fix:** Wrap data-fetching components in `<Suspense>` with fallback.

### ISSUE #304
- **Severity:** 🟠 HIGH
- **File:** Cross-cutting — all hooks
- **Agent:** 2 (API), 6 (Frontend)
- **Issue:** No AbortController on any frontend fetch() call — in-flight requests continue after component unmount, causing memory leaks
- **Fix:** Add AbortController to all fetch calls, cleanup on unmount.

### ISSUE #305
- **Severity:** 🟠 HIGH
- **File:** Cross-cutting — all hooks
- **Agent:** 2 (API)
- **Issue:** No network timeout on any frontend fetch() — infinite loading spinners on slow networks
- **Fix:** Add `AbortSignal.timeout()` to all fetch calls.

### ISSUE #306
- **Severity:** 🟠 HIGH
- **File:** Cross-cutting — all matching and activity APIs
- **Agent:** 2 (API), 7 (Security)
- **Issue:** No retry for 429 rate limit responses — routes return Retry-After headers but frontend never checks for 429
- **Fix:** Add 429 detection and retry with Retry-After header.

### ISSUE #307
- **Severity:** 🟡 MEDIUM
- **File:** Cross-cutting — match generation, AI chat
- **Agent:** 7 (Security)
- **Issue:** Multiple API endpoints have wildcard CORS (`Access-Control-Allow-Origin: *`) — allows any website to initiate requests
- **Fix:** Restrict to specific allowed origins.

### ISSUE #308
- **Severity:** 🟡 MEDIUM
- **File:** Cross-cutting — hooks
- **Agent:** 2 (API)
- **Issue:** All hooks use `retry: 1` with no delay — too aggressive for transient failures, immediate retry likely fails again
- **Fix:** Add exponential backoff delay to retries.

### ISSUE #309
- **Severity:** 🟠 HIGH
- **File:** Cross-cutting — environment
- **Agent:** 5 (Seeding/Env), 7 (Security)
- **Issue:** `ADMIN_EMAILS`, `DASHSCOPE_API_KEY`, `KV_REST_API_URL` used in code but missing from ALL env files — will crash at runtime when those code paths execute
- **Fix:** Add to all env files or implement safe fallbacks.

### ISSUE #310
- **Severity:** 🔵 LOW
- **File:** Cross-cutting — components
- **Agent:** 6 (Frontend)
- **Issue:** Array index `key={idx}` used throughout multiple component lists — breaks React reconciliation on reorder
- **Fix:** Use stable unique IDs as keys.

### ISSUE #311
- **Severity:** 🔵 LOW
- **File:** Cross-cutting — components
- **Agent:** 6 (Frontend)
- **Issue:** Commented imports like `// import { toast } from "sonner"` scattered across components — dead code
- **Fix:** Remove dead import comments.

---

## STATISTICS SUMMARY

| Severity | Count | % |
|----------|:-----:|:-:|
| 🔴 CRITICAL | 65 | 21% |
| 🟠 HIGH | 87 | 28% |
| 🟡 MEDIUM | 109 | 35% |
| 🔵 LOW | 49 | 16% |
| **TOTAL** | **311** | **100%** |

| Top Agent by Issues | Count |
|---------------------|:-----:|
| Agent 7 — Security & Production | 63 |
| Agent 6 — Frontend Components & Hooks | 48 |
| Agent 3 — Backend Services & AI | 42 |
| Agent 8 — Test Coverage & Quality | 37 |
| Agent 4 — Docker & Infrastructure | 35 |
| Agent 2 — Frontend-Backend API | 34 |
| Agent 5 — Data Seeding & Environment | 30 |
| Agent 1 — Database Schema & RLS | 22 |

| Most Common Issue Types | Count |
|------------------------|:-----:|
| Error handling gaps (missing try/catch, no error UI) | 34 |
| Missing tests / coverage gaps | 29 |
| Env var misconfiguration | 24 |
| Security vulnerabilities (auth, injection, XSS) | 23 |
| State management / re-render issues | 18 |
| API communication mismatches | 16 |
| Missing error/loading/suspense boundaries | 15 |
| Console.log in production | 8 |
| Dead code / orphaned functions | 8 |
| Hydration / SSR issues | 5 |

---

*Report generated 2026-05-26 by OpenAgent 8-agent parallel audit system*  
*8 sub-agents · ~500 source files · 311 issues enumerated · All issues listed A–Z by file path*
