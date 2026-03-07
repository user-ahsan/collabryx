# Table: `theme_preferences`

> User's dark/light theme mode setting.

## Used By

- **Theme toggle** (sidebar/header)
- **Root layout** → applies theme class

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `profiles.id`, UNIQUE |
| `theme` | `text` | NO | `'system'` | Enum: `light`, `dark`, `system` |
| `updated_at` | `timestamptz` | NO | `now()` | |

## Notes

Currently handled client-side via `next-themes` and `localStorage`. Backend persistence is optional but recommended for cross-device sync.

## Alternative

Instead of a separate table, add a `theme` column to `profiles`:

```sql
ALTER TABLE profiles ADD COLUMN theme text NOT NULL DEFAULT 'system';
```

This is simpler if you don't need a dedicated preferences table.

## Frontend Expectations

```ts
// Reads from: localStorage → fallback to user preference → fallback to "system"
// Three states: light, dark, system (auto-detect OS preference)
```
