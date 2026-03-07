# Table: `comment_likes`

> Likes on comments. One per user per comment.

## Used By

- **Comment Section** → like button + count

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `comment_id` | `uuid` | NO | — | FK → `comments.id` ON DELETE CASCADE |
| `user_id` | `uuid` | NO | — | FK → `profiles.id` |
| `created_at` | `timestamptz` | NO | `now()` | |

## Constraints

- `UNIQUE (comment_id, user_id)`
