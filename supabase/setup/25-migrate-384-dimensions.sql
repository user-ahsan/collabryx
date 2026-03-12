-- Migration: Update profile_embeddings from 768d to 384d
-- Run this in Supabase SQL Editor

-- Step 1: Drop the existing index (will recreate with new dimensions)
DROP INDEX IF EXISTS idx_profile_embeddings_embedding;

-- Step 2: Alter the column to 384 dimensions
-- This will fail if there are existing embeddings with 768d
-- So we first clear them
UPDATE profile_embeddings 
SET embedding = NULL, 
    status = 'pending',
    last_updated = NOW();

-- Step 3: Now alter the column type
ALTER TABLE profile_embeddings 
ALTER COLUMN embedding TYPE vector(384);

-- Step 4: Recreate the HNSW index for 384 dimensions
CREATE INDEX idx_profile_embeddings_embedding 
    ON profile_embeddings 
    USING hnsw (embedding vector_cosine_ops);

-- Step 5: Verify the change
SELECT 
    column_name, 
    data_type, 
    udt_name
FROM information_schema.columns 
WHERE table_name = 'profile_embeddings' 
  AND column_name = 'embedding';

-- Step 6: Count pending embeddings (should be all of them)
SELECT status, COUNT(*) 
FROM profile_embeddings 
GROUP BY status;
