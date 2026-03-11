# Collabryx Database Schema - SQL Files

This directory contains SQL files for the Collabryx database schema, based on the expected-objects specification.

## Files Overview

### Individual Table Files (01-22)
Each file corresponds to a markdown file in `expected-objects/` and contains:

1. **Table Creation** - Complete DDL with constraints
2. **Indexes** - Optimized for common query patterns
3. **Triggers** - For automatic `updated_at` timestamps
4. **Realtime** - Enabled via `ALTER PUBLICATION`
5. **RLS Policies** - Row Level Security for all tables

### Master File
- **99-master-all-tables.sql** - Complete schema in one file with all tables, indexes, triggers, RLS, realtime, and storage buckets

## How to Use

### Option 1: Run Individual Files (Recommended)
Execute files in order from 01 to 22 in the Supabase SQL Editor:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste each file in order
3. Execute each file

**Order:**
1. `01-profiles.sql` (depends on auth.users)
2. `02-user-skills.sql`
3. `03-user-interests.sql`
4. `04-user-experiences.sql`
5. `05-user-projects.sql`
6. `06-posts.sql`
7. `07-post-attachments.sql`
8. `08-post-reactions.sql`
9. `09-comments.sql`
10. `10-comment-likes.sql`
11. `11-connections.sql`
12. `12-match-suggestions.sql`
13. `13-match-scores.sql`
14. `14-match-activity.sql`
15. `15-match-preferences.sql`
16. `16-conversations.sql`
17. `17-messages.sql`
18. `18-notifications.sql`
19. `19-ai-mentor-sessions.sql`
20. `20-ai-mentor-messages.sql`
21. `21-notification-preferences.sql`
22. `22-theme-preferences.sql`

### Option 2: Run Master File
Execute `99-master-all-tables.sql` to set up everything at once.

## Features Included

### ✅ Row Level Security (RLS)
- All tables have RLS enabled
- Users can only access their own data
- Public read access for profiles and posts

### ✅ Realtime Enabled
- All tables are added to `supabase_realtime` publication
- Supports real-time subscriptions for:
  - Messages (chat)
  - Posts (feed updates)
  - Notifications
  - Match suggestions

### ✅ Storage Buckets
Three storage buckets are configured:
- `post-media` - Posts, messages, comments (50MB limit)
- `profile-media` - User avatars and banners (10MB limit)
- `project-media` - Project thumbnails (10MB limit)

### ✅ Helper Functions
- `get_conversation(user1, user2)` - Get conversation between two users
- `are_connected(user1, user2)` - Check if users are connected

### ✅ Automated Triggers
- Profile creation triggers for notification and theme preferences
- Post reaction/comment count updates
- Conversation last message updates
- `updated_at` timestamp updates

## Storage Buckets Setup

Three storage buckets are configured in the master file:

| Bucket | Purpose | Public Read | Auth Write | Max Size |
|--------|---------|-------------|------------|----------|
| post-media | Posts, messages, comments | ✅ | ✅ | 50MB |
| profile-media | Avatars, banners | ✅ | ✅ | 10MB |
| project-media | Project images | ✅ | ✅ | 10MB |

If you run individual files, execute `98-storage-buckets.sql` after the table files.

If you run the master file (`99-master-all-tables.sql`), all buckets are automatically created.

## Profile Completion Logic

The `profiles.profile_completion` field (0-100%) is calculated as:

| Milestone | % | Requirements |
|-----------|---|--------------|
| Basic Profile | 25% | Name, Headline |
| Skills Added | 50% | At least 1 skill |
| Interests & Goals | 90% | Interests + looking_for |
| Complete | 100% | Experience, Projects, or Links |

## Frontend Integration

### TypeScript Types
See the `expected-objects/` markdown files for frontend expectations.

### Common Queries

**Get user's profile with skills:**
```sql
SELECT p.*, array_agg(us.skill_name) as skills
FROM profiles p
LEFT JOIN user_skills us ON p.id = us.user_id
WHERE p.id = :userId
GROUP BY p.id;
```

**Get feed posts:**
```sql
SELECT * FROM posts
WHERE is_archived = FALSE
ORDER BY created_at DESC
LIMIT 20;
```

**Get match suggestions:**
```sql
SELECT ms.*, p.display_name, p.avatar_url
FROM match_suggestions ms
JOIN profiles p ON ms.matched_user_id = p.id
WHERE ms.user_id = :userId
AND ms.status = 'active'
ORDER BY ms.match_percentage DESC
LIMIT 5;
```

## Notes

- All UUIDs are auto-generated using `gen_random_uuid()`
- Foreign key constraints ensure referential integrity
- Check constraints validate enum values
- Indexes are optimized for common query patterns
- Triggers maintain data consistency automatically
