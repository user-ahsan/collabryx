# Collabryx AI Mentor Implementation Plan

**Generated:** 2026-04-30
**Version:** 1.0
**Status:** Ready for Implementation

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Task Prioritization](#task-prioritization)
4. [Task 1: RAG Context Injection](#task-1-rag-context-injection)
5. [Task 2: MiniMax Provider Integration](#task-2-minimax-provider-integration)
6. [Task 3: Semantic Similarity Fix](#task-3-semantic-similarity-fix)
7. [Task 4: Hybrid Search Implementation](#task-4-hybrid-search-implementation)
8. [Task 5: Streaming UI](#task-5-streaming-ui)
9. [Task 6: Session Summarization](#task-6-session-summarization)

11. [Task 8: Cross-Encoder Re-Ranking](#task-8-cross-encoder-re-ranking)
12. [File Structure](#file-structure)
13. [Gitignore Rules](#gitignore-rules)
14. [Testing Strategy](#testing-strategy)
15. [Dependency Graph](#dependency-graph)

---

## Overview

This document contains the complete implementation plan for enhancing Collabryx's AI Mentor with:
- RAG context injection for personalized responses
- MiniMax API provider integration
- Fixed semantic similarity calculations
- Hybrid search (vector + keyword)
- Streaming UI for AI responses
- Session summarization

- Cross-encoder re-ranking

### Constraints
- Project uses Next.js 16, React 19, TypeScript, Supabase with pgvector (384 dimensions)
- HNSW vector indexing via `find_similar_users()` function
- Multi-provider AI: OpenAI, Anthropic, Qwen/DashScope, Gemini (in native TS provider registry)
- MiniMax API endpoint: `https://api.minimaxi.com/v1` (OpenAI-compatible)

---

## Architecture Diagrams

### Current Broken Flow
```
sendMessage() in ai-mentor.ts
       │
       ▼
1. Fetch session ownership ───────────────────────────────► ✓
       │
       ▼
2. Save user message ───────────────────────────────────────► ✓
       │
       ▼
3. Get conversation history (last 10 msgs) ────────────────► ✓
       │
       ▼
4. Build generic system prompt (NO USER CONTEXT) ◄────── ✗
       │
       ▼
5. Call LLM directly ────────────────────────────────────► ✓
       │
       ▼
6. Save AI response ───────────────────────────────────────► ✓
```

### Target RAG Context Injection Architecture
```
User Message
       │
       ▼
┌────────────────────────────────────────────────────────────────────────────┐
│                    RAG Context Service (NEW)                                │
│  ┌──────────────┐    ┌──────────────────┐    ┌─────────────────────────┐  │
│  │ User Profile │    │ Vector Store      │    │ Session Summarizer      │  │
│  │ Context      │    │ Retriever         │    │ (NEW)                   │  │
│  │ Fetcher      │    │ (HNSW + keyword)   │    │                         │  │
│  └──────────────┘    └──────────────────┘    └─────────────────────────┘  │
│         │                    │                         │                   │
│         ▼                    ▼                         ▼                   │
│  ┌────────────────────────────────────────────────────────────────────┐    │
│  │              Context Fusion Layer                                  │    │
│  │  • Profile data (skills, interests, goals, career_level)             │    │
│  │  • Retrieved context from vector store                             │    │
│  │  • Session summary (last 5 messages condensed)                     │    │
│  │  • Conversation history (last 10 messages)                         │    │
│  └────────────────────────────────────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          ▼
                              ┌─────────────────────┐
                              │   LLM API Call      │
                              │   (OpenAI/Anthropic  │
                              │    /Qwen/MiniMax)    │
                              └─────────────────────┘
```

---

## Task Prioritization

| Priority | Task | Impact | Effort | Risk |
|----------|------|--------|--------|------|
| P0 (Critical) | Task 1: RAG Context Injection | High | High | Medium |
| P0 (Critical) | Task 2: MiniMax Provider | High | Medium | Low |
| P1 (High) | Task 3: Semantic Similarity Fix | High | Low | Low |
| P1 (High) | Task 4: Hybrid Search | High | High | Medium |
| P2 (Medium) | Task 5: Streaming UI | Medium | Medium | Low |
| P2 (Medium) | Task 6: Session Summarization | Medium | Medium | Low |

| P3 (Enhancement) | Task 8: Cross-Encoder Re-Ranking | Medium | High | Medium |

---

## Task 1: RAG Context Injection

**Priority:** P0 Critical
**Estimated Time:** 2-3 days
**Dependencies:** None

### Problem
User profile data is fetched but NOT passed to LLM. Python worker explicitly expects "Reference user's profile context" but Next.js routes don't implement this.

### Files to Create

| File Path | Purpose |
|-----------|---------|
| `lib/rag/types.ts` | TypeScript interfaces for RAG context |
| `lib/rag/context-fetcher.ts` | Fetches user profile context (skills, interests, goals, career_level) |
| `lib/rag/vector-retriever.ts` | Hybrid search (vector + keyword) against profile_embeddings |
| `lib/rag/session-summarizer.ts` | Summarizes long conversations to stay within token limits |
| `lib/rag/context-assembler.ts` | Fusion layer that combines all context sources |
| `lib/prompt/ai-mentor-prompts.ts` | Centralized prompt templates |
| `tests/unit/rag/context-fetcher.test.ts` | Unit tests |
| `tests/unit/rag/vector-retriever.test.ts` | Unit tests |

### Files to Modify

| File | Changes |
|------|---------|
| `lib/actions/ai-mentor.ts` | Inject RAG context into `sendMessage()`, integrate context-assembler |

### Sub-Tasks

1. **Create `lib/rag/types.ts`**
   ```typescript
   export interface UserProfileContext {
     user_id: string
     display_name: string
     headline: string | null
     bio: string | null
     looking_for: string[]
     skills: { skill_name: string; proficiency?: string }[]
     interests: { interest: string }[]
     career_level?: 'student' | 'early-career' | 'mid-career' | 'senior' | 'executive'
     location?: string
   }

   export interface RetrievedContext {
     content: string
     score: number
     source: 'vector' | 'keyword' | 'hybrid'
     metadata?: Record<string, unknown>
   }

   export interface SessionSummary {
     summary_text: string
     action_items: string[]
     skills_identified: string[]
     message_count: number
   }

   export interface RAGContext {
     profile: UserProfileContext
     retrieved_contexts: RetrievedContext[]
     session_summary: SessionSummary | null
     conversation_history: AIMessage[]
     assembled_at: string
   }

   export interface FallbackContext {
     has_profile: boolean
     has_vector_context: boolean
     has_summary: boolean
     warnings: string[]
   }
   ```

2. **Create `lib/rag/context-fetcher.ts`**
   - Fetch profile from `profiles` table
   - Fetch skills from `user_skills` table (primary only, limit 10)
   - Fetch interests from `user_interests` table (limit 10)
   - Infer career level from profile completeness and skills count

3. **Create `lib/rag/vector-retriever.ts`**
   - Generate query embedding via OpenAI
   - HNSW similarity search on `profile_embeddings`
   - Fallback to keyword search via full-text search
   - Return `RetrievedContext[]`

4. **Create `lib/rag/session-summarizer.ts`**
   - Trigger when messages >= 8
   - Use LLM to summarize last 10 messages
   - Extract action_items and skills_identified
   - Return `SessionSummary | null`

5. **Create `lib/rag/context-assembler.ts`**
   - Orchestrate all context sources
   - Build `RAGContext` object
   - Return `{ context, fallback }`

6. **Create `lib/prompt/ai-mentor-prompts.ts`**
   - `buildEnhancedSystemPrompt(context, userMessage)`: Full prompt with context
   - `buildFallbackSystemPrompt()`: Generic prompt for when context unavailable

7. **Modify `lib/actions/ai-mentor.ts`**
   - Import context assembler and prompt builder
   - Call `buildRAGContext()` before LLM call
   - Inject enhanced prompt into messages array

### Error Handling Strategy

```
Full Context → Partial Context → Generic Prompt → Error Response
     │              │              │               │
     ▼              ▼              ▼               ▼
Profile +       Profile only   No context      "Sorry, I'm
Vector +        (skills only) (plain prompt)  having trouble"
Summary                        + history
```

### Testing Approach

| Test Type | Scenario |
|-----------|----------|
| Unit | context-fetcher maps profile to UserProfileContext |
| Unit | vector-retriever generates embeddings, handles errors |
| Unit | session-summarizer parses JSON response |
| Unit | prompt-builder formats context correctly |
| Integration | Full RAG flow: message → context fetch → LLM call → response |
| Integration | Graceful degradation when services fail |
| E2E | Context injection verification |

---

## Task 2: MiniMax Provider Integration

**Priority:** P0 Critical
**Estimated Time:** 1-2 days
**Dependencies:** None

### Problem
No MiniMax API integration currently exists. MiniMax offers 204k token context at lower cost than GPT-4.

### API Details
- Endpoint: `https://api.minimaxi.com/v1` (OpenAI-compatible)
- Model: `MiniMax-M2.7`
- Context: 204k tokens
- Pricing: Cost-effective

### Files to Create

| File Path | Purpose |
|-----------|---------|
| `lib/ai/providers/base.ts` | Interfaces & types for AI providers |
| `lib/ai/providers/registry.ts` | ProviderRegistry with fallback logic |
| `lib/ai/providers/minimax.ts` | MiniMax provider implementation |
| `tests/unit/ai/providers/minimax.test.ts` | Unit tests |

### Files to Modify

| File | Changes |
|------|---------|
| `.env.example` | Add MINIMAX_API_KEY, MINIMAX_BASE_URL, MINIMAX_MODEL |
| `lib/validate-env.ts` | Include MiniMax environment variables |
| `lib/actions/ai-mentor.ts` | Use provider registry instead of inline provider selection |

### Sub-Tasks

1. **Add environment variables to `.env.example`**
   ```bash
   # MiniMax AI (OpenAI-compatible)
   MINIMAX_API_KEY=your-minimax-api-key
   MINIMAX_BASE_URL=https://api.minimaxi.com/v1
   MINIMAX_MODEL=MiniMax-M2.7
   ```

2. **Create `lib/ai/providers/base.ts`**
   ```typescript
   export interface AIProviderConfig {
     name: string
     apiKey?: string
     baseURL?: string
     model: string
     maxTokens: number
     temperature: number
     timeout: number
   }

   export interface AIProviderResponse {
     content: string
     usage?: {
       promptTokens: number
       completionTokens: number
       totalTokens: number
     }
     model: string
     finishReason?: string
   }

   export interface AIProvider {
     readonly config: AIProviderConfig
     chat(messages: Message[], systemPrompt?: string): Promise<AIProviderResponse>
     stream?(messages: Message[], systemPrompt?: string): AsyncGenerator<string>
   }

   export interface Message {
     role: 'system' | 'user' | 'assistant'
     content: string
   }
   ```

3. **Create `lib/ai/providers/minimax.ts`**
   - Implement `MiniMaxProvider` class
   - OpenAI-compatible chat endpoint
   - Streaming support via SSE
   - Error handling for MiniMax-specific error codes
   - Retry logic with exponential backoff

4. **Create `lib/ai/providers/registry.ts`**
   - `ProviderRegistry` class with all providers
   - `register()` method for each provider
   - `getPrimary()` for primary provider (configurable via `LLM_PRIMARY_PROVIDER`)
   - `executeWithFallback()` for automatic failover
   - Per-provider circuit breakers

5. **Update `lib/actions/ai-mentor.ts`**
   - Replace inline provider selection with `providerRegistry.executeWithFallback()`
   - Remove inline circuit breaker (use provider registry's)

### Key Design Decisions

| Aspect | Decision | Rationale |
|--------|----------|-----------|
| **Cost-effective routing** | MiniMax is primary | 204k context at lower cost |
| **Fallback order** | MiniMax → OpenAI → Anthropic → Qwen | Cost optimization before quality |
| **Streaming support** | Generator-based | Memory efficient for long responses |
| **Error handling** | Custom `MiniMaxAPIError` | Specific error codes from MiniMax API |
| **Circuit breaker** | Per-provider isolation | Fail-fast prevents cascade failures |

---

## Task 3: Semantic Similarity Fix

**Priority:** P1 High
**Estimated Time:** 0.5 days
**Dependencies:** None

### Problem
The codebase uses placeholder values (e.g., `0.85` defaults, `0.8` threshold) instead of actual cosine similarity calculations.

### Files to Create

| File Path | Purpose |
|-----------|---------|
| `lib/utils/vector-math.ts` | Cosine similarity utility functions |

### Files to Modify

| File | Changes |
|------|---------|
| `lib/services/match-generator.ts (native, migrated)` | Use actual cosine similarity |
| `lib/services/match-scores.ts` | Replace `0.85` placeholders with real calculations |

### Sub-Tasks

1. **Create `lib/utils/vector-math.ts`**
   ```typescript
   export function cosineSimilarity(a: number[], b: number[]): number {
     if (a.length !== b.length) {
       throw new Error('Vectors must have same dimension')
     }
     const dotProductValue = dotProduct(a, b)
     const magnitudeA = magnitude(a)
     const magnitudeB = magnitude(b)
     if (magnitudeA === 0 || magnitudeB === 0) return 0
     return dotProductValue / (magnitudeA * magnitudeB)
   }

   export function dotProduct(a: number[], b: number[]): number {
     return a.reduce((sum, val, i) => sum + val * b[i], 0)
   }

   export function magnitude(v: number[]): number {
     return Math.sqrt(v.reduce((sum, val) => sum + val * val, 0))
   }

   export function normalizeVector(v: number[]): number[] {
     const mag = magnitude(v)
     if (mag === 0) return v
     return v.map(val => val / mag)
   }
   ```

2. **Update `lib/services/match-generator.ts (native, migrated)`**
   - Import vector-math utilities
   - Calculate actual cosine similarity from stored embeddings
   - Pass actual scores to match scoring

3. **Update `lib/services/match-scores.ts`**
   - Remove placeholder `0.85` defaults (lines 59, 86)
   - Use actual cosine similarity from embeddings

### Testing Approach

```typescript
describe('cosineSimilarity', () => {
  it('returns 1 for identical vectors', () => {
    const v = [1, 2, 3]
    expect(cosineSimilarity(v, v)).toBeCloseTo(1, 5)
  })
  it('returns 0 for orthogonal vectors', () => {
    expect(cosineSimilarity([1, 0], [0, 1])).toBeCloseTo(0, 5)
  })
  it('handles 384-dim profile embeddings', () => {
    const a = Array(384).fill(1)
    const b = Array(384).fill(1)
    expect(cosineSimilarity(a, b)).toBeCloseTo(1, 5)
  })
  it('returns 0 for zero vector', () => {
    expect(cosineSimilarity([0, 0], [1, 1])).toBe(0)
  })
})
```

---

## Task 4: Hybrid Search Implementation

**Priority:** P1 High
**Estimated Time:** 3-4 days
**Dependencies:** Task 3 (cosine similarity basics)

### Problem
Current retrieval uses only vector similarity. Need to combine with keyword/BM25 for better recall.

### Files to Create

| File Path | Purpose |
|-----------|---------|
| `lib/services/hybrid-search.ts` | Hybrid search orchestrator |
| `lib/services/bm25.ts` | BM25 implementation |
| `lib/services/keyword-extractor.ts` | Extract keywords from profiles |

### Files to Modify

| File | Changes |
|------|---------|
| `lib/services/match-generator.ts (native, migrated)` | Add hybrid scoring logic |
| `lib/services/embeddings.ts` | Add keyword extraction |

### Sub-Tasks

1. **Create `lib/services/bm25.ts`**
   - Implement BM25 ranking algorithm
   - Support for document corpus and query

2. **Create `lib/services/keyword-extractor.ts`**
   - Extract keywords from profile fields (role, skills, bio)
   - Limit to top 20 keywords per profile

3. **Create `lib/services/hybrid-search.ts`**
   ```typescript
   interface HybridSearchOptions {
     limit?: number
     alpha?: number  // 0.7 vector / 0.3 keyword default
     threshold?: number
   }

   async function searchProfiles(
     query: string,
     userId: string,
     options: HybridSearchOptions = {}
   ): Promise<SearchResult[]>
   ```

4. **Add `combineScores(vectorScore: number, keywordScore: number, alpha: number)`**
   - Configurable alpha parameter
   - Default: 0.7 vector / 0.3 keyword

5. **Add Supabase full-text search as fallback**
   - Use `to_tsvector` and `to_tsquery` for PostgreSQL full-text

6. **Add RLS policies for search results**
   - Users can only see allowed profiles

7. **Add search result caching**
   - Cache combined scores with TTL

### Testing Approach

```typescript
describe('HybridSearch', () => {
  it('combines vector and keyword scores', async () => {
    const result = await hybridSearch.search('React developer', { limit: 10 })
    expect(result.scores).toHaveLength(10)
    result.scores.forEach(s => {
      expect(s.vectorScore).toBeDefined()
      expect(s.keywordScore).toBeDefined()
      expect(s.combinedScore).toBeGreaterThan(0)
    })
  })
  it('falls back to vector-only when no keywords match', async () => {
    // Test with gibberish query
  })
})
```

---

## Task 5: Streaming UI

**Priority:** P2 Medium
**Estimated Time:** 2-3 days
**Dependencies:** None (can parallel with others)

### Problem
AI mentor responses are currently non-streaming. Users need progressive display.

### Files to Create

| File Path | Purpose |
|-----------|---------|
| `hooks/use-ai-stream.ts` | Streaming response hook |
| `components/features/ai/streaming-message.tsx` | Streaming message UI |
| `app/api/ai-mentor/stream/route.ts` | SSE endpoint |

### Files to Modify

| File | Changes |
|------|---------|
| `lib/actions/ai-mentor.ts` | Add streaming support |
| `app/api/ai-mentor/message/route.ts` | SSE endpoint |
| `hooks/use-ai-chat.ts` | New hook for streaming state |
| `app/(auth)/assistant/page.tsx` | Add streaming UI components |

### Sub-Tasks

1. **Create `app/api/ai-mentor/stream/route.ts`**
   ```typescript
   export async function GET(request: Request) {
     const encoder = new TextEncoder()
     const stream = new ReadableStream({
       async start(controller) {
         // Stream tokens as they arrive
         for (const token of responseTokens) {
           controller.enqueue(encoder.encode(`data: ${token}\n\n`))
         }
         controller.enqueue(encoder.encode('data: [DONE]\n\n'))
       }
     })
     return new Response(stream, {
       headers: {
         'Content-Type': 'text/event-stream',
         'Cache-Control': 'no-cache',
         'Connection': 'keep-alive',
       }
     })
   }
   ```

2. **Create `hooks/use-ai-stream.ts`**
   - Handle stream lifecycle: connect, receive, complete, error
   - Use AbortController for cleanup
   - Auto-reconnect with exponential backoff

3. **Create `components/features/ai/streaming-message.tsx`**
   - Typewriter effect for streaming text
   - Loading dots animation during streaming
   - Markdown rendering as content arrives

4. **Add Supabase Realtime subscription for real-time sync**

5. **Handle reconnection logic for dropped connections**

6. **Add message buffering for smooth rendering**

### Testing Approach

```typescript
describe('useAIStream', () => {
  it('streams tokens as they arrive', async () => {
    const { tokens, complete } = renderUseAIStream()
    act(() => { tokens.emit('Hello') })
    act(() => { tokens.emit(' World') })
    act(() => { complete() })
    expect(screen.getByText('Hello World')).toBeInTheDocument()
  })
})
```

---

## Task 6: Session Summarization

**Priority:** P2 Medium
**Estimated Time:** 2-3 days
**Dependencies:** None (can parallel with others)

### Problem
Long conversations grow unbounded. Need summarization to compress history while preserving key information.

### Files to Create

| File Path | Purpose |
|-----------|---------|
| `lib/services/summarizer.ts` | Summarization service |
| `lib/prompts/summarize-conversation.md` | System prompt for summarization |
| `components/features/ai/summarize-button.tsx` | UI trigger |

### Files to Modify

| File | Changes |
|------|---------|
| `lib/actions/ai-mentor.ts` | Add summarization logic |
| `app/api/ai-mentor/summarize/route.ts` | New API route |
| Database migration | Add `summary` column to `ai_mentor_sessions` |

### Sub-Tasks

1. **Create `lib/services/summarizer.ts`**
   - Trigger conditions:
     - Session exceeds 20 messages
     - Token count exceeds 4000
     - User explicitly requests
   - Extract key sentences (extractive)
   - LLM abstractive summarization

2. **Create `lib/prompts/summarize-conversation.md`**
   ```markdown
   Summarize this conversation concisely for context injection.
   Return JSON: { "summary": "...", "action_items": ["..."], "skills": ["..."] }
   ```

3. **Add `POST /api/ai-mentor/summarize` endpoint**

4. **Store summary in `ai_mentor_sessions.summary` column**

5. **Update message retrieval to include summarized context**

6. **Create `components/features/ai/summarize-button.tsx`**
   - Confirmation dialog before summarization
   - Undo capability (keep original messages for 24h)

### Testing Approach

```typescript
describe('Summarizer', () => {
  it('triggers when session exceeds 20 messages', () => {
    const shouldSummarize = shouldTriggerSummarization(mockSession(21))
    expect(shouldSummarize).toBe(true)
  })
  it('extracts key sentences from conversation', async () => {
    const summary = await extractSummary(mockLongConversation())
    expect(summary.length).toBeLessThan(500)
  })
})
```

---



## Task 8: Cross-Encoder Re-Ranking

**Priority:** P3 Enhancement
**Estimated Time:** 3-4 days
**Dependencies:** Task 1, Task 2, Task 4

### Problem
Initial retrieval returns candidates by approximate similarity. Cross-encoder re-ranking improves precision.

### Files to Create

| File Path | Purpose |
|-----------|---------|
| `lib/services/cross-encoder.ts` | Cross-encoder wrapper |
| `lib/services/retrieval-pipeline.ts` | Retrieval → Re-rank pipeline |
| `lib/config/cross-encoder-models.ts` | Model configuration |

### Files to Modify

| File | Changes |
|------|---------|
| `lib/services/match-generator.ts (native, migrated)` | Integrate re-ranker |

### Sub-Tasks

1. **Create `lib/services/cross-encoder.ts`**
   ```typescript
   async function rerank(
     candidates: Candidate[],
     query: string
   ): Promise<RerankedCandidate[]>
   ```

2. **Create `lib/services/retrieval-pipeline.ts`**
   ```
   Initial Retrieval (vector/keyword) → Top-K candidates → Cross-encoder rerank → Top-N final
   ```

3. **Add model loading**
   - Use Python worker
   - Handle model warm-up on first request

4. **Configure re-ranking parameters**
   - `topK`: initial retrieval count (50)
   - `topN`: final returned count (10)
   - `scoreThreshold`: minimum score to include

5. **Add batch processing for efficiency**

6. **Add caching for re-ranked results**
   - Profile changes invalidate cache

### Testing Approach

```typescript
describe('CrossEncoderReranker', () => {
  it('re-ranks candidates by precise similarity', async () => {
    const candidates = [
      { id: '1', vector: [...], score: 0.9 },
      { id: '2', vector: [...], score: 0.85 }
    ]
    const reranked = await reranker.rerank(candidates, 'React developer')
    expect(reranked[0].id).toBe('2') // Re-ranked order differs
  })
})
```

---

## File Structure

```
lib/
├── rag/
│   ├── types.ts                          # NEW
│   ├── context-fetcher.ts                # NEW
│   ├── vector-retriever.ts               # NEW
│   ├── session-summarizer.ts              # NEW
│   └── context-assembler.ts               # NEW
├── ai/
│   ├── providers/
│   │   ├── base.ts                       # NEW
│   │   ├── registry.ts                    # NEW
│   │   ├── minimax.ts                    # NEW
│   │   ├── openai.ts                     # NEW (refactored)
│   │   ├── anthropic.ts                  # NEW (refactored)
│   │   └── qwen.ts                       # NEW (refactored)
│   └── errors.ts                         # NEW
├── prompt/
│   └── ai-mentor-prompts.ts              # NEW
├── services/
│   ├── hybrid-search.ts                  # NEW
│   ├── bm25.ts                           # NEW
│   ├── keyword-extractor.ts              # NEW
│   ├── cross-encoder.ts                  # NEW
│   ├── retrieval-pipeline.ts             # NEW
│   ├── match-generation.ts               # MODIFY
│   └── match-scores.ts                   # MODIFY

├── utils/
│   └── vector-math.ts                    # NEW
├── actions/
│   └── ai-mentor.ts                      # MODIFY
├── rate-limit.ts                          # MODIFY

tests/
├── unit/
│   ├── rag/
│   │   ├── context-fetcher.test.ts        # NEW
│   │   ├── vector-retriever.test.ts      # NEW
│   │   └── session-summarizer.test.ts     # NEW
│   ├── ai/
│   │   └── providers/
│   │       └── minimax.test.ts          # NEW
│   ├── services/
│   │   ├── hybrid-search.test.ts         # NEW
│   │   ├── bm25.test.ts                  # NEW
│   │   └── cross-encoder.test.ts        # NEW
│   ├── utils/
│   │   └── vector-math.test.ts           # NEW
└── integration/
    └── rag/
        └── full-rag-flow.test.ts         # NEW

components/
└── features/
    └── ai/
        ├── streaming-message.tsx         # NEW
        ├── summarize-button.tsx          # NEW

hooks/
└── use-ai-stream.ts                     # NEW

supabase/
└── migrations/
    └── 0046_add_ai_mentor_session_summary.sql  # NEW

app/
├── (auth)/
│   └── assistant/
│       └── page.tsx                     # MODIFY (add streaming UI)
└── api/
    ├── ai-mentor/
    │   ├── message/
    │   │   └── route.ts                  # MODIFY (add streaming)
    │   ├── stream/
    │   │   └── route.ts                 # NEW
    │   └── summarize/
    │       └── route.ts                 # NEW
    └── matches/
        └── generate/
            └── route.ts                 # MODIFY (hybrid search, re-ranking)
```

---

## Gitignore Rules

The following files contain sensitive information and should NEVER be committed to git:

```gitignore
# Environment files - NEVER COMMIT
.env
.env.local
.env.*.local
.env.production
.env.production.local
*.env
!.env.example

# API Keys and Secrets
*.pem
*.key
*.crt
secrets/
credentials/
**/secrets/**
**/credentials/**

# MiniMax Configuration
MINIMAX_API_KEY=*
MINIMAX_BASE_URL=*
MINIMAX_MODEL=*

# Database connection strings with passwords
*connection-string*
*database-url*

# Local development files
*.local.yaml
*.local.json
.local/
.local-*

# Python worker credentials
python-worker/.env
python-worker/secrets/
python-worker/*.pem

# Temporary files
*.tmp
*.temp
*.bak
*~

# IDE specific
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Build artifacts
dist/
build/
.next/
out/

# Cache directories
.cache/
.npm/
.yarn/

# Test coverage
coverage/
.nyc_output/

# Logs
*.log
logs/
```

**Important:** The file `.env.example` should be committed with all required environment variables listed but with placeholder values:

```bash
# .env.example - SAFE TO COMMIT
# Copy this file to .env and fill in your actual values

# AI Providers
OPENAI_API_KEY=your-openai-api-key-here
ANTHROPIC_API_KEY=your-anthropic-api-key-here
DASHSCOPE_API_KEY=your-dashscope-api-key-here

# MiniMax AI (OpenAI-compatible)
MINIMAX_API_KEY=your-minimax-api-key-here
MINIMAX_BASE_URL=https://api.minimaxi.com/v1
MINIMAX_MODEL=MiniMax-M2.7

# Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here


```

---

## Testing Strategy

### Test Pyramid

```
                         E2E Tests
          ┌─────────────────────────────────────┐
          │ Full RAG flow: message → context     │
          │ fetch → LLM call → response          │
          │ Graceful degradation when services fail│
          └─────────────────────────────────────┘
                         Integration Tests
          ┌─────────────────────────────────────┐
          │ context-assembler combines sources  │
          │ Vector retriever handles empty results│
          │ Session summarizer triggers at threshold│
          │ Fallback chain works correctly      │
          └─────────────────────────────────────┘
                         Unit Tests
          ┌─────────────────────────────────────┐
          │ context-fetcher: maps profile       │
          │ vector-retriever: embeddings        │
          │ session-summarizer: JSON parse       │
          │ prompt-builder: format context      │
          │ vector-math: cosine similarity     │
          │ bm25: ranking algorithm             │
          │ cross-encoder: re-ranking           │
          └─────────────────────────────────────┘
```

### Key Test Scenarios

| Scenario | Test Type | Description |
|----------|-----------|-------------|
| User with full profile → context fully injected | E2E | Verify all context fields in prompt |
| User with minimal profile → graceful fallback | Integration | Only skills present, no vector context |
| Vector store unavailable → keyword search fallback | Integration | Force error in vector retrieval |
| Session > 10 messages → automatic summarization | Integration | Verify summary in context |
| LLM call fails → error handling | Integration | Verify graceful error message |
| Provider fallback → MiniMax → OpenAI | Integration | Test circuit breaker tripping |
| Rate limit exceeded → 429 response | Integration | Rapid fire requests |
| Streaming token-by-token | E2E | Verify typewriter effect |

---

## Dependency Graph

```
                        ┌─────────────────────┐
                        │  Task 1: RAG Context │
                        │  Injection           │
                        └─────────┬───────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          ▼                       ▼                       ▼
  │ Task 3: Cosine│       │ Task 2: MiniMax│
  │ Similarity    │       │ Provider      │
          │                       │                       │
          └───────────┬───────────┘                       │
                      ▼                                   │
              ┌───────────────┐                           │
              │ Task 4: Hybrid│                           │
              │ Search        │                           │
              │               │                           │
              └───────┬───────┘                           │
                      │                                   │
                      ▼                                   │
              ┌───────────────┐       ┌───────────────┐
              │ Task 8: Cross │       │ Task 6: Session│
              │ Encoder       │       │ Summarization │
              │ Re-ranking    │       │ (parallel)     │
              │               │       │               │
              └───────┬───────┘       └───────────────┘
                      │                       │
                      └───────┬───────────────┘
                              ▼
                      ┌───────────────┐
                      │ Task 5:       │
                      │ Streaming UI │
                      │ (can parallel)│
                      └───────────────┘
```

### Critical Path (Must Be Done First)

1. **Task 1: RAG Context Injection** - All personalization depends on this
2. **Task 3: Cosine Similarity Fix** - All vector operations depend on this
3. **Task 4: Hybrid Search** - Re-ranking needs hybrid search for initial retrieval

### Recommended Execution Order

| Week | Tasks |
|------|-------|
| Week 1 | Task 1 + Task 3 (parallel) |
| Week 2 | Task 2 + Task 5 (parallel) |
| Week 3 | Task 4 + Task 6 (after Task 3) |
| Week 4 | Task 7 + Task 8 (after Task 4) |

---

## Summary Statistics

| Metric | Value |
|--------|-------|
| Total Tasks | 8 |
| Total Sub-tasks | ~90 |
| New Files to Create | 25+ |
| Files to Modify | 12 |
| Critical Path Tasks | 3 |
| Fully Parallelizable | 2 (Task 5, Task 7) |
| Estimated Duration | 6-8 weeks (1 developer) |

---

**Document Generated:** 2026-04-30
**Version:** 1.0
**Status:** Ready for Implementation