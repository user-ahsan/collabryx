-- ============================================================================
-- TABLE 13: match_scores
-- ============================================================================
-- Detailed match scoring breakdown
-- Created: 2026-03-14

CREATE TABLE IF NOT EXISTS public.match_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id UUID NOT NULL REFERENCES public.match_suggestions(id) ON DELETE CASCADE,
    skills_overlap INTEGER NOT NULL DEFAULT 0 CHECK (skills_overlap >= 0 AND skills_overlap <= 100),
    complementary_score INTEGER NOT NULL DEFAULT 0 CHECK (complementary_score >= 0 AND complementary_score <= 100),
    shared_interests INTEGER NOT NULL DEFAULT 0 CHECK (shared_interests >= 0 AND shared_interests <= 100),
    availability_score INTEGER CHECK (availability_score >= 0 AND availability_score <= 100),
    overlapping_skills TEXT[] DEFAULT '{}',
    complementary_explanation TEXT,
    shared_interest_tags TEXT[] DEFAULT '{}',
    insights JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_match_scores_suggestion_id ON public.match_scores(suggestion_id);

-- RLS
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can view match scores" ON public.match_scores;
CREATE POLICY "Service role can view match scores" ON public.match_scores FOR SELECT USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can insert match scores" ON public.match_scores;
CREATE POLICY "Service role can insert match scores" ON public.match_scores FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_scores;
