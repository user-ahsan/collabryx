-- ============================================================================
-- MIGRATION: Add optimistic locking to posts table
-- Purpose: Fix race condition in concurrent post updates (P0-07)
-- Date: 2026-03-20
-- ============================================================================

-- Add version column for optimistic locking
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Create index on version for faster conflict detection
CREATE INDEX IF NOT EXISTS idx_posts_version ON public.posts(id, version);

-- ============================================================================
-- RPC FUNCTION: Atomic counter increment
-- Prevents race conditions when updating reaction_count, comment_count, share_count
-- ============================================================================

CREATE OR REPLACE FUNCTION public.increment_post_counter(
  post_id UUID,
  counter_field TEXT,
  increment_by INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
  current_value INTEGER;
  new_value INTEGER;
BEGIN
  -- Lock the row and increment atomically
  UPDATE public.posts
  SET 
    reaction_count = CASE 
      WHEN counter_field = 'reaction_count' THEN reaction_count + increment_by 
      ELSE reaction_count 
    END,
    comment_count = CASE 
      WHEN counter_field = 'comment_count' THEN comment_count + increment_by 
      ELSE comment_count 
    END,
    share_count = CASE 
      WHEN counter_field = 'share_count' THEN share_count + increment_by 
      ELSE share_count 
    END,
    version = version + 1,
    updated_at = NOW()
  WHERE id = post_id
  RETURNING 
    CASE 
      WHEN counter_field = 'reaction_count' THEN reaction_count
      WHEN counter_field = 'comment_count' THEN comment_count
      WHEN counter_field = 'share_count' THEN share_count
    END INTO current_value;
  
  IF current_value IS NULL THEN
    RAISE EXCEPTION 'Post not found: %', post_id;
  END IF;
  
  RETURN current_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.increment_post_counter(UUID, TEXT, INTEGER) TO authenticated;

-- ============================================================================
-- RPC FUNCTION: Get counter with row lock (for read-modify-write operations)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_post_counter_with_lock(
  post_id UUID,
  counter_field TEXT
)
RETURNS INTEGER AS $$
DECLARE
  counter_value INTEGER;
BEGIN
  -- Lock the row for update
  SELECT 
    CASE 
      WHEN counter_field = 'reaction_count' THEN reaction_count
      WHEN counter_field = 'comment_count' THEN comment_count
      WHEN counter_field = 'share_count' THEN share_count
    END INTO counter_value
  FROM public.posts
  WHERE id = post_id
  FOR UPDATE;
  
  RETURN counter_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_post_counter_with_lock(UUID, TEXT) TO authenticated;

-- ============================================================================
-- TRIGGER: Auto-increment version on update
-- This ensures version is always incremented, even if not explicitly set
-- ============================================================================

CREATE OR REPLACE FUNCTION public.posts_bump_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only bump version if it wasn't already incremented (e.g., by explicit update)
  IF NEW.version = OLD.version THEN
    NEW.version = OLD.version + 1;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS posts_bump_version_trigger ON public.posts;
CREATE TRIGGER posts_bump_version_trigger
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.posts_bump_version();

-- ============================================================================
-- Update existing posts to have version = 1
-- ============================================================================

UPDATE public.posts SET version = 1 WHERE version IS NULL;

-- ============================================================================
-- COMMENT: Usage in application code
-- ============================================================================
-- 
-- 1. For post updates:
--    const { data, error, conflict } = await updatePostWithLock(postId, {
--      content: 'New content',
--      version: currentVersion
--    });
--    if (conflict) { /* Handle conflict - refetch and retry */ }
--
-- 2. For counter updates (reactions, comments, shares):
--    const { error } = await incrementPostCounter(postId, 'reaction_count', 1);
--    // Or use updatePostCounterWithLock for more control
--
-- ============================================================================
