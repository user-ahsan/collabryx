# Table: `connections`

> Bidirectional connection requests between users (like LinkedIn "connect").

## Used By

- **Profile Header** → Connect button states (none/pending/connected)
- **Notifications** → "sent you a connection request" with Accept/Ignore
- **Dashboard** → requests page
- **Messages** → only connected users can message (optional gate)

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `requester_id` | `uuid` | NO | — | FK → `profiles.id` (who sent it) |
| `receiver_id` | `uuid` | NO | — | FK → `profiles.id` (who received it) |
| `status` | `text` | NO | `'pending'` | Enum: `pending`, `accepted`, `declined`, `blocked` |
| `message` | `text` | YES | `null` | Optional intro message |
| `created_at` | `timestamptz` | NO | `now()` | When request was sent |
| `updated_at` | `timestamptz` | NO | `now()` | When status changed |

## Constraints

- `UNIQUE (requester_id, receiver_id)` — no duplicate requests
- Check: `requester_id != receiver_id`

## Frontend Expectations

```ts
// Profile header checks connection status:
// status === 'none'     → Show "Connect" button
// status === 'pending'  → Show "Request Sent" (disabled)
// status === 'accepted' → Show "Connected" (disabled)

// Notification shows Accept/Ignore for pending requests
```

## Query Patterns

```sql
-- Check if two users are connected:
SELECT * FROM connections
WHERE (requester_id = :user1 AND receiver_id = :user2)
   OR (requester_id = :user2 AND receiver_id = :user1)
   AND status = 'accepted';

-- Pending requests for me:
SELECT * FROM connections
WHERE receiver_id = :me AND status = 'pending';
```
