-- =====================================================
-- Feed Scores Table
-- =====================================================
-- Purpose: Cache for personalized feed ranking scores
-- Created: 2026-03-18
-- Task: 1.1.2 (TASKS.md)
-- =====================================================

-- Create feed_scores table
CREATE TABLE IF NOT EXISTS feed_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  
  -- Scoring factors
  score real NOT NULL DEFAULT 0,
  semantic_score real DEFAULT 0,
  engagement_score real DEFAULT 0,
  recency_score real DEFAULT 0,
  connection_boost real DEFAULT 1,
  
  -- Additional context
  factors jsonb DEFAULT '{}',
  
  -- Timestamps
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz,
  
  -- Unique constraint: one score per user-post pair
  CONSTRAINT unique_user_post_score UNIQUE (user_id, post_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_feed_scores_user_id ON feed_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_scores_user_score ON feed_scores(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_feed_scores_post_id ON feed_scores(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_scores_created_at ON feed_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_scores_expires_at ON feed_scores(expires_at) WHERE expires_at IS NOT NULL;

-- Partial index for non-expired scores
CREATE INDEX IF NOT EXISTS idx_feed_scores_active ON feed_scores(user_id, score DESC) 
  WHERE expires_at IS NULL OR expires_at > now();

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE feed_scores;

-- RLS Policies
ALTER TABLE feed_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own feed scores
CREATE POLICY "Users can view own feed scores"
  ON feed_scores
  FOR SELECT
  USING (user_id = auth.uid());

-- Policy: Service role can manage all feed scores
CREATE POLICY "Service role can manage feed scores"
  ON feed_scores
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to cleanup expired scores
CREATE OR REPLACE FUNCTION cleanup_expired_feed_scores()
RETURNS void AS $$
BEGIN
  DELETE FROM feed_scores
  WHERE expires_at IS NOT NULL AND expires_at < now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON feed_scores TO authenticated;
GRANT ALL ON feed_scores TO service_role;

-- Comment
COMMENT ON TABLE feed_scores IS 'Cached personalized feed ranking scores for users';
COMMENT ON COLUMN feed_scores.score IS 'Final computed feed score (0-1)';
COMMENT ON COLUMN feed_scores.semantic_score IS 'Semantic similarity component (35% weight)';
COMMENT ON COLUMN feed_scores.engagement_score IS 'Thompson sampling engagement prediction (30% weight)';
COMMENT ON COLUMN feed_scores.recency_score IS 'Exponential decay recency factor (20% weight)';
COMMENT ON COLUMN feed_scores.connection_boost IS 'Connection boost multiplier (1.5x if connected)';
COMMENT ON COLUMN feed_scores.factors IS 'Additional scoring factors and metadata';
COMMENT ON COLUMN feed_scores.expires_at IS 'Score expiration time for cache invalidation';
