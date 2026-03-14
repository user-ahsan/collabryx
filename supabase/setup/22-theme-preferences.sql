-- ============================================================================
-- TABLE 22: theme_preferences
-- ============================================================================
-- Light/dark mode preferences
-- Created: 2026-03-14

CREATE TABLE IF NOT EXISTS public.theme_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_theme_preferences_user_id ON public.theme_preferences(user_id);

-- RLS
ALTER TABLE public.theme_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own theme preferences" ON public.theme_preferences;
CREATE POLICY "Users can view own theme preferences" ON public.theme_preferences FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own theme preferences" ON public.theme_preferences;
CREATE POLICY "Users can manage own theme preferences" ON public.theme_preferences FOR ALL USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.theme_preferences;
