-- Table: user_experiences
-- Work/education timeline entries on the profile.

-- Create the user_experiences table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_experiences_user_id ON public.user_experiences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_experiences_order_idx ON public.user_experiences(order_index);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_experiences;

-- Row Level Security
ALTER TABLE public.user_experiences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all experiences
CREATE POLICY "Users can view any experiences" ON public.user_experiences
    FOR SELECT USING (true);

-- Policy: Users can manage only their own experiences
CREATE POLICY "Users can manage own experiences" ON public.user_experiences
    FOR ALL USING (auth.uid() = user_id);
