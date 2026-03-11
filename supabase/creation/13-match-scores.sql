-- Table: match_scores
-- Detailed breakdown of WHY two users match. Powers the "Why Match" modal.

-- Create the match_scores table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_scores_suggestion_id ON public.match_scores(suggestion_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_scores;

-- Row Level Security
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view match scores for their suggestions
CREATE POLICY "Users can view match scores" ON public.match_scores
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.match_suggestions ms
            WHERE ms.id = match_scores.suggestion_id
            AND ms.user_id = auth.uid()
        )
    );

-- Policy: System can insert/update match scores (via edge functions)
CREATE POLICY "System can manage match scores" ON public.match_scores
    FOR ALL USING (false)
    WITH CHECK (false);
