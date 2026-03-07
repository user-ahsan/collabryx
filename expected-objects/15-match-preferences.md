# Table: `match_preferences`

> User's matching criteria. Used by AI matching engine + filter UI.

## Used By

- **Update Preferences Dialog** (matches page)
- **Match Filters** bar (role, availability dropdowns)
- **Match Context Header** → displays current search criteria
- **AI Matching Engine** → input for score calculation

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `profiles.id`, UNIQUE |
| `preferred_role` | `text` | YES | `null` | e.g. "CTO", "Co-Founder", "Developer", "Designer", "Product Manager" |
| `preferred_industry` | `text` | YES | `null` | e.g. "Fintech", "EdTech" |
| `preferred_type` | `text` | YES | `null` | Enum: `Startup`, `Scale-up`, `Enterprise`, `Consultancy`, `Project` |
| `preferred_availability` | `text` | YES | `null` | Enum: `fulltime`, `parttime`, `hackathon` |
| `min_match_score` | `integer` | YES | `0` | Minimum match % threshold |
| `updated_at` | `timestamptz` | NO | `now()` | |

## Frontend Expectations

```ts
// Update Preferences Dialog saves:
{ role, industry, type }

// Match Filters bar uses:
// Role dropdown: All Roles, Developer, Designer, Product Manager, Founder
// Availability dropdown: Any, Full-time, Part-time, Hackathon

// Match Context Header shows:
// "Finding a CTO for your Fintech / Startup"
```
