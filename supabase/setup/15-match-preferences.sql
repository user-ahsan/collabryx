-- Table: match_preferences
-- User's match filter preferences.

-- Create the match_preferences table
CREATE TABLE IF NOT EXISTS public.match_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    min_match_percentage INTEGER DEFAULT 0 CHECK (min_match_percentage >= 0 AND min_match_percentage <= 100),
    interested_in_types TEXT[] DEFAULT '{}',
    availability_match TEXT CHECK (availability_match IN ('any', 'similar', 'complementary')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_match_preferences_user_id ON public.match_preferences(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_match_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_match_preferences_updated_at ON public.match_preferences;
CREATE TRIGGER update_match_preferences_updated_at
    BEFORE UPDATE ON public.match_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_match_preferences_updated_at();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_preferences;

-- Row Level Security
ALTER TABLE public.match_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own match preferences
CREATE POLICY "Users can view own match preferences" ON public.match_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can manage their own match preferences
CREATE POLICY "Users can manage own match preferences" ON public.match_preferences
    FOR ALL USING (auth.uid() = user_id);
