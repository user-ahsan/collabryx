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

## User Management

### profiles

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key (references auth.users) |
| email | TEXT | User email |
| name | TEXT | Display name |
| headline | TEXT | Professional headline |
| bio | TEXT | About me |
| avatar_url | TEXT | Profile picture URL |
| is_active | BOOLEAN | User activity status |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

### user_skills

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to profiles |
| skill_name | TEXT | Skill name |
| proficiency_level | INTEGER | 1-5 proficiency |

### user_interests

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to profiles |
| interest_name | TEXT | Interest name |

### user_experiences

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to profiles |
| title | TEXT | Job title |
| company | TEXT | Company name |
| start_date | DATE | Start date |
| end_date | DATE | End date |
| description | TEXT | Job description |

### user_projects

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to profiles |
| name | TEXT | Project name |
| description | TEXT | Project description |
| url | TEXT | Project URL |

---

## Social Features

### posts

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to profiles |
| content | TEXT | Post content |
| created_at | TIMESTAMPTZ | Creation timestamp |

### comments

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| post_id | UUID | Foreign key to posts |
| user_id | UUID | Foreign key to profiles |
| content | TEXT | Comment content |
| created_at | TIMESTAMPTZ | Creation timestamp |

### connections

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| requester_id | UUID | Connection requester |
| addressee_id | UUID | Connection recipient |
| status | TEXT | pending/accepted/rejected |
| created_at | TIMESTAMPTZ | Creation timestamp |

---

## Matching System

### match_suggestions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | User to match |
| suggested_user_id | UUID | Suggested match |
| score | FLOAT | Match score (0-1) |
| created_at | TIMESTAMPTZ | Suggestion timestamp |

### match_scores

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id_1 | UUID | First user |
| user_id_2 | UUID | Second user |
| semantic_score | FLOAT | Vector similarity |
| skills_score | FLOAT | Skill overlap |
| interests_score | FLOAT | Interest overlap |
| total_score | FLOAT | Weighted total |

---

## Messaging

### conversations

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last message timestamp |

### messages

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| conversation_id | UUID | Foreign key to conversations |
| sender_id | UUID | Foreign key to profiles |
| content | TEXT | Message content |
| is_read | BOOLEAN | Read status |
| created_at | TIMESTAMPTZ | Message timestamp |

---

## AI Features

### ai_mentor_sessions

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to profiles |
| session_type | TEXT | Type of session |
| created_at | TIMESTAMPTZ | Session timestamp |

### ai_mentor_messages

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| session_id | UUID | Foreign key to sessions |
| role | TEXT | user/assistant |
| content | TEXT | Message content |
| created_at | TIMESTAMPTZ | Message timestamp |

---

## Vector Embeddings

### profile_embeddings

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Foreign key to profiles (unique) |
| embedding | vector(768) | Profile embedding |
| created_at | TIMESTAMPTZ | Generation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

**Index:**
```sql
CREATE INDEX profile_embeddings_embedding_idx 
ON profile_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

## Row Level Security

All tables have RLS enabled with policies for:
- Users can view their own data
- Users can update their own data
- Public read access where appropriate
- Service role has full access

---

**Last Updated**: 2026-03-14  
**Source**: [expected-objects/](../../expected-objects/) • [supabase/setup/](../../supabase/setup/)

[← Back to Docs](../README.md)
