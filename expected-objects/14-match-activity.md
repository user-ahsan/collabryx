# Table: `match_activity`

> Events showing who viewed your profile, who's building something you might fit, etc.

## Used By

- **Match Activity Card** (dashboard sidebar)
- **Notifications** (system-generated)

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `actor_user_id` | `uuid` | NO | — | FK → `profiles.id` (who performed the action) |
| `target_user_id` | `uuid` | NO | — | FK → `profiles.id` (who is notified) |
| `type` | `text` | NO | — | Enum: `profile_view`, `building_match`, `skill_match` |
| `activity` | `text` | NO | — | Human-readable: "viewed your profile", "is building an MVP you may fit" |
| `match_percentage` | `integer` | YES | `null` | Match % if relevant |
| `is_read` | `boolean` | NO | `false` | |
| `created_at` | `timestamptz` | NO | `now()` | |

## Frontend Expectations

```ts
// Fetches:
supabase.from("match_activity")
  .select("*")
  .eq("target_user_id", user.id)
  .order("created_at", { ascending: false })
  .limit(5)

// Displays:
// [Avatar] Emily Zhang viewed your profile — 84% match
// [Avatar] David Chen is building an MVP you may fit — 87% match
```
