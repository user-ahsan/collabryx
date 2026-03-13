# Commands Reference

Complete reference for all npm scripts and commands in Collabryx.

---

## Table of Contents

- [Core Commands](#core-commands)
- [Development Commands](#development-commands)
- [Testing Commands](#testing-commands)
- [Build Commands](#build-commands)
- [Utility Commands](#utility-commands)
- [Git Commands](#git-commands)
- [Supabase Commands](#supabase-commands)

---

## Core Commands

### `npm run dev`

Start the Next.js development server.

```bash
npm run dev
```

**Details:**
- **Port:** 3000 (default)
- **Features:** Hot Module Replacement (HMR), source maps, detailed errors
- **URL:** http://localhost:3000

**Custom Port:**
```bash
PORT=3001 npm run dev
```

---

### `npm run build`

Create a production build of the application.

```bash
npm run build
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

### `npm run start`

Start the production server (after build).

```bash
npm run start
```

**Details:**
- Runs on port 3000
- Uses production build
- Requires `npm run build` first

---

### `npm run lint`

Run ESLint for code quality checking.

```bash
npm run lint
```

**Details:**
- Checks TypeScript/TSX files
- Enforces coding standards
- Reports errors and warnings

**Auto-fix:**
```bash
npm run lint -- --fix
```

---

## Testing Commands

### `npm run test`

Run the Vitest test suite.

```bash
npm run test
```

**Details:**
- Runs all tests once
- Outputs results to console
- Exits with error code on failure

---

### `npm run test:watch`

Run tests in watch mode (development).

```bash
npm run test:watch
```

**Details:**
- Watches for file changes
- Re-runs affected tests
- Interactive UI

**Keyboard Shortcuts:**
- `a` - Run all tests
- `f` - Run failed tests
- `p` - Filter by filename
- `t` - Filter by test name
- `q` - Quit

---

### `npm run test:coverage`

Run tests with coverage report.

```bash
npm run test:coverage
```

**Output:**
- Coverage report in console
- HTML report in `coverage/` directory
- LCOV report for CI integration

**Coverage Thresholds:**
- Statements: 80%
- Branches: 75%
- Functions: 80%
- Lines: 80%

---

### `npm run test:ui`

Run tests with Vitest UI dashboard.

```bash
npm run test:ui
```

**Details:**
- Opens browser UI at http://localhost:51204
- Interactive test runner
- Visual coverage
- Filter and search tests

---

### `npm run test:components`

Run component tests only.

```bash
npm run test:components
```

**Pattern:** `tests/components/**/*.test.tsx`

---

### `npm run test:hooks`

Run hook tests only.

```bash
npm run test:hooks
```

**Pattern:** `tests/hooks/**/*.test.ts`

---

### `npm run test:services`

Run service tests only.

```bash
npm run test:services
```

**Pattern:** `tests/services/**/*.test.ts`

---

## Build Commands

### `npm run build:analyze`

Analyze bundle size.

```bash
npm run build:analyze
```

**Details:**
- Generates bundle analysis report
- Shows largest dependencies
- Helps identify optimization opportunities

**Output:** `.next/analyze/`

---

### `npm run build:vercel`

Build for Vercel deployment.

```bash
npm run build:vercel
```

**Details:**
- Uses Vercel build configuration
- Optimized for Vercel platform

---

## Utility Commands

### `npm run clean`

Clean build artifacts and caches.

```bash
npm run clean
```

**Removes:**
- `.next/` directory
- `node_modules/.cache/`
- `*.tsbuildinfo` files

---

### `npm run typecheck`

Run TypeScript type checking.

```bash
npm run typecheck
```

**Details:**
- Checks all TypeScript files
- No emit (doesn't generate JS)
- Faster than full build

---

### `npm run format`

Format code with Prettier.

```bash
npm run format
```

**Details:**
- Formats all supported files
- Uses project Prettier config

**Check Only:**
```bash
npm run format:check
```

---

### `npm run prepare`

Run Husky setup for git hooks.

```bash
npm run prepare
```

**Details:**
- Installs git hooks
- Enables pre-commit linting
- Auto-run on `npm install`

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
| `test` | Adding tests |
| `chore` | Build/config changes |

---

## Supabase Commands

### Install Supabase CLI

```bash
npm install -g supabase
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

### Run Tests

```bash
cd python-worker
python test_embeddings.py
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

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f
```

---

## Command Aliases

Add to your shell config for convenience:

### Bash/ZSH

```bash
# Add to ~/.bashrc or ~/.zshrc
alias dev='npm run dev'
alias build='npm run build'
alias test='npm run test'
alias lint='npm run lint'
```

### PowerShell

```powershell
# Add to profile
Set-Alias dev "npm run dev"
Set-Alias build "npm run build"
Set-Alias test "npm run test"
```

---

## Quick Reference

| Task | Command |
|------|---------|
| Start development | `npm run dev` |
| Build for production | `npm run build` |
| Run tests | `npm run test` |
| Run tests (watch) | `npm run test:watch` |
| Check code quality | `npm run lint` |
| Format code | `npm run format` |
| Type check | `npm run typecheck` |
| Clean build | `npm run clean` |

---

**Last Updated**: 2026-03-14  
**Version**: 2.0.0

[← Back to Docs](../README.md) | [Environment Variables →](./environment-variables.md)
