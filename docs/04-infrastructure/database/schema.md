# Database Schema

Complete reference for Collabryx database schema (26 tables).

---

## Table of Contents

- [Overview](#overview)
- [User Management](#user-management)
- [Social Features](#social-features)
- [Matching System](#matching-system)
- [Messaging](#messaging)
- [Notifications](#notifications)
- [AI Features](#ai-features)
- [Preferences](#preferences)
- [Vector Embeddings](#vector-embeddings)

---

## Overview

**Database:** PostgreSQL (Supabase)  
**Total Tables:** 26  
**Extensions:** pgvector  
**Master File:** `supabase/setup/99-master-all-tables.sql` (run this file only)

---

## User Management (5 Tables)

### profiles
Primary user profile table with collaboration readiness and verification.

**Key columns:** id, email, display_name, headline, bio, avatar_url, collaboration_readiness, is_verified, profile_completion, onboarding_completed

### user_skills
User skills with proficiency levels.

**Key columns:** id, user_id, skill_name, proficiency (beginner/intermediate/advanced/expert), is_primary

### user_interests
User interests and tags.

**Key columns:** id, user_id, interest

### user_experiences
Work experience history.

**Key columns:** id, user_id, title, company, description, start_date, end_date, is_current

### user_projects
User portfolio projects.

**Key columns:** id, user_id, title, description, url, image_url, tech_stack, is_public

---

## Social Features (6 Tables)

### posts
User posts with reactions and comments.

**Key columns:** id, author_id, content, post_type, intent, link_url, reaction_count, comment_count, share_count

### post_attachments
Media attachments for posts.

**Key columns:** id, post_id, file_url, file_type (image/video), file_name, file_size, mime_type

### post_reactions
Reactions/emojis on posts.

**Key columns:** id, post_id, user_id, emoji

### comments
Comments on posts with threading support.

**Key columns:** id, post_id, author_id, content, parent_id, like_count

### comment_likes
Likes on comments.

**Key columns:** id, comment_id, user_id

### connections
User connection requests and relationships.

**Key columns:** id, requester_id, receiver_id, status (pending/accepted/declined/blocked)

---

## Matching System (4 Tables)

### match_suggestions
AI-powered match suggestions with explanations.

**Key columns:** id, user_id, matched_user_id, match_percentage, reasons (JSONB), ai_confidence, ai_explanation, status

### match_scores
Detailed scoring breakdown for matches.

**Key columns:** id, suggestion_id, skills_overlap, complementary_score, shared_interests, overlapping_skills, insights (JSONB)

### match_activity
User activity tracking for matches.

**Key columns:** id, actor_user_id, target_user_id, type (profile_view/building_match/skill_match), activity, match_percentage

### match_preferences
User preferences for match filtering.

**Key columns:** id, user_id, min_match_percentage, interested_in_types, availability_match

---

## Messaging (2 Tables)

### conversations
Direct message conversations between two users.

**Key columns:** id, participant_1, participant_2, last_message_text, last_message_at, unread_count_1, unread_count_2

### messages
Messages within conversations.

**Key columns:** id, conversation_id, sender_id, text, is_read, attachment_url, attachment_type

---

## Notifications (2 Tables)

### notifications
User notifications for various events.

**Key columns:** id, user_id, type (connect/message/like/comment/system/match), actor_id, actor_name, content, resource_type, resource_id, is_read

### notification_preferences
User notification preferences.

**Key columns:** id, user_id, email_new_connections, email_messages, ai_smart_match_alerts, email_post_likes, push_enabled

---

## AI Features (2 Tables)

### ai_mentor_sessions
AI mentor chat sessions.

**Key columns:** id, user_id, title, status (active/archived)

### ai_mentor_messages
Messages within AI mentor sessions.

**Key columns:** id, session_id, role (user/assistant), content, is_saved_to_profile

---

## Preferences (1 Table)

### theme_preferences
User theme preferences.

**Key columns:** id, user_id, theme (light/dark/system)

---

## Vector Embeddings (4 Tables)

### profile_embeddings
Vector embeddings for semantic profile matching (384 dimensions).

**Key columns:** id, user_id, embedding (VECTOR(384)), status (pending/processing/completed/failed), retry_count, error_message, metadata (JSONB)

**Index:** HNSW index for cosine similarity search

### embedding_dead_letter_queue
Failed embedding retry queue with exponential backoff.

**Key columns:** id, user_id, semantic_text, failure_reason, retry_count, max_retries, status, next_retry

### embedding_rate_limits
Rate limiting for embedding generation (3 requests/hour/user).

**Key columns:** id, user_id, request_count, window_start, window_end

### embedding_pending_queue
Queue for pending embedding requests from onboarding.

**Key columns:** id, user_id, status, trigger_source (onboarding/manual/admin/api), metadata (JSONB), first_attempt, completed_at

---

## Row Level Security

All 26 tables have RLS enabled with policies for:
- Users can view their own data
- Users can update their own data
- Public read access where appropriate
- Service role has full access

---

## Helper Functions

- `get_conversation(user1, user2)` - Get conversation ID between two users
- `are_connected(user1, user2)` - Check if users are connected
- `has_embedding(user_id)` - Check if user has completed embedding
- `get_embedding_status(user_id)` - Get embedding status
- `regenerate_embedding(user_id)` - Manually trigger embedding regeneration
- `check_embedding_rate_limit(user_id)` - Check rate limit (3/hour)
- `reset_embedding_rate_limit(user_id)` - Admin: reset rate limit
- `queue_embedding_request(user_id, source)` - Queue embedding request
- `get_pending_queue_stats()` - Get queue statistics by status

---

**Last Updated**: 2026-03-14  
**Source**: [supabase/setup/99-master-all-tables.sql](../../../supabase/setup/99-master-all-tables.sql)

[← Back to Docs](../README.md)
