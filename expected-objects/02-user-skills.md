# Table: `user_skills`

> Skills attached to a user profile. Used for matching and profile display.

## Used By

- **Profile Header** → skills badges (React, TypeScript, Node.js, etc.)
- **Match Card** → skills list on match cards
- **Why Match Modal** → skills overlap calculation
- **Semantic Search** → vector embedding input
- **Onboarding** → step-skills selection

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `profiles.id` |
| `skill_name` | `text` | NO | — | e.g. "React", "Python", "Figma" |
| `proficiency` | `text` | YES | `null` | Enum: `beginner`, `intermediate`, `advanced`, `expert` |
| `is_primary` | `boolean` | NO | `false` | Top skills shown first |
| `created_at` | `timestamptz` | NO | `now()` | |

## Indexes

- `(user_id)` — for fast profile lookups
- `(skill_name)` — for match queries

## Frontend Expectations

```ts
// Profile displays as Badge array:
["React", "TypeScript", "Node.js", "AWS"]

// Match card shows first 4 + overflow:
match.skills.slice(0, 4) // displayed
match.skills.length > 4  // shows "+N"
```
