# Monitoring & Observability Setup

## Error Tracking - Sentry

### Installation

```bash
npm install @sentry/nextjs
```

### Configuration

Create `sentry.client.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% sampling
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  integrations: [
    Sentry.replayIntegration(),
  ],
})
```

Create `sentry.server.config.ts`:
```typescript
import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
})
```

Update `next.config.ts`:
```typescript
import { withSentryConfig } from "@sentry/nextjs"

const nextConfig = { ... }

export default withSentryConfig(nextConfig, {
  org: "your-org",
  project: "collabryx",
})
```

### Usage

```typescript
// Manual error reporting
try {
  // risky operation
} catch (error) {
  Sentry.captureException(error)
}

// With context
Sentry.captureException(error, {
  tags: { feature: 'posts' },
  extra: { postId: '123' },
  user: { id: user.id },
})

// Breadcrumbs
Sentry.addBreadcrumb({
  category: 'action',
  message: 'User created post',
  level: 'info',
})
```

---

## Analytics - PostHog

### Installation

```bash
npm install posthog-js posthog-node
```

### Client Configuration

Create `components/providers/posthog-provider.tsx`:
```typescript
'use client'

import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PostHogProvider({ children }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      person_profiles: 'identified',
    })
  }, [])

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
```

### Event Tracking

```typescript
import { usePostHog } from 'posthog-js/react'

// In component
const posthog = usePostHog()

// Track event
posthog.capture('post_created', {
  post_type: 'project-launch',
  intent: 'cofounder',
  has_media: true,
})

// Identify user
posthog.identify(user.id, {
  email: user.email,
  display_name: user.display_name,
})

// Feature flags
if (posthog.isFeatureEnabled('new_dashboard')) {
  // show new dashboard
}
```

### Server-Side Tracking

```typescript
import PostHog from 'posthog-node'

const posthog = new PostHog(
  process.env.NEXT_PUBLIC_POSTHOG_KEY!,
  { host: process.env.NEXT_PUBLIC_POSTHOG_HOST }
)

// In server action
await posthog.capture({
  distinctId: user.id,
  event: 'connection_request_sent',
  properties: {
    target_user_id: targetUserId,
  },
})
```

### Events to Track

**Authentication:**
- `user_signed_up`
- `user_logged_in`
- `user_logged_out`
- `password_reset_requested`

**Posts:**
- `post_created`
- `post_viewed`
- `post_reacted_to`
- `post_shared`

**Connections:**
- `connection_request_sent`
- `connection_request_accepted`
- `connection_removed`

**Matches:**
- `match_viewed`
- `match_accepted`
- `match_dismissed`

**Messages:**
- `message_sent`
- `conversation_started`

**Onboarding:**
- `onboarding_started`
- `onboarding_completed`
- `profile_completion_updated`

---

## Performance Monitoring

### Vercel Analytics

Enable in Vercel dashboard:
1. Go to project settings
2. Enable "Vercel Analytics"
3. Add to layout:

```typescript
import { Analytics } from "@vercel/analytics/react"
import { SpeedInsights } from "@vercel/speed-insights/next"

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
```

### Core Web Vitals

Track these metrics:

```typescript
// app/metrics.tsx
import { useReportWebVitals } from 'next/web-vitals'

export function WebVitals() {
  useReportWebVitals((metric) => {
    // Send to analytics
    posthog.capture('web_vital', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
    })
    
    // Or send to Sentry
    Sentry.addBreadcrumb({
      category: 'web-vital',
      message: `${metric.name}: ${metric.value}`,
      level: 'info',
    })
  })

  return null
}
```

### Targets

| Metric | Target | Current |
|--------|--------|---------|
| LCP | < 2.5s | TBD |
| FID | < 100ms | TBD |
| CLS | < 0.1 | TBD |
| FCP | < 1.8s | TBD |

---

## Logging

### Application Logs

```typescript
// lib/logger.ts
const logger = {
  info: (message: string, data?: any) => {
    console.log(`[INFO] ${message}`, data)
  },
  warn: (message: string, data?: any) => {
    console.warn(`[WARN] ${message}`, data)
  },
  error: (message: string, error?: any) => {
    console.error(`[ERROR] ${message}`, error)
    Sentry.captureException(error)
  },
}
```

### Database Logs

Enable Supabase logs:
1. Go to Supabase Dashboard
2. Database → Logs
3. Enable query logging
4. Set retention period

---

## Alerts

### Sentry Alerts

Configure in Sentry dashboard:
- Issue alerts (new issues, regressions)
- Performance alerts (slow transactions)
- Error rate alerts (> 1% error rate)

### Uptime Monitoring

Use external service:
- UptimeRobot (free)
- Pingdom
- StatusCake

Monitor:
- Homepage (/)
- API health (/api/chat)
- Auth endpoints

---

## Dashboard

### Metrics to Display

**User Metrics:**
- DAU/MAU
- New signups
- Active sessions
- Retention rate

**Engagement:**
- Posts created
- Connections made
- Messages sent
- Matches accepted

**Performance:**
- Page load times
- API response times
- Error rates
- Core Web Vitals

**Business:**
- Conversion funnel
- Feature adoption
- User retention
- Churn rate

---

## Implementation Checklist

- [ ] Install Sentry
- [ ] Configure Sentry
- [ ] Install PostHog
- [ ] Configure PostHog
- [ ] Add event tracking
- [ ] Enable Vercel Analytics
- [ ] Set up alerts
- [ ] Create dashboard
- [ ] Test error reporting
- [ ] Verify analytics

---

**Status:** 🔄 In Progress  
**Priority:** High  
**Estimated Time:** 2-3 hours
