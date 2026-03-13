-- ============================================================
-- Migration 35: Add Missing Indexes (PERFORMANCE)
-- ============================================================
-- Purpose: Add indexes for foreign keys that are missing them
-- Fixes: 9x unindexed_foreign_keys warnings
-- Risk: LOW - Adds indexes for better query performance
-- ============================================================

-- 1. ai_mentor_messages.session_id
CREATE INDEX IF NOT EXISTS idx_ai_mentor_messages_session_id 
ON public.ai_mentor_messages(session_id);

-- 2. comment_likes.user_id
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id 
ON public.comment_likes(user_id);

-- 3. match_activity.actor_user_id
CREATE INDEX IF NOT EXISTS idx_match_activity_actor_user_id 
ON public.match_activity(actor_user_id);

-- 4. match_activity.target_user_id
CREATE INDEX IF NOT EXISTS idx_match_activity_target_user_id 
ON public.match_activity(target_user_id);

-- 5. match_scores.suggestion_id
CREATE INDEX IF NOT EXISTS idx_match_scores_suggestion_id 
ON public.match_scores(suggestion_id);

-- 6. match_suggestions.matched_user_id
CREATE INDEX IF NOT EXISTS idx_match_suggestions_matched_user_id 
ON public.match_suggestions(matched_user_id);

-- 7. messages.sender_id
CREATE INDEX IF NOT EXISTS idx_messages_sender_id 
ON public.messages(sender_id);

-- 8. notifications.actor_id
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id 
ON public.notifications(actor_id);

-- 9. post_reactions.user_id
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id 
ON public.post_reactions(user_id);

-- ============================================================
-- Verification Query
-- ============================================================
-- Run this after migration to verify all foreign keys have indexes:
-- 
-- SELECT
--     conrelid::regclass AS table_name,
--     conname AS constraint_name,
--     pg_get_constraintdef(oid) AS constraint_def
-- FROM pg_constraint
-- WHERE contype = 'f'
--   AND connamespace = 'public'::regnamespace
-- ORDER BY conrelid::regclass::text, conname;
-- ============================================================
