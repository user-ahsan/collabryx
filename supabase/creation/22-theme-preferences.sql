-- Table: theme_preferences
-- User's dark/light theme mode setting.

-- Create the theme_preferences table
CREATE TABLE IF NOT EXISTS public.theme_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_theme_preferences_user_id ON public.theme_preferences(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_theme_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_theme_preferences_updated_at ON public.theme_preferences;
CREATE TRIGGER update_theme_preferences_updated_at
    BEFORE UPDATE ON public.theme_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_theme_preferences_updated_at();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.theme_preferences;

-- Row Level Security
ALTER TABLE public.theme_preferences ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own theme preferences
CREATE POLICY "Users can view own theme preferences" ON public.theme_preferences
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can manage their own theme preferences
CREATE POLICY "Users can manage own theme preferences" ON public.theme_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Create trigger to auto-create theme_preferences on profile creation
CREATE OR REPLACE FUNCTION public.handle_new_theme_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.theme_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_theme ON public.profiles;
CREATE TRIGGER on_profile_created_theme
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_theme_preferences();
