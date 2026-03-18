-- =====================================================
-- Events Table
-- =====================================================
-- Purpose: Central event store for analytics and event processing
-- Created: 2026-03-18
-- Task: 1.1.3 (TASKS.md)
-- =====================================================

-- Create events table
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identification
  event_type text NOT NULL,
  event_category text GENERATED ALWAYS AS (
    CASE 
      WHEN event_type LIKE 'post_%' THEN 'content'
      WHEN event_type LIKE 'connection_%' THEN 'network'
      WHEN event_type LIKE 'message_%' THEN 'communication'
      WHEN event_type LIKE 'match_%' THEN 'matching'
      WHEN event_type LIKE 'profile_%' THEN 'profile'
      WHEN event_type LIKE 'notification_%' THEN 'notification'
      ELSE 'other'
    END
  ) STORED,
  
  -- Event actors
  actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  target_id uuid,
  target_type text,
  
  -- Event context
  metadata jsonb DEFAULT '{}',
  session_id uuid,
  ip_address inet,
  user_agent text,
  
  -- Timestamps
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_events_actor_id ON events(actor_id);
CREATE INDEX IF NOT EXISTS idx_events_actor_created ON events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_event_type_created ON events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_target ON events(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(event_category);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON events(session_id);

-- GIN index for metadata JSONB queries
CREATE INDEX IF NOT EXISTS idx_events_metadata_gin ON events USING GIN (metadata);

-- Composite index for time-range queries
CREATE INDEX IF NOT EXISTS idx_events_time_range ON events(created_at DESC, event_type);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE events;

-- RLS Policies
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own events
CREATE POLICY "Users can view own events"
  ON events
  FOR SELECT
  USING (actor_id = auth.uid());

-- Policy: Service role can manage all events
CREATE POLICY "Service role can manage events"
  ON events
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Function to cleanup old events (keep 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_events(retention_days integer DEFAULT 90)
RETURNS void AS $$
BEGIN
  DELETE FROM events
  WHERE created_at < now() - (retention_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT ON events TO authenticated;
GRANT ALL ON events TO service_role;

-- Comments
COMMENT ON TABLE events IS 'Central event store for all user actions and system events';
COMMENT ON COLUMN events.event_type IS 'Specific event type (e.g., post_created, profile_viewed)';
COMMENT ON COLUMN events.event_category IS 'Auto-categorized event group (content, network, communication, etc.)';
COMMENT ON COLUMN events.actor_id IS 'User who performed the action';
COMMENT ON COLUMN events.target_id IS 'ID of the target object (post_id, user_id, etc.)';
COMMENT ON COLUMN events.target_type IS 'Type of target object (post, profile, conversation, etc.)';
COMMENT ON COLUMN events.metadata IS 'Additional event-specific data in JSON format';
COMMENT ON COLUMN events.session_id IS 'User session identifier for tracking';
