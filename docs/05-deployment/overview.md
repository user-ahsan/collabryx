# 🚀 Deployment Guide

Complete guide for deploying Collabryx to production environments.

---

## Table of Contents

- [Pre-Deployment Checklist](#pre-deployment-checklist)
- [Environment Setup](#environment-setup)
- [Deployment Platforms](#deployment-platforms)
- [Database Migration](#database-migration)
- [Environment Variables](#environment-variables)
- [Domain Configuration](#domain-configuration)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying to production, ensure:

### Code Quality
- [ ] All TypeScript errors resolved (`bun run build`)
- [ ] ESLint passes with no errors (`bun run lint`)
- [ ] No console.log or debug statements in production code
- [ ] All hardcoded values moved to environment variables

### Testing
- [ ] Tested on multiple browsers (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness verified
- [ ] Error boundaries functional

### Security
- [ ] Environment variables properly configured
- [ ] No secrets committed to Git
- [ ] CORS configured correctly
- [ ] Rate limiting implemented on API routes

### Performance
- [ ] Images optimized (using `next/image`)
- [ ] Bundle size analyzed
- [ ] Lazy loading implemented for heavy components
- [ ] Core Web Vitals passing

### Database

- [ ] Backup strategy in place
- [ ] RLS policies verified

---

## Environment Setup

### Production Environment Variables

Create a `.env.production` file (or configure in your hosting platform):

```env
# Required: Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-production-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-production-service-role-key

# Required: Application
NEXT_PUBLIC_APP_URL=https://yourdomain.com
NODE_ENV=production

# Required: Python Worker (Embeddings)
PYTHON_WORKER_URL=https://your-embedding-service.com

# Required: AI Providers (at least one)
AI_PROVIDER_1_NAME=openai
AI_PROVIDER_1_API_KEY=sk-prod-key
AI_PROVIDER_1_BASE_URL=https://api.openai.com/v1
AI_PROVIDER_1_MODEL=gpt-4o-mini
AI_PROVIDER_1_PRIORITY=1

# Optional: Secondary provider for failover
AI_PROVIDER_2_NAME=anthropic
AI_PROVIDER_2_API_KEY=sk-ant-prod-key
AI_PROVIDER_2_BASE_URL=https://api.anthropic.com
AI_PROVIDER_2_MODEL=claude-sonnet-4-20250514
AI_PROVIDER_2_PRIORITY=2

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

### Embeddings System Deployment

The embeddings system requires:

1. **Python Worker** - Self-hosted embedding service (Docker)
2. **Database** - pgvector extension for vector storage

**Quick Deploy:**

```bash
# Deploy Python Worker
cd python-worker
docker-compose build
docker push your-registry/collabryx-worker:latest

# Deploy to platform (see platform-specific guide)
```

See [Python Worker Deployment](../04-infrastructure/python-worker/deployment.md) and [Embeddings System](../04-infrastructure/database/embeddings.md) for detailed instructions.

---

## Deployment Platforms

### Option 1: Vercel (Recommended)

Vercel is built by the creators of Next.js and offers the best Next.js deployment experience.

#### Prerequisites
- GitHub/GitLab/Bitbucket account
- Vercel account (free tier available)

#### Step-by-Step Deployment

1. **Push code to Git repository**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to https://vercel.com
   - Click "New Project"
   - Import your Git repository
   - Select the repository

3. **Configure Build Settings**
   - Framework Preset: **Next.js** (auto-detected)
   - Build Command: `bun run build`
   - Output Directory: `.next`
   - Install Command: `bun install`

4. **Add Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add all variables from `.env.production`
   - Select environment: Production

5. **Deploy**
   - Click "Deploy"
   - Wait for build to complete (~2-5 minutes)
   - Visit your deployed site at `https://your-project.vercel.app`

#### Custom Domain Setup (Vercel)

1. **Add Domain**
   - Go to Settings → Domains
   - Add your custom domain (e.g., `collabryx.com`)

2. **Configure DNS**
   - Add records as shown in Vercel dashboard
   - **Type A**: `76.76.21.21`
   - **Type CNAME**: `cname.vercel-dns.com`

3. **SSL Certificate**
   - Automatically provisioned by Vercel
   - Usually takes 1-2 minutes

#### Automatic Deployments

- **Production**: Push to `main` branch
- **Preview**: Push to any other branch
- Pull requests get automatic preview deployments

---

### Option 2: Self-Hosted (VPS/Docker)

#### Using Docker

1. **Create Dockerfile**

```dockerfile
FROM oven/bun:1 AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY bun.lock package.json ./
RUN bun install --frozen-lockfile

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
RUN bun run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

2. **Update `next.config.ts`**

```typescript
const nextConfig = {
  output: 'standalone',
};

export default nextConfig;
```

3. **Build and Run**

```bash
# Build Docker image
docker build -t collabryx .

# Run container
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_SUPABASE_URL=your-url \
  -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
  collabryx
```

#### Using PM2 (Process Manager)

```bash
# Install PM2
bun install -g pm2

# Build the application
bun run build

# Start with PM2
pm2 start bun --name "collabryx" -- run start

# Save PM2 configuration
pm2 save

# Setup auto-restart on server reboot
pm2 startup
```

---

## Database Migration

### Using Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Run migration files from `supabase/migrations/` in order
4. Verify tables created correctly

### Using Supabase CLI

```bash
# Install Supabase CLI
bun install -g supabase

# Login
supabase login

# Link to production project
supabase link --project-ref your-production-ref

# Push migrations
supabase db push

# Verify migration
supabase db diff
```

### Manual Migration

```bash
# Connect to production database
psql postgresql://[CONNECTION_STRING]

# Run migration file
\i supabase/migrations/20240101000000_initial.sql

# Verify
\dt
```

---

## Environment Variables

### Platform-Specific Configuration

#### Vercel
Settings → Environment Variables → Add

#### Docker
Pass via `-e` flag or `.env` file with `docker-compose`

### Production Environment Variables

```env
# Required: Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Required: Application
NEXT_PUBLIC_APP_URL=
NODE_ENV=production

# Required: Python Worker (Embeddings)
PYTHON_WORKER_URL=

# Required: AI Providers (Universal Provider System)
# Configure at least one provider. For production, configure 2+ for failover.
AI_PROVIDER_1_NAME=
AI_PROVIDER_1_API_KEY=
AI_PROVIDER_1_BASE_URL=
AI_PROVIDER_1_MODEL=
AI_PROVIDER_1_PRIORITY=1

# Optional: Secondary provider
# AI_PROVIDER_2_NAME=
# AI_PROVIDER_2_API_KEY=
# AI_PROVIDER_2_BASE_URL=
# AI_PROVIDER_2_MODEL=
# AI_PROVIDER_2_PRIORITY=2

# Optional
```

### Python Worker Deployment

The Python worker generates vector embeddings for semantic matching. Deploy before the Next.js app.

**Steps:**

1. **Build Docker image:**
   ```bash
   cd python-worker
   docker-compose build
   ```

2. **Deploy to platform:**
   - **Railway:** Connect GitHub, deploy from `python-worker/` directory
   - **VPS:** Run `docker-compose up -d`

3. **Configure environment variables:**
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ALLOWED_ORIGINS=https://your-app.com
   ```

4. **Add to Next.js environment:**
   ```env
   PYTHON_WORKER_URL=https://your-worker-url.com
   ```

5. **Verify health:**
   ```bash
   curl https://your-worker-url.com/health
   ```

See [Python Worker Deployment Guide](../04-infrastructure/python-worker/deployment.md) for complete instructions.

---

## Domain Configuration

### DNS Settings

Point your domain to your hosting provider:

#### For Vercel
```
Type: A
Name: @
Value: 76.76.21.21

Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

### SSL/TLS Certificate

Most platforms automatically provision SSL certificates via Let's Encrypt:
- **Vercel**: Automatic
- **Self-hosted**: Use Certbot

```bash
# Install Certbot (Ubuntu)
sudo apt install certbot

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## CI/CD Pipeline

### GitHub Actions

Actual CI/CD configurations are in `.github/workflows/`:

- `security.yml` - Security scanning

These are automatically triggered on push and pull request events.

---

## Troubleshooting

### Build Failures

#### Issue: Type errors during build

```bash
# Check for errors locally
bun run build

# Clear cache and rebuild
rm -rf .next
bun run build
```

#### Issue: Environment variables not found

- Verify all required vars are set in platform
- Check variable names (no typos)
- Restart deployment after adding vars

### Runtime Errors

#### Issue: API routes return 500 errors

Check logs:
```bash
# Vercel
vercel logs

# PM2
pm2 logs collabryx
```

#### Issue: Supabase connection timeout

- Verify Supabase URL is correct
- Check Supabase project is running
- Verify API keys are production keys
- Check network/firewall rules

### Performance Issues

#### Issue: Slow page loads

1. **Analyze bundle size**
   ```bash
   bun run build
   # Check .next/stats.json
   ```

2. **Check images**
   - Ensure using `next/image`
   - Verify images are optimized

3. **Review Core Web Vitals**
   - Use Lighthouse
   - Check performance scores

### Database Issues

#### Issue: Database connection errors

- Verify connection pooling settings
- Check RLS policies not blocking queries
- Review database logs in Supabase

#### Issue: Slow queries

- Add indexes to frequently queried columns
- Use `EXPLAIN ANALYZE` to debug
- Check query patterns in Supabase dashboard

---

## Post-Deployment

### Checklist

- [ ] Test all major features in production
- [ ] Configure backups
- [ ] Document deployment process
- [ ] Share deployment URLs with team

### Monitoring

**Daily:**
- Check error logs

**Weekly:**
- Review performance metrics
- Check uptime stats
- Update dependencies (security patches)

**Monthly:**
- Full security audit
- Database optimization
- Review and rotate API keys

---

## Rollback Strategy

### Vercel Rollback

1. Go to Deployments tab
2. Find previous successful deployment
3. Click "..." → "Promote to Production"

### Git Rollback

```bash
# Revert to previous commit
git revert HEAD

# Or reset to specific commit
git reset --hard <commit-hash>
git push --force origin main
```

### Database Rollback

```bash
# Create backup before migration
pg_dump -h [HOST] -U [USER] -d [DB] > backup.sql

# Restore if needed
psql -h [HOST] -U [USER] -d [DB] < backup.sql
```

---

## Additional Resources

- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)
- [Vercel Documentation](https://vercel.com/docs)
- [Supabase Production Checklist](https://supabase.com/docs/guides/platform/going-into-prod)

---

[← Back to README](../README.md) | [Contributing Guide →](../06-contributing/guide.md)
