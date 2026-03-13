# Embedding Service SQL Migration Guide

**Date:** 2026-03-13  
**Purpose:** Complete guide for migrating profile_embeddings table to match Python worker implementation

---

## 📋 Overview

The Python embedding worker has been updated with production-grade features including:
- Error message tracking
- Retry count tracking  
- Dimension validation (384 dimensions)
- Circuit breaker protection
- Quality validation

This guide ensures your database schema matches the Python worker implementation.

---

## 🎯 Migration Options

### Option 1: Fresh Installation (Recommended for New Deployments)

Run the complete setup file that includes all features:

```sql
-- Execute in Supabase SQL Editor
-- File: supabase/setup/28-profile-embeddings-complete.sql
```

This creates the table with:
- ✅ All columns (including error_message, retry_count)
- ✅ All indexes (6 optimized indexes)
- ✅ Dimension constraint (384 dims)
- ✅ RLS policies
- ✅ Helper functions
- ✅ Triggers

---

### Option 2: Existing Installation (Incremental Migration)

If you already have the `profile_embeddings` table, run these migrations **in order**:

#### Step 1: Add Error Tracking Columns
```sql
-- File: supabase/setup/27-add-error-tracking.sql
-- Adds: error_message, retry_count columns
```

#### Step 2: Add Dimension Constraint
```sql
-- File: supabase/setup/26-add-dimension-constraint.sql
-- Adds: CHECK constraint for 384 dimensions
```

#### Step 3: Update Helper Functions
```sql
-- Run manually in SQL Editor:

-- Update get_embedding_status to include new columns
CREATE OR REPLACE FUNCTION public.get_embedding_status(user_id UUID)
RETURNS TABLE (
    user_id UUID,
    status TEXT,
    last_updated TIMESTAMPTZ,
    has_embedding BOOLEAN,
    error_message TEXT,
    retry_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.user_id,
        pe.status,
        pe.last_updated,
        (pe.status = 'completed') AS has_embedding,
        pe.error_message,
        pe.retry_count
    FROM public.profile_embeddings pe
    WHERE pe.user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update regenerate_embedding to reset error tracking
CREATE OR REPLACE FUNCTION public.regenerate_embedding(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profile_embeddings
    SET status = 'pending', 
        last_updated = NOW(),
        retry_count = 0,
        error_message = NULL
    WHERE user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 🔍 Verification

After running migrations, verify the setup:

```sql
-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
  AND table_name = 'profile_embeddings'
ORDER BY ordinal_position;

-- Expected columns:
-- id, user_id, embedding, last_updated, status, error_message, retry_count

-- Check constraints
SELECT conname, contype, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = 'public.profile_embeddings'::regclass;

-- Expected: check_embedding_dimensions CHECK constraint

-- Check indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' 
  AND tablename = 'profile_embeddings';

-- Expected: 6 indexes (embedding, user_id, status, dimensions, error_message, retry_count)

-- Test dimension constraint (should succeed)
INSERT INTO profile_embeddings (user_id, embedding, status)
SELECT 
    id,
    array_fill(0.1::real, ARRAY[384])::vector,
    'completed'
FROM profiles
LIMIT 1;

-- Test dimension constraint (should fail - wrong dimensions)
DO $$
DECLARE
    test_embedding vector(768);
BEGIN
    test_embedding := array_fill(0.1::real, ARRAY[768])::vector;
    
    INSERT INTO profile_embeddings (user_id, embedding, status)
    VALUES ('00000000-0000-0000-0000-000000000000', test_embedding, 'test');
EXCEPTION
    WHEN check_violation THEN
        RAISE NOTICE '✓ Dimension constraint working correctly';
    WHEN OTHERS THEN
        RAISE NOTICE '✗ Unexpected error: %', SQLERRM;
