# Table: `posts`

> Feed posts. Core content unit in the dashboard.

## Used By

- **Dashboard Feed** → main post list
- **Create Post Modal** → inserts new posts
- **Post Detail Page** (`/post/[id]`)

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `author_id` | `uuid` | NO | — | FK → `profiles.id` |
| `content` | `text` | NO | — | Post body text (max 2000 chars) |
| `post_type` | `text` | NO | `'general'` | Enum: `project-launch`, `teammate-request`, `announcement`, `general` |
| `intent` | `text` | YES | `null` | Post intent tag: `cofounder`, `teammate`, `mvp`, `fyp` |
| `link_url` | `text` | YES | `null` | Shared link |
| `is_pinned` | `boolean` | NO | `false` | Pinned to top |
| `is_archived` | `boolean` | NO | `false` | Soft delete |
| `reaction_count` | `integer` | NO | `0` | Denormalized count |
| `comment_count` | `integer` | NO | `0` | Denormalized count |
| `share_count` | `integer` | NO | `0` | Denormalized count |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

## Post Types → Badge Mapping

| `post_type` | Badge Label | Badge Color |
|-------------|-------------|-------------|
| `project-launch` | "Project Launch" | Purple |
| `teammate-request` | "Looking for Teammates" | Blue |
| `announcement` | "Announcement" | Orange |
| `general` | *(none)* | — |

## Feed Sorting

Posts are sorted by:
1. `post_type` priority (project-launch > teammate-request > announcement > general)
2. `created_at` descending within same priority

## Frontend Expectations

```ts
// Feed fetches:
supabase.from("posts").select("*").order("created_at", { ascending: false }).limit(20)

// Maps to:
{ id, author_name, author_role, author_avatar, content, post_type,
  media_url, media_type, link_url, time_ago }
```

## Notes

- `author_name`, `author_role`, `author_avatar` are JOINed from `profiles` or denormalized.
- `time_ago` is computed client-side from `created_at`.
