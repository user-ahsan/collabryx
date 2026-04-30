# System Architecture Diagrams

**Last Updated:** 2026-04-30
**Version:** 1.0.0
**Project:** Collabryx - AI-Powered Collaborative Platform

---

## Table of Contents

1. [High-Level System Architecture](#1-high-level-system-architecture)
2. [AI Orchestration Architecture](#2-ai-orchestration-architecture)

---

## 1. High-Level System Architecture

*Diagram breaking down the separation of concerns showing Next.js frontend communicating with backend APIs and database layer*

```mermaid
%%{init: { 'theme': 'base', 'themeVariables': { 'fontFamily': 'Inter, sans-serif', 'primaryColor': '#2563EB', 'primaryTextColor': '#1E40AF', 'primaryBorderColor': '#3B82F6', 'lineColor': '#64748B', 'secondaryColor': '#10B981', 'tertiaryColor': '#F59E0B' } } }%%
flowchart TB
    subgraph Client["🌐 CLIENT LAYER"]
        direction TB
        Browser["🖥️ Browser<br/><small>React 19 • Next.js 16</small>"]
        MobileApp["📱 Mobile Web<br/><small>Responsive PWA</small>"]
    end

    subgraph CDN["⚡ CDN & EDGE"]
        Cloudflare["☁️ Cloudflare CDN<br/><small>Edge Caching • DDoS Protection</small>"]
    end

    subgraph Frontend["🎨 FRONTEND - Next.js App Router"]
        direction TB
        subgraph Pages["📄 Route Pages"]
            PublicPages["(public)/<br/>landing, login, register"]
            AuthPages["(auth)/<br/>dashboard, messages, profile"]
            API Routes["api/ REST endpoints"]
        end

        subgraph Components["🧩 Components"]
            UIComponents["shadcn/ui Components"]
            FeatureComponents["features/* Components"]
            SharedComponents["shared/* Components"]
        end

        subgraph Hooks["⚓ React Hooks"]
            AuthHook["useAuth hook"]
            QueryHooks["React Query hooks"]
            Context["Auth & Theme Context"]
        end
    end

    subgraph Backend["⚙️ BACKEND SERVICES"]
        direction TB
        subgraph PythonWorker["🐍 Python Worker (FastAPI)"]
            WorkerMain["main.py<br/><small>18 endpoints</small>"]
            subgraph Services["🔧 Services"]
                EmbeddingService["embedding_service.py"]
                MatchService["match_generator.py"]
                NotificationService["notification_engine.py"]
                AIAnalysisService["ai_analysis_service.py"]
            end
            subgraph Models["🤖 ML Models"]
                SentenceTransformer["all-MiniLM-L6-v2<br/>384 dimensions"]
                Gemini["Gemini Pro"]
            end
        end

        subgraph ExternalAPI["🔌 External APIs"]
            OpenRouter["⬆️ OpenRouter<br/><small>Multi-LLM Gateway</small>"]
            PerspectiveAPI["🛡️ Perspective API<br/><small>Content Safety</small>"]
        end
    end

    subgraph Database["💾 DATA LAYER - Supabase"]
        direction TB
        subgraph PostgreSQL["🗄️ PostgreSQL 15 + pgvector"]
            CoreTables["profiles, posts, connections<br/>conversations, messages"]
            VectorTables["profile_embeddings<br/>match_suggestions"]
            AuthTables["auth.users<br/>profiles"]
        end
        subgraph Realtime["⚡ Supabase Realtime"]
            RealtimeSubs["Subscription channels<br/>for live updates"]
        end
        subgraph Storage["📦 Supabase Storage"]
            AvatarStorage["avatars/"]
            PostMedia["post-media/"]
        end
    end

    subgraph VectorSearch["🔍 VECTOR SEARCH"]
        HNSW["HNSW Index<br/><small>Approximate NN Search</small>"]
        CosineSim["Cosine Similarity<br/><small>Match Scoring</small>"]
    end

    %% Client connections
    Browser -->|"HTTPS"| Cloudflare
    MobileApp -->|"HTTPS"| Cloudflare
    Cloudflare -->|"Proxy"| Frontend

    %% Frontend to Backend
    Frontend -->|"Server Actions"| PythonWorker
    Frontend -->|"API Routes"| PythonWorker
    PythonWorker -->|"RAG Pipeline"| OpenRouter
    OpenRouter -->|"LLM Responses"| PythonWorker

    %% Backend to Database
    PythonWorker -->|"SQL Queries"| PostgreSQL
    PythonWorker -->|"Vector Ops"| HNSW
    PythonWorker -->|"Generate Embeddings"| SentenceTransformer
    PythonWorker -->|"Content Check"| PerspectiveAPI
    PythonWorker -->|"Store/Retrieve"| AvatarStorage
    PostgreSQL -->|"Realtime Pub/Sub"| RealtimeSubs

    %% Data flow styling
    style Client fill:#DBEAFE,stroke:#3B82F6,stroke-width:2px
    style CDN fill:#FEF3C7,stroke:#F59E0B,stroke-width:2px
    style Frontend fill:#EFF6FF,stroke:#2563EB,stroke-width:2px
    style Backend fill:#F0FDF4,stroke:#16A34A,stroke-width:2px
    style Database fill:#F5F3FF,stroke:#8B5CF6,stroke-width:2px
    style VectorSearch fill:#FCE7F3,stroke:#DB2777,stroke-width:2px
```

### Component Communication Summary

| From | To | Protocol | Purpose |
|------|-----|----------|---------|
| Browser | Cloudflare | HTTPS | Web traffic |
| Cloudflare | Next.js | Proxy | Serve app |
| Next.js | Python Worker | Server Actions | AI operations |
| Python Worker | OpenRouter | HTTP | LLM inference |
| Python Worker | PostgreSQL | PostgreSQL | Data storage |
| Python Worker | HNSW | Vector ops | Similarity search |

---

## 2. AI Orchestration Architecture

*Detailed diagram showing how the application interfaces with n8n workflows, routes requests to LLMs via OpenRouter, and how MCP fits into agentic workflows*

```mermaid
%%{init: { 'theme': 'base', 'themeVariables': { 'fontFamily': 'Inter, sans-serif', 'primaryColor': '#8B5CF6', 'primaryTextColor': '#6D28D9', 'primaryBorderColor': '#A78BFA', 'lineColor': '#64748B', 'secondaryColor': '#10B981', 'tertiaryColor': '#F59E0B' } } }%%
flowchart TD
    subgraph Trigger["🎯 TRIGGERS"]
        direction TB
        UserAction["👤 User Action<br/><small>profile update, message sent</small>"]
        Schedule["⏰ Scheduled Cron<br/><small>6-hour batch job</small>"]
        API["🔌 API Call<br/><small>external webhook</small>"]
        Batch["📊 Batch Process<br/><small>daily digest</small>"]
    end

    subgraph FrontendAI["🎨 AI in Frontend"]
        AIMentor["🧠 AI Mentor Component<br/><small>useAIMentor hook</small>"]
        MatchCard["💡 Match Card AI<br/><small>explanation badges</small>"]
        SmartCompose["✨ Smart Compose<br/><small>message suggestions</small>"]
    end

    subgraph Orchestration["⚙️ ORCHESTRATION LAYER"]
        direction TB
        subgraph N8NWorkflows["📋 n8n Workflow Engine"]
            Workflow1["Profile Update WF"]
            Workflow2["Match Generation WF"]
            Workflow3["Notification WF"]
            Workflow4["Content Moderation WF"]
        end

        subgraph MCPServer["🔗 MCP Server (Model Context Protocol)"]
            MCPResources["📚 Resources<br/><small>profiles, posts, context</small>"]
            MCPTools["🔧 Tools<br/><small>search, match, notify</small>"]
            MCPprompts["💬 Prompts<br/><small>templates for LLM</small>"]
        end
    end

    subgraph Router["⬆️ OPENROUTER GATEWAY"]
        LoadBalancer["⚖️ Multi-Provider LB"]
        subgraph Providers["🤖 LLM Providers"]
            OpenAI["🤖 OpenAI GPT-4"]
            Anthropic["🧠 Anthropic Claude"]
            MiniMax["📊 MiniMax"]
            DashScope["🐉 DashScope"]
        end
        LoadBalancer -->|"fallback chain"| OpenAI
        LoadBalancer -->|"fallback chain"| Anthropic
        LoadBalancer -->|"fallback chain"| MiniMax
        LoadBalancer -->|"fallback chain"| DashScope
    end

    subgraph Pipeline["🔄 RAG PIPELINE"]
        direction TB
        ContextAssember["📝 Context Assembler<br/><small>profile + history + goals</small>"]
        VectorRetriever["🔍 Vector Retriever<br/><small>relevant past sessions</small>"]
        SessionSummarizer["📋 Session Summarizer<br/><small>condense conversation</small>"]
        ResponseFormatter["✨ Response Formatter<br/><small>structured output</small>"]
    end

    subgraph PythonWorker["🐍 PYTHON WORKER"]
        direction TB
        FastAPI["⚡ FastAPI Server<br/><small>18 endpoints</small>"]
        RateLimiter["🚦 Rate Limiter<br/><small>100 req/min</small>"]
        CircuitBreaker["🔄 Circuit Breaker<br/><small>50% threshold, 5min timeout</small>"]
    end

    subgraph VectorDB["🗄️ VECTOR DATABASE"]
        EmbeddingIndex["📊 pgvector Index<br/><small>HNSW, 384 dim</small>"]
        Cache["💾 Embedding Cache<br/><small>Redis</small>"]
    end

    %% Flow connections
    Trigger -->|"激发"| Orchestration
    UserAction --> FrontendAI
    FrontendAI -->|"request"| Orchestration

    Orchestration -->|"route"| MCPServer
    MCPServer -->|"context"| ContextAssember
    ContextAssember -->|"assemble"| VectorRetriever
    VectorRetriever -->|"retrieve"| Cache
    Cache -->|"cached embeddings"| EmbeddingIndex

    ContextAssember -->|"prompt + context"| Router
    Router -->|"LLM request"| Providers
    Providers -->|"response"| ResponseFormatter
    ResponseFormatter -->|"structured"| Pipeline

    Pipeline -->|"result"| Orchestration
    Orchestration -->|"execute"| PythonWorker
    PythonWorker -->|"store"| VectorDB
    PythonWorker -->|"log"| CircuitBreaker

    %% Error handling
    Router -.->|"error"| CircuitBreaker
    CircuitBreaker -.->|"retry after timeout"| Providers

    %% Styling
    style Trigger fill:#FFF9C4,stroke:#F9A825,stroke-width:2px
    style FrontendAI fill:#DBEAFE,stroke:#3B82F6,stroke-width:2px
    style Orchestration fill:#F5F3FF,stroke:#8B5CF6,stroke-width:2px
    style N8NWorkflows fill:#FCE7F3,stroke:#DB2777,stroke-width:2px
    style MCPServer fill:#E0F2F1,stroke:#00695C,stroke-width:2px
    style Router fill:#FEF3C7,stroke:#F59E0B,stroke-width:2px
    style Providers fill:#F0FDF4,stroke:#16A34A,stroke-width:2px
    style Pipeline fill:#FCE7F3,stroke:#DB2777,stroke-width:2px
    style PythonWorker fill:#E3F2FD,stroke:#1565C0,stroke-width:2px
    style VectorDB fill:#FFF3E0,stroke:#E65100,stroke-width:2px
```

### AI Flow Sequence

```mermaid
sequenceDiagram
    participant User as 👤 User
    participant Frontend as 🎨 Frontend
    participant MCP as 🔗 MCP Server
    participant RAG as 🔄 RAG Pipeline
    participant Router as ⬆️ OpenRouter
    participant LLM as 🤖 LLM Provider
    participant Worker as 🐍 Python Worker
    participant DB as 🗄️ Database

    User->>Frontend: "Ask AI Mentor"
    Frontend->>MCP: Request with context
    MCP->>RAG: Assemble context
    RAG->>DB: Fetch profile + history
    DB-->>RAG: Context data

    RAG->>Router: Prompt + context
    Router->>LLM: LLM Request

    alt Provider available
        LLM-->>Router: Response
        Router-->>RAG: Formatted response
        RAG-->>MCP: Structured output
        MCP-->>Frontend: AI response
        Frontend-->>User: Display response
    else Provider error
        Router->>CircuitBreaker: Record failure
        CircuitBreaker->>Router: Retry after timeout
        Router->>LLM: Try next provider
    end

    Note over User,DB: Full RAG pipeline with fallback chain
```

### MCP Tools & Resources

| Category | Item | Description |
|----------|------|-------------|
| **Resources** | `profile:{id}` | User profile data |
| **Resources** | `context:matching` | Match history & preferences |
| **Tools** | `search_similar` | Vector similarity search |
| **Tools** | `generate_match` | Create match suggestions |
| **Tools** | `send_notification` | Push notification dispatch |
| **Prompts** | `mentor_template` | AI Mentor response format |

### Multi-Provider Fallback Chain

```
OpenAI GPT-4 → Anthropic Claude → MiniMax → DashScope
     ↓              ↓              ↓          ↓
  [primary]     [fallback 1]   [fallback 2]  [fallback 3]
```

### Circuit Breaker Configuration

| Parameter | Value |
|-----------|-------|
| **Error Threshold** | 50% |
| **Timeout Duration** | 5 minutes |
| **Half-Open Requests** | 3 |
| **Recovery Timeout** | 30 seconds |

---

## Color Legend

| Color | Component Type |
|-------|---------------|
| 🔵 Blue | Frontend, Client layer |
| 🟡 Yellow | CDN, Gateway, Triggers |
| 🟢 Green | Backend services, LLM providers |
| 🟣 Purple | Orchestration, n8n, MCP |
| 🩵 Cyan | Database, Storage |
| 🔷 Pink | Pipeline, Processing |

---

*Generated: 2026-04-30 | Collabryx Documentation*