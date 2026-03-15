# Supabase Edge Functions

Collection of Deno-based edge functions for Collabryx backend automation.

## 📦 Functions

### 1. `generate-embedding` (PRIORITY 1)
**Purpose:** Generate vector embeddings for profile updates  
**Trigger:** Database webhook on profiles table  
**Endpoint:** `POST /functions/v1/generate-embedding`

**Features:**
- Validates profile completion (>= 50% threshold)
- Calls Python worker API for embedding generation
- Handles rate limiting (10 requests per day per user)
- Queues failed requests for retry
- Dead letter queue for permanent failures

**Webhook Payload:**
```json
{
  "type": "UPDATE",
  "table": "profiles",
  "record": { "id": "...", "full_name": "...", ... }
}
```

**Response:**
```json
{
  "success": true,
  "embedding": [0.1, 0.2, ...],
  "queued": false
}
```

---

### 2. `send-notification` (PRIORITY 2)
**Purpose:** Send real-time notifications  
**Trigger:** Database insert on notifications table  
**Endpoint:** `POST /functions/v1/send-notification`

**Features:**
- Broadcasts via Supabase Realtime
- Updates unread count cache
- Supports all notification types

**Webhook Payload:**
```json
{
  "type": "INSERT",
  "table": "notifications",
  "record": {
    "id": "...",
    "user_id": "...",
    "type": "match",
    "title": "New Match!",
    "message": "..."
  }
}
```

---

### 3. `calculate-matches` (PRIORITY 3)
**Purpose:** Calculate match suggestions using vector similarity  
**Trigger:** Manual or scheduled (daily)  
**Endpoint:** `POST /functions/v1/calculate-matches`

**Features:**
- Vector similarity search (cosine)
- Configurable limit and minimum score
- Authenticated access only
- Fallback to direct query if RPC unavailable

**Request Body:**
```json
{
  "user_id": "optional-override",
  "limit": 20,
  "min_score": 0.3
}
```

**Response:**
```json
{
  "success": true,
  "matches": [...],
  "count": 15
}
```

---

### 4. `sync-profile-data` (PRIORITY 4)
**Purpose:** Sync profile data across tables  
**Trigger:** Manual (after bulk updates)  
**Endpoint:** `POST /functions/v1/sync-profile-data`

**Features:**
- Counts related records (skills, interests, experiences, projects)
- Calculates completion score
- Triggers embedding generation if profile complete
- Authenticated access only

**Request Body:**
```json
{
  "user_id": "..."
}
```

**Response:**
```json
{
  "success": true,
  "completion_score": 85,
  "counts": {
    "skills": 5,
    "interests": 3,
    "experiences": 2,
    "projects": 1
  }
}
```

---

### 5. `cleanup-expired-data` (PRIORITY 5)
**Purpose:** Clean up old data (scheduled weekly)  
**Trigger:** Scheduled (weekly) or manual  
**Endpoint:** `POST /functions/v1/cleanup-expired-data`

**Features:**
- Deletes old read notifications (30+ days)
- Archives old AI mentor sessions (90+ days)
- Cleans processed dead letter queue entries (7+ days)
- Cleans expired rate limit entries
- Dry run mode for testing

**Request Body:**
```json
{
  "dry_run": false,
  "days_old": 30
}
```

**Response:**
```json
{
  "success": true,
  "results": {
    "deleted_notifications": 150,
    "archived_sessions": 25,
    "cleaned_dlq": 10,
    "cleaned_rate_limits": 50,
    "dry_run": false
  },
  "cutoff_date": "2026-02-14T00:00:00Z"
}
```

---

## 🛠️ Shared Utilities

### `_shared/cors.ts`
CORS headers for all edge functions.

### `_shared/auth.ts`
Authentication validation using Supabase Auth.

### `_shared/types.ts`
TypeScript type definitions for requests/responses.

---

## 🚀 Deployment

### Local Testing
```bash
# Start all functions locally
supabase functions serve

# Test specific function
supabase functions serve generate-embedding

# Invoke function locally
curl -i --location --request POST 'http://localhost:54321/functions/v1/generate-embedding' \
  --header 'Authorization: Bearer YOUR_TOKEN' \
  --header 'Content-Type: application/json' \
  --data '{"record":{"id":"..."}}'
```

### Production Deployment
```bash
# Deploy all functions
supabase functions deploy

# Deploy specific function
supabase functions deploy generate-embedding

# Set environment variables
supabase secrets set PYTHON_WORKER_URL=https://your-worker-url.com
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
```

---

## 🔧 Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `SUPABASE_URL` | ✅ | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | Service role key (admin access) |
| `PYTHON_WORKER_URL` | ✅ (generate-embedding) | Python worker API URL |

---

## 📊 Monitoring

### Health Check
```bash
curl https://your-project.supabase.co/functions/v1/generate-embedding \
  -X OPTIONS
```

### Logs
```bash
# View function logs
supabase functions logs generate-embedding

# Stream logs
supabase functions logs generate-embedding --watch
```

---

## 🔒 Security

- All functions require authentication (except webhook triggers)
- Service role key used only for database operations
- CORS configured for allowed origins
- Input validation on all requests
- Error handling prevents information leakage

---

## 📝 Database Triggers

Set up these triggers to auto-invoke functions:

```sql
-- Profile update → Generate embedding
CREATE TRIGGER on_profile_update
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.invoke('generate-embedding');

-- Notification insert → Send notification
CREATE TRIGGER on_notification_insert
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION supabase_functions.invoke('send-notification');
```

---

## 🐛 Troubleshooting

### Common Issues

**Function timeout:**
- Increase timeout in `supabase/config.toml`
- Optimize database queries
- Use background jobs for long operations

**CORS errors:**
- Check `corsHeaders` in `_shared/cors.ts`
- Verify origin is allowed

**Authentication failures:**
- Ensure valid JWT token in Authorization header
- Check service role key is set

**Python worker connection:**
- Verify `PYTHON_WORKER_URL` environment variable
- Check worker is running and accessible

---

Last updated: 2026-03-16
