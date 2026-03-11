-- Table: post_attachments
-- Media files (images, videos) attached to posts.

-- Create the post_attachments table
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

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_post_attachments_post_id ON public.post_attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_attachments_order_idx ON public.post_attachments(order_index);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_attachments;

-- Row Level Security
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view attachments of public posts
CREATE POLICY "Users can view post attachments" ON public.post_attachments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = post_attachments.post_id
            AND p.is_archived = FALSE
        )
    );

-- Policy: Users can create attachments for their own posts
CREATE POLICY "Users can create post attachments" ON public.post_attachments
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = post_attachments.post_id
            AND p.author_id = auth.uid()
        )
    );

-- Policy: Users can delete attachments for their own posts
CREATE POLICY "Users can delete post attachments" ON public.post_attachments
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.posts p
            WHERE p.id = post_attachments.post_id
            AND p.author_id = auth.uid()
        )
    );

-- Storage Bucket for post media
-- Note: This creates a public bucket for post media
-- Run in Supabase SQL editor or via CLI:
/*
insert into storage.buckets (id, name, public)
values ('post-media', 'post-media', true);

-- Public read access
create policy "Public read access to post-media"
on storage.objects for select
using (bucket_id = 'post-media');

-- Authenticated users can upload to their own posts
create policy "Authenticated upload to post-media"
on storage.objects for insert
with check (
    bucket_id = 'post-media' AND
    auth.role() = 'authenticated'
);
*/
