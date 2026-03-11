-- Table: ai_mentor_sessions
-- Conversation sessions with the AI Mentor feature.

-- Create the ai_mentor_sessions table
CREATE TABLE IF NOT EXISTS public.ai_mentor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_user_id ON public.ai_mentor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_status ON public.ai_mentor_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_created_at ON public.ai_mentor_sessions(created_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_ai_mentor_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_mentor_sessions_updated_at ON public.ai_mentor_sessions;
CREATE TRIGGER update_ai_mentor_sessions_updated_at
    BEFORE UPDATE ON public.ai_mentor_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_ai_mentor_sessions_updated_at();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_mentor_sessions;

-- Row Level Security
ALTER TABLE public.ai_mentor_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own sessions
CREATE POLICY "Users can view own AI mentor sessions" ON public.ai_mentor_sessions
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can create their own sessions
CREATE POLICY "Users can create AI mentor sessions" ON public.ai_mentor_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own sessions
CREATE POLICY "Users can update own AI mentor sessions" ON public.ai_mentor_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Users can delete their own sessions
CREATE POLICY "Users can delete own AI mentor sessions" ON public.ai_mentor_sessions
    FOR DELETE USING (auth.uid() = user_id);
