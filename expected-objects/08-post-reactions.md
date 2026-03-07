# Table: `post_reactions`

> Emoji reactions on posts. Each user can have one reaction per post.

## Used By

- **Post Actions** → like button + emoji picker
- **Post reaction count** display

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `post_id` | `uuid` | NO | — | FK → `posts.id` ON DELETE CASCADE |
| `user_id` | `uuid` | NO | — | FK → `profiles.id` |
| `emoji` | `text` | NO | — | e.g. "👍", "❤️", "🔥" |
| `created_at` | `timestamptz` | NO | `now()` | |

## Constraints

- `UNIQUE (post_id, user_id)` — one reaction per user per post

## Frontend Expectations

```ts
// Default like = "👍"
// Emoji picker options: 😀 😂 ❤️ 👍 🔥 ✨ 🎉 🚀 🤔 👏 👀 💯
// On re-click same emoji → removes reaction (toggle)
```
