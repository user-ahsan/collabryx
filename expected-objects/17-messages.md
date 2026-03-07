# Table: `messages`

> Individual messages within a conversation.

## Used By

- **Chat Window** → message bubbles
- **Message Input** → sends new messages
- **Real-time subscription** via Supabase Realtime

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `conversation_id` | `uuid` | NO | — | FK → `conversations.id` ON DELETE CASCADE |
| `sender_id` | `uuid` | NO | — | FK → `profiles.id` |
| `text` | `text` | NO | — | Message content |
| `is_read` | `boolean` | NO | `false` | |
| `attachment_url` | `text` | YES | `null` | File/image attachment |
| `attachment_type` | `text` | YES | `null` | Enum: `image`, `file` |
| `created_at` | `timestamptz` | NO | `now()` | |

## Frontend Expectations

```ts
// Chat window displays:
{
  id, senderId: "me" | "them",
  text, time: "10:30 AM"
}
// senderId mapped by comparing sender_id to current user
// time formatted from created_at

// Chat header shows: name, avatar, "Online" status
// Actions: Voice call, Video call, More options (future)
```

## Real-time

```ts
// Subscribe to new messages:
supabase.channel('messages')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `conversation_id=eq.${conversationId}`
  }, callback)
  .subscribe()
```
