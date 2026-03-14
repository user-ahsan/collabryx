-- ============================================================================
-- TABLE 8: post_reactions
-- ============================================================================
-- Emoji reactions on posts
-- Created: 2026-03-14

CREATE TABLE IF NOT EXISTS public.post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON public.post_reactions(post_id);

-- RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view post reactions" ON public.post_reactions;
CREATE POLICY "Users can view post reactions" ON public.post_reactions
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_reactions.post_id AND p.is_archived = FALSE));

DROP POLICY IF EXISTS "Users can create post reactions" ON public.post_reactions;
CREATE POLICY "Users can create post reactions" ON public.post_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own post reactions" ON public.post_reactions;
CREATE POLICY "Users can delete own post reactions" ON public.post_reactions FOR DELETE USING (auth.uid() = user_id);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
