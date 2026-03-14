-- ============================================================================
-- TABLE 19: ai_mentor_sessions
-- ============================================================================
-- AI mentor conversation sessions
-- Created: 2026-03-14

CREATE TABLE IF NOT EXISTS public.ai_mentor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_user_id ON public.ai_mentor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_status ON public.ai_mentor_sessions(status);

-- RLS
ALTER TABLE public.ai_mentor_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own AI mentor sessions" ON public.ai_mentor_sessions;
CREATE POLICY "Users can view own AI mentor sessions" ON public.ai_mentor_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create AI mentor sessions" ON public.ai_mentor_sessions;
CREATE POLICY "Users can create AI mentor sessions" ON public.ai_mentor_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own AI mentor sessions" ON public.ai_mentor_sessions;
CREATE POLICY "Users can update own AI mentor sessions" ON public.ai_mentor_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_mentor_sessions;
