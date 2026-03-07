# Table: `ai_mentor_sessions`

> Conversation sessions with the AI Mentor feature.

## Used By

- **AI Mentor/Assistant Page** (`/assistant`)
- **Chat List** sidebar in assistant
- **AI Output Workspace** → save generated content to profile

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `profiles.id` |
| `title` | `text` | YES | `null` | Auto-generated from first message |
| `status` | `text` | NO | `'active'` | Enum: `active`, `archived` |
| `created_at` | `timestamptz` | NO | `now()` | |
| `updated_at` | `timestamptz` | NO | `now()` | |

## Frontend Expectations

```ts
// Chat list shows session titles
// New session created when user starts fresh conversation
```
