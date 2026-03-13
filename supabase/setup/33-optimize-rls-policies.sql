-- ============================================================
-- Migration 33: Optimize RLS Policies (PERFORMANCE)
-- ============================================================
-- Purpose: Replace auth.uid() with (select auth.uid()) in RLS policies
-- Fixes: 42x auth_rls_initplan warnings
-- Risk: LOW - Only optimizes policy evaluation, doesn't change access rules
-- ============================================================

-- ============================================================
-- profiles table
-- ============================================================

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (id = (SELECT auth.uid()));

-- ============================================================
-- user_skills table
-- ============================================================

DROP POLICY IF EXISTS "Users can manage own skills" ON public.user_skills;
CREATE POLICY "Users can manage own skills"
ON public.user_skills FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- user_interests table
-- ============================================================

DROP POLICY IF EXISTS "Users can manage own interests" ON public.user_interests;
CREATE POLICY "Users can manage own interests"
ON public.user_interests FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- user_experiences table
-- ============================================================

DROP POLICY IF EXISTS "Users can manage own experiences" ON public.user_experiences;
CREATE POLICY "Users can manage own experiences"
ON public.user_experiences FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- user_projects table
-- ============================================================

DROP POLICY IF EXISTS "Users can view projects" ON public.user_projects;
CREATE POLICY "Users can view projects"
ON public.user_projects FOR SELECT
USING (is_public = true OR user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage own projects" ON public.user_projects;
CREATE POLICY "Users can manage own projects"
ON public.user_projects FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- posts table
-- ============================================================

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts"
ON public.posts FOR INSERT
WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts"
ON public.posts FOR UPDATE
USING (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts"
ON public.posts FOR DELETE
USING (author_id = (SELECT auth.uid()));

-- ============================================================
-- post_attachments table
-- ============================================================

DROP POLICY IF EXISTS "Users can create post attachments" ON public.post_attachments;
CREATE POLICY "Users can create post attachments"
ON public.post_attachments FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.posts
        WHERE id = post_id AND author_id = (SELECT auth.uid())
    )
);

DROP POLICY IF EXISTS "Users can delete post attachments" ON public.post_attachments;
CREATE POLICY "Users can delete post attachments"
ON public.post_attachments FOR DELETE
USING (
    EXISTS (
        SELECT 1 FROM public.posts
        WHERE id = post_id AND author_id = (SELECT auth.uid())
    )
);

-- ============================================================
-- post_reactions table
-- ============================================================

