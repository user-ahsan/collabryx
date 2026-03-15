# 🚀 Collabryx Phase Implementation Plan

**Created:** 2026-03-15  
**Status:** Ready for Execution  
**Workflow:** Multi-Agent Parallel Development with Git Branch Isolation

---

## 📋 EXECUTIVE SUMMARY

This plan implements **Phases 1-4** and **Optimizations** from `@completion-plan.md` using a **sub-agent workflow** where:

1. **Main Orchestrator** coordinates all phases
2. **Sub-agents** work on isolated git branches
3. **Sequential review & merge** ensures quality
4. **Parallel execution** where dependencies allow

---

## 🌿 GIT BRANCH STRATEGY

### Branch Hierarchy

```
main
├── phase-implementation-2026-03-15 (main integration branch)
│   ├── phase-0-infrastructure ✅ CREATED
│   ├── phase-1-embedding-api ✅ CREATED
│   ├── phase-2-ai-mentor ✅ CREATED
│   ├── phase-3-login-data ✅ CREATED
│   ├── phase-4-testing ✅ CREATED
│   └── optimization-phase ✅ CREATED
```

### Branch Workflow

```
1. Checkout phase branch → 2. Implement → 3. Test → 4. Review → 5. Merge to integration → 6. Next phase
```

---

## 🎯 PHASE 0: INFRASTRUCTURE SETUP

**Branch:** `phase-0-infrastructure`  
**Estimated Time:** 4-6 hours  
**Dependencies:** None (can start immediately)

### Sub-Agent Tasks

#### Task 0.1: Package Dependencies
- [ ] Add `openai@^4.28.0` to `package.json`
- [ ] Add new npm scripts:
  - `docker:up`, `docker:down`, `docker:logs`, `docker:health`
  - `dev:skip-docker`
- [ ] Run `npm install` to verify

#### Task 0.2: Environment Variables
- [ ] Update `.env` with:
  - `BACKEND_MODE=auto`
  - `BACKEND_URL_RENDER`
  - `BACKEND_URL_DOCKER`
  - `BACKEND_FALLBACK=edge`
  - `OPENAI_API_KEY`
  - `LLM_PROVIDER=openai`

#### Task 0.3: Backend Configuration Module
- [ ] Create `lib/config/backend.ts`
  - `getBackendConfig()` function
  - `getBackendUrl()` helper
  - `withBackendHealth()` middleware
  - Health check with caching (30s)

#### Task 0.4: Pre-Dev Docker Check
- [ ] Create `scripts/check-docker.mjs`
  - Health check logic
  - Clear error messages
  - Fallback warnings

#### Task 0.5: Deployment Configuration
- [ ] Create `render.yaml` (Render deployment config)
- [ ] Create `docker-compose.dev.yml` (local dev orchestration)

### Deliverables
- ✅ Backend URL resolver with health checks
- ✅ Docker check script with helpful errors
- ✅ Render deployment config
- ✅ Local dev Docker setup

### Review Checklist
- [ ] TypeScript compiles without errors
- [ ] `npm run docker:health` returns healthy status
- [ ] Environment variables documented
- [ ] No breaking changes to existing code

---

## 🎯 PHASE 1: EMBEDDING API ROUTE UPDATE

**Branch:** `phase-1-embedding-api`  
**Estimated Time:** 3-4 hours  
**Dependencies:** Phase 0 must be complete and merged

### Sub-Agent Tasks

#### Task 1.1: Update API Route
- [ ] Import `getBackendConfig` from `@/lib/config/backend`
- [ ] Replace Python worker try-catch block (lines 202-261)
  - Add backend routing logic
  - Handle rate limit responses (429)
  - Return queued response immediately
  - Fallback to Edge Function

#### Task 1.2: Testing
- [ ] Test with Docker backend running
- [ ] Test with Docker backend stopped (fallback)
- [ ] Test rate limit handling
- [ ] Verify console logs show correct backend mode

### Deliverables
- ✅ Dual-backend embedding API (Docker/Render)
- ✅ Automatic fallback to Edge Function
- ✅ Rate limit response handling

### Review Checklist
- [ ] Embedding generation works with Docker
- [ ] Fallback works when Docker unavailable
- [ ] Rate limit errors shown to user
- [ ] No console errors

---

## 🎯 PHASE 2: AI MENTOR IMPLEMENTATION

**Branch:** `phase-2-ai-mentor`  
**Estimated Time:** 8-10 hours  
**Dependencies:** Phase 0 complete (Phase 1 can run in parallel)

### Sub-Agent Tasks

#### Task 2.1: Server Actions
- [ ] Create `lib/actions/ai-mentor.ts`
  - `createSession()` - create new AI session
  - `sendMessage()` - send message + get LLM response
  - `getSessionHistory()` - load messages
  - `getUserSessions()` - list all sessions
  - `archiveSession()` - close session
  - `saveMessageToProfile()` - save insights

#### Task 2.2: OpenAI Integration
- [ ] Initialize OpenAI client
- [ ] Implement GPT-4 Turbo calls
- [ ] Add system prompt for AI Mentor persona
- [ ] Handle LLM errors gracefully

