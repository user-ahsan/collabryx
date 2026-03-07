# Table: `post_attachments`

> Media files (images, videos) attached to posts.

## Used By

- **Post Content** → media display (image/video)
- **Create Post Modal** → file upload + preview
- **Media Viewer** → full-screen media modal

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `post_id` | `uuid` | NO | — | FK → `posts.id` ON DELETE CASCADE |
| `file_url` | `text` | NO | — | Supabase Storage URL |
| `file_type` | `text` | NO | — | Enum: `image`, `video` |
| `file_name` | `text` | YES | `null` | Original filename |
| `file_size` | `integer` | YES | `null` | Bytes |
| `mime_type` | `text` | YES | `null` | e.g. `image/png`, `video/mp4` |
| `width` | `integer` | YES | `null` | Image/video width |
| `height` | `integer` | YES | `null` | Image/video height |
| `order_index` | `integer` | NO | `0` | Display order |
| `created_at` | `timestamptz` | NO | `now()` | |

## Frontend Expectations

```ts
// Create post sends FormData with media files
// Feed maps first attachment to:
{ media_url: file_url, media_type: file_type }

// Multiple attachments carousel (future)
```

## Storage Bucket

Files stored in Supabase Storage bucket: `post-media`
- Public read access
- Authenticated write access
- Max file size: 10MB images, 50MB videos
