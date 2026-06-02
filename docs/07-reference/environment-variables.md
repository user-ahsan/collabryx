# Environment Variables Reference

Complete reference for all environment variables used in Collabryx.

---

## Table of Contents

- [Required Variables](#required-variables)
- [Optional Variables](#optional-variables)
- [Development vs Production](#development-vs-production)
- [Security Notes](#security-notes)
- [Setup Guide](#setup-guide)

---

## Required Variables

These variables **must** be set for the application to function.

### Supabase Configuration

| Variable | Description | Example | Public |
|----------|-------------|---------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL | `https://xyz.supabase.co` | ✅ Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous/public key | `eyJhbG...` | ✅ Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (secret) | `eyJhbG...` | ❌ No |

**Getting Supabase Keys:**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **API**
4. Copy the required keys

---

## Optional Variables

These variables enable additional features or customization.

### Application

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3000` | `https://collabryx.com` |
| `NODE_ENV` | Node environment | `development` | `production` |

### Python Worker (Embeddings)

| Variable | Description | Example | Required For |
|----------|-------------|---------|--------------|
| `PYTHON_WORKER_URL` | Embedding service URL | `http://localhost:8000` | Semantic matching |

### AI Providers (Universal Provider System)

Collabryx uses a **multi-provider registry** with automatic failover. You can configure one or more AI providers using numbered environment variables.

#### Provider Configuration Pattern

Each provider is configured with a set of variables using a numeric index (`N`):

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `AI_PROVIDER_N_NAME` | Provider display name | ✅ Yes | `openai`, `groq`, `ollama` |
| `AI_PROVIDER_N_API_KEY` | API key for authentication | ✅ Yes | `sk-...` |
| `AI_PROVIDER_N_BASE_URL` | API base URL | ✅ Yes | `https://api.openai.com/v1` |
| `AI_PROVIDER_N_MODEL` | Model identifier | ✅ Yes | `gpt-4o-mini`, `llama-3.1-70b` |
| `AI_PROVIDER_N_MAX_TOKENS` | Maximum response tokens | No (default: 4096) | `4096` |
| `AI_PROVIDER_N_TEMPERATURE` | Sampling temperature (0-2) | No (default: 0.7) | `0.7` |
| `AI_PROVIDER_N_TIMEOUT` | Request timeout in ms | No (default: 60000) | `60000` |
| `AI_PROVIDER_N_PRIORITY` | Failover priority (lower = higher) | No (default: index) | `1` |

> **Note:** Replace `N` with a number starting from 1. Providers are auto-registered in order.

#### Provider Auto-Registration

Providers are automatically detected and registered at startup. The system scans for `AI_PROVIDER_1_NAME`, `AI_PROVIDER_2_NAME`, etc., stopping at the first missing name.

**Provider Type Detection:**
- If `BASE_URL` contains `anthropic.com` → uses native Anthropic API
- All other URLs → uses OpenAI-compatible format

#### Legacy Variables (Backward Compatible)

| Variable | Description | Status |
|----------|-------------|--------|
| `OPENAI_API_KEY` | OpenAI API key | ✅ Still supported |
| `ANTHROPIC_API_KEY` | Anthropic API key | ✅ Still supported |

> Legacy variables are used as fallback if no `AI_PROVIDER_N_*` variables are configured.

#### Example: Single Provider (OpenAI)

```env
AI_PROVIDER_1_NAME=openai
AI_PROVIDER_1_API_KEY=sk-proj-abc123...
AI_PROVIDER_1_BASE_URL=https://api.openai.com/v1
AI_PROVIDER_1_MODEL=gpt-4o-mini
AI_PROVIDER_1_PRIORITY=1
```

#### Example: Multiple Providers with Failover

```env
# Primary: OpenAI (priority 1)
AI_PROVIDER_1_NAME=openai
AI_PROVIDER_1_API_KEY=sk-proj-abc123...
AI_PROVIDER_1_BASE_URL=https://api.openai.com/v1
AI_PROVIDER_1_MODEL=gpt-4o-mini
AI_PROVIDER_1_PRIORITY=1

# Secondary: Groq (priority 2)
AI_PROVIDER_2_NAME=groq
AI_PROVIDER_2_API_KEY=gsk_xyz789...
AI_PROVIDER_2_BASE_URL=https://api.groq.com/openai/v1
AI_PROVIDER_2_MODEL=llama-3.1-70b-versatile
AI_PROVIDER_2_PRIORITY=2

# Tertiary: Local Ollama (priority 3)
AI_PROVIDER_3_NAME=ollama
AI_PROVIDER_3_BASE_URL=http://localhost:11434/v1
AI_PROVIDER_3_MODEL=llama3.1
AI_PROVIDER_3_PRIORITY=3
```

#### Example: Anthropic Native Provider

```env
AI_PROVIDER_1_NAME=anthropic
AI_PROVIDER_1_API_KEY=sk-ant-api03-...
AI_PROVIDER_1_BASE_URL=https://api.anthropic.com
AI_PROVIDER_1_MODEL=claude-sonnet-4-20250514
AI_PROVIDER_1_MAX_TOKENS=8192
AI_PROVIDER_1_PRIORITY=1
```

#### Example: Together AI

```env
AI_PROVIDER_1_NAME=together
AI_PROVIDER_1_API_KEY=your-together-key
AI_PROVIDER_1_BASE_URL=https://api.together.xyz/v1
AI_PROVIDER_1_MODEL=meta-llama/Llama-3.1-70B-Instruct-Turbo
AI_PROVIDER_1_PRIORITY=1
```

### Development

| Variable | Description | Default |
|----------|-------------|---------|
| `SKIP_EMAIL_VERIFICATION` | Bypass email verification (server-side) | `false` |
| `NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION` | Bypass email verification (client-side) | `false` |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_ENABLE_AI_FEATURES` | Enable AI features | `true` |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | Enable maintenance mode | `false` |

### Performance Budget

| Variable | Description | Default |
|----------|-------------|---------|
| `PERF_BUDGET_BUNDLE_KB` | Max bundle size in KB | `500` |
| `PERF_BUDGET_LCP_MS` | Max LCP in ms | `2500` |

### Development

| Variable | Description | Type | Default |
|----------|-------------|------|---------|
| `SKIP_EMAIL_VERIFICATION` | Skips email verification requirement in development (server-side) | `"true"` or `"false"` | `false` |
| `NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION` | Skips email verification (client-side; use instead of `SKIP_EMAIL_VERIFICATION` for client components) | `"true"` or `"false"` | `false` |

> ⚠️ **WARNING:** Both `SKIP_EMAIL_VERIFICATION` and `NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION` should **NEVER** be used in production. They bypass email confirmation, allowing unverified accounts to access the platform.

**When `SKIP_EMAIL_VERIFICATION=true` (or `NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION=true`):**
- Registration redirects new users to `/dashboard` instead of `/verify-email`
- Login API returns `email_verified: true` regardless of Supabase's `email_confirmed_at` status
- Login form accepts unverified accounts
- Middleware allows access to protected routes without email confirmation
- A startup warning is logged to the console

---

## Development vs Production

### Development (.env.local)

```env
# Supabase (Development Project)
NEXT_PUBLIC_SUPABASE_URL=https://dev-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-anon-key
SUPABASE_SERVICE_ROLE_KEY=dev-service-key

# Python Worker (Local)
PYTHON_WORKER_URL=http://localhost:8000

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true

# AI Provider (Development - single provider)
AI_PROVIDER_1_NAME=openai
AI_PROVIDER_1_API_KEY=sk-dev-key
AI_PROVIDER_1_BASE_URL=https://api.openai.com/v1
AI_PROVIDER_1_MODEL=gpt-4o-mini
AI_PROVIDER_1_PRIORITY=1

# Development (optional - skip email verification locally)
# SKIP_EMAIL_VERIFICATION=true
# NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION=true  # client-side alternative

```

### Production (.env.production)

```env
# Supabase (Production Project)
NEXT_PUBLIC_SUPABASE_URL=https://prod-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-anon-key
SUPABASE_SERVICE_ROLE_KEY=prod-service-key

# Python Worker (Deployed Service)
PYTHON_WORKER_URL=https://embedding-service.railway.app

# App
NEXT_PUBLIC_APP_URL=https://collabryx.com
NODE_ENV=production

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_MAINTENANCE_MODE=false

# AI Providers (Production - multi-provider with failover)
AI_PROVIDER_1_NAME=openai
AI_PROVIDER_1_API_KEY=sk-prod-key
AI_PROVIDER_1_BASE_URL=https://api.openai.com/v1
AI_PROVIDER_1_MODEL=gpt-4o-mini
AI_PROVIDER_1_PRIORITY=1

AI_PROVIDER_2_NAME=anthropic
AI_PROVIDER_2_API_KEY=sk-ant-prod-key
AI_PROVIDER_2_BASE_URL=https://api.anthropic.com
AI_PROVIDER_2_MODEL=claude-sonnet-4-20250514
AI_PROVIDER_2_PRIORITY=2

# Development (optional - skip email verification locally)
# SKIP_EMAIL_VERIFICATION=true
# NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION=true  # client-side alternative

```

---

## Security Notes

### ⚠️ Critical Security Rules

1. **Never commit `.env.local` to Git**
   - It's in `.gitignore` by default
   - Use `.env.example` for templates

2. **Protect Service Role Key**
   - `SUPABASE_SERVICE_ROLE_KEY` bypasses RLS
   - Only use in server-side code
   - Never expose to browser

3. **Use Separate Projects**
   - Development Supabase project for dev
   - Production Supabase project for prod
   - Never use production keys in development

4. **Rotate Keys Regularly**
   - Rotate service role keys every 90 days
   - Update immediately if compromised

### ✅ Best Practices

```bash
# Create .env.example (safe to commit)
cp .env.local .env.example

# Remove actual values
cat > .env.example << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
EOF

# Add to Git
git add .env.example
git commit -m "docs: add environment example"
```

---

## Setup Guide

### Step 1: Create .env.local

```bash
# In project root
touch .env.local

# Or copy example
cp .env.example .env.local
```

### Step 2: Add Variables

Edit `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 3: Verify

```bash
# Start development server
bun run dev

# Check for errors
# If variables are missing, you'll see connection errors
```

### Step 4: Set in Production

#### Vercel

1. Go to project settings
2. Navigate to **Environment Variables**
3. Add each variable
4. Select environment (Production)
5. Save

> **Note:** Netlify is not used. Deploy via Vercel or Docker instead.

#### Docker

```bash
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  -e SUPABASE_SERVICE_ROLE_KEY=your-service-key \
  collabryx
```

---

## Troubleshooting

### Issue: "Invalid Supabase URL"

**Cause:** Environment variable not set or malformed

**Solution:**
1. Check `.env.local` exists in project root
2. Verify no extra spaces or quotes
3. Restart development server
4. Check variable name spelling

### Issue: "Authentication failed"

**Cause:** Wrong API keys or keys from wrong project

**Solution:**
1. Verify keys from Supabase Dashboard → Settings → API
2. Ensure using correct project (dev vs prod)
3. Check service role key is set (not just anon key)

### Issue: "Environment variables not working"

**Cause:** Missing `NEXT_PUBLIC_` prefix for client variables

**Solution:**
- Client-side variables **must** have `NEXT_PUBLIC_` prefix
- Server-side variables should **not** have the prefix

```env
# ✅ Correct
NEXT_PUBLIC_SUPABASE_URL=...  # Used in browser
SUPABASE_SERVICE_ROLE_KEY=...  # Server only

# ❌ Wrong
NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY=...  # Exposed to browser!
```

---

## Variable Usage by Location

### Client Components

```typescript
// Can access NEXT_PUBLIC_ variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
```

### Server Components

```typescript
// Can access all variables
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const appUrl = process.env.NEXT_PUBLIC_APP_URL
```

### API Routes

```typescript
// Can access all variables
export async function POST(request: NextRequest) {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  // ...
}
```

---

## Complete Example

### .env.local (Development)

```env
# ======================================
# Collabryx Environment Configuration
# ======================================

# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://abcdefgh.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Python Worker (Optional)
PYTHON_WORKER_URL=http://localhost:8000

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development

# Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_MAINTENANCE_MODE=false

# AI Providers (Universal Provider System)
AI_PROVIDER_1_NAME=openai
AI_PROVIDER_1_API_KEY=sk-proj-abc123...
AI_PROVIDER_1_BASE_URL=https://api.openai.com/v1
AI_PROVIDER_1_MODEL=gpt-4o-mini
AI_PROVIDER_1_PRIORITY=1

# Development (optional - skip email verification locally)
# SKIP_EMAIL_VERIFICATION=true
# NEXT_PUBLIC_SKIP_EMAIL_VERIFICATION=true  # client-side alternative

```

---

**Last Updated**: 2026-06-02  
**Version**: 3.0.0

[← Back to Docs](../README.md) | [Installation Guide →](../01-getting-started/installation.md)
