# Table: `conversations`

> Chat threads between two users. Created when first message is sent.

## Used By

- **Chat Sidebar** → conversation list with last message preview
- **Messages Page** (`/messages`)

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `participant_1` | `uuid` | NO | — | FK → `profiles.id` |
| `participant_2` | `uuid` | NO | — | FK → `profiles.id` |
| `last_message_text` | `text` | YES | `null` | Denormalized for sidebar preview |
| `last_message_at` | `timestamptz` | YES | `null` | For sort order |
| `unread_count_1` | `integer` | NO | `0` | Unread for participant_1 |
| `unread_count_2` | `integer` | NO | `0` | Unread for participant_2 |
| `is_archived` | `boolean` | NO | `false` | |
| `created_at` | `timestamptz` | NO | `now()` | |

## Constraints

- `UNIQUE (participant_1, participant_2)` — one conversation per pair
- Check: `participant_1 < participant_2` — canonical ordering

## Frontend Expectations

```ts
// Chat sidebar shows:
{
  id, name, avatar,
  lastMessage: "Hey! I saw your profile...",
  time: "2m ago",
  unread: 2
}
// name/avatar JOINed from profiles
// time computed from last_message_at
```
