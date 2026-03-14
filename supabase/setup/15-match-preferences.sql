-- ============================================================================
-- TABLE 15: match_preferences
-- ============================================================================
-- User match preferences
-- Created: 2026-03-14

CREATE TABLE IF NOT EXISTS public.match_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    min_match_percentage INTEGER DEFAULT 0 CHECK (min_match_percentage >= 0 AND min_match_percentage <= 100),
    interested_in_types TEXT[] DEFAULT '{}',
    availability_match TEXT CHECK (availability_match IN ('any', 'similar', 'complementary')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_match_preferences_user_id ON public.match_preferences(user_id);

-- RLS
ALTER TABLE public.match_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own match preferences" ON public.match_preferences;
CREATE POLICY "Users can view own match preferences" ON public.match_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own match preferences" ON public.match_preferences;
CREATE POLICY "Users can manage own match preferences" ON public.match_preferences FOR ALL USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_preferences;
