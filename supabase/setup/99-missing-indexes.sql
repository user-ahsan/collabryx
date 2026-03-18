-- ============================================================================
-- COLLABRYX MISSING COMPOSITE INDEXES
-- ============================================================================
-- Version: 1.0.0
-- Date: 2026-03-19
-- Phase: 2 Task 3 - Database Performance Optimization
--
-- This migration adds 2 missing composite indexes identified in the audit:
-- 1. Connections status index - Optimizes connection status checks
-- 2. Notifications unread index - Optimizes unread notification queries
--
-- Usage: Run in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/_/sql/new
--
-- SAFE TO RUN: All indexes use IF NOT EXISTS and can be run on existing data
-- ============================================================================

-- ============================================================================
-- INDEX 1: CONNECTIONS STATUS COMPOSITE INDEX
-- ============================================================================
-- Purpose: Optimize connection status checks for queries like:
--   - "Get all pending connections for a user"
--   - "Check if connection exists between two users with specific status"
--   - "Count connections by status for a user"
--
-- Query Pattern:
--   SELECT * FROM connections 
--   WHERE requester_id = $1 AND receiver_id = $2 AND status = $3
--
-- Performance Impact:
--   - Before: Sequential scan on connections table (O(n))
--   - After: Index scan (O(log n))
--   - Expected improvement: 10-100x faster for large tables
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_connections_requester_receiver_status 
ON public.connections(requester_id, receiver_id, status);

-- Alternative composite index for receiver-centric queries
-- This helps when checking "connections sent to me" with status filter
CREATE INDEX IF NOT EXISTS idx_connections_receiver_requester_status 
ON public.connections(receiver_id, requester_id, status);

-- ============================================================================
-- INDEX 2: NOTIFICATIONS UNREAD PARTIAL INDEX
-- ============================================================================
-- Purpose: Optimize unread notification queries for the notification bell badge
--
-- Query Pattern:
--   SELECT COUNT(*) FROM notifications 
--   WHERE user_id = $1 AND is_read = false 
--   ORDER BY created_at DESC
--
-- This is a PARTIAL INDEX (filtered index) that only indexes unread notifications
-- Benefits:
--   - Smaller index size (only ~10-20% of notifications are unread)
--   - Faster queries (index only contains relevant rows)
--   - Automatic maintenance (PostgreSQL keeps it updated)
--
-- Performance Impact:
--   - Before: Index scan + filter on is_read (scans all notifications)
--   - After: Index scan on partial index (only unread notifications)
--   - Expected improvement: 5-10x faster for unread counts
--   - Index size: ~80-90% smaller than full index
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
ON public.notifications(user_id, created_at DESC) 
WHERE is_read = false;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify the indexes were created successfully
-- ============================================================================

-- Verify indexes exist
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('connections', 'notifications')
--   AND indexname LIKE 'idx_%'
-- ORDER BY tablename, indexname;

-- Check index usage statistics (requires pg_stat_statements extension)
-- SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
-- FROM pg_stat_user_indexes
-- WHERE tablename IN ('connections', 'notifications')
-- ORDER BY tablename, indexname;

-- Analyze index size
-- SELECT 
--   indexname,
--   pg_size_pretty(pg_relation_size(indexname::text)) as index_size
-- FROM pg_indexes
-- WHERE tablename IN ('connections', 'notifications')
--   AND indexname IN (
--     'idx_connections_requester_receiver_status',
--     'idx_connections_receiver_requester_status',
--     'idx_notifications_unread'
--   );

-- ============================================================================
-- TESTING QUERIES
-- ============================================================================
-- Use EXPLAIN ANALYZE to verify indexes are being used
-- ============================================================================

-- Test 1: Connection status query
-- EXPLAIN ANALYZE
-- SELECT * FROM connections
-- WHERE requester_id = '00000000-0000-0000-0000-000000000000'
--   AND receiver_id = '00000000-0000-0000-0000-000000000001'
--   AND status = 'pending';

-- Test 2: Unread notification count
-- EXPLAIN ANALYZE
-- SELECT COUNT(*) FROM notifications
-- WHERE user_id = '00000000-0000-0000-0000-000000000000'
--   AND is_read = false;

-- Test 3: Unread notifications with ordering
-- EXPLAIN ANALYZE
-- SELECT * FROM notifications
-- WHERE user_id = '00000000-0000-0000-0000-000000000000'
--   AND is_read = false
-- ORDER BY created_at DESC
-- LIMIT 10;

-- ============================================================================
-- ROLLBACK (IF NEEDED)
-- ============================================================================
-- To drop these indexes if needed:
-- ============================================================================

-- DROP INDEX IF EXISTS public.idx_connections_requester_receiver_status;
-- DROP INDEX IF EXISTS public.idx_connections_receiver_requester_status;
-- DROP INDEX IF EXISTS public.idx_notifications_unread;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- Indexes added:
-- ✅ idx_connections_requester_receiver_status
-- ✅ idx_connections_receiver_requester_status
-- ✅ idx_notifications_unread (partial index)
--
-- Next steps:
-- 1. Verify indexes exist using verification queries above
-- 2. Monitor query performance in Supabase dashboard
-- 3. Check index usage statistics after 24-48 hours
-- ============================================================================
