-- ============================================================
-- Migration 32: Add Missing RLS Policies (SECURITY)
-- ============================================================
-- Purpose: Add RLS policies to tables that have RLS enabled but no policies
-- Fixes: 3x rls_enabled_no_policy warnings (ai_mentor_messages, match_preferences, match_scores)
-- Risk: LOW - Adds security policies, doesn't change data
-- ============================================================

-- ============================================================
-- ai_mentor_messages
-- ============================================================

-- Users can view own AI mentor messages
CREATE POLICY "Users can view own AI mentor messages"
ON public.ai_mentor_messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.ai_mentor_sessions
        WHERE id = session_id AND user_id = (SELECT auth.uid())
    )
);

-- Users can add AI mentor messages
CREATE POLICY "Users can add AI mentor messages"
ON public.ai_mentor_messages FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.ai_mentor_sessions
        WHERE id = session_id AND user_id = (SELECT auth.uid())
    )
);

-- Users can update own AI mentor messages
CREATE POLICY "Users can update own AI mentor messages"
ON public.ai_mentor_messages FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.ai_mentor_sessions
        WHERE id = session_id AND user_id = (SELECT auth.uid())
    )
);

-- ============================================================
-- match_preferences
-- ============================================================

-- Users can view own match preferences
CREATE POLICY "Users can view own match preferences"
ON public.match_preferences FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- Users can manage own match preferences
CREATE POLICY "Users can manage own match preferences"
ON public.match_preferences FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- match_scores
-- ============================================================

-- Service role can manage match scores (users read via match_suggestions join)
CREATE POLICY "Service role can manage match scores"
ON public.match_scores FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Users can view match scores for own suggestions (via join)
CREATE POLICY "Users can view match scores for own suggestions"
ON public.match_scores FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.match_suggestions
        WHERE id = suggestion_id AND user_id = (SELECT auth.uid())
    )
);

-- ============================================================
-- Verification Query
-- ============================================================
-- Run this after migration to verify all tables have policies:
-- 
-- SELECT tablename, COUNT(*) as policy_count
-- FROM pg_policies
-- WHERE schemaname = 'public'
-- GROUP BY tablename
-- ORDER BY tablename;
-- ============================================================
