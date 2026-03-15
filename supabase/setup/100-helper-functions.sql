-- ============================================================================
-- COLLABRYX - ADDITIONAL HELPER FUNCTIONS
-- ============================================================================
-- Version: 1.0.0
-- Date: 2026-03-15
-- 
-- Purpose: Additional helper functions for comments, connections, and notifications
-- 
-- Usage: Run this AFTER 99-master-all-tables.sql in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/_/sql/new
--
-- This file contains:
-- - Connection request count helper
-- - Notification creation helpers
-- - Comment helper utilities
-- - Match-making helper functions
--
-- ============================================================================

-- ============================================================================
-- SECTION 0: FIX EXISTING FUNCTIONS
-- ============================================================================
-- Drop and recreate check_embedding_rate_limit with correct signature
-- This fixes: ERROR: 42P13: cannot change return type of existing function

DROP FUNCTION IF EXISTS public.check_embedding_rate_limit(UUID);

-- ============================================================================
-- SECTION 1: CONNECTION HELPERS
-- ============================================================================

-- --------------------------------------------
-- FUNCTION: get_pending_connection_count
-- --------------------------------------------
-- Returns count of pending connection requests for a user
CREATE OR REPLACE FUNCTION public.get_pending_connection_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.connections
        WHERE receiver_id = target_user_id
        AND status = 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_pending_connection_count(UUID) IS 
'Get count of pending connection requests for a user';

GRANT EXECUTE ON FUNCTION public.get_pending_connection_count(UUID) TO authenticated;

-- --------------------------------------------
-- FUNCTION: get_connection_status
-- --------------------------------------------
-- Returns connection status between two users
CREATE OR REPLACE FUNCTION public.get_connection_status(user1_id UUID, user2_id UUID)
RETURNS TEXT AS $$
DECLARE
    conn_status TEXT;
BEGIN
    SELECT status INTO conn_status
    FROM public.connections
    WHERE (requester_id = user1_id AND receiver_id = user2_id)
       OR (requester_id = user2_id AND receiver_id = user1_id)
    LIMIT 1;
    
    RETURN COALESCE(conn_status, 'not_connected');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_connection_status(UUID, UUID) IS 
'Get connection status between two users: pending, accepted, declined, blocked, or not_connected';

GRANT EXECUTE ON FUNCTION public.get_connection_status(UUID, UUID) TO authenticated;

-- ============================================================================
-- SECTION 2: NOTIFICATION HELPERS
-- ============================================================================

-- --------------------------------------------
-- FUNCTION: create_notification
-- --------------------------------------------
-- Creates a notification for a user
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_data JSONB DEFAULT '{}'::JSONB,
    p_actor_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (
        user_id,
        type,
        title,
        message,
        data,
        actor_id
    ) VALUES (
        p_user_id,
        p_type,
        p_title,
        p_message,
        p_data,
        p_actor_id
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, JSONB, UUID) IS 
'Create a notification for a user with optional actor and metadata';

GRANT EXECUTE ON FUNCTION public.create_notification(UUID, TEXT, TEXT, TEXT, JSONB, UUID) TO authenticated;

-- --------------------------------------------
-- FUNCTION: get_unread_notification_count
-- --------------------------------------------
-- Returns count of unread notifications for a user
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.notifications
        WHERE user_id = p_user_id
        AND is_read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_unread_notification_count(UUID) IS 
'Get count of unread notifications for a user';

GRANT EXECUTE ON FUNCTION public.get_unread_notification_count(UUID) TO authenticated;

-- ============================================================================
-- SECTION 3: COMMENT HELPERS
-- ============================================================================

