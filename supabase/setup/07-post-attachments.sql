-- ============================================================================
-- TABLE 7: post_attachments
-- ============================================================================
-- Media attachments for posts
-- Created: 2026-03-14

CREATE TABLE IF NOT EXISTS public.post_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_post_attachments_post_id ON public.post_attachments(post_id);

-- RLS
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view post attachments" ON public.post_attachments;
CREATE POLICY "Users can view post attachments" ON public.post_attachments
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_attachments.post_id AND p.is_archived = FALSE));

DROP POLICY IF EXISTS "Users can create post attachments" ON public.post_attachments;
CREATE POLICY "Users can create post attachments" ON public.post_attachments
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_attachments.post_id AND p.author_id = auth.uid()));

DROP POLICY IF EXISTS "Users can delete post attachments" ON public.post_attachments;
CREATE POLICY "Users can delete post attachments" ON public.post_attachments
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_attachments.post_id AND p.author_id = auth.uid()));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_attachments;
