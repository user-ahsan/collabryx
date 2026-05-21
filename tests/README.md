# Collabryx Test Suite — 100 Test Cases Across 10 Modules

**Framework:** Vitest (unit/component/integration) + Playwright (E2E)  
**Pattern:** AAA (Arrange-Act-Assert)  
**Files:** 118 test files, 750+ individual tests  
**Status:** Production Ready ✅

---

## Test Structure

```
tests/
├── setup/                                     # Global test infrastructure
│   ├── setup.ts                               # afterEach cleanup, matchMedia, IntersectionObserver, next/navigation, motion mocks
│   ├── mocks.ts                               # Supabase client, sonner toast, React Query mocks
│   └── fixtures.ts                            # Mock data: User, Post, Comment, Connection, Notification, Conversation, Message
│
├── unit/                                      # Pure logic tests (no React rendering)
│   ├── auth/                                  # TC-013, TC-014 — OAuth sign-in (Google, GitHub)
│   │   └── oauth.test.ts
│   ├── hooks/                                 # Hook logic (10 files)
│   │   ├── use-auth.test.tsx                  # Auth hook
│   │   ├── use-posts.test.tsx                 # Posts CRUD
│   │   ├── use-profile.test.tsx               # Profile mutations
│   │   ├── use-chat.test.tsx                  # Chat logic
│   │   ├── use-ai-stream.test.ts              # AI streaming
│   │   ├── use-notifications.test.tsx         # Notification queries
│   │   ├── use-connection-requests.test.ts    # TC-061 — Send connection request
│   │   ├── use-connections.test.ts            # TC-063, TC-064 — Accept/reject connection
│   │   ├── use-messages.test.ts               # TC-066, TC-068 — Send messages, offline sync
│   │   ├── use-conversations.test.ts          # TC-073 — Conversation metadata
│   │   └── use-typing-indicator.test.ts       # TC-069 — Typing status broadcast
│   ├── actions/                               # Server action logic
│   │   ├── posts.test.ts                      # Post CRUD actions
│   │   └── profile-actions.test.ts            # TC-022,024,025,028 — Profile CRUD actions
│   ├── lib/                                   # Library & utility tests (30+ files)
│   │   ├── ai/                                # AI layer
│   │   │   ├── errors.test.ts                 # AI error classes
│   │   │   ├── streaming.test.ts              # Streaming handler
│   │   │   ├── provider-routing.test.ts       # TC-084 — Gemini/OpenAI/Anthropic routing
│   │   │   └── providers/ (base, minimax, registry tests)
│   │   ├── rag/                               # RAG pipeline
│   │   │   ├── types.test.ts
│   │   │   ├── context-fetcher.test.ts
│   │   │   ├── context-assembler.test.ts
│   │   │   ├── session-summarizer.test.ts
│   │   │   └── vector-retriever.test.ts
│   │   ├── prompt/
│   │   │   └── ai-mentor-prompts.test.ts
│   │   ├── services/                          # Algorithm tests
│   │   │   ├── bm25.test.ts
│   │   │   └── keyword-extractor.test.ts
│   │   ├── utils/
│   │   │   └── vector-math.test.ts
│   │   ├── csrf.test.ts                       # TC-019 — CSRF validation
│   │   ├── bot-detection.test.ts
│   │   ├── development-mode.test.ts
│   │   ├── auth-rate-limit.test.ts            # TC-018 — Auth-specific rate limiting
│   │   ├── env-validation.test.ts             # TC-005 — Environment validation
│   │   ├── embedding-generator.test.ts        # TC-043, TC-047 — 384-dim vectors, truncation
│   │   ├── embedding-validator.test.ts        # Vector validation edge cases
│   │   └── prompt-injection.test.ts           # TC-085 — AI prompt injection defense
│   ├── services/                              # Service-level unit tests
│   │   ├── match-generation.test.ts           # TC-051,053,054 — Cosine search, complement, no self-match
│   │   ├── match-scores.test.ts               # TC-052 — Compatibility score (0-100%)
│   │   ├── feed-scorer.test.ts                # TC-058,059 — Thompson Sampling, hybrid scoring
│   │   ├── notification-engine.test.ts        # TC-086,087 — Match notification, priority batching
│   │   └── content-moderator.test.ts          # TC-090,091 — Toxicity scanning
│   ├── api/ (auth.test.ts, posts.test.ts)     # API endpoint tests
│   ├── components/ (streaming-message.test.tsx)
│   ├── sanitize.test.ts                       # TC-020 — XSS sanitization
│   ├── csrf.test.ts                           # TC-019 — CSRF tokens
│   ├── api-response.test.ts
│   ├── format-initials.test.ts
│   ├── onboarding-actions.test.ts
│   ├── onboarding-validation.test.ts
│   └── settings-validation.test.ts            # TC-023 — Zod schema validation
│
├── components/                                # React component rendering tests
│   ├── features/
│   │   ├── auth/
│   │   │   ├── register-form.test.tsx         # TC-011, TC-012 — Signup happy/error paths
│   │   │   └── login-form.test.tsx            # TC-018 — Login rate limit UI
│   │   ├── onboarding/
│   │   │   ├── step-basic-info.test.tsx        # TC-021 — Basic info step
│   │   │   ├── step-skills.test.tsx            # TC-022 — Skills selection
│   │   │   └── step-experience.test.tsx        # TC-024,025 — Work experience & projects
│   │   ├── dashboard/
│   │   │   ├── profile-card.test.tsx           # TC-026,029 — Optimistic updates, public profile
│   │   │   ├── dashboard-animations.test.tsx   # TC-038,039 — GSAP & Framer Motion
│   │   │   └── posts/ (comment-section, post-actions)  # TC-094 — Like & Comment interactions
│   │   ├── matches/
│   │   │   ├── match-card.test.tsx             # TC-057 — Why-matched tags display
│   │   │   ├── match-filters.test.tsx          # TC-055,056 — Role & availability filters
│   │   │   └── why-match-modal.test.tsx        # TC-057 — Match reason breakdown
│   │   ├── messages/
│   │   │   ├── chat-window.test.tsx            # TC-067,072 — Realtime broadcast, Zustand state
│   │   │   ├── message-input.test.tsx          # TC-070,071 — Length limit, emoji support
│   │   │   └── typing-indicator.test.tsx       # TC-069 — Typing indicator UI
│   │   ├── connections/
│   │   │   ├── connection-button.test.tsx      # TC-061 — Send request button
│   │   │   └── connection-request-item.test.tsx # TC-062,063,064 — Request list UI
│   │   ├── ai-mentor/
│   │   │   ├── streaming-message.test.tsx
│   │   │   └── ai-mentor-interface.test.tsx    # TC-076 — Chat interface access
│   │   └── profile/
│   │       └── verification-badge.test.tsx     # TC-027 — Verified Student badge
│   ├── ui/
│   │   ├── globe.test.tsx                      # TC-031,032 — WebGL globe, degradation
│   │   ├── animated-theme-toggler.test.tsx     # TC-033,034 — Dark mode toggle, OS preference
│   │   └── button.test.tsx
│   ├── shared/
│   │   ├── glass-card.test.tsx
│   │   ├── sidebar-nav.test.tsx                # TC-036 — Sidebar collapse
│   │   ├── mobile-nav.test.tsx                 # TC-036 — Mobile navigation
│   │   └── notification-item.test.tsx          # TC-088 — Toast notification rendering
│   ├── error-boundary.test.tsx
│   ├── step-basic-info.test.tsx
│   └── step-skills.test.tsx
│
├── integration/                               # Cross-layer tests (services + DB + hooks)
│   ├── auth/
│   │   ├── session-expiry.test.ts
│   │   └── rls-policies.test.ts               # TC-015,016,017 — RLS enforcement
│   ├── embeddings/
│   │   ├── pipeline.test.ts                    # TC-041→044 — Embedding pipeline
│   │   ├── queue-lifecycle.test.ts             # TC-041,042,044,045 — Queue lifecycle
│   │   ├── worker-failure.test.ts              # TC-045,046,048 — Worker failure, DLQ
│   │   ├── non-blocking.test.ts                # TC-049 — Async non-blocking verification

│   ├── ai-mentor/
│   │   ├── response-validation.test.ts
│   │   ├── chat-session.test.ts                # TC-077,078,081 — Query trigger, context, multi-turn
│   │   ├── mvp-checklist.test.ts               # TC-079 — MVP checklist generation
│   │   ├── lean-canvas.test.ts                 # TC-080 — Lean Canvas model
│   │   ├── session-summarization.test.ts       # TC-082 — Session summary
│   │   └── api-resilience.test.ts              # TC-083 — Rate limits, timeouts, graceful degradation
│   ├── matches/
│   │   └── match-flow.test.ts                  # TC-060 — Suggestions saved, full flow
│   ├── realtime/
│   │   ├── notifications.test.ts
│   │   ├── chat-realtime.test.ts               # TC-065 — WebSocket/Realtime channel on accept
│   │   └── event-processor.test.ts             # TC-074 — Event routing
│   ├── messaging/
│   │   └── chat-pagination.test.ts             # TC-075 — History pagination
│   ├── profile/
│   │   ├── onboarding-flow.test.ts             # TC-021 — Full wizard flow
│   │   ├── crud-operations.test.ts             # TC-022→025,028 — CRUD lifecycle
│   │   ├── optimistic-updates.test.ts          # TC-026 — React Query optimistic updates
│   │   └── cascade-delete.test.ts              # TC-030 — Cascading deletion
│   ├── notifications/
│   │   └── notification-flow.test.ts           # TC-089 — Notifications table insert
│   ├── moderation/
│   │   └── content-scanning.test.ts            # TC-092 — Flagged post quarantine
│   ├── analytics/
│   │   ├── activity-tracking.test.ts           # TC-093 — Session metrics logging
│   │   └── aggregator.test.ts                  # TC-099 — Daily metrics, weekly digests
│   ├── ui/
│   │   ├── responsive-layout.test.ts           # TC-035 — Responsive layout
│   │   ├── keyboard-navigation.test.ts         # TC-037 — Radix UI keyboard a11y
│   │   └── smooth-scroll.test.ts               # TC-040 — Lenis smooth scroll

│   ├── environment/
│   │   ├── dev-server.test.ts                  # TC-004 — Dev server startup
│   │   └── docker-worker.test.ts               # TC-006,007 — Docker worker health
│   ├── seeder/
│   │   └── db-seeder.test.ts                   # TC-008,009,010 — DB seeder CLI
│   └── api.test.ts                             # API integration
│
├── e2e/                                       # Playwright browser tests
│   ├── global-setup.ts                        # Auth state, test user seeding
│   ├── auth-flow.spec.ts                      # Authentication flows
│   ├── critical-flows.spec.ts                 # System health + accessibility
│   ├── onboarding-flow.spec.ts                # Onboarding flow
│   ├── ui-components.spec.ts                  # TC-031,033,035→040 — Visual component tests
│   └── system-health.spec.ts                  # TC-100 — Complete E2E regression
│
└── scripts/                                   # Shell infrastructure tests
    └── env-setup.test.sh                      # TC-001,002,003 — Node 20+, npm 10+, yarn/bun rejection
```

