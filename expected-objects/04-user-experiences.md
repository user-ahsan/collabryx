# Table: `user_experiences`

> Work/education timeline entries on the profile.

## Used By

- **Profile Tabs → Experience** tab

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `profiles.id` |
| `title` | `text` | NO | — | e.g. "Senior Developer" |
| `company` | `text` | NO | — | e.g. "TechStart Inc." |
| `description` | `text` | YES | `null` | What they did |
| `start_date` | `date` | NO | — | |
| `end_date` | `date` | YES | `null` | `null` = present |
| `is_current` | `boolean` | NO | `false` | Badge indicator |
| `order_index` | `integer` | NO | `0` | Sort position |
| `created_at` | `timestamptz` | NO | `now()` | |

## Frontend Expectations

```ts
// Displayed as a vertical timeline:
// ● Senior Developer
//   TechStart Inc. • 2022 - Present
//   Leading the frontend team...
```
