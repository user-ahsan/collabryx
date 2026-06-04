# AI Mentor System — Current Architecture

**Last Updated:** 2026-06-03  
**Status:** ✅ Up-to-date (v2 — supersedes Phase 1 spec)

---

## Overview

The AI Mentor is a streaming AI assistant that helps users refine startup ideas, get career advice, and collaborate with other platform users. It uses a **multi-provider AI architecture** with **RAG context injection** and **database-backed session persistence**.

---

## Architecture

```
User Request → API Route → RAG Context Fetcher → Provider Registry → Streamed Response
                                   ↓
                          PostgreSQL (sessions, profiles, embeddings)
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| API Route | `app/api/ai-mentor/message/route.ts` | Handles mentor message requests |
| AI Stream | `app/api/ai/stream/route.ts` | Generic streaming endpoint |
| AI Chat | `app/api/ai/chat/route.ts` | Non-streaming chat endpoint |
| Provider Registry | `lib/ai/providers/registry.ts` | Multi-provider with failover |
| RAG Context Fetcher | `lib/rag/context-fetcher.ts` | Fetches user context for prompts |
| Context Assembler | `lib/rag/context-assembler.ts` | Assembles context into prompts |
| Session Summarizer | `lib/rag/session-summarizer.ts` | Summarizes past sessions |
| Vector Retriever | `lib/rag/vector-retriever.ts` | Semantic memory retrieval |
| Use AI Stream Hook | `hooks/use-ai-stream.ts` | Frontend streaming hook |
| AI Mentor UI | `components/features/ai-mentor/` | Chat interface components |

---

## Database Schema

The AI Mentor uses two database tables:

### `ai_mentor_sessions`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Session identifier |
| `user_id` | UUID (FK → profiles) | Session owner |
| `title` | TEXT | Auto-generated session title |
| `summary` | TEXT | Optional session summary |
| `metadata` | JSONB | Session metadata |
| `created_at` | TIMESTAMPTZ | Creation timestamp |
| `updated_at` | TIMESTAMPTZ | Last update timestamp |

### `ai_mentor_messages`
| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID (PK) | Message identifier |
| `session_id` | UUID (FK → sessions) | Parent session |
| `role` | TEXT | 'user' or 'assistant' |
| `content` | TEXT | Message content |
| `metadata` | JSONB | Message metadata (token counts, provider info) |
| `created_at` | TIMESTAMPTZ | Creation timestamp |

---

## AI Provider System

The AI Mentor uses the **Universal AI Provider System** with priority-based failover:

### Available Providers

| Provider | Type | Class |
|----------|------|-------|
| OpenAI | OpenAI-compatible | `OpenAICompatibleProvider` |
| Anthropic | Native | `AnthropicNativeProvider` |
| Groq | OpenAI-compatible | `OpenAICompatibleProvider` |
| Together | OpenAI-compatible | `OpenAICompatibleProvider` |
| Ollama | OpenAI-compatible | `OpenAICompatibleProvider` |
| MiniMax | OpenAI-compatible | `MiniMaxProvider` |
| OpenRouter | OpenAI-compatible | `OpenAICompatibleProvider` |

### Failover Logic

```typescript
// Providers registered with priority (lower = higher priority)
{
  name: 'openai',
  priority: 1,
  model: 'gpt-4o-mini'
}
```

If the primary provider fails (timeout, network error), the system automatically tries the next available provider in priority order. All providers are exhausted before returning an error.

---

## RAG Pipeline

The RAG pipeline enriches AI responses with user-specific context:

1. **Context Fetching**: `context-fetcher.ts` loads user profile, skills, interests, and startup data
2. **Vector Retrieval**: `vector-retriever.ts` queries similar user embeddings for collaboration matching
3. **Context Assembly**: `context-assembler.ts` combines all context into a structured system prompt
4. **Session Summarization**: `session-summarizer.ts` condenses long sessions for context window management

### Context Types

| Type | Description |
|------|-------------|
| `BaseRAGContext` | Single user profile context |
| `ExtendedRAGContext` | Profile + startup + multi-user data |
| `StartupContext` | Startup idea, stage, industry, needs |
| `MultiUserContext` | Multiple user profiles for collaboration |

---

## Streaming Implementation

The streaming endpoint (`POST /api/ai/stream`) returns a `ReadableStream`:

```typescript
// Frontend hook
const { stream, isLoading, error } = useAIStream();

await stream('message text', {
  sessionId: 'uuid',
  onToken: (token) => console.log(token),
  onComplete: () => console.log('done'),
});
```

---

## Environment Variables

The AI system is configured via the universal provider vars:

```env
AI_PROVIDER_1_NAME=openai
AI_PROVIDER_1_API_KEY=sk-...
AI_PROVIDER_1_MODEL=gpt-4o-mini
AI_PROVIDER_1_PRIORITY=1

# Legacy keys still supported:
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```

See [Environment Variables](../../07-reference/environment-variables.md) for full details.

---

## Related Documentation

- [Vector Embeddings Overview](../vector-embeddings/overview.md)
- [API Reference](../api-reference.md)
- [RAG Pipeline](../../02-architecture/overview.md)
- [Implementation Plan](../../IMPLEMENTATION_PLAN.md)

---

## 📜 Historical Note

This document replaces the **Phase 1 Technical Specification** which documented the original prototype architecture using OpenAI `text-embedding-3-small` (1536 dimensions), Supabase Edge Functions for embeddings, `connection_requests` as a standalone table, and `assistant_threads`/`assistant_messages` tables. Those have all been superseded by the current v2 architecture described above.
