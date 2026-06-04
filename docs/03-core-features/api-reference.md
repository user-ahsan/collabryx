# Collabryx API Reference

Complete API documentation for Collabryx platform.

## Base URL

```
Production: https://collabryx.com/api
Development: http://localhost:3000/api
```

## Authentication

Most endpoints require authentication via Supabase session.

### Headers
```
Authorization: Bearer <session_token>
Content-Type: application/json
```

---

## Server Actions

### Posts

#### `createPost(formData: FormData)`
Create a new post.

**Input:**
- `content` (string, required): Post content (1-5000 chars)
- `post_type` (enum): `project-launch` | `teammate-request` | `announcement` | `general`
- `intent` (enum, optional): `cofounder` | `teammate` | `mvp` | `fyp`
- `link_url` (string, optional): URL link
- `is_pinned` (boolean): Pin post

**Returns:**
```typescript
{ data: Post } | { error: string, details?: any[] }
```

**Usage:**
```typescript
const formData = new FormData()
formData.append('content', 'Looking for a co-founder!')
formData.append('post_type', 'project-launch')
formData.append('intent', 'cofounder')

const result = await createPost(formData)
```

#### `updatePost(postId: string, formData: FormData)`
Update existing post.

**Returns:**
```typescript
{ success: true } | { error: string }
```

#### `deletePost(postId: string)`
Soft delete post (sets `is_archived: true`).

#### `reactToPost(postId: string, reactionType: string)`
Add/remove reaction to post.

**Valid reactions:** `like`, `love`, `celebrate`, `insightful`, `curious`

#### `sharePost(postId: string)`
Increment share count.

#### `pinPost(postId: string, pinned: boolean)`
Pin/unpin post.

---

### Comments

#### `createComment(formData: FormData)`
Create new comment.

**Input:**
- `content` (string, required): Comment (1-2000 chars)
- `post_id` (string, required): Post UUID
- `parent_id` (string, optional): Parent comment for replies

#### `updateComment(commentId: string, content: string)`
Edit comment.

#### `deleteComment(commentId: string)`
Delete comment.

#### `reactToComment(commentId: string, reactionType: string)`
React to comment.

**Valid reactions:** `like`, `love`, `celebrate`, `insightful`

---

### Connections

#### `sendConnectionRequest(targetUserId: string)`
Send connection request.

**Returns:**
```typescript
{ data: Connection } | { error: string }
```

#### `acceptConnectionRequest(requestId: string)`
Accept connection request.

**Side effects:**
- Creates notification for sender
- Updates connection status to `accepted`

#### `declineConnectionRequest(requestId: string)`
Decline connection request.

#### `removeConnection(userId: string)`
Remove existing connection.

#### `cancelConnectionRequest(requestId: string)`
Cancel pending request.

---

### Notifications

#### `markNotificationAsRead(notificationId: string)`
Mark single notification as read.

#### `markAllNotificationsAsRead()`
Mark all notifications as read.

#### `deleteNotification(notificationId: string)`
Delete notification.

#### `deleteAllReadNotifications()`
Bulk delete read notifications.

#### `getUnreadCount()`
Get unread notification count.

**Returns:**
```typescript
{ count: number } | { error: string }
```

---

### Matches

#### `acceptMatch(matchId: string)`
Accept match suggestion.

**Side effects:**
- Creates connection
- Creates notification for matched user
- Records match activity

#### `dismissMatch(matchId: string)`
Dismiss match suggestion.

#### `updateMatchPreferences(preferences)`
Update match preferences.

**Input:**
```typescript
{
  looking_for?: string[]
  location?: string
  skills?: string[]
  min_match_percentage?: number
}
```

#### `getMatchSuggestions(limit = 20)`
Get match suggestions.

**Returns:**
```typescript
{ data: MatchSuggestion[] } | { error: string }
```

---

### AI Mentor

#### `createSession(title?: string)`
Create new AI mentor session.

#### `getOrCreateActiveSession()`
Get or create active session.

#### `sendMessage(sessionId: string, content: string)`
Send message to AI mentor.

**Returns:**
```typescript
{ data: AIMessage } | { error: string }
```

#### `getSessionHistory(sessionId: string)`
Get session message history.

#### `getUserSessions()`
Get all user sessions.

#### `archiveSession(sessionId: string)`
Archive session.

---

## REST API Endpoints

### Chat API

#### `POST /api/ai/stream`
Stream AI mentor responses with multi-provider failover and enhanced RAG context.

**Request:**
```json
{
  "userId": "user-uuid",
  "query": "Help me find a co-founder",
  "messages": [
    { "role": "user", "content": "Hello" },
    { "role": "assistant", "content": "Hi! How can I help?" }
  ],
  "sessionId": "session-uuid-optional",
  "preferredProvider": "openai",
  "otherUserIds": ["user-b-uuid"],
  "startupContext": {
    "idea": "AI-powered matching platform",
    "stage": "mvp",
    "industry": "technology",
    "target_users": "students and founders",
    "technical_needs": ["backend developer", "devops"],
    "non_technical_needs": ["marketing", "sales"],
    "current_team_size": 1,
    "looking_for": ["cofounder", "developer"]
  }
}
```

