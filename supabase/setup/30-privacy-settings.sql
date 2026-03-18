-- ============================================================================
-- TABLE: privacy_settings
-- ============================================================================
-- Privacy settings for user profiles
-- Created: 2026-03-19 (Phase 3 Task 5)

CREATE TABLE IF NOT EXISTS public.privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends-only', 'private')),
    show_email BOOLEAN NOT NULL DEFAULT FALSE,
    show_connections_list BOOLEAN NOT NULL DEFAULT TRUE,
    activity_status_visible BOOLEAN NOT NULL DEFAULT TRUE,
    allow_data_download BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON public.privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_settings_visibility ON public.privacy_settings(profile_visibility);

-- RLS
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own privacy settings" ON public.privacy_settings;
CREATE POLICY "Users can view own privacy settings" ON public.privacy_settings FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own privacy settings" ON public.privacy_settings;
CREATE POLICY "Users can update own privacy settings" ON public.privacy_settings FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own privacy settings" ON public.privacy_settings;
CREATE POLICY "Users can insert own privacy settings" ON public.privacy_settings FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.privacy_settings;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_privacy_settings_updated_at ON public.privacy_settings;
CREATE TRIGGER update_privacy_settings_updated_at
    BEFORE UPDATE ON public.privacy_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- TABLE: blocked_users
-- ============================================================================
-- User blocking functionality
-- Created: 2026-03-19 (Phase 3 Task 5)

CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);

-- RLS
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own blocked list" ON public.blocked_users;
CREATE POLICY "Users can view own blocked list" ON public.blocked_users FOR SELECT 
    USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block others" ON public.blocked_users;
CREATE POLICY "Users can block others" ON public.blocked_users FOR INSERT 
    WITH CHECK (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can unblock" ON public.blocked_users;
CREATE POLICY "Users can unblock" ON public.blocked_users FOR DELETE 
    USING (auth.uid() = blocker_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_users;

-- Constraint: Cannot block yourself
ALTER TABLE public.blocked_users 
    ADD CONSTRAINT check_not_self_block 
    CHECK (blocker_id != blocked_id);
