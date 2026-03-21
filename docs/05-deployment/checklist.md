# Deployment Checklist

Complete checklist for deploying Collabryx to production.

## Pre-Deployment

### Environment Setup

- [ ] **Supabase Project**
  - [ ] Create production project
  - [ ] Enable Row Level Security (RLS) on all tables
  - [ ] Configure authentication providers
  - [ ] Set up storage buckets:
    - `post-media` (50MB max)
    - `profile-media` (10MB max)
    - `project-media` (10MB max)

- [ ] **Environment Variables**
  ```env
  # Required
  NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
  NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
  SUPABASE_SERVICE_ROLE_KEY=xxx
  NEXT_PUBLIC_APP_URL=https://collabryx.com
  
  # AI Features
  OPENAI_API_KEY=xxx (or ANTHROPIC_API_KEY)
  LLM_PROVIDER=openai (or anthropic)
  
  # Optional
  NODE_ENV=production
  ```

- [ ] **Database Setup**
  - [ ] Run `supabase/setup/99-master-all-tables.sql` (v4.1.0)
  - [ ] Verify all 34 tables created
  - [ ] Test RLS policies (100 total)
  - [ ] Verify optimistic locking functions exist
  - [ ] Verify messages.read_at column exists
  - [ ] Enable Realtime on required tables

- [ ] **Python Worker**
  - [ ] Build Docker image
  - [ ] Deploy to Render/Railway
  - [ ] Configure environment variables
  - [ ] Test health endpoint: `https://worker-url/health`

---

## Vercel Deployment

### Project Configuration

- [ ] **Connect Repository**
  - [ ] GitHub repository: `user-ahsan/collabryx`
  - [ ] Branch: `main` (for production)

- [ ] **Build Settings**
  ```
  Framework Preset: Next.js
  Node Version: 20.x
  Build Command: npm run build
  Output Directory: .next (default)
  ```

- [ ] **Environment Variables**
  - [ ] Add all required env vars from `.env.example`
  - [ ] Mark sensitive vars as "Encrypted"

- [ ] **Deploy**
  - [ ] Trigger production build
  - [ ] Monitor build logs
  - [ ] Verify deployment URL

---

### Post-Deployment Verification

#### Functional Tests

- [ ] **Authentication**
  - [ ] Login works
  - [ ] Registration works
  - [ ] Password reset works
  - [ ] Session persists
  - [ ] Logout works

- [ ] **Core Features**
  - [ ] Create post
  - [ ] Like/react to post
  - [ ] Comment on post
  - [ ] Send connection request
  - [ ] Accept connection request
  - [ ] View matches
  - [ ] Send message
  - [ ] AI chat works

- [ ] **Performance**
  - [ ] Page load < 3s
  - [ ] API response < 500ms
  - [ ] Images optimized
  - [ ] No console errors

#### Monitoring Setup

- [ ] **Error Tracking**
  - [ ] Sentry configured
  - [ ] Error boundaries working
  - [ ] Sourcemaps uploaded

- [ ] **Analytics**
  - [ ] PostHog configured
  - [ ] Events tracking:
    - User signup
    - Post creation
    - Connection requests
    - Messages sent

- [ ] **Performance**
  - [ ] Vercel Analytics enabled
  - [ ] Core Web Vitals monitoring
  - [ ] Uptime monitoring configured

---

## Python Worker Deployment

### Render Deployment

- [ ] **Create Service**
  - [ ] Type: Web Service
  - [ ] Docker: Yes
  - [ ] Region: Closest to users

- [ ] **Configuration**
  ```yaml
  name: collabryx-worker
  region: oregon
  plan: standard
  dockerContext: ./python-worker
  dockerfilePath: ./python-worker/Dockerfile
  ```

- [ ] **Environment Variables**
  ```env
  SUPABASE_URL=https://xxx.supabase.co
  SUPABASE_SERVICE_ROLE_KEY=xxx
  ALLOWED_ORIGINS=https://collabryx.com
  ```

- [ ] **Health Check**
  - [ ] Endpoint: `/health`
  - [ ] Path: `/health`
  - [ ] Expected: 200 OK

- [ ] **Auto-Deploy**
  - [ ] Connect GitHub
  - [ ] Auto-deploy on push to `main`

---

## Database Migration

### Production Migration

- [ ] **Backup**
  - [ ] Export current schema
  - [ ] Backup critical data
  - [ ] Test rollback procedure

