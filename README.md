<div align="center">

# 🚀 Collabryx

**Next-Generation Collaborative Platform with AI-Powered Features**

[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Enabled-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Testing](https://img.shields.io/badge/testing-python-yellow?style=flat-square)](https://docs.pytest.org/)

</div>

---

## 📖 Overview

**Collabryx** is a production-ready collaborative platform built with modern web technologies. It combines real-time collaboration features with AI-powered matching, 3D visualizations, and enterprise-grade security.

### ✨ Key Features

- 🤖 **AI-Powered Matching** - Vector embeddings for semantic profile matching (384 dimensions)
- 🌍 **Interactive 3D Visualizations** - Three.js, React Three Fiber, GSAP animations
- 🔐 **Enterprise Security** - 5-layer security (RLS, CSRF, rate limiting, bot detection, input sanitization)
- ⚡ **Real-time Updates** - Supabase Realtime for live notifications and messaging
- 🎨 **Premium UI/UX** - Radix UI, shadcn/ui, Tailwind CSS v4, Framer Motion
- 📱 **Responsive Design** - Mobile-first, accessible across all devices
- 🌙 **Dark Mode** - next-themes for seamless theme switching
- 🧪 **Testing** - Pytest (Python embedding service)

---

## 🏗️ Tech Stack

### Core Framework
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[React 19](https://react.dev/)** - Library for web and native user interfaces

### Backend & Database
- **[Supabase](https://supabase.com/)** - PostgreSQL database, Authentication, Real-time
- **[pgvector](https://github.com/pgvector/pgvector)** - Vector similarity search
- **[React Query 5](https://tanstack.com/query/latest)** - Server state management

### Testing & Quality
- **ESLint** - Code quality (0 errors, 26 intentional warnings)
- **TypeScript** - Strict mode, 100% type safety

### UI & Styling
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[radix-ui](https://www.radix-ui.com/)** - Unified Radix UI package
- **[@wrksz/themes](https://www.npmjs.com/package/@wrksz/themes)** - Theme system
- **[Framer Motion ^12.23.25](https://www.framer.com/motion/)** - Production-ready animations
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, reusable components
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications
- **[Lucide React](https://lucide.dev/)** - Icon toolkit

### 3D & Visualization
- **[Three.js](https://threejs.org/)** - 3D graphics library
- **[@react-three/fiber ^9.4.2](https://docs.pmnd.rs/react-three-fiber/)** - React renderer for Three.js
- **[@react-three/drei ^10.7.7](https://github.com/pmndrs/drei)** - R3F helpers
- **[GSAP ^13.0.0](https://gsap.com/)** - Professional-grade animations
- **[Lenis ^1.3.15](https://lenis.darkroom.engineering/)** - Smooth scroll
- **[Cobe ^0.6.5](https://github.com/shuding/cobe)** - Lightweight WebGL globe
- **[maath](https://github.com/pmndrs/maath)** - Math helpers
- **[ogl](https://github.com/oframe/ogl)** - WebGL framework
- **[postprocessing](https://github.com/pmndrs/postprocessing)** - Effect composer

### AI & Backend Services
- **Python Worker** - Embedding service only (FastAPI on :8000):
  - `embedding_generator` - Vector embeddings (Sentence Transformers, all-MiniLM-L6-v2, 384 dimensions)
  - `rate_limiter` - Database-backed rate limiting for embedding requests
  - `embedding_validator` - Embedding validation and dimension normalization

- **Universal AI Provider System** - Multi-provider registry with automatic failover:
  - Supports ALL OpenAI-compatible APIs (OpenAI, Groq, Together, Ollama, etc.) via `OpenAICompatibleProvider`
  - Native Anthropic support via `AnthropicNativeProvider`
  - Priority-based automatic failover (lower number = higher priority)
  - Configurable via `AI_PROVIDER_N_*` environment variables
  - Legacy `OPENAI_API_KEY` and `ANTHROPIC_API_KEY` still supported for backward compatibility

### State & Forms
- **[Zustand ^5.0.8](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[React Hook Form](https://react-hook-form.com/)** - Form validation
- **[Zod](https://zod.dev/)** - Schema validation
- **[face-api.js](https://github.com/justadudewhohacks/face-api.js)** - Face detection
- **[motion](https://motion.dev/)** - Animation library

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 22+** (LTS)
- **Bun 1.x** (package manager — never use npm)
- **Git**
- **Docker** (for Python worker - optional for development)
- **Supabase account** (free tier works)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/collabryx.git

# Navigate to project directory
cd collabryx

# Install dependencies
bun install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run the development server
bun run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Run Tests

**Python embedding service tests only (Pytest):**

```bash
# Run Python worker tests
cd python-worker && python -m pytest

# Run with verbose output
cd python-worker && python -m pytest -v

# Run specific test file
cd python-worker && python -m pytest tests/test_embedding.py
```

---

## 📂 Project Structure

```
collabryx/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yml              # Continuous integration
│       └── security.yml        # Security scanning
├── app/                        # Next.js App Router
│   ├── (auth)/                # Protected routes (dashboard, messages, etc.)
│   ├── (public)/              # Public routes (landing, login, register)
│   └── api/                   # API routes (22+ endpoints)
├── components/
│   ├── features/              # Domain-specific components (16 domains)
│   │   ├── ai-mentor/         # AI mentor chat
│   │   ├── analytics/         # Analytics dashboard
│   │   ├── auth/              # Authentication forms
│   │   ├── connections/       # User connections
│   │   ├── dashboard/         # Dashboard (posts, comments, feed)
│   │   ├── landing/           # Landing page components
│   │   ├── matches/           # Matching system
│   │   ├── messages/          # Messaging
│   │   ├── moderation/        # Content moderation
│   │   ├── notifications/     # Notifications
│   │   ├── onboarding/        # Onboarding flow
│   │   ├── posts/             # Post attachments
│   │   ├── profile/           # User profile
│   │   ├── requests/          # Connection requests
│   │   ├── search/            # Global search
│   │   └── settings/          # User settings
│   ├── shared/                # Cross-feature components (23)
│   │   ├── glass-card.tsx     # Glassmorphism card
│   │   ├── sidebar-nav.tsx    # Navigation
│   │   └── user-nav-dropdown.tsx
│   ├── ui/                    # shadcn/ui primitives (58 components)
│   └── providers/             # React context providers
├── hooks/                     # Custom React hooks (30 hooks)
│   ├── use-auth.ts            # Authentication
│   ├── use-messages.ts        # Messaging
│   ├── use-matches-query.ts   # Matching logic
│   ├── use-settings.ts        # User settings
│   ├── use-ai-stream.ts       # AI streaming
│   ├── use-profile.ts         # Profile management
│   ├── use-connections.ts     # User connections
│   └── use-analytics.ts       # Analytics tracking
├── lib/
│   ├── actions/               # Server Actions (10)
│   ├── ai/                    # Universal AI provider system
│   │   ├── providers/         # Provider implementations (OpenAI, Anthropic, MiniMax)
│   │   ├── errors.ts          # AI error types
│   │   └── streaming.ts       # Streaming utilities
│   ├── config/                # Configuration modules
│   ├── constants/             # Constants
│   ├── data/                  # Data definitions
│   ├── errors/                # Error types
│   ├── prompt/                # AI prompt templates
│   ├── rag/                   # RAG pipeline (6 modules: context, retrieval, summarization)
│   ├── services/              # Business logic (21 services)
│   ├── supabase/              # Supabase client setup
│   ├── utils/                 # Utility functions
│   └── validations/           # Zod schemas
├── scripts/                   # Automation scripts
│   ├── *.mjs                  # Docker management scripts
│   └── seed-data/             # Database seeding
├── python-worker/             # Python embedding service (FastAPI)
│   ├── main.py                # FastAPI entry point
│   ├── embedding_generator.py # Sentence Transformers logic
│   ├── rate_limiter.py        # Database-backed rate limiting
│   ├── embedding_validator.py # Validation & dimension normalization
│   └── tests/                 # Pytest suite (3 files)
├── diagrams/                  # Exported diagram assets
├── docs/                      # Documentation (35 files)
├── python-worker/             # Python embedding service (FastAPI)
│   ├── main.py                # FastAPI entry point
│   ├── embedding_generator.py # Sentence Transformers logic
│   ├── rate_limiter.py        # Database-backed rate limiting
│   ├── embedding_validator.py # Validation & dimension normalization
│   └── tests/                 # Pytest suite
├── supabase/                  # Database config
│   ├── config.toml            # Supabase configuration
│   ├── migrations/            # Migration files (9)
│   └── setup/                 # Schema setup (39 tables + RLS + triggers)
│       ├── 99-master-all-tables.sql  # Master schema (run this)
│       └── README.md          # Database setup guide
├── public/                    # Static assets
│   ├── icons/                 # ~154 Lucide icons
│   ├── images/                # SVG assets
│   └── Models/                # 3D models (GLTF)
├── types/                     # TypeScript type definitions (6 files)
├── AGENTS.md                  # AI agent development guide
├── proxy.ts                   # Auth middleware
└── render.yaml                # Render deployment config
```

---

## 🛠️ Available Scripts

### Core Commands

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development server at `localhost:3000` |
| `bun run build` | Build production-ready application |
| `bun run start` | Run production server |
| `bun run lint` | Run ESLint for code quality |
| `bun run typecheck` | Run TypeScript type checking |

### Docker Commands (Python Worker)

| Command | Description |
|---------|-------------|
| `bun run docker:up` | Start Python worker with auto-build |
| `bun run docker:down` | Stop Python worker |
| `bun run docker:logs` | View worker logs (real-time) |
| `bun run docker:health` | Check worker health status |
| `bun run docker:status` | Full status report |
| `bun run docker:rebuild` | Force rebuild worker |

📖 **Docker commands:** [Docker Scripts](./docs/05-deployment/docker-scripts.md)

### Database Seeding Commands

**🎮 Interactive Mode (Recommended):**

```bash
cd scripts/seed-data
python main.py
```

Use arrow keys to navigate, SPACE to select modules, ENTER to execute.

**📋 Command Line Mode:**

| Command | Description |
|---------|-------------|
| `cd scripts/seed-data` | Navigate to seeder directory |
| `python main.py` | Launch interactive menu |
| `python main.py --all` | Seed all data (profiles, posts, connections, etc.) |
| `python main.py --profiles` | Seed user profiles only |
| `python main.py --posts` | Seed posts with comments/reactions |
| `python main.py --connections` | Seed user connections |
| `python main.py --matches` | Seed match suggestions |
| `python main.py --conversations` | Seed conversations |
| `python main.py --messages` | Seed messages in conversations |
| `python main.py --notifications` | Seed notifications |
| `python main.py --mentor` | Seed AI mentor sessions |
| `python main.py --embeddings` | Generate vector embeddings |
| `python main.py --list` | Show configuration |

**Override limits:**
```bash
python main.py --profiles --limit-profiles 500
python main.py --posts --limit-posts 1000
```

📖 **Complete guide:** [Database Seeding Documentation](./docs/08-database-seeding/README.md)


---

## 🧪 Testing

Collabryx includes the Python embedding service test suite (Pytest).

### Test Coverage

- **Python Worker Tests**: Embedding generation pipeline (Pytest)

### Running Tests

```bash
# Run Python worker tests
cd python-worker && python -m pytest

# Run with verbose output
cd python-worker && python -m pytest -v

---

## 📚 Documentation

| Category | Documents |
|----------|-----------|
| **Getting Started** | [Installation](./docs/01-getting-started/installation.md) • [Development](./docs/01-getting-started/development.md) |
| **Architecture** | [Overview](./docs/02-architecture/overview.md) • [Diagrams](./docs/02-architecture/diagrams.md) • [User Stories](./docs/02-architecture/user-stories-and-sequence-diagrams.md) |
| **Core Features** | [Vector Embeddings](./docs/03-core-features/vector-embeddings/overview.md) • [AI Assistant](./docs/03-core-features/ai-assistant/overview.md) • [Matching](./docs/03-core-features/matching-system.md) • [Messaging](./docs/03-core-features/messaging.md) • [Authentication](./docs/03-core-features/authentication.md) • [API Reference](./docs/03-core-features/api-reference.md) |
| **Infrastructure** | [Python Worker](./docs/04-infrastructure/python-worker/overview.md) • [Database Schema](./docs/04-infrastructure/database/schema.md) • [Database Setup](./docs/04-infrastructure/database/setup-guide.md) • [Performance](./docs/04-infrastructure/performance.md) • [Embedding System](./docs/04-infrastructure/database/embeddings.md) |
| **Deployment** | [Overview](./docs/05-deployment/overview.md) • [Docker Scripts](./docs/05-deployment/docker-scripts.md) • [Checklist](./docs/05-deployment/checklist.md) • [Runbook](./docs/05-deployment/runbook.md) |
| **Database Seeding** | [Complete Guide](./docs/08-database-seeding/README.md) • [Quick Reference](./docs/08-database-seeding/QUICK_REFERENCE.md) |
| **Contributing** | [Guide](./docs/06-contributing/guide.md) • [Git Workflow](./docs/06-contributing/git-workflow.md) |
| **Reference** | [Environment Variables](./docs/07-reference/environment-variables.md) • [Commands](./docs/07-reference/commands.md) • [Troubleshooting](./docs/07-reference/troubleshooting.md) |
| **Security** | [Security Guide](./docs/SECURITY.md) |

---

## 🤝 Contributing

We welcome contributions! See our [Contributing Guide](./docs/06-contributing/guide.md) for details on:

- Code of Conduct
- Development workflow
- Coding standards (TypeScript, React, Tailwind)
- Git workflow (conventional commits)
- Pull request process
- Testing requirements

### Quick Start for Contributors

```bash
# Fork the repository
git clone https://github.com/your-username/collabryx.git

# Create a branch
git checkout -b feature/your-feature-name

# Make changes and verify
bun run dev

# Commit with conventional commits
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

---

## 🔐 Environment Variables

Required (4) and recommended environment variables:

```env
# === 1. SUPABASE (Required) ===
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# === 2. APPLICATION (Required) ===
NEXT_PUBLIC_APP_URL=http://localhost:3000

# === 3. PYTHON WORKER (Required for embeddings) ===
PYTHON_WORKER_URL=http://localhost:8000

# === 4. BACKEND ROUTING ===
# Auto-detect: Docker first, then Render
BACKEND_MODE=auto

# === 5. AI PROVIDERS (Optional — services degrade gracefully) ===
# Legacy single-provider keys (backward compatible):
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Universal Provider System (recommended — supports failover):
AI_PROVIDER_1_NAME=openai
AI_PROVIDER_1_API_KEY=sk-...
AI_PROVIDER_1_BASE_URL=https://api.openai.com/v1
AI_PROVIDER_1_MODEL=gpt-4o-mini
AI_PROVIDER_1_PRIORITY=1

# === 6. OPTIONAL ===
NODE_ENV=development
DEBUG=false
```

⚠️ **Never commit `.env.local` to version control!**

📖 **Complete reference:** [Environment Variables](./docs/07-reference/environment-variables.md)

---

## 📊 Database

Collabryx uses **39 tables** in Supabase (PostgreSQL) with:

- Row Level Security (RLS) on all tables
- Realtime subscriptions enabled
- Automatic embedding generation triggers
- Optimized indexes for performance
- pgvector for vector similarity search

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles |
| `user_skills` | User skills with proficiency |
| `user_interests` | User interests |
| `user_experiences` | Work experience |
| `user_projects` | Projects portfolio |
| `posts` | Social posts (with optimistic locking) |
| `post_attachments` | Post media attachments |
| `post_reactions` | Post reactions/emojis |
| `comments` | Post comments (threaded) |
| `comment_likes` | Comment likes |
| `connections` | User connections |
| `privacy_settings` | Privacy preferences |
| `blocked_users` | Blocked user management |
| `match_suggestions` | AI match suggestions |
| `match_scores` | Match compatibility scores |
| `match_activity` | Match activity tracking |
| `match_preferences` | Match filtering preferences |
| `conversations` | Chat conversations |
| `messages` | Chat messages (with read receipts) |
| `notifications` | User notifications |
| `notification_preferences` | Notification preferences |
| `ai_mentor_sessions` | AI mentor sessions |
| `ai_mentor_messages` | AI mentor messages |
| `profile_embeddings` | Vector embeddings (384 dim) |
| `embedding_dead_letter_queue` | Failed embedding retries |
| `embedding_pending_queue` | Onboarding embedding queue |
| `embedding_rate_limits` | Rate limiting (3/hour/user) |
| `theme_preferences` | UI theme preferences |
| `feed_scores` | Feed ranking scores |
| `feed_thompson_params` | Thompson sampling params |
| `post_impressions` | Post impression tracking |
| `user_analytics` | User analytics |
| `platform_analytics` | Platform-wide analytics |
| `events` | Event tracking |
| `audit_logs` | Audit trail |
| `content_moderation_logs` | Moderation audit log |
| `profile_visits` | Profile visit tracking |
| `user_bookmarks` | User bookmarks |

📖 **Complete schema:** [Database Setup](./supabase/setup/) • [Architecture](./docs/02-architecture/overview.md)

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 🆘 Support

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/your-username/collabryx/issues)
- 💬 [Discussions](https://github.com/your-username/collabryx/discussions)

---

<div align="center">

**Built with ❤️ using Next.js, TypeScript, Supabase, and Three.js**

</div>
