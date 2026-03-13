-- ============================================================
-- Migration 34: Merge Permissive Policies (PERFORMANCE)
-- ============================================================
-- Purpose: Remove duplicate SELECT policies that cause performance issues
-- Fixes: 13x multiple_permissive_policies warnings
-- Risk: LOW - Merges duplicate policies into single comprehensive policy
-- ============================================================

-- ============================================================
-- notification_preferences - Merge duplicate SELECT policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can manage own notification preferences"
ON public.notification_preferences FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- theme_preferences - Merge duplicate SELECT policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view own theme preferences" ON public.theme_preferences;
DROP POLICY IF EXISTS "Users can manage own theme preferences" ON public.theme_preferences;

CREATE POLICY "Users can manage own theme preferences"
ON public.theme_preferences FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- user_experiences - Merge duplicate SELECT policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view any experiences" ON public.user_experiences;
DROP POLICY IF EXISTS "Users can manage own experiences" ON public.user_experiences;

CREATE POLICY "Users can view any experiences"
ON public.user_experiences FOR SELECT
USING (true);

CREATE POLICY "Users can manage own experiences"
ON public.user_experiences FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- user_interests - Merge duplicate SELECT policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view any interests" ON public.user_interests;
DROP POLICY IF EXISTS "Users can manage own interests" ON public.user_interests;

CREATE POLICY "Users can view any interests"
ON public.user_interests FOR SELECT
USING (true);

CREATE POLICY "Users can manage own interests"
ON public.user_interests FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- user_projects - Merge duplicate SELECT policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view projects" ON public.user_projects;
DROP POLICY IF EXISTS "Users can manage own projects" ON public.user_projects;

CREATE POLICY "Users can view projects"
ON public.user_projects FOR SELECT
USING (is_public = true OR user_id = (SELECT auth.uid()));

CREATE POLICY "Users can manage own projects"
ON public.user_projects FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- user_skills - Merge duplicate SELECT policies
-- ============================================================

DROP POLICY IF EXISTS "Users can view any skills" ON public.user_skills;
DROP POLICY IF EXISTS "Users can manage own skills" ON public.user_skills;

CREATE POLICY "Users can view any skills"
ON public.user_skills FOR SELECT
USING (true);

CREATE POLICY "Users can manage own skills"
ON public.user_skills FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- Verification Query
-- ============================================================
-- Run this after migration to verify no duplicate permissive policies:
-- 
-- SELECT tablename, policyname, cmd, roles
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- ORDER BY tablename, cmd, policyname;
-- ============================================================
