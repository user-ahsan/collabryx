-- Table: match_activity
-- Events showing who viewed your profile, who's building something you might fit, etc.

-- Create the match_activity table
CREATE TABLE IF NOT EXISTS public.match_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('profile_view', 'building_match', 'skill_match')),
    activity TEXT NOT NULL,
    match_percentage INTEGER CHECK (match_percentage >= 0 AND match_percentage <= 100),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_match_activity_target_user ON public.match_activity(target_user_id);
CREATE INDEX IF NOT EXISTS idx_match_activity_created_at ON public.match_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_match_activity_unread ON public.match_activity(target_user_id, is_read);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_activity;

-- Row Level Security
ALTER TABLE public.match_activity ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own match activity
CREATE POLICY "Users can view own match activity" ON public.match_activity
    FOR SELECT USING (auth.uid() = target_user_id);

-- Policy: System can insert match activity (via edge functions)
-- Uses service role for edge function access
CREATE POLICY "Service role can insert match activity" ON public.match_activity
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Policy: Users can mark activity as read
CREATE POLICY "Users can update match activity" ON public.match_activity
    FOR UPDATE USING (auth.uid() = target_user_id);
