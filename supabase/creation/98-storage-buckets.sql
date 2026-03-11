-- Collabryx Storage Buckets Configuration
-- All storage buckets for file uploads

-- ===========================================
-- BUCKET DEFINITIONS
-- ===========================================

-- 1. post-media bucket
-- For: Post attachments, message attachments, comment media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'post-media',
    'post-media',
    true,
    52428800, -- 50MB limit (for videos)
    ARRAY['image/*', 'video/*', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. profile-media bucket
-- For: Profile avatars and banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-media',
    'profile-media',
    true,
    10485760, -- 10MB limit
    ARRAY['image/*']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. project-media bucket
-- For: Project thumbnails and screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-media',
    'project-media',
    true,
    10485760, -- 10MB limit
    ARRAY['image/*']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ===========================================
-- STORAGE POLICIES
-- ===========================================

-- post-media policies
DROP POLICY IF EXISTS "Public read access to post-media" ON storage.objects;
CREATE POLICY "Public read access to post-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

DROP POLICY IF EXISTS "Authenticated upload to post-media" ON storage.objects;
CREATE POLICY "Authenticated upload to post-media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'post-media' AND
    auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated update own files in post-media" ON storage.objects;
CREATE POLICY "Authenticated update own files in post-media"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'post-media' AND
    auth.uid() = owner
);

DROP POLICY IF EXISTS "Authenticated delete own files in post-media" ON storage.objects;
CREATE POLICY "Authenticated delete own files in post-media"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'post-media' AND
    auth.uid() = owner
);

-- profile-media policies
DROP POLICY IF EXISTS "Public read access to profile-media" ON storage.objects;
CREATE POLICY "Public read access to profile-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-media');

DROP POLICY IF EXISTS "Authenticated upload to profile-media" ON storage.objects;
CREATE POLICY "Authenticated upload to profile-media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'profile-media' AND
    auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated update own files in profile-media" ON storage.objects;
CREATE POLICY "Authenticated update own files in profile-media"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'profile-media' AND
    auth.uid() = owner
);

DROP POLICY IF EXISTS "Authenticated delete own files in profile-media" ON storage.objects;
CREATE POLICY "Authenticated delete own files in profile-media"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'profile-media' AND
    auth.uid() = owner
);

-- project-media policies
DROP POLICY IF EXISTS "Public read access to project-media" ON storage.objects;
CREATE POLICY "Public read access to project-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-media');

DROP POLICY IF EXISTS "Authenticated upload to project-media" ON storage.objects;
CREATE POLICY "Authenticated upload to project-media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'project-media' AND
    auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated update own files in project-media" ON storage.objects;
CREATE POLICY "Authenticated update own files in project-media"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'project-media' AND
    auth.uid() = owner
);

DROP POLICY IF EXISTS "Authenticated delete own files in project-media" ON storage.objects;
CREATE POLICY "Authenticated delete own files in project-media"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'project-media' AND
    auth.uid() = owner
);

-- ===========================================
-- HELPER FUNCTIONS
-- ===========================================

-- Function to get signed URL for a file
CREATE OR REPLACE FUNCTION public.get_signed_url(bucket_name TEXT, file_path TEXT, expires_in INT)
RETURNS TEXT AS $$
BEGIN
    RETURN storage.sign_upload(bucket_name, file_path, expires_in);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ===========================================
-- BUCKET SUMMARY
-- ===========================================
-- 
-- 1. post-media
--    - Purpose: Post attachments, message media, comment media
--    - Public read: Yes
--    - Auth write: Yes
--    - Max size: 50MB
--    - Types: images, videos, PDFs
--
-- 2. profile-media
--    - Purpose: User avatars and banners
--    - Public read: Yes
--    - Auth write: Yes
--    - Max size: 10MB
--    - Types: images only
--
-- 3. project-media
--    - Purpose: Project thumbnails/screenshots
--    - Public read: Yes
--    - Auth write: Yes
--    - Max size: 10MB
--    - Types: images only
--
