-- ============================================================================
-- RATE LIMIT FUNCTION FOR EMBEDDING SERVICE
-- ============================================================================
-- Called by Python worker via Supabase RPC
-- Implements sliding window rate limiting (100 requests per hour)
-- Created: 2026-03-14

CREATE OR REPLACE FUNCTION public.check_embedding_rate_limit(p_user_id uuid)
RETURNS TABLE (
    allowed boolean,
    remaining_requests integer,
    reset_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER -- Allow function to modify rate_limits table
AS $$
DECLARE
    v_record embedding_rate_limits%ROWTYPE;
    v_now timestamptz := now();
    v_window_end timestamptz;
BEGIN
    -- Find active rate limit record for this user
    SELECT * INTO v_record
    FROM embedding_rate_limits
    WHERE user_id = p_user_id
      AND window_end > v_now
    ORDER BY window_end DESC
    LIMIT 1;
    
    -- No active record: create new window
    IF v_record.id IS NULL THEN
        v_window_end := v_now + interval '1 hour';
        
        INSERT INTO embedding_rate_limits (
            user_id, 
            request_count, 
            window_start, 
            window_end
        ) VALUES (
            p_user_id, 
            1, 
            v_now, 
            v_window_end
        );
        
        RETURN QUERY SELECT 
            true AS allowed,
            99 AS remaining_requests,  -- 100 - 1 used
            v_window_end AS reset_at;
        
    -- Under limit: increment counter
    ELSIF v_record.request_count < 100 THEN
        v_window_end := v_record.window_end;
        
        UPDATE embedding_rate_limits
        SET 
            request_count = request_count + 1,
            updated_at = now()
        WHERE id = v_record.id;
        
        RETURN QUERY SELECT 
            true AS allowed,
            (100 - v_record.request_count) AS remaining_requests,
            v_window_end AS reset_at;
        
    -- Over limit: reject
    ELSE
        RETURN QUERY SELECT 
            false AS allowed,
            0 AS remaining_requests,
            v_record.window_end AS reset_at;
    END IF;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.check_embedding_rate_limit(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_embedding_rate_limit(uuid) TO service_role;

-- Comment
COMMENT ON FUNCTION public.check_embedding_rate_limit IS 'Check embedding rate limit for user (100 requests/hour). Returns allowed status, remaining requests, and reset time.';

-- ============================================================================
-- VERIFICATION QUERY (run after creating function)
-- ============================================================================
-- SELECT 
--     routine_name,
--     routine_schema,
--     data_type
-- FROM information_schema.routines
-- WHERE routine_name = 'check_embedding_rate_limit';

-- -- Test with a sample user ID
-- SELECT * FROM public.check_embedding_rate_limit(
--     '00000000-0000-0000-0000-000000000000'::uuid
-- );
