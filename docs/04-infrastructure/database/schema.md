# Database Schema

Complete reference for Collabryx database schema (34 tables).

**Version:** 4.1.0 (Final Boss - Self-Contained)  
**Last Updated:** 2026-03-21

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
**Total Tables:** 34  
**Extensions:** pgvector  
**Master File:** `supabase/setup/99-master-all-tables.sql` (run this file only)  
**Version:** 4.1.0 (Self-contained, no external dependencies)

### What's New in v4.1.0

- **Optimistic Locking:** Posts table includes `version` column with counter functions
- **Message Read Tracking:** Messages table includes `read_at` timestamp column
- **Composite Indexes:** 3 additional indexes for query optimization
- **All Migrations Merged:** No standalone migration files - everything in master file

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
User posts with reactions and comments, with optimistic locking support.

**Key columns:** id, author_id, content, post_type, intent, link_url, reaction_count, comment_count, share_count, version

**New in v4.1.0:** `version` column for optimistic locking to prevent concurrent update conflicts

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
Messages within conversations with read receipt tracking.

**Key columns:** id, conversation_id, sender_id, text, is_read, read_at, attachment_url, attachment_type

**New in v4.1.0:** `read_at` column for precise read receipt timestamps

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

## Preferences (2 Tables)

### notification_preferences
User notification preferences for email and push notifications.

**Key columns:** id, user_id, email_new_connections, email_messages, ai_smart_match_alerts, email_post_likes, push_enabled

### theme_preferences
User theme preferences.

**Key columns:** id, user_id, theme (light/dark/system)

---

## Analytics (4 Tables)

### user_engagement_metrics
Tracks user engagement metrics and activity patterns.

**Key columns:** id, user_id, metric_type, value, period, calculated_at

### user_activity_analytics
Detailed user activity tracking and analytics.

**Key columns:** id, user_id, activity_type, metadata, session_id, created_at

### feature_adoption_metrics
Tracks feature adoption and usage patterns.

**Key columns:** id, user_id, feature_name, adopted_at, usage_count, last_used_at

### analytics_aggregation_queue
Queue for analytics data aggregation jobs.

**Key columns:** id, metric_type, period, status, scheduled_at, completed_at

---

## Content Moderation (3 Tables)

### content_reports
User-reported content for moderation review.

**Key columns:** id, reporter_id, content_type, content_id, reason, status, reviewed_by, reviewed_at

### content_moderation_queue
Queue of content awaiting moderation.

**Key columns:** id, content_type, content_id, priority, status, assigned_moderator, created_at

### content_moderation_logs
Audit log of moderation actions.

**Key columns:** id, moderator_id, action, content_type, content_id, reason, created_at

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

### Connection Functions
- `get_conversation(user1, user2)` - Get conversation ID between two users
- `are_connected(user1, user2)` - Check if users are connected
- `get_connection_status(user1, user2)` - Get connection status (pending/accepted/declined/blocked)

### Notification Functions
- `create_notification(user_id, type, title, message, data, actor_id)` - Create notification
- `get_unread_notification_count(user_id)` - Count unread notifications

### Comment Functions
- `get_comment_depth(comment_id)` - Get nesting level (0=top-level)
- `get_comment_replies_count(comment_id)` - Count all replies
- `increment_comment_count(post_id)` - Increment post comment count
- `decrement_comment_count(post_id)` - Decrement post comment count
- `increment_like_count(comment_id)` - Increment comment like count
- `decrement_like_count(comment_id)` - Decrement comment like count

### Match-Making Functions
- `calculate_match_percentage(user1, user2)` - Calculate match % (0-100)
- `get_shared_skills(user1, user2)` - Array of shared skill names
- `get_shared_interests(user1, user2)` - Array of shared interest names

### Embedding Functions
- `has_embedding(user_id)` - Check if user has completed embedding
- `get_embedding_status(user_id)` - Get embedding status
- `regenerate_embedding(user_id)` - Manually trigger embedding regeneration
- `check_embedding_rate_limit(user_id)` - Check rate limit (3/hour)
- `reset_embedding_rate_limit(user_id)` - Admin: reset rate limit
- `queue_embedding_request(user_id, source)` - Queue embedding request
- `get_pending_queue_stats()` - Get queue statistics by status

### Optimistic Locking (New in v4.1.0)
- `increment_post_counter(post_id)` - Increment post counter for optimistic locking
- `get_post_counter_with_lock(post_id)` - Get counter with advisory lock
- `posts_bump_version(post_id)` - Bump post version number

### Profile Functions
- `get_profile_completion_percentage(user_id)` - Calculate profile completion (0-100)
- `recalculate_profile_completion(user_id)` - Recalculate profile completion score
- `recalculate_all_profile_completions()` - Recalculate for all users

---

### Indexes (103 Total)

**New Composite Indexes in v4.1.0:**
- `idx_comments_post_parent` - ON comments(post_id, parent_id) - Optimizes threaded comment queries
- `idx_notifications_user_read_created` - ON notifications(user_id, is_read, created_at DESC) - Optimizes notification feed
- `idx_posts_version` - ON posts(author_id, version) - Supports optimistic locking

**Key Indexes by Category:**
- Comments: 6 indexes (including composite for threaded queries)
- Connections: 5 indexes (for fast relationship lookups)
- Notifications: 5 indexes (including composite for feed queries)
- Posts: 5 indexes (including version for optimistic locking)
- Messages: 4 indexes (including read_at for read receipts)
- Embeddings: 4 indexes (including HNSW for vector similarity)
- Match system: 8 indexes (for fast match calculations)

### Triggers (39 Total)

**Automatic Count Updates:**
- `update_post_reaction_count` - Updates reaction count on posts
- `update_post_comment_count` - Updates comment count on posts
- `update_comment_like_count` - Updates like count on comments
- `update_conversation_last_message` - Updates conversation metadata
- `update_profiles_updated_at` - Updates timestamp on profile changes

**Optimistic Locking Triggers (v4.1.0):**
- `posts_increment_version` - Auto-increments version on post updates

---

**Last Updated**: 2026-03-21  
**Version**: 4.1.0  
**Source**: [supabase/setup/99-master-all-tables.sql](../../../supabase/setup/99-master-all-tables.sql)

[← Back to Docs](../README.md)