END $$;
```

---

## 📊 Schema Comparison

### Before Migration
```sql
CREATE TABLE profile_embeddings (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    embedding VECTOR(384),
    last_updated TIMESTAMPTZ,
    status TEXT,
    UNIQUE(user_id)
);
```

### After Migration ✅
```sql
CREATE TABLE profile_embeddings (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL,
    embedding VECTOR(384),
    last_updated TIMESTAMPTZ,
    status TEXT CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,              -- NEW
    retry_count INTEGER DEFAULT 0,   -- NEW
    UNIQUE(user_id),
    CONSTRAINT check_embedding_dimensions 
        CHECK (vector_dims(embedding) = 384 OR embedding IS NULL)  -- NEW
);
```

---

## 🔧 Python Worker Integration

The Python worker expects these columns to exist:

```python
# main.py:404-415
data = {
    "user_id": user_id,
    "status": status,
    "last_updated": datetime.utcnow().isoformat(),
    "error_message": error_message,    # Must exist
    "retry_count": retry_count         # Must exist
}

if embedding is not None:
    data["embedding"] = embedding

supabase.table("profile_embeddings").upsert(data).execute()
```

**Without these columns, the Python worker will fail with:**
```
Error: column "error_message" does not exist
```

---

## 🚨 Troubleshooting

### Issue: Migration fails with "column already exists"
**Solution:** The column was already added. Skip that migration and continue.

### Issue: Dimension constraint fails on existing data
**Solution:** Clear or update existing embeddings first:
```sql
-- Option 1: Clear all embeddings (will be regenerated)
UPDATE profile_embeddings 
SET embedding = NULL, status = 'pending';

-- Option 2: Drop constraint temporarily
ALTER TABLE profile_embeddings 
DROP CONSTRAINT IF EXISTS check_embedding_dimensions;

-- Fix bad data
UPDATE profile_embeddings 
SET embedding = NULL 
WHERE vector_dims(embedding) != 384;

-- Re-add constraint
ALTER TABLE profile_embeddings 
ADD CONSTRAINT check_embedding_dimensions 
CHECK (vector_dims(embedding) = 384 OR embedding IS NULL);
```

### Issue: Helper functions return wrong columns
**Solution:** Re-run the CREATE OR REPLACE FUNCTION statements from Step 3 above.

---

## 📝 Rollback Procedure

If you need to rollback:

```sql
-- Remove error tracking columns
ALTER TABLE profile_embeddings 
DROP COLUMN IF EXISTS error_message,
DROP COLUMN IF EXISTS retry_count;

-- Remove dimension constraint
ALTER TABLE profile_embeddings 
DROP CONSTRAINT IF EXISTS check_embedding_dimensions;

-- Remove additional indexes
DROP INDEX IF EXISTS idx_profile_embeddings_dimensions;
DROP INDEX IF EXISTS idx_profile_embeddings_error_message;
DROP INDEX IF EXISTS idx_profile_embeddings_retry_count;

-- Revert helper functions
CREATE OR REPLACE FUNCTION public.get_embedding_status(user_id UUID)
RETURNS TABLE (
    user_id UUID,
    status TEXT,
    last_updated TIMESTAMPTZ,
    has_embedding BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.user_id,
        pe.status,
        pe.last_updated,
        (pe.status = 'completed') AS has_embedding
    FROM public.profile_embeddings pe
    WHERE pe.user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## ✅ Post-Migration Checklist

After migration, verify:

- [ ] Table has 7 columns (id, user_id, embedding, last_updated, status, error_message, retry_count)
- [ ] Dimension constraint exists (check_embedding_dimensions)
- [ ] 6 indexes exist (embedding, user_id, status, dimensions, error_message, retry_count)
- [ ] Helper functions return all columns
- [ ] Python worker can store embeddings without errors
- [ ] Test embedding generation works end-to-end

---

## 📚 Related Files

- `supabase/setup/23-profile-embeddings.sql` - Base table definition
- `supabase/setup/26-add-dimension-constraint.sql` - Dimension constraint migration
- `supabase/setup/27-add-error-tracking.sql` - Error tracking migration
- `supabase/setup/28-profile-embeddings-complete.sql` - Complete fresh install
- `supabase/setup/99-master-all-tables.sql` - Master schema file (updated)
- `python-worker/main.py` - Python worker implementation

---

## 🆘 Need Help?

If you encounter issues:

1. Check Supabase logs for SQL errors
2. Verify Python worker logs for database errors
3. Run verification queries from above
4. Check that migrations ran in correct order

---

**Last Updated:** 2026-03-13  
**Compatible With:** Python Worker v1.1.0+
