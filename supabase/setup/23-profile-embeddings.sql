-- ============================================================================
-- TABLE 23: profile_embeddings
-- ============================================================================
-- Vector embeddings for semantic profile matching (384 dimensions)
-- Uses pgvector extension with HNSW index for fast similarity search
-- Created: 2026-03-14

CREATE TABLE IF NOT EXISTS public.profile_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    embedding VECTOR(384),  -- 384 dimensions for all-MiniLM-L6-v2 model
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_user_id ON public.profile_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_status ON public.profile_embeddings(status);
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_updated ON public.profile_embeddings(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_retry ON public.profile_embeddings(retry_count);
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_metadata ON public.profile_embeddings USING GIN (metadata);
-- HNSW index for vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_embedding 
    ON public.profile_embeddings USING hnsw (embedding vector_cosine_ops);

-- RLS
ALTER TABLE public.profile_embeddings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own embedding status" ON public.profile_embeddings;
CREATE POLICY "Users can view own embedding status" ON public.profile_embeddings FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can manage embeddings" ON public.profile_embeddings;
CREATE POLICY "Service role can manage embeddings" ON public.profile_embeddings FOR ALL USING (auth.role() = 'service_role');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_embeddings;

-- Comments
COMMENT ON TABLE public.profile_embeddings IS 'Vector embeddings for semantic profile matching (384 dimensions, all-MiniLM-L6-v2)';
