# Data State & Architecture Diagrams

**Last Updated:** 2026-04-30
**Version:** 1.0.0
**Project:** Collabryx - AI-Powered Collaborative Platform
**Database:** Supabase (PostgreSQL 15 + pgvector)

---

## Table of Contents

1. [Entity Relationship Diagram (ERD)](#entity-relationship-diagram-erd)
2. [Data Flow Diagram (DFD)](#data-flow-diagram-dfd)
3. [Table Structure Reference](#table-structure-reference)
4. [Relationship Summary](#relationship-summary)

---

## Entity Relationship Diagram (ERD)

### Core User & Profile Tables

```mermaid
erDiagram
    AUTH_USERS ||--o| PROFILES : "creates profile"
    AUTH_USERS {
        uuid id PK
        email text
        created_at timestamptz
        raw_user_meta_data jsonb
    }

    PROFILES ||--o{ USER_SKILLS : "has many"
    PROFILES ||--o{ USER_INTERESTS : "has many"
    PROFILES ||--o{ USER_EXPERIENCES : "has many"
    PROFILES ||--o{ USER_PROJECTS : "has many"
    PROFILES ||--o| PROFILE_EMBEDDINGS : "has one"
    PROFILES ||--o{ POSTS : "creates"
    PROFILES ||--o{ COMMENTS : "creates"
    PROFILES ||--o{ CONVERSATIONS : "participates"
    PROFILES ||--o{ MESSAGES : "sends"
    PROFILES ||--o{ CONNECTIONS_SENT : "initiates"
    PROFILES ||--o{ CONNECTIONS_RECEIVED : "receives"
    PROFILES ||--o{ NOTIFICATIONS : "receives"
    PROFILES ||--o| MATCH_PREFERENCES : "has one"
    PROFILES ||--o{ MATCH_SUGGESTIONS : "gets suggested"
    PROFILES ||--o{ MATCH_ACTIVITY : "triggers"
    PROFILES ||--o| THEME_PREFERENCES : "has one"
    PROFILES ||--o| NOTIFICATION_PREFERENCES : "has one"
    PROFILES ||--o{ AI_MENTOR_SESSIONS : "has many"

    PROFILES {
        uuid id PK
        text email
        text display_name
        text full_name
        text headline
        text bio
        text avatar_url
        text banner_url
        text location
        text website_url
        text collaboration_readiness
        boolean is_verified
        text verification_type
        text university
        integer profile_completion
        text[] looking_for
        boolean onboarding_completed
        timestamptz created_at
        timestamptz updated_at
    }

    USER_SKILLS {
        uuid id PK
        uuid user_id FK
        text skill_name
        text proficiency
        boolean is_primary
        timestamptz created_at
    }

    USER_INTERESTS {
        uuid id PK
        uuid user_id FK
        text interest
        timestamptz created_at
    }

    USER_EXPERIENCES {
        uuid id PK
        uuid user_id FK
        text title
        text company
        text description
        date start_date
        date end_date
        boolean is_current
        integer order_index
        timestamptz created_at
    }

    USER_PROJECTS {
        uuid id PK
        uuid user_id FK
        text title
        text description
        text url
        text image_url
        text[] tech_stack
        boolean is_public
        integer order_index
        timestamptz created_at
    }
```

### Social & Content Tables

```mermaid
erDiagram
    PROFILES ||--o{ POSTS : "creates"
    POSTS ||--o{ POST_ATTACHMENTS : "contains"
    POSTS ||--o{ POST_REACTIONS : "receives"
    POSTS ||--o{ COMMENTS : "contains"

    POSTS {
        uuid id PK
        uuid author_id FK
        text content
        text post_type
        text intent
        text link_url
        boolean is_pinned
        boolean is_archived
        integer reaction_count
        integer comment_count
        integer share_count
        integer version
        timestamptz created_at
        timestamptz updated_at
    }

    POST_ATTACHMENTS {
        uuid id PK
        uuid post_id FK
        text file_url
        text file_type
        text file_name
        integer file_size
        text mime_type
        integer width
        integer height
        integer order_index
        timestamptz created_at
    }

    POST_REACTIONS {
        uuid id PK
        uuid post_id FK
        uuid user_id FK
        text emoji
        timestamptz created_at
    }

    COMMENTS ||--o{ COMMENT_LIKES : "receives"
    COMMENTS {
        uuid id PK
        uuid post_id FK
        uuid author_id FK
        uuid parent_id FK
        text content
        integer like_count
        timestamptz created_at
        timestamptz updated_at
    }

    COMMENT_LIKES {
        uuid id PK
        uuid comment_id FK
        uuid user_id FK
        timestamptz created_at
    }
```

### Connections & Messaging Tables

```mermaid
erDiagram
    PROFILES ||--o{ CONNECTIONS_SENT : "sends requests"
    PROFILES ||--o{ CONNECTIONS_RECEIVED : "receives requests"

    CONNECTIONS ||--o| CONNECTIONS : "between two users"
    CONNECTIONS {
        uuid id PK
        uuid requester_id FK
        uuid receiver_id FK
        text status
        text message
        timestamptz created_at
        timestamptz updated_at
    }

    PROFILES ||--o{ CONVERSATIONS : "participates as participant_1"
    PROFILES ||--o{ CONVERSATIONS : "participates as participant_2"
    CONVERSATIONS ||--o{ MESSAGES : "contains"

    CONVERSATIONS {
        uuid id PK
        uuid participant_1 FK
        uuid participant_2 FK
        text last_message_text
        timestamptz last_message_at
        integer unread_count_1
        integer unread_count_2
        boolean is_archived
        timestamptz created_at
    }

    MESSAGES {
        uuid id PK
        uuid conversation_id FK
        uuid sender_id FK
        text text
        boolean is_read
        text attachment_url
        text attachment_type
        timestamptz read_at
        timestamptz created_at
    }
```

### Matching System Tables

```mermaid
erDiagram
    PROFILES ||--o{ MATCH_SUGGESTIONS : "receives suggestions"
    PROFILES ||--o{ MATCH_SUGGESTIONS : "is suggested to"
    MATCH_SUGGESTIONS ||--o| MATCH_SCORES : "has detailed scores"
    MATCH_SCORES ||--|| MATCH_SCORES : "detailed breakdown"

    MATCH_SUGGESTIONS {
        uuid id PK
        uuid user_id FK
        uuid matched_user_id FK
        integer match_percentage
        jsonb reasons
        real ai_confidence
        text ai_explanation
        text status
        timestamptz created_at
        timestamptz expires_at
    }

    MATCH_SCORES {
        uuid id PK
        uuid suggestion_id FK
        real semantic_similarity
        integer skills_overlap
        integer complementary_score
        integer shared_interests
        real activity_match
        real overall_score
        text model_version
        jsonb model_config
        text[] overlapping_skills
        text complementary_explanation
        text[] shared_interest_tags
        jsonb insights
        timestamptz calculated_at
        timestamptz created_at
        timestamptz updated_at
    }

    PROFILES ||--o| MATCH_PREFERENCES : "has one"
    MATCH_PREFERENCES {
        uuid id PK
        uuid user_id FK
        integer min_match_percentage
        text[] interested_in_types
        text availability_match
        timestamptz created_at
        timestamptz updated_at
    }

    PROFILES ||--o{ MATCH_ACTIVITY : "triggers"
    MATCH_ACTIVITY {
        uuid id PK
        uuid actor_user_id FK
        uuid target_user_id FK
        text type
        text activity
        integer match_percentage
        boolean is_read
        timestamptz created_at
    }
```

### AI & Embeddings Tables

```mermaid
erDiagram
    PROFILES ||--o| PROFILE_EMBEDDINGS : "has one"
    PROFILES ||--o{ EMBEDDING_PENDING_QUEUE : "queued for"
    PROFILES ||--o{ EMBEDDING_DEAD_LETTER_QUEUE : "failed retries"
    PROFILES ||--o| EMBEDDING_RATE_LIMITS : "has one"

    PROFILE_EMBEDDINGS {
        uuid id PK
        uuid user_id FK
        vector embedding
        timestamptz last_updated
        text status
        text error_message
        integer retry_count
        jsonb metadata
    }

    EMBEDDING_PENDING_QUEUE {
        uuid id PK
        uuid user_id FK
        text status
        text trigger_source
        jsonb metadata
        timestamptz created_at
        timestamptz first_attempt
        timestamptz last_attempt
        timestamptz completed_at
        text failure_reason
    }

    EMBEDDING_DEAD_LETTER_QUEUE {
        uuid id PK
        uuid user_id FK
        text semantic_text
        text failure_reason
        integer retry_count
        integer max_retries
        text status
        timestamptz last_attempt
        timestamptz next_retry
        timestamptz created_at
        timestamptz resolved_at
    }

    EMBEDDING_RATE_LIMITS {
        uuid id PK
        uuid user_id FK
        integer request_count
        timestamptz window_start
        timestamptz window_end
        timestamptz created_at
        timestamptz updated_at
    }

    PROFILES ||--o{ AI_MENTOR_SESSIONS : "has many"
    AI_MENTOR_SESSIONS ||--o{ AI_MENTOR_MESSAGES : "contains"

    AI_MENTOR_SESSIONS {
        uuid id PK
        uuid user_id FK
        text title
        text status
        timestamptz created_at
        timestamptz updated_at
    }

    AI_MENTOR_MESSAGES {
        uuid id PK
        uuid session_id FK
        text role
        text content
        boolean is_saved_to_profile
        timestamptz created_at
    }
```

---

## Data Flow Diagram (DFD)

### User Profile Data Flow (AI Analysis Pipeline)

```mermaid
flowchart TD
    subgraph INPUT["👤 User Input Layer"]
        UP[User Profile Data]
        BIO[Bio & Headline]
        SKILLS[Skills List]
        INTERESTS[Interests List]
        EXPERIENCES[Experiences]
        PROJECTS[Projects]
    end

    subgraph COLLECT["📥 Data Collection Layer"]
        FE1[Form Submission]
        VA1[Zod Validation]
        SS[Server Action]
    end

    subgraph STORAGE["💾 Database Storage Layer"]
        PG[(PostgreSQL)]
        PP[profiles table]
        US[user_skills table]
        UI[user_interests table]
        UE[user_experiences table]
        UP2[user_projects table]
    end

    subgraph AI_PIPELINE["🤖 AI Processing Pipeline"]
        QE[Queue Embedding Request]
        PE[profile_embeddings]
        W1[Python Worker]
        EH[Embedding Handler]
        GM[Generate Embedding Model]
        VC[Validate Vector]
        DLQ[Dead Letter Queue]
        RS[Rate Limit Check]
    end

    subgraph VECTOR_DB["🔍 Vector Search Layer"]
        HNSW[HNSW Index]
        VS[Vector Similarity Search]
        MS[match_suggestions]
    end

    subgraph MATCHING["🎯 Matching Engine"]
        MM[Match Making Algorithm]
        SC[match_scores]
        MF[Match Filters]
        RN[Ranked Results]
    end

    subgraph OUTPUT["📤 Output Layer"]
        NX[Next.js Frontend]
        NTF[Notifications]
        FDB[Feed Personalization]
    end

    %% User Input Flow
    UP --> FE1
    BIO --> FE1
    SKILLS --> FE1
    INTERESTS --> FE1
    EXPERIENCES --> FE1
    PROJECTS --> FE1

    FE1 --> VA1
    VA1 --> SS
    SS --> PG

    %% Database Storage
    PG --> PP
    PG --> US
    PG --> UI
    PG --> UE
    PG --> UP2

    %% Trigger AI Pipeline
    PP -->|onboarding_completed = true| QE
    QE -->|insert pending| PE
    PE -->|status: pending| W1

    W1 --> RS
    RS -->|allowed| GM
    RS -->|denied| WAIT[Wait & Retry]

    GM --> EH
    EH --> VC

    VC -->|valid| PE
    VC -->|invalid| DLQ
    DLQ -->|retry < 3| GM
    DLQ -->|exhausted| FAIL[Log Failure]

    %% Vector Search Flow
    PE --> HNSW
    HNSW --> VS
    VS --> MS
    MS --> MM
    MM --> SC
    SC --> MF
    MF --> RN
    RN --> NX
    RN --> NTF
    RN --> FDB

    %% Styling
    style INPUT fill:#FFF9C4,stroke:#F9A825,stroke-width:2px
    style COLLECT fill:#E3F2FD,stroke:#1565C0,stroke-width:2px
    style STORAGE fill:#E8F5E9,stroke:#2E7D32,stroke-width:2px
    style AI_PIPELINE fill:#F3E5F5,stroke:#7B1FA2,stroke-width:2px
    style VECTOR_DB fill:#E0F2F1,stroke:#00695C,stroke-width:2px
    style MATCHING fill:#FFF3E0,stroke:#E65100,stroke-width:2px
    style OUTPUT fill:#ECEFF1,stroke:#455A64,stroke-width:2px

    style VA1 fill:#FFCDD2,stroke:#C62828,stroke-width:2px
    style RS fill:#FFCDD2,stroke:#C62828,stroke-width:2px
    style VC fill:#FFCDD2,stroke:#C62828,stroke-width:2px
    style GM fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px
    style MM fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px
```

### Connection Request Flow

```mermaid
flowchart TD
    subgraph REQUEST["🔵 Connection Request Flow"]
        U1[User 1]
        FE2[Connection Form]
        SS2[Server Action]
        VAL1[Validate Request]
        CHK[Check not blocked]
        INS[Insert Connection]
        U2[User 2]
    end

    subgraph PROCESS["⚙️ Processing Layer"]
        CR[Create Record]
        NOT1[Create Notification]
        EVT1[Log Event]
        UPD1[Update Counts]
    end

    subgraph RESPONSE["📤 Response Flow"]
        RES1[Return Success]
        REA1[Realtime Update]
        NOT2[Notify User 2]
    end

    U1 --> FE2
    FE2 --> SS2
    SS2 --> VAL1
    VAL1 -->|valid| CHK
    CHK -->|allowed| INS
    CHK -->|blocked| ERR1[Error: Blocked]
    VAL1 -->|invalid| ERR2[Error: Invalid]

    INS --> CR
    CR --> NOT1
    CR --> EVT1
    CR --> UPD1

    NOT1 --> NOT2
    EVT1 --> UPD1

    CR --> RES1
    RES1 --> REA1
    NOT2 --> REA1

    U2 -->|accept/decline| ACT[Connection Action]
    ACT -->|accepted| CONN[Connections Updated]
    ACT -->|declined| UPD2[Status Updated]

    style U1 fill:#FFF9C4,stroke:#F9A825
    style U2 fill:#FFF9C4,stroke:#F9A825
    style FE2 fill:#E3F2FD,stroke:#1565C0
    style VAL1 fill:#FFCDD2,stroke:#C62828
    style CR fill:#C8E6C9,stroke:#2E7D32
    style NOT2 fill:#BBDEFB,stroke:#1976D2
```

### Message Send/Receive Flow

```mermaid
sequenceDiagram
    participant U1 as User 1
    participant NX as Next.js Client
    participant SA as Server Action
    participant PG as PostgreSQL
    participant RT as Supabase Realtime
    participant NX2 as Next.js Client 2
    participant U2 as User 2

    U1->>NX: Type message
    NX->>SA: sendMessage(conversationId, text)
    SA->>SA: Validate input

    SA->>PG: INSERT messages
    PG->>PG: Update conversation.last_message_text
    PG->>PG: Increment unread_count

    PG-->>SA: message record
    SA-->>NX: Success response

    NX->>U1: Show sent message (optimistic)

    PG->>RT: Broadcast INSERT event
    RT->>NX2: New message event

    NX2->>U2: Display new message
    NX2->>U2: Update unread badge

    Note over U1,U2: Real-time delivery via Supabase Realtime
```

---

## Relationship Summary

### Cardinality Overview

```mermaid
graph LR
    subgraph ONE_TO_MANY["1:N Relationships"]
        P["profiles"] -->|"1:N"| S["user_skills"]
        P -->|"1:N"| I["user_interests"]
        P -->|"1:N"| E["user_experiences"]
        P -->|"1:N"| PR["user_projects"]
        P -->|"1:N"| PO["posts"]
        P -->|"1:N"| CO["comments"]
        P -->|"1:N"| CN["connections"]
        C["conversations"] -->|"1:N"| M["messages"]
        PS["posts"] -->|"1:N"| PA["post_attachments"]
        PS -->|"1:N"| PR2["post_reactions"]
        PS -->|"1:N"| CM["comments"]
    end

    subgraph MANY_TO_MANY["N:N Relationships"]
        P -->|"N:N"| C2["connections"]
        P -->|"N:N"| MS["match_suggestions"]
    end

    subgraph ONE_TO_ONE["1:1 Relationships"]
        P -->|"1:1"| PE["profile_embeddings"]
        P -->|"1:1"| MP["match_preferences"]
        P -->|"1:1"| TP["theme_preferences"]
        P -->|"1:1"| NP["notification_preferences"]
        P -->|"1:1"| UA["user_analytics"]
    end

    style P fill:#FFF9C4,stroke:#F9A825,stroke-width:3px
    style C2 fill:#BBDEFB,stroke:#1976D2,stroke-width:2px
    style MS fill:#BBDEFB,stroke:#1976D2,stroke-width:2px
    style PE fill:#C8E6C9,stroke:#2E7D32,stroke-width:2px
```

---

## Color Legend

| Color | Meaning | Tables/Components |
|-------|---------|-------------------|
| 🟡 Yellow/Gold | Users/Profiles | `profiles`, `auth.users` |
| 🔵 Blue | Transactions/Connections | `connections`, `conversations` |
| 🟢 Green | Positive actions/Stored data | Successful inserts, embeddings |
| 🔴 Red | Constraints/Validations | Checks, blocks, errors |
| 🟣 Purple | AI/ML Processing | Embeddings, match scores |
| 🟩 Teal | Vector/Search | `profile_embeddings`, HNSW index |

---

**Document Version:** 1.0.0
**Last Updated:** 2026-04-30
**Database Version:** 4.1.0
**Maintained By:** Architecture Team