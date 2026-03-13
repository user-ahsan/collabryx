-- ============================================================
-- Migration 30: Fix Function Search Paths (SECURITY)
-- ============================================================
-- Purpose: Add SECURITY DEFINER SET search_path = public to all functions
-- Fixes: 16x function_search_path_mutable warnings
-- Risk: LOW - Only adds search_path constraint, doesn't change logic
-- ============================================================

-- 1. update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. handle_new_user (profiles trigger)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, onboarding_completed, profile_completion)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        false,
        25
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. handle_new_notification_preferences
CREATE OR REPLACE FUNCTION public.handle_new_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 4. handle_new_theme_preferences
CREATE OR REPLACE FUNCTION public.handle_new_theme_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.theme_preferences (user_id, theme)
    VALUES (NEW.id, 'system');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. increment_post_reaction_count
CREATE OR REPLACE FUNCTION public.increment_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts
    SET reaction_count = reaction_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. decrement_post_reaction_count
CREATE OR REPLACE FUNCTION public.decrement_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts
    SET reaction_count = GREATEST(reaction_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 7. increment_post_comment_count
CREATE OR REPLACE FUNCTION public.increment_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 8. decrement_post_comment_count
CREATE OR REPLACE FUNCTION public.decrement_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts
    SET comment_count = GREATEST(comment_count - 1, 0)
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. increment_comment_like_count
CREATE OR REPLACE FUNCTION public.increment_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.comments
    SET like_count = like_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 10. decrement_comment_like_count
CREATE OR REPLACE FUNCTION public.decrement_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.comments
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.comment_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 11. get_conversation
CREATE OR REPLACE FUNCTION public.get_conversation(user1 uuid, user2 uuid)
RETURNS uuid AS $$
DECLARE
    conversation_id uuid;
BEGIN
    SELECT id INTO conversation_id
    FROM public.conversations
    WHERE (participant_1 = user1 AND participant_2 = user2)
       OR (participant_1 = user2 AND participant_2 = user1);
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 12. are_connected
CREATE OR REPLACE FUNCTION public.are_connected(user1 uuid, user2 uuid)
RETURNS boolean AS $$
DECLARE
    connected boolean;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM public.connections
        WHERE ((requester_id = user1 AND receiver_id = user2)
            OR (requester_id = user2 AND receiver_id = user1))
        AND status = 'accepted'
    ) INTO connected;
    RETURN connected;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 13. update_conversation_last_message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET 
        last_message_text = NEW.text,
        last_message_at = NEW.created_at,
        unread_count_1 = CASE 
            WHEN participant_1 = NEW.sender_id THEN unread_count_1
            ELSE unread_count_1 + 1
        END,
        unread_count_2 = CASE 
            WHEN participant_2 = NEW.sender_id THEN unread_count_2
            ELSE unread_count_2 + 1
        END
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 14. regenerate_embedding (from profile_embeddings)
CREATE OR REPLACE FUNCTION public.regenerate_embedding(p_user_id uuid)
RETURNS void AS $$
BEGIN
    INSERT INTO public.profile_embeddings (user_id, status, last_updated)
    VALUES (p_user_id, 'pending', now())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        status = 'pending',
        last_updated = now(),
        embedding = NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 15. trigger_embedding_generation
CREATE OR REPLACE FUNCTION public.trigger_embedding_generation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.onboarding_completed = true AND OLD.onboarding_completed IS DISTINCT FROM true THEN
        INSERT INTO public.profile_embeddings (user_id, status, last_updated)
        VALUES (NEW.id, 'pending', now())
        ON CONFLICT (user_id) DO UPDATE SET
            status = 'pending',
            last_updated = now(),
            embedding = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 16. decrement_post_comment_count (duplicate fix)
-- Already fixed above at #8

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_notification_preferences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_theme_preferences() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_post_reaction_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_post_reaction_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_post_comment_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_post_comment_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.increment_comment_like_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_comment_like_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.are_connected(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_last_message() TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_embedding(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_embedding_generation() TO authenticated;

-- ============================================================
-- Verification Query
-- ============================================================
-- Run this after migration to verify all functions have search_path set:
-- 
-- SELECT proname, proconfig 
-- FROM pg_proc 
-- WHERE pronamespace = 'public'::regnamespace 
--   AND proconfig IS NOT NULL
-- ORDER BY proname;
-- ============================================================
