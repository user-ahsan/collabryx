# Table: `user_projects`

> Portfolio projects displayed on profile. Privacy-controlled.

## Used By

- **Profile Tabs → Projects** tab (own profile shows "Add Project", others show locked state)

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `profiles.id` |
| `title` | `text` | NO | — | Project name |
| `description` | `text` | YES | `null` | |
| `url` | `text` | YES | `null` | Live link or repo |
| `image_url` | `text` | YES | `null` | Screenshot/thumbnail |
| `tech_stack` | `text[]` | YES | `'{}'` | Technologies used |
| `is_public` | `boolean` | NO | `true` | Visibility to non-connected users |
| `order_index` | `integer` | NO | `0` | |
| `created_at` | `timestamptz` | NO | `now()` | |

## Privacy Logic

- If `is_public = false` AND viewer is NOT connected → show "Projects are private" state.
- Owner always sees all projects + "Add Project" CTA.