**Request Parameters:**

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `userId` | string | ✅ Yes | Authenticated user ID |
| `query` | string | No | Current user query |
| `messages` | array | No | Conversation history |
| `sessionId` | string | No | AI mentor session ID |
| `preferredProvider` | string | No | Specific provider to use (bypasses failover) |
| `otherUserIds` | string[] | No | Additional user IDs for collaboration advice |
| `startupContext` | object | No | Startup planning context for tailored mentoring |

**Response:**
```
Content-Type: text/event-stream
X-RAG-Warnings: ["profile incomplete", "no vector context"]
```

Streaming response with Server-Sent Events. Warnings about context assembly are included in the `X-RAG-Warnings` header for debugging.

**Error Responses:**

| Status | Error Type | Description |
|--------|-----------|-------------|
| 400 | `ValidationError` | Missing `userId` or invalid input |
| 500 | `AllProvidersFailedError` | All registered providers failed |
| 500 | `ProviderTimeoutError` | Provider request timed out |
| 500 | `StreamingError` | Streaming-specific failure |

#### `POST /api/chat`
Send message to AI chat (legacy endpoint).

**Request:**
```json
{
  "message": "Hello",
  "session_id": "uuid-optional",
  "context": {
    "page": "/dashboard",
    "user_action": "clicked_chat"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": { ... },
    "session_id": "uuid"
  }
}
```

#### `GET /api/chat`
Get API status.

**Response:**
```json
{
  "status": "operational",
  "version": "3.0.0",
  "authenticated": true,
  "providers": ["openai", "anthropic"],
  "features": {
    "streaming": true,
    "sessions": true,
    "context": true,
    "multiProvider": true,
    "startupPlanning": true,
    "collaborationAdvice": true
  }
}
```

---

### Embeddings API

#### `POST /api/embeddings/generate`
Generate embeddings for profile.

#### `POST /api/embeddings/retry-dlq`
Retry failed embeddings from DLQ.

#### `GET /api/embeddings/status/[userId]`
Get embedding status for user.

---

## Error Handling

All server actions follow consistent error format:

```typescript
// Success
{ data: T, success: true }

// Error
{ error: string, details?: any[] }
```

### Common Errors

| Error | Code | Description |
|-------|------|-------------|
| `Unauthorized` | 401 | User not authenticated |
| `Invalid input` | 400 | Validation failed |
| `Not found` | 404 | Resource not found |
| `Failed to create` | 500 | Database error |

### AI Provider Errors

| Error | Description |
|-------|-------------|
| `AllProvidersFailedError` | All registered AI providers failed |
| `ProviderConfigError` | Invalid provider configuration |
| `StreamingError` | Streaming-specific failure |
| `ProviderTimeoutError` | Provider request timed out |
| `AIProviderError` | Generic provider error with provider name |

## Caching

Server actions use Next.js cache revalidation:

- `revalidatePath('/dashboard')` - Dashboard feed
- `revalidatePath('/matches')` - Matches page
- `revalidatePath('/notifications')` - Notifications
- `revalidatePath('/my-profile')` - Profile page

---

## Examples

### Complete Post Creation Flow

```typescript
// 1. Create post
const formData = new FormData()
formData.append('content', 'Building a fintech startup!')
formData.append('post_type', 'project-launch')
formData.append('intent', 'cofounder')

const { data: post, error } = await createPost(formData)

if (error) {
  toast.error(error)
} else {
  toast.success('Post created!')
  // Dashboard automatically revalidates
}
```

### Connection Request Flow

```typescript
// Send request
const result = await sendConnectionRequest(userId)

if (result.error) {
  toast.error(result.error)
} else {
  toast.success('Connection request sent!')
}

// Accept request
await acceptConnectionRequest(requestId)
// Creates notification automatically
```

### AI Chat Flow (Streaming)

```typescript
// Send message with streaming
const response = await fetch('/api/ai/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    userId: currentUserId,
    query: 'Help me find a co-founder',
    messages: conversationHistory,
    session_id: currentSessionId,
    // Optional: collaboration advice
    otherUserIds: ['potential-partner-id'],
    // Optional: startup planning
    startupContext: {
      idea: 'AI matching platform',
      stage: 'mvp',
      looking_for: ['cofounder']
    }
  })
})

// Check for context assembly warnings
const warnings = response.headers.get('X-RAG-Warnings')
if (warnings) {
  console.log('Context warnings:', JSON.parse(warnings))
}

// Read streaming response
const reader = response.body.getReader()
// ... process SSE stream
```

---

## Database Schema Reference

For complete database schema, see:
- `supabase/setup/99-master-all-tables.sql`
- `docs/04-infrastructure/database/schema.md`

### Key Tables

| Table | Purpose |
|-------|---------|
| `profiles` | User profiles |
| `posts` | User posts |
| `comments` | Post comments |
| `connections` | User connections |
| `notifications` | User notifications |
| `ai_mentor_sessions` | AI chat sessions |
| `ai_mentor_messages` | AI chat messages |

---

**Last Updated:** May 22, 2026
**Version:** 3.0.0
