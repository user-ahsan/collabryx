-- =====================================================
-- Event Capture Triggers
-- =====================================================
-- Purpose: Capture all user actions to events table
-- Created: 2026-03-18
-- Task: 1.1.11 (TASKS.md)
-- =====================================================

-- =====================================================
-- Generic event capture function
-- =====================================================
CREATE OR REPLACE FUNCTION capture_event(event_type_param text)
RETURNS trigger AS $$
DECLARE
  target_id_val uuid;
  target_type_val text;
  metadata_val jsonb;
BEGIN
  -- Determine target based on table
  CASE TG_TABLE_NAME
    WHEN 'post_reactions' THEN
      target_id_val := NEW.post_id;
      target_type_val := 'post';
      metadata_val := jsonb_build_object(
        'reaction_type', NEW.reaction_type,
        'post_id', NEW.post_id
      );
    
    WHEN 'comments' THEN
      target_id_val := NEW.post_id;
      target_type_val := 'post';
      metadata_val := jsonb_build_object(
        'content', LEFT(NEW.content, 100),
        'post_id', NEW.post_id
      );
    
    WHEN 'connections' THEN
      target_id_val := CASE 
        WHEN NEW.requester_id = auth.uid() THEN NEW.receiver_id
        ELSE NEW.requester_id
      END;
      target_type_val := 'profile';
      metadata_val := jsonb_build_object(
        'status', NEW.status,
        'requester_id', NEW.requester_id,
        'receiver_id', NEW.receiver_id
      );
    
    WHEN 'messages' THEN
      target_id_val := NEW.conversation_id;
      target_type_val := 'conversation';
      metadata_val := jsonb_build_object(
        'conversation_id', NEW.conversation_id,
        'sender_id', NEW.sender_id,
        'content_preview', LEFT(NEW.content, 50)
      );
    
    WHEN 'match_activity' THEN
      target_id_val := NEW.target_user_id;
      target_type_val := 'profile';
      metadata_val := jsonb_build_object(
        'type', NEW.type,
        'activity', NEW.activity,
        'match_percentage', NEW.match_percentage
      );
    
    WHEN 'profile_views' THEN
      target_id_val := NEW.viewed_user_id;
      target_type_val := 'profile';
      metadata_val := jsonb_build_object(
        'viewed_user_id', NEW.viewed_user_id
      );
    
    ELSE
      target_id_val := NULL;
      target_type_val := 'unknown';
      metadata_val := '{}'::jsonb;
  END CASE;
  
  -- Insert event
  INSERT INTO events (
    event_type,
    actor_id,
    target_id,
    target_type,
    metadata
  )
  VALUES (
    event_type_param,
    COALESCE(
      NEW.user_id,
      NEW.author_id,
      NEW.actor_user_id,
      NEW.requester_id,
      NEW.sender_id
    ),
    target_id_val,
    target_type_val,
    metadata_val
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Post Reaction Event Capture
-- =====================================================
CREATE TRIGGER capture_post_reaction_event
  AFTER INSERT ON post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION capture_event('post_reaction');

-- =====================================================
-- Comment Event Capture
-- =====================================================
CREATE TRIGGER capture_comment_event
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION capture_event('comment_created');

-- =====================================================
-- Connection Event Capture
-- =====================================================
CREATE TRIGGER capture_connection_request_event
  AFTER INSERT ON connections
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION capture_event('connection_requested');

CREATE TRIGGER capture_connection_accepted_event
  AFTER UPDATE ON connections
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'accepted')
  EXECUTE FUNCTION capture_event('connection_accepted');

CREATE TRIGGER capture_connection_declined_event
  AFTER UPDATE ON connections
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'declined')
  EXECUTE FUNCTION capture_event('connection_declined');

-- =====================================================
-- Message Event Capture
-- =====================================================
CREATE TRIGGER capture_message_sent_event
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION capture_event('message_sent');

-- =====================================================
-- Match Activity Event Capture
-- =====================================================
CREATE TRIGGER capture_profile_view_event
  AFTER INSERT ON match_activity
  FOR EACH ROW
  WHEN (NEW.type = 'profile_view')
  EXECUTE FUNCTION capture_event('profile_viewed');

CREATE TRIGGER capture_match_building_event
  AFTER INSERT ON match_activity
  FOR EACH ROW
  WHEN (NEW.type = 'building_match')
  EXECUTE FUNCTION capture_event('match_building');

-- =====================================================
-- Post Creation Event Capture
-- =====================================================
CREATE OR REPLACE FUNCTION capture_post_created_event()
RETURNS trigger AS $$
BEGIN
  INSERT INTO events (
    event_type,
    actor_id,
    target_id,
    target_type,
    metadata
  )
  VALUES (
    'post_created',
    NEW.author_id,
    NEW.id,
    'post',
    jsonb_build_object(
      'post_type', NEW.post_type,
      'intent', NEW.intent,
      'has_media', NEW.media_count > 0
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER capture_post_created_event
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION capture_post_created_event();

-- =====================================================
-- Profile Update Event Capture
-- =====================================================
CREATE OR REPLACE FUNCTION capture_profile_updated_event()
RETURNS trigger AS $$
BEGIN
  INSERT INTO events (
    event_type,
    actor_id,
    target_id,
    target_type,
    metadata
  )
  VALUES (
    'profile_updated',
    NEW.id,
    NEW.id,
    'profile',
    jsonb_build_object(
      'fields_updated', array_to_json(
        ARRAY[]::text[] ||
        CASE WHEN OLD.display_name IS DISTINCT FROM NEW.display_name THEN ARRAY['display_name'] ELSE ARRAY[]::text[] END ||
        CASE WHEN OLD.headline IS DISTINCT FROM NEW.headline THEN ARRAY['headline'] ELSE ARRAY[]::text[] END ||
        CASE WHEN OLD.bio IS DISTINCT FROM NEW.bio THEN ARRAY['bio'] ELSE ARRAY[]::text[] END
      )
    )
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER capture_profile_updated_event
  AFTER UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION capture_profile_updated_event();

-- Grant permissions
GRANT EXECUTE ON FUNCTION capture_event TO service_role;
GRANT EXECUTE ON FUNCTION capture_post_created_event TO service_role;
GRANT EXECUTE ON FUNCTION capture_profile_updated_event TO service_role;

-- Comments
COMMENT ON FUNCTION capture_event(text) IS 'Generic event capture function for multiple tables';
COMMENT ON FUNCTION capture_post_created_event() IS 'Captures post creation events';
COMMENT ON FUNCTION capture_profile_updated_event() IS 'Captures profile update events with changed fields';
