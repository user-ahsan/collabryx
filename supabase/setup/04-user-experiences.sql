-- ============================================================================
-- TABLE 4: user_experiences
-- ============================================================================
-- Work/education history
-- Created: 2026-03-14

CREATE TABLE IF NOT EXISTS public.user_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT,
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, title)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_experiences_user_id ON public.user_experiences(user_id);

-- RLS
ALTER TABLE public.user_experiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view any experiences" ON public.user_experiences;
CREATE POLICY "Users can view any experiences" ON public.user_experiences FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own experiences" ON public.user_experiences;
CREATE POLICY "Users can manage own experiences" ON public.user_experiences FOR ALL USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_experiences;
