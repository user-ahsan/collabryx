-- =====================================================
-- Realtime Broadcast Triggers
-- =====================================================
-- Purpose: pg_notify for Supabase Realtime subscriptions
-- Created: 2026-03-18
-- Task: 1.1.12 (TASKS.md)
-- =====================================================

-- =====================================================
-- Generic realtime broadcast function
-- =====================================================
CREATE OR REPLACE FUNCTION broadcast_realtime(channel_prefix text)
RETURNS trigger AS $$
DECLARE
  channel_name text;
  payload jsonb;
  user_id_val uuid;
BEGIN
  -- Determine user_id and channel based on table
  CASE TG_TABLE_NAME
    WHEN 'notifications' THEN
      user_id_val := NEW.user_id;
      channel_name := channel_prefix || ':user:' || user_id_val::text;
      payload := jsonb_build_object(
        'type', 'new_notification',
        'notification', row_to_json(NEW),
        'timestamp', now()
      );
    
    WHEN 'events' THEN
      user_id_val := NEW.actor_id;
      channel_name := channel_prefix || ':user:' || user_id_val::text;
      payload := jsonb_build_object(
        'type', 'new_event',
        'event', row_to_json(NEW),
        'timestamp', now()
      );
    
    WHEN 'match_activity' THEN
      user_id_val := NEW.target_user_id;
      channel_name := channel_prefix || ':user:' || user_id_val::text;
      payload := jsonb_build_object(
        'type', 'match_activity',
        'activity', row_to_json(NEW),
        'timestamp', now()
      );
    
    WHEN 'messages' THEN
      -- Broadcast to conversation channel
      channel_name := channel_prefix || ':conversation:' || NEW.conversation_id::text;
      payload := jsonb_build_object(
        'type', 'new_message',
        'message', row_to_json(NEW),
        'timestamp', now()
      );
    
    WHEN 'match_suggestions' THEN
      user_id_val := NEW.user_id;
      channel_name := channel_prefix || ':user:' || user_id_val::text;
      payload := jsonb_build_object(
        'type', 'new_match_suggestion',
        'suggestion', row_to_json(NEW),
        'timestamp', now()
      );
    
    ELSE
      user_id_val := NULL;
      channel_name := channel_prefix || ':unknown';
      payload := jsonb_build_object(
        'type', 'unknown_event',
        'table', TG_TABLE_NAME,
        'record', row_to_json(NEW),
        'timestamp', now()
      );
  END CASE;
  
  -- Send notification via pg_notify
  PERFORM pg_notify(channel_name, payload::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Notifications Realtime Broadcast
-- =====================================================
CREATE TRIGGER broadcast_notification_realtime
  AFTER INSERT ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_realtime('notifications');

-- =====================================================
-- Events Realtime Broadcast
-- =====================================================
CREATE TRIGGER broadcast_event_realtime
  AFTER INSERT ON events
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_realtime('events');

-- =====================================================
-- Match Activity Realtime Broadcast
-- =====================================================
CREATE TRIGGER broadcast_match_activity_realtime
  AFTER INSERT ON match_activity
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_realtime('match_activity');

-- =====================================================
-- Messages Realtime Broadcast
-- =====================================================
CREATE TRIGGER broadcast_message_realtime
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_realtime('messages');

-- =====================================================
-- Match Suggestions Realtime Broadcast
-- =====================================================
CREATE TRIGGER broadcast_match_suggestion_realtime
  AFTER INSERT ON match_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_realtime('matches');

-- =====================================================
-- Feed Scores Realtime Broadcast (for live feed updates)
-- =====================================================
CREATE OR REPLACE FUNCTION broadcast_feed_score_update()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', 'feed_score_updated',
    'post_id', NEW.post_id,
    'score', NEW.score,
    'timestamp', now()
  );
  
  PERFORM pg_notify('feed:user:' || NEW.user_id::text, payload::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER broadcast_feed_score_update_realtime
  AFTER INSERT OR UPDATE ON feed_scores
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_feed_score_update();

-- =====================================================
-- User Analytics Realtime Broadcast
-- =====================================================
CREATE OR REPLACE FUNCTION broadcast_analytics_update()
RETURNS trigger AS $$
DECLARE
  payload jsonb;
BEGIN
  payload := jsonb_build_object(
    'type', 'analytics_updated',
    'user_id', NEW.user_id,
    'profile_views', NEW.profile_views_count,
    'engagement_score', NEW.engagement_score,
    'timestamp', now()
  );
  
  PERFORM pg_notify('analytics:user:' || NEW.user_id::text, payload::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER broadcast_analytics_update_realtime
  AFTER UPDATE ON user_analytics
  FOR EACH ROW
  EXECUTE FUNCTION broadcast_analytics_update();

-- Grant permissions
GRANT EXECUTE ON FUNCTION broadcast_realtime TO service_role;
GRANT EXECUTE ON FUNCTION broadcast_feed_score_update TO service_role;
GRANT EXECUTE ON FUNCTION broadcast_analytics_update TO service_role;

-- Comments
COMMENT ON FUNCTION broadcast_realtime(text) IS 'Generic realtime broadcast function using pg_notify';
COMMENT ON FUNCTION broadcast_feed_score_update() IS 'Broadcasts feed score updates for live feed refresh';
COMMENT ON FUNCTION broadcast_analytics_update() IS 'Broadcasts user analytics updates';
