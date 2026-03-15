# Architecture Diagrams

**Last Updated:** 2026-03-16  
**Version:** 1.0.0

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
        Edge[Edge Functions]
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
        ActivityFeed[activity-feed.tsx]
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
    DashboardView --> ActivityFeed
    
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
    participant U as User
    participant UI as Auth UI
    participant App as Next.js App
    participant SA as Supabase Auth
    participant DB as Database
    
    U->>UI: Enter credentials
    UI->>App: Submit login form
    App->>SA: signInWithPassword()
    SA->>DB: Verify credentials
    DB-->>SA: User record
    SA-->>App: Session + tokens
    App->>App: Set cookies (SSR)
    App-->>UI: Redirect to dashboard
    UI->>App: Load protected route
    App->>SA: getUser()
    SA-->>App: User session
    App-->>UI: Render dashboard
```

### Post Creation Flow

```mermaid
sequenceDiagram
    participant U as User
    participant Form as PostForm
    participant Action as Server Action
    participant Validator as Zod
    participant DB as PostgreSQL
    participant Storage as Storage
    participant RT as Realtime
    
    U->>Form: Create post with media
    Form->>Validator: Validate input
    Validator-->>Form: Valid schema
    
    Form->>Action: createPost(formData)
    
    alt Has media
        Action->>Storage: Upload files
        Storage-->>Action: File URLs
    end
    
    Action->>DB: Insert post
    DB-->>Action: Post record
    Action->>RT: Broadcast event
    RT-->>Form: Success
    Form-->>U: Show success toast
```

### Matching Algorithm Flow

```mermaid
sequenceDiagram
    participant U as User
    participant App as Next.js
    participant VDB as profile_embeddings
    participant MS as match_suggestions
    participant UI as UI
    
    U->>App: Open matches page
    App->>VDB: Get user embedding
    VDB-->>App: Vector (384 dim)
    
    App->>VDB: Cosine similarity search
    VDB-->>App: Similar profiles + scores
    
    App->>MS: Apply filters
    Note over MS: Exclude connected<br/>Sort by score<br/>Limit 50
    
    MS-->>App: Ranked matches
    App->>UI: Display matches
```

### Embedding Pipeline

```mermaid
flowchart TD
    A[Profile Update] --> B{Embedding needed?}
    B -->|Yes| C[Add to pending_queue]
    B -->|No| D[Skip]
    
    C --> E[Python Worker polls queue]
    E --> F{Rate limit OK?}
    F -->|No| G[Wait 1s]
    F -->|Yes| H[Generate embedding]
    
    H --> I{Valid vector?}
    I -->|No| J[Add to DLQ]
    I -->|Yes| K[Store in profile_embeddings]
    
    J --> L{Retry count < 3?}
    L -->|Yes| M[Retry later]
    L -->|No| N[Log failure]
    
    K --> O[Update profile.completed_at]
    O --> P[Trigger callback]
    
    style A fill:#e1f5ff
    style K fill:#d4edda
    style N fill:#f8d7da
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
    
    posts ||--o{ post_reactions: receives
    posts ||--o{ comments: contains
    posts ||--o{ post_attachments: contains
    
    comments ||--o{ comment_likes: receives
    
    connections }|--|| profiles : user_1
    connections }|--|| profiles : user_2
    
    conversations ||--o{ messages: contains
    conversations }|--|| profiles : participant_1
    conversations }|--|| profiles : participant_2
    
    match_suggestions }|--|| profiles : user_id
    match_suggestions }|--|| profiles : suggested_user_id
    
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
    
    subgraph UserContent["User Content"]
        skills[user_skills]
        interests[user_interests]
        experiences[user_experiences]
        projects[user_projects]
    end
    
    subgraph Social["Social Features"]
        posts[posts]
        comments[comments]
        connections[connections]
    end
    
    subgraph Messaging["Messaging"]
        conversations[conversations]
        messages[messages]
    end
    
    subgraph Matching["Matching System"]
        suggestions[match_suggestions]
        scores[match_scores]
    end
    
    subgraph Reliability["Embedding Reliability"]
        dlq[embedding_dead_letter_queue]
        pending[embedding_pending_queue]
    end
    
    profiles --> embeddings
    profiles --> UserContent
    profiles --> Social
    profiles --> Messaging
    profiles --> Matching
    profiles --> Reliability
```

---

## Deployment Architecture

### Production Infrastructure

```mermaid
graph TB
    subgraph Vercel["Vercel Platform"]
        Edge[Edge Network]
        SSR[Serverless Functions]
        ISR[Incremental Static Regeneration]
    end
    
    subgraph Supabase["Supabase Cloud"]
        Primary[Primary DB US-East]
        Replica[Read Replica EU-West]
        Storage[Object Storage]
        Realtime[Realtime Service]
    end
    
    subgraph Worker["Python Worker Railway"]
        Container[Docker Container]
        Health[Health Check]
        Queue[Queue Processor]
    end
    
    subgraph CDN["Content Delivery"]
        Images[Image CDN]
        Static[Static Assets]
    end
    
    User --> Edge
    Edge --> SSR
    Edge --> ISR
    SSR --> Supabase
    ISR --> Supabase
    Supabase --> Primary
    Supabase --> Replica
    SSR --> Worker
    ISR --> CDN
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
    
    L1 --> L2
    L2 --> L3
    L3 --> L4
    L4 --> L5
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

- [Architecture Overview](./ARCHITECTURE.md) - Detailed architecture documentation
- [Deployment Guide](./DEPLOYMENT.md) - Deployment instructions
- [API Reference](./API-REFERENCE.md) - All API endpoints
- [Security Guide](./SECURITY.md) - Security features

---

**Document Version:** 1.0.0  
**Last Reviewed:** 2026-03-16  
**Maintained By:** Architecture Team
