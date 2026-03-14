-- ============================================================================
-- TABLE 20: ai_mentor_messages
-- ============================================================================
-- Individual AI mentor messages
-- Created: 2026-03-14

CREATE TABLE IF NOT EXISTS public.ai_mentor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.ai_mentor_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    is_saved_to_profile BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_ai_mentor_messages_session_id ON public.ai_mentor_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_messages_created ON public.ai_mentor_messages(created_at DESC);

-- RLS
ALTER TABLE public.ai_mentor_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own AI mentor messages" ON public.ai_mentor_messages;
CREATE POLICY "Users can view own AI mentor messages" ON public.ai_mentor_messages
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.ai_mentor_sessions s WHERE s.id = ai_mentor_messages.session_id AND s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users can create AI mentor messages" ON public.ai_mentor_messages;
CREATE POLICY "Users can create AI mentor messages" ON public.ai_mentor_messages
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.ai_mentor_sessions s WHERE s.id = ai_mentor_messages.session_id AND s.user_id = auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_mentor_messages;
