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

### Analytics

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_GA_ID` | Google Analytics ID | `G-XXXXXXXXXX` |
| `NEXT_PUBLIC_VERCEL_ANALYTICS_ID` | Vercel Analytics ID | `your-analytics-id` |

### Error Tracking

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN for error tracking | `https://...@sentry.io/...` |

### Feature Flags

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_ENABLE_AI_FEATURES` | Enable AI features | `true` |
| `NEXT_PUBLIC_MAINTENANCE_MODE` | Enable maintenance mode | `false` |

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

# Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
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
npm run dev

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

#### Netlify

1. Go to **Site Settings**
2. Navigate to **Environment Variables**
3. Add each variable
4. Deploy for changes to take effect

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

### Edge Functions

```typescript
// Access via Deno.env
const supabaseUrl = Deno.env.get('SUPABASE_URL')
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

# Analytics (Optional)
# NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
# NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
```

---

**Last Updated**: 2026-03-14  
**Version**: 2.0.0

[← Back to Docs](../README.md) | [Installation Guide →](../01-getting-started/installation.md)
