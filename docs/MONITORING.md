# Monitoring & Observability

Complete monitoring and observability setup for Collabryx production deployment.

## Table of Contents

- [Sentry (Error Tracking)](#sentry-error-tracking)
- [PostHog (Product Analytics)](#posthog-product-analytics)
- [Health Checks](#health-checks)
- [Metrics to Monitor](#metrics-to-monitor)
- [Alert Configuration](#alert-configuration)
- [Uptime Monitoring](#uptime-monitoring)

---

## Sentry (Error Tracking)

### Setup Instructions

1. **Create Sentry Account**
   - Go to [sentry.io](https://sentry.io)
   - Sign up for free or organization account
   - Create a new project (Next.js)

2. **Get DSN**
   - Navigate to Project Settings → Client Keys (DSN)
   - Copy the DSN URL

3. **Configure Environment Variables**
   ```env
   NEXT_PUBLIC_SENTRY_DSN=https://xxx@sentry.io/xxx
   SENTRY_ORG=your-org
   SENTRY_PROJECT=collabryx
   ```

4. **Configuration Files**
   - `sentry.client.config.ts` - Browser error tracking
   - `sentry.server.config.ts` - Server-side error tracking
   - `sentry.edge.config.ts` - Edge function error tracking

### Features Enabled

✅ **Error Tracking** - Automatic capture of JavaScript errors
✅ **Performance Monitoring** - Transaction tracing (10% sample rate in production)
✅ **Session Replay** - Record user sessions for debugging (10% normal, 100% on error)
✅ **Source Maps** - Automatic upload during build
✅ **Release Tracking** - Version correlation with errors

### Configuration Options

```typescript
// Sample rates (adjust based on traffic)
tracesSampleRate: 0.1           // 10% of transactions
replaysSessionSampleRate: 0.1   // 10% of sessions
replaysOnErrorSampleRate: 1.0   // 100% of error sessions

// Privacy protection
maskAllText: true               // Mask text in replays
blockAllMedia: true            // Block media in replays
```

### Usage Examples

```typescript
import * as Sentry from '@sentry/nextjs'

// Capture custom errors
try {
  // risky operation
} catch (error) {
  Sentry.captureException(error)
}

// Add context to errors
Sentry.setUser({ id: 'user-123', email: 'user@example.com' })
Sentry.setTag('feature', 'matching')
Sentry.setContext('payment', { amount: 99.99, currency: 'USD' })

// Breadcrumbs for debugging
Sentry.addBreadcrumb({
  category: 'auth',
  message: 'User logged in',
  level: 'info',
})
```

---

## PostHog (Product Analytics)

### Setup Instructions

1. **Create PostHog Account**
   - Go to [posthog.com](https://posthog.com)
   - Sign up for free cloud or self-host
   - Create new project

2. **Get API Key**
   - Navigate to Project Settings → API Keys
   - Copy the Project API Key

3. **Configure Environment Variables**
   ```env
   NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
   NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
   NEXT_PUBLIC_ENABLE_ANALYTICS=true
   ```

4. **Provider Setup**
   - Already configured in `app/layout.tsx`
   - Wraps entire application

### Event Tracking

**Predefined Events** (`lib/analytics/events.ts`):

```typescript
import { trackEvent, AnalyticsEvents } from '@/lib/analytics/events'

// Track custom event
trackEvent('button_clicked', { 
  button_name: 'signup',
  location: 'landing_page'
})

// Track predefined event
trackEvent(AnalyticsEvents.USER_REGISTERED, {
  user_id: '123',
  signup_method: 'email'
})

// Identify user
import { identifyUser } from '@/lib/analytics/events'
identifyUser('user-123', {
  email: 'user@example.com',
  plan: 'premium'
})
```

### Available Events

| Event | Description | When to Track |
|-------|-------------|---------------|
| `user_registered` | User signup | After successful registration |
| `onboarding_completed` | Onboarding finished | When profile reaches 100% |
| `post_created` | New post | After post creation |
| `connection_request_sent` | Connection request | When sending request |
| `match_viewed` | Match profile viewed | On match detail page |
| `message_sent` | Message sent | After message delivery |
| `profile_updated` | Profile changed | After profile save |
| `search_performed` | Search executed | On search query submit |

### Feature Flags

```typescript
import { useFeatureFlagEnabled } from 'posthog-js/react'

function MyComponent() {
  const aiEnabled = useFeatureFlagEnabled('ai-mentor')
  
  if (!aiEnabled) return null
  
  return <AIMentorButton />
}
```

### Funnel Analysis

Track user journey through key flows:

1. **Onboarding Funnel**
   - `onboarding_started`
   - `onboarding_step_completed` (with step property)
   - `onboarding_completed`

2. **Connection Funnel**
   - `profile_viewed`
   - `connection_request_sent`
   - `connection_request_accepted`

3. **Engagement Funnel**
   - `post_created`
   - `message_sent`
   - `ai_mentor_session_started`

---

## Health Checks

### Endpoint

`GET /api/health`

### Response Format

**Healthy (200 OK):**
```json
{
  "status": "healthy",
  "timestamp": "2026-03-16T10:30:00.000Z",
  "version": "0.1.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "ok",
      "error": null
    },
    "pythonWorker": {
      "status": "ok",
      "error": null
    }
  },
  "uptime": 86400.5
}
```

**Degraded (200 OK):**
```json
{
  "status": "degraded",
  "timestamp": "2026-03-16T10:30:00.000Z",
  "version": "0.1.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "failed",
      "error": "Connection timeout"
    },
    "pythonWorker": {
      "status": "ok",
      "error": null
    }
  },
  "uptime": 86400.5
}
```

**Unhealthy (503 Service Unavailable):**
```json
{
  "status": "unhealthy",
  "timestamp": "2026-03-16T10:30:00.000Z",
  "version": "0.1.0",
  "environment": "production",
  "checks": {
    "database": {
      "status": "ok",
      "error": null
    },
    "pythonWorker": {
      "status": "failed",
      "error": "Worker returned status 500"
    }
  },
  "uptime": 86400.5
}
```

### Testing Locally

```bash
# Test health endpoint
curl http://localhost:3000/api/health

# Test with jq for pretty printing
curl -s http://localhost:3000/api/health | jq

# Test continuously (every 5 seconds)
watch -n 5 curl -s http://localhost:3000/api/health
```

### Python Worker Health

The health check automatically verifies Python worker connectivity:

```bash
# Direct worker health check
curl http://localhost:8000/health

# Expected response
{
  "status": "healthy",
  "model_info": {
    "model_name": "all-MiniLM-L6-v2",
    "dimensions": 384,
    "device": "cpu"
  },
  "supabase_connected": true,
  "queue_size": 0
}
```

---

## Metrics to Monitor

### Performance Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| API Response Time (p95) | < 200ms | > 500ms |
| API Response Time (p99) | < 500ms | > 1000ms |
| Database Query Time | < 50ms | > 200ms |
| Page Load Time (FCP) | < 1.5s | > 3s |
| Time to Interactive | < 3.5s | > 5s |
| Error Rate | < 0.1% | > 1% |

### Business Metrics

| Metric | Description | Tracking Method |
|--------|-------------|-----------------|
| Daily Active Users | Unique users per day | PostHog DAU |
| User Retention | % returning users | PostHog Retention |
| Onboarding Completion | % completing onboarding | Funnel analysis |
| Profile Completion | Average completion % | Database query |
| Connection Rate | Connections per user | Event tracking |
| Message Volume | Messages sent per day | Event aggregation |
| Match Success Rate | % matches that connect | Custom query |

### Infrastructure Metrics

| Metric | Source | Alert Threshold |
|--------|--------|-----------------|
| CPU Usage | Vercel/Server | > 80% |
| Memory Usage | Vercel/Server | > 85% |
| Disk Usage | Server | > 75% |
| Network I/O | Server | Spikes > 2x normal |
| Python Worker Queue | `/health` endpoint | Queue > 50 |
| DLQ Size | Database | DLQ > 100 |

### Error Tracking Metrics

| Metric | Sentry Dashboard | Alert Threshold |
|--------|------------------|-----------------|
| Total Errors | Issues → All Time | Spike > 50% |
| New Issues | Issues → Unresolved | Any new issue |
| Error Rate | Performance → Errors | > 1% of requests |
| Crash Rate | Replays → Sessions | > 0.1% of sessions |
| Failed API Calls | Performance → Queries | > 2% failure rate |

---

## Alert Configuration

### Sentry Alerts

**Setup in Sentry Dashboard:**

1. **Navigate to Alerts**
   - Go to Project → Alerts → Create Alert

2. **Error Rate Alert**
   ```
   Trigger: Error rate > 1%
   Filter: environment:production
   Action: Send email/Slack
   Resolve: Auto-resolve when < 0.5%
   ```

3. **New Issue Alert**
   ```
   Trigger: New issue detected
   Filter: environment:production, level:error
   Action: Send email/Slack immediately
   ```

4. **Performance Alert**
   ```
   Trigger: p95 transaction duration > 500ms
   Filter: transaction.op:"http.server"
   Action: Send email
   ```

5. **Crash Free Sessions Alert**
   ```
   Trigger: Crash free sessions < 99.5%
   Filter: environment:production
   Action: Send Slack notification
   ```

### PostHog Alerts

**Setup in PostHog Dashboard:**

1. **Navigate to Insights**
   - Create new insight
   - Set up trend or funnel

2. **DAU Drop Alert**
   ```
   Metric: Daily Active Users
   Condition: Decrease > 30% vs previous 7d avg
   Action: Send email
   ```

3. **Onboarding Funnel Drop**
   ```
   Metric: Onboarding completion rate
   Condition: Decrease > 20% vs previous week
   Action: Send Slack notification
   ```

### Custom Alerts (Uptime Monitoring)

**Using UptimeRobot (Free):**

1. **Health Check Monitor**
   ```
   Monitor Type: HTTP(s)
   URL: https://your-domain.com/api/health
   Check Interval: 5 minutes
   Alert Conditions: Status != 200 OR status != "healthy"
   Alert Contacts: Email, SMS, Slack
   ```

2. **Python Worker Monitor**
   ```
   Monitor Type: HTTP(s)
   URL: https://your-worker-url.com/health
   Check Interval: 5 minutes
   Alert Conditions: Status != 200
   Alert Contacts: Email, Slack
   ```

**Using Better Stack (Free Tier):**

1. **Create Heartbeat Monitor**
   ```
   Type: Heartbeat
   Expected Interval: 5 minutes
   Alert if: No heartbeat in 10 minutes
   On-call rotation: Configure team
   ```

---

## Uptime Monitoring

### Recommended Tools

#### Free Tier Options

1. **UptimeRobot** (50 monitors, 5-min intervals)
   - HTTP(s) monitoring
   - Keyword monitoring
   - Email/SMS alerts
   - Public status pages

2. **Better Stack** (10 monitors, 3-min intervals)
   - Advanced alerting
   - On-call scheduling
   - Incident management
   - Status pages

3. **Pingdom** (10 monitors, 1-min intervals)
   - Real browser monitoring
   - Transaction monitoring
   - Detailed reports

#### Paid Options

1. **Datadog Synthetic Monitoring**
   - Full-stack observability
   - Advanced alerting
   - Custom dashboards

2. **New Relic Synthetics**
   - Scripted browser tests
   - API monitoring
   - Performance insights

### Monitoring Setup Checklist

- [ ] Health check endpoint created (`/api/health`)
- [ ] Uptime monitoring configured (UptimeRobot/Better Stack)
- [ ] Alert contacts configured (email, SMS, Slack)
- [ ] Status page created (optional)
- [ ] Escalation policy defined
- [ ] Runbook for common incidents created
- [ ] On-call rotation scheduled (for teams)

### Incident Response Runbook

**Severity Levels:**

- **P0 (Critical)** - Service down, data loss
- **P1 (High)** - Major feature broken
- **P2 (Medium)** - Minor feature broken
- **P3 (Low)** - Cosmetic issues, minor bugs

**Response Times:**

| Severity | Response Time | Resolution Time |
|----------|--------------|-----------------|
| P0 | < 15 min | < 2 hours |
| P1 | < 1 hour | < 8 hours |
| P2 | < 4 hours | < 24 hours |
| P3 | < 24 hours | < 1 week |

**Incident Response Steps:**

1. **Acknowledge** - Confirm receipt of alert
2. **Assess** - Determine severity and impact
3. **Communicate** - Notify stakeholders
4. **Diagnose** - Identify root cause
5. **Fix** - Implement solution
6. **Verify** - Confirm resolution
7. **Document** - Write post-mortem (for P0/P1)

---

## Dashboard Setup

### Sentry Dashboards

Create custom dashboards for:

1. **Error Overview**
   - Total errors (24h, 7d, 30d)
   - Errors by type
   - Errors by release
   - Top affected users

2. **Performance Overview**
   - p50, p95, p99 latencies
   - Slowest transactions
   - Database query performance
   - Frontend performance (Web Vitals)

3. **Release Health**
   - Crash-free sessions
   - Crash-free users
   - Adoption by version
   - Errors by release

### PostHog Dashboards

1. **User Engagement**
   - DAU/MAU ratio
   - Session duration
   - Pages per session
   - Feature usage

2. **Growth Metrics**
   - Signup rate
   - Onboarding completion
   - Activation rate
   - Retention cohorts

3. **Feature Adoption**
   - AI mentor usage
   - Matching feature usage
   - Messaging activity
   - Post creation rate

---

## Troubleshooting

### Common Issues

**Sentry Not Capturing Errors:**

```bash
# Check if DSN is set
echo $NEXT_PUBLIC_SENTRY_DSN

# Verify Sentry config files exist
ls -la sentry.*.config.ts

# Check build output for Sentry
npm run build 2>&1 | grep -i sentry
```

**PostHog Not Tracking Events:**

```bash
# Check PostHog key
echo $NEXT_PUBLIC_POSTHOG_KEY

# Open browser console, look for PostHog logs
# Should see: "PostHog initialized"

# Test event manually in console
posthog.capture('test_event', { test: true })
```

**Health Check Failing:**

```bash
# Check database connectivity
curl http://localhost:3000/api/health | jq '.checks.database'

# Check Python worker
curl http://localhost:8000/health

# Restart Python worker
npm run docker:restart
```

### Debug Mode

Enable debug logging in development:

```env
DEBUG=true
DEVELOPMENT_MODE=true
```

Sentry logs events to console in development (not sent to server).

---

## Best Practices

### Error Tracking

✅ **DO:**
- Add context to errors (user, feature, action)
- Use breadcrumbs for complex flows
- Set appropriate sample rates
- Filter sensitive data
- Create actionable alerts

❌ **DON'T:**
- Track PII (passwords, tokens, emails)
- Alert on every error (alert fatigue)
- Ignore error trends
- Sample at 100% in production (costly)

### Analytics

✅ **DO:**
- Track meaningful events (not every click)
- Use consistent naming conventions
- Add relevant properties
- Respect user privacy
- Document event schema

❌ **DON'T:**
- Track sensitive data
- Over-instrument (analysis paralysis)
- Ignore data quality
- Mix event naming styles

### Health Checks

✅ **DO:**
- Check all critical dependencies
- Set appropriate timeouts
- Include version info
- Return structured responses
- Cache-control: no-store

❌ **DON'T:**
- Check too frequently (DDoS yourself)
- Include sensitive info in response
- Return 200 when unhealthy
- Forget to test failure scenarios

---

## Resources

- [Sentry Documentation](https://docs.sentry.io/)
- [PostHog Documentation](https://posthog.com/docs)
- [Next.js Monitoring Guide](https://nextjs.org/docs/building-your-application/optimizing/monitoring)
- [UptimeRobot](https://uptimerobot.com/)
- [Better Stack](https://betterstack.com/)

---

**Last Updated:** 2026-03-16
**Phase:** 7 - Monitoring & Observability
**Status:** ✅ Complete
