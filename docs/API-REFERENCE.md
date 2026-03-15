# API Reference

**Last Updated:** 2026-03-16  
**Version:** 1.0.0

Complete API documentation for Collabryx backend services.

---

## Table of Contents

- [Overview](#overview)
- [Authentication Endpoints](#authentication-endpoints)
- [Chat Endpoints](#chat-endpoints)
- [Embedding Endpoints](#embedding-endpoints)
- [Server Actions](#server-actions)
- [Edge Functions](#edge-functions)
- [Rate Limits](#rate-limits)
- [Error Codes](#error-codes)
- [Response Formats](#response-formats)

---

## Overview

### Base URLs

**Frontend API Routes:** `https://collabryx.com/api/*`  
**Python Worker:** `https://worker.collabryx.com/*`  
**Supabase REST:** `https://xxx.supabase.co/rest/v1/*`

### Authentication

All authenticated endpoints require a valid Supabase session token:

```typescript
const { data: { session } } = await supabase.auth.getSession()

// Include in API requests
fetch('/api/endpoint', {
  headers: {
    'Authorization': `Bearer ${session?.access_token}`
  }
})
```

### Content Type

All API endpoints expect and return JSON:

```
Content-Type: application/json
```

---

## Authentication Endpoints

### Auth Callback

Handles OAuth callback and session creation.

**Endpoint:** `GET /api/auth/callback`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `code` | string | ✅ Yes | OAuth authorization code |
| `next` | string | ❌ No | Redirect URL after auth |

**Example:**
```typescript
// Redirect to auth callback
const { error } = await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: {
    redirectTo: `${window.location.origin}/api/auth/callback`
  }
})
```

**Response:**
- **Success:** Redirects to `/dashboard`
- **Error:** Redirects to `/login?error=...`

**Status Codes:**
| Code | Description |
|------|-------------|
| 302 | Redirect on success |
| 400 | Invalid code parameter |
| 500 | Internal server error |

---

## Chat Endpoints

### Create Chat Message

Send a message to the AI assistant.

**Endpoint:** `POST /api/chat`

**Request Body:**
```typescript
{
  message: string,      // User message
  conversationId?: string,  // Existing conversation ID
  context?: {         // Optional context
    page?: string,
    previousMessages?: Array<{
      role: 'user' | 'assistant',
      content: string
    }>
  }
}
```

**Example:**
```typescript
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Help me optimize my profile',
    context: {
      page: '/my-profile'
    }
  })
})

const data = await response.json()
// { reply: "...", conversationId: "..." }
```

**Response:**
```typescript
{
  reply: string,              // AI response
  conversationId: string,     // Conversation ID (new or existing)
  messageId: string,          // Created message ID
  timestamp: string           // ISO 8601 timestamp
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request body |
| 401 | Unauthorized |
| 429 | Rate limit exceeded |
| 500 | Internal error |

**Rate Limit:** 10 requests/minute

---

### Get Chat History

Retrieve conversation history.

**Endpoint:** `GET /api/chat`

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `conversationId` | string | ❌ No | Filter by conversation |
| `limit` | number | ❌ No | Max messages (default: 50) |

**Example:**
```typescript
const response = await fetch('/api/chat?conversationId=abc123&limit=20')
const messages = await response.json()
```

**Response:**
```typescript
[
  {
    id: string,
    role: 'user' | 'assistant',
    content: string,
    created_at: string
  }
]
```

---

### Chat Options (CORS Preflight)

**Endpoint:** `OPTIONS /api/chat`

**Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Embedding Endpoints

### Generate Embedding

Generate vector embedding for profile text.

**Endpoint:** `POST /api/embeddings/generate`

**Request Body:**
```typescript
{
  userId: string,         // User ID to generate embedding for
  text: string,           // Text to embed (profile summary)
  skipCache?: boolean     // Force regeneration (default: false)
}
```

**Example:**
```typescript
const response = await fetch('/api/embeddings/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: 'user-123',
    text: 'Software engineer interested in AI and machine learning'
  })
})

const result = await response.json()
// { embedding: [...], dimensions: 384 }
```

**Response:**
```typescript
{
  success: boolean,
  embedding?: number[],     // 384-dimensional vector
  dimensions?: number,      // Always 384
  cached?: boolean,         // Whether result was cached
  processingTime?: number   // Milliseconds
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid input |
| 401 | Unauthorized |
| 429 | Rate limit exceeded |
| 503 | Worker unavailable |

**Rate Limit:** 100 requests/minute

**Timeout:** 30 seconds

---

### Check Embedding Status

Check if user has generated embedding.

**Endpoint:** `GET /api/embeddings/status/[userId]`

**Example:**
```typescript
const response = await fetch('/api/embeddings/status/user-123')
const status = await response.json()
```

**Response:**
```typescript
{
  hasEmbedding: boolean,
  generatedAt?: string,   // ISO 8601 timestamp
  dimensions?: number,    // 384
  queuePosition?: number  // If pending
}
```

---

### Retry Dead Letter Queue

Retry failed embeddings from DLQ.

**Endpoint:** `POST /api/embeddings/retry-dlq`

**Request Body:**
```typescript
{
  limit?: number  // Max retries (default: 10)
}
```

**Example:**
```typescript
const response = await fetch('/api/embeddings/retry-dlq', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ limit: 5 })
})

const result = await response.json()
// { retried: 3, failed: 2 }
```

**Response:**
```typescript
{
  retried: number,    // Successfully retried
  failed: number,     // Still failed
  queueSize: number   // Remaining in DLQ
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 403 | Admin only |
| 500 | Internal error |

---

### Embedding Options (CORS Preflight)

**Endpoint:** `OPTIONS /api/embeddings/*`

**Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
```

---

## Server Actions

Server actions are TypeScript functions called directly from components.

### Profile Actions

**File:** `components/features/profile/actions.ts`

```typescript
// Update user profile
async function updateProfile(formData: FormData)
async function updateProfile(data: ProfileUpdateInput)

// Input validation
const schema = z.object({
  display_name: z.string().min(2),
  headline: z.string().max(100),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
  website: z.string().url().optional()
})
```

**Usage:**
```tsx
<form action={updateProfile}>
  <input name="display_name" />
  <input name="headline" />
  <button type="submit">Save</button>
</form>
```

### Post Actions

**File:** `components/features/post/actions.ts`

```typescript
// Create post
async function createPost(formData: FormData)

// Delete post
async function deletePost(postId: string)

// React to post
async function reactToPost(postId: string, reaction: 'like' | 'love' | 'celebrate')
```

### Connection Actions

**File:** `components/features/connections/actions.ts`

```typescript
// Send connection request
async function sendConnectionRequest(targetUserId: string)

// Accept connection
async function acceptConnection(connectionId: string)

// Reject connection
async function rejectConnection(connectionId: string)
```

---

## Edge Functions

Supabase Edge Functions run on Deno runtime at the edge.

### Available Functions

| Function | Purpose | Endpoint |
|----------|---------|----------|
| `generate-embedding` | Generate vector embedding | `/functions/v1/generate-embedding` |
| `process-match` | Calculate match scores | `/functions/v1/process-match` |
| `send-notification` | Send push notification | `/functions/v1/send-notification` |

### Invoke Edge Function

```typescript
const { data, error } = await supabase.functions.invoke('generate-embedding', {
  body: {
    userId: 'user-123',
    text: 'Profile summary text'
  }
})
```

**Response:**
```typescript
{
  embedding: number[],
  dimensions: 384,
  processingTime: 245
}
```

---

## Rate Limits

### Frontend API Routes

| Endpoint | Limit | Window | Action on Exceed |
|----------|-------|--------|------------------|
| `/api/chat` | 10 requests | 1 minute | 429 Too Many Requests |
| `/api/embeddings/generate` | 100 requests | 1 minute | 429 Too Many Requests |
| `/api/embeddings/retry-dlq` | 10 requests | 1 minute | 429 Too Many Requests |
| General API | 100 requests | 15 minutes | 429 Too Many Requests |

### Supabase API

| Operation | Limit | Window |
|-----------|-------|--------|
| API Requests | 100,000 | 1 hour |
| Realtime connections | 100 | Concurrent |
| File storage | 1 GB | Total |
| Edge function invocations | 500,000 | 1 month |

### Python Worker

| Operation | Limit | Window |
|-----------|-------|--------|
| Embedding generation | 100 requests | 1 minute |
| DLQ retry | 10 requests | 1 minute |
| Health checks | Unlimited | - |

### Rate Limit Headers

All responses include rate limit headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1647360000
Retry-After: 60  // Only on 429
```

---

## Error Codes

### HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Success |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input, validation failed |
| 401 | Unauthorized | Missing or invalid auth token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Server error |
| 503 | Service Unavailable | Worker down, maintenance |

### Application Error Codes

| Code | Message | Resolution |
|------|---------|------------|
| `AUTH_INVALID_CREDENTIALS` | Invalid email or password | Check credentials |
| `AUTH_EMAIL_EXISTS` | Email already registered | Use different email |
| `AUTH_USER_NOT_FOUND` | User doesn't exist | Register first |
| `AUTH_SESSION_EXPIRED` | Session expired | Re-authenticate |
| `PROFILE_NOT_COMPLETE` | Profile incomplete | Complete onboarding |
| `EMBEDDING_GENERATION_FAILED` | Could not generate embedding | Retry later |
| `RATE_LIMIT_EXCEEDED` | Too many requests | Wait and retry |
| `VALIDATION_ERROR` | Input validation failed | Check input format |
| `RESOURCE_NOT_FOUND` | Resource doesn't exist | Check ID |
| `PERMISSION_DENIED` | No access to resource | Check permissions |

### Error Response Format

```typescript
{
  error: {
    code: string,           // Machine-readable error code
    message: string,        // Human-readable message
    details?: object,       // Additional context
    field?: string,         // For validation errors
    timestamp: string,      // ISO 8601 timestamp
    path: string            // Request path
  }
}
```

**Example:**
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "issues": [
        {
          "field": "email",
          "message": "Invalid email format"
        }
      ]
    },
    "timestamp": "2026-03-16T10:30:00Z",
    "path": "/api/chat"
  }
}
```

---

## Response Formats

### Success Response

```typescript
{
  success: true,
  data: {
    // Response data
  },
  meta: {
    timestamp: string,      // ISO 8601 timestamp
    requestId: string,      // Unique request ID
    processingTime: number  // Milliseconds
  }
}
```

**Example:**
```json
{
  "success": true,
  "data": {
    "id": "post-123",
    "content": "Hello world",
    "created_at": "2026-03-16T10:30:00Z"
  },
  "meta": {
    "timestamp": "2026-03-16T10:30:00.123Z",
    "requestId": "req-abc123",
    "processingTime": 45
  }
}
```

### Paginated Response

```typescript
{
  success: true,
  data: [],               // Array of items
  pagination: {
    page: number,         // Current page
    limit: number,        // Items per page
    total: number,        // Total items
    totalPages: number,   // Total pages
    hasNext: boolean,     // Has next page
    hasPrev: boolean      // Has previous page
  }
}
```

**Example:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8,
    "hasNext": true,
    "hasPrev": false
  }
}
```

---

## Related Documentation

- [Architecture Overview](./ARCHITECTURE.md) - System design
- [Deployment Guide](./DEPLOYMENT.md) - Deployment instructions
- [Supabase Setup](../supabase/setup/) - Database schema
- [Security Guide](./SECURITY.md) - Security features

---

**Document Version:** 1.0.0  
**Last Reviewed:** 2026-03-16  
**Maintained By:** Backend Team
