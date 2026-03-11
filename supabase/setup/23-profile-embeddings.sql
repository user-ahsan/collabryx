-- Table: profile_embeddings
-- Stores vector embeddings for user profiles for semantic matching
-- Uses pgvector extension for vector similarity search

-- Enable pgvector extension (must be enabled at database level)
-- Run this first in Supabase SQL Editor:
CREATE EXTENSION IF NOT EXISTS vector;

-- Create the profile_embeddings table
CREATE TABLE IF NOT EXISTS public.profile_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    embedding VECTOR(768),  -- Nullable initially, filled when embedding is generated
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    UNIQUE(user_id)
);

-- Create index for efficient cosine similarity search
-- Using HNSW index for better performance with large datasets
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_embedding 
    ON public.profile_embeddings 
    USING hnsw (embedding vector_cosine_ops);

-- Create index on user_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_user_id 
    ON public.profile_embeddings (user_id);

-- Create index on status for filtering
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_status 
    ON public.profile_embeddings (status);

-- Enable Row Level Security
ALTER TABLE public.profile_embeddings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own embedding status
CREATE POLICY "Users can view own embedding status" ON public.profile_embeddings
    FOR SELECT USING (auth.uid() = user_id);

-- Service role can manage embeddings (insert, update, delete)
CREATE POLICY "Service role can manage embeddings" ON public.profile_embeddings
    FOR ALL USING (auth.role() = 'service_role');

-- Enable realtime (optional, for progress updates)
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_embeddings;

-- Create trigger function to update timestamp on embedding changes
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

-- Create function to check if user has completed embedding generation
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

-- Create function to get embedding status for a user
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

-- Grant execute permission on helper functions
GRANT EXECUTE ON FUNCTION public.has_embedding TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_embedding_status TO authenticated;

-- Function to manually trigger embedding regeneration (for retries)
CREATE OR REPLACE FUNCTION public.regenerate_embedding(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profile_embeddings
    SET status = 'pending', last_updated = NOW()
    WHERE user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on regeneration function
GRANT EXECUTE ON FUNCTION public.regenerate_embedding TO authenticated;
