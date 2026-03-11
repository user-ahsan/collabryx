-- Table: user_skills
-- Skills attached to a user profile. Used for matching and profile display.

-- Create the user_skills table
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    proficiency TEXT CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_name ON public.user_skills(skill_name);
CREATE INDEX IF NOT EXISTS idx_user_skills_user_skill ON public.user_skills(user_id, skill_name);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_skills;

-- Row Level Security
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all skills (for match queries)
CREATE POLICY "Users can view any skills" ON public.user_skills
    FOR SELECT USING (true);

-- Policy: Users can manage only their own skills
CREATE POLICY "Users can manage own skills" ON public.user_skills
    FOR ALL USING (auth.uid() = user_id);
