-- =====================================================
-- Match Scores Table
-- =====================================================
-- Purpose: Stores detailed breakdown of match scoring factors
-- Created: 2026-03-18
-- Task: 1.1.1 (TASKS.md)
-- =====================================================

-- Create match_scores table
CREATE TABLE IF NOT EXISTS match_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_id uuid REFERENCES match_suggestions(id) ON DELETE CASCADE NOT NULL,
  
  -- Scoring breakdown (0-1 scale)
  semantic_similarity real DEFAULT 0,
  skills_overlap real DEFAULT 0,
  complementary_score real DEFAULT 0,
  shared_interests real DEFAULT 0,
  activity_match real DEFAULT 0,
  
  -- Overall score (0-100)
  overall_score real DEFAULT 0,
  
  -- Model metadata
  model_version text DEFAULT 'rule-based-v1',
  model_config jsonb DEFAULT '{}',
  
  -- Timestamps
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_match_scores_suggestion_id ON match_scores(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_overall_score ON match_scores(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_match_scores_calculated_at ON match_scores(calculated_at DESC);

-- Composite index for filtering by score range
CREATE INDEX IF NOT EXISTS idx_match_scores_score_range ON match_scores(overall_score, calculated_at);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE match_scores;

-- RLS Policies
ALTER TABLE match_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view scores for their own match suggestions
CREATE POLICY "Users can view own match scores"
  ON match_scores
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM match_suggestions
      WHERE match_suggestions.id = match_scores.suggestion_id
      AND (match_suggestions.user_id = auth.uid() OR match_suggestions.matched_user_id = auth.uid())
    )
  );

-- Policy: Service role can insert/update scores
CREATE POLICY "Service role can manage match scores"
  ON match_scores
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_match_scores_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER match_scores_updated_at_trigger
  BEFORE UPDATE ON match_scores
  FOR EACH ROW
  EXECUTE FUNCTION update_match_scores_updated_at();

-- Grant permissions
GRANT SELECT ON match_scores TO authenticated;
GRANT ALL ON match_scores TO service_role;

-- Comment
COMMENT ON TABLE match_scores IS 'Detailed breakdown of match scoring factors for each suggestion';
COMMENT ON COLUMN match_scores.semantic_similarity IS 'Vector embedding cosine similarity (0-1)';
COMMENT ON COLUMN match_scores.skills_overlap IS 'Skills overlap ratio (0-1)';
COMMENT ON COLUMN match_scores.complementary_score IS 'How well skills complement each other (0-1)';
COMMENT ON COLUMN match_scores.shared_interests IS 'Shared interests ratio (0-1)';
COMMENT ON COLUMN match_scores.activity_match IS 'Activity level compatibility (0-1)';
COMMENT ON COLUMN match_scores.overall_score IS 'Overall match percentage (0-100)';
COMMENT ON COLUMN match_scores.model_version IS 'Version of scoring model used';
