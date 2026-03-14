-- ============================================================================
-- Collabryx Embedding Infrastructure Migration
-- Creates missing tables for embedding reliability system
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. DEAD LETTER QUEUE - Failed embedding retry system
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.embedding_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  semantic_text TEXT NOT NULL,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'exhausted')),
  last_attempt TIMESTAMPTZ,
  next_retry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_dlq_status_retry ON public.embedding_dead_letter_queue(status, next_retry);
CREATE INDEX IF NOT EXISTS idx_dlq_user_id ON public.embedding_dead_letter_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_dlq_created_at ON public.embedding_dead_letter_queue(created_at);

-- RLS Policies (only create if they don't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'embedding_dead_letter_queue' AND policyname = 'service_role_manage_dlq'
  ) THEN
    ALTER TABLE public.embedding_dead_letter_queue ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "service_role_manage_dlq" ON public.embedding_dead_letter_queue
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    CREATE POLICY "users_view_own_dlq" ON public.embedding_dead_letter_queue
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add to realtime (ignore if already exists)
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.embedding_dead_letter_queue;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

COMMENT ON TABLE public.embedding_dead_letter_queue IS 'Dead letter queue for failed embedding generation requests with automatic retry capability';
COMMENT ON COLUMN public.embedding_dead_letter_queue.status IS 'pending: waiting for retry, processing: currently being retried, completed: successfully processed, exhausted: max retries reached';

-- ============================================================================
-- 2. RATE LIMITING - Prevent DoS attacks (3 requests/hour/user)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.embedding_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_window ON public.embedding_rate_limits(user_id, window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created_at ON public.embedding_rate_limits(created_at);

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'embedding_rate_limits' AND policyname = 'service_role_manage_rate_limits'
  ) THEN
    ALTER TABLE public.embedding_rate_limits ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "service_role_manage_rate_limits" ON public.embedding_rate_limits
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    CREATE POLICY "users_view_own_rate_limits" ON public.embedding_rate_limits
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add to realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.embedding_rate_limits;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Rate limit check function
CREATE OR REPLACE FUNCTION public.check_embedding_rate_limit(p_user_id UUID)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_record RECORD;
  v_remaining INTEGER;
BEGIN
  SELECT * INTO v_record
  FROM public.embedding_rate_limits
  WHERE user_id = p_user_id
    AND window_end > NOW()
  ORDER BY window_end DESC
  LIMIT 1;
  
  IF v_record IS NULL THEN
    INSERT INTO public.embedding_rate_limits (user_id, request_count)
    VALUES (p_user_id, 1)
    RETURNING * INTO v_record;
    
    RETURN QUERY SELECT TRUE, 2, v_record.window_end;
  END IF;
  
  v_remaining := 3 - v_record.request_count;
  
  IF v_remaining > 0 THEN
    UPDATE public.embedding_rate_limits
    SET request_count = request_count + 1,
        updated_at = NOW()
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT TRUE, v_remaining - 1, v_record.window_end;
  ELSE
    RETURN QUERY SELECT FALSE, 0, v_record.window_end;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.check_embedding_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_embedding_rate_limit TO service_role;

-- Rate limit reset function
CREATE OR REPLACE FUNCTION public.reset_embedding_rate_limit(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM public.embedding_rate_limits
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.reset_embedding_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_embedding_rate_limit TO service_role;

-- ============================================================================
-- 3. PENDING QUEUE - Onboarding embedding requests
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_pending_queue_status ON public.embedding_pending_queue(status);
CREATE INDEX IF NOT EXISTS idx_pending_queue_created ON public.embedding_pending_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_pending_queue_user_id ON public.embedding_pending_queue(user_id);

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'embedding_pending_queue' AND policyname = 'service_role_manage_pending_queue'
  ) THEN
    ALTER TABLE public.embedding_pending_queue ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "service_role_manage_pending_queue" ON public.embedding_pending_queue
      FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
    CREATE POLICY "users_view_own_pending_queue" ON public.embedding_pending_queue
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add to realtime
DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.embedding_pending_queue;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
  END;
END $$;

-- Queue embedding request function
CREATE OR REPLACE FUNCTION public.queue_embedding_request(
  p_user_id UUID,
  p_trigger_source TEXT DEFAULT 'onboarding'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.embedding_pending_queue
    WHERE user_id = p_user_id AND status IN ('pending', 'processing')
  ) THEN
    RAISE EXCEPTION 'Embedding request already pending for user %', p_user_id USING ERRCODE = '23505';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM public.profile_embeddings
    WHERE user_id = p_user_id AND status = 'completed'
  ) THEN
    RAISE EXCEPTION 'User already has completed embedding';
  END IF;
  
  INSERT INTO public.embedding_pending_queue (user_id, trigger_source, status)
  VALUES (p_user_id, p_trigger_source, 'pending')
  RETURNING id INTO v_id;
  
  NOTIFY embedding_queue_changed;
  
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.queue_embedding_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_embedding_request TO service_role;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check tables exist
SELECT 
  'Migration Status' as check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'embedding_dead_letter_queue')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'embedding_rate_limits')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'embedding_pending_queue')
    THEN '✅ SUCCESS - All tables created'
    ELSE '❌ FAILED - Some tables missing'
  END as result;

-- Check functions exist
SELECT 
  'Function Check' as check,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'check_embedding_rate_limit')
     AND EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'queue_embedding_request')
    THEN '✅ Functions created'
    ELSE '❌ Functions missing'
  END as result;

-- Show table counts
SELECT 'embedding_dead_letter_queue' as table_name, COUNT(*) as row_count FROM public.embedding_dead_letter_queue
UNION ALL
SELECT 'embedding_rate_limits', COUNT(*) FROM public.embedding_rate_limits
UNION ALL
SELECT 'embedding_pending_queue', COUNT(*) FROM public.embedding_pending_queue;
