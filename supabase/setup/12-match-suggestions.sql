-- Table: match_suggestions
-- AI-generated match recommendations. Refreshed periodically by backend/edge function.

-- Create the match_suggestions table
CREATE TABLE IF NOT EXISTS public.match_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    matched_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_percentage INTEGER NOT NULL CHECK (match_percentage >= 0 AND match_percentage <= 100),
    reasons JSONB NOT NULL DEFAULT '[]',
    ai_confidence REAL CHECK (ai_confidence >= 0.0 AND ai_confidence <= 1.0),
    ai_explanation TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'connected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, matched_user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_suggestions_user_id ON public.match_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_match_suggestions_user_percentage ON public.match_suggestions(user_id, match_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_match_suggestions_matched_user ON public.match_suggestions(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_match_suggestions_status ON public.match_suggestions(status);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_suggestions;

-- Row Level Security
ALTER TABLE public.match_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only view their own match suggestions
CREATE POLICY "Users can view own match suggestions" ON public.match_suggestions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: System can insert suggestions (via edge functions)
-- Uses service role for edge function access
CREATE POLICY "Service role can insert match suggestions" ON public.match_suggestions
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Policy: Users can update status (dismiss, mark connected)
CREATE POLICY "Users can update suggestion status" ON public.match_suggestions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: System can delete expired suggestions
CREATE POLICY "System can delete expired suggestions" ON public.match_suggestions
    FOR DELETE USING (expires_at < NOW());
