-- ============================================================================
-- TABLE 14: match_activity
-- ============================================================================
-- Match-related activity tracking
-- Created: 2026-03-14

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_match_activity_target_user ON public.match_activity(target_user_id);
CREATE INDEX IF NOT EXISTS idx_match_activity_created ON public.match_activity(created_at DESC);

-- RLS
ALTER TABLE public.match_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own match activity" ON public.match_activity;
CREATE POLICY "Users can view own match activity" ON public.match_activity FOR SELECT USING (auth.uid() = target_user_id);

DROP POLICY IF EXISTS "Service role can insert match activity" ON public.match_activity;
CREATE POLICY "Service role can insert match activity" ON public.match_activity FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update match activity" ON public.match_activity;
CREATE POLICY "Users can update match activity" ON public.match_activity FOR UPDATE USING (auth.uid() = target_user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_activity;
