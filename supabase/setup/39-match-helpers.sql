-- =====================================================
-- Match Helper Functions
-- =====================================================
-- Purpose: Helper functions for match generation
-- Created: 2026-03-18
-- Task: 1.2.7 (TASKS.md)
-- =====================================================

-- =====================================================
-- Get Users Needing Matches
-- =====================================================
CREATE OR REPLACE FUNCTION get_users_needing_matches()
RETURNS TABLE (id uuid) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT p.id
  FROM profiles p
  WHERE p.onboarding_completed = true
    AND p.id IN (SELECT user_id FROM profile_embeddings WHERE status = 'completed')
    AND NOT EXISTS (
      SELECT 1 FROM match_suggestions ms
      WHERE ms.user_id = p.id
        AND ms.created_at > now() - interval '7 days'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Cleanup Old Match Suggestions
-- =====================================================
CREATE OR REPLACE FUNCTION cleanup_old_match_suggestions(retention_days integer DEFAULT 30)
RETURNS void AS $$
BEGIN
  DELETE FROM match_scores
  WHERE suggestion_id IN (
    SELECT id FROM match_suggestions
    WHERE created_at < now() - (retention_days || ' days')::interval
  );
  
  DELETE FROM match_suggestions
  WHERE created_at < now() - (retention_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Get Match Statistics for User
-- =====================================================
CREATE OR REPLACE FUNCTION get_user_match_stats(p_user_id uuid)
RETURNS TABLE (
  total_suggestions integer,
  accepted_count integer,
  pending_count integer,
  avg_match_score real,
  high_confidence_count integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::integer as total_suggestions,
    COUNT(CASE WHEN c.status = 'accepted' THEN 1 END)::integer as accepted_count,
    COUNT(CASE WHEN c.status = 'pending' THEN 1 END)::integer as pending_count,
    AVG(ms.match_percentage)::real as avg_match_score,
    COUNT(CASE WHEN ms.match_percentage >= 80 THEN 1 END)::integer as high_confidence_count
  FROM match_suggestions ms
  LEFT JOIN connections c ON (
    (c.requester_id = ms.user_id AND c.receiver_id = ms.matched_user_id) OR
    (c.receiver_id = ms.user_id AND c.requester_id = ms.matched_user_id)
  )
  WHERE ms.user_id = p_user_id
    AND ms.created_at > now() - interval '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_users_needing_matches TO service_role;
GRANT EXECUTE ON FUNCTION cleanup_old_match_suggestions TO service_role;
GRANT EXECUTE ON FUNCTION get_user_match_stats TO authenticated;

-- Comments
COMMENT ON FUNCTION get_users_needing_matches IS 'Get users who need match suggestions generated';
COMMENT ON FUNCTION cleanup_old_match_suggestions IS 'Remove match suggestions older than retention period';
COMMENT ON FUNCTION get_user_match_stats IS 'Get match statistics for a user';
