-- ============================================================================
-- MIGRATION: Add read_at column to messages table
-- ============================================================================
-- Add read_at timestamp for read receipts
-- Created: 2026-03-19 (Phase 3 Task 6)

-- Add read_at column
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Add index for read_at queries
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at) WHERE is_read = true;

-- Update existing read messages to have read_at = created_at
UPDATE public.messages 
SET read_at = created_at 
WHERE is_read = true AND read_at IS NULL;