DROP POLICY IF EXISTS "Users can create post reactions" ON public.post_reactions;
CREATE POLICY "Users can create post reactions"
ON public.post_reactions FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own post reactions" ON public.post_reactions;
CREATE POLICY "Users can delete own post reactions"
ON public.post_reactions FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- comments table
-- ============================================================

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments"
ON public.comments FOR INSERT
WITH CHECK (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments"
ON public.comments FOR UPDATE
USING (author_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments"
ON public.comments FOR DELETE
USING (author_id = (SELECT auth.uid()));

-- ============================================================
-- comment_likes table
-- ============================================================

DROP POLICY IF EXISTS "Users can create comment likes" ON public.comment_likes;
CREATE POLICY "Users can create comment likes"
ON public.comment_likes FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own comment likes" ON public.comment_likes;
CREATE POLICY "Users can delete own comment likes"
ON public.comment_likes FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- connections table
-- ============================================================

DROP POLICY IF EXISTS "Users can view their connections" ON public.connections;
CREATE POLICY "Users can view their connections"
ON public.connections FOR SELECT
USING (requester_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create connection requests" ON public.connections;
CREATE POLICY "Users can create connection requests"
ON public.connections FOR INSERT
WITH CHECK (
    requester_id = (SELECT auth.uid()) 
    AND receiver_id != (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Users can update connection status" ON public.connections;
CREATE POLICY "Users can update connection status"
ON public.connections FOR UPDATE
USING (
    receiver_id = (SELECT auth.uid()) 
    OR requester_id = (SELECT auth.uid())
);

DROP POLICY IF EXISTS "Users can delete own pending requests" ON public.connections;
CREATE POLICY "Users can delete own pending requests"
ON public.connections FOR DELETE
USING (
    requester_id = (SELECT auth.uid()) 
    AND status = 'pending'
);

-- ============================================================
-- match_suggestions table
-- ============================================================

DROP POLICY IF EXISTS "Users can view own match suggestions" ON public.match_suggestions;
CREATE POLICY "Users can view own match suggestions"
ON public.match_suggestions FOR SELECT
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update suggestion status" ON public.match_suggestions;
CREATE POLICY "Users can update suggestion status"
ON public.match_suggestions FOR UPDATE
USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- match_activity table
-- ============================================================

DROP POLICY IF EXISTS "Users can view own match activity" ON public.match_activity;
CREATE POLICY "Users can view own match activity"
ON public.match_activity FOR SELECT
USING (target_user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update match activity" ON public.match_activity;
CREATE POLICY "Users can update match activity"
ON public.match_activity FOR UPDATE
USING (target_user_id = (SELECT auth.uid()));

-- ============================================================
-- conversations table
-- ============================================================

DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations"
ON public.conversations FOR SELECT
USING (participant_1 = (SELECT auth.uid()) OR participant_2 = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations"
ON public.conversations FOR UPDATE
USING (participant_1 = (SELECT auth.uid()) OR participant_2 = (SELECT auth.uid()));

-- ============================================================
-- messages table
-- ============================================================

DROP POLICY IF EXISTS "Users can view conversation messages" ON public.messages;
CREATE POLICY "Users can view conversation messages"
ON public.messages FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = conversation_id 
        AND (participant_1 = (SELECT auth.uid()) OR participant_2 = (SELECT auth.uid()))
    )
);

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
ON public.messages FOR INSERT
WITH CHECK (
    sender_id = (SELECT auth.uid())
    AND EXISTS (
        SELECT 1 FROM public.conversations
        WHERE id = conversation_id
        AND (participant_1 = (SELECT auth.uid()) OR participant_2 = (SELECT auth.uid()))
    )
);

-- ============================================================
-- notifications table
-- ============================================================

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications"
ON public.notifications FOR SELECT
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications"
ON public.notifications FOR UPDATE
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "Users can delete own notifications"
ON public.notifications FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- ai_mentor_sessions table
-- ============================================================

DROP POLICY IF EXISTS "Users can view own AI mentor sessions" ON public.ai_mentor_sessions;
CREATE POLICY "Users can view own AI mentor sessions"
ON public.ai_mentor_sessions FOR SELECT
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can create AI mentor sessions" ON public.ai_mentor_sessions;
CREATE POLICY "Users can create AI mentor sessions"
ON public.ai_mentor_sessions FOR INSERT
WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can update own AI mentor sessions" ON public.ai_mentor_sessions;
CREATE POLICY "Users can update own AI mentor sessions"
ON public.ai_mentor_sessions FOR UPDATE
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can delete own AI mentor sessions" ON public.ai_mentor_sessions;
CREATE POLICY "Users can delete own AI mentor sessions"
ON public.ai_mentor_sessions FOR DELETE
USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- notification_preferences table
-- ============================================================

DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences"
ON public.notification_preferences FOR SELECT
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification preferences"
ON public.notification_preferences FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- theme_preferences table
-- ============================================================

DROP POLICY IF EXISTS "Users can view own theme preferences" ON public.theme_preferences;
CREATE POLICY "Users can view own theme preferences"
ON public.theme_preferences FOR SELECT
USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Users can manage own theme preferences" ON public.theme_preferences;
CREATE POLICY "Users can manage own theme preferences"
ON public.theme_preferences FOR ALL
USING (user_id = (SELECT auth.uid()))
WITH CHECK (user_id = (SELECT auth.uid()));

-- ============================================================
-- profile_embeddings table
-- ============================================================

DROP POLICY IF EXISTS "Users can view own embedding status" ON public.profile_embeddings;
CREATE POLICY "Users can view own embedding status"
ON public.profile_embeddings FOR SELECT
USING (user_id = (SELECT auth.uid()));

-- ============================================================
-- Verification Query
-- ============================================================
-- Run this after migration to verify policies use subquery pattern:
-- 
-- SELECT policyname, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public'
--   AND (qual LIKE '%(select auth.uid())%' OR with_check LIKE '%(select auth.uid())%')
-- ORDER BY tablename, policyname;
-- ============================================================
