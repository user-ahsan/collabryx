-- Table: comment_likes
-- Likes on comments. One per user per comment.

-- Create the comment_likes table
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.comment_likes(comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;

-- Row Level Security
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view likes on public comments
CREATE POLICY "Users can view comment likes" ON public.comment_likes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.comments c
            JOIN public.posts p ON c.post_id = p.id
            WHERE c.id = comment_likes.comment_id
            AND p.is_archived = FALSE
        )
    );

-- Policy: Users can create their own likes
CREATE POLICY "Users can create comment likes" ON public.comment_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete only their own likes
CREATE POLICY "Users can delete own comment likes" ON public.comment_likes
    FOR DELETE USING (auth.uid() = user_id);
