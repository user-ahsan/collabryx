-- ============================================================================
-- RLS POLICIES VERIFICATION SCRIPT
-- ============================================================================
-- Purpose: Verify all tables have RLS enabled and proper policies
-- Run: After applying 99-master-all-tables.sql
-- ============================================================================

-- ============================================================================
-- 1. VERIFY ALL TABLES HAVE RLS ENABLED
-- ============================================================================

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 2. COUNT POLICIES PER TABLE
-- ============================================================================

SELECT 
    tablename,
    COUNT(*) as policy_count,
    string_agg(policyname, ', ' ORDER BY policyname) as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- 3. VERIFY SPECIFIC TABLES HAVE EXPECTED POLICIES
-- ============================================================================

-- Check conversations table policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'conversations'
ORDER BY policyname;

-- Check messages table policies
SELECT policyname, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename = 'messages'
ORDER BY policyname;

-- ============================================================================
-- 4. VERIFY RLS IS ENFORCED FOR ALL TABLES
-- ============================================================================

-- This query shows tables where RLS is NOT enabled (should return 0 rows)
SELECT 
    schemaname,
    tablename,
    'MISSING RLS!' as issue
FROM pg_tables 
WHERE schemaname = 'public'
  AND rowsecurity = false
  AND tablename NOT IN ('pg_stat_statements') -- Exclude system tables
ORDER BY tablename;

-- ============================================================================
-- 5. VERIFY POLICY COVERAGE
-- ============================================================================

-- Tables without SELECT policies (potential security issue)
SELECT 
    t.tablename,
    'NO SELECT POLICY' as issue
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.cmd = 'SELECT'
WHERE t.schemaname = 'public'
  AND p.policyname IS NULL
  AND t.tablename NOT LIKE 'embedding_%' -- Service role manages these
  AND t.tablename NOT IN ('platform_analytics', 'content_moderation_logs') -- Admin only
ORDER BY t.tablename;

-- ============================================================================
-- 6. SUMMARY STATISTICS
-- ============================================================================

SELECT 
    'Total Tables' as metric,
    COUNT(*) as count
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename NOT LIKE 'pg_%'
UNION ALL
SELECT 
    'Tables with RLS Enabled',
    COUNT(*)
FROM pg_tables 
WHERE schemaname = 'public' 
  AND rowsecurity = true
UNION ALL
SELECT 
    'Total Policies',
    COUNT(*)
FROM pg_policies 
WHERE schemaname = 'public';

-- ============================================================================
-- 7. DETAILED POLICY REPORT
-- ============================================================================

SELECT 
    tablename,
    policyname,
    cmd as operation,
    CASE 
        WHEN qual IS NOT NULL AND with_check IS NOT NULL THEN 'SELECT/INSERT'
        WHEN qual IS NOT NULL THEN 'SELECT/UPDATE/DELETE'
        WHEN with_check IS NOT NULL THEN 'INSERT ONLY'
        ELSE 'UNKNOWN'
    END as policy_type,
    CASE 
        WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN 'User-specific'
        WHEN qual LIKE '%service_role%' OR with_check LIKE '%service_role%' THEN 'Service role'
        WHEN qual LIKE '%authenticated%' OR with_check LIKE '%authenticated%' THEN 'Authenticated users'
        WHEN qual = 'true' THEN 'Public read'
        ELSE 'Custom'
    END as access_level
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- EXPECTED RESULTS:
-- ============================================================================
-- - All 33 tables should have RLS enabled
-- - Each table should have at least 1 policy
-- - conversations: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - messages: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - No tables should appear in the "MISSING RLS" report
-- - Service role tables (embedding_*) should have service_role policies
-- ============================================================================
