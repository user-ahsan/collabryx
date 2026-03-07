# Table: `notification_preferences`

> Email/push notification toggles per user.

## Used By

- **Settings Dialog → Notifications** tab

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `user_id` | `uuid` | NO | — | FK → `profiles.id`, UNIQUE |
| `email_new_connections` | `boolean` | NO | `true` | Email on new connection requests |
| `email_messages` | `boolean` | NO | `true` | Email on new messages |
| `ai_smart_match_alerts` | `boolean` | NO | `false` | Weekly AI match digest |
| `email_post_likes` | `boolean` | NO | `false` | Email when someone reacts to your post |
| `email_comments` | `boolean` | NO | `true` | Email on new comments on your posts |
| `push_enabled` | `boolean` | NO | `true` | Browser push notifications |
| `updated_at` | `timestamptz` | NO | `now()` | |

## Notes

Currently the frontend stores these on the `profiles` table directly:
- `email_new_connections`
- `email_messages`
- `ai_smart_match_alerts`

**Recommendation:** Migrate these to a separate `notification_preferences` table for cleaner separation. Alternatively, keep them on `profiles` if you want fewer tables.

## Frontend Expectations

```ts
// Settings Dialog reads + writes:
// Switch toggles auto-save on change
{
  email_new_connections: boolean,
  email_messages: boolean,
  ai_smart_match_alerts: boolean
}
```
