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

**Collabryx** is a cutting-edge collaborative platform built with modern web technologies. It combines powerful real-time collaboration features with AI integration, stunning 3D visualizations, and a premium user experience.

### ✨ Key Features

- 🤖 **AI-Powered Collaboration** - Intelligent assistance and semantic matching with vector embeddings
- 🌍 **Interactive 3D Visualizations** - Powered by Three.js and React Three Fiber
- 🔐 **Secure Authentication** - Supabase Auth with Row Level Security
- ⚡ **Real-time Updates** - Live collaboration and data synchronization
- 🎨 **Premium UI/UX** - Modern design with smooth animations and micro-interactions
- 📱 **Responsive Design** - Seamless experience across all devices
- 🌙 **Dark Mode Support** - Eye-friendly theme switching
- ✅ **Test Coverage** - Comprehensive test suite with Vitest and React Testing Library

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

### Testing
- **[Vitest](https://vitest.dev/)** - Fast unit test framework
- **[React Testing Library](https://testing-library.com/react)** - Component testing

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

### AI & Analysis
- **Sentence Transformers** - Semantic embeddings (Python worker)
- **[face-api.js](https://github.com/justadudewhohacks/face-api.js/)** - Face detection/recognition

### State & Forms
- **[Zustand 5](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[React Hook Form](https://react-hook-form.com/)** - Form validation
- **[Zod](https://zod.dev/)** - Schema validation

---

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** (LTS)
- **npm 10+** (required, yarn/bun not supported)
- **Git**
- **Python 3.9+** (optional, for embedding worker)

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
├── python-worker/             # Python embedding service
├── supabase/
│   ├── functions/             # Edge Functions (Deno)
│   └── setup/                 # Database schema (26+ tables)
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

### Edge Functions

| Command | Description |
|---------|-------------|
| `npx supabase functions serve` | Run Edge Functions locally |
| `npx supabase functions deploy <name>` | Deploy Edge Function |
| `npx supabase functions list` | List all Edge Functions |

📖 **Edge Functions:** [supabase/functions/](./supabase/functions/)

---

## 🧪 Testing

Collabryx includes a comprehensive test suite:

### Test Structure

```
tests/
├── components/
│   └── shared/
│       └── glass-card.test.tsx
├── hooks/
│   ├── use-chat.test.ts
│   ├── use-messages.test.ts
│   └── use-settings.test.ts
└── services/
    └── embeddings.test.ts
```

### Running Tests

```bash
# Run all tests
npm run test

# Run specific test file
npm run test tests/components/shared/glass-card.test.tsx

# Run with coverage
npm run test:coverage
```

---

## 📚 Documentation

| Category | Documents |
|----------|-----------|
| **Getting Started** | [Installation](./docs/01-getting-started/installation.md) • [Development](./docs/01-getting-started/development.md) |
| **Architecture** | [Overview](./docs/ARCHITECTURE.md) • [Diagrams](./docs/02-architecture/diagrams.md) |
| **Core Features** | [Vector Embeddings](./docs/03-core-features/vector-embeddings/overview.md) • [AI Assistant](./docs/03-core-features/ai-assistant/overview.md) |
| **Infrastructure** | [Python Worker](./docs/04-infrastructure/python-worker/overview.md) • [Database](./docs/04-infrastructure/database/overview.md) |
| **Deployment** | [Guide](./docs/DEPLOYMENT.md) • [Overview](./docs/05-deployment/overview.md) • [Docker Scripts](./docs/05-deployment/docker-scripts.md) |
| **API Reference** | [Complete API Docs](./docs/API-REFERENCE.md) |
| **Contributing** | [Guide](./docs/06-contributing/guide.md) |
| **Reference** | [Environment Variables](./docs/07-reference/environment-variables.md) • [Commands](./docs/07-reference/commands.md) |
| **Security** | [Security Features](./docs/SECURITY.md) |

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
