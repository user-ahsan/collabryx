# Deployment Runbook

**Last Updated:** 2026-03-20  
**Version:** 1.0.0  
**Classification:** Production

---

## Quick Reference

### Emergency Contacts
- **On-Call Engineer:** Check PagerDuty rotation
- **Slack Channel:** #collabryx-incidents
- **Status Page:** status.collabryx.com

### Critical URLs
| Service | Production | Staging |
|---------|------------|---------|
| Frontend | https://collabryx.com | https://staging.collabryx.com |
| Python Worker | https://worker.railway.app | https://worker-staging.railway.app |
| Supabase | https://xxx.supabase.co | https://xxx.supabase.co |
| Health Check | /api/health | /api/health |

---

## Pre-Deployment Checklist

### Code Quality Gates
- [ ] All tests passing (`npm run test`)
- [ ] TypeScript compilation successful (`npm run typecheck`)
- [ ] ESLint passing (`npm run lint`)
- [ ] Build successful (`npm run build`)
- [ ] No console errors in development

### Database
- [ ] Migration scripts reviewed
- [ ] Backup created (Supabase automatic)
- [ ] RLS policies tested
- [ ] Indexes analyzed

### Environment Variables
- [ ] All required vars set in Vercel
- [ ] Python worker vars configured
- [ ] No secrets in code
- [ ] Staging vars different from production

---

## Deployment Procedures

### Frontend Deployment (Vercel)

#### Standard Deployment
```bash
# 1. Push to main branch
git checkout main
git pull origin main
git push origin main

# 2. Vercel auto-deploys from main
# Monitor at: https://vercel.com/dashboard

# 3. Verify deployment
curl https://collabryx.com/api/health
```

#### Manual Deployment
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# 4. Alias to production
vercel alias <deployment-url> collabryx.com
```

#### Rollback Procedure
1. Go to Vercel Dashboard
2. Select deployment
3. Click "..." → "Redeploy" on previous stable version
4. Confirm rollback
5. Verify health check

### Python Worker Deployment (Railway)

#### Standard Deployment
```bash
# Railway auto-deploys from main branch
# Monitor at: https://railway.app/dashboard

# Check health
curl https://worker.railway.app/health

# Expected response:
{
  "status": "healthy",
  "services": { ... },
  "supabase_connected": true
}
```

#### Manual Deployment
```bash
# 1. Build and push Docker image
cd python-worker
docker-compose build
docker tag collabryx-worker:latest registry.railway.app/collabryx-worker:latest
docker push registry.railway.app/collabryx-worker:latest

# 2. Deploy on Railway
railway up
```

#### Rollback Procedure
1. Go to Railway Dashboard
2. Select service
3. Click "Deployments"
4. Select previous version
5. Click "Rollback"

### Database Migrations

#### Running Migrations
```sql
-- 1. Access Supabase SQL Editor
-- 2. Run migration script
-- 3. Verify table creation

-- Example: Check table count
SELECT COUNT(*) 
FROM information_schema.tables 
WHERE table_schema = 'public';
-- Expected: 26 tables
```

#### Rollback Migration
```sql
-- 1. Identify migration to rollback
-- 2. Run reverse migration
-- 3. Verify data integrity

-- Example: Drop table
DROP TABLE IF EXISTS table_name CASCADE;
```

---

## Monitoring

### Health Checks

#### Frontend Health
```bash
curl https://collabryx.com/api/health

# Expected:
{
  "status": "healthy",
  "timestamp": "2026-03-20T10:00:00Z",
  "version": "1.0.0"
}
```

#### Worker Health
```bash
curl https://worker.railway.app/health

