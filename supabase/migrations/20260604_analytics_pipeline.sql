/**
 * Migration: Analytics Pipeline Engine
 *
 * Complete event-driven analytics processing system.
 * 
 * Architecture:
 *   Source Tables (posts, comments, etc.)
 *     → SQL Triggers insert into `events` table (EXISTING)
 *     → New trigger on `events` fires process_event_to_analytics()
 *     → user_analytics counters updated atomically
 *     → engagement_score & influence_score recalculated
 *     → activity_streak updated based on last_active
 *
 * New Components:
 *   1. calculate_engagement_score()   — Pure scoring function (IMMUTABLE)
 *   2. calculate_influence_score()    — Pure scoring function (IMMUTABLE)
 *   3. process_event_to_analytics()   — Trigger function mapping events → counters
 *   4. trigger_on_events_insert       — Fires AFTER INSERT on events
 *   5. capture_match_created_event    — New trigger on match_suggestions INSERT
 *   6. capture_match_accepted_event   — New trigger on match_suggestions UPDATE
 *   7. capture_conversation_event     — New trigger on conversations INSERT
 *   8. record_heartbeat()             — RPC for session tracking
 *   9. backfill_user_analytics()      — One-time recovery function
 */

-- ============================================
-- 1. SCORING FUNCTIONS
-- ============================================

/**
 * Calculate engagement score (0-100)
 * Matches the TypeScript version in lib/services/analytics.ts
 */
