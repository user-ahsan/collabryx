# Commands Reference

Complete reference for all bun scripts and commands in Collabryx.

---

## Table of Contents

- [Core Commands](#core-commands)
- [Development Commands](#development-commands)
- [Build Commands](#build-commands)
- [Utility Commands](#utility-commands)
- [Git Commands](#git-commands)
- [Supabase Commands](#supabase-commands)

---

## Core Commands

### `bun run dev`

Start the Next.js development server.

```bash
bun run dev
```

**Details:**
- **Port:** 3000 (default)
- **Features:** Hot Module Replacement (HMR), source maps, detailed errors
- **URL:** http://localhost:3000

**Custom Port:**
```bash
PORT=3001 bun run dev
```

---

### `bun run dev:skip-docker`

Start the Next.js development server without Docker dependency checks.

```bash
bun run dev:skip-docker
```

**Details:**
- Skips Docker health check
- Useful when running without Docker
- Starts faster than `bun run dev`

---

### `bun run build`

Create a production build of the application.

```bash
bun run build
```

**Details:**
- Compiles TypeScript
- Optimizes bundles
- Generates static files
- Output: `.next/` directory

**Expected Output:**
```
✓ Compiled successfully
✓ Generating static pages
✓ Collecting page data
✓ Finalizing page optimization
✓ Build completed
```

---

### `bun run start`

Start the production server (after build).

```bash
bun run start
```

**Details:**
- Runs on port 3000
- Uses production build
- Requires `bun run build` first

---

### `bun run lint`

Run ESLint for code quality checking.

```bash
bun run lint
```

**Details:**
- Checks TypeScript/TSX files
- Enforces coding standards
- Reports errors and warnings

**Auto-fix:**
```bash
bun run lint -- --fix
```

---

### `bun run perf:budget`

Check the performance budget for the production build.

```bash
bun run perf:budget
```

**Details:**
- Analyzes bundle size against defined thresholds
- Reports any budget violations
- Requires production build first

---

### `bun run perf:budget:ci`

Check performance budget in CI mode (strict).

```bash
bun run perf:budget:ci
```

**Details:**
- Same as `perf:budget` but exits with error on violations
- Used in CI pipelines
- Fails the pipeline if budget is exceeded


## Build Commands

The only build command available is `bun run build`, documented above in Core Commands.

---

## Utility Commands

### `bun run typecheck`

Run TypeScript type checking.

```bash
bun run typecheck
```

**Details:**
- Checks all TypeScript files
- No emit (doesn't generate JS)
- Faster than full build

---

## Git Commands

### Standard Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Stage changes
git add .

# Commit with conventional commits
git commit -m "feat: add new feature"

# Push to remote
git push origin feature/your-feature-name
```

### Commit Types

| Type | Description |
|------|-------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation changes |
| `style` | Formatting, no code change |
| `refactor` | Code refactoring |
| `perf` | Performance improvement |
| `chore` | Build/config changes |

---

## Supabase Commands

### Install Supabase CLI

```bash
bun install -g supabase
```

### Login

```bash
supabase login
```

### Link Project

```bash
supabase link --project-ref your-project-ref
```

### Push Migrations

```bash
supabase db push
```

### Generate Types

```bash
supabase gen types typescript --project-id your-project-id > types/database.types.ts
```

---

## Python Worker Commands

### Start Development Server

```bash
cd python-worker
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### Install Dependencies

```bash
cd python-worker
pip install -r requirements.txt
```

---

## Docker Commands

### Build Image

```bash
docker build -t collabryx .
```

### Run Container

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  collabryx
```

### Docker Compose

Local development with the Python worker:

```bash
cd python-worker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

---

### `bun run docker:restart`

Restart all Docker services.

```bash
bun run docker:restart
```

---

### `bun run docker:clean`

Stop and remove all Docker containers, networks, and volumes created by the project.

```bash
bun run docker:clean
```

---

## Command Aliases

Add to your shell config for convenience:

### Bash/ZSH

```bash
# Add to ~/.bashrc or ~/.zshrc
alias dev='bun run dev'
alias build='bun run build'
alias lint='bun run lint'
```

### PowerShell

```powershell
# Add to profile
Set-Alias dev "bun run dev"
Set-Alias build "bun run build"
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start development | `bun run dev` |
| Skip Docker check | `bun run dev:skip-docker` |
| Build for production | `bun run build` |
| Type check | `bun run typecheck` |
| Check code quality | `bun run lint` |
| Docker up | `bun run docker:up` |
| Docker down | `bun run docker:down` |
| Docker logs | `bun run docker:logs` |
| Docker health | `bun run docker:health` |
| Performance budget | `bun run perf:budget` |

---

**Last Updated**: 2026-06-05  
**Version**: 2.1.0

[← Back to Docs](../README.md) | [Environment Variables →](./environment-variables.md)