# Check all services:
# - embedding_generator
# - match_generator
# - notification_engine
# - activity_tracker
# - feed_scorer
# - content_moderator
# - ai_mentor_processor
# - event_processor
# - analytics_aggregator
```

### Key Metrics

| Metric | Threshold | Alert |
|--------|-----------|-------|
| API Error Rate | > 5% | PagerDuty |
| Response Time (p95) | > 2s | Slack |
| Embedding Queue Depth | > 100 | Slack |
| DLQ Size | > 10 | Slack |
| Database Connections | > 80% | PagerDuty |
| Memory Usage | > 90% | Slack |

### Dashboards

- **Vercel Analytics:** https://vercel.com/analytics
- **Supabase Dashboard:** https://supabase.com/dashboard
- **Railway Monitoring:** https://railway.app/dashboard
- **Sentry Errors:** https://sentry.io/organizations/collabryx

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| **P0** | Complete outage | Immediate |
| **P1** | Major feature broken | 1 hour |
| **P2** | Minor feature broken | 4 hours |
| **P3** | Cosmetic issue | Next business day |

### Common Incidents

#### Frontend Down
**Symptoms:**
- 500 errors on all pages
- Vercel deployment failed

**Resolution:**
1. Check Vercel deployment status
2. Rollback to previous deployment
3. Check error logs
4. Fix and redeploy

#### Worker Down
**Symptoms:**
- Embeddings not generating
- Health check failing

**Resolution:**
1. Check Railway logs
2. Restart service
3. Check Supabase connection
4. Scale up if needed

#### Database Issues
**Symptoms:**
- Slow queries
- Connection errors

**Resolution:**
1. Check Supabase dashboard
2. Analyze slow queries
3. Add missing indexes
4. Contact Supabase support if needed

### Escalation Path

1. **On-Call Engineer** - First response
2. **Tech Lead** - Technical decisions
3. **CTO** - Business impact decisions
4. **All Hands** - Critical outages

---

## Post-Deployment Verification

### Smoke Tests

```bash
# 1. Homepage loads
curl -I https://collabryx.com
# Expected: 200 OK

# 2. Login works
curl -X POST https://collabryx.com/api/auth/callback
# Expected: 302 redirect

# 3. API responds
curl https://collabryx.com/api/health
# Expected: {"status": "healthy"}

# 4. Worker responds
curl https://worker.railway.app/health
# Expected: All services operational
```

### Performance Checks

```bash
# Run Lighthouse
npm run lighthouse

# Expected scores:
# - Performance: > 90
# - Accessibility: > 90
# - Best Practices: > 90
# - SEO: > 90
```

### User Flow Verification

- [ ] Login/Registration works
- [ ] Dashboard loads
- [ ] Profile page loads
- [ ] Matches display
- [ ] Messages send/receive
- [ ] File uploads work
- [ ] Real-time updates work
- [ ] Mobile responsive

---

## Maintenance Windows

### Scheduled Maintenance

**Time:** Sundays 2:00 AM - 4:00 AM UTC  
**Duration:** 2 hours maximum  
**Notification:** 48 hours advance notice

### Maintenance Procedures

1. **Announce maintenance** on status page
2. **Enable maintenance mode** (if needed)
3. **Perform updates**
4. **Run smoke tests**
5. **Disable maintenance mode**
6. **Verify all systems**
7. **Post maintenance report**

---

## Security Procedures

### Secret Rotation

**Frequency:** Every 90 days

**Secrets to Rotate:**
- Supabase service role key
- OAuth client secrets
- API keys (Perspective, Gemini)
- Railway/Vercel tokens

**Procedure:**
1. Generate new secret
2. Update environment variables
3. Deploy with new secret
4. Verify functionality
5. Revoke old secret

### Security Incidents

**Response:**
1. **Contain** - Isolate affected systems
2. **Assess** - Determine scope
3. **Notify** - Alert stakeholders
4. **Remediate** - Fix vulnerability
5. **Review** - Post-incident analysis

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [API Reference](./API-REFERENCE.md)
- [Security Guide](./SECURITY.md)
- [Development Guide](./01-getting-started/development.md)

---

**Document Version:** 1.0.0  
**Classification:** Production  
**Maintained By:** DevOps Team  
**Review Cycle:** Monthly
