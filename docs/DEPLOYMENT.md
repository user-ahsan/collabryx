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
- [Monitoring & Analytics](#monitoring--analytics)
- [CI/CD Pipeline](#cicd-pipeline)
- [Troubleshooting](#troubleshooting)

---

## Pre-Deployment Checklist

Before deploying to production, ensure:

### Code Quality
- [ ] All TypeScript errors resolved (`npm run build`)
- [ ] ESLint passes with no errors (`npm run lint`)
- [ ] No console.log or debug statements in production code
- [ ] All hardcoded values moved to environment variables

### Testing
- [ ] Manual testing completed on all major features
- [ ] Tested on multiple browsers (Chrome, Firefox, Safari)
- [ ] Mobile responsiveness verified
- [ ] Error boundaries functional

### Security
- [ ] Environment variables properly configured
- [ ] No secrets committed to Git
- [ ] Supabase RLS policies enabled and tested
- [ ] CORS configured correctly
- [ ] Rate limiting implemented on API routes

### Performance
- [ ] Images optimized (using `next/image`)
- [ ] Bundle size analyzed
- [ ] Lazy loading implemented for heavy components
- [ ] Core Web Vitals passing

### Database
- [ ] All migrations tested
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

# Optional: Analytics
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_VERCEL_ANALYTICS_ID=your-analytics-id

# Optional: Error Tracking
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn

# Optional: Feature Flags
NEXT_PUBLIC_ENABLE_AI_FEATURES=true
NEXT_PUBLIC_MAINTENANCE_MODE=false
```

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
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

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

### Option 2: Netlify

#### Quick Deploy

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login to Netlify
netlify login

# Initialize and deploy
netlify init
netlify deploy --prod
```

#### Configuration (`netlify.toml`)

```toml
[build]
  command = "npm run build"
  publish = ".next"

[[plugins]]
  package = "@netlify/plugin-nextjs"
```

---

### Option 3: Self-Hosted (VPS/Docker)

#### Using Docker

1. **Create Dockerfile**

```dockerfile
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables
ENV NEXT_TELEMETRY_DISABLED 1
RUN npm run build

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
npm install -g pm2

# Build the application
npm run build

# Start with PM2
pm2 start npm --name "collabryx" -- start

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
npm install -g supabase

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

#### Netlify
Site Settings → Environment Variables → Add

#### Docker
Pass via `-e` flag or `.env` file with `docker-compose`

### Production Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=

# Optional
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_SENTRY_DSN=
```

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

#### For Netlify
```
Type: A
Name: @
Value: 75.2.60.5

Type: CNAME
Name: www
Value: your-site.netlify.app
```

### SSL/TLS Certificate

Most platforms automatically provision SSL certificates via Let's Encrypt:
- **Vercel**: Automatic
- **Netlify**: Automatic
- **Self-hosted**: Use Certbot

```bash
# Install Certbot (Ubuntu)
sudo apt install certbot

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## Monitoring & Analytics

### Google Analytics

1. Create GA4 property
2. Add tracking ID to `.env.production`:
   ```env
   NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
   ```

### Vercel Analytics

Built-in for Vercel deployments:
```bash
npm install @vercel/analytics
```

Add to `app/layout.tsx`:
```typescript
import { Analytics } from '@vercel/analytics/react';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
```

### Error Tracking (Sentry)

1. **Install Sentry**
   ```bash
   npm install @sentry/nextjs
   ```

2. **Initialize**
   ```bash
   npx @sentry/wizard@latest -i nextjs
   ```

3. **Add DSN to environment**
   ```env
   NEXT_PUBLIC_SENTRY_DSN=your-dsn-here
   ```

### Uptime Monitoring

Recommended tools:
- [UptimeRobot](https://uptimerobot.com/) (Free)
- [Pingdom](https://www.pingdom.com/)
- [StatusCake](https://www.statuscake.com/)

---

## CI/CD Pipeline

### GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Build
        run: npm run build
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
          vercel-args: '--prod'
```

### Environment Secrets

Add to GitHub repository:
Settings → Secrets and variables → Actions → New repository secret

Required secrets:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `VERCEL_TOKEN`
- `ORG_ID`
- `PROJECT_ID`

---

## Troubleshooting

### Build Failures

#### Issue: Type errors during build

```bash
# Check for errors locally
npm run build

# Clear cache and rebuild
rm -rf .next
npm run build
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

# Netlify
netlify logs

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
   npm run build
   # Check .next/stats.json
   ```

2. **Check images**
   - Ensure using `next/image`
   - Verify images are optimized

3. **Review Core Web Vitals**
   - Use Vercel Analytics
   - Check Lighthouse scores

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
- [ ] Verify analytics tracking works
- [ ] Check error monitoring is active
- [ ] Set up uptime monitoring
- [ ] Configure backups
- [ ] Document deployment process
- [ ] Share deployment URLs with team

### Monitoring

**Daily:**
- Check error logs
- Review analytics

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

**Need help?** Check [Development Guide](./DEVELOPMENT.md) or open an issue.

[← Back to README](../README.md) | [Contributing Guide →](./CONTRIBUTING.md)
