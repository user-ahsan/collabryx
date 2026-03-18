-- =====================================================
-- Platform Analytics Table
-- =====================================================
-- Purpose: Daily aggregated platform-wide metrics
-- Created: 2026-03-18
-- Task: 1.1.5 (TASKS.md)
-- =====================================================

-- Create platform_analytics table
CREATE TABLE IF NOT EXISTS platform_analytics (
  date date PRIMARY KEY,
  
  -- User metrics
  dau integer DEFAULT 0,
  mau integer DEFAULT 0,
  wau integer DEFAULT 0,
  new_users integer DEFAULT 0,
  deleted_users integer DEFAULT 0,
  active_users_change real DEFAULT 0,
  
  -- Content metrics
  new_posts integer DEFAULT 0,
  total_posts integer DEFAULT 0,
  posts_with_media integer DEFAULT 0,
  avg_post_length integer DEFAULT 0,
  
  -- Matching metrics
  new_matches integer DEFAULT 0,
  total_matches integer DEFAULT 0,
  avg_match_score real DEFAULT 0,
  high_confidence_matches integer DEFAULT 0,
  
  -- Network metrics
  new_connections integer DEFAULT 0,
  total_connections integer DEFAULT 0,
  connection_acceptance_rate real DEFAULT 0,
  pending_requests integer DEFAULT 0,
  
  -- Communication metrics
  new_messages integer DEFAULT 0,
  total_messages integer DEFAULT 0,
  new_conversations integer DEFAULT 0,
  avg_messages_per_conversation real DEFAULT 0,
  
  -- Engagement metrics
  total_profile_views integer DEFAULT 0,
  total_post_reactions integer DEFAULT 0,
  total_comments integer DEFAULT 0,
  avg_session_duration_minutes real DEFAULT 0,
  
  -- AI Mentor metrics
  ai_sessions_count integer DEFAULT 0,
  ai_messages_count integer DEFAULT 0,
  avg_session_length real DEFAULT 0,
  
  -- Content moderation
  content_flagged integer DEFAULT 0,
  content_approved integer DEFAULT 0,
  content_rejected integer DEFAULT 0,
  avg_moderation_time_seconds real DEFAULT 0,
  
  -- System metrics
  api_requests_count integer DEFAULT 0,
  avg_api_latency_ms real DEFAULT 0,
  error_count integer DEFAULT 0,
  error_rate real DEFAULT 0,
  
  -- Embedding metrics
  embeddings_generated integer DEFAULT 0,
  embeddings_pending integer DEFAULT 0,
  embeddings_failed integer DEFAULT 0,
  avg_embedding_time_ms real DEFAULT 0,
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for time-series queries
CREATE INDEX IF NOT EXISTS idx_platform_analytics_date ON platform_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_dau ON platform_analytics(dau DESC);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_new_users ON platform_analytics(new_users DESC);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE platform_analytics;

-- RLS Policies
ALTER TABLE platform_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can view platform analytics (for admin dashboard)
CREATE POLICY "Authenticated users can view platform analytics"
  ON platform_analytics
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Service role can manage all analytics
CREATE POLICY "Service role can manage platform analytics"
  ON platform_analytics
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_platform_analytics_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER platform_analytics_updated_at_trigger
  BEFORE UPDATE ON platform_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_platform_analytics_updated_at();

-- Grant permissions
GRANT SELECT ON platform_analytics TO authenticated;
GRANT ALL ON platform_analytics TO service_role;

-- Comments
COMMENT ON TABLE platform_analytics IS 'Daily aggregated platform-wide metrics and KPIs';
COMMENT ON COLUMN platform_analytics.dau IS 'Daily Active Users';
COMMENT ON COLUMN platform_analytics.mau IS 'Monthly Active Users';
COMMENT ON COLUMN platform_analytics.wau IS 'Weekly Active Users';
COMMENT ON COLUMN platform_analytics.connection_acceptance_rate IS 'Percentage of connection requests accepted';
COMMENT ON COLUMN platform_analytics.avg_match_score IS 'Average match score across all suggestions';
COMMENT ON COLUMN platform_analytics.content_flagged IS 'Content flagged for moderation review';
COMMENT ON COLUMN platform_analytics.error_rate IS 'Percentage of API requests that resulted in errors';
