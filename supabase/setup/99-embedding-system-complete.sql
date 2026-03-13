-- ============================================================================
-- COLLABRYX EMBEDDING SYSTEM - COMPLETE SETUP
-- ============================================================================
-- This script sets up the complete embedding system including:
-- 1. Dead Letter Queue for failed embedding retries
-- 2. Rate Limiting for embedding generation (3 requests/hour/user)
-- 3. Pending Queue for onboarding embedding requests
-- 
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ============================================================================

-- ============================================================================
-- PART 1: DEAD LETTER QUEUE
-- ============================================================================

CREATE TABLE IF NOT EXISTS embedding_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  semantic_text TEXT NOT NULL,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, exhausted
  last_attempt TIMESTAMPTZ,
  next_retry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_dlq_status_retry ON embedding_dead_letter_queue(status, next_retry);
CREATE INDEX IF NOT EXISTS idx_dlq_user_id ON embedding_dead_letter_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_dlq_created_at ON embedding_dead_letter_queue(created_at);

-- RLS Policies
ALTER TABLE embedding_dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage all
CREATE POLICY "service_role_manage_dlq" ON embedding_dead_letter_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own
CREATE POLICY "users_view_own_dlq" ON embedding_dead_letter_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Realtime enabled for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE embedding_dead_letter_queue;

COMMENT ON TABLE embedding_dead_letter_queue IS 'Dead letter queue for failed embedding generation requests with automatic retry capability';
COMMENT ON COLUMN embedding_dead_letter_queue.status IS 'pending: waiting for retry, processing: currently being retried, completed: successfully processed, exhausted: max retries reached';

-- ============================================================================
-- PART 2: RATE LIMITING
-- ============================================================================

-- Rate limiting tracking table
CREATE TABLE embedding_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX idx_rate_limit_user_window ON embedding_rate_limits(user_id, window_end);
CREATE INDEX idx_rate_limit_created_at ON embedding_rate_limits(created_at);

-- RLS Policies
ALTER TABLE embedding_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role can manage all
CREATE POLICY "service_role_manage_rate_limits" ON embedding_rate_limits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own
CREATE POLICY "users_view_own_rate_limits" ON embedding_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Realtime enabled for monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE embedding_rate_limits;

-- Function to check rate limit
-- Returns: allowed (boolean), remaining (integer), reset_at (timestamptz)
CREATE OR REPLACE FUNCTION check_embedding_rate_limit(p_user_id UUID)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_record RECORD;
  v_remaining INTEGER;
BEGIN
  -- Get or create rate limit record
  SELECT * INTO v_record
  FROM embedding_rate_limits
  WHERE user_id = p_user_id
    AND window_end > NOW()
  ORDER BY window_end DESC
  LIMIT 1;
  
  -- No record exists, create one
  IF v_record IS NULL THEN
    INSERT INTO embedding_rate_limits (user_id, request_count)
    VALUES (p_user_id, 1)
    RETURNING * INTO v_record;
    
    RETURN QUERY SELECT TRUE, 2, v_record.window_end;
  END IF;
  
  -- Check remaining requests (limit: 3 per hour)
  v_remaining := 3 - v_record.request_count;
  
  IF v_remaining > 0 THEN
    -- Update count
    UPDATE embedding_rate_limits
    SET request_count = request_count + 1,
        updated_at = NOW()
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT TRUE, v_remaining - 1, v_record.window_end;
  ELSE
    -- Rate limit exceeded
    RETURN QUERY SELECT FALSE, 0, v_record.window_end;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_embedding_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_embedding_rate_limit TO service_role;

-- Function to reset rate limit (for admin use)
CREATE OR REPLACE FUNCTION reset_embedding_rate_limit(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM embedding_rate_limits
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION reset_embedding_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION reset_embedding_rate_limit TO service_role;

COMMENT ON FUNCTION check_embedding_rate_limit IS 'Check if user can generate embedding (limit: 3 per hour). Returns allowed status, remaining requests, and reset time.';
COMMENT ON FUNCTION reset_embedding_rate_limit IS 'Reset rate limit for a user (admin function)';

-- ============================================================================
-- PART 3: PENDING EMBEDDING QUEUE
-- ============================================================================

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

COMMENT ON TABLE public.embedding_pending_queue IS 'Queue for pending embedding requests from onboarding and other sources';
COMMENT ON COLUMN public.embedding_pending_queue.status IS 'pending: waiting to be processed, processing: being generated, completed: done, failed: error occurred';
COMMENT ON COLUMN public.embedding_pending_queue.trigger_source IS 'Source of the request: onboarding, manual, admin, or api';

-- ============================================================================
-- SETUP COMPLETE - VERIFICATION QUERIES
-- ============================================================================

-- Verify tables created
SELECT 
    'embedding_dead_letter_queue' as table_name, 
    COUNT(*) as row_count 
FROM embedding_dead_letter_queue
UNION ALL
SELECT 
    'embedding_rate_limits' as table_name, 
    COUNT(*) as row_count 
FROM embedding_rate_limits
UNION ALL
SELECT 
    'embedding_pending_queue' as table_name, 
    COUNT(*) as row_count 
FROM embedding_pending_queue;

-- Verify functions created
SELECT 
    routine_name as function_name,
    routine_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name IN (
        'check_embedding_rate_limit',
        'reset_embedding_rate_limit',
        'queue_embedding_request',
        'get_pending_queue_stats'
    );

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
