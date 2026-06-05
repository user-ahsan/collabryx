# 📡 Behavioral & Event-Driven Communication Diagrams

> **Last Updated:** 2026-06-05  
> **Scope:** Real-time synchronization, rendering timelines, and cron-driven maintenance.

---

## Table of Contents

1. [Real-Time Realtime Sync Sequence](#1-real-time-realtime-sync-sequence)
2. [Next.js Hybrid Rendering & Hydration Timeline](#2-nextjs-hybrid-rendering--hydration-timeline)
3. [Temporal Cleanup Cron Trigger](#3-temporal-cleanup-cron-trigger)

---

## 1. Real-Time Realtime Sync Sequence

Collabryx uses **Supabase Realtime** — a Change Data Capture (CDC) system built on PostgreSQL replication slots — to synchronize state across clients without a custom WebSocket server. This sequence diagram captures the handshake and persistent data loop between the client UI, Supabase Realtime engine, and backend tables for instant chat messages and live application notifications.

```mermaid
sequenceDiagram
    participant UA as User A (Sender)
    participant ClientA as Client A (Next.js)
    participant ClientB as Client B (Receiver)
    participant API as Next.js API Route
    participant DB as PostgreSQL (messages table)
    participant RL as Realtime Engine (CDC)
    participant Notif as notifications table

    Note over ClientA,ClientB: Step 1: Channel Subscription Setup
    ClientA->>DB: Subscribe to channel: messages:conversation_id=X
    ClientB->>DB: Subscribe to channel: messages:conversation_id=X
    DB->>RL: Register subscriptions (PostgreSQL replication slot)
    RL-->>ClientA: Subscription confirmed ✓
    RL-->>ClientB: Subscription confirmed ✓

    Note over UA,ClientB: Step 2: Message Send Flow
    UA->>ClientA: Types and sends message
    ClientA->>ClientA: Optimistic update: insert message into local cache<br/>(React Query setQueryData)
    ClientA-->>UA: Message appears immediately in UI (no loading)

    ClientA->>API: POST /api/chat/send<br/>{ conversation_id, content, receiver_id }
    API->>API: Validate with Zod
    API->>API: Check auth + conversation membership
    API->>DB: INSERT INTO messages<br/>(sender_id, conversation_id, content)

    DB->>RL: Detect INSERT via WAL (Write-Ahead Log)
    RL->>ClientA: Broadcast: INSERT event<br/>{ conversation_id, message_id, sender_id }
    RL->>ClientB: Broadcast: INSERT event<br/>{ conversation_id, message_id, sender_id }

    ClientA->>ClientA: Reconcile: replace optimistic message with server-confirmed
    ClientB->>ClientB: Append new message to local cache

    ClientB--->UB: "New message from User A" notification

    Note over ClientB,Notif: Step 3: Notification Side-Effect
    API->>Notif: INSERT INTO notifications<br/>{ user_id: receiver_id, type: 'new_message',<br/>  data: { sender_name, preview_text } }
    DB->>RL: Detect INSERT on notifications
    RL->>ClientB: Broadcast notification event
    ClientB->>ClientB: Show notification bell badge + toast

    Note over UA,ClientB: Step 4: Read Receipt (Typing Indicator)
    ClientB->>DB: Subscribe to channel: typing:conversation_id=X
    ClientA->>DB: Broadcast: { type: "typing", user_id: A, conversation_id: X }
    DB->>RL: Propagate typing broadcast
    RL->>ClientB: Receive typing event
    ClientB--->UB: Show "User A is typing..."

    Note over UA,ClientB: Step 5: Read Receipt
    ClientB->>DB: UPDATE messages SET read_at = now()<br/>WHERE conversation_id = X AND sender_id = A
    DB->>RL: Detect UPDATE via WAL
    RL->>ClientA: Broadcast: read_receipt event
    ClientA->>ClientA: Mark messages as read (double-check icons)
```

### Realtime Architecture

Collabryx does **not** run a custom WebSocket server. Instead, it leverages Supabase Realtime, which works by opening PostgreSQL **replication slots** that stream WAL (Write-Ahead Log) changes to connected clients. When a client calls `supabase.channel('messages:conversation_id=X').subscribe()`, it creates a PostgreSQL publication filter that only delivers events for rows matching the filter criteria.

This architecture eliminates the need for Socket.io or any custom WebSocket infrastructure. The client library handles reconnection, backpressure, and event deduplication automatically. Messages are delivered with **at-least-once** semantics via the PostgreSQL replication log.

The flow is entirely REST-based at the write path (the `POST /api/chat/send` endpoint validates with Zod, checks conversation membership, and inserts into the database) and CDC-based at the read path (Realtime streams the INSERT event to all subscribers). This dual approach ensures data consistency (writes are validated and transactional) while maintaining sub-200ms delivery latency.

### Optimistic Updates

The frontend performs an **optimistic update** via React Query's `setQueryData` before the API call completes. The message appears instantly in the UI. When the Realtime broadcast arrives with the server-confirmed message (including the actual `id` and `created_at`), React Query reconciles the cache, replacing the temporary optimistic message with the canonical server record. If the API call fails, the optimistic update is rolled back and the user sees an error toast.

---

## 2. Next.js Hybrid Rendering & Hydration Timeline

Collabryx uses Next.js 16's App Router to combine server-side rendering (Server Components) with client-side hydration (Client Components). This timeline shows the chronological breakdown of how a page like the Dashboard is assembled.

```mermaid
sequenceDiagram
    participant User as User Browser
    participant Edge as Vercel Edge Network
    participant RSC as Server Components (RSC)
    participant CC as Client Components
    participant DB as Supabase PostgreSQL
    participant Worker as Python Worker
    participant Cache as React Query Cache

    Note over User,Cache: 🏁 Page Load Timeline

    rect rgb(200, 230, 255)
        Note over User,Cache: Phase 1: Server-Side Rendering (SSR) — 0ms to ~200ms
        User->>Edge: GET /dashboard
        Edge->>RSC: Request routed to serverless function
        RSC->>DB: Direct query: SELECT * FROM profiles WHERE id = X<br/>(Using @/lib/supabase/server)
        DB-->>RSC: Profile data returned (no loading state needed)
        RSC->>DB: Query: SELECT * FROM posts ORDER BY created_at DESC LIMIT 20
        DB-->>RSC: Posts + author data
        RSC->>RSC: Render HTML: stats cards, feed skeleton
        RSC-->>Edge: Stream HTML + RSC Payload
        Edge-->>User: Deliver initial HTML (fast TTFB)
    end

    rect rgb(255, 235, 200)
        Note over User,Cache: Phase 2: First Paint — ~200ms to ~500ms
        User->>User: Browser paints Server HTML
        Note over User: User sees: navigation bar, stat cards,<br/>post feed with content, avatar images

        rect rgb(220, 255, 220)
            Note over User,Cache: Phase 2a: Suspense Boundaries
            RSC-->>User: <Suspense fallback={Skeleton}>
            User->>User: Shows loading skeleton for slow sections<br/>(e.g., AI mentor widget, 3D globe)
        end
    end

    rect rgb(230, 230, 255)
        Note over User,Cache: Phase 3: Hydration — ~500ms to ~1000ms
        User->>Edge: Request JS bundles (chunked by route)
        Edge-->>User: Stream JS chunks (code splitting)
        User->>CC: React 19 hydrateRoot() — hydrates client components
        CC->>CC: "use client" components mount:
        Note over CC: • Sidebar toggle (Zustand state)<br/>• Notification bell (Realtime subscription)<br/>• Post reaction buttons (onClick handlers)<br/>• Connection request buttons

        CC->>Cache: useQuery(['feed']) — check cache
        Cache-->>CC: Cache miss (first load)
        CC->>DB: useQuery fetch — SELECT from posts with React Query
        DB-->>CC: Fresh data
        CC->>CC: Re-render with fresh data
    end

    rect rgb(255, 220, 220)
        Note over User,Cache: Phase 4: Client-Side Interactions — ~1000ms+
        User->>CC: Click "Like" on post
        CC->>CC: Optimistic update: increment like count
        CC->>API: POST /api/posts/react
        API->>DB: INSERT INTO post_reactions
        DB-->>API: Success
        API-->>CC: Confirm
        CC->>CC: Reconcile optimistic update

        User->>CC: Open AI Mentor chat
        CC->>API: POST /api/ai/chat (streaming)
        API->>DB: Fetch conversation history
        API->>RAG: Assemble context + profile
        RAG-->>API: RAGContext object
        API->>AI: ProviderRegistry.chatWithFallback()
        AI-->>API: Stream tokens via SSE
        API-->>CC: text/event-stream
        CC->>CC: Render streaming tokens in real-time

        User->>CC: Scroll feed
        CC->>DB: useInfiniteQuery — fetch next cursor page
        DB-->>CC: Next 10 posts
        CC->>CC: Append to feed (infinite scroll)
    end
```

### Rendering Strategy Breakdown

**Phase 1 (SSR, 0-200ms)**: Server Components execute on Vercel's serverless functions. They use the server Supabase client (`createClient()` from `@/lib/supabase/server`) to query the database directly — no API call overhead. The results are serialized into the RSC Payload (a special format that encodes React Server Component output) and streamed to the client alongside static HTML. This phase determines **Time to First Byte (TTFB)**, which is typically under 200ms because Vercel's edge infrastructure is geo-distributed.

**Phase 2 (First Paint, 200-500ms)**: The browser renders the server-generated HTML immediately. The user sees a fully populated dashboard with stat cards, post feed content, and avatars — all rendered server-side. **Suspense boundaries** wrap slower sections (the AI mentor widget, the 3D Three.js globe), showing loading skeletons while their data or bundles arrive.

**Phase 3 (Hydration, 500-1000ms)**: JavaScript bundles arrive (automatically code-split by route via Next.js 16's bundler). React 19's `hydrateRoot()` attaches event listeners and state to pre-rendered DOM nodes, converting static HTML into interactive React components. Client Components (`"use client"` directives) mount at their lowest-possible leaf nodes: sidebar toggles, notification bells, reaction buttons. React Query hydrates its cache from server-dehydrated data, then re-fetches in the background to ensure freshness.

**Phase 4 (Interactions, 1000ms+)**: All subsequent interactions happen purely on the client. Clicks trigger optimistic React Query mutations. AI Mentor chats use streaming SSE. Infinite scroll fetches cursor-paginated data. The Realtime subscription updates the notification badge and chat messages in real-time without user action.

---

## 3. Temporal Cleanup Cron Trigger

Database maintenance operations run on PostgreSQL's built-in scheduling capabilities. This diagram shows how the `cleanup_old_match_suggestions` function and the `/api/notifications/cleanup` endpoint manage data retention without user-facing latency impact.

```mermaid
sequenceDiagram
    participant Cron as PostgreSQL Scheduler<br/>(pg_cron or custom trigger)
    participant Func as "cleanup_old_match_suggestions()<br/>(SECURITY DEFINER)"
    participant MatchDB as match_suggestions table
    participant ScoreDB as match_scores table
    participant NotifAPI as POST /api/notifications/cleanup
    participant NotifEngine as cleanupExpiredNotifications()
    participant NotifDB as notifications table
    participant Admin as Admin Dashboard

    Note over Cron,NotifDB: 🕐 Scheduled Maintenance (Runs automatically)

    Loop Every 24 hours (or configured interval)
        Cron->>Func: CALL cleanup_old_match_suggestions(30)

        Func->>MatchDB: DELETE FROM match_suggestions<br/>WHERE created_at < NOW() - INTERVAL '30 days'
        MatchDB-->>Func: Deleted rows count

        Func->>ScoreDB: DELETE FROM match_scores<br/>WHERE suggestion_id IN (deleted_ids)
        ScoreDB-->>Func: Cascade deleted
        Func-->>Cron: Complete — X rows purged
    End

    Note over Cron,NotifDB: 🔄 On-Demand Cleanup (Admin-triggered or by cron-like schedule)

    alt Admin Triggers Via UI
        Admin->>NotifAPI: POST /api/notifications/cleanup<br/>{ older_than_days: 30, batch_size: 500 }

        NotifAPI->>NotifAPI: Validate CSRF token
        NotifAPI->>NotifAPI: Check admin role (supabase.rpc('is_admin'))
        NotifAPI->>NotifAPI: rateLimit('notification-cleanup', 10, 3600)
        NotifAPI->>NotifEngine: cleanupExpiredNotifications({<br/>  olderThanDays: 30,<br/>  batchSize: 500,<br/>  dryRun: false<br/>})

        NotifEngine->>NotifDB: SELECT id FROM notifications<br/>WHERE created_at < NOW() - INTERVAL '30 days'<br/>LIMIT 500

        loop Batch delete (max 500 per run)
            NotifEngine->>NotifDB: DELETE FROM notifications<br/>WHERE id IN (selected_ids)
            NotifDB-->>NotifEngine: Deleted rows
            NotifEngine->>NotifEngine: Increment deleted count
        end

        NotifEngine-->>NotifAPI: { notificationsDeleted: N, notificationsArchived: 0, errors: [] }
        NotifAPI-->>Admin: { success: true, result: CleanupResult }
    end

    Note over NotifDB: 📊 Feed Score Cleanup (Inline)

    loop After each feed scoring run
        Note over ScoreDB: cleanupExpiredFeedScores()<br/>Deletes feed_scores older than 24h<br/>Ensures feed freshness
        ScoreDB->>ScoreDB: DELETE FROM feed_scores<br/>WHERE expires_at < NOW()
    end
```

### Cleanup Strategy

Collabryx employs three data retention mechanisms across different concerns:

1. **Match Suggestions** — The `cleanup_old_match_suggestions()` PostgreSQL function (SECURITY DEFINER) deletes all match suggestions older than 30 days. It cascades to `match_scores` rows. This is designed to be called by a scheduler (pg_cron or an external cron trigger), though the actual cron orchestration is environment-specific — Vercel's cron jobs, Supabase's database webhooks, or an external service like cron-job.org.

2. **Notifications** — The `/api/notifications/cleanup` endpoint is admin-only, protected by CSRF validation, admin role check (`is_admin` RPC), and rate limiting (10 requests per 3600 seconds). It calls `cleanupExpiredNotifications()` from `@/lib/services/notification-engine.ts`, which batch-deletes notifications older than the specified threshold (default 30 days, batch size 500). A `dry_run` option allows previewing the impact before executing.

3. **Feed Scores** — The `cleanupExpiredFeedScores()` function in `feed-scorer.ts` runs inline after each feed scoring batch, deleting rows where `expires_at` has passed (24-hour TTL). This keeps the `feed_scores` table from growing unbounded and ensures feed freshness.

All cleanup operations use batch processing with configurable batch sizes to avoid long-running transactions that could block user-facing queries. The notification cleanup endpoint also returns error counts for observability — failed deletions are counted but don't halt the batch.
