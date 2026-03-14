# Database Setup Guide

Complete guide to setting up the Collabryx database schema in Supabase.

---

## Quick Start

### ⚠️ IMPORTANT: Run Master File Only

**DO NOT run individual SQL files (01-23).** They are reference-only.

Run the master migration file that includes all 26 tables:

```sql
-- In Supabase SQL Editor:
-- https://supabase.com/dashboard/project/YOUR_PROJECT_ID/sql

-- ✅ RUN THIS FILE ONLY:
supabase/setup/99-master-all-tables.sql
```

This creates all 26 tables including:
- User management (profiles, user_skills, user_interests, user_experiences, user_projects)
- Social features (posts, post_attachments, post_reactions, comments, comment_likes, connections)
- Matching system (match_suggestions, match_scores, match_activity, match_preferences)
- Messaging (conversations, messages)
- Notifications (notifications, notification_preferences)
- AI features (ai_mentor_sessions, ai_mentor_messages)
- Preferences (theme_preferences)
- **Vector embeddings** (profile_embeddings, embedding_dead_letter_queue, embedding_rate_limits, embedding_pending_queue)

---

## Embedding System Setup

The embedding system requires additional setup for the Python worker.

### Step 1: Embedding Tables Included

The embedding tables are **already included** in the master file (`99-master-all-tables.sql`):

| Table | Purpose |
|-------|---------|
| `profile_embeddings` | Vector embeddings for semantic matching |
| `embedding_dead_letter_queue` | Failed embedding retry system |
| `embedding_rate_limits` | Rate limiting (3 requests/hour/user) |
| `embedding_pending_queue` | Onboarding embedding queue |

**No separate SQL files needed.**

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
-- Re-run the master file (functions are dropped and recreated)
-- File: supabase/setup/99-master-all-tables.sql
```

### Issue: RLS Policy Conflict

```sql
-- Re-run the master file (all policies are dropped first)
-- File: supabase/setup/99-master-all-tables.sql
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