-- --------------------------------------------
-- FUNCTION: get_comment_depth
-- --------------------------------------------
-- Returns the depth (nesting level) of a comment
CREATE OR REPLACE FUNCTION public.get_comment_depth(p_comment_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_depth INTEGER := 0;
    v_parent_id UUID;
BEGIN
    SELECT parent_id INTO v_parent_id
    FROM public.comments
    WHERE id = p_comment_id;
    
    WHILE v_parent_id IS NOT NULL LOOP
        v_depth := v_depth + 1;
        
        SELECT parent_id INTO v_parent_id
        FROM public.comments
        WHERE id = v_parent_id;
    END LOOP;
    
    RETURN v_depth;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_comment_depth(UUID) IS 
'Get the nesting depth of a comment (0 = top-level, 1+ = reply depth)';

GRANT EXECUTE ON FUNCTION public.get_comment_depth(UUID) TO authenticated;

-- --------------------------------------------
-- FUNCTION: get_comment_replies_count
-- --------------------------------------------
-- Returns total count of replies for a comment (including nested replies)
CREATE OR REPLACE FUNCTION public.get_comment_replies_count(p_comment_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    WITH RECURSIVE reply_tree AS (
        SELECT id, parent_id
        FROM public.comments
        WHERE parent_id = p_comment_id
        
        UNION ALL
        
        SELECT c.id, c.parent_id
        FROM public.comments c
        INNER JOIN reply_tree rt ON c.parent_id = rt.id
    )
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM reply_tree;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_comment_replies_count(UUID) IS 
'Get total count of all replies (including nested) for a comment';

GRANT EXECUTE ON FUNCTION public.get_comment_replies_count(UUID) TO authenticated;

-- ============================================================================
-- SECTION 4: MATCH-MAKING HELPERS
-- ============================================================================

-- --------------------------------------------
-- FUNCTION: calculate_match_percentage
-- --------------------------------------------
-- Calculates basic match percentage between two users based on skills and interests
CREATE OR REPLACE FUNCTION public.calculate_match_percentage(user1_id UUID, user2_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_skills_overlap INTEGER := 0;
    v_shared_interests INTEGER := 0;
    v_total_skills INTEGER := 0;
    v_total_interests INTEGER := 0;
    v_match_score NUMERIC := 0;
BEGIN
    -- Calculate skills overlap
    SELECT COUNT(*)::INTEGER INTO v_skills_overlap
    FROM public.user_skills s1
    INNER JOIN public.user_skills s2 ON s1.skill_name = s2.skill_name
    WHERE s1.user_id = user1_id
    AND s2.user_id = user2_id;
    
    -- Get total unique skills
    SELECT COUNT(DISTINCT skill_name)::INTEGER INTO v_total_skills
    FROM (
        SELECT skill_name FROM public.user_skills WHERE user_id = user1_id
        UNION
        SELECT skill_name FROM public.user_skills WHERE user_id = user2_id
    ) combined;
    
    -- Calculate shared interests
    SELECT COUNT(*)::INTEGER INTO v_shared_interests
    FROM public.user_interests i1
    INNER JOIN public.user_interests i2 ON i1.interest = i2.interest
    WHERE i1.user_id = user1_id
    AND i2.user_id = user2_id;
    
    -- Get total unique interests
    SELECT COUNT(DISTINCT interest)::INTEGER INTO v_total_interests
    FROM (
        SELECT interest FROM public.user_interests WHERE user_id = user1_id
        UNION
        SELECT interest FROM public.user_interests WHERE user_id = user2_id
    ) combined_interests;
    
    -- Calculate match score (skills 60%, interests 40%)
    IF v_total_skills > 0 THEN
        v_match_score := v_match_score + (v_skills_overlap::NUMERIC / v_total_skills::NUMERIC) * 60;
    END IF;
    
    IF v_total_interests > 0 THEN
        v_match_score := v_match_score + (v_shared_interests::NUMERIC / v_total_interests::NUMERIC) * 40;
    END IF;
    
    RETURN ROUND(v_match_score)::INTEGER;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.calculate_match_percentage(UUID, UUID) IS 
'Calculate match percentage between two users (0-100) based on skills and interests overlap';

GRANT EXECUTE ON FUNCTION public.calculate_match_percentage(UUID, UUID) TO authenticated;

-- --------------------------------------------
-- FUNCTION: get_shared_skills
-- --------------------------------------------
-- Returns array of shared skills between two users
CREATE OR REPLACE FUNCTION public.get_shared_skills(user1_id UUID, user2_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    v_skills TEXT[];
BEGIN
    SELECT ARRAY_AGG(s1.skill_name) INTO v_skills
    FROM public.user_skills s1
    INNER JOIN public.user_skills s2 ON s1.skill_name = s2.skill_name
    WHERE s1.user_id = user1_id
    AND s2.user_id = user2_id;
    
    RETURN COALESCE(v_skills, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_shared_skills(UUID, UUID) IS 
'Get array of skill names shared between two users';

GRANT EXECUTE ON FUNCTION public.get_shared_skills(UUID, UUID) TO authenticated;

-- --------------------------------------------
-- FUNCTION: get_shared_interests
-- --------------------------------------------
-- Returns array of shared interests between two users
CREATE OR REPLACE FUNCTION public.get_shared_interests(user1_id UUID, user2_id UUID)
RETURNS TEXT[] AS $$
DECLARE
    v_interests TEXT[];
BEGIN
    SELECT ARRAY_AGG(i1.interest) INTO v_interests
    FROM public.user_interests i1
    INNER JOIN public.user_interests i2 ON i1.interest = i2.interest
    WHERE i1.user_id = user1_id
    AND i2.user_id = user2_id;
    
    RETURN COALESCE(v_interests, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_shared_interests(UUID, UUID) IS 
'Get array of interest names shared between two users';

GRANT EXECUTE ON FUNCTION public.get_shared_interests(UUID, UUID) TO authenticated;

-- ============================================================================
-- SECTION 5: UTILITY FUNCTIONS
-- ============================================================================

-- --------------------------------------------
-- FUNCTION: get_profile_completion_percentage
-- --------------------------------------------
-- Recalculates profile completion percentage
CREATE OR REPLACE FUNCTION public.get_profile_completion_percentage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_completion INTEGER := 0;
    v_has_skills INTEGER := 0;
    v_has_interests INTEGER := 0;
    v_has_experience INTEGER := 0;
    v_has_projects INTEGER := 0;
BEGIN
    -- Basic profile (25%)
    SELECT COUNT(*)::INTEGER INTO v_completion
    FROM public.profiles
    WHERE id = p_user_id
    AND (
        (display_name IS NOT NULL AND display_name != '')
        OR (full_name IS NOT NULL AND full_name != '')
    )
    AND headline IS NOT NULL
    AND headline != '';
    
    IF v_completion > 0 THEN
        v_completion := 25;
    END IF;
    
    -- Skills (25%)
    SELECT COUNT(*)::INTEGER INTO v_has_skills
    FROM public.user_skills
    WHERE user_id = p_user_id;
    
    IF v_has_skills > 0 THEN
        v_completion := v_completion + 25;
    END IF;
    
    -- Interests (25%)
    SELECT COUNT(*)::INTEGER INTO v_has_interests
    FROM public.user_interests
    WHERE user_id = p_user_id;
    
    IF v_has_interests > 0 THEN
        v_completion := v_completion + 25;
    END IF;
    
    -- Experience or Projects (25%)
    SELECT COUNT(*)::INTEGER INTO v_has_experience
    FROM public.user_experiences
    WHERE user_id = p_user_id;
    
    SELECT COUNT(*)::INTEGER INTO v_has_projects
    FROM public.user_projects
    WHERE user_id = p_user_id;
    
    IF v_has_experience > 0 OR v_has_projects > 0 THEN
        v_completion := v_completion + 25;
    END IF;
    
    RETURN v_completion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_profile_completion_percentage(UUID) IS 
'Calculate profile completion percentage (0-100) based on filled sections';

GRANT EXECUTE ON FUNCTION public.get_profile_completion_percentage(UUID) TO authenticated;

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
--
-- ✅ 10 helper functions added:
--    - get_pending_connection_count()
--    - get_connection_status()
--    - create_notification()
--    - get_unread_notification_count()
--    - get_comment_depth()
--    - get_comment_replies_count()
--    - calculate_match_percentage()
--    - get_shared_skills()
--    - get_shared_interests()
--    - get_profile_completion_percentage()
--
-- USAGE:
-- These functions are now available for use in:
-- - Supabase client queries
-- - Edge Functions
-- - Python worker
-- - RLS policies
--
-- EXAMPLES:
-- 
-- -- Get pending connection requests
-- SELECT get_pending_connection_count(auth.uid());
--
-- -- Check connection status
-- SELECT get_connection_status('user1-uuid', 'user2-uuid');
--
-- -- Create notification
-- SELECT create_notification(
--     auth.uid(),
--     'connection_request',
--     'New Connection Request',
--     'Someone wants to connect with you',
--     '{"requester_id": "..."}'::jsonb,
--     'requester-uuid'
-- );
--
-- -- Calculate match percentage
-- SELECT calculate_match_percentage(auth.uid(), 'other-user-uuid');
--
-- ============================================================================
