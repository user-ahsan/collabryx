-- =====================================================
-- User Analytics Table
-- =====================================================
-- Purpose: Per-user engagement metrics and activity tracking
-- Created: 2026-03-18
-- Task: 1.1.4 (TASKS.md)
-- =====================================================

-- Create user_analytics table
CREATE TABLE IF NOT EXISTS user_analytics (
  user_id uuid PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  
  -- Profile metrics
  profile_views_count integer DEFAULT 0,
  profile_views_last_7_days integer DEFAULT 0,
  profile_views_last_30_days integer DEFAULT 0,
  
  -- Content metrics
  post_impressions_count integer DEFAULT 0,
  post_reactions_received integer DEFAULT 0,
  post_comments_received integer DEFAULT 0,
  posts_created_count integer DEFAULT 0,
  
  -- Matching metrics
  match_suggestions_count integer DEFAULT 0,
  matches_accepted_count integer DEFAULT 0,
  match_acceptance_rate real DEFAULT 0,
  high_confidence_matches_count integer DEFAULT 0,
  
  -- Network metrics
  connections_count integer DEFAULT 0,
  connection_requests_sent integer DEFAULT 0,
  connection_requests_received integer DEFAULT 0,
  mutual_connections_avg integer DEFAULT 0,
  
  -- Engagement metrics
  messages_sent_count integer DEFAULT 0,
  messages_received_count integer DEFAULT 0,
  conversations_count integer DEFAULT 0,
  avg_response_time_minutes real DEFAULT 0,
  
  -- AI Mentor metrics
  ai_sessions_count integer DEFAULT 0,
  ai_messages_count integer DEFAULT 0,
  
  -- Activity tracking
  sessions_count integer DEFAULT 0,
  total_time_spent_minutes integer DEFAULT 0,
  last_active timestamptz,
  last_active_ip inet,
  
  -- Computed scores
  engagement_score real DEFAULT 0,
  influence_score real DEFAULT 0,
  activity_streak_days integer DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  last_calculated_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_analytics_last_active ON user_analytics(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_engagement_score ON user_analytics(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_influence_score ON user_analytics(influence_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_match_rate ON user_analytics(match_acceptance_rate DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE user_analytics;

-- RLS Policies
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own analytics
CREATE POLICY "Users can view own analytics"
  ON user_analytics
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Users can update their own analytics (for client-side tracking)
CREATE POLICY "Users can update own analytics"
  ON user_analytics
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policy: Service role can manage all analytics
CREATE POLICY "Service role can manage analytics"
  ON user_analytics
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_user_analytics_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_analytics_updated_at_trigger
  BEFORE UPDATE ON user_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_user_analytics_updated_at();

-- Function to calculate match acceptance rate
CREATE OR REPLACE FUNCTION calculate_match_acceptance_rate(p_user_id uuid)
RETURNS real AS $$
DECLARE
  accepted_count integer;
  total_count integer;
BEGIN
  SELECT COUNT(*) INTO accepted_count
  FROM connections
  WHERE (requester_id = p_user_id OR receiver_id = p_user_id)
  AND status = 'accepted';
  
  SELECT COUNT(*) INTO total_count
  FROM match_suggestions
  WHERE user_id = p_user_id OR matched_user_id = p_user_id;
  
  IF total_count = 0 THEN
    RETURN 0;
  END IF;
  
  RETURN (accepted_count::real / total_count::real) * 100;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON user_analytics TO authenticated;
GRANT ALL ON user_analytics TO service_role;

-- Comments
COMMENT ON TABLE user_analytics IS 'Per-user engagement metrics and activity tracking';
COMMENT ON COLUMN user_analytics.profile_views_count IS 'Total profile views lifetime';
COMMENT ON COLUMN user_analytics.post_impressions_count IS 'Total post impressions';
COMMENT ON COLUMN user_analytics.match_acceptance_rate IS 'Percentage of matches that became connections';
COMMENT ON COLUMN user_analytics.engagement_score IS 'Computed user engagement score (0-100)';
COMMENT ON COLUMN user_analytics.influence_score IS 'Computed user influence score (0-100)';
COMMENT ON COLUMN user_analytics.activity_streak_days IS 'Consecutive days of activity';
