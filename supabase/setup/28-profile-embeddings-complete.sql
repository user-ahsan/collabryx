-- ============================================
-- COMPLETE EMBEDDING TABLE SETUP
-- Run this ONCE to set up profile_embeddings with all features
-- Includes: error tracking, dimension constraints, all indexes
-- ============================================

-- Enable pgvector extension (must be enabled at database level)
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the profile_embeddings table with ALL columns
CREATE TABLE IF NOT EXISTS public.profile_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    embedding VECTOR(384),  -- 384 dimensions for all-MiniLM-L6-v2 model
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,  -- Detailed error message when embedding generation or storage fails
    retry_count INTEGER DEFAULT 0,  -- Number of retry attempts made for this embedding
    UNIQUE(user_id)
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_embedding 
    ON public.profile_embeddings 
    USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_profile_embeddings_user_id 
    ON public.profile_embeddings (user_id);

CREATE INDEX IF NOT EXISTS idx_profile_embeddings_status 
    ON public.profile_embeddings (status);

CREATE INDEX IF NOT EXISTS idx_profile_embeddings_dimensions 
    ON public.profile_embeddings (vector_dims(embedding));

CREATE INDEX IF NOT EXISTS idx_profile_embeddings_error_message 
    ON public.profile_embeddings (error_message) 
    WHERE error_message IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_profile_embeddings_retry_count 
    ON public.profile_embeddings (retry_count) 
    WHERE retry_count > 0;

-- Add dimension constraint
ALTER TABLE public.profile_embeddings 
DROP CONSTRAINT IF EXISTS check_embedding_dimensions;

ALTER TABLE public.profile_embeddings 
ADD CONSTRAINT check_embedding_dimensions 
CHECK (vector_dims(embedding) = 384 OR embedding IS NULL);

-- Enable Row Level Security
ALTER TABLE public.profile_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view own embedding status" ON public.profile_embeddings;
CREATE POLICY "Users can view own embedding status" ON public.profile_embeddings
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage embeddings" ON public.profile_embeddings;
CREATE POLICY "Service role can manage embeddings" ON public.profile_embeddings
    FOR ALL USING (auth.role() = 'service_role');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_embeddings;

-- Create trigger function to update timestamp
CREATE OR REPLACE FUNCTION public.update_embedding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp update
DROP TRIGGER IF EXISTS update_embedding_timestamp ON public.profile_embeddings;
CREATE TRIGGER update_embedding_timestamp
    BEFORE UPDATE ON public.profile_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_embedding_timestamp();

-- Helper function: Check if user has completed embedding
CREATE OR REPLACE FUNCTION public.has_embedding(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    embedding_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO embedding_count
    FROM public.profile_embeddings
    WHERE public.profile_embeddings.user_id = $1
      AND status = 'completed';
    
    RETURN embedding_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper function: Get embedding status for a user
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

-- Helper function: Manually trigger embedding regeneration
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

-- Grant execute permission on helper functions
GRANT EXECUTE ON FUNCTION public.has_embedding TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_embedding_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_embedding TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE public.profile_embeddings IS 'Stores vector embeddings for user profiles (384 dimensions from all-MiniLM-L6-v2)';
COMMENT ON COLUMN public.profile_embeddings.embedding IS '384-dimensional vector embedding for semantic matching';
COMMENT ON COLUMN public.profile_embeddings.status IS 'Status: pending, processing, completed, or failed';
COMMENT ON COLUMN public.profile_embeddings.error_message IS 'Detailed error message when embedding generation or storage fails';
COMMENT ON COLUMN public.profile_embeddings.retry_count IS 'Number of retry attempts made for this embedding';
COMMENT ON CONSTRAINT check_embedding_dimensions ON public.profile_embeddings IS 
'Ensures embedding vectors are exactly 384 dimensions (all-MiniLM-L6-v2 model output)';

-- Verification
DO $$
DECLARE
    col_count INTEGER;
    idx_count INTEGER;
BEGIN
    -- Verify columns
    SELECT COUNT(*) INTO col_count
    FROM information_schema.columns
    WHERE table_schema = 'public' 
      AND table_name = 'profile_embeddings'
      AND column_name IN ('id', 'user_id', 'embedding', 'last_updated', 'status', 'error_message', 'retry_count');
    
    -- Verify indexes
    SELECT COUNT(*) INTO idx_count
    FROM pg_indexes
    WHERE schemaname = 'public' 
      AND tablename = 'profile_embeddings';
    
    IF col_count = 7 AND idx_count >= 6 THEN
        RAISE NOTICE '✓ profile_embeddings table successfully created with all columns and indexes';
    ELSE
        RAISE WARNING '✗ Table setup incomplete: % columns (expected 7), % indexes (expected 6+)', col_count, idx_count;
    END IF;
END $$;
