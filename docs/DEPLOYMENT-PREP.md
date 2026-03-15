# Deployment Preparation Guide

## Pre-Deployment Checklist

### 1. Code Quality

- [ ] All TypeScript errors fixed ✅
- [ ] All lint errors fixed ✅
- [ ] All tests passing
- [ ] No console errors
- [ ] Build successful

### 2. Testing

- [ ] Unit tests written and passing
- [ ] E2E tests written and passing
- [ ] Manual testing completed
- [ ] Cross-browser testing done
- [ ] Mobile responsive verified

### 3. Performance

- [ ] Lighthouse score > 90
- [ ] Bundle size < 500KB
- [ ] Images optimized
- [ ] Caching configured
- [ ] Core Web Vitals passing

### 4. Security

- [ ] RLS policies tested
- [ ] Input validation active
- [ ] Rate limiting configured
- [ ] Environment variables secured
- [ ] HTTPS enforced

### 5. Monitoring

- [ ] Sentry configured
- [ ] PostHog configured
- [ ] Vercel Analytics enabled
- [ ] Error tracking tested
- [ ] Alerts configured

### 6. Documentation

- [ ] API reference complete ✅
- [ ] Deployment checklist created ✅
- [ ] README updated
- [ ] CHANGELOG maintained
- [ ] Contributing guide updated

---

## Deployment Steps

### Step 1: Database Setup

```sql
-- Run in Supabase SQL Editor
-- File: supabase/setup/99-master-all-tables.sql
```

**Verify:**
- [ ] 26 tables created
- [ ] Indexes active
- [ ] RLS policies enabled
- [ ] Realtime subscriptions working
- [ ] Storage buckets configured

### Step 2: Environment Variables

**Vercel:**
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
OPENAI_API_KEY= (or ANTHROPIC_API_KEY)
LLM_PROVIDER=
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

**Python Worker:**
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
ALLOWED_ORIGINS=
```

### Step 3: Vercel Deployment

1. Connect GitHub repository
2. Configure build settings:
   - Framework: Next.js
   - Node Version: 20.x
   - Build Command: `npm run build`
3. Add environment variables
4. Deploy to production

### Step 4: Python Worker Deployment

**Option A: Render**
1. Create new Web Service
2. Connect GitHub
3. Configure Docker
4. Add environment variables
5. Deploy

**Option B: Railway**
1. Create new project
2. Deploy from GitHub
3. Configure Docker
4. Add environment variables
5. Deploy

### Step 5: Domain Configuration

1. Add custom domain in Vercel
2. Configure DNS records
3. Wait for SSL certificate
4. Verify HTTPS working

### Step 6: Post-Deployment Verification

**Functional Tests:**
- [ ] Login works
- [ ] Registration works
- [ ] Create post works
- [ ] Connections work
- [ ] Messages work
- [ ] AI chat works
- [ ] Matches work

**Performance Tests:**
- [ ] Page load < 3s
- [ ] API response < 500ms
- [ ] Lighthouse > 90
- [ ] No console errors

**Monitoring Tests:**
- [ ] Errors appear in Sentry
- [ ] Events appear in PostHog
- [ ] Analytics recording
- [ ] Alerts configured

---

## Rollback Procedure

### Emergency Rollback

```bash
# Vercel rollback
vercel rollback [deployment-id]

# Or redeploy previous commit
git checkout <previous-commit>
git push
```

### Database Rollback

Use Supabase dashboard:
1. Go to Settings → Backups
2. Restore from backup
3. Verify data restored

### Communication

1. Update status page
2. Notify users via email/social
3. Alert team members
4. Document issue

---

## Post-Launch

### Week 1

**Daily:**
- [ ] Check error rates
- [ ] Monitor performance
- [ ] Review user feedback
- [ ] Check server costs

**Weekly:**
- [ ] Analyze user metrics
- [ ] Review performance trends
- [ ] Triage bugs
- [ ] Plan improvements

### Month 1

- [ ] Performance optimization
- [ ] Feature improvements
- [ ] Security audit
- [ ] User research

---

## Success Metrics

### Technical

- Uptime: > 99.9%
- Error rate: < 1%
- Page load: < 3s
- API response: < 500ms

### User

- DAU/MAU ratio: > 20%
- Retention (D7): > 40%
- Conversion: > 5%
- NPS: > 50

### Business

- MRR growth: > 10%/month
- Churn: < 5%/month
- CAC: < $50
- LTV: > $500

---

**Status:** 📋 Ready  
**Last Updated:** March 15, 2026  
**Version:** 1.0.0
