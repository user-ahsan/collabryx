-- Table: user_interests
-- Industries and domains the user cares about. Used for matching.

-- Create the user_interests table
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, interest)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON public.user_interests(interest);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_interests;

-- Row Level Security
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all interests (for match queries)
CREATE POLICY "Users can view any interests" ON public.user_interests
    FOR SELECT USING (true);

-- Policy: Users can manage only their own interests
CREATE POLICY "Users can manage own interests" ON public.user_interests
    FOR ALL USING (auth.uid() = user_id);
