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

#### `POST /api/chat`
Send message to AI chat.

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
  "version": "2.0.0",
  "authenticated": true,
  "provider": "anthropic",
  "features": {
    "streaming": false,
    "sessions": true,
    "context": true
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

---

## Rate Limiting

Server actions are rate limited:

- **Posts:** 10/hour
- **Comments:** 30/hour
- **Connections:** 20/hour
- **Messages:** 60/hour
- **AI Chat:** 10/minute

---

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

### AI Chat Flow

```typescript
// Send message
const response = await fetch('/api/chat', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'Help me find a co-founder',
    session_id: currentSessionId
  })
})

const { data, error } = await response.json()
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
| `match_suggestions` | AI match suggestions |
| `ai_mentor_sessions` | AI chat sessions |
| `ai_mentor_messages` | AI chat messages |

---

**Last Updated:** March 15, 2026
**Version:** 1.0.0
