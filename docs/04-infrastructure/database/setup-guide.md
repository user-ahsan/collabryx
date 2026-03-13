# Database Setup Guide

Complete guide to setting up the Collabryx database schema in Supabase.

---

## Quick Start

### Option 1: Complete Setup (Recommended)

Run the master migration file that includes all tables:

```sql
-- In Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

-- Run this file:
supabase/setup/99-master-all-tables.sql
```

This creates all 34+ tables including:
- User management (profiles, user_skills, user_interests, etc.)
- Social features (posts, comments, reactions)
- Matching system (match_suggestions, match_scores)
- Messaging (conversations, messages)
- Notifications
- AI features (ai_mentor_sessions)
- **Vector embeddings** (profile_embeddings, DLQ, rate limits)

### Option 2: Incremental Setup

Run migration files in order:

```bash
# Core tables (1-22)
01-profiles.sql
02-user-skills.sql
03-user-interests.sql
04-user-experiences.sql
05-user-projects.sql
06-posts.sql
07-post-attachments.sql
08-post-reactions.sql
09-comments.sql
10-comment-likes.sql
11-connections.sql
12-match-suggestions.sql
13-match-scores.sql
14-match-activity.sql
15-match-preferences.sql
16-conversations.sql
17-messages.sql
18-notifications.sql
19-ai-mentor-sessions.sql
20-ai-mentor-messages.sql
21-notification-preferences.sql
22-theme-preferences.sql

# Vector embeddings system (23-29)
23-profile-embeddings.sql
24-embeddings-trigger.sql
25-migrate-384-dimensions.sql
26-dead-letter-queue.sql
27-rate-limiting.sql
28-pending-embeddings.sql
29-validation-constraints.sql

# Storage buckets
98-storage-buckets.sql
```

---

## Embedding System Setup

The embedding system requires additional setup for the Python worker.

### Step 1: Run Embedding Migrations

```sql
-- Execute in Supabase SQL Editor
-- File: supabase/setup/99-embedding-system-complete.sql
```

This creates:

| Table | Purpose |
|-------|---------|
| `embedding_dead_letter_queue` | Failed embedding retry system |
| `embedding_rate_limits` | Rate limiting (3 requests/hour/user) |
| `embedding_pending_queue` | Onboarding embedding queue |

### Step 2: Verify Setup

```sql
-- Check tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'embedding_%';

-- Expected: embedding_dead_letter_queue, embedding_rate_limits, 
--           embedding_pending_queue, profile_embeddings

-- Check functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name LIKE '%embedding%';

-- Expected: check_embedding_rate_limit, reset_embedding_rate_limit,
--           queue_embedding_request, get_pending_queue_stats
```

### Step 3: Configure Python Worker

Update environment variables in your deployment platform:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=https://your-app.com
```

### Step 4: Test Connection

```bash
# Test Python worker health
curl http://localhost:8000/health

# Expected response:
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

## Verification Queries

### Check All Tables

```sql
SELECT 
    table_name,
    (xpath('/row/cnt/text()', xml_count))[1]::text::int as row_count
FROM (
    SELECT 
        table_name,
        query_to_xml(format('SELECT count(*) as cnt FROM %I.%I', table_schema, table_name), false, true, '') as xml_count
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
) t
ORDER BY table_name;
```

### Check RLS Policies

```sql
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Check Indexes

```sql
SELECT 
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename LIKE '%embedding%'
ORDER BY tablename, indexname;
```

---

## Troubleshooting

### Issue: Table Already Exists

```sql
-- Drop and recreate (WARNING: deletes data)
DROP TABLE IF EXISTS embedding_dead_letter_queue CASCADE;
DROP TABLE IF EXISTS embedding_rate_limits CASCADE;
DROP TABLE IF EXISTS embedding_pending_queue CASCADE;

-- Then re-run migration
```

### Issue: Function Not Found

```sql
-- Recreate functions
\i supabase/setup/27-rate-limiting.sql
\i supabase/setup/28-pending-embeddings.sql
```

### Issue: RLS Policy Conflict

```sql
-- Drop existing policies
DROP POLICY IF EXISTS "service_role_manage_dlq" ON embedding_dead_letter_queue;
DROP POLICY IF EXISTS "users_view_own_dlq" ON embedding_dead_letter_queue;

-- Re-run migration
```

### Issue: pgvector Not Enabled

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Verify
SELECT * FROM pg_extension WHERE extname = 'vector';
```

---

## Post-Setup Tasks

### 1. Test Embedding Generation

```sql
-- Insert test data
INSERT INTO profiles (id, display_name, headline, bio)
VALUES ('00000000-0000-0000-0000-000000000001', 'Test User', 'Developer', 'Test bio');

-- Queue embedding request
SELECT queue_embedding_request(
    '00000000-0000-0000-0000-000000000001'::UUID,
    'manual'
);

-- Check queue status
SELECT * FROM embedding_pending_queue;
```

### 2. Monitor Queue

```sql
-- Get queue stats
SELECT * FROM get_pending_queue_stats();

-- Check DLQ status
SELECT 
    status,
    COUNT(*) as count,
    MAX(created_at) as last_created
FROM embedding_dead_letter_queue
GROUP BY status;
```

### 3. Test Rate Limiting

```sql
-- Check rate limit for user
SELECT * FROM check_embedding_rate_limit(
    '00000000-0000-0000-0000-000000000001'::UUID
);

-- Reset rate limit (if needed)
SELECT reset_embedding_rate_limit(
    '00000000-0000-0000-0000-000000000001'::UUID
);
```

---

## Security Notes

### RLS Policies

All embedding tables have Row Level Security enabled:

| Table | Policies |
|-------|----------|
| `embedding_dead_letter_queue` | Service role: ALL, Users: SELECT own |
| `embedding_rate_limits` | Service role: ALL, Users: SELECT own |
| `embedding_pending_queue` | Service role: ALL, Users: SELECT own |
| `profile_embeddings` | Service role: ALL, Users: SELECT own |

### Function Security

Rate limiting functions use `SECURITY DEFINER`:
- `check_embedding_rate_limit()` - Check if user can generate embedding
- `reset_embedding_rate_limit()` - Admin function to reset limits
- `queue_embedding_request()` - Queue embedding for processing
- `get_pending_queue_stats()` - Get queue statistics

---

## Resources

- [Supabase SQL Editor](https://supabase.com/dashboard/project/_/sql)
- [pgvector Documentation](https://github.com/pgvector/pgvector)
- [Python Worker Setup](../04-infrastructure/python-worker/overview.md)
- [Vector Embeddings Overview](../03-core-features/vector-embeddings/overview.md)

---

**Last Updated:** 2026-03-14  
**Version:** 2.0.0
