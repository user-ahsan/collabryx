-- Rate limiting for embedding generation
-- Prevents DoS attacks and resource exhaustion (3 requests per hour per user)

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
