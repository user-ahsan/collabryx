# Collabryx — Backend Object Model Overview

> **Last Updated:** 2026-03-07  
> **Purpose:** Complete backend schema specification derived from the frontend codebase.

---

## Table Index

| # | Table | Document | Purpose |
|---|-------|----------|---------|
| 1 | `profiles` | [01-profiles.md](./01-profiles.md) | User identity, bio, skills, preferences, avatar, verification |
| 2 | `user_skills` | [02-user-skills.md](./02-user-skills.md) | Many-to-many: Users ↔ Skills |
| 3 | `user_interests` | [03-user-interests.md](./03-user-interests.md) | Interests/industries each user cares about |
| 4 | `user_experiences` | [04-user-experiences.md](./04-user-experiences.md) | Work/education history timeline |
| 5 | `user_projects` | [05-user-projects.md](./05-user-projects.md) | Portfolio projects shown on profile |
| 6 | `posts` | [06-posts.md](./06-posts.md) | Feed posts with types, media, links |
| 7 | `post_attachments` | [07-post-attachments.md](./07-post-attachments.md) | Media files attached to posts |
| 8 | `post_reactions` | [08-post-reactions.md](./08-post-reactions.md) | Emoji reactions on posts |
| 9 | `comments` | [09-comments.md](./09-comments.md) | Comments under posts |
| 10 | `comment_likes` | [10-comment-likes.md](./10-comment-likes.md) | Likes on comments |
| 11 | `connections` | [11-connections.md](./11-connections.md) | Connection requests between users |
| 12 | `match_suggestions` | [12-match-suggestions.md](./12-match-suggestions.md) | AI-generated match recommendations |
| 13 | `match_scores` | [13-match-scores.md](./13-match-scores.md) | Detailed match breakdown (skills overlap, complementary, interests) |
| 14 | `match_activity` | [14-match-activity.md](./14-match-activity.md) | Profile views, building-match events |
| 15 | `match_preferences` | [15-match-preferences.md](./15-match-preferences.md) | User's match filter preferences |
| 16 | `conversations` | [16-conversations.md](./16-conversations.md) | Message threads between users |
| 17 | `messages` | [17-messages.md](./17-messages.md) | Individual chat messages |
| 18 | `notifications` | [18-notifications.md](./18-notifications.md) | In-app notification feed |
| 19 | `ai_mentor_sessions` | [19-ai-mentor-sessions.md](./19-ai-mentor-sessions.md) | AI Mentor conversation sessions |
| 20 | `ai_mentor_messages` | [20-ai-mentor-messages.md](./20-ai-mentor-messages.md) | Messages within AI mentor sessions |
| 21 | `notification_preferences` | [21-notification-preferences.md](./21-notification-preferences.md) | Email/push notification toggles |
| 22 | `theme_preferences` | [22-theme-preferences.md](./22-theme-preferences.md) | Dark/light mode setting |

---

## Entity Relationship Diagram (Text)

```
auth.users (Supabase Auth)
    │
    └──► profiles (1:1)
            ├──► user_skills (1:N)
            ├──► user_interests (1:N)
            ├──► user_experiences (1:N)
            ├──► user_projects (1:N)
            ├──► match_preferences (1:1)
            ├──► notification_preferences (1:1)
            ├──► theme_preferences (1:1)
            ├──► posts (1:N)
            │       ├──► post_attachments (1:N)
            │       ├──► post_reactions (1:N)
            │       └──► comments (1:N)
            │               └──► comment_likes (1:N)
            ├──► connections (N:N via requester/receiver)
            ├──► match_suggestions (1:N target)
            │       └──► match_scores (1:1)
            ├──► match_activity (1:N target)
            ├──► conversations (N:N via participants)
            │       └──► messages (1:N)
            ├──► notifications (1:N)
            └──► ai_mentor_sessions (1:N)
                    └──► ai_mentor_messages (1:N)
```

## Auth Provider

Supabase Auth handles `auth.users` automatically. The `profiles` table extends it.

Supported auth methods (frontend):
- **Email/password** (active)
- **Google OAuth** (placeholder)
- **GitHub OAuth** (placeholder)
- **Apple OAuth** (placeholder)
