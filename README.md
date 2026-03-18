<div align="center">

# 🚀 Collabryx

**Next-Generation Collaborative Platform with AI-Powered Features**

[![Next.js](https://img.shields.io/badge/Next.js-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Enabled-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![React](https://img.shields.io/badge/React-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![Testing](https://img.shields.io/badge/testing-vitest-yellow?style=flat-square)](https://vitest.dev/)

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
- 🧪 **Testing** - Vitest (unit), Playwright (E2E), React Testing Library (components)

---

## 🏗️ Tech Stack

### Core Framework
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[React 19](https://react.dev/)** - Library for web and native user interfaces

### Backend & Database
- **[Supabase](https://supabase.com/)** - PostgreSQL database, Authentication, Real-time, Edge Functions
- **[pgvector](https://github.com/pgvector/pgvector)** - Vector similarity search
- **[React Query 5](https://tanstack.com/query/latest)** - Server state management

### Testing & Quality
- **[Vitest](https://vitest.dev/)** - Unit testing
- **[Playwright](https://playwright.dev/)** - E2E testing
- **[React Testing Library](https://testing-library.com/react)** - Component testing
- **ESLint** - Code quality (0 errors, 26 intentional warnings)
- **TypeScript** - Strict mode, 100% type safety

### UI & Styling
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Framer Motion 12](https://www.framer.com/motion/)** - Production-ready animations
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, reusable components
- **[Sonner](https://sonner.emilkowal.ski/)** - Toast notifications
- **[Lucide React](https://lucide.dev/)** - Icon toolkit

### 3D & Visualization
- **[Three.js](https://threejs.org/)** - 3D graphics library
- **[@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/)** - React renderer for Three.js
- **[@react-three/drei](https://github.com/pmndrs/drei)** - R3F helpers
- **[GSAP 3](https://gsap.com/)** - Professional-grade animations
- **[Lenis](https://lenis.darkroom.engineering/)** - Smooth scroll
- **[Cobe](https://github.com/shuding/cobe)** - Lightweight WebGL globe

### AI & Backend Services
- **Python Worker** - Multi-service backend (FastAPI on :8000):
  - `embedding_generator` - Vector embeddings (Sentence Transformers, all-MiniLM-L6-v2, 384 dimensions)
  - `match_generator` - AI-powered match scoring with pgvector similarity search
  - `notification_engine` - Smart notifications with priority batching
  - `activity_tracker` - User activity and engagement tracking
  - `feed_scorer` - Personalized feed ranking (Thompson Sampling + hybrid scoring)
  - `content_moderator` - AI content moderation (Google Perspective API + Hugging Face)
  - `ai_mentor_processor` - Gemini-powered AI mentor with session summarization
  - `event_processor` - Real-time event processing via Supabase Realtime
  - `analytics_aggregator` - Daily analytics and weekly digest generation
- **Edge Functions** - 5 Deno functions (generate-embedding, send-notification, calculate-matches, sync-profile-data, cleanup-expired-data)
- **OpenAI/Anthropic/Gemini** - Multi-provider AI mentor chat integration

### State & Forms
- **[Zustand 5](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[React Hook Form](https://react-hook-form.com/)** - Form validation
- **[Zod](https://zod.dev/)** - Schema validation

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** (LTS)
- **npm 10+** (yarn/bun not supported)
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
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

### Run Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

---

## 📂 Project Structure

```
collabryx/
├── app/                        # Next.js App Router
│   ├── (auth)/                # Protected routes (dashboard, messages, etc.)
│   ├── (public)/              # Public routes (landing, login, register)
│   └── api/                   # API routes
├── components/
│   ├── features/              # Domain-specific components
│   │   ├── assistant/         # AI assistant feature
│   │   ├── dashboard/         # Dashboard components
│   │   ├── matches/           # Matching system
│   │   ├── messages/          # Messaging
│   │   ├── onboarding/        # Onboarding flow
│   │   └── profile/           # User profile
│   ├── shared/                # Cross-feature components
│   │   ├── glass-card.tsx     # Glassmorphism card
│   │   ├── sidebar-nav.tsx    # Navigation
│   │   └── user-nav-dropdown.tsx
│   └── ui/                    # shadcn/ui primitives
├── hooks/                     # Custom React hooks
│   ├── use-auth.ts            # Authentication
│   ├── use-chat.ts            # Chat functionality
│   ├── use-matches.ts         # Matching logic
│   └── use-settings.ts        # User settings
├── lib/
│   ├── supabase/              # Supabase client setup
│   ├── services/              # Business logic
│   │   ├── embeddings.ts      # Embedding generation
│   │   ├── matches.ts         # Matching service
│   │   └── profiles.ts        # Profile service
│   └── utils/                 # Helper functions
├── tests/                     # Test suite
│   ├── components/            # Component tests
│   ├── hooks/                 # Hook tests
│   └── services/              # Service tests
├── docs/                      # Documentation
│   ├── 01-getting-started/    # Installation, development
│   ├── 02-architecture/       # Architecture overview
│   ├── 03-core-features/      # Feature docs
│   ├── 04-infrastructure/     # Infrastructure
│   ├── 05-deployment/         # Deployment guides
│   ├── 06-contributing/       # Contributing guide
│   └── 07-reference/          # Reference docs
├── python-worker/             # Python multi-service backend (FastAPI)
│   ├── services/              # Core services (9 services)
│   │   ├── embedding_generator.py
│   │   ├── match_generator.py
│   │   ├── notification_engine.py
│   │   ├── activity_tracker.py
│   │   ├── feed_scorer.py
│   │   ├── content_moderator.py
│   │   ├── ai_mentor_processor.py
│   │   ├── event_processor.py
│   │   └── analytics_aggregator.py
│   ├── main.py                # FastAPI entry point
│   └── tests/                 # Service tests
├── supabase/
│   ├── functions/             # Edge Functions (Deno)
│   └── setup/                 # Database schema (31 tables + RLS + triggers)
├── public/                    # Static assets
├── types/                     # TypeScript types
└── expected-objects/          # Backend schema specs
```

---

## 🛠️ Available Scripts

### Core Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `localhost:3000` |
| `npm run build` | Build production-ready application |
| `npm run start` | Run production server |
| `npm run lint` | Run ESLint for code quality |
| `npm run typecheck` | Run TypeScript type checking |

### Docker Commands (Python Worker)

| Command | Description |
|---------|-------------|
| `npm run docker:up` | Start Python worker with auto-build |
| `npm run docker:down` | Stop Python worker |
| `npm run docker:logs` | View worker logs (real-time) |
| `npm run docker:health` | Check worker health status |
| `npm run docker:status` | Full status report |
| `npm run docker:rebuild` | Force rebuild worker |

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

### Edge Functions

| Command | Description |
|---------|-------------|
| `npx supabase functions serve` | Run Edge Functions locally |
| `npx supabase functions deploy <name>` | Deploy Edge Function |
| `npx supabase functions list` | List all Edge Functions |

📖 **Edge Functions:** [supabase/functions/](./supabase/functions/)

---

## 🧪 Testing

Collabryx includes a comprehensive test suite with unit, component, and E2E tests.

### Test Coverage

- **Unit Tests**: Hooks, services, utilities (Vitest)
- **Component Tests**: UI components, feature components (React Testing Library)
- **E2E Tests**: Critical user flows (Playwright)

### Running Tests

```bash
# Run all tests
npm run test

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage

# E2E tests
npm run test:e2e
npm run test:e2e:ui
```

📖 **Testing Guide**: [docs/06-contributing/guide.md](./docs/06-contributing/guide.md)

---

## 📚 Documentation

| Category | Documents |
|----------|-----------|
| **Getting Started** | [Installation](./docs/01-getting-started/installation.md) • [Development](./docs/01-getting-started/development.md) |
| **Architecture** | [Overview](./docs/ARCHITECTURE.md) • [Diagrams](./docs/02-architecture/diagrams.md) |
| **Core Features** | [Vector Embeddings](./docs/03-core-features/vector-embeddings/overview.md) • [AI Assistant](./docs/03-core-features/ai-assistant/overview.md) • [Matching](./docs/03-core-features/matching-system.md) • [Messaging](./docs/03-core-features/messaging.md) |
| **Infrastructure** | [Python Worker](./docs/04-infrastructure/python-worker/overview.md) • [Database](./docs/04-infrastructure/database/schema.md) • [Security](./docs/04-infrastructure/security-status.md) • [Monitoring](./docs/04-infrastructure/monitoring.md) |
| **Deployment** | [Complete Guide](./docs/DEPLOYMENT.md) • [Overview](./docs/05-deployment/overview.md) • [Docker Scripts](./docs/05-deployment/docker-scripts.md) • [Checklist](./docs/05-deployment/checklist.md) |
| **Database Seeding** | [Complete Guide](./docs/08-database-seeding/README.md) • [Quick Reference](./docs/08-database-seeding/QUICK_REFERENCE.md) |
| **API Reference** | [Complete API Docs](./docs/API-REFERENCE.md) |
| **Contributing** | [Guide](./docs/06-contributing/guide.md) • [Git Workflow](./docs/06-contributing/git-workflow.md) |
| **Reference** | [Environment Variables](./docs/07-reference/environment-variables.md) • [Commands](./docs/07-reference/commands.md) • [Troubleshooting](./docs/07-reference/troubleshooting.md) |
| **Security** | [Security Features](./docs/SECURITY.md) |
| **Monitoring** | [Observability Guide](./docs/MONITORING.md) |

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

# Make changes and test
npm run dev
npm run test

# Commit with conventional commits
git commit -m "feat: add new feature"

# Push and create PR
git push origin feature/your-feature-name
```

---

## 🔐 Environment Variables

Required environment variables:

```env
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Python Worker (Optional, for embeddings)
PYTHON_WORKER_URL=http://localhost:8000

# Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

⚠️ **Never commit `.env.local` to version control!**

📖 **Complete reference:** [Environment Variables](./docs/07-reference/environment-variables.md)

---

## 📊 Database

Collabryx uses **26+ tables** in Supabase (PostgreSQL) with:

- Row Level Security (RLS) on all tables
- Realtime subscriptions enabled
- Automatic embedding generation triggers
- Optimized indexes for performance
- pgvector for vector similarity search

### Core Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles |
| `user_skills` | User skills |
| `user_interests` | User interests |
| `user_experiences` | Work experience |
| `user_projects` | Projects portfolio |
| `posts` | Social posts |
| `comments` | Post comments |
| `connections` | User connections |
| `match_suggestions` | AI match suggestions |
| `match_scores` | Match compatibility scores |
| `conversations` | Chat conversations |
| `messages` | Chat messages |
| `notifications` | User notifications |
| `profile_embeddings` | Vector embeddings (384 dim) |
| `embedding_dead_letter_queue` | Failed embedding retries |
| `embedding_pending_queue` | Onboarding embedding queue |

📖 **Complete schema:** [expected-objects/](./expected-objects/) • [Database Setup](./supabase/setup/) • [Architecture](./docs/ARCHITECTURE.md)

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