#### Task 2.3: Component Updates
- [ ] Update `components/features/assistant/chat-input.tsx`
  - Connect to `sendMessage` server action
  - Add loading states
  - Toast notifications
- [ ] Update `components/features/assistant/chat-list.tsx`
  - Load real session history
  - Display messages with MessageBubble
  - Loading states

#### Task 2.4: Database Schema
- [ ] Verify `ai_mentor_sessions` table exists
- [ ] Verify `ai_mentor_messages` table exists
- [ ] Check RLS policies

### Deliverables
- ✅ Working AI Mentor chat feature
- ✅ OpenAI/Claude integration
- ✅ Session management
- ✅ Message history

### Review Checklist
- [ ] Can create new session
- [ ] Messages send and receive responses
- [ ] History loads correctly
- [ ] Error handling works
- [ ] No API key exposure

---

## 🎯 PHASE 3: SMART MATCHES + FEED ON LOGIN

**Branch:** `phase-3-login-data`  
**Estimated Time:** 6-8 hours  
**Dependencies:** Phase 0 complete (can run in parallel with Phase 2)

### Sub-Agent Tasks

#### Task 3.1: Login Data Hook
- [ ] Create `hooks/use-login-data.ts`
  - Fetch posts (React Query)
  - Fetch matches (React Query)
  - Fetch profile
  - Fetch notifications
  - Parallel data fetching
  - Loading states

#### Task 3.2: Auth Layout Update
- [ ] Update `app/(auth)/layout.tsx`
  - Add QueryClientProvider
  - Integrate `useLoginData` hook
  - Add loading overlay
  - Opacity effect during load

#### Task 3.3: Caching Configuration
- [ ] Set stale times:
  - Posts: 2min stale, 10min GC
  - Matches: 5min stale, 15min GC
  - Profile: 5min stale
  - Notifications: 1min stale

### Deliverables
- ✅ Parallel data fetching on login
- ✅ Loading screen with spinner
- ✅ React Query caching configured

### Review Checklist
- [ ] Login shows loading screen
- [ ] All data loads in parallel
- [ ] Cache times are correct
- [ ] Error handling works
- [ ] No waterfalls in data fetching

---

## 🎯 PHASE 4: TESTING & DEPLOYMENT

**Branch:** `phase-4-testing`  
**Estimated Time:** 4-6 hours  
**Dependencies:** Phases 1-3 complete and merged

### Sub-Agent Tasks

#### Task 4.1: Local Testing
- [ ] Test Docker backend health check
- [ ] Test embedding generation flow
- [ ] Test AI Mentor conversations
- [ ] Test login data fetching
- [ ] Test fallback scenarios

#### Task 4.2: Documentation
- [ ] Update `README.md` with new scripts
- [ ] Add troubleshooting section
- [ ] Document environment variables

#### Task 4.3: Production Deployment
- [ ] Configure Vercel environment variables
- [ ] Deploy to Render (backend)
- [ ] Verify health checks pass
- [ ] Test production deployment

### Deliverables
- ✅ All features tested locally
- ✅ Production deployment complete
- ✅ Documentation updated

### Review Checklist
- [ ] All tests pass
- [ ] Production build successful
- [ ] Health checks passing
- [ ] No console errors in production

---

## 🎯 OPTIMIZATION PHASE

**Branch:** `optimization-phase`  
**Estimated Time:** 3-4 hours  
**Dependencies:** All phases complete

### Sub-Agent Tasks

#### Task OPT-1: Performance Optimizations
- [ ] Add health check caching (30s TTL)
- [ ] Verify React Query caching
- [ ] Optimize Python worker memory
- [ ] Add bundle size analysis

#### Task OPT-2: Cost Optimizations
- [ ] Evaluate Claude Haiku vs GPT-4
- [ ] Add API cost monitoring
- [ ] Implement usage analytics

#### Task OPT-3: Monitoring
- [ ] Add logging for backend switches
- [ ] Track fallback usage
- [ ] Monitor queue depth

### Deliverables
- ✅ Performance optimizations implemented
- ✅ Cost monitoring in place
- ✅ Analytics tracking

---

## 🔄 SUB-AGENT WORKFLOW

### Workflow Steps

