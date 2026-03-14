-- ============================================================================
-- TABLE 3: user_interests
-- ============================================================================
-- User interests/tags for matching
-- Created: 2026-03-14

CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, interest)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON public.user_interests(interest);

-- RLS
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view any interests" ON public.user_interests;
CREATE POLICY "Users can view any interests" ON public.user_interests FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own interests" ON public.user_interests;
CREATE POLICY "Users can manage own interests" ON public.user_interests FOR ALL USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_interests;