---

## Test Case Map — All 100 TCs

| # | Module | TCs | Files | Tests |
|---|--------|-----|-------|-------|
| 1 | Environment Setup & CLI Testing | TC-001→010 | 5 | 64 |
| 2 | Authentication & Enterprise Security | TC-011→020 | 5 | 35 |
| 3 | User Profiling & Data Management | TC-021→030 | 8 | 114 |
| 4 | UI, 3D Rendering & Accessibility | TC-031→040 | 9 | 75 |
| 5 | AI Vector Embedding & Python Worker | TC-041→050 | 6 | 66 |
| 6 | Semantic Matching & Feed Engine | TC-051→060 | 7 | 50 |
| 7 | Real-Time Networking & Communication | TC-061→075 | 13 | 80 |
| 8 | AI Mentor & LLM Assistant | TC-076→085 | 8 | 136 |
| 9 | Notifications & Content Moderation | TC-086→095 | 8 | 65 |
| 10 | System Integration | TC-096→100 | 3 | 70 |
| **Total** | — | **100** | **73+** | **750+** |

---

## Running Tests

```bash
# Run all unit/component/integration tests
npm run test

# Run with coverage
npm run test -- --coverage

# Run in watch mode
npm run test -- --watch

# Run E2E tests
npm run test:e2e

# Run specific module
npm run test -- --run tests/unit/hooks/
npm run test -- --run tests/integration/auth/
npm run test -- --run tests/components/features/matches/

# Run specific test file
npm run test -- tests/unit/lib/sanitize.test.ts

# Run specific test case by pattern
npm run test -- -t "RLS blocks"
```

