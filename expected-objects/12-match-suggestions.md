# Table: `match_suggestions`

> AI-generated match recommendations. Refreshed periodically by backend/edge function.

## Used By

- **Suggestions Sidebar** → top 5 matches on dashboard
- **Smart Matches Page** (`/matches`) → full grid/list view
- **Match Card** → individual match display
- **Why Match Modal** → detailed breakdown

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `profiles.id` (the user receiving suggestions) |
| `matched_user_id` | `uuid` | NO | — | FK → `profiles.id` (the suggested match) |
| `match_percentage` | `integer` | NO | — | 0–100 overall score |
| `reasons` | `jsonb` | NO | `'[]'` | Array of `{ type, label }` |
| `ai_confidence` | `real` | YES | `null` | 0.0–1.0 model confidence |
| `ai_explanation` | `text` | YES | `null` | Human-readable match reasoning |
| `status` | `text` | NO | `'active'` | Enum: `active`, `dismissed`, `connected` |
| `created_at` | `timestamptz` | NO | `now()` | |
| `expires_at` | `timestamptz` | YES | `null` | Auto-expire stale suggestions |

## Reason Schema (JSONB)

```json
[
  { "type": "skill", "label": "Complementary Skills" },
  { "type": "interest", "label": "Shared Interest: Startups" },
  { "type": "availability", "label": "Similar Availability" }
]
```

Valid `type` values: `skill`, `interest`, `availability`

## Frontend Expectations

```ts
// Sidebar fetches:
supabase.from("match_suggestions")
  .select("*")
  .eq("user_id", user.id)
  .order("match_percentage", { ascending: false })
  .limit(5)

// Maps to:
{ id, name, role, avatar, initials, matchPercentage, reasons[] }
// name/role/avatar JOINed from profiles via matched_user_id
```

## Indexes

- `(user_id, match_percentage DESC)` — sidebar query
- `(matched_user_id)` — reverse lookup
