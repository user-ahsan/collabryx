# Table: `user_interests`

> Industries and domains the user cares about. Used for matching.

## Used By

- **Match Suggestions** → reason badges (`interest` type)
- **Why Match Modal** → "Shared Interests" breakdown
- **Onboarding** → goals step

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `profiles.id` |
| `interest` | `text` | NO | — | e.g. "Fintech", "EdTech", "Web3" |
| `created_at` | `timestamptz` | NO | `now()` | |

## Indexes

- `(user_id)` — profile lookup
- `(interest)` — match query
