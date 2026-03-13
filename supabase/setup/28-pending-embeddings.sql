-- Table: embedding_pending_queue
-- Queue for pending embedding requests from onboarding
-- Ensures reliable embedding generation even if API trigger fails

-- Create the embedding_pending_queue table
CREATE TABLE IF NOT EXISTS public.embedding_pending_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    trigger_source TEXT NOT NULL DEFAULT 'onboarding' CHECK (trigger_source IN ('onboarding', 'manual', 'admin', 'api')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    first_attempt TIMESTAMPTZ,
    last_attempt TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failure_reason TEXT
);

-- Index for efficient querying by status
CREATE INDEX IF NOT EXISTS idx_pending_queue_status 
    ON public.embedding_pending_queue (status);

-- Index for efficient querying by created_at (for processing order)
CREATE INDEX IF NOT EXISTS idx_pending_queue_created 
    ON public.embedding_pending_queue (created_at);

-- Index for efficient querying by user_id
CREATE INDEX IF NOT EXISTS idx_pending_queue_user_id 
    ON public.embedding_pending_queue (user_id);

-- Enable Row Level Security
ALTER TABLE public.embedding_pending_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role can manage all
CREATE POLICY "service_role_manage_pending_queue" ON public.embedding_pending_queue
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own pending queue status
CREATE POLICY "users_view_own_pending_queue" ON public.embedding_pending_queue
    FOR SELECT USING (auth.uid() = user_id);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.embedding_pending_queue;

-- Function to queue embedding request with duplicate prevention
CREATE OR REPLACE FUNCTION public.queue_embedding_request(
    p_user_id UUID,
    p_trigger_source TEXT DEFAULT 'onboarding'
)
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Check if already queued or processing
    IF EXISTS (
        SELECT 1 FROM public.embedding_pending_queue
        WHERE user_id = p_user_id AND status IN ('pending', 'processing')
    ) THEN
        RAISE EXCEPTION 'Embedding request already pending for user %', p_user_id USING ERRCODE = '23505';
    END IF;
    
    -- Check if user already has completed embedding
    IF EXISTS (
        SELECT 1 FROM public.profile_embeddings
        WHERE user_id = p_user_id AND status = 'completed'
    ) THEN
        RAISE EXCEPTION 'User already has completed embedding';
    END IF;
    
    -- Insert pending request
    INSERT INTO public.embedding_pending_queue (user_id, trigger_source, status)
    VALUES (p_user_id, p_trigger_source, 'pending')
    RETURNING id INTO v_id;
    
    -- Notify workers via NOTIFY (optional, for real-time triggering)
    NOTIFY embedding_queue_changed;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on queue function
GRANT EXECUTE ON FUNCTION public.queue_embedding_request TO authenticated;

-- Function to get pending queue count by status
CREATE OR REPLACE FUNCTION public.get_pending_queue_stats()
RETURNS TABLE (
    status TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        epq.status::TEXT,
        COUNT(*)::BIGINT
    FROM public.embedding_pending_queue epq
    GROUP BY epq.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on stats function
GRANT EXECUTE ON FUNCTION public.get_pending_queue_stats TO authenticated;

-- Comment describing the table
COMMENT ON TABLE public.embedding_pending_queue IS 'Queue for pending embedding requests from onboarding and other sources';
COMMENT ON COLUMN public.embedding_pending_queue.status IS 'pending: waiting to be processed, processing: being generated, completed: done, failed: error occurred';
COMMENT ON COLUMN public.embedding_pending_queue.trigger_source IS 'Source of the request: onboarding, manual, admin, or api';
