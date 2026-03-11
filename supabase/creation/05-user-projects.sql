-- Table: user_projects
-- Portfolio projects displayed on profile. Privacy-controlled.

-- Create the user_projects table
CREATE TABLE IF NOT EXISTS public.user_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    image_url TEXT,
    tech_stack TEXT[] DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON public.user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_public ON public.user_projects(is_public);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_projects;

-- Row Level Security
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view public projects or their own private projects
CREATE POLICY "Users can view projects" ON public.user_projects
    FOR SELECT USING (
        is_public = TRUE OR
        user_id = auth.uid()
    );

-- Policy: Users can manage only their own projects
CREATE POLICY "Users can manage own projects" ON public.user_projects
    FOR ALL USING (auth.uid() = user_id);
