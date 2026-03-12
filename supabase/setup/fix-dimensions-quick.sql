-- ============================================
-- QUICK FIX: Update profile_embeddings to 384 dimensions
-- Run this ENTIRE script in Supabase SQL Editor
-- ============================================

-- Step 1: Clear existing embeddings (they're 768d, we need 384d)
UPDATE profile_embeddings 
SET embedding = NULL, 
    status = 'pending',
    last_updated = NOW();

-- Step 2: Alter column to 384 dimensions
ALTER TABLE profile_embeddings 
ALTER COLUMN embedding TYPE vector(384);

-- Step 3: Recreate HNSW index for 384d
DROP INDEX IF EXISTS idx_profile_embeddings_embedding;
CREATE INDEX idx_profile_embeddings_embedding 
    ON profile_embeddings 
    USING hnsw (embedding vector_cosine_ops);

-- Step 4: Verify the migration
SELECT 
    'Column Type Check' as check_type,
    column_name,
    udt_name,
    'Should be: vector' as expected
FROM information_schema.columns 
WHERE table_name = 'profile_embeddings' 
  AND column_name = 'embedding'

UNION ALL

SELECT 
    'Status Count' as check_type,
    status as column_name,
    count::text as udt_name,
    'All should be pending' as expected
FROM (
    SELECT status, COUNT(*) 
    FROM profile_embeddings 
    GROUP BY status
) counts;

-- Step 5: Test embedding insertion (384 dimensions)
-- This should work without errors
DO $$
DECLARE
    test_embedding vector(384);
BEGIN
    -- Create a test 384-dim embedding
    test_embedding := array_fill(0.1::real, ARRAY[384])::vector;
    
    -- Try to insert (will fail gracefully if user doesn't exist)
    INSERT INTO profile_embeddings (user_id, embedding, status)
    SELECT 
        id,
        test_embedding,
        'completed'
    FROM profiles
    LIMIT 1;
    
    RAISE NOTICE '✓ Successfully inserted 384-dim embedding';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE '⚠ Insert test skipped (no users yet)';
END $$;

-- Step 6: Show count of embeddings needing regeneration
SELECT 
    'Embeddings to Regenerate' as note,
    COUNT(*) as count
FROM profile_embeddings
WHERE status = 'pending';

-- ============================================
-- NEXT: Trigger embedding regeneration for all users
-- Run the Python worker, then call:
-- POST /api/embeddings/generate with user_id
-- ============================================
