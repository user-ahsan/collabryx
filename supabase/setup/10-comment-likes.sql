-- ============================================================================
-- TABLE 10: comment_likes
-- ============================================================================
-- Comment likes
-- Created: 2026-03-14

CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);

-- RLS
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view comment likes" ON public.comment_likes;
CREATE POLICY "Users can view comment likes" ON public.comment_likes
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.comments c JOIN public.posts p ON c.post_id = p.id WHERE c.id = comment_likes.comment_id AND p.is_archived = FALSE));

DROP POLICY IF EXISTS "Users can create comment likes" ON public.comment_likes;
CREATE POLICY "Users can create comment likes" ON public.comment_likes FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comment likes" ON public.comment_likes;
CREATE POLICY "Users can delete own comment likes" ON public.comment_likes FOR DELETE USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