CREATE OR REPLACE FUNCTION public.calculate_engagement_score(
  p_profile_views INTEGER DEFAULT 0,
  p_matches_accepted INTEGER DEFAULT 0,
  p_connections INTEGER DEFAULT 0,
  p_reactions_received INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
BEGIN
  RETURN LEAST(
    ROUND(
      -- Profile visibility (25%)
      LEAST(p_profile_views::REAL / 10.0, 1.0) * 25.0 +
      -- Match activity (25%)
      LEAST(p_matches_accepted::REAL / 5.0, 1.0) * 25.0 +
      -- Connection activity (25%)
      LEAST(p_connections::REAL / 10.0, 1.0) * 25.0 +
      -- Content engagement (25%)
      LEAST(p_reactions_received::REAL / 20.0, 1.0) * 25.0
    ),
    100
  )::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_engagement_score IS 
  'Computes 0-100 engagement score from 4 weighted dimensions';

/**
 * Calculate influence score (0-100)
 * New formula based on network & activity data:
 *   - Visibility (25%): profile views
 *   - Network size (25%): connections
 *   - Content creation (15%): posts created
 *   - Content impact (15%): reactions received
 *   - Match success (20%): matches accepted
 */
CREATE OR REPLACE FUNCTION public.calculate_influence_score(
  p_profile_views INTEGER DEFAULT 0,
  p_connections INTEGER DEFAULT 0,
  p_posts_created INTEGER DEFAULT 0,
  p_reactions_received INTEGER DEFAULT 0,
  p_matches_accepted INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
BEGIN
  RETURN LEAST(
    ROUND(
      -- Visibility (25%)
      LEAST(p_profile_views::REAL / 200.0, 1.0) * 25.0 +
      -- Network size (25%)
      LEAST(p_connections::REAL / 100.0, 1.0) * 25.0 +
      -- Content creation (15%)
      LEAST(p_posts_created::REAL / 50.0, 1.0) * 15.0 +
      -- Content impact (15%)
      LEAST(p_reactions_received::REAL / 200.0, 1.0) * 15.0 +
      -- Match success (20%)
      LEAST(p_matches_accepted::REAL / 20.0, 1.0) * 20.0
    ),
    100
  )::INTEGER;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION public.calculate_influence_score IS 
  'Computes 0-100 influence score from 5 weighted dimensions';

/**
 * Calculate match acceptance rate (0-100%)
 */
CREATE OR REPLACE FUNCTION public.calculate_match_acceptance_rate(
  p_accepted INTEGER DEFAULT 0,
  p_total INTEGER DEFAULT 0
) RETURNS REAL AS $$
BEGIN
  IF p_total <= 0 THEN RETURN 0; END IF;
  RETURN ROUND((p_accepted::REAL / p_total::REAL * 100.0)::NUMERIC, 1)::REAL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 2. ACTIVITY STREAK TRACKING
-- ============================================

/**
 * Calculate activity streak based on last_active date
 * 
 * Rules:
 *   - If last_active was yesterday → streak + 1
 *   - If last_active is today → streak unchanged (already counted)
 *   - If last_active was before yesterday → streak resets to 1
 *   - If never active → streak stays 0
 */
CREATE OR REPLACE FUNCTION public.calculate_activity_streak(
  p_last_active TIMESTAMPTZ,
  p_current_streak INTEGER DEFAULT 0
) RETURNS INTEGER AS $$
DECLARE
  today DATE := CURRENT_DATE;
  last_date DATE;
BEGIN
  IF p_last_active IS NULL THEN
    RETURN 0;
  END IF;
  
  last_date := p_last_active::DATE;
  
  IF last_date = today THEN
    RETURN p_current_streak;       -- Already counted today
  ELSIF last_date = today - 1 THEN
    RETURN p_current_streak + 1;   -- Consecutive day
  ELSE
    RETURN 1;                      -- Started new streak
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- 3. EVENT → ANALYTICS PROCESSOR (THE ENGINE)
-- ============================================

/**
 * Process an event and update affected user's analytics counters.
 *
 * This is the core function that bridges the events table to user_analytics.
 * It maps each event type to:
 *   a) The user whose counters should be updated
 *   b) Which specific counters to increment
 *
 * Event-to-User Mapping:
 *
 * | Event Type          | Actor (who did it)    | Affected User (whose analytics change) |
 * |---------------------|----------------------|----------------------------------------|
 * | post_created        | Author               | Author (same) → posts_created_count++  |
 * | post_reaction       | Reactor              | Post author → post_reactions_received++|
 * | comment_created     | Commenter            | Post author → post_comments_received++ |
 * | connection_requested| Requester            | Requester → connection_requests_sent++ |
 * |                     |                      | Receiver → connection_requests_received++|
 * | connection_accepted | Accepter (receiver)  | Both → connections_count++             |
 * | message_sent        | Sender               | Sender → messages_sent_count++         |
 * |                     |                      | Recipient → messages_received_count++  |
 * | profile_viewed      | Viewer               | Profile owner → profile_views_count++  |
 * | match_created       | System/algorithm     | Receiver → match_suggestions_count++   |
 * | match_accepted      | Accepter             | Accepter → matches_accepted_count++    |
 * | profile_updated     | User                 | User (same) → (no counter, just event) |
 */
CREATE OR REPLACE FUNCTION public.process_event_to_analytics()
RETURNS TRIGGER AS $$
DECLARE
  post_author_id UUID;
  msg_recipient_id UUID;
  current_ua RECORD;
BEGIN
  -- ==================================================================
  -- CASE 1: post_created
  -- The actor IS the affected user (the post author)
  -- ==================================================================
  IF NEW.event_type = 'post_created' THEN
    -- Ensure a user_analytics row exists
    INSERT INTO public.user_analytics (user_id)
    VALUES (NEW.actor_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    UPDATE public.user_analytics
    SET
      posts_created_count = posts_created_count + 1,
      last_active = GREATEST(last_active, NEW.created_at),
      activity_streak_days = public.calculate_activity_streak(
        GREATEST(last_active, NEW.created_at), activity_streak_days
      ),
      updated_at = NOW()
    WHERE user_id = NEW.actor_id;
    
    RETURN NEW;
  END IF;

  -- ==================================================================
  -- CASE 2: post_reaction
  -- Increase reaction count for the POST AUTHOR (not the reactor)
  -- ==================================================================
  IF NEW.event_type = 'post_reaction' THEN
    SELECT p.author_id INTO post_author_id
    FROM public.posts p
    WHERE p.id = NEW.target_id;
    
    IF post_author_id IS NOT NULL THEN
      INSERT INTO public.user_analytics (user_id)
      VALUES (post_author_id)
      ON CONFLICT (user_id) DO NOTHING;
      
      -- Get current values for score recalculation
      SELECT post_reactions_received, profile_views_count, 
             matches_accepted_count, connections_count
      INTO current_ua
      FROM public.user_analytics
      WHERE user_id = post_author_id;
      
      UPDATE public.user_analytics
      SET
        post_reactions_received = post_reactions_received + 1,
        engagement_score = public.calculate_engagement_score(
          current_ua.profile_views_count,
          current_ua.matches_accepted_count,
          current_ua.connections_count,
          current_ua.post_reactions_received + 1
        ),
        influence_score = public.calculate_influence_score(
          current_ua.profile_views_count,
          current_ua.connections_count,
          current_ua.posts_created_count,
          current_ua.post_reactions_received + 1,
          current_ua.matches_accepted_count
        ),
        last_active = GREATEST(last_active, NEW.created_at),
        activity_streak_days = public.calculate_activity_streak(
          GREATEST(last_active, NEW.created_at), activity_streak_days
        ),
        updated_at = NOW()
      WHERE user_id = post_author_id;
    END IF;
    
    RETURN NEW;
  END IF;

  -- ==================================================================
  -- CASE 3: comment_created
  -- Increase comment count for the POST AUTHOR
  -- ==================================================================
  IF NEW.event_type = 'comment_created' THEN
    SELECT p.author_id INTO post_author_id
    FROM public.posts p
    WHERE p.id = NEW.target_id;
    
    IF post_author_id IS NOT NULL THEN
      INSERT INTO public.user_analytics (user_id)
      VALUES (post_author_id)
      ON CONFLICT (user_id) DO NOTHING;
      
      UPDATE public.user_analytics
      SET
        post_comments_received = post_comments_received + 1,
        last_active = GREATEST(last_active, NEW.created_at),
        activity_streak_days = public.calculate_activity_streak(
          GREATEST(last_active, NEW.created_at), activity_streak_days
        ),
        updated_at = NOW()
      WHERE user_id = post_author_id;
    END IF;
    
    RETURN NEW;
  END IF;

  -- ==================================================================
  -- CASE 4: connection_requested
  -- Requester → connection_requests_sent++
  -- Receiver → connection_requests_received++
  -- ==================================================================
  IF NEW.event_type = 'connection_requested' THEN
    -- Requester's analytics
    INSERT INTO public.user_analytics (user_id)
    VALUES (NEW.actor_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    UPDATE public.user_analytics
    SET
      connection_requests_sent = connection_requests_sent + 1,
      last_active = GREATEST(last_active, NEW.created_at),
      activity_streak_days = public.calculate_activity_streak(
        GREATEST(last_active, NEW.created_at), activity_streak_days
      ),
      updated_at = NOW()
    WHERE user_id = NEW.actor_id;
    
    -- Receiver's analytics (target_id is the receiver)
    INSERT INTO public.user_analytics (user_id)
    VALUES (NEW.target_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    UPDATE public.user_analytics
    SET
      connection_requests_received = connection_requests_received + 1,
      last_active = GREATEST(last_active, NEW.created_at),
      activity_streak_days = public.calculate_activity_streak(
        GREATEST(last_active, NEW.created_at), activity_streak_days
      ),
      updated_at = NOW()
    WHERE user_id = NEW.target_id;
    
    RETURN NEW;
  END IF;

  -- ==================================================================
  -- CASE 5: connection_accepted
  -- BOTH users get connections_count++
  -- Actor = requester, Target = receiver (who accepted)
  -- ==================================================================
  IF NEW.event_type = 'connection_accepted' THEN
    -- Requester (actor_id) gets connection count
    INSERT INTO public.user_analytics (user_id)
    VALUES (NEW.actor_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    UPDATE public.user_analytics
    SET
      connections_count = connections_count + 1,
      last_active = GREATEST(last_active, NEW.created_at),
      activity_streak_days = public.calculate_activity_streak(
        GREATEST(last_active, NEW.created_at), activity_streak_days
      ),
      updated_at = NOW()
    WHERE user_id = NEW.actor_id;
    
    -- Receiver (target_id) gets connection count
    INSERT INTO public.user_analytics (user_id)
    VALUES (NEW.target_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    UPDATE public.user_analytics
    SET
      connections_count = connections_count + 1,
      last_active = GREATEST(last_active, NEW.created_at),
      activity_streak_days = public.calculate_activity_streak(
        GREATEST(last_active, NEW.created_at), activity_streak_days
      ),
      updated_at = NOW()
    WHERE user_id = NEW.target_id;
    
    RETURN NEW;
  END IF;

  -- ==================================================================
  -- CASE 6: message_sent
  -- Sender → messages_sent_count++
  -- Recipient → messages_received_count++
  -- ==================================================================
  IF NEW.event_type = 'message_sent' THEN
    -- Sender's analytics
    INSERT INTO public.user_analytics (user_id)
    VALUES (NEW.actor_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    UPDATE public.user_analytics
    SET
      messages_sent_count = messages_sent_count + 1,
      last_active = GREATEST(last_active, NEW.created_at),
      activity_streak_days = public.calculate_activity_streak(
        GREATEST(last_active, NEW.created_at), activity_streak_days
      ),
      updated_at = NOW()
    WHERE user_id = NEW.actor_id;
    
    -- Find the recipient via participant_1/participant_2 columns
    SELECT CASE 
      WHEN c.participant_1 = NEW.actor_id THEN c.participant_2
      ELSE c.participant_1
    END INTO msg_recipient_id
    FROM public.conversations c
    WHERE c.id = NEW.target_id;
    
    IF msg_recipient_id IS NOT NULL THEN
      INSERT INTO public.user_analytics (user_id)
      VALUES (msg_recipient_id)
      ON CONFLICT (user_id) DO NOTHING;
      
      UPDATE public.user_analytics
      SET
        messages_received_count = messages_received_count + 1,
        last_active = GREATEST(last_active, NEW.created_at),
        activity_streak_days = public.calculate_activity_streak(
          GREATEST(last_active, NEW.created_at), activity_streak_days
        ),
        updated_at = NOW()
      WHERE user_id = msg_recipient_id;
    END IF;
    
    RETURN NEW;
  END IF;

  -- ==================================================================
  -- CASE 7: profile_viewed
  -- Profile owner (target_id) gets view count incremented
  -- ==================================================================
  IF NEW.event_type = 'profile_viewed' THEN
    INSERT INTO public.user_analytics (user_id)
    VALUES (NEW.target_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Get current values for score recalculation
    SELECT profile_views_count, post_reactions_received,
           matches_accepted_count, connections_count,
           posts_created_count
    INTO current_ua
    FROM public.user_analytics
    WHERE user_id = NEW.target_id;
    
    UPDATE public.user_analytics
    SET
      profile_views_count = profile_views_count + 1,
      profile_views_last_7_days = profile_views_last_7_days + 1,
      profile_views_last_30_days = profile_views_last_30_days + 1,
      engagement_score = public.calculate_engagement_score(
        current_ua.profile_views_count + 1,
        current_ua.matches_accepted_count,
        current_ua.connections_count,
        current_ua.post_reactions_received
      ),
      influence_score = public.calculate_influence_score(
        current_ua.profile_views_count + 1,
        current_ua.connections_count,
        current_ua.posts_created_count,
        current_ua.post_reactions_received,
        current_ua.matches_accepted_count
      ),
      last_active = GREATEST(last_active, NEW.created_at),
      activity_streak_days = public.calculate_activity_streak(
        GREATEST(last_active, NEW.created_at), activity_streak_days
      ),
      updated_at = NOW()
    WHERE user_id = NEW.target_id;
    
    RETURN NEW;
  END IF;

  -- ==================================================================
  -- CASE 8: match_created
  -- The target user gets match_suggestions_count++
  -- ==================================================================
  IF NEW.event_type = 'match_created' THEN
    INSERT INTO public.user_analytics (user_id)
    VALUES (NEW.target_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT match_suggestions_count, matches_accepted_count
    INTO current_ua
    FROM public.user_analytics
    WHERE user_id = NEW.target_id;
    
    UPDATE public.user_analytics
    SET
      match_suggestions_count = match_suggestions_count + 1,
      match_acceptance_rate = public.calculate_match_acceptance_rate(
        current_ua.matches_accepted_count,
        current_ua.match_suggestions_count + 1
      ),
      updated_at = NOW()
    WHERE user_id = NEW.target_id;
    
    RETURN NEW;
  END IF;

  -- ==================================================================
  -- CASE 9: match_accepted
  -- The actor (who accepted) gets matches_accepted_count++
  -- ==================================================================
  IF NEW.event_type = 'match_accepted' THEN
    INSERT INTO public.user_analytics (user_id)
    VALUES (NEW.actor_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    SELECT matches_accepted_count, match_suggestions_count,
           profile_views_count, connections_count,
           post_reactions_received, posts_created_count
    INTO current_ua
    FROM public.user_analytics
    WHERE user_id = NEW.actor_id;
    
    UPDATE public.user_analytics
    SET
      matches_accepted_count = matches_accepted_count + 1,
      match_acceptance_rate = public.calculate_match_acceptance_rate(
        current_ua.matches_accepted_count + 1,
        current_ua.match_suggestions_count
      ),
      engagement_score = public.calculate_engagement_score(
        current_ua.profile_views_count,
        current_ua.matches_accepted_count + 1,
        current_ua.connections_count,
        current_ua.post_reactions_received
      ),
      influence_score = public.calculate_influence_score(
        current_ua.profile_views_count,
        current_ua.connections_count,
        current_ua.posts_created_count,
        current_ua.post_reactions_received,
        current_ua.matches_accepted_count + 1
      ),
      updated_at = NOW()
    WHERE user_id = NEW.actor_id;
    
    RETURN NEW;
  END IF;

  -- ==================================================================
  -- CASE 10: profile_updated
  -- Just update last_active, no counter increment
  -- ==================================================================
  IF NEW.event_type = 'profile_updated' THEN
    INSERT INTO public.user_analytics (user_id)
    VALUES (NEW.actor_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    UPDATE public.user_analytics
    SET
      last_active = GREATEST(last_active, NEW.created_at),
      activity_streak_days = public.calculate_activity_streak(
        GREATEST(last_active, NEW.created_at), activity_streak_days
      ),
      updated_at = NOW()
    WHERE user_id = NEW.actor_id;
    
    RETURN NEW;
  END IF;

  -- Unknown event type — silently ignored
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.process_event_to_analytics IS 
  'Trigger function: maps events table rows to user_analytics counter updates';

-- ============================================
-- 4. TRIGGER: Process events → analytics
-- ============================================

DROP TRIGGER IF EXISTS process_event_to_analytics ON public.events;
CREATE TRIGGER process_event_to_analytics
  AFTER INSERT ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.process_event_to_analytics();

COMMENT ON TRIGGER process_event_to_analytics ON public.events IS
  'Fires on every event insert to update user_analytics counters';

-- ============================================
-- 5. NEW EVENT CAPTURE TRIGGERS
-- ============================================

-- 5a. Match created: capture when a match suggestion is generated
CREATE OR REPLACE FUNCTION public.capture_match_created_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.events (
    event_type, actor_id, target_id, target_type, metadata
  ) VALUES (
    'match_created',
    NEW.user_id,               -- The user who received the match
    NEW.matched_user_id,       -- The user they were matched with
    'profile',
    jsonb_build_object(
      'match_score', NEW.match_percentage,
      'status', NEW.status
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS capture_match_created_event ON public.match_suggestions;
CREATE TRIGGER capture_match_created_event
  AFTER INSERT ON public.match_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.capture_match_created_event();

-- 5b. Match accepted: capture when a match suggestion is accepted
CREATE OR REPLACE FUNCTION public.capture_match_accepted_event()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when status changes TO 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS DISTINCT FROM 'accepted') THEN
    INSERT INTO public.events (
      event_type, actor_id, target_id, target_type, metadata
    ) VALUES (
      'match_accepted',
      NEW.user_id,               -- The user who accepted
      NEW.matched_user_id,       -- The matched user
      'profile',
      jsonb_build_object('match_score', NEW.match_percentage)
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS capture_match_accepted_event ON public.match_suggestions;
CREATE TRIGGER capture_match_accepted_event
  AFTER UPDATE ON public.match_suggestions
  FOR EACH ROW
  WHEN (NEW.status = 'accepted' AND OLD.status IS DISTINCT FROM 'accepted')
  EXECUTE FUNCTION public.capture_match_accepted_event();

-- 5c. Conversation created: track new conversations
CREATE OR REPLACE FUNCTION public.capture_conversation_created_event()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.events (
    event_type, actor_id, target_id, target_type, metadata
  ) VALUES (
    'conversation_created',
    NEW.participant_1,        -- Who started the conversation
    NEW.id,                   -- The conversation ID
    'conversation',
    jsonb_build_object(
      'participant_1', NEW.participant_1,
      'participant_2', NEW.participant_2
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS capture_conversation_created_event ON public.conversations;
CREATE TRIGGER capture_conversation_created_event
  AFTER INSERT ON public.conversations
  FOR EACH ROW
  EXECUTE FUNCTION public.capture_conversation_created_event();

-- ============================================
-- 6. SESSION HEARTBEAT RPC
-- ============================================

/**
 * record_heartbeat()
 * 
 * Called periodically by the client-side session tracker.
 * Updates the user's last_active timestamp and manages session counters.
 * 
 * Session logic:
 *   - If last_active was > 30 minutes ago → new session (sessions_count++)
 *   - If last_active was within 30 min → same session
 *   - Always updates last_active and recalculates activity_streak
 */
CREATE OR REPLACE FUNCTION public.record_heartbeat(
  p_user_id UUID,
  p_ip_address INET DEFAULT NULL
) RETURNS VOID AS $$
DECLARE
  last_activity TIMESTAMPTZ;
  is_new_session BOOLEAN;
BEGIN
  -- Get last active time
  SELECT last_active INTO last_activity
  FROM public.user_analytics
  WHERE user_id = p_user_id;
  
  -- Determine if this is a new session (>30 min gap)
  is_new_session := (
    last_activity IS NULL 
    OR (NOW() - last_activity) > INTERVAL '30 minutes'
  );
  
  -- Upsert user_analytics with heartbeat data
  INSERT INTO public.user_analytics (
    user_id,
    sessions_count,
    total_time_spent_minutes,
    last_active,
    last_active_ip,
    activity_streak_days,
    updated_at
  ) VALUES (
    p_user_id,
    1,                          -- Initial session count
    0,                          -- Initial time spent
    NOW(),
    p_ip_address,
    1,                          -- Initial streak
    NOW()
  )
  ON CONFLICT (user_id) DO UPDATE
  SET
    sessions_count = CASE 
      WHEN is_new_session THEN user_analytics.sessions_count + 1 
      ELSE user_analytics.sessions_count 
    END,
    total_time_spent_minutes = CASE
      WHEN is_new_session THEN user_analytics.total_time_spent_minutes
      ELSE user_analytics.total_time_spent_minutes + 1  -- ~1 min per heartbeat
    END,
    last_active = NOW(),
    last_active_ip = COALESCE(p_ip_address, user_analytics.last_active_ip),
    activity_streak_days = public.calculate_activity_streak(
      NOW(), user_analytics.activity_streak_days
    ),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.record_heartbeat(UUID, INET) TO authenticated;

COMMENT ON FUNCTION public.record_heartbeat IS 
  'Updates last_active, manages session counters, recalculates streak';

-- ============================================
-- 7. BACKFILL FUNCTION
-- ============================================

/**
 * backfill_user_analytics()
 * 
 * One-time recovery function to populate user_analytics for all users
 * who have activity data but no analytics row, or to recalculate
 * engagement/influence scores from existing data.
 *
 * Usage: SELECT public.backfill_user_analytics();
 */
CREATE OR REPLACE FUNCTION public.backfill_user_analytics()
RETURNS TABLE(backfilled_user_id UUID, fields_updated TEXT) AS $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT DISTINCT p.id AS pid
    FROM public.profiles p
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_analytics ua WHERE ua.user_id = p.id
    )
    LIMIT 1000
  LOOP
    -- Insert default analytics row
    INSERT INTO public.user_analytics (user_id)
    VALUES (r.pid)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- Count existing events and update counters
    UPDATE public.user_analytics ua
    SET
      posts_created_count = COALESCE((
        SELECT COUNT(*) FROM public.events e 
        WHERE e.event_type = 'post_created' AND e.actor_id = ua.user_id
      ), 0),
      post_reactions_received = COALESCE((
        SELECT COUNT(*) FROM public.events e 
        WHERE e.event_type = 'post_reaction' 
          AND e.target_id IN (SELECT id FROM public.posts WHERE author_id = ua.user_id)
      ), 0),
      post_comments_received = COALESCE((
        SELECT COUNT(*) FROM public.events e 
        WHERE e.event_type = 'comment_created'
          AND e.target_id IN (SELECT id FROM public.posts WHERE author_id = ua.user_id)
      ), 0),
      connection_requests_sent = COALESCE((
        SELECT COUNT(*) FROM public.events e 
        WHERE e.event_type = 'connection_requested' AND e.actor_id = ua.user_id
      ), 0),
      connection_requests_received = COALESCE((
        SELECT COUNT(*) FROM public.events e 
        WHERE e.event_type = 'connection_requested' AND e.target_id = ua.user_id
      ), 0),
      connections_count = COALESCE((
        SELECT COUNT(*) FROM public.events e 
        WHERE e.event_type = 'connection_accepted' 
          AND (e.actor_id = ua.user_id OR e.target_id = ua.user_id)
      ), 0),
      messages_sent_count = COALESCE((
        SELECT COUNT(*) FROM public.events e 
        WHERE e.event_type = 'message_sent' AND e.actor_id = ua.user_id
      ), 0),
      messages_received_count = 0,
      profile_views_count = COALESCE((
        SELECT COUNT(*) FROM public.events e 
        WHERE e.event_type = 'profile_viewed' AND e.target_id = ua.user_id
      ), 0),
      match_suggestions_count = COALESCE((
        SELECT COUNT(*) FROM public.events e 
        WHERE e.event_type = 'match_created' AND e.target_id = ua.user_id
      ), 0),
      matches_accepted_count = COALESCE((
        SELECT COUNT(*) FROM public.events e 
        WHERE e.event_type = 'match_accepted' AND e.actor_id = ua.user_id
      ), 0),
      match_acceptance_rate = public.calculate_match_acceptance_rate(
        COALESCE((SELECT COUNT(*) FROM public.events e 
          WHERE e.event_type = 'match_accepted' AND e.actor_id = ua.user_id), 0),
        COALESCE((SELECT COUNT(*) FROM public.events e 
          WHERE e.event_type = 'match_created' AND e.target_id = ua.user_id), 0)
      ),
      engagement_score = public.calculate_engagement_score(
        COALESCE((SELECT COUNT(*) FROM public.events e 
          WHERE e.event_type = 'profile_viewed' AND e.target_id = ua.user_id), 0),
        COALESCE((SELECT COUNT(*) FROM public.events e 
          WHERE e.event_type = 'match_accepted' AND e.actor_id = ua.user_id), 0),
        COALESCE((SELECT COUNT(*) FROM public.events e 
          WHERE e.event_type = 'connection_accepted' 
            AND (e.actor_id = ua.user_id OR e.target_id = ua.user_id)), 0),
        COALESCE((SELECT COUNT(*) FROM public.events e 
          WHERE e.event_type = 'post_reaction'
            AND e.target_id IN (SELECT id FROM public.posts WHERE author_id = ua.user_id)), 0)
      ),
      influence_score = public.calculate_influence_score(
        COALESCE((SELECT COUNT(*) FROM public.events e 
          WHERE e.event_type = 'profile_viewed' AND e.target_id = ua.user_id), 0),
        COALESCE((SELECT COUNT(*) FROM public.events e 
          WHERE e.event_type = 'connection_accepted' 
            AND (e.actor_id = ua.user_id OR e.target_id = ua.user_id)), 0),
        COALESCE((SELECT COUNT(*) FROM public.events e 
          WHERE e.event_type = 'post_created' AND e.actor_id = ua.user_id), 0),
        COALESCE((SELECT COUNT(*) FROM public.events e 
          WHERE e.event_type = 'post_reaction'
            AND e.target_id IN (SELECT id FROM public.posts WHERE author_id = ua.user_id)), 0),
        COALESCE((SELECT COUNT(*) FROM public.events e 
          WHERE e.event_type = 'match_accepted' AND e.actor_id = ua.user_id), 0)
      ),
      updated_at = NOW()
    WHERE ua.user_id = r.pid;
    
    backfilled_user_id := r.pid;
    fields_updated := 'all_counters_initialized';
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.backfill_user_analytics IS 
  'One-time recovery: populates user_analytics from historical events for all users';

-- ============================================
-- 8. RECALCULATE ALL SCORES FUNCTION
-- ============================================

/**
 * Recalculate all engagement and influence scores for existing users.
 * Use this after backfill or to refresh scores with updated formulas.
 * 
 * Usage: SELECT public.recalculate_all_scores();
 */
CREATE OR REPLACE FUNCTION public.recalculate_all_scores()
RETURNS TABLE(scored_user_id UUID, engagement_before INTEGER, engagement_after INTEGER, influence_before INTEGER, influence_after INTEGER) AS $$
DECLARE
  r RECORD;
  e_before INTEGER;
  i_before INTEGER;
  e_after INTEGER;
  i_after INTEGER;
BEGIN
  FOR r IN
    SELECT ua.user_id, ua.engagement_score, ua.influence_score,
           ua.profile_views_count, ua.matches_accepted_count,
           ua.connections_count, ua.post_reactions_received,
           ua.posts_created_count
    FROM public.user_analytics ua
  LOOP
    e_before := r.engagement_score;
    i_before := r.influence_score;
    
    e_after := public.calculate_engagement_score(
      r.profile_views_count, r.matches_accepted_count,
      r.connections_count, r.post_reactions_received
    );
    i_after := public.calculate_influence_score(
      r.profile_views_count, r.connections_count,
      r.posts_created_count, r.post_reactions_received,
      r.matches_accepted_count
    );
    
    UPDATE public.user_analytics
    SET
      engagement_score = e_after,
      influence_score = i_after,
      last_calculated_at = NOW(),
      updated_at = NOW()
    WHERE user_id = r.user_id;
    
    scored_user_id := r.user_id;
    engagement_before := e_before;
    engagement_after := e_after;
    influence_before := i_before;
    influence_after := i_after;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
