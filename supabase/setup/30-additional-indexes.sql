-- ============================================================================
-- ADDITIONAL PERFORMANCE INDEXES
-- ============================================================================
-- Date: 2026-03-15
-- Purpose: Add missing indexes identified in backend audit
-- Usage: Run in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/_/sql/new
-- ============================================================================

-- These indexes are safe to add to existing tables
-- Uses CONCURRENTLY to avoid locking tables during creation

-- --------------------------------------------
-- COMMENTS INDEXES
-- --------------------------------------------
-- Speeds up fetching comments for a post
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_post_id 
  ON public.comments(post_id);

-- Speeds up fetching comments by author
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_author_id 
  ON public.comments(author_id);

-- Speeds up fetching nested replies
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comments_parent_id 
  ON public.comments(parent_id);

-- --------------------------------------------
-- CONNECTIONS INDEXES
-- --------------------------------------------
-- Speeds up filtering by status (pending, accepted, etc.)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connections_status 
  ON public.connections(status);

-- Speeds up fetching received connection requests
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_connections_receiver_id 
  ON public.connections(receiver_id);

-- --------------------------------------------
-- NOTIFICATIONS INDEXES
-- --------------------------------------------
-- Speeds up fetching notifications for a user
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_id 
  ON public.notifications(user_id);

-- Speeds up filtering read/unread notifications
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_is_read 
  ON public.notifications(is_read);

-- Composite index for unread notifications (common query pattern)
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_notifications_user_unread 
  ON public.notifications(user_id, is_read) 
  WHERE is_read = FALSE;

-- --------------------------------------------
-- MATCH SUGGESTIONS INDEXES
-- --------------------------------------------
-- Composite index for user's active suggestions
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_match_suggestions_user_status 
  ON public.match_suggestions(user_id, status);

-- --------------------------------------------
-- POST REACTIONS INDEXES
-- --------------------------------------------
-- Speeds up checking if user reacted to a post
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_post_reactions_user_post 
  ON public.post_reactions(post_id, user_id);

-- --------------------------------------------
-- COMMENT LIKES INDEXES
-- --------------------------------------------
-- Speeds up checking if user liked a comment
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_comment_likes_user_comment 
  ON public.comment_likes(comment_id, user_id);

-- --------------------------------------------
-- VERIFICATION QUERIES
-- --------------------------------------------
-- Run these to verify indexes were created:

-- Check all indexes on comments table
-- SELECT indexname FROM pg_indexes WHERE tablename = 'comments';

-- Check all indexes on connections table
-- SELECT indexname FROM pg_indexes WHERE tablename = 'connections';

-- Check all indexes on notifications table
-- SELECT indexname FROM pg_indexes WHERE tablename = 'notifications';

-- --------------------------------------------
-- PERFORMANCE IMPACT
-- --------------------------------------------
-- Expected improvements:
-- - Comments fetch: 10-50x faster
-- - Connection requests: 5-20x faster
-- - Notifications: 10-100x faster (especially unread count)
-- - Match suggestions: 5-10x faster

-- --------------------------------------------
-- ROLLBACK (if needed)
-- --------------------------------------------
-- DROP INDEX IF EXISTS public.idx_comments_post_id;
-- DROP INDEX IF EXISTS public.idx_comments_author_id;
-- DROP INDEX IF EXISTS public.idx_comments_parent_id;
-- DROP INDEX IF EXISTS public.idx_connections_status;
-- DROP INDEX IF EXISTS public.idx_connections_receiver_id;
-- DROP INDEX IF EXISTS public.idx_notifications_user_id;
-- DROP INDEX IF EXISTS public.idx_notifications_is_read;
-- DROP INDEX IF EXISTS public.idx_notifications_user_unread;
-- DROP INDEX IF EXISTS public.idx_match_suggestions_user_status;
-- DROP INDEX IF EXISTS public.idx_post_reactions_user_post;
-- DROP INDEX IF EXISTS public.idx_comment_likes_user_comment;
