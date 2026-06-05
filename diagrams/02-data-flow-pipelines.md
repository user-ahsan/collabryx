# 🔀 Data Flow & Processing Pipeline Diagrams

> **Last Updated:** 2026-06-05  
> **Scope:** Asynchronous workflows, queue management, systemic fallbacks, and content processing pipelines.

---

## Table of Contents

1. [Asynchronous Profile Embedding Pipeline](#1-asynchronous-profile-embedding-pipeline)
2. [Fault-Tolerant Dead Letter Queue (DLQ) Flow](#2-fault-tolerant-dead-letter-queue-dlq-flow)
3. [Thompson Sampling Feed Scorer Workflow](#3-thompson-sampling-feed-scorer-workflow)
4. [Dual-Chain Content Moderation Sequence](#4-dual-chain-content-moderation-sequence)
5. [Event-Driven Analytics Pipeline](#5-event-driven-analytics-pipeline)
6. [Deduplicated Profile Visits Flow](#6-deduplicated-profile-visits-flow)
7. [Dedicated Bookmarking Flow](#7-dedicated-bookmarking-flow)

---

## 1. Asynchronous Profile Embedding Pipeline

This pipeline traces the complete journey of a user's profile data from the Next.js onboarding form, through the API boundary, into the `embedding_pending_queue`, over to the Python Sentence-Transformers container, and finally into PostgreSQL with pgvector.

```mermaid
sequenceDiagram
    participant User as User
    participant Onboard as Onboarding Form
    participant API as /api/embeddings/generate
    participant CSRF as CSRF Validation
    participant Auth as Supabase Auth
    participant Zod as Zod Schema Validator
    participant ProfileDB as profiles table
    participant SkillsDB as user_skills table
    participant InterestsDB as user_interests table
    participant EmbedAPI as Python Worker /generate-embedding
    participant RateL as Rate Limiter (3/hr)
    participant Queue as asyncio.Queue (in-memory)
    participant PendingDB as embedding_pending_queue
    participant PendingProc as Pending Queue Processor
    participant EmbedGen as Sentence Transformers (all-MiniLM-L6-v2)
    participant Validator as Embedding Validator
    participant EmbedDB as profile_embeddings (pgvector)
    participant DLQ as embedding_dead_letter_queue

    User->>Onboard: Completes onboarding (bio, skills, interests)

    Onboard->>API: POST /api/embeddings/generate

    API->>CSRF: Validate CSRF Token
    CSRF-->>API: Token Valid ✓

    API->>Auth: Get authenticated user session
    Auth-->>API: User session ✓

    API->>Zod: Validate request body
    Zod-->>API: Schema valid ✓

    API->>ProfileDB: Fetch profile (role, headline, bio, looking_for)
    ProfileDB-->>API: Profile data
    API->>SkillsDB: Fetch user skills
    SkillsDB-->>API: Skills list
    API->>InterestsDB: Fetch user interests
    InterestsDB-->>API: Interests list

    API->>API: construct_semantic_text()<br/>(concatenates role + headline + bio + skills + interests + goals + location)

    API->>EmbedAPI: POST /generate-embedding<br/>{ text: semantic_text, user_id: uuid }
    EmbedAPI->>RateL: check_rate_limit(user_id)
    RateL-->>EmbedAPI: Allowed (1/3 used this hour)

    EmbedAPI->>Queue: Put (text, user_id, request_id)
    Queue-->>EmbedAPI: Queued ✓
    EmbedAPI-->>API: { status: "queued" }
    API-->>Onboard: { status: "queued", message: "Processing..." }
    Onboard-->>User: Shows "Generating your embedding..." progress

    Note over Queue,PendingProc: ASYNC — Frontend polls via Realtime subscription

    Queue->>PendingProc: Get next item
    PendingProc->>PendingDB: INSERT into embedding_pending_queue<br/>(status=pending, trigger_source=onboarding)

    PendingProc->>PendingDB: SELECT * WHERE status=pending<br/>ORDER BY created_at LIMIT 20
    PendingDB-->>PendingProc: [items...]

    PendingProc->>PendingDB: Atomic Claim UPDATE status=pending→processing<br/>WHERE id=X AND status=pending
    PendingDB-->>PendingProc: Claimed ✓

    PendingProc->>ProfileDB: Fetch fresh profile data
    PendingProc->>SkillsDB: Fetch fresh skills
    PendingProc->>InterestsDB: Fetch fresh interests

    PendingProc->>EmbedGen: generate_embedding(semantic_text)
    Note over EmbedGen: Uses SentenceTransformer.encode()<br/>with retry (3 attempts, exponential backoff)

    EmbedGen-->>PendingProc: raw_embedding [384 floats]
    PendingProc->>Validator: validate_and_fix(embedding)
    Note over Validator: Checks: dimension=384, no NaN,<br/>no Inf, not all zeros, normalized magnitude≈1
    Validator-->>PendingProc: fixed_embedding ✓

    PendingProc->>EmbedDB: UPSERT into profile_embeddings<br/>{ user_id, embedding, status=completed }
    EmbedDB-->>PendingProc: Stored ✓

    PendingProc->>PendingDB: UPDATE status=completed<br/>WHERE id=X

    alt On Failure
        PendingProc->>PendingDB: UPDATE status=failed
        PendingProc->>DLQ: store_in_dead_letter_queue()<br/>{ user_id, text, reason, retry_count: 0 }
    end
```

### Pipeline Deep Dive

The flow begins **synchronously**: when a user completes onboarding, the Next.js client calls `/api/embeddings/generate`. This endpoint performs CSRF validation, verifies the user's session (with a special allowance for unverified emails during onboarding), fetches profile data from three tables (`profiles`, `user_skills`, `user_interests`), and concatenates them with `construct_semantic_text()` into a single string limited to 2000 characters.

The request then crosses the **service boundary** via HTTP POST to the Python FastAPI worker at `/generate-embedding`. The worker immediately checks the database-backed rate limiter (3 requests per hour per user, sliding window). If allowed, the request enters an in-memory `asyncio.Queue` (max size 100, bounded) and returns `{"status": "queued"}` to the frontend.

**Asynchronous processing** begins when the `queue_processor` background task picks up the item. It first inserts into the `embedding_pending_queue` table with status `pending` and trigger source `onboarding`. The `process_pending_queue` background task (polling every 30 seconds) then performs an **atomic claim** — updating the status from `pending` to `processing` only if it's still `pending` (preventing duplicate processing by multiple worker instances).

The claim winner fetches fresh profile data, generates the embedding via `SentenceTransformer.encode()` with retry logic (3 attempts, exponential backoff 2-10 seconds), validates the resulting vector (384 dimensions, no NaN/Inf, not all zeros, normalized magnitude), and UPSERTs into `profile_embeddings` on conflict by `user_id`. On success, the queue item is marked `completed`. On failure, it's moved to the dead letter queue for retry.

---

## 2. Fault-Tolerant Dead Letter Queue (DLQ) Flow

The DLQ is the safety net for embedding generation failures. If the Python worker fails during vector computation, the system routes the failed request into the `embedding_dead_letter_queue` and retries with exponential backoff up to 3 times before marking it as `exhausted`.

```mermaid
flowchart TD
    Start["Embedding Generation Attempt"] --> Success{"Generation Succeeded?"}

    Success -->|"Yes ✓"| StoreEmbedding["Store in profile_embeddings<br/>(UPSERT with metadata)"]
    StoreEmbedding --> MarkComplete["Mark queue item as completed"]
    MarkComplete --> Done["✅ Done"]

    Success -->|"No ❌"| FailureReason{"What failed?"}

    FailureReason -->|"Timeout (30s)"| DLQ_Timeout["store_in_dead_letter_queue()<br/>reason: embedding_generation_timeout"]
    FailureReason -->|"Model Error"| DLQ_Model["store_in_dead_letter_queue()<br/>reason: model_encode_failed"]
    FailureReason -->|"Rate Limited (429)"| DLQ_Rate["store_in_dead_letter_queue()<br/>reason: rate_limited"]
    FailureReason -->|"Network Error"| DLQ_Net["store_in_dead_letter_queue()<br/>reason: supabase_connection_failed"]

    DLQ_Timeout --> DLQ_Init["<b>DLQ Entry Created</b><br/>status: pending<br/>retry_count: 0<br/>next_retry: now + 5min"]
    DLQ_Model --> DLQ_Init
    DLQ_Rate --> DLQ_Init
    DLQ_Net --> DLQ_Init

    DLQ_Init --> DLQ_Processor["<b>DLQ Processor</b><br/>(Background task, 60s poll)"]

    DLQ_Processor --> AtomicClaim["Atomic Claim Pattern:<br/>UPDATE status=pending→processing<br/>WHERE id=X AND status=pending"]

    AtomicClaim --> ClaimSuccess{"Claim Successful?"}

    ClaimSuccess -->|"No (another worker got it)"| SkipItem["Skip — already claimed"]
    SkipItem --> DLQ_Processor

    ClaimSuccess -->|"Yes"| RetryGen["Retry: generate_embedding()"]

    RetryGen --> RetrySuccess{"Retry Succeeded?"}

    RetrySuccess -->|"Yes"| StoreFinal["Store Embedding ✓"]
    StoreFinal --> MarkDLQComplete["Mark DLQ as completed<br/>Set resolved_at timestamp"]
    MarkDLQComplete --> Done

    RetrySuccess -->|"No"| IncrementRetry["Increment retry_count + 1"]

    IncrementRetry --> CheckMax{"retry_count >= 3?"}

    CheckMax -->|"Yes — Exhausted"| MarkExhausted["Mark status: exhausted"]
    MarkExhausted --> ManualReview["⚠️ Manual review required"]

    CheckMax -->|"No — Retry Again"| Reschedule["Reschedule with backoff:<br/>next_retry = now + 5*(retry_count+1) min"]
    Reschedule --> DLQ_Processor

    style Start fill:#e1f5ff
    style StoreEmbedding fill:#d4edda
    style DLQ_Init fill:#fff3cd
    style MarkExhausted fill:#f8d7da
    style ManualReview fill:#f8d7da,stroke:#dc3545
```

### DLQ Architecture Deep Dive

The DLQ is implemented across two systems. On the **Python side**, `store_in_dead_letter_queue()` captures the failed user_id, the semantic text, a descriptive failure reason, and initializes `retry_count: 0` with `next_retry` set to `utcnow + 5 minutes`. It also attempts to update `profile_embeddings` with `status: "failed"` as a fallback marker. If even the DLQ insert fails, the system logs a **critical alert** for manual intervention.

The `process_dead_letter_queue()` background task runs every 60 seconds. It selects up to 10 eligible DLQ entries (status=`pending`, `next_retry` <= now, `retry_count` < 3). For each entry, it performs an **atomic claim**: `UPDATE status = 'processing' WHERE id = X AND status = 'pending'`. If the update returns zero affected rows, another worker has already claimed it — the item is safely skipped. This pattern prevents the thundering-herd problem in multi-worker deployments.

On the **Next.js side**, the `/api/embeddings/retry-dlq` endpoint allows **manual retry** of exhausted DLQ items. It validates CSRF tokens, checks that the item isn't already completed or exhausted, resets the DLQ entry to `pending` with a fresh `next_retry` timestamp, and calls the Python worker for immediate processing. If the worker is unavailable, the item stays `pending` for the automatic processor to pick up later. The admin dashboard at `embedding-queue-admin` exposes a full UI for monitoring DLQ items with user info, failure reasons, retry counts, and a "Retry" button.

---

## 3. Thompson Sampling Feed Scorer Workflow

The feed scorer uses **Thompson Sampling** (a multi-armed bandit algorithm) to dynamically rank posts in each user's dashboard feed. It balances exploitation (showing posts known to perform well for this user) with exploration (trying new content to discover engagement).

```mermaid
flowchart LR
    subgraph Input["📥 Input Sources"]
        Posts["posts table<br/>(Recent N posts, 48h window)"]
        Impressions["post_impressions<br/>(clicks, likes, shares, hides)"]
        ThompsonParams["feed_thompson_params<br/>(alpha, beta per post)"]
        UserPrefs["User Match Preferences<br/>(skills, interests filter)"]
    end

    subgraph Scoring["🧮 Score Calculation Engine"]
        subgraph Thompson["Thompson Sampling"]
            AlphaBeta["Read alpha, beta params<br/>from feed_thompson_params"]
            Sample["Sample from Beta(alpha, beta)<br/>— seededThompsonSample()"]
            Exploration["Exploration Factor:<br/>Higher beta = more exploration"]
            Exploitation["Exploitation Factor:<br/>Higher alpha = more exploitation"]
        end

        subgraph Hybrid["Hybrid Scoring"]
            SemanticScore["Semantic Score<br/>(O: 0-1 from text embedding)"]
            EngagementScore["Engagement Score<br/>(log-normalized engagement count)"]
            RecencyScore["Recency Score<br/>(exponential decay: e^(-0.1 * hours_ago))"]
            SocialBoost["Social Boost<br/>(connection activity +15%)"]
        end
    end

    subgraph Output["📤 Output Actions"]
        Enrich["Enrich posts with metadata<br/>(author info, attachment thumbnails)"]
        Compute["computeHybridScore()<br/>Weighted combination of all factors"]
        Persist["persistFeedScores()<br/>UPSERT into feed_scores table<br/>with 24h expiry"]
        Serve["serveFeedForUser()<br/>Sort by hybrid score DESC<br/>Return top N with cursor"]
    end

    Posts --> Thompson
    Posts --> SemanticScore
    Impressions --> Thompson
    Impressions --> EngagementScore
    UserPrefs --> SemanticScore
    ThompsonParams --> Thompson

    Thompson --> Compute
    SemanticScore --> Compute
    EngagementScore --> Compute
    RecencyScore --> Compute
    SocialBoost --> Compute

    Compute --> Enrich
    Enrich --> Persist
    Persist --> Serve
```

### Thompson Sampling Mechanics

The `feed_scorer.ts` service implements `seededThompsonSample(alpha, beta)` which draws a random sample from the Beta distribution defined by the post's alpha (successes) and beta (failures) parameters. Posts with higher sampled values are shown more often. When a user engages with a post (clicks, likes), the post's alpha is incremented — increasing its probability of being shown again. When a user skips or hides a post, beta is incremented — decreasing it.

The `calculateHybridScore()` function combines the Thompson sample (40% weight) with a semantic relevance score (30%), recency score with exponential decay (20%), and social connection boost (10%). The final score determines the ranking in the user's feed.

Scores are persisted to the `feed_scores` table with a 24-hour Time-to-Live (TTL). The `cleanupExpiredFeedScores()` function is called after each batch to remove stale entries. The feed is served to the frontend via cursor-based pagination for infinite scroll.

---

## 4. Dual-Chain Content Moderation Sequence

User-generated content (posts, comments, messages) passes through a **dual-chain moderation pipeline** — a cloud-based ML API (Google Perspective) and local keyword-based filtering. Both chains run asynchronously and in parallel.

```mermaid
sequenceDiagram
    participant User as User
    participant Form as Post/Comment Form
    participant UI as Frontend UI
    participant API as /api/moderate
    participant Zod as Zod Validator
    participant Fallback as Fallback Moderator (keyword)
    participant PythonMod as Python Worker /api/moderate
    participant LogDB as content_moderation_logs
    participant PostDB as posts/comments table
    participant RT as Supabase Realtime

    User->>Form: Submit content (post/comment/message)

    Form->>UI: Optimistic update (show immediately)
    Form->>API: POST /api/moderate<br/>{ content, content_type, user_id }

    API->>Zod: Validate moderateContentSchema<br/>(content min 1 char, content_type enum)
    Zod-->>API: Valid ✓

    par Parallel Moderation Chain
        API->>Fallback: Run fallbackModeration(content)
        Note over Fallback: Local keyword detection:<br/>• Toxicity keywords<br/>• Spam patterns (URL counts)<br/>• PII detection (emails, phones)

        Fallback->>Fallback: Calculate risk_score<br/>(0.0 — 1.0)

        Fallback-->>API: {<br/>  is_clean: bool,<br/>  risk_score: number,<br/>  flagged_reasons: string[],<br/>  contains_pii: bool<br/>}

    and
        API->>PythonMod: POST /api/moderate<br/>(proxied to FastAPI worker)

        Note over PythonMod: FastAPI endpoint calls<br/>Google Perspective API or<br/>custom ML classifier

        PythonMod-->>API: {<br/>  approved: bool,<br/>  flag_for_review: bool,<br/>  auto_reject: bool,<br/>  risk_score: number,<br/>  action: "approve"|"flag"|"reject",<br/>  details: { categories, scores }<br/>}
    end

    API->>API: Aggregate both results
    Note over API: Logic:<br/>• If EITHER chain rejects → reject<br/>• If EITHER chain flags → flag_for_review<br/>• If BOTH approve → approved

    alt Content Approved
        API->>PostDB: INSERT/UPDATE with status=approved
        PostDB-->>API: Done
        API-->>UI: { action: "approve", approved: true }
        UI-->>User: Content published ✓

    else Content Flagged for Review
        API->>PostDB: INSERT/UPDATE with status=flagged
        PostDB-->>API: Done
        API-->>UI: { action: "flag", flag_for_review: true }
        UI-->>User: "Content under review"

    else Content Rejected
        API->>PostDB: Not stored (or stored as rejected)
        API-->>UI: { action: "reject", auto_reject: true, reasons: [...] }
        UI->>Form: Roll back optimistic update
        UI-->>User: "Content blocked — violates guidelines"
    end

    API->>LogDB: INSERT into content_moderation_logs<br/>{ content_hash, both_results, final_action, timestamp }
```

### Dual-Chain Verification Logic

The moderation pipeline is implemented in `/app/api/moderate/route.ts`. It first validates the input with a Zod schema ensuring `content` is at least 1 character and `content_type` is one of `post`, `comment`, `message`, or `profile`. Then it fires **two parallel async chains**:

1. **Fallback Moderator** — A purely local, zero-dependency keyword-based filter implemented inline. It checks for toxicity keywords, spam patterns (more than 3 URLs), and PII (email regex, phone number patterns). This runs immediately (no network latency) and always returns a result.

2. **Python Worker Proxy** — Forwards the content to the FastAPI worker's `/api/moderate` endpoint (which integrates with Google's Perspective API for toxicity classification). If the Python worker is unreachable, this chain times out and the fallback result alone determines the action.

The **aggregation logic** is conservative: if either chain suggests rejection, the content is rejected. If either chain suggests flagging, it's flagged for human admin review. Only if both chains approve is the content published immediately. All decisions are logged to `content_moderation_logs` with both results for audit trail.

If the Python worker is completely offline, the system degrades gracefully: the fallback moderator runs independently and the content is accepted with a lower confidence score. The API response includes the `risk_score` and `action` fields so the frontend can display appropriate messaging.

---

## 5. Event-Driven Analytics Pipeline

The analytics engine processes platform activity asynchronously. When users perform core actions, database-level triggers write record changes to the central `events` table. An event insert trigger automatically fires the analytics processing pipeline to update counters and recalculate metrics.

```mermaid
sequenceDiagram
    participant User as User / Client
    participant API as Next.js API / Action
    participant SrcDB as Source Table (e.g. post_reactions)
    participant EvtDB as events table
    participant EvtTrig as Trigger: capture_event()
    participant ProcFunc as process_event_to_analytics()
    participant ScoreFunc as calculate_engagement_score()
    participant AnalDB as user_analytics table

    User->>API: Like a Post
    API->>SrcDB: INSERT INTO post_reactions
    
    SrcDB->>EvtTrig: AFTER INSERT
    EvtTrig->>EvtDB: INSERT INTO events (event_type='post_reaction', actor_id, target_id)
    
    EvtDB->>ProcFunc: AFTER INSERT
    Note over ProcFunc: Reads event_type and maps actor<br/>or target owner for scoring
    
    ProcFunc->>AnalDB: SELECT current analytics fields
    AnalDB-->>ProcFunc: profile_views, connections, reactions, matches
    
    ProcFunc->>ScoreFunc: calculate_engagement_score(views, matches, conns, reactions + 1)
    Note over ScoreFunc: Computes weighted 0-100 score:<br/>25% profile views + 25% matches<br/>+ 25% connections + 25% reactions
    ScoreFunc-->>ProcFunc: New engagement_score (integer)

    ProcFunc->>ProcFunc: calculate_influence_score()
    Note over ProcFunc: Computes 0-100 influence score:<br/>25% views + 25% conns + 15% posts<br/>+ 15% reactions + 20% matches

    ProcFunc->>AnalDB: UPDATE user_analytics<br/>SET post_reactions_received = post_reactions_received + 1,<br/>engagement_score = new_eng_score,<br/>influence_score = new_inf_score,<br/>last_active = NOW()
    AnalDB-->>ProcFunc: Updated ✓
    
    Note over User,AnalDB: Periodic Session Heartbeat (Client-side)
    User->>API: record_heartbeat(user_id) RPC
    API->>AnalDB: record_heartbeat() updates sessions_count,<br/>total_time_spent_minutes + 1, last_active,<br/>and recalculates activity_streak_days
```

### Analytics Pipeline Design

The analytics architecture decouples action recording from metric computation. API routes focus on mutating state, while triggers capture those mutations into the `events` table. The `process_event_to_analytics()` function centralizes processing, updating the `user_analytics` table atomically.

Mathematical scoring functions (`calculate_engagement_score()` and `calculate_influence_score()`) are implemented as pure SQL functions with `IMMUTABLE` logic, ensuring consistent performance. The client triggers a session heartbeat every minute (`record_heartbeat()`), allowing the system to update active status, track daily active streaks, and increment total session minutes.

---

## 6. Deduplicated Profile Visits Flow

To prevent spam and skewing of metrics, profile views are deduplicated over a sliding 7-day window. When a user views another user's profile, a `profile_visits` record is upserted. If they view the same profile within 7 days, the view is deduplicated; after 7 days, it registers as a new view.

```mermaid
sequenceDiagram
    participant Client as Viewer Browser
    participant API as /api/profile/[id]/view
    participant VisitDB as profile_visits table
    participant AnalDB as user_analytics table
    participant Func as increment_profile_views()

    Client->>API: GET /profile/X (view profile)
    API->>VisitDB: INSERT INTO profile_visits (viewer_id, viewed_id)<br/>ON CONFLICT (viewer_id, viewed_id) DO UPDATE<br/>SET expires_at = NOW() + INTERVAL '7 days', updated_at = NOW()<br/>WHERE expires_at <= NOW()
    
    alt If Fresh View (No Conflict or Expired)
        VisitDB-->>API: Row Created / Confirmed
        API->>Func: CALL increment_profile_views(viewed_id)
        Func->>AnalDB: UPDATE user_analytics<br/>SET profile_views_count = count + 1,<br/>profile_views_last_7_days = count_7 + 1,<br/>profile_views_last_30_days = count_30 + 1
        Func-->>API: Analytics Updated
    else If Deduplicated (Within 7-Day Window)
        VisitDB-->>API: Row Exists (Update condition not met)
        Note over API: Deduplicated — skips incrementing analytics
    end

    API-->>Client: Load profile page
```

### Deduplication Mechanics

The deduplication is enforced by a compound unique index on the `profile_visits` table: `UNIQUE(viewer_id, viewed_id)`. The query utilizes the `ON CONFLICT` clause to only perform updates if the previous visit record has expired (`expires_at <= NOW()`). When a fresh view is recorded, the security definer function `increment_profile_views()` updates the target user's `user_analytics` counters without granting the viewer direct write access to the analytics table.

---

## 7. Dedicated Bookmarking Flow

Bookmarking was migrated from an emoji reaction hack (`post_reactions` using the `🔖` emoji) to a dedicated `user_bookmarks` table. This improves indexing, security, and enables precise user-facing bookmark tracking.

```mermaid
sequenceDiagram
    participant User as User / Client
    participant API as /api/posts/[id]/bookmark (POST/DELETE)
    participant BookDB as user_bookmarks table
    participant PostDB as posts table
    participant Trig as Trigger: increment_post_bookmark_count()

    alt User Bookmarks Post
        User->>API: Click Bookmark Button
        API->>BookDB: INSERT INTO user_bookmarks (post_id, user_id)
        BookDB->>Trig: AFTER INSERT
        Trig->>PostDB: UPDATE posts SET bookmark_count = bookmark_count + 1
        API-->>User: Bookmark saved ✓ (Active state)
    else User Unbookmarks Post
        User->>API: Click Unbookmark Button
        API->>BookDB: DELETE FROM user_bookmarks WHERE post_id=X AND user_id=Y
        BookDB->>Trig: AFTER DELETE
        Trig->>PostDB: UPDATE posts SET bookmark_count = GREATEST(bookmark_count - 1, 0)
        API-->>User: Bookmark removed ✓ (Inactive state)
    end
```

### Migration and Count Triggers

The dedicated table `user_bookmarks` includes a `UNIQUE(post_id, user_id)` constraint to prevent duplicate bookmarks. The `posts` table includes a `bookmark_count` integer column, which is atomically updated via database-level triggers on insert/delete. In addition, the `increment_post_counter()` RPC function was updated to support atomic `bookmark_count` mutations. Stale emoji reactions (`emoji = '🔖'`) were migrated from `post_reactions` into `user_bookmarks` and deleted from reactions.