---

## Test Patterns

### AAA (Arrange-Act-Assert)
```typescript
test('RLS blocks user from querying another user messages', () => {
  // Arrange
  const ownUserId = 'user-1'
  const otherUserId = 'user-2'
  
  // Act
  const result = rlsFilterMessages(allMessages, ownUserId)
  
  // Assert
  expect(result).toHaveLength(0)
})
```

### Mock Infrastructure
```typescript
// Supabase client (auto-mocked via tests/setup/mocks.ts)
import { mockSupabaseClient } from '@/../tests/setup/mocks'

// Mock data factories
import { createMockUser, createMockPost } from '@/../tests/setup/fixtures'

// Mock supabase response
mockSupabaseClient.single.mockResolvedValue({ data: mockUser, error: null })
mockSupabaseClient.from().insert().single.mockResolvedValue({ data: newPost, error: null })
```

---

## Coverage Targets

| Priority | Target | Areas |
|----------|--------|-------|
| **Critical** | 100% | Auth flows, Match generation, Message delivery, RLS policies |
| **High** | 90%+ | Profile CRUD, Notifications, Embedding pipeline, AI Mentor |
| **Medium** | 80%+ | UI components, Filters, Analytics, Content moderation |
| **Low** | Best effort | Config wrappers, Simple getters, Third-party integrations |

---

**Last Updated:** 2026-05-06  
**Test Runner:** Vitest + Playwright  
**Total Files:** 118  
**Total Test Cases:** 750+  
**Status:** Production Ready ✅
