<div align="center">

# 🚀 Collabryx

**Next-Generation Collaborative Platform with AI-Powered Features**

[![Next.js](https://img.shields.io/badge/Next.js-16.0-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Enabled-green?style=flat-square&logo=supabase)](https://supabase.com/)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react)](https://react.dev/)

</div>

---

## 📖 Overview

**Collabryx** is a cutting-edge collaborative platform built with modern web technologies. It combines powerful real-time collaboration features with AI integration, stunning 3D visualizations, and a premium user experience designed to wow users from the first interaction.

### ✨ Key Features

- 🤖 **AI-Powered Collaboration** - Intelligent assistance and automation
- 🌍 **Interactive 3D Visualizations** - Powered by Three.js and React Three Fiber
- 🔐 **Secure Authentication** - Supabase Auth with Row Level Security
- ⚡ **Real-time Updates** - Live collaboration and data synchronization
- 🎨 **Premium UI/UX** - Modern design with smooth animations and micro-interactions
- 📱 **Responsive Design** - Seamless experience across all devices
- 🌙 **Dark Mode Support** - Eye-friendly theme switching

---

## 🏗️ Tech Stack

### Core Framework
- **[Next.js 16](https://nextjs.org/)** - React framework with App Router
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type-safe development
- **[React 19.2](https://react.dev/)** - Latest React with Server Components

### Backend & Database
- **[Supabase](https://supabase.com/)** - PostgreSQL database, Authentication, and Real-time subscriptions
- **[React Query](https://tanstack.com/query/latest)** - Powerful server state management

### UI & Styling
- **[Tailwind CSS 4](https://tailwindcss.com/)** - Utility-first CSS framework
- **[Radix UI](https://www.radix-ui.com/)** - Accessible component primitives
- **[Framer Motion](https://www.framer.com/motion/)** - Production-ready animations
- **[shadcn/ui](https://ui.shadcn.com/)** - Beautiful, reusable components

### 3D & Visualization
- **[Three.js](https://threejs.org/)** - 3D graphics library
- **[@react-three/fiber](https://docs.pmnd.rs/react-three-fiber/)** - React renderer for Three.js
- **[@react-three/drei](https://github.com/pmndrs/drei)** - Useful helpers for R3F
- **[GSAP](https://gsap.com/)** - Professional-grade animation
- **[Lenis](https://lenis.darkroom.engineering/)** - Smooth scroll library

### State & Forms
- **[Zustand](https://zustand-demo.pmnd.rs/)** - Lightweight state management
- **[React Hook Form](https://react-hook-form.com/)** - Performant form validation
- **[Zod](https://zod.dev/)** - TypeScript-first schema validation

---

## 🚀 Quick Start

### Prerequisites

Ensure you have the following installed on your machine:

- **Node.js** >= 18.x (LTS recommended)
- **npm** >= 9.x or **yarn** >= 1.22.x
- **Git** >= 2.x

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

📚 **Need detailed setup instructions?** See [Installation Guide](./docs/INSTALLATION.md)

---

## 📂 Project Structure

```
collabryx/
├── app/                        # Next.js App Router
│   ├── (auth)/                # Protected routes
│   ├── (public)/              # Public routes
│   └── api/                   # API routes
├── components/
│   ├── features/              # Domain-specific components
│   ├── shared/                # Cross-feature components
│   └── ui/                    # shadcn/ui primitives
├── hooks/                     # Custom React hooks
├── lib/                       # Utilities and configurations
│   ├── supabase/             # Supabase client setup
│   └── utils/                # Helper functions
├── docs/                      # Documentation
├── public/                    # Static assets
├── supabase/                  # Supabase configuration
│   ├── functions/            # Edge functions
│   └── migrations/           # Database migrations
└── types/                     # TypeScript type definitions
```

📖 **Learn more:** [Architecture Guide](./docs/ARCHITECTURE.md)

---

## 🛠️ Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server at `localhost:3000` |
| `npm run build` | Build production-ready application |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint for code quality |

🔧 **Development workflow:** [Development Guide](./docs/DEVELOPMENT.md)

---

## 📚 Documentation

Comprehensive documentation is available in the `/docs` directory:

| Document | Description |
|----------|-------------|
| **[Installation Guide](./docs/INSTALLATION.md)** | Detailed setup instructions for new machines |
| **[Development Guide](./docs/DEVELOPMENT.md)** | Development workflow and best practices |
| **[Architecture Guide](./docs/ARCHITECTURE.md)** | Project structure and design decisions |
| **[Deployment Guide](./docs/DEPLOYMENT.md)** | Production deployment instructions |
| **[Contributing Guide](./docs/CONTRIBUTING.md)** | How to contribute to the project |
| **[API Documentation](./docs/API.md)** | API routes and usage |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](./docs/CONTRIBUTING.md) for details on:

- Code of Conduct
- Development workflow
- Coding standards
- Pull request process

---

## 🔐 Environment Variables

Required environment variables (see [Installation Guide](./docs/INSTALLATION.md) for details):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

⚠️ **Never commit `.env.local` to version control!**

---

## 📄 License

This project is private and proprietary. All rights reserved.

---

## 🆘 Support

Having issues? Check out:

- 📖 [Documentation](./docs/)
- 🐛 [Issue Tracker](https://github.com/your-username/collabryx/issues)
- 💬 [Discussions](https://github.com/your-username/collabryx/discussions)

---

<div align="center">

**Built with ❤️ using Next.js, TypeScript, and Supabase**

</div>
