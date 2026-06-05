# Architecture Diagrams

**Last Updated:** 2026-06-05  
**Version:** 1.2.0  
**Changes:** Updated database schemas to align with 38-table production schema (added profile_visits and user_bookmarks; removed legacy connection_requests).

Visual diagrams illustrating Collabryx system architecture, data flows, and component relationships.

---

## Table of Contents

- [System Architecture](#system-architecture)
- [Component Hierarchy](#component-hierarchy)
- [Data Flow Diagrams](#data-flow-diagrams)
- [Database Relationships](#database-relationships)
- [Deployment Architecture](#deployment-architecture)
- [Security Architecture](#security-architecture)

---

## System Architecture

### High-Level Overview

```mermaid
graph TB
    subgraph Users["Users"]
        WebUser[Web Browser]
        MobileUser[Mobile Browser]
    end
    
    subgraph Frontend["Frontend - Next.js 16"]
        SSR[Server Components]
        CSR[Client Components]
        API[API Routes]
        SA[Server Actions]
    end
    
    subgraph Backend["Backend - Supabase"]
        Auth[Authentication]
        DB[PostgreSQL + pgvector]
        Realtime[Realtime Service]
        Storage[Object Storage]
    end
    
    subgraph AI["AI Services"]
        PythonWorker[Python Worker]
        FaceAPI[Face Detection]
        VectorSearch[Vector Search]
    end
    
    subgraph External["External Services"]
        Vercel[Vercel Hosting]
        CDN[CDN]
    end
    
    WebUser --> Frontend
    MobileUser --> Frontend
    
    Frontend --> Backend
    Frontend --> AI
    
    Backend --> Auth
    Backend --> DB
    Backend --> Realtime
    Backend --> Storage
    
    AI --> PythonWorker
    AI --> VectorSearch
    
    Frontend --> External
```

### Technology Stack Layers

```mermaid
graph LR
    subgraph Presentation["Presentation Layer"]
        React[React 19]
        NextJS[Next.js 16]
        R3F[React Three Fiber]
    end
    
    subgraph State["State Management"]
        Zustand[Zustand 5]
        ReactQuery[React Query 5]
    end
    
    subgraph Business["Business Logic"]
        Services[lib/services/]
        Hooks[Custom Hooks]
        Actions[Server Actions]
    end
    
    subgraph Data["Data Layer"]
        Supabase[Supabase]
        PostgreSQL[PostgreSQL 15]
        pgvector[pgvector]
    end
    
    Presentation --> State
    State --> Business
    Business --> Data
```

---

## Component Hierarchy

### Component Tree

```mermaid
graph TD
    subgraph Root["Root Layout"]
        app/layout.tsx
    end
    
    subgraph Providers["Providers"]
        QueryProvider[QueryProvider]
        ThemeProvider[ThemeProvider]
        SmoothScroll[SmoothScrollProvider]
    end
    
    subgraph Routes["Route Groups"]
        Public["(public)/ - Marketing & Auth"]
        Protected["(auth)/ - Dashboard & Features"]
    end
    
    subgraph Features["Feature Components"]
        Dashboard[dashboard/]
        Matches[matches/]
        Messages[messages/]
        Profile[profile/]
        Onboarding[onboarding/]
        Settings[settings/]
        Analytics[analytics/]
        Assistant[assistant/]
        Connections[connections/]
        Landing[landing/]
        Notifications[notifications/]
        Search[search/]
        AI-Mentor[ai-mentor/]
        Auth[auth/]
        Moderation[moderation/]
        Posts[posts/]
        Requests[requests/]
    end
    
    subgraph Shared["Shared Components"]
        SidebarNav[sidebar-nav.tsx]
        MobileNav[mobile-nav.tsx]
        GlassCard[glass-card.tsx]
        UserNav[user-nav-dropdown.tsx]
        MatchScore[match-score.tsx]
    end
    
    subgraph UI["UI Primitives (shadcn/ui)"]
        Button[button.tsx]
        Input[input.tsx]
        Card[card.tsx]
        Dialog[dialog.tsx]
        Avatar[avatar.tsx]
    end
    
    app/layout.tsx --> Providers
    Providers --> Routes
    Routes --> Features
    Features --> Shared
    Shared --> UI
```

### Feature Component Structure

```mermaid
graph TD
    subgraph Dashboard["Dashboard Feature"]
        DashboardPage[page.tsx]
        DashboardView[dashboard-view.tsx]
        StatsCard[stats-card.tsx]
    end
    
    subgraph Matches["Matches Feature"]
        MatchesPage[page.tsx]
        MatchesList[matches-list.tsx]
        MatchCard[match-card.tsx]
        MatchFilters[match-filters.tsx]
    end
    
    subgraph Messages["Messages Feature"]
        MessagesPage[page.tsx]
        ConversationsList[conversations-list.tsx]
        ChatWindow[chat-window.tsx]
        MessageInput[message-input.tsx]
    end
    
    DashboardPage --> DashboardView
    DashboardView --> StatsCard
    
    MatchesPage --> MatchesList
    MatchesList --> MatchCard
    MatchesList --> MatchFilters
    
    MessagesPage --> ConversationsList
    MessagesPage --> ChatWindow
    ChatWindow --> MessageInput
```

---

## Data Flow Diagrams

### Authentication Flow

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as LoginForm (Client)
    participant SA as Supabase Auth
    participant Sync as /auth-sync (Server)
    participant ClientSync as AuthSyncClient (Client)
    participant DB as PostgreSQL
    
    U->>UI: Enter credentials
    UI->>UI: Validate form (Zod schema)
    UI->>SA: signInWithPassword(email, password)
    SA->>DB: Verify credentials
    DB-->>SA: User record & JWT
    SA-->>UI: Session established (Set cookies)
    UI->>Sync: Redirect to /auth-sync (Server route)
    
    activate Sync
    Sync->>SA: getUser() (Read session cookies)
    alt Email Verification Required
        Sync-->>U: Redirect to /verify-email
    else Onboarding Incomplete
        Sync-->>ClientSync: Render Client with destination="/onboarding"
    else Onboarding Complete
        Sync->>DB: Check profile_embeddings status
        DB-->>Sync: Return status (pending/processing/completed)
        Sync-->>ClientSync: Render Client with destination="/dashboard", needsEmbeddingWait=true
    end
    deactivate Sync
    
    activate ClientSync
    alt needsEmbeddingWait is true
        loop Poll Status (every 2s)
            ClientSync->>DB: Query profile_embeddings status
            DB-->>ClientSync: Status (pending/processing/completed)
            alt status == 'completed'
                ClientSync-->>U: Redirect immediately to /dashboard
            end
        end
        Note over ClientSync: Redirect fallback after 8s timeout
    else needsEmbeddingWait is false
        Note over ClientSync: Redirect to onboarding after 3s timeout
        ClientSync-->>U: Redirect to /onboarding
    end
    deactivate ClientSync
```

### Post Creation Flow

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant Form as PostForm (Client)
    participant Action as createPost() (Server Action)
    participant Audit as withAudit() wrapper
    participant DB as PostgreSQL
    
    U->>Form: Fill form (content, post_type, intent)
    Form->>Form: Validate client-side
    Form->>Action: Call createPost(formData)
    
    activate Action
    Action->>Action: Validate input (Zod CreatePostSchema)
    alt Invalid Input
        Action-->>Form: Return validation errors
    else Valid Input
        Action->>Audit: Execute action under 'post_create' audit log
        activate Audit
        Audit->>DB: Insert post record (init version = 1)
        DB-->>Audit: Return post row
        Audit->>DB: Insert audit log row
        Audit-->>Action: Return created post
        deactivate Audit
        Action->>Action: revalidatePath('/dashboard')
        Action-->>Form: Return success and post data
    end
    deactivate Action
    
    Form-->>U: Clear fields and display post
```

### Matching Algorithm Flow

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as Matches View (Client)
    participant API as /api/matches/generate (API Route)
    participant Service as generateMatchesForUser() (Service)
    participant DB as PostgreSQL (Supabase)
    
    U->>UI: View matches page
    UI->>API: POST /api/matches/generate
    activate API
    API->>API: Verify auth and CSRF tokens
    API->>API: Rate limit check (10 reqs/hr)
    API->>DB: Check onboarding completed & embedding status
    DB-->>API: Onboarding completed, embedding completed
    
    API->>Service: Call generateMatchesForUser(userId, limit)
    activate Service
    Service->>DB: Fetch user embedding (384 dimensions)
    DB-->>Service: User vector
    
    Service->>DB: Fetch user skills, interests, and availability
    DB-->>Service: User profile features
    
    Service->>DB: Fetch blocked user IDs to exclude
    DB-->>Service: List of excluded IDs
    
    Service->>DB: Fetch all candidate embeddings (completed)
    DB-->>Service: Candidate vectors
    
    Service->>DB: Fetch candidate skills, interests, & profiles in batch
    DB-->>Service: Candidate profiles metadata
    
    loop For each candidate
        Service->>Service: Compute cosine similarity of embeddings (40% weight)
        Service->>Service: Compute Jaccard skills overlap (25% weight)
        Service->>Service: Compute Jaccard skills complementarity (15% weight)
        Service->>Service: Compute Jaccard interests overlap (15% weight)
        Service->>Service: Compute availability/activity match (10% weight)
        Service->>Service: Combine scores, apply filters (exclude blocked/connected)
    end
    
    Service->>Service: Sort suggestions by overall score (descending)
    Service->>DB: Batch upsert top suggestions to match_suggestions
    Service->>DB: Batch upsert breakdowns to match_scores
    Service-->>API: Return top suggestions
    deactivate Service
    
    API-->>UI: Return JSON results
    deactivate API
    UI-->>U: Render personalized Matches cards with breakdowns
```

### Embedding Pipeline

```mermaid
flowchart TD
    subgraph Trigger["1. Activation Triggers"]
        A[User Completes Onboarding] -->|profiles.onboarding_completed update| B[trigger_generate_embedding trigger]
        C[Manual / API Request] -->|POST /api/embeddings/generate| D[queue_embedding_request function]
    end

    subgraph Queuing["2. Database Queuing"]
        B -->|Insert/Upsert| E[embedding_pending_queue <br/> status: pending]
        D -->|Insert/Upsert| E
        B -->|Set status: pending| F[profile_embeddings]
        D -->|Set status: processing| F
    end

    subgraph Processing["3. Python Worker Processing"]
        G[Worker Background Task] -->|Polls every 15s| E
        E -->|Atomic update status: processing| H[Claim Queue Items]
        H -->|Check trigger source| I{Has semantic text?}
        I -->|No| J[Query profiles, user_skills, user_interests in parallel]
        I -->|Yes| K[Construct / Extract semantic text]
        J --> K
        K --> L[Batch encode via Sentence Transformer model]
    end

    subgraph Finalization["4. Storage & Error Recovery"]
        L -->|Verify dimension & normalization| M{Valid Vector?}
        M -->|Yes| N[Store in profile_embeddings <br/> status: completed]
        N -->|Update queue status: completed| O[Complete Queue Item]
        
        M -->|No / Exception| P[Mark queue status: failed]
        P -->|Insert with retry_count: 0| Q[embedding_dead_letter_queue]
        
        Q -->|Polls every 60s| R[DLQ Processor]
        R -->|Retry attempt < 3| S[Attempt embedding generation]
        S -->|Success| N
        S -->|Failure| T[Increment retry count]
        T -->|Retry count >= 3| U[Mark status: exhausted]
    end

    style Trigger fill:#f3e5f5,stroke:#ab47bc,stroke-width:2px
    style Queuing fill:#e1f5ff,stroke:#29b6f6,stroke-width:2px
    style Processing fill:#e8f5e9,stroke:#66bb6a,stroke-width:2px
    style Finalization fill:#fff3cd,stroke:#ffca28,stroke-width:2px
```

### Real-time Message Flow

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant App1 as Client 1
    participant DB as PostgreSQL
    participant RT as Realtime
    participant App2 as Client 2
    participant U2 as User 2
    
    U1->>App1: Send message
    App1->>DB: Insert message
    DB->>RT: Broadcast change
    RT->>App2: New message event
    App2->>U2: Display message
    App1->>U1: Show sent message
```

---

## Database Relationships

### Entity Relationship Diagram

```mermaid
erDiagram
    profiles ||--o{ user_skills: has
    profiles ||--o{ user_interests: has
    profiles ||--o{ user_experiences: has
    profiles ||--o{ user_projects: has
    profiles ||--|| profile_embeddings: has
    profiles ||--o{ posts: creates
    profiles ||--o{ comments: creates
    profiles ||--o{ connections: initiates
    profiles ||--o{ conversations: participates
    profiles ||--o{ messages: sends
    profiles ||--o{ notifications: receives
    profiles ||--o{ ai_mentor_sessions: has
    profiles ||--o{ feed_scores: scored
    profiles ||--o{ events: generates
    profiles ||--o{ privacy_settings: configures
    profiles ||--o{ theme_preferences: configures
    profiles ||--o{ audit_logs: logs
    profiles ||--o{ match_preferences: configures
    profiles ||--o{ embedding_rate_limits: "rate limited"
    profiles ||--o{ blocked_users: blocks
    profiles ||--o{ profile_visits: viewer
    profiles ||--o{ profile_visits: viewed
    profiles ||--o{ user_bookmarks: bookmarks
    
    posts ||--o{ post_attachments: has
    posts ||--o{ post_reactions: receives
    posts ||--o{ comments: contains
    posts ||--o{ feed_scores: "scored in"
    posts ||--o{ feed_thompson_params: tracks
    posts ||--o{ post_impressions: has
    posts ||--o{ user_bookmarks: "referenced in"
    
    comments ||--o{ comment_likes: receives
    comments ||--o{ comments: "replies (parent_id)"
    
    connections }|--|| profiles : requester
    connections }|--|| profiles : receiver
    blocked_users }|--|| profiles : blocker
    blocked_users }|--|| profiles : blocked
    
    conversations ||--o{ messages: contains
    ai_mentor_sessions ||--o{ ai_mentor_messages: contains
    
    profile_embeddings ||--|| profiles : belongs_to
    embedding_dead_letter_queue ||--|| profiles : retry_for
    embedding_pending_queue ||--|| profiles : queued_for
```

### Table Dependencies

```mermaid
graph TD
    subgraph Core["Core Tables"]
        profiles[profiles]
        embeddings[profile_embeddings]
    end
    
    subgraph UserContent["User Content & Extensions"]
        skills[user_skills]
        interests[user_interests]
        experiences[user_experiences]
        projects[user_projects]
        visits[profile_visits]
        bookmarks[user_bookmarks]
    end
    
    subgraph Social["Social Features"]
        posts[posts]
        comments[comments]
        connections[connections]
        blocked[blocked_users]
    end
    
    subgraph Messaging["Messaging"]
        conversations[conversations]
        messages[messages]
    end
    
    subgraph Matching["Matching System"]
        scores[match_scores]
        preferences[match_preferences]
        activity[match_activity]
    end
    
    subgraph Reliability["Embedding Reliability"]
        dlq[embedding_dead_letter_queue]
        pending[embedding_pending_queue]
        ratelimits[embedding_rate_limits]
    end

    subgraph Analytics["Analytics & ML"]
        feedscores[feed_scores]
        thompson[feed_thompson_params]
        impressions[post_impressions]
        events[events]
        useranal[user_analytics]
        platanal[platform_analytics]
    end
    
    profiles --> embeddings
    profiles --> UserContent
    profiles --> Social
    profiles --> Messaging
    profiles --> Matching
    profiles --> Reliability
    profiles --> Analytics
```

---

## Deployment Architecture

### Production Infrastructure

```mermaid
graph TB
    subgraph Users["Users"]
        User[Browser Client]
    end

    subgraph Vercel["Vercel Platform"]
        Edge[Edge Network]
        SSR[Serverless Functions]
        ISR[Incremental Static Regeneration]
    end
    
    subgraph Supabase["Supabase Cloud"]
        DB[PostgreSQL + pgvector]
        Storage[Object Storage]
        Realtime[Realtime Service]
        Auth[Supabase Auth]
    end
    
    subgraph Worker["Python Worker (Railway)"]
        API[FastAPI Server]
        Queue[Queue Processor]
        Model[Sentence Transformers]
    end
    
    subgraph CDN["Content Delivery"]
        ImageCDN[Image CDN]
        Static[Static Assets]
    end
    
    User --> Edge
    Edge --> SSR
    Edge --> ISR
    
    SSR --> Auth
    SSR --> DB
    SSR --> Storage
    SSR --> API : "HTTP POST (manual queueing)"
    
    API --> DB : "Insert pending item"
    Queue --> DB : "Poll pending queue & read profiles"
    Queue --> Model : "Generate vectors"
    Queue --> DB : "Upsert completed embedding"
    
    ISR --> ImageCDN
    ISR --> Static
```

### Environment Flow

```mermaid
graph LR
    subgraph Dev["Development"]
        LocalHost[localhost:3000]
        LocalWorker[localhost:8000]
        LocalDB[Supabase Dev]
    end
    
    subgraph Staging["Staging"]
        StagingApp[staging.collabryx.com]
        StagingWorker[worker-staging]
        StagingDB[Supabase Staging]
    end
    
    subgraph Prod["Production"]
        ProdApp[collabryx.com]
        ProdWorker[worker-production]
        ProdDB[Supabase Production]
    end
    
    Dev --> Staging
    Staging --> Prod
```

---

## Security Architecture

### Security Layers

```mermaid
graph TB
    subgraph L1["Layer 1: Network"]
        HTTPS[HTTPS Only]
        CORS[CORS Policies]
        RateLimit[Rate Limiting]
    end
    
    subgraph L2["Layer 2: Auth"]
        SupabaseAuth[Supabase Auth]
        JWT[JWT Tokens]
        Sessions[Secure Sessions]
    end
    
    subgraph L3["Layer 3: Authorization"]
        RLS[Row Level Security]
        Policies[RLS Policies]
    end
    
    subgraph L4["Layer 4: Validation"]
        Zod[Zod Schemas]
        Sanitize[Input Sanitization]
        FileType[File Validation]
    end
    
    subgraph L5["Layer 5: Protection"]
        BotDetect[Bot Detection]
        CSRF[CSRF Protection]
    end

    subgraph L6["Layer 6: Session"]
        SessionExpiry[Session Expiry Warning]
        AuthSync[Auth State Sync]
    end
    
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
    L5 --> L6
```

### RLS Policy Flow

```mermaid
graph TD
    A[User Request] --> B{Authenticated?}
    B -->|No| C[Reject 401]
    B -->|Yes| D{RLS Policy Check}
    
    D -->|SELECT| E[Can read all profiles]
    D -->|INSERT| F[Is user creating own profile?]
    D -->|UPDATE| G[Is user updating own profile?]
    D -->|DELETE| H[Is user admin?]
    
    E --> I[Allow]
    F -->|Yes| I
    F -->|No| J[Reject 403]
    G -->|Yes| I
    G -->|No| J
    H -->|Yes| I
    H -->|No| J
```

---

## Related Documentation

- [Architecture Overview](./overview.md) - Detailed architecture documentation
- [Deployment Guide](../05-deployment/overview.md) - Deployment instructions
- [API Reference](../03-core-features/api-reference.md) - All API endpoints
- [Security Guide](../SECURITY.md) - Security features

---

**Document Version:** 1.2.0  
**Last Reviewed:** 2026-06-05  
**Maintained By:** Architecture Team
