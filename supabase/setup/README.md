# Collabryx Database Setup

**Last Updated:** 2026-03-14  
**Version:** 2.1.0 (Bulletproof)

---

## ⚠️ IMPORTANT: RUN MASTER FILE ONLY

**DO NOT run individual SQL files (01-23).** They are reference-only.

```sql
-- ✅ RUN THIS FILE ONLY in Supabase SQL Editor:
-- File: 99-master-all-tables.sql
```

---

## 🚀 Quick Start

### Fresh Installation
```sql
-- Run ONCE in Supabase SQL Editor
-- File: 99-master-all-tables.sql
```

### Complete Reset
```sql
-- Step 1: Wipe everything
-- File: 00-complete-database-wipe.sql

-- Step 2: Recreate from scratch  
-- File: 99-master-all-tables.sql
```

### Upgrade from Previous Version
```sql
-- Just run the master file - it handles migrations automatically
-- File: 99-master-all-tables.sql
```

---

## 📁 Files

| File | Purpose | Use Case |
|------|---------|----------|
| `00-complete-database-wipe.sql` | ⚠️ Deletes ALL data - use for resets | Production resets |
| `01-profiles.sql` through `23-profile-embeddings.sql` | ❌ Reference only - DO NOT RUN | Documentation |
| `99-master-all-tables.sql` | ✅ Complete schema (26 tables) | **RUN THIS FILE ONLY** |

---

## 🛡️ Bulletproof Features

The master file (`99-master-all-tables.sql`) is now **bulletproof**:

### ✅ Performance Optimized (Supabase Linter Clean)
- **Auth RLS Optimization:** All `auth.uid()`, `auth.jwt()`, and `auth.role()` calls wrapped in `(select ...)` to prevent per-row re-evaluation
- **No Duplicate Indexes:** All indexes are unique and necessary
- **Efficient RLS Policies:** Optimized policy structure

### ✅ Expected Linter Notes (Intentional)
Some Supabase linter warnings are **correct design decisions**:

**multiple_permissive_policies** - Tables like `user_skills`, `embedding_dead_letter_queue`, etc. have separate policies for:
- Public read access (`SELECT USING (true)`)
- Owner write access (`ALL USING (SELECT auth.uid()) = user_id`)

This is the **correct RLS pattern** for public-read, owner-write tables. Combining them would be less secure.

**unindexed_foreign_keys** (INFO) - Foreign keys on `user_id` columns don't need separate indexes because:
- They're already covered by composite indexes
- Or the columns have low cardinality (few distinct values)

**unused_index** (INFO) - Indexes show as unused on fresh databases. They're used in production for:
- Query optimization on specific query patterns
- Covering indexes for common operations
- Future-proofing as data grows

### ✅ Idempotent Operations
- All table creations use `CREATE TABLE IF NOT EXISTS`
- All index creations use `CREATE INDEX IF NOT EXISTS`
- All trigger drops use `DROP TRIGGER IF EXISTS`

### ✅ Migration Support
- Functions are dropped before recreation (prevents signature conflicts)
- Missing columns are added automatically (e.g., `metadata` column)
- Safe to run multiple times on same database

### ✅ Upgrade Path
- Works on fresh databases (no existing schema)
- Works on existing databases (adds missing tables/columns)
- Works on old versions (migrates schema automatically)

### ✅ Error Handling
- Storage bucket deletion handles foreign key violations
- Realtime publication handles duplicate objects
- All operations wrapped in exception blocks where needed

---

## 📊 Schema (26 Tables)

**User Management (5):** profiles, user_skills, user_interests, user_experiences, user_projects

**Social (6):** posts, post_attachments, post_reactions, comments, comment_likes, connections

**Matching (4):** match_suggestions, match_scores, match_activity, match_preferences

**Messaging (2):** conversations, messages

**Notifications (2):** notifications, notification_preferences

**AI (2):** ai_mentor_sessions, ai_mentor_messages

**Preferences (2):** notification_preferences, theme_preferences

**Embeddings (4):** profile_embeddings, embedding_dead_letter_queue, embedding_rate_limits, embedding_pending_queue

---

## ✅ Verification

```sql
-- Check table count (should be 27: 26 + storage.objects)
SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';

-- Test helper functions
SELECT public.are_connected('user1-uuid', 'user2-uuid');
SELECT * FROM public.get_pending_queue_stats();

-- Check all functions exist
SELECT proname FROM pg_proc WHERE pronamespace = 'public'::regnamespace ORDER BY proname;
```

---

## 🔧 Usage Patterns

### Pattern 1: Fresh Development Setup
```sql
-- Run master file once
99-master-all-tables.sql
```

### Pattern 2: Production Deployment
```sql
-- 1. Backup database first
-- 2. Run master file (safe - won't break existing data)
99-master-all-tables.sql
-- 3. Verify with test queries
```

### Pattern 3: Complete Reset (Nuke & Pave)
```sql
-- 1. Wipe everything
00-complete-database-wipe.sql
-- 2. Recreate fresh
99-master-all-tables.sql
```

### Pattern 4: Reference Only
Individual files (01-23) are for **reference only**. Do not run them directly.

---

## 🐛 Troubleshooting

### Error: "function signature mismatch"
**Solution:** Master file now drops all functions first. Re-run `99-master-all-tables.sql`.

### Error: "column does not exist"
**Solution:** Master file auto-adds missing columns. Re-run `99-master-all-tables.sql`.

### Error: "storage bucket deletion failed"
**Solution:** This is expected - Supabase handles storage cleanup asynchronously. Continue with master file.

---

## 📝 Notes

- **Master file is recommended** for all production use
- **Stepwise files (01-23)** are kept for learning/debugging
- **Safe to run master file multiple times** - all operations are idempotent
- **Automatic migrations** - old schemas are upgraded automatically

---

**Setup Complete!** 🎉
