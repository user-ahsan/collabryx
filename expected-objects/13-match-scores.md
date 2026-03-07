# Table: `match_scores`

> Detailed breakdown of WHY two users match. Powers the "Why Match" modal.

## Used By

- **Why Match Modal** → skills overlap %, complementary fit %, shared interests %
- **AI Explanation** block

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `suggestion_id` | `uuid` | NO | — | FK → `match_suggestions.id` ON DELETE CASCADE |
| `skills_overlap` | `integer` | NO | `0` | 0–100 |
| `complementary_score` | `integer` | NO | `0` | 0–100 |
| `shared_interests` | `integer` | NO | `0` | 0–100 |
| `availability_score` | `integer` | YES | `null` | 0–100 |
| `overlapping_skills` | `text[]` | YES | `'{}'` | Skills both users share |
| `complementary_explanation` | `text` | YES | `null` | e.g. "Your project needs backend leadership..." |
| `shared_interest_tags` | `text[]` | YES | `'{}'` | e.g. ["Fintech", "Startup Stage", "MVP Building"] |
| `insights` | `jsonb` | YES | `'[]'` | Array of `{ type, text }` |
| `created_at` | `timestamptz` | NO | `now()` | |

## Insights Schema (JSONB)

```json
[
  { "type": "complementary", "text": "They fill your backend gap" },
  { "type": "shared", "text": "Both interested in Fintech" },
  { "type": "similar", "text": "Similar work schedules" }
]
```

## Frontend Expectations

```ts
// Why Match Modal displays:
// Skills Overlap:     85% + progress bar + skill badges
// Complementary Fit:  92% + progress bar + explanation text
// Shared Interests:   78% + progress bar + interest badges
// AI Confidence:      0.95 + reasoning text
```
