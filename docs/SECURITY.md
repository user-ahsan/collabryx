# 🔐 Security Overview

Comprehensive security implementation across Collabryx platform.

---

## Table of Contents

- [Security Layers](#security-layers)
- [Bot Detection](#bot-detection)
- [CSRF Protection](#csrf-protection)
- [Rate Limiting](#rate-limiting)
- [Input Validation](#input-validation)
- [Database Security](#database-security)
- [Best Practices](#best-practices)

---

## Security Layers

Collabryx implements **5 layers of security**:

| Layer | Protection | Location |
|-------|------------|----------|
| **1. Bot Detection** | Automated traffic filtering | `lib/bot-detection.ts` |
| **2. CSRF Protection** | Cross-site request forgery prevention | `lib/csrf.ts` |
| **3. Rate Limiting** | Request throttling | `lib/rate-limit.ts` |
| **4. Input Validation** | Zod schemas + sanitization | `lib/validations/`, `lib/utils/sanitize.ts` |
| **5. Database Security** | Row Level Security (RLS) | Supabase policies |

---

## Bot Detection

**File:** `lib/bot-detection.ts`

### Features

- User-Agent analysis
- Request pattern detection
- Headless browser detection
- Known bot signature matching

### Implementation

```typescript
import { isBotRequest } from "@/lib/bot-detection";

// In API routes
export async function POST(request: NextRequest) {
  // Check for bot traffic
  if (isBotRequest(request.headers)) {
    return NextResponse.json(
      { error: "Bot traffic detected" },
      { status: 403 }
    );
  }
  
  // Process legitimate requests
  ...
}
```

### Detection Methods

| Method | Description |
|--------|-------------|
| **User-Agent Analysis** | Blocks known bot user-agents |
| **Header Validation** | Checks for missing/invalid headers |
| **Request Frequency** | Monitors request patterns |
| **Behavior Analysis** | Detects automated interactions |

---

## CSRF Protection

**File:** `lib/csrf.ts`

### Features

- Token-based validation
- Session-bound tokens
- Automatic token rotation
- Secure cookie storage

### Implementation

```typescript
import { generateCsrfToken, validateCsrfToken } from "@/lib/csrf";

// Generate token (on session creation)
const token = await generateCsrfToken(sessionId);

// Validate token (on form submission)
const isValid = await validateCsrfToken(sessionId, token);

if (!isValid) {
  return NextResponse.json(
    { error: "Invalid CSRF token" },
    { status: 403 }
  );
}
```

### Token Storage

- **Server:** Secure HTTP-only cookie
- **Client:** Included in form headers
- **Rotation:** New token per session

### Security Headers

```typescript
// In middleware or layout
headers.set('X-CSRF-Token', token);
headers.set('SameSite', 'Strict');
headers.set('Secure', 'true');
```

---

## Rate Limiting

**File:** `lib/rate-limit.ts`

### Limits

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| **General API** | 100 requests | 15 minutes |
| **Authentication** | 10 requests | 15 minutes |
| **File Upload** | 5 requests | 1 minute |
| **Embedding Generation** | 3 requests | 1 minute |

### Implementation

```typescript
import { rateLimitMiddleware } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const limit = rateLimitMiddleware(request, {
    limit: 100,
    window: 15 * 60, // 15 minutes
    identifier: request.ip // or user ID
  });
  
  if (limit.exceeded) {
    return NextResponse.json(
      { 
        error: "Rate limit exceeded",
        retryAfter: limit.retryAfter
      },
      { status: 429 }
    );
  }
  
  // Process request
  ...
}
```

### Storage

- **Backend:** Supabase `embedding_rate_limits` table
- **Cleanup:** Automatic expiration
- **Persistence:** Survives server restarts

---

## Input Validation

### Zod Schemas

**Location:** `lib/validations/`

All user inputs validated with Zod:

```typescript
import { z } from "zod";

const profileSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  headline: z.string().max(100).optional(),
  skills: z.array(z.string()).max(20).optional()
});

// Validate
const result = profileSchema.safeParse(input);

if (!result.success) {
  return NextResponse.json(
    { error: "Invalid input", details: result.error },
    { status: 400 }
  );
}
```

### Input Sanitization

**File:** `lib/utils/sanitize.ts`

```typescript
import { sanitizeInput } from "@/lib/utils/sanitize";

// Remove XSS vectors
const clean = sanitizeInput(userInput);

// Features:
// - HTML entity encoding
// - Script tag removal
// - Event handler stripping
// - URL validation
```

### File Upload Validation

**File:** `lib/utils/file-validation.ts`

```typescript
import { validateFile } from "@/lib/utils/file-validation";

const validation = validateFile(file, {
  maxSize: 5 * 1024 * 1024, // 5MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp'],
  allowedExtensions: ['.jpg', '.png', '.webp']
});

if (!validation.valid) {
  throw new Error(validation.error);
}
```

---

## Database Security

### Row Level Security (RLS)

All Supabase tables have RLS policies enabled:

```sql
-- Example: profiles table
CREATE POLICY "Users can view own profile"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id);
```

### RLS Policies by Table

| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| `profiles` | Authenticated users | Users (own) | Users (own) | ❌ |
| `posts` | Authenticated | Connected users | Post author | Post author |
| `messages` | Conversation participants | Conversation participants | ❌ | ❌ |
| `connections` | Authenticated | Authenticated | ❌ | Connection participants |

### Service Role Key Protection

```typescript
// ✅ GOOD: Server-side only
import { createServerClient } from "@/lib/supabase/server";

// ❌ BAD: Never expose in client
const supabase = createClient(url, SERVICE_ROLE_KEY); // NEVER!
```

---

## Best Practices

### Environment Variables

```env
# ✅ GOOD: Use environment variables
NEXT_PUBLIC_SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=your-secret-key

# ❌ BAD: Never hardcode
const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

### Authentication Checks

```typescript
// In Server Components
import { createServerClient } from "@/lib/supabase/server";

export default async function ProtectedPage() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    redirect("/login");
  }
  
  // Protected content
}
```

### Error Handling

```typescript
// ✅ GOOD: Generic error messages
try {
  await supabase.from("profiles").update(data);
} catch (error) {
  console.error("Database error:", error);
  toast.error("Failed to update profile");
}

// ❌ BAD: Exposing internal errors
catch (error) {
  toast.error(error.message); // May leak info
}
```

### Secure Headers

```typescript
// In middleware
headers.set('X-Content-Type-Options', 'nosniff');
headers.set('X-Frame-Options', 'DENY');
headers.set('X-XSS-Protection', '1; mode=block');
headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
```

---

## Security Checklist

### Development

- [ ] No secrets in code
- [ ] Environment variables configured
- [ ] RLS policies tested
- [ ] Input validation on all forms
- [ ] Error messages don't leak info

### Production

- [ ] HTTPS enabled
- [ ] Service role keys rotated regularly
- [ ] Rate limiting active
- [ ] Bot detection enabled
- [ ] Monitoring configured

### Regular Audits

- [ ] Dependency vulnerabilities (`npm audit`)
- [ ] RLS policy review
- [ ] Access log analysis
- [ ] Penetration testing
- [ ] Security header verification

---

## Monitoring & Alerts

### What to Monitor

| Metric | Alert Threshold |
|--------|-----------------|
| Failed login attempts | >10/hour per IP |
| Rate limit hits | >100/hour per IP |
| Bot detection triggers | >50/hour |
| CSRF validation failures | >20/hour |
| Database errors | >10/hour |

### Logging

```typescript
import { logger } from "@/lib/logger";

// Security events
logger.warn("security", {
  event: "rate_limit_exceeded",
  ip: request.ip,
  endpoint: "/api/profile",
  timestamp: new Date().toISOString()
});
```

---

## Incident Response

### If Security Breach Detected

1. **Rotate all keys immediately**
   - Supabase service role key
   - API keys
   - Session tokens

2. **Review access logs**
   - Check Supabase dashboard
   - Analyze request patterns
   - Identify compromised data

3. **Notify affected users**
   - Email notification
   - In-app alert
   - Password reset required

4. **Document incident**
   - Timeline of events
   - Actions taken
   - Lessons learned

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Supabase Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Security Best Practices](https://nextjs.org/docs/pages/building-your-application/authentication)

---

**Security First!** 🛡️

[← Back to README](./README.md) | [Deployment Guide →](./05-deployment/overview.md)
