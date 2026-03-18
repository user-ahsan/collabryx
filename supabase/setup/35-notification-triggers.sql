-- =====================================================
-- Notification Triggers
-- =====================================================
-- Purpose: Auto-create notifications for user actions
-- Created: 2026-03-18
-- Tasks: 1.1.6, 1.1.7, 1.1.8, 1.1.9, 1.1.10 (TASKS.md)
-- =====================================================

-- =====================================================
-- Task 1.1.6: Connection Request Notification
-- =====================================================
CREATE OR REPLACE FUNCTION notify_connection_request()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notifications (
    user_id, 
    type, 
    actor_id, 
    content, 
    resource_type, 
    resource_id,
    priority
  )
  VALUES (
    NEW.receiver_id,
    'connect',
    NEW.requester_id,
    'sent you a connection request',
    'profile',
    NEW.requester_id,
    'medium'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_connection_request_trigger
  AFTER INSERT ON connections
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_connection_request();

-- =====================================================
-- Task 1.1.7: Post Reaction Notification
-- =====================================================
CREATE OR REPLACE FUNCTION notify_post_reaction()
RETURNS trigger AS $$
DECLARE
  post_author uuid;
BEGIN
  -- Get the post author
  SELECT author_id INTO post_author
  FROM posts
  WHERE posts.id = NEW.post_id;
  
  -- Don't notify if user reacted to their own post
  IF post_author IS NOT NULL AND post_author != NEW.user_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      actor_id,
      content,
      resource_type,
      resource_id,
      priority
    )
    VALUES (
      post_author,
      'like',
      NEW.user_id,
      'liked your post',
      'post',
      NEW.post_id,
      'medium'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_post_reaction_trigger
  AFTER INSERT ON post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_reaction();

-- =====================================================
-- Task 1.1.8: New Comment Notification
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS trigger AS $$
DECLARE
  post_author uuid;
BEGIN
  -- Get the post author
  SELECT author_id INTO post_author
  FROM posts
  WHERE posts.id = NEW.post_id;
  
  -- Don't notify if user commented on their own post
  IF post_author IS NOT NULL AND post_author != NEW.author_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      actor_id,
      content,
      resource_type,
      resource_id,
      priority
    )
    VALUES (
      post_author,
      'comment',
      NEW.author_id,
      'commented on your post',
      'post',
      NEW.post_id,
      'medium'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_new_comment_trigger
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_comment();

-- =====================================================
-- Task 1.1.9: New Message Notification
-- =====================================================
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS trigger AS $$
DECLARE
  other_participant uuid;
BEGIN
  -- Get the other participant in the conversation
  SELECT CASE 
    WHEN conversations.participant_1 = NEW.sender_id 
    THEN conversations.participant_2
    ELSE conversations.participant_1
  END INTO other_participant
  FROM conversations
  WHERE conversations.id = NEW.conversation_id;
  
  -- Don't notify if user sent message to themselves
  IF other_participant IS NOT NULL AND other_participant != NEW.sender_id THEN
    INSERT INTO notifications (
      user_id,
      type,
      actor_id,
      content,
      resource_type,
      resource_id,
      priority
    )
    VALUES (
      other_participant,
      'message',
      NEW.sender_id,
      'sent you a message',
      'conversation',
      NEW.conversation_id,
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- =====================================================
-- Task 1.1.10: Match Suggested Notification
-- =====================================================
CREATE OR REPLACE FUNCTION notify_match_suggested()
RETURNS trigger AS $$
DECLARE
  match_percentage numeric;
  matched_user_profile record;
BEGIN
  -- Only notify for high-confidence matches (>80%)
  IF NEW.match_percentage >= 80 THEN
    -- Get matched user profile info
    SELECT display_name, headline INTO matched_user_profile
    FROM profiles
    WHERE id = NEW.matched_user_id;
    
    IF matched_user_profile.display_name IS NOT NULL THEN
      INSERT INTO notifications (
        user_id,
        type,
        actor_id,
        content,
        resource_type,
        resource_id,
        priority
      )
      VALUES (
        NEW.user_id,
        'match',
        NEW.matched_user_id,
        format('You have a %s%% match with %s!', NEW.match_percentage::text, matched_user_profile.display_name),
        'match',
        NEW.id,
        'high'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_match_suggested_trigger
  AFTER INSERT ON match_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION notify_match_suggested();

-- =====================================================
-- Additional: Connection Accepted Notification
-- =====================================================
CREATE OR REPLACE FUNCTION notify_connection_accepted()
RETURNS trigger AS $$
BEGIN
  -- Only notify when status changes to accepted
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (
      user_id,
      type,
      actor_id,
      content,
      resource_type,
      resource_id,
      priority
    )
    VALUES (
      NEW.requester_id,
      'connection_accepted',
      NEW.receiver_id,
      'accepted your connection request',
      'connection',
      NEW.id,
      'high'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER notify_connection_accepted_trigger
  AFTER UPDATE ON connections
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'accepted')
  EXECUTE FUNCTION notify_connection_accepted();

-- =====================================================
-- Additional: Profile View Notification (with rate limiting)
-- =====================================================
CREATE OR REPLACE FUNCTION notify_profile_view()
RETURNS trigger AS $$
DECLARE
  view_count integer;
BEGIN
  -- Check if view already tracked in last 24h (avoid spam)
  SELECT COUNT(*) INTO view_count
  FROM match_activity
  WHERE target_user_id = NEW.target_user_id
    AND actor_user_id = NEW.actor_user_id
    AND type = 'profile_view'
    AND created_at > now() - interval '24 hours';
  
  -- Only notify on first view in 24h period
  IF view_count = 1 THEN
    INSERT INTO notifications (
      user_id,
      type,
      actor_id,
      content,
      resource_type,
      resource_id,
      priority
    )
    VALUES (
      NEW.target_user_id,
      'profile_view',
      NEW.actor_user_id,
      'viewed your profile',
      'profile',
      NEW.actor_user_id,
      'low'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: This trigger would be created in event-capture-triggers.sql
-- as it depends on match_activity table

-- Grant permissions
GRANT EXECUTE ON FUNCTION notify_connection_request TO service_role;
GRANT EXECUTE ON FUNCTION notify_post_reaction TO service_role;
GRANT EXECUTE ON FUNCTION notify_new_comment TO service_role;
GRANT EXECUTE ON FUNCTION notify_new_message TO service_role;
GRANT EXECUTE ON FUNCTION notify_match_suggested TO service_role;
GRANT EXECUTE ON FUNCTION notify_connection_accepted TO service_role;
GRANT EXECUTE ON FUNCTION notify_profile_view TO service_role;

-- Comments
COMMENT ON FUNCTION notify_connection_request() IS 'Creates notification when connection request is sent';
COMMENT ON FUNCTION notify_post_reaction() IS 'Creates notification when post is liked';
COMMENT ON FUNCTION notify_new_comment() IS 'Creates notification when post is commented';
COMMENT ON FUNCTION notify_new_message() IS 'Creates notification when message is received';
COMMENT ON FUNCTION notify_match_suggested() IS 'Creates notification for high-confidence matches (>80%)';
COMMENT ON FUNCTION notify_connection_accepted() IS 'Creates notification when connection is accepted';
COMMENT ON FUNCTION notify_profile_view() IS 'Creates notification for profile views (rate limited)';
