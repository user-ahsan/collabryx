-- Dead letter queue for failed embedding requests
-- This table stores failed embedding generation attempts for automatic retry

CREATE TABLE IF NOT EXISTS embedding_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  semantic_text TEXT NOT NULL,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, exhausted
  last_attempt TIMESTAMPTZ,
  next_retry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_dlq_status_retry ON embedding_dead_letter_queue(status, next_retry);
CREATE INDEX IF NOT EXISTS idx_dlq_user_id ON embedding_dead_letter_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_dlq_created_at ON embedding_dead_letter_queue(created_at);

-- RLS Policies
ALTER TABLE embedding_dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage all
CREATE POLICY "service_role_manage_dlq" ON embedding_dead_letter_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own
CREATE POLICY "users_view_own_dlq" ON embedding_dead_letter_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Realtime enabled for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE embedding_dead_letter_queue;

-- Comment for documentation
COMMENT ON TABLE embedding_dead_letter_queue IS 'Dead letter queue for failed embedding generation requests with automatic retry capability';
COMMENT ON COLUMN embedding_dead_letter_queue.status IS 'pending: waiting for retry, processing: currently being retried, completed: successfully processed, exhausted: max retries reached';
