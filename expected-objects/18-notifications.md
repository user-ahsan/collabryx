# Table: `notifications`

> In-app notification feed.

## Used By

- **Notifications Dialog** → bell icon dropdown
- **Notification badge count** (sidebar)

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `profiles.id` (recipient) |
| `type` | `text` | NO | — | Enum: `connect`, `message`, `like`, `comment`, `system`, `match` |
| `actor_id` | `uuid` | YES | `null` | FK → `profiles.id` (who triggered it, null for system) |
| `actor_name` | `text` | YES | `null` | Denormalized for perf |
| `actor_avatar` | `text` | YES | `null` | Denormalized |
| `content` | `text` | NO | — | e.g. "sent you a connection request." |
| `resource_type` | `text` | YES | `null` | What it links to: `post`, `profile`, `conversation`, `match` |
| `resource_id` | `uuid` | YES | `null` | ID of the linked resource |
| `is_read` | `boolean` | NO | `false` | |
| `is_actioned` | `boolean` | NO | `false` | For actionable notifications (accept/ignore) |
| `created_at` | `timestamptz` | NO | `now()` | |

## Notification Types & UI

| `type` | Icon | Color | Has Actions? |
|--------|------|-------|--------------|
| `connect` | UserPlus | Blue | Yes (Accept / Ignore) |
| `message` | MessageSquare | Green | No (link to chat) |
| `like` | Heart | Red | No |
| `comment` | MessageSquare | Green | No |
| `system` | Bell | Yellow | No |
| `match` | Sparkles | Purple | No |

## Frontend Expectations

```ts
// Unread indicator: left blue border
// Read: muted background
// "Mark all read" button sets is_read = true for all
```