```
┌─────────────────────────────────────────────────────────────┐
│ 1. MAIN ORCHESTRATOR                                         │
│    - Creates sub-agent for phase                             │
│    - Assigns branch and tasks                                │
│    - Provides context and requirements                       │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. SUB-AGENT EXECUTION                                       │
│    - Checks out assigned branch                              │
│    - Implements tasks sequentially                           │
│    - Runs tests after each task                              │
│    - Commits changes with clear messages                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. REVIEW & VERIFICATION                                     │
│    - Main orchestrator reviews changes                       │
│    - Runs build: `npm run build`                             │
│    - Runs lint: `npm run lint`                               │
│    - Verifies all tasks complete                             │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. MERGE DECISION                                            │
│    - If PASS: Merge to integration branch                    │
│    - If FAIL: Return to sub-agent with feedback              │
│    - Update todo status                                      │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. NEXT PHASE                                                │
│    - Deploy next sub-agent                                  │
│    - Repeat workflow                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 EXECUTION ORDER

### Parallel Execution (Recommended)

```
Day 1:
├── Phase 0 (Infrastructure) ──→ Complete first
│
Day 2-3:
├── Phase 1 (Embedding API) ──┐
│                              ├──→ Can run in parallel
├── Phase 2 (AI Mentor) ──────┤
│                              │
├── Phase 3 (Login Data) ─────┘
│
Day 4:
└── Phase 4 (Testing) ──→ After all phases merged
│
Day 5:
└── Optimization Phase
```

---

## ✅ MERGE CRITERIA

Each phase must pass before merging:

### Code Quality
- [ ] `npm run build` passes (0 errors)
- [ ] `npm run lint` passes (0 errors)
- [ ] TypeScript strict mode (no `any` types)
- [ ] No unused imports
- [ ] Proper error handling

### Functionality
- [ ] All tasks in phase complete
- [ ] Features tested locally
- [ ] No breaking changes
- [ ] Backwards compatible

### Documentation
- [ ] Code comments for complex logic
- [ ] Environment variables documented
- [ ] New scripts documented

---

## 📝 COMMIT MESSAGE FORMAT

Each sub-agent must use conventional commits:

```
feat(phase-0): add backend configuration module
feat(phase-0): create docker health check script
fix(phase-1): handle rate limit responses correctly
feat(phase-2): implement AI Mentor server actions
feat(phase-3): add login data fetching hook
```

---

## 🚨 ROLLBACK PLAN

If a phase causes issues:

```bash
# 1. Identify problematic merge
git log --oneline -10

# 2. Revert specific commit
git revert <commit-hash>

# 3. Create fix branch
git checkout -b fix/<phase-name>-<issue>

# 4. Fix and re-test
# 5. Re-merge when ready
```

---

## 📈 PROGRESS TRACKING

### Phase Status Board

| Phase | Branch | Status | Sub-Agent | Review | Merge |
|-------|--------|--------|-----------|--------|-------|
| 0 | `phase-0-infrastructure` | 🟡 In Progress | Pending | ⏳ | ⏳ |
| 1 | `phase-1-embedding-api` | ⚪ Pending | Pending | ⏳ | ⏳ |
| 2 | `phase-2-ai-mentor` | ⚪ Pending | Pending | ⏳ | ⏳ |
| 3 | `phase-3-login-data` | ⚪ Pending | Pending | ⏳ | ⏳ |
| 4 | `phase-4-testing` | ⚪ Pending | Pending | ⏳ | ⏳ |
| OPT | `optimization-phase` | ⚪ Pending | Pending | ⏳ | ⏳ |

**Legend:**
- ⚪ Not Started
- 🟡 In Progress
- 🟢 Complete
- 🔴 Blocked

---

## 🎯 SUCCESS CRITERIA

### Phase 0 Success
- ✅ `npm run dev` checks Docker health
- ✅ Clear error messages if Docker not running
- ✅ Backend config resolves correct URL
- ✅ Health check passes

### Phase 1 Success
- ✅ Embeddings generated via Docker backend
- ✅ Fallback to Edge Function works
- ✅ Rate limit errors shown to user

### Phase 2 Success
- ✅ AI Mentor conversations working
- ✅ Sessions persist in database
- ✅ LLM responses display correctly

### Phase 3 Success
- ✅ Login loads feed + matches
- ✅ Loading screen appears
- ✅ Data cached with React Query

### Phase 4 Success
- ✅ All features tested
- ✅ Production deployment successful
- ✅ Documentation complete

### Optimization Success
- ✅ Health check caching implemented
- ✅ Cost monitoring active
- ✅ Performance metrics tracked

---

## 📞 COMMUNICATION PROTOCOL

### Sub-Agent Updates

Each sub-agent should report:

```
✅ Task Complete: [Task Name]
   - Branch: phase-X-...
   - Files Changed: 3
   - Tests: Passing
   - Ready for Review: Yes
```

### Issue Reporting

```
🔴 Issue Found: [Description]
   - Severity: High/Medium/Low
   - Impact: [What breaks]
   - Proposed Fix: [Solution]
   - Blocked: Yes/No
```

---

## 🔧 TOOLING & COMMANDS

### Essential Commands

```bash
# Branch management
git checkout phase-0-infrastructure
git merge phase-0-infrastructure phase-implementation-2026-03-15

# Testing
npm run build          # Production build
npm run lint           # ESLint
npm run docker:up      # Start Docker
npm run docker:health  # Check health

# Deployment
vercel                 # Deploy to Vercel
```

---

## 📚 REFERENCE DOCUMENTS

- `@completion-plan.md` - Original completion plan
- `@AGENTS.md` - Agent protocols and standards
- `@docs/DEVELOPMENT.md` - Development workflow
- `@docs/DEPLOYMENT.md` - Deployment guide

---

**Last Updated:** 2026-03-15  
**Status:** Ready for Execution  
**Next Action:** Deploy Phase 0 Sub-Agent
