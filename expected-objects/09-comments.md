# Table: `comments`

> Comments under feed posts.

## Used By

- **Comment Section** (collapsible under each post)

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `post_id` | `uuid` | NO | — | FK → `posts.id` ON DELETE CASCADE |
| `author_id` | `uuid` | NO | — | FK → `profiles.id` |
| `content` | `text` | NO | — | Comment text |
| `parent_id` | `uuid` | YES | `null` | FK → `comments.id` for nested replies |
| `like_count` | `integer` | NO | `0` | Denormalized |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

## Frontend Expectations

```ts
// Displays as:
{
  id, author: { name, avatar, initials },
  content, timestamp: "1h ago",
  likes: 4, liked: boolean
}
```
