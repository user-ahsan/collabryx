# Required API Endpoints & Data Contracts

This document outlines the specific API endpoints required to make the Collabryx frontend fully functional, replacing current hardcoded mock data. 

## 1. Authentication & User Management
**Scope:** `app/(auth)/profile`, `app/(auth)/settings`, `app/(auth)/onboarding`

| Method | Endpoint | Description | Request Body / Params | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/signup` | Register a new user | `{ email, password, full_name }` | `{ user: User, session: Session }` |
| `POST` | `/api/auth/login` | Login user | `{ email, password }` | `{ user: User, session: Session }` |
| `POST` | `/api/auth/logout` | Logout user | - | `{ success: true }` |
| `POST` | `/api/users/onboarding` | Submit initial onboarding data | `{ role, skills: [], interests: [], bio }` | `{ success: true, user: User }` |
| `GET` | `/api/users/me` | Get current user's full profile | - | `User` (Full profile with settings) |
| `PUT` | `/api/users/me` | Update profile (Bio, Name, etc.) | `{ full_name, headline, bio, avatar_url }` | `User` |
| `PUT` | `/api/users/me/security` | Update password | `{ old_password, new_password }` | `{ success: true }` |
| `DELETE` | `/api/users/me` | Delete account | - | `{ success: true }` |
| `PUT` | `/api/users/me/settings` | Update notification preferences | `{ notifications: { new_connections: bool, messages: bool, smart_matches: bool } }` | `{ settings: UserSettings }` |
| `GET` | `/api/users/me/portfolio` | Get user's projects/experience | - | `{ experiences: Exp[], projects: Project[] }` |
| `POST` | `/api/users/me/portfolio` | Add experience or project | `{ type: "experience"\|"project", ...data }` | `PortfolioItem` |

---

## 2. Dashboard & Social Feed
**Scope:** `app/(auth)/dashboard`, `feed.tsx`, `suggestions-sidebar.tsx`

| Method | Endpoint | Description | Request Body / Params | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/feed` | Get paginated feed posts | `?cursor=123&limit=10&filter=all` | `{ data: Post[], nextCursor: string }` |
| `POST` | `/api/posts` | Create a new post | `{ content, type, intent_label?, media_urls?: [], link_preview?: LinkData }` | `Post` |
| `POST` | `/api/upload` | Upload media (Img/Video) | `FormData { file }` | `{ url: string, type: "image"\|"video" }` |
| `GET` | `/api/posts/{id}/comments` | Get comments for a post | `?cursor=123` | `{ comments: Comment[], nextCursor: string }` |
| `POST` | `/api/posts/{id}/comments` | Add a comment | `{ content: string }` | `Comment` |
| `POST` | `/api/posts/{id}/react` | Toggle reaction (Like, etc.) | `{ type: "like"\|"love"\|... }` | `{ success: true, counts: Record<string, int> }` |
| `GET` | `/api/matches/sidebar` | Get specific matches for sidebar | `?limit=3` | `MatchSuggestion[]` (Mini version) |

### AI Integration (Feed)
| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/intent` | Detect intent from partial text | `{ text: string }` | `{ intent: "project-launch"\|"request", confidence: float }` |

---

## 3. Smart Matches & Matching Engine
**Scope:** `app/(auth)/matches`, `why-match-modal.tsx`, `semantic-search-dialog.tsx`

| Method | Endpoint | Description | Request Body / Params | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/matches/find` | Main search/match query | `{ role?, industry?, query?, preferences? }` | `MatchProfile[]` |
| `GET` | `/api/matches/{userId}/explain` | Get detailed "Why" explanation | - | `{ compatibility: 95, summary: string, details: { skills_overlap: [], complementary: [] } }` |
| `GET` | `/api/meta/filters` | Get available filter options | - | `{ roles: [], industries: [], skills: [] }` |
| `POST` | `/api/users/me/preferences` | Update matching preferences | `{ looking_for_role, industries, project_stage }` | `{ success: true }` |

### AI Integration (Matches)
| Method | Endpoint | Description | Request Body | Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/search` | Semantic Search for matches | `{ natural_query: "Partner for fintech app" }` | `MatchProfile[]` (Vector search results) |

---

## 4. AI Assistant (Mentor)
**Scope:** `app/(auth)/assistant`, `chat-interface`

| Method | Endpoint | Description | Request Body / Params | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/ai/chat` | Send message to AI Mentor | `{ message: string, history: Message[] }` | `Stream<string>` (Markdown) |
| `GET` | `/api/ai/chat/history` | Get previous chat sessions | `?limit=10` | `{ sessions: ChatSession[] }` |
| `POST` | `/api/user/saved-items` | Save content (from AI) to workspace | `{ title, content, type: "project-plan" }` | `SavedItem` |
| `GET` | `/api/user/saved-items` | Get saved AI artifacts | - | `SavedItem[]` |

---

## 5. Messaging & Connections
**Scope:** `messages/page.tsx`, `requests/page.tsx`, `chat-window.tsx`

| Method | Endpoint | Description | Request Body / Params | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/connections/request` | Send connection request | `{ target_user_id, message? }` | `{ status: "pending" }` |
| `GET` | `/api/connections/requests` | Get all pending requests | `?type=incoming\|outgoing` | `ConnectionRequest[]` |
| `PUT` | `/api/connections/{reqId}` | Accept/Reject request | `{ action: "accept"\|"reject" }` | `{ success: true }` |
| `GET` | `/api/chat/conversations` | Get list of chats | - | `Conversation[]` (with last message) |
| `POST` | `/api/chat/conversations` | Start/Get chat with user | `{ target_user_id }` | `{ conversation_id: string }` |
| `GET` | `/api/chat/{id}/messages` | Get messages for a chat | `?cursor=...` | `Message[]` |
| `WS` | `/ws/chat/{id}` | Realtime socket for chat | - | `WebSocket Event: "new_message"` |

---

## 6. Notifications
**Scope:** `notifications/page.tsx`

| Method | Endpoint | Description | Request Body / Params | Expected Response |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/notifications` | Get user notifications | `?limit=20` | `Notification[]` |
| `POST` | `/api/notifications/mark-read` | Mark notifications as read | `{ id?: string, all?: boolean }` | `{ success: true }` |

---

## Data Definitions (Key Types)

**User**
```typescript
{
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  headline: string;
  bio: string;
  role: string;
  skills: string[];
  location: string;
  is_verified: boolean;
  badges: string[];
}
```

**Post**
```typescript
{
  id: string;
  author: User; // Simplified User object
  content: string;
  created_at: string;
  type: "project-launch" | "general" | "request";
  media: { url: string, type: "image"|"video" }[];
  stats: { likes: number, comments: number };
  user_reaction: string | null;
}
```

**MatchProfile**
```typescript
{
  user: User;
  match_score: number; // 0-100
  insights: {
    overlap_skills: string[];
    complementary_text: string[];
    shared_interests: string[];
    ai_summary: string;
  };
}
```