- [ ] **Migration**
  ```sql
  -- Run in Supabase SQL Editor
  -- File: supabase/setup/99-master-all-tables.sql
  ```

- [ ] **Verification**
  - [ ] All tables exist (34 total)
  - [ ] Indexes created (103 total)
  - [ ] RLS policies active (100 total)
  - [ ] Triggers working (39 total)
  - [ ] Functions exist (46 total)
  - [ ] Optimistic locking functions work
  - [ ] Messages read_at column exists
  - [ ] Realtime enabled

- [ ] **Seed Data** (if needed)
  - [ ] Initial admin users
  - [ ] System configurations
  - [ ] Default preferences

---

## Security Hardening

### Pre-Launch Security

- [ ] **Headers**
  - [ ] Content-Security-Policy
  - [ ] X-Frame-Options
  - [ ] X-Content-Type-Options
  - [ ] Strict-Transport-Security
  - [ ] Referrer-Policy

- [ ] **Rate Limiting**
  - [ ] API rate limits configured
  - [ ] Server action limits active
  - [ ] DDoS protection enabled

- [ ] **Authentication**
  - [ ] RLS policies tested
  - [ ] Session security verified
  - [ ] CSRF protection active

- [ ] **Data Protection**
  - [ ] HTTPS enforced
  - [ ] Sensitive data encrypted
  - [ ] Input validation active
  - [ ] XSS protection verified

---

## Performance Optimization

### Pre-Launch Optimization

- [ ] **Images**
  - [ ] Next/Image used
  - [ ] WebP format enabled
  - [ ] Lazy loading active
  - [ ] CDN configured

- [ ] **Bundle**
  - [ ] Bundle size < 500KB
  - [ ] Code splitting active
  - [ ] Tree-shaking enabled
  - [ ] Unused CSS removed

- [ ] **Caching**
  - [ ] Static pages cached
  - [ ] API responses cached
  - [ ] React Query configured
  - [ ] CDN caching active

- [ ] **Database**
  - [ ] Query optimization
  - [ ] Indexes verified
  - [ ] Connection pooling configured

---

## Launch Day

### Go-Live Checklist

- [ ] **Final Tests**
  - [ ] All E2E tests passing
  - [ ] Lighthouse score > 90
  - [ ] No critical bugs
  - [ ] Team notified

- [ ] **DNS**
  - [ ] Custom domain configured
  - [ ] SSL certificate valid
  - [ ] DNS propagation complete

- [ ] **Monitoring**
  - [ ] Error tracking active
  - [ ] Analytics recording
  - [ ] Alerts configured
  - [ ] On-call schedule set

- [ ] **Communication**
  - [ ] Status page updated
  - [ ] Social media scheduled
  - [ ] Email newsletter ready
  - [ ] Support team briefed

---

## Post-Launch

### Week 1 Monitoring

- [ ] **Daily Checks**
  - [ ] Error rates < 1%
  - [ ] Performance stable
  - [ ] User feedback collected
  - [ ] Server costs monitored

- [ ] **Weekly Review**
  - [ ] User metrics analyzed
  - [ ] Performance trends
  - [ ] Bug triage
  - [ ] Feature requests logged

- [ ] **Optimization**
  - [ ] Address critical issues
  - [ ] Performance improvements
  - [ ] User experience fixes
  - [ ] Documentation updates

---

## Rollback Procedure

### Emergency Rollback

If critical issues occur:

1. **Immediate Actions**
   ```bash
   # Revert Vercel deployment
   vercel rollback [deployment-id]
   
   # Or redeploy previous version
   git checkout <previous-commit>
   git push
   ```

2. **Database Rollback**
   ```sql
   -- Restore from backup
   -- Use Supabase dashboard or CLI
   ```

3. **Communication**
   - [ ] Status page updated
   - [ ] Users notified
   - [ ] Team alerted

4. **Post-Mortem**
   - [ ] Root cause analysis
   - [ ] Fix implemented
   - [ ] Tests added
   - [ ] Deploy fix

---

## Contacts

### Support

- **Technical Issues:** tech@collabryx.com
- **Security Issues:** security@collabryx.com
- **General Support:** support@collabryx.com

### Services

- **Vercel:** https://vercel.com/dashboard
- **Supabase:** https://supabase.com/dashboard
- **Render:** https://render.com/dashboard
- **Sentry:** https://sentry.io/organizations/

---

**Last Updated:** March 15, 2026  
**Version:** 1.0.0  
**Maintained By:** DevOps Team
