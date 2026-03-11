-- Table: ai_mentor_messages
-- Messages within an AI Mentor session (user messages + AI responses).

-- Create the ai_mentor_messages table
CREATE TABLE IF NOT EXISTS public.ai_mentor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.ai_mentor_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    is_saved_to_profile BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_mentor_messages_session_id ON public.ai_mentor_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_messages_created_at ON public.ai_mentor_messages(created_at ASC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_mentor_messages;

-- Row Level Security
ALTER TABLE public.ai_mentor_messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages from their own sessions
CREATE POLICY "Users can view own AI mentor messages" ON public.ai_mentor_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.ai_mentor_sessions s
            WHERE s.id = ai_mentor_messages.session_id
            AND s.user_id = auth.uid()
        )
    );

-- Policy: Users can add messages to their own sessions
CREATE POLICY "Users can add AI mentor messages" ON public.ai_mentor_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.ai_mentor_sessions s
            WHERE s.id = ai_mentor_messages.session_id
            AND s.user_id = auth.uid()
        )
    );

-- Policy: Users can mark their own messages as saved
CREATE POLICY "Users can update own AI mentor messages" ON public.ai_mentor_messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.ai_mentor_sessions s
            WHERE s.id = ai_mentor_messages.session_id
            AND s.user_id = auth.uid()
        )
    );
