-- ============================================================================
-- P0-11: ADD MISSING COMPOSITE INDEXES FOR PERFORMANCE OPTIMIZATION
-- ============================================================================
-- Date: 2026-03-20
-- Purpose: Add composite indexes on frequently queried columns to improve
--          query performance for posts, comments, connections, notifications,
--          and match-related tables.
-- Impact: Significant improvement in query performance for feed loading,
--         connection requests, notification queries, and match suggestions.
-- ============================================================================

-- --------------------------------------------
-- POSTS: Composite index for author's posts sorted by date
-- Used in: User profile posts, author feed queries
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_posts_author_created_at 
ON public.posts(author_id, created_at DESC);

-- --------------------------------------------
-- COMMENTS: Composite index for post comments with threading
-- Used in: Comment threads, nested comment queries
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_comments_post_parent 
ON public.comments(post_id, parent_id);

-- --------------------------------------------
-- CONNECTIONS: Already has composite indexes (verified in 99-master-all-tables.sql)
-- idx_connections_requester_receiver_status ON (requester_id, receiver_id, status)
-- idx_connections_receiver_requester_status ON (receiver_id, requester_id, status)
-- NO ACTION NEEDED - indexes already exist
-- --------------------------------------------

-- --------------------------------------------
-- NOTIFICATIONS: Composite index for user's unread notifications
-- Already exists: idx_notifications_unread ON (user_id, created_at DESC) WHERE is_read = false
-- Adding: Full composite index for all notification queries
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
ON public.notifications(user_id, is_read, created_at DESC);

-- --------------------------------------------
-- MATCH_SUGGESTIONS: Composite index for user matches by type
-- Note: match_suggestions doesn't have match_type column, using status instead
-- Adding composite index for efficient match queries
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_match_suggestions_user_status 
ON public.match_suggestions(user_id, status);

-- --------------------------------------------
-- MATCH_PREFERENCES: Index for user preferences lookup
-- --------------------------------------------
CREATE INDEX IF NOT EXISTS idx_match_preferences_user_id 
ON public.match_preferences(user_id);

-- ============================================================================
-- VERIFICATION QUERIES (Run these to verify indexes were created)
-- ============================================================================
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'posts' AND indexname LIKE 'idx_posts%';
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'comments' AND indexname LIKE 'idx_comments%';
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'notifications' AND indexname LIKE 'idx_notifications%';
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'match_suggestions' AND indexname LIKE 'idx_match%';
-- ============================================================================
