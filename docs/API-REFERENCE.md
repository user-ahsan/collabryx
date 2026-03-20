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
- [Activity Tracking Endpoints](#activity-tracking-endpoints)
- [Match Generation Endpoints](#match-generation-endpoints)
- [Notification Endpoints](#notification-endpoints)
- [Content Moderation Endpoints](#content-moderation-endpoints)
- [AI Mentor Endpoints](#ai-mentor-endpoints)
- [Analytics Endpoints](#analytics-endpoints)
- [Upload Endpoints](#upload-endpoints)
- [Health Check Endpoints](#health-check-endpoints)
- [Server Actions](#server-actions)
- [Edge Functions](#edge-functions)
- [Rate Limits](#rate-limits)
- [Error Codes](#error-codes)
- [Standard Error Response Format](#standard-error-response-format)
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

## Activity Tracking Endpoints

### Track Profile View

Track when a user views another user's profile.

**Endpoint:** `POST /api/activity/track/view`

**Authentication:** Required (user must be logged in)

**Request Body:**
```typescript
{
  viewed_user_id: string  // UUID of the user whose profile was viewed
}
```

**Example:**
```typescript
const response = await fetch('/api/activity/track/view', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    viewed_user_id: 'user-456'
  })
})

const result = await response.json()
// { success: true, data: { activity_id: '...', viewer_id: '...', viewed_user_id: '...', timestamp: '...' } }
```

**Response:**
```typescript
{
  success: boolean,
  message?: string,
  data?: {
    activity_id: string,
    viewer_id: string,
    viewed_user_id: string,
    timestamp: string,        // ISO 8601
    backend_mode: string
  },
  error?: string,
  circuit_breaker_state?: 'closed' | 'open' | 'half-open'
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request body or self-view attempt |
| 401 | Unauthorized |
| 403 | Invalid CSRF token |
| 404 | Viewed user not found |
| 429 | Rate limit exceeded |
| 503 | Backend service unavailable |

**Rate Limit:** 30 requests per hour per user

---

### Track Match Building Activity

Track user actions during match building (like, pass, super-like).

**Endpoint:** `POST /api/activity/track/build`

**Authentication:** Required

**Request Body:**
```typescript
{
  matched_user_id: string,              // UUID of the matched user
  action: 'like' | 'pass' | 'super-like'
}
```

**Example:**
```typescript
const response = await fetch('/api/activity/track/build', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    matched_user_id: 'user-789',
    action: 'like'
  })
})
```

**Response:**
```typescript
{
  success: boolean,
  message?: string,
  data?: {
    activity_id: string,
    user_id: string,
    matched_user_id: string,
    action: 'like' | 'pass' | 'super-like',
    timestamp: string,
    backend_mode: string
  },
  error?: string,
  circuit_breaker_state?: string
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request or self-match attempt |
| 401 | Unauthorized |
| 403 | Invalid CSRF token |
| 404 | Matched user not found |
| 429 | Rate limit exceeded |
| 503 | Backend unavailable |

**Rate Limit:** 50 requests per hour per user

---

### Get Activity Feed

Retrieve the user's activity feed (match activities, notifications).

**Endpoint:** `GET /api/activity/feed`

**Authentication:** Required

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `limit` | number | ❌ No | Max activities to return (default: 20) |
| `offset` | number | ❌ No | Pagination offset (default: 0) |

**Example:**
```typescript
const response = await fetch('/api/activity/feed?limit=20&offset=0', {
  headers: { 'Authorization': `Bearer ${token}` }
})

const result = await response.json()
```

**Response:**
```typescript
{
  data: Array<{
    id: string,
    type: string,
    activity: string,
    match_percentage?: number,
    created_at: string,
    is_read: boolean,
    actor: {
      id: string,
      name: string,
      avatar?: string,
      headline?: string
    }
  }>,
  count: number,
  hasMore: boolean
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 401 | Unauthorized |
| 500 | Internal server error |

---

## Match Generation Endpoints

### Generate Matches

Generate match suggestions for a user.

**Endpoint:** `POST /api/matches/generate`

**Authentication:** Required

**Request Body:**
```typescript
{
  user_id?: string,       // Optional, defaults to authenticated user
  limit?: number,         // 1-100 (default: 20)
  min_score?: number      // 0-100 (default: 50)
}
```

**Example:**
```typescript
const response = await fetch('/api/matches/generate', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    limit: 10,
    min_score: 60
  })
})
```

**Response:**
```typescript
{
  success: boolean,
  message?: string,
  data?: {
    user_id: string,
    matches_generated: number,
    status: 'queued' | 'processing' | 'completed' | 'failed',
    backend_mode: string,
    suggestions?: Array<{
      matched_user_id: string,
      match_percentage: number,
      reasons: string[],
      ai_confidence?: number
    }>
  },
  error?: string,
  circuit_breaker_state?: string
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Onboarding not completed or embedding not ready |
| 401 | Unauthorized |
| 403 | Cannot generate for other users |
| 429 | Rate limit exceeded |
| 503 | Backend unavailable |

**Rate Limit:** 10 requests per hour per user

**Prerequisites:**
- User must have completed onboarding
- User must have a generated vector embedding

---

### Batch Generate Matches (Admin)

Admin-only endpoint for generating matches in bulk for multiple users.

**Endpoint:** `POST /api/matches/generate/batch`

**Authentication:** Required (Admin only)

**Request Body:**
```typescript
{
  user_ids: string[],     // Array of UUIDs (1-100 users)
  limit?: number,         // 1-100 (default: 20)
  min_score?: number,     // 0-100 (default: 50)
  force_regenerate?: boolean  // Force regeneration (default: false)
}
```

**Example:**
```typescript
const response = await fetch('/api/matches/generate/batch', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    user_ids: ['user-1', 'user-2'],
    limit: 20,
    force_regenerate: true
  })
})
```

**Response:**
```typescript
{
  success: boolean,
  message?: string,
  data?: {
    batch_id: string,
    total_users: number,
    processed: number,
    succeeded: number,
    failed: number,
    status: 'queued' | 'processing' | 'completed' | 'partial' | 'failed',
    results?: Array<{
      user_id: string,
      status: 'success' | 'failed' | 'skipped',
      matches_generated?: number,
      error?: string
    }>,
    backend_mode: string
  },
  error?: string,
  circuit_breaker_state?: string
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request body |
| 401 | Unauthorized |
| 403 | Admin access required |
| 503 | Backend unavailable |

---

### Match Service Health Check

Check the health status of the match generation service.

**Endpoint:** `GET /api/matches/health`

**Authentication:** Optional

**Query Parameters:**
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `refresh` | boolean | ❌ No | Clear health cache (default: false) |

**Example:**
```typescript
const response = await fetch('/api/matches/health?refresh=true')
const health = await response.json()
```

**Response:**
```typescript
{
  status: 'healthy' | 'unhealthy' | 'degraded',
  backend_available: boolean,
  backend_mode: string,
  circuit_breaker_state: 'closed' | 'open' | 'half-open',
  response_time_ms?: number,
  worker_health?: {
    status: string,
    model_info?: {
      model_name: string,
      dimensions: number,
      device: string
    },
    supabase_connected: boolean,
    queue_size?: number
  },
  database_connected: boolean,
  error?: string,
  message?: string
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Service healthy |
| 503 | Service degraded or unhealthy |

---

## Notification Endpoints

### Send Notification

Send a single notification to a user.

**Endpoint:** `POST /api/notifications/send`

**Authentication:** Required

**Request Body:**
```typescript
{
  user_id: string,                              // Recipient UUID
  type: 'connect' | 'message' | 'like' | 'comment' | 'system' | 'match',
  content: string,                              // Max 500 characters
  actor_id?: string,                            // Actor UUID
  actor_name?: string,                          // Max 100 chars
  actor_avatar?: string,                        // URL
  resource_type?: 'post' | 'profile' | 'conversation' | 'match',
  resource_id?: string                          // UUID
}
```

**Example:**
```typescript
const response = await fetch('/api/notifications/send', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    user_id: 'user-456',
    type: 'like',
    content: 'Someone liked your profile',
    actor_id: 'user-123',
    actor_name: 'John Doe',
    resource_type: 'profile'
  })
})
```

**Response:**
```typescript
{
  success: boolean,
  message?: string,
  data?: {
    notification_id: string,
    user_id: string,
    type: string,
    status: 'queued' | 'sent' | 'failed',
    backend_mode: string
  },
  error?: string,
  circuit_breaker_state?: string
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request body |
| 401 | Unauthorized |
| 403 | Invalid CSRF token |
| 404 | Recipient or actor not found |
| 429 | Rate limit exceeded |
| 503 | Backend unavailable |

**Rate Limit:** 20 requests per hour per user

---

### Send Daily Digest (Admin)

Trigger daily notification digest sending.

**Endpoint:** `POST /api/notifications/digest/send`

**Authentication:** Required (Admin only)

**Request Body:**
```typescript
{
  date?: string,          // YYYY-MM-DD format (optional, defaults to today)
  batch_size?: number,    // 1-1000 (default: 100)
  dry_run?: boolean       // Test mode (default: false)
}
```

**Example:**
```typescript
const response = await fetch('/api/notifications/digest/send', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    date: '2026-03-19',
    batch_size: 50,
    dry_run: true
  })
})
```

**Response:**
```typescript
{
  success: boolean,
  message?: string,
  data?: {
    digests_queued: number,
    digests_sent: number,
    digests_failed: number,
    status: 'queued' | 'processing' | 'completed' | 'failed',
    backend_mode: string,
    schedule_metadata?: {
      triggered_at: string,
      triggered_by: string,
      date_range?: {
        start: string,
        end: string
      }
    }
  },
  error?: string,
  circuit_breaker_state?: string
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request body |
| 401 | Unauthorized |
| 403 | Admin access required |
| 429 | Rate limit exceeded |
| 503 | Backend unavailable |

**Rate Limit:** 5 requests per 15 minutes

---

### Cleanup Old Notifications (Admin)

Delete or archive old notifications.

**Endpoint:** `POST /api/notifications/cleanup`

**Authentication:** Required (Admin only)

**Request Body:**
```typescript
{
  older_than_days?: number,   // 1-365 (default: 30)
  batch_size?: number,        // 1-1000 (default: 500)
  dry_run?: boolean,          // Test mode (default: false)
  user_id?: string            // Target specific user (optional)
}
```

**Example:**
```typescript
const response = await fetch('/api/notifications/cleanup', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`,
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    older_than_days: 90,
    batch_size: 1000,
    dry_run: false
  })
})
```

**Response:**
```typescript
{
  success: boolean,
  message?: string,
  data?: {
    notifications_deleted: number,
    notifications_archived: number,
    status: 'queued' | 'processing' | 'completed' | 'failed',
    backend_mode: string,
    cleanup_metadata?: {
      triggered_at: string,
      triggered_by: string,
      older_than_days: number,
      cutoff_date: string,
      target_user_id?: string
    }
  },
  error?: string,
  circuit_breaker_state?: string
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request body |
| 401 | Unauthorized |
| 403 | Admin access required |
| 429 | Rate limit exceeded |
| 503 | Backend unavailable |

**Rate Limit:** 5 requests per 15 minutes

---

## Content Moderation Endpoints

### Moderate Content

Analyze content for toxicity, spam, NSFW, and PII.

**Endpoint:** `POST /api/moderate`

**Authentication:** Required

**Request Body:**
```typescript
{
  content: string,                          // Content to moderate
  content_type?: 'post' | 'comment' | 'message' | 'profile'  // default: 'post'
}
```

**Example:**
```typescript
const response = await fetch('/api/moderate', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    content: 'This is a test post',
    content_type: 'post'
  })
})

const result = await response.json()
// { approved: true, flag_for_review: false, auto_reject: false, risk_score: 0.05, ... }
```

**Response:**
```typescript
{
  approved: boolean,
  flag_for_review: boolean,
  auto_reject: boolean,
  risk_score: number,           // 0.0 - 1.0
  action: 'approved' | 'flag_for_review' | 'auto_reject',
  details: {
    toxicity?: { score: number },
    spam?: { score: number },
    nsfw?: { score: number },
    pii?: { detected: boolean, types: string[] }
  },
  error?: string
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request body |
| 401 | Unauthorized |
| 403 | Invalid CSRF token |
| 503 | Backend unavailable (uses fallback) |

**Moderation Actions:**
- `approved`: Content is safe (risk_score < 0.3)
- `flag_for_review`: Content needs manual review (0.3 <= risk_score < 0.7)
- `auto_reject`: Content is rejected (risk_score >= 0.7 or contains PII)

---

## AI Mentor Endpoints

### Send AI Mentor Message

Get AI-powered career/project advice.

**Endpoint:** `POST /api/ai-mentor/message`

**Authentication:** Required

**Request Body:**
```typescript
{
  user_id: string,        // Must match authenticated user
  message: string,        // 1-2000 characters
  session_id?: string     // Existing session UUID (optional)
}
```

**Example:**
```typescript
const response = await fetch('/api/ai-mentor/message', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'X-CSRF-Token': csrfToken
  },
  body: JSON.stringify({
    user_id: user.id,
    message: 'How can I improve my profile visibility?',
    session_id: null
  })
})
```

**Response:**
```typescript
{
  response: string,
  action_items: Array<{
    task: string,
    priority: 'high' | 'medium' | 'low'
  }>,
  session_id: string,
  message_id?: string,
  suggested_next_steps: string[]
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request body |
| 401 | Unauthorized |
| 403 | Cannot access other users' data |
| 403 | Invalid CSRF token |
| 503 | Backend unavailable (uses fallback) |

**Fallback Mode:** When Python worker is unavailable, predefined helpful responses are returned based on keywords.

---

## Analytics Endpoints

### Daily Analytics Aggregation (Admin)

Trigger daily analytics data aggregation.

**Endpoint:** `POST /api/analytics/daily`

**Authentication:** Required (Admin only)

**Request Body:**
```typescript
{
  date?: string   // YYYY-MM-DD format (optional, defaults to today)
}
```

**Example:**
```typescript
const response = await fetch('/api/analytics/daily', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${adminToken}`
  },
  body: JSON.stringify({
    date: '2026-03-19'
  })
})
```

**Response:**
```typescript
{
  status: 'success' | 'error',
  date: string,
  metrics: {
    dau?: number,           // Daily Active Users
    mau?: number,           // Monthly Active Users
    wau?: number,           // Weekly Active Users
    new_users?: number,
    new_posts?: number,
    new_matches?: number,
    new_connections?: number,
    new_messages?: number,
    content_flagged?: number
  },
  error?: string
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request body |
| 401 | Unauthorized |
| 403 | Admin access required |
| 503 | Backend unavailable (uses fallback) |

**Fallback Mode:** When Python worker is unavailable, basic metrics are calculated directly from the database.

---

## Upload Endpoints

### Upload File

Upload a file to Supabase Storage.

**Endpoint:** `POST /api/upload`

**Authentication:** Required

**Request Body:** FormData

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `file` | File | ✅ Yes | File to upload |
| `type` | string | ❌ No | `avatar` | `banner` | `post` (default: `post`) |

**Example:**
```typescript
const formData = new FormData()
formData.append('file', fileInput.files[0])
formData.append('type', 'avatar')

const response = await fetch('/api/upload', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-CSRF-Token': csrfToken
  },
  body: formData
})

const result = await response.json()
// { success: true, url: 'https://...', path: '...', bucket: '...' }
```

**Response:**
```typescript
{
  success: boolean,
  url: string,              // Public URL
  path: string,             // Storage path
  bucket: string            // Bucket name
}
```

**File Validation:**
| Type | Max Size | Allowed Types |
|------|----------|---------------|
| `avatar` | 5 MB | image/jpeg, image/png, image/webp |
| `banner` | 10 MB | image/jpeg, image/png, image/webp |
| `post` | 10 MB | image/jpeg, image/png, image/webp, video/mp4 |

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | No file provided or validation failed |
| 401 | Unauthorized |
| 403 | Invalid CSRF token |
| 500 | Upload failed |

---

### Generate Signed Upload URL

Generate a signed URL for direct file upload.

**Endpoint:** `POST /api/upload/sign`

**Authentication:** Required

**Request Body:**
```typescript
{
  fileName: string,         // 1-255 characters
  fileType: string,         // MIME type
  fileSize: number,         // Bytes (max varies by type)
  uploadType: 'avatar' | 'banner'
}
```

**Example:**
```typescript
const response = await fetch('/api/upload/sign', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    fileName: 'profile.jpg',
    fileType: 'image/jpeg',
    fileSize: 1024 * 1024 * 3,  // 3MB
    uploadType: 'avatar'
  })
})

const result = await response.json()
// { success: true, uploadUrl: 'https://...', publicUrl: 'https://...', expiresAt: '...' }
```

**Response:**
```typescript
{
  success: boolean,
  uploadUrl: string,        // Signed upload URL
  publicUrl: string,        // Public URL after upload
  path: string,             // Storage path
  bucket: string,           // Bucket name
  expiresAt: string         // ISO 8601 (60 seconds from now)
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Success |
| 400 | Invalid request or validation failed |
| 401 | Unauthorized |
| 500 | Failed to generate URL |

---

## Health Check Endpoints

### System Health Check

Check overall system health including database and Python worker.

**Endpoint:** `GET /api/health`

**Authentication:** Optional

**Example:**
```typescript
const response = await fetch('/api/health')
const health = await response.json()
```

**Response:**
```typescript
{
  status: 'healthy' | 'degraded' | 'unhealthy',
  timestamp: string,        // ISO 8601
  version: string,          // App version
  environment: string,      // development | production
  checks: {
    database: {
      status: 'ok' | 'failed',
      error?: string
    },
    pythonWorker: {
      status: 'ok' | 'failed',
      error?: string
    }
  },
  uptime: number            // Seconds
}
```

**Status Codes:**
| Code | Description |
|------|-------------|
| 200 | Service healthy or degraded |
| 503 | Service unhealthy |

**Health Status:**
- `healthy`: Database and Python worker both operational
- `degraded`: Database OK, but Python worker unavailable
- `unhealthy`: Database connection failed

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

## Standard Error Response Format

All API endpoints return errors in a consistent format to enable reliable error handling in client applications.

### Error Response Structure

```typescript
{
  success: false,           // Always false for error responses
  error: {
    code: string,           // Machine-readable error code (SCREAMING_SNAKE_CASE)
    message: string,        // Human-readable message
    details?: object,       // Additional context (Zod errors, stack traces, etc.)
    field?: string,         // For validation errors - the problematic field
    timestamp?: string,     // ISO 8601 timestamp
    path?: string           // Request path
  },
  circuit_breaker_state?: string  // When backend is involved
}
```

### Error Categories

#### Authentication Errors (401)

| Code | Message | Resolution |
|------|---------|------------|
| `UNAUTHORIZED` | Unauthorized | Missing or invalid auth token |
| `INVALID_TOKEN` | Invalid token format | Token malformed or expired |
| `USER_NOT_FOUND` | User not found | User ID doesn't exist |

#### Authorization Errors (403)

| Code | Message | Resolution |
|------|---------|------------|
| `FORBIDDEN` | Forbidden | Insufficient permissions |
| `ADMIN_ACCESS_REQUIRED` | Admin access required | Endpoint restricted to admins |
| `INVALID_CSRF_TOKEN` | Invalid CSRF token | CSRF validation failed |
| `CANNOT_ACCESS_OTHER_USERS_DATA` | Cannot access other users' data | User tried to access another user's resource |

#### Validation Errors (400)

| Code | Message | Resolution |
|------|---------|------------|
| `VALIDATION_ERROR` | Invalid request body | Zod validation failed |
| `INVALID_REQUEST` | Invalid request | Malformed request |
| `MISSING_REQUIRED_FIELDS` | Missing required fields | Required fields not provided |
| `INVALID_USER_ID` | Invalid user ID format | UUID format invalid |
| `SELF_ACTION_NOT_ALLOWED` | Cannot track self profile views | User tried to perform action on themselves |
| `ONBOARDING_NOT_COMPLETED` | Onboarding not completed | User must complete onboarding first |
| `EMBEDDING_NOT_READY` | Vector embedding not ready | Wait for embedding generation |

#### Resource Errors (404)

| Code | Message | Resolution |
|------|---------|------------|
| `NOT_FOUND` | Resource not found | Resource doesn't exist |
| `USER_NOT_FOUND` | User not found | User ID doesn't exist |
| `PROFILE_NOT_FOUND` | Profile not found | Profile doesn't exist |
| `DLQ_ITEM_NOT_FOUND` | DLQ item not found | Dead letter queue item not found |

#### Rate Limit Errors (429)

| Code | Message | Resolution |
|------|---------|------------|
| `RATE_LIMIT_EXCEEDED` | Rate limit exceeded | Wait and retry |
| `TOO_MANY_REQUESTS` | Too many requests | Wait and retry |

#### Backend Service Errors (503)

| Code | Message | Resolution |
|------|---------|------------|
| `SERVICE_UNAVAILABLE` | Service unavailable | Backend service down |
| `BACKEND_UNAVAILABLE` | Python worker backend not available | Retry later |
| `MATCH_GENERATION_FAILED` | Match generation failed | Backend connection failed |
| `NOTIFICATION_DELIVERY_FAILED` | Notification delivery failed | Backend connection failed |

#### Server Errors (500)

| Code | Message | Resolution |
|------|---------|------------|
| `INTERNAL_SERVER_ERROR` | Internal server error | Contact support |
| `UPLOAD_FAILED` | Failed to upload file | Retry or check file |
| `DATABASE_ERROR` | Database error | Retry later |

### Error Response Examples

#### Validation Error (400)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request body",
    "details": {
      "issues": [
        {
          "field": "email",
          "message": "Invalid email format",
          "code": "invalid_string"
        }
      ]
    },
    "timestamp": "2026-03-19T10:30:00Z",
    "path": "/api/notifications/send"
  }
}
```

#### Authentication Error (401)
```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Unauthorized",
    "timestamp": "2026-03-19T10:30:00Z",
    "path": "/api/activity/track/view"
  }
}
```

#### Authorization Error (403)
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CSRF_TOKEN",
    "message": "Invalid CSRF token",
    "timestamp": "2026-03-19T10:30:00Z",
    "path": "/api/matches/generate"
  }
}
```

#### Rate Limit Error (429)
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Rate limit exceeded",
    "details": {
      "retry_after": 3600,
      "reset_at": "2026-03-19T11:30:00Z"
    },
    "timestamp": "2026-03-19T10:30:00Z",
    "path": "/api/matches/generate"
  },
  "retry_after": 3600
}
```

#### Backend Service Error (503)
```json
{
  "success": false,
  "error": {
    "code": "BACKEND_UNAVAILABLE",
    "message": "Match generation service unavailable",
    "details": {
      "message": "Please try again later or contact support"
    },
    "circuit_breaker_state": "open"
  },
  "circuit_breaker_state": "open"
}
```

### Client-Side Error Handling

```typescript
async function handleApiResponse(response: Response) {
  const data = await response.json()
  
  if (!response.ok) {
    const errorCode = data.error?.code
    const errorMessage = data.error?.message
    
    switch (errorCode) {
      case 'UNAUTHORIZED':
        // Redirect to login
        router.push('/login')
        break
      case 'RATE_LIMIT_EXCEEDED':
        // Show retry after message
        const retryAfter = data.error?.details?.retry_after
        toast.error(`Too many requests. Try again in ${retryAfter}s`)
        break
      case 'VALIDATION_ERROR':
        // Show field-specific errors
        data.error.details?.issues?.forEach((issue: any) => {
          setError(issue.field, { message: issue.message })
        })
        break
      default:
        toast.error(errorMessage || 'Something went wrong')
    }
    
    throw new Error(errorCode)
  }
  
  return data
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
