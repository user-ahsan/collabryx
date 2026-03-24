-- ============================================================================
-- COLLABRYX DATABASE SCHEMA - COMPLETE MASTER FILE
-- ============================================================================
-- Version: 4.1.0 (FINAL - All-in-One Master File with Optimistic Locking)
-- Date: 2026-03-21
-- 
-- This file contains the COMPLETE database schema including:
-- - 34 Tables (22 core + 4 embedding + 5 ML features + 3 privacy/security)
-- - All indexes optimized for common queries (including HNSW for vectors + composite indexes)
-- - All triggers for automation (updated_at, counts, embeddings, notifications, events, optimistic locking)
-- - All RLS policies for security (70+ policies)
-- - All helper functions (43+ functions including match-making, notifications, comments, embeddings, optimistic locking)
-- - Storage buckets for file uploads (post-media, profile-media, project-media)
-- - Realtime enabled for all tables (Supabase Realtime)
-- - Complete embedding infrastructure (DLQ, rate limiting, pending queue)
-- - All migrations included (messages.read_at, posts.version, privacy_settings, blocked_users, audit_logs)
-- - Optimistic locking for posts (version column, atomic counters, conflict detection)
--
-- Usage: Run this ONCE in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/_/sql/new
--
-- PRODUCTION READY: All functionality consolidated into single file
-- DEPRECATED FILES (all merged into this file):
-- - 99-rate-limit-function.sql, 100-helper-functions.sql
-- - 01-23-*.sql (core tables), 30-34-*.sql (ML features)
-- - 35-37-*.sql (triggers), 38-39-*.sql (match functions)
-- - 40-messages-read-at.sql (read receipts)
-- - 41-profile-completion-trigger.sql
-- - 50-audit-logs.sql
-- - 99-missing-indexes.sql
-- - migrations/20260320_add_missing_composite_indexes.sql
-- - migrations/20260320_add_optimistic_locking_to_posts.sql
--
-- KEPT FILES (reference/verification only):
-- - 99-rls-policies-test.sql (verification tool - run after this file)
-- ============================================================================

-- ============================================================================
-- SECTION 0: EXTENSIONS
-- ============================================================================

-- Enable pgvector for vector embeddings (required for profile matching)
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================================
-- SECTION 1: CORE TABLES (1-22)
-- ============================================================================

-- --------------------------------------------
-- TABLE 1: profiles
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    display_name TEXT,
    full_name TEXT,
    headline TEXT,
    bio TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    location TEXT,
    website_url TEXT,
    collaboration_readiness TEXT DEFAULT 'available' CHECK (collaboration_readiness IN ('available', 'open', 'not-available')),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    verification_type TEXT CHECK (verification_type IN ('student', 'faculty', 'alumni')),
    university TEXT,
    profile_completion INTEGER NOT NULL DEFAULT 0 CHECK (profile_completion >= 0 AND profile_completion <= 100),
    looking_for TEXT[] DEFAULT '{}',
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 2: user_skills
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    proficiency TEXT CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- --------------------------------------------
-- TABLE 3: user_interests
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, interest)
);

-- --------------------------------------------
-- TABLE 4: user_experiences
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_experiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    company TEXT,
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN NOT NULL DEFAULT FALSE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, title)
);

-- --------------------------------------------
-- TABLE 5: user_projects
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    url TEXT,
    image_url TEXT,
    tech_stack TEXT[] DEFAULT '{}',
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 6: posts
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    post_type TEXT NOT NULL DEFAULT 'general' CHECK (post_type IN ('project-launch', 'teammate-request', 'announcement', 'general')),
    intent TEXT CHECK (intent IN ('cofounder', 'teammate', 'mvp', 'fyp')),
    link_url TEXT,
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    reaction_count INTEGER NOT NULL DEFAULT 0,
    comment_count INTEGER NOT NULL DEFAULT 0,
    share_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 7: post_attachments
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type TEXT NOT NULL CHECK (file_type IN ('image', 'video')),
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    width INTEGER,
    height INTEGER,
    order_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 8: post_reactions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- --------------------------------------------
-- TABLE 9: comments
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
    like_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 10: comment_likes
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- --------------------------------------------
-- TABLE 11: connections
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(requester_id, receiver_id),
    CHECK (requester_id != receiver_id)
);

-- --------------------------------------------
-- TABLE 12: match_suggestions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    matched_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    match_percentage INTEGER NOT NULL CHECK (match_percentage >= 0 AND match_percentage <= 100),
    reasons JSONB NOT NULL DEFAULT '[]',
    ai_confidence REAL CHECK (ai_confidence >= 0.0 AND ai_confidence <= 1.0),
    ai_explanation TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'connected')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    UNIQUE(user_id, matched_user_id)
);

-- --------------------------------------------
-- TABLE 13: match_scores
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    suggestion_id UUID NOT NULL REFERENCES public.match_suggestions(id) ON DELETE CASCADE,
    semantic_similarity REAL DEFAULT 0,
    skills_overlap INTEGER NOT NULL DEFAULT 0 CHECK (skills_overlap >= 0 AND skills_overlap <= 100),
    complementary_score INTEGER NOT NULL DEFAULT 0 CHECK (complementary_score >= 0 AND complementary_score <= 100),
    shared_interests INTEGER NOT NULL DEFAULT 0 CHECK (shared_interests >= 0 AND shared_interests <= 100),
    activity_match REAL DEFAULT 0,
    overall_score REAL DEFAULT 0,
    model_version TEXT DEFAULT 'rule-based-v1',
    model_config JSONB DEFAULT '{}',
    overlapping_skills TEXT[] DEFAULT '{}',
    complementary_explanation TEXT,
    shared_interest_tags TEXT[] DEFAULT '{}',
    insights JSONB DEFAULT '[]',
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 14: match_activity
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('profile_view', 'building_match', 'skill_match')),
    activity TEXT NOT NULL,
    match_percentage INTEGER CHECK (match_percentage >= 0 AND match_percentage <= 100),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 15: match_preferences
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.match_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    min_match_percentage INTEGER DEFAULT 0 CHECK (min_match_percentage >= 0 AND min_match_percentage <= 100),
    interested_in_types TEXT[] DEFAULT '{}',
    availability_match TEXT CHECK (availability_match IN ('any', 'similar', 'complementary')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 16: conversations
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count_1 INTEGER NOT NULL DEFAULT 0,
    unread_count_2 INTEGER NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(participant_1, participant_2),
    CHECK (participant_1 < participant_2)
);

-- --------------------------------------------
-- TABLE 17: messages
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_url TEXT,
    read_at TIMESTAMPTZ,
    attachment_type TEXT CHECK (attachment_type IN ('image', 'file')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 18: notifications
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('connect', 'message', 'like', 'comment', 'system', 'match')),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_name TEXT,
    actor_avatar TEXT,
    content TEXT NOT NULL,
    resource_type TEXT CHECK (resource_type IN ('post', 'profile', 'conversation', 'match')),
    resource_id UUID,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    is_actioned BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 19: ai_mentor_sessions
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_mentor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 20: ai_mentor_messages
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_mentor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.ai_mentor_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    is_saved_to_profile BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 21: notification_preferences
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    email_new_connections BOOLEAN NOT NULL DEFAULT TRUE,
    email_messages BOOLEAN NOT NULL DEFAULT TRUE,
    ai_smart_match_alerts BOOLEAN NOT NULL DEFAULT FALSE,
    email_post_likes BOOLEAN NOT NULL DEFAULT FALSE,
    email_comments BOOLEAN NOT NULL DEFAULT TRUE,
    push_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 22: theme_preferences
-- --------------------------------------------
CREATE TABLE IF NOT EXISTS public.theme_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 2: EMBEDDING TABLES (23-26)
-- ============================================================================

-- --------------------------------------------
-- TABLE 23: profile_embeddings
-- --------------------------------------------
-- Stores vector embeddings for semantic profile matching
-- Uses pgvector extension with HNSW index for fast similarity search
CREATE TABLE IF NOT EXISTS public.profile_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    embedding VECTOR(384),  -- 384 dimensions for all-MiniLM-L6-v2 model
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    metadata JSONB DEFAULT '{}'
);

-- Add metadata column if it doesn't exist (migration from older versions)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profile_embeddings' 
          AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.profile_embeddings ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
END $$;

-- --------------------------------------------
-- TABLE 24: embedding_dead_letter_queue
-- --------------------------------------------
-- Failed embedding retry queue with exponential backoff
CREATE TABLE IF NOT EXISTS public.embedding_dead_letter_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    semantic_text TEXT NOT NULL,
    failure_reason TEXT,
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'exhausted')),
    last_attempt TIMESTAMPTZ,
    next_retry TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- --------------------------------------------
-- TABLE 25: embedding_rate_limits
-- --------------------------------------------
-- Rate limiting for embedding generation (3 requests/hour/user)
CREATE TABLE IF NOT EXISTS public.embedding_rate_limits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    request_count INTEGER NOT NULL DEFAULT 1,
    window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    window_end TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 26: embedding_pending_queue
-- --------------------------------------------
-- Queue for pending embedding requests from onboarding
CREATE TABLE IF NOT EXISTS public.embedding_pending_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    trigger_source TEXT NOT NULL DEFAULT 'onboarding' CHECK (trigger_source IN ('onboarding', 'manual', 'admin', 'api')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    first_attempt TIMESTAMPTZ,
    last_attempt TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failure_reason TEXT
);

-- ============================================================================
-- SECTION 2.5: NEW ML FEATURE TABLES (27-31)
-- ============================================================================

-- --------------------------------------------
-- TABLE 27: feed_scores
-- --------------------------------------------
-- Cached personalized feed ranking scores
CREATE TABLE IF NOT EXISTS public.feed_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    score REAL NOT NULL DEFAULT 0,
    semantic_score REAL DEFAULT 0,
    engagement_score REAL DEFAULT 0,
    recency_score REAL DEFAULT 0,
    connection_boost REAL DEFAULT 1,
    factors JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT unique_user_post_score UNIQUE (user_id, post_id)
);

-- --------------------------------------------
-- TABLE 28: events
-- --------------------------------------------
-- Central event store for analytics and event processing
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type TEXT NOT NULL,
    event_category TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN event_type LIKE 'post_%' THEN 'content'
            WHEN event_type LIKE 'connection_%' THEN 'network'
            WHEN event_type LIKE 'message_%' THEN 'communication'
            WHEN event_type LIKE 'match_%' THEN 'matching'
            WHEN event_type LIKE 'profile_%' THEN 'profile'
            WHEN event_type LIKE 'notification_%' THEN 'notification'
            ELSE 'other'
        END
    ) STORED,
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    target_id UUID,
    target_type TEXT,
    metadata JSONB DEFAULT '{}',
    session_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 29: user_analytics
-- --------------------------------------------
-- Per-user engagement metrics and activity tracking
CREATE TABLE IF NOT EXISTS public.user_analytics (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    profile_views_count INTEGER DEFAULT 0,
    profile_views_last_7_days INTEGER DEFAULT 0,
    profile_views_last_30_days INTEGER DEFAULT 0,
    post_impressions_count INTEGER DEFAULT 0,
    post_reactions_received INTEGER DEFAULT 0,
    post_comments_received INTEGER DEFAULT 0,
    posts_created_count INTEGER DEFAULT 0,
    match_suggestions_count INTEGER DEFAULT 0,
    matches_accepted_count INTEGER DEFAULT 0,
    match_acceptance_rate REAL DEFAULT 0,
    high_confidence_matches_count INTEGER DEFAULT 0,
    connections_count INTEGER DEFAULT 0,
    connection_requests_sent INTEGER DEFAULT 0,
    connection_requests_received INTEGER DEFAULT 0,
    mutual_connections_avg INTEGER DEFAULT 0,
    messages_sent_count INTEGER DEFAULT 0,
    messages_received_count INTEGER DEFAULT 0,
    conversations_count INTEGER DEFAULT 0,
    avg_response_time_minutes REAL DEFAULT 0,
    ai_sessions_count INTEGER DEFAULT 0,
    ai_messages_count INTEGER DEFAULT 0,
    sessions_count INTEGER DEFAULT 0,
    total_time_spent_minutes INTEGER DEFAULT 0,
    last_active TIMESTAMPTZ,
    last_active_ip INET,
    engagement_score REAL DEFAULT 0,
    influence_score REAL DEFAULT 0,
    activity_streak_days INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_calculated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 30: platform_analytics
-- --------------------------------------------
-- Daily aggregated platform-wide metrics
CREATE TABLE IF NOT EXISTS public.platform_analytics (
    date DATE PRIMARY KEY,
    dau INTEGER DEFAULT 0,
    mau INTEGER DEFAULT 0,
    wau INTEGER DEFAULT 0,
    new_users INTEGER DEFAULT 0,
    deleted_users INTEGER DEFAULT 0,
    active_users_change REAL DEFAULT 0,
    new_posts INTEGER DEFAULT 0,
    total_posts INTEGER DEFAULT 0,
    posts_with_media INTEGER DEFAULT 0,
    avg_post_length INTEGER DEFAULT 0,
    new_matches INTEGER DEFAULT 0,
    total_matches INTEGER DEFAULT 0,
    avg_match_score REAL DEFAULT 0,
    high_confidence_matches INTEGER DEFAULT 0,
    new_connections INTEGER DEFAULT 0,
    total_connections INTEGER DEFAULT 0,
    connection_acceptance_rate REAL DEFAULT 0,
    pending_requests INTEGER DEFAULT 0,
    new_messages INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    new_conversations INTEGER DEFAULT 0,
    avg_messages_per_conversation REAL DEFAULT 0,
    total_profile_views INTEGER DEFAULT 0,
    total_post_reactions INTEGER DEFAULT 0,
    total_comments INTEGER DEFAULT 0,
    avg_session_duration_minutes REAL DEFAULT 0,
    ai_sessions_count INTEGER DEFAULT 0,
    ai_messages_count INTEGER DEFAULT 0,
    avg_session_length REAL DEFAULT 0,
    content_flagged INTEGER DEFAULT 0,
    content_approved INTEGER DEFAULT 0,
    content_rejected INTEGER DEFAULT 0,
    avg_moderation_time_seconds REAL DEFAULT 0,
    api_requests_count INTEGER DEFAULT 0,
    avg_api_latency_ms REAL DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    error_rate REAL DEFAULT 0,
    embeddings_generated INTEGER DEFAULT 0,
    embeddings_pending INTEGER DEFAULT 0,
    embeddings_failed INTEGER DEFAULT 0,
    avg_embedding_time_ms REAL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- --------------------------------------------
-- TABLE 31: content_moderation_logs
-- --------------------------------------------
-- Audit trail for content moderation decisions
CREATE TABLE IF NOT EXISTS public.content_moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_type TEXT NOT NULL,
    content_id UUID,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('approved', 'flag_for_review', 'auto_reject')),
    risk_score REAL DEFAULT 0,
    toxicity_score REAL DEFAULT 0,
    spam_score REAL DEFAULT 0,
    nsfw_score REAL DEFAULT 0,
    pii_detected BOOLEAN DEFAULT FALSE,
    details JSONB DEFAULT '{}',
    moderated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 2.7: MIGRATIONS FOR EXISTING DATABASES
-- ============================================================================
-- These ALTER TABLE statements ensure compatibility with existing databases
-- They are safe to run on new databases (will be no-ops due to IF NOT EXISTS)

-- Migration: Add read_at column to messages table (for read receipts)
-- This column is already defined in the CREATE TABLE above for new databases
-- This ALTER ensures existing databases get the column too
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ;

-- Migration: Update existing read messages to have read_at = created_at
UPDATE public.messages 
SET read_at = created_at 
WHERE is_read = true AND read_at IS NULL;

-- Migration: Add version column to posts table (for optimistic locking)
-- This column enables conflict detection for concurrent updates
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

-- Migration: Update existing posts to have version = 1
UPDATE public.posts SET version = 1 WHERE version IS NULL;

-- ============================================================================
-- SECTION 3: INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at DESC);

-- User skills indexes
-- User skills indexes
CREATE INDEX IF NOT EXISTS idx_user_skills_user ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_name ON public.user_skills(skill_name);

-- User interests indexes
CREATE INDEX IF NOT EXISTS idx_user_interests_user ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON public.user_interests(interest);

-- User experiences indexes
CREATE INDEX IF NOT EXISTS idx_user_experiences_user ON public.user_experiences(user_id);

-- User projects indexes
CREATE INDEX IF NOT EXISTS idx_user_projects_user ON public.user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_public ON public.user_projects(is_public);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_post_type_created ON public.posts(post_type, created_at DESC);
-- Composite index for author's posts sorted by date
CREATE INDEX IF NOT EXISTS idx_posts_author_created_at ON public.posts(author_id, created_at DESC);
-- Index for optimistic locking version checks
CREATE INDEX IF NOT EXISTS idx_posts_version ON public.posts(id, version);

-- Post attachments indexes
CREATE INDEX IF NOT EXISTS idx_post_attachments_post_id ON public.post_attachments(post_id);

-- Post reactions indexes
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON public.post_reactions(user_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);
-- Composite index for post comments with threading
CREATE INDEX IF NOT EXISTS idx_comments_post_parent ON public.comments(post_id, parent_id);

-- Connections indexes
CREATE INDEX IF NOT EXISTS idx_connections_requester_id ON public.connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver_id ON public.connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);
-- Composite indexes for connection status queries (Phase 2 Task 3)
CREATE INDEX IF NOT EXISTS idx_connections_requester_receiver_status ON public.connections(requester_id, receiver_id, status);
CREATE INDEX IF NOT EXISTS idx_connections_receiver_requester_status ON public.connections(receiver_id, requester_id, status);

-- Match suggestions indexes
CREATE INDEX IF NOT EXISTS idx_match_suggestions_user_id ON public.match_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_match_suggestions_matched_user_id ON public.match_suggestions(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_match_suggestions_user_percentage ON public.match_suggestions(user_id, match_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_match_suggestions_status ON public.match_suggestions(status);

-- Match scores indexes
CREATE INDEX IF NOT EXISTS idx_match_scores_suggestion_id ON public.match_scores(suggestion_id);

-- Match activity indexes
CREATE INDEX IF NOT EXISTS idx_match_activity_actor_user ON public.match_activity(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_match_activity_target_user ON public.match_activity(target_user_id);
CREATE INDEX IF NOT EXISTS idx_match_activity_created ON public.match_activity(created_at DESC);

-- Match preferences indexes
CREATE INDEX IF NOT EXISTS idx_match_preferences_user_id ON public.match_preferences(user_id);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
-- Partial index for read messages (read receipts optimization)
CREATE INDEX IF NOT EXISTS idx_messages_read_at ON public.messages(read_at) WHERE is_read = true;

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
-- Partial index for unread notification queries (Phase 2 Task 3)
-- Only indexes rows where is_read = false (smaller, faster for badge counts)
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON public.notifications(user_id, created_at DESC) WHERE is_read = false;
-- Full composite index for all notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON public.notifications(user_id, is_read, created_at DESC);

-- AI Mentor sessions indexes
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_user_id ON public.ai_mentor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_status ON public.ai_mentor_sessions(status);

-- AI Mentor messages indexes
CREATE INDEX IF NOT EXISTS idx_ai_mentor_messages_session_id ON public.ai_mentor_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_ai_mentor_messages_created ON public.ai_mentor_messages(created_at DESC);

-- Notification preferences indexes
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON public.notification_preferences(user_id);

-- Theme preferences indexes
CREATE INDEX IF NOT EXISTS idx_theme_preferences_user_id ON public.theme_preferences(user_id);

-- Profile embeddings indexes
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_user_id ON public.profile_embeddings(user_id);
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_status ON public.profile_embeddings(status);
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_updated ON public.profile_embeddings(last_updated DESC);
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_retry ON public.profile_embeddings(retry_count);
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_metadata ON public.profile_embeddings USING GIN (metadata);
-- HNSW index for vector similarity search (cosine distance)
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_embedding 
    ON public.profile_embeddings USING hnsw (embedding vector_cosine_ops);

-- Dead letter queue indexes
CREATE INDEX IF NOT EXISTS idx_dlq_user_id ON public.embedding_dead_letter_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_dlq_status ON public.embedding_dead_letter_queue(status);
CREATE INDEX IF NOT EXISTS idx_dlq_status_retry ON public.embedding_dead_letter_queue(status, next_retry);
CREATE INDEX IF NOT EXISTS idx_dlq_created ON public.embedding_dead_letter_queue(created_at);

-- Rate limits indexes
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_id ON public.embedding_rate_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_rate_limit_user_window ON public.embedding_rate_limits(user_id, window_end);
CREATE INDEX IF NOT EXISTS idx_rate_limit_created ON public.embedding_rate_limits(created_at);

-- Pending queue indexes
CREATE INDEX IF NOT EXISTS idx_pending_queue_user_id ON public.embedding_pending_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_pending_queue_status ON public.embedding_pending_queue(status);
CREATE INDEX IF NOT EXISTS idx_pending_queue_created ON public.embedding_pending_queue(created_at);

-- Feed scores indexes
CREATE INDEX IF NOT EXISTS idx_feed_scores_user_id ON public.feed_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_scores_user_score ON public.feed_scores(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_feed_scores_post_id ON public.feed_scores(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_scores_created_at ON public.feed_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_scores_expires_at ON public.feed_scores(expires_at) WHERE expires_at IS NOT NULL;
-- Note: idx_feed_scores_active removed (duplicate of idx_feed_scores_user_score)

-- Events indexes
CREATE INDEX IF NOT EXISTS idx_events_actor_id ON public.events(actor_id);
CREATE INDEX IF NOT EXISTS idx_events_actor_created ON public.events(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_event_type ON public.events(event_type);
CREATE INDEX IF NOT EXISTS idx_events_event_type_created ON public.events(event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_target ON public.events(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_events_category ON public.events(event_category);
CREATE INDEX IF NOT EXISTS idx_events_created_at ON public.events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_session ON public.events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_metadata_gin ON public.events USING GIN (metadata);
CREATE INDEX IF NOT EXISTS idx_events_time_range ON public.events(created_at DESC, event_type);

-- User analytics indexes
CREATE INDEX IF NOT EXISTS idx_user_analytics_last_active ON public.user_analytics(last_active DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_engagement_score ON public.user_analytics(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_influence_score ON public.user_analytics(influence_score DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_match_rate ON public.user_analytics(match_acceptance_rate DESC);

-- Platform analytics indexes
CREATE INDEX IF NOT EXISTS idx_platform_analytics_date ON public.platform_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_dau ON public.platform_analytics(dau DESC);
CREATE INDEX IF NOT EXISTS idx_platform_analytics_new_users ON public.platform_analytics(new_users DESC);

-- Content moderation logs indexes
CREATE INDEX IF NOT EXISTS idx_moderation_logs_user_id ON public.content_moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_action ON public.content_moderation_logs(action);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_moderated_at ON public.content_moderation_logs(moderated_at DESC);

-- ============================================================================
-- SECTION 4: DROP EXISTING FUNCTIONS (for clean recreation)
-- ============================================================================
-- This ensures bulletproof upgrades from any previous version

DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.update_embedding_timestamp() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_notification_preferences() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_theme_preferences() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_embedding_generation() CASCADE;
DROP FUNCTION IF EXISTS public.increment_post_reaction_count() CASCADE;
DROP FUNCTION IF EXISTS public.decrement_post_reaction_count() CASCADE;
DROP FUNCTION IF EXISTS public.increment_post_comment_count() CASCADE;
DROP FUNCTION IF EXISTS public.decrement_post_comment_count() CASCADE;
DROP FUNCTION IF EXISTS public.increment_comment_like_count() CASCADE;
DROP FUNCTION IF EXISTS public.decrement_comment_like_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_conversation_last_message() CASCADE;
DROP FUNCTION IF EXISTS public.get_conversation(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.are_connected(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_embedding(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_embedding_status(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.regenerate_embedding(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_embedding_rate_limit(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.reset_embedding_rate_limit(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.queue_embedding_request(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_pending_queue_stats() CASCADE;
DROP FUNCTION IF EXISTS public.validate_embedding_before_insert() CASCADE;

-- ============================================================================
-- SECTION 5: TRIGGERS & FUNCTIONS
-- ============================================================================

-- --------------------------------------------
-- FUNCTION: update_updated_at_column
-- --------------------------------------------
-- Automatically updates the updated_at timestamp on row updates
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Apply updated_at triggers to all tables that need it
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_connections_updated_at ON public.connections;
CREATE TRIGGER update_connections_updated_at
    BEFORE UPDATE ON public.connections
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_match_preferences_updated_at ON public.match_preferences;
CREATE TRIGGER update_match_preferences_updated_at
    BEFORE UPDATE ON public.match_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_mentor_sessions_updated_at ON public.ai_mentor_sessions;
CREATE TRIGGER update_ai_mentor_sessions_updated_at
    BEFORE UPDATE ON public.ai_mentor_sessions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_theme_preferences_updated_at ON public.theme_preferences;
CREATE TRIGGER update_theme_preferences_updated_at
    BEFORE UPDATE ON public.theme_preferences
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- --------------------------------------------
-- FUNCTION: update_embedding_timestamp
-- --------------------------------------------
CREATE FUNCTION public.update_embedding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_embedding_timestamp ON public.profile_embeddings;
CREATE TRIGGER update_embedding_timestamp
    BEFORE UPDATE ON public.profile_embeddings
    FOR EACH ROW EXECUTE FUNCTION public.update_embedding_timestamp();

-- --------------------------------------------
-- FUNCTION: handle_new_user
-- --------------------------------------------
-- Creates profile record when auth.users row is inserted
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, onboarding_completed, profile_completion)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        false,
        25
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- --------------------------------------------
-- FUNCTION: handle_new_notification_preferences
-- --------------------------------------------
CREATE FUNCTION public.handle_new_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_created_notification ON public.profiles;
CREATE TRIGGER on_profile_created_notification
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_notification_preferences();

-- --------------------------------------------
-- FUNCTION: handle_new_theme_preferences
-- --------------------------------------------
CREATE FUNCTION public.handle_new_theme_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.theme_preferences (user_id, theme)
    VALUES (NEW.id, 'system');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_profile_created_theme ON public.profiles;
CREATE TRIGGER on_profile_created_theme
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_theme_preferences();

-- --------------------------------------------
-- FUNCTION: trigger_embedding_generation
-- --------------------------------------------
-- Triggers embedding generation when onboarding is completed
CREATE FUNCTION public.trigger_embedding_generation()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.onboarding_completed = TRUE AND OLD.onboarding_completed = FALSE THEN
        -- Queue embedding request
        INSERT INTO public.embedding_pending_queue (user_id, trigger_source, status)
        VALUES (NEW.id, 'onboarding', 'pending')
        ON CONFLICT (user_id) DO UPDATE
        SET status = 'pending', last_attempt = NOW();
        
        -- Also update profile_embeddings
        INSERT INTO public.profile_embeddings (user_id, status, last_updated)
        VALUES (NEW.id, 'pending', NOW())
        ON CONFLICT (user_id) DO UPDATE
        SET status = 'pending', last_updated = NOW(), embedding = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_generate_embedding ON public.profiles;
CREATE TRIGGER trigger_generate_embedding
    AFTER UPDATE OF onboarding_completed ON public.profiles
    FOR EACH ROW
    WHEN (NEW.onboarding_completed = TRUE AND OLD.onboarding_completed = FALSE)
    EXECUTE FUNCTION public.trigger_embedding_generation();

-- --------------------------------------------
-- FUNCTION: increment_post_reaction_count
-- --------------------------------------------
CREATE FUNCTION public.increment_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts SET reaction_count = reaction_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS increment_post_reaction_count_trigger ON public.post_reactions;
CREATE TRIGGER increment_post_reaction_count_trigger
    AFTER INSERT ON public.post_reactions
    FOR EACH ROW EXECUTE FUNCTION public.increment_post_reaction_count();

-- --------------------------------------------
-- FUNCTION: decrement_post_reaction_count
-- --------------------------------------------
CREATE FUNCTION public.decrement_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts SET reaction_count = GREATEST(reaction_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS decrement_post_reaction_count_trigger ON public.post_reactions;
CREATE TRIGGER decrement_post_reaction_count_trigger
    AFTER DELETE ON public.post_reactions
    FOR EACH ROW EXECUTE FUNCTION public.decrement_post_reaction_count();

-- --------------------------------------------
-- FUNCTION: increment_post_comment_count
-- --------------------------------------------
CREATE FUNCTION public.increment_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts SET comment_count = comment_count + 1 WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS increment_post_comment_count_trigger ON public.comments;
CREATE TRIGGER increment_post_comment_count_trigger
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.increment_post_comment_count();

-- --------------------------------------------
-- FUNCTION: decrement_post_comment_count
-- --------------------------------------------
CREATE FUNCTION public.decrement_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS decrement_post_comment_count_trigger ON public.comments;
CREATE TRIGGER decrement_post_comment_count_trigger
    AFTER DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.decrement_post_comment_count();

-- --------------------------------------------
-- FUNCTION: increment_comment_like_count
-- --------------------------------------------
CREATE FUNCTION public.increment_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.comments SET like_count = like_count + 1 WHERE id = NEW.comment_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS increment_comment_like_count_trigger ON public.comment_likes;
CREATE TRIGGER increment_comment_like_count_trigger
    AFTER INSERT ON public.comment_likes
    FOR EACH ROW EXECUTE FUNCTION public.increment_comment_like_count();

-- --------------------------------------------
-- FUNCTION: decrement_comment_like_count
-- --------------------------------------------
CREATE FUNCTION public.decrement_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.comments SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.comment_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS decrement_comment_like_count_trigger ON public.comment_likes;
CREATE TRIGGER decrement_comment_like_count_trigger
    AFTER DELETE ON public.comment_likes
    FOR EACH ROW EXECUTE FUNCTION public.decrement_comment_like_count();

-- --------------------------------------------
-- FUNCTION: update_conversation_last_message
-- --------------------------------------------
CREATE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.conversations
    SET 
        last_message_text = LEFT(NEW.text, 100),
        last_message_at = NEW.created_at,
        unread_count_1 = CASE WHEN participant_1 = NEW.sender_id THEN unread_count_1 ELSE unread_count_1 + 1 END,
        unread_count_2 = CASE WHEN participant_2 = NEW.sender_id THEN unread_count_2 ELSE unread_count_2 + 1 END
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_conversation_last_message_trigger ON public.messages;
CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW EXECUTE FUNCTION public.update_conversation_last_message();

-- ============================================================================
-- SECTION 5: HELPER FUNCTIONS
-- ============================================================================

-- --------------------------------------------
-- FUNCTION: get_conversation
-- --------------------------------------------
-- Returns conversation ID between two users
CREATE FUNCTION public.get_conversation(user1 UUID, user2 UUID)
RETURNS UUID AS $$
DECLARE
    conversation_id UUID;
BEGIN
    SELECT id INTO conversation_id
    FROM public.conversations
    WHERE (participant_1 = user1 AND participant_2 = user2)
       OR (participant_1 = user2 AND participant_2 = user1)
    LIMIT 1;
    RETURN conversation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: are_connected
-- --------------------------------------------
-- Checks if two users are connected
CREATE FUNCTION public.are_connected(user1 UUID, user2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.connections
        WHERE ((requester_id = user1 AND receiver_id = user2)
           OR (requester_id = user2 AND receiver_id = user1))
        AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: has_embedding
-- --------------------------------------------
-- Checks if user has a completed embedding
CREATE FUNCTION public.has_embedding(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    embedding_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO embedding_count
    FROM public.profile_embeddings
    WHERE user_id = $1 AND status = 'completed';
    RETURN embedding_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: get_embedding_status
-- --------------------------------------------
-- Returns embedding status for a user
CREATE FUNCTION public.get_embedding_status(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    status TEXT,
    last_updated TIMESTAMPTZ,
    has_embedding BOOLEAN,
    error_message TEXT,
    retry_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.user_id,
        pe.status,
        pe.last_updated,
        (pe.status = 'completed') AS has_embedding,
        pe.error_message,
        pe.retry_count
    FROM public.profile_embeddings pe
    WHERE pe.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: regenerate_embedding
-- --------------------------------------------
-- Manually triggers embedding regeneration
CREATE FUNCTION public.regenerate_embedding(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.profile_embeddings (user_id, status, last_updated, retry_count, error_message)
    VALUES (p_user_id, 'pending', NOW(), 0, NULL)
    ON CONFLICT (user_id) DO UPDATE
    SET status = 'pending', last_updated = NOW(), retry_count = 0, error_message = NULL, embedding = NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: check_embedding_rate_limit
-- --------------------------------------------
-- Returns: allowed (boolean), remaining (integer), reset_at (timestamptz)
CREATE FUNCTION public.check_embedding_rate_limit(p_user_id UUID)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
    v_record RECORD;
    v_remaining INTEGER;
BEGIN
    SELECT * INTO v_record
    FROM public.embedding_rate_limits
    WHERE user_id = p_user_id AND window_end > NOW()
    ORDER BY window_end DESC
    LIMIT 1;
    
    IF v_record IS NULL THEN
        INSERT INTO public.embedding_rate_limits (user_id, request_count)
        VALUES (p_user_id, 1)
        RETURNING * INTO v_record;
        RETURN QUERY SELECT TRUE, 2, v_record.window_end;
    END IF;
    
    v_remaining := 3 - v_record.request_count;
    
    IF v_remaining > 0 THEN
        UPDATE public.embedding_rate_limits
        SET request_count = request_count + 1, updated_at = NOW()
        WHERE id = v_record.id;
        RETURN QUERY SELECT TRUE, v_remaining - 1, v_record.window_end;
    ELSE
        RETURN QUERY SELECT FALSE, 0, v_record.window_end;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: reset_embedding_rate_limit
-- --------------------------------------------
-- Admin function to reset rate limit for a user
CREATE FUNCTION public.reset_embedding_rate_limit(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.embedding_rate_limits WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: queue_embedding_request
-- --------------------------------------------
-- Queues embedding request with duplicate prevention
CREATE FUNCTION public.queue_embedding_request(p_user_id UUID, p_trigger_source TEXT DEFAULT 'onboarding')
RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    -- Check if already queued or processing
    IF EXISTS (
        SELECT 1 FROM public.embedding_pending_queue
        WHERE user_id = p_user_id AND status IN ('pending', 'processing')
    ) THEN
        RAISE EXCEPTION 'Embedding request already pending for user %', p_user_id USING ERRCODE = '23505';
    END IF;
    
    -- Check if user already has completed embedding
    IF EXISTS (
        SELECT 1 FROM public.profile_embeddings
        WHERE user_id = p_user_id AND status = 'completed'
    ) THEN
        RAISE EXCEPTION 'User already has completed embedding';
    END IF;
    
    -- Insert pending request
    INSERT INTO public.embedding_pending_queue (user_id, trigger_source, status)
    VALUES (p_user_id, p_trigger_source, 'pending')
    RETURNING id INTO v_id;
    
    -- Notify workers
    NOTIFY embedding_queue_changed;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: get_pending_queue_stats
-- --------------------------------------------
-- Returns queue count by status
CREATE FUNCTION public.get_pending_queue_stats()
RETURNS TABLE (status TEXT, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT epq.status::TEXT, COUNT(*)::BIGINT
    FROM public.embedding_pending_queue epq
    GROUP BY epq.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_conversation(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.are_connected(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_embedding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_embedding_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_embedding(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_embedding_rate_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reset_embedding_rate_limit(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.queue_embedding_request(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_pending_queue_stats() TO authenticated;

-- ============================================================================
-- SECTION 5.5: ADDITIONAL HELPER FUNCTIONS
-- ============================================================================

-- --------------------------------------------
-- FUNCTION: get_pending_connection_count
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_pending_connection_count(target_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.connections
        WHERE receiver_id = target_user_id
        AND status = 'pending'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_pending_connection_count(UUID) IS 
'Get count of pending connection requests for a user';

GRANT EXECUTE ON FUNCTION public.get_pending_connection_count(UUID) TO authenticated;

-- --------------------------------------------
-- FUNCTION: validate_embedding_before_insert
-- --------------------------------------------
-- Prevents duplicate completed embeddings
CREATE OR REPLACE FUNCTION public.validate_embedding_before_insert()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.profile_embeddings
        WHERE user_id = NEW.user_id AND status = 'completed'
    ) THEN
        RAISE EXCEPTION 'User already has a completed embedding' USING ERRCODE = '23505';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.validate_embedding_before_insert TO service_role;

-- --------------------------------------------
-- FUNCTION: get_connection_status
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_connection_status(user1_id UUID, user2_id UUID)
RETURNS TEXT AS $$
DECLARE
    conn_status TEXT;
BEGIN
    SELECT status INTO conn_status
    FROM public.connections
    WHERE (requester_id = user1_id AND receiver_id = user2_id)
       OR (requester_id = user2_id AND receiver_id = user1_id)
    LIMIT 1;
    
    RETURN COALESCE(conn_status, 'not_connected');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_connection_status(UUID, UUID) IS 
'Get connection status between two users: pending, accepted, declined, blocked, or not_connected';

GRANT EXECUTE ON FUNCTION public.get_connection_status(UUID, UUID) TO authenticated;

-- --------------------------------------------
-- FUNCTION: get_unread_notification_count
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.notifications
        WHERE user_id = p_user_id
        AND is_read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_unread_notification_count(UUID) IS 
'Get count of unread notifications for a user';

GRANT EXECUTE ON FUNCTION public.get_unread_notification_count(UUID) TO authenticated;

-- --------------------------------------------
-- FUNCTION: get_comment_depth
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_comment_depth(p_comment_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_depth INTEGER := 0;
    v_parent_id UUID;
BEGIN
    SELECT parent_id INTO v_parent_id
    FROM public.comments
    WHERE id = p_comment_id;
    
    WHILE v_parent_id IS NOT NULL LOOP
        v_depth := v_depth + 1;
        
        SELECT parent_id INTO v_parent_id
        FROM public.comments
        WHERE id = v_parent_id;
    END LOOP;
    
    RETURN v_depth;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_comment_depth(UUID) IS 
'Get the nesting depth of a comment (0 = top-level, 1+ = reply depth)';

GRANT EXECUTE ON FUNCTION public.get_comment_depth(UUID) TO authenticated;

-- --------------------------------------------
-- FUNCTION: get_comment_replies_count
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_comment_replies_count(p_comment_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    WITH RECURSIVE reply_tree AS (
        SELECT id, parent_id
        FROM public.comments
        WHERE parent_id = p_comment_id
        
        UNION ALL
        
        SELECT c.id, c.parent_id
        FROM public.comments c
        INNER JOIN reply_tree rt ON c.parent_id = rt.id
    )
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM reply_tree;
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_comment_replies_count(UUID) IS 
'Get total count of all replies (including nested) for a comment';

GRANT EXECUTE ON FUNCTION public.get_comment_replies_count(UUID) TO authenticated;

-- --------------------------------------------
-- FUNCTION: get_profile_completion_percentage
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_profile_completion_percentage(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_completion INTEGER := 0;
    v_has_skills INTEGER := 0;
    v_has_interests INTEGER := 0;
    v_has_experience INTEGER := 0;
    v_has_projects INTEGER := 0;
BEGIN
    -- Basic profile (25%)
    SELECT COUNT(*)::INTEGER INTO v_completion
    FROM public.profiles
    WHERE id = p_user_id
    AND (
        (display_name IS NOT NULL AND display_name != '')
        OR (full_name IS NOT NULL AND full_name != '')
    )
    AND headline IS NOT NULL
    AND headline != '';
    
    IF v_completion > 0 THEN
        v_completion := 25;
    END IF;
    
    -- Skills (25%)
    SELECT COUNT(*)::INTEGER INTO v_has_skills
    FROM public.user_skills
    WHERE user_id = p_user_id;
    
    IF v_has_skills > 0 THEN
        v_completion := v_completion + 25;
    END IF;
    
    -- Interests (25%)
    SELECT COUNT(*)::INTEGER INTO v_has_interests
    FROM public.user_interests
    WHERE user_id = p_user_id;
    
    IF v_has_interests > 0 THEN
        v_completion := v_completion + 25;
    END IF;
    
    -- Experience or Projects (25%)
    SELECT COUNT(*)::INTEGER INTO v_has_experience
    FROM public.user_experiences
    WHERE user_id = p_user_id;
    
    SELECT COUNT(*)::INTEGER INTO v_has_projects
    FROM public.user_projects
    WHERE user_id = p_user_id;
    
    IF v_has_experience > 0 OR v_has_projects > 0 THEN
        v_completion := v_completion + 25;
    END IF;
    
    RETURN v_completion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

COMMENT ON FUNCTION public.get_profile_completion_percentage(UUID) IS 
'Calculate profile completion percentage (0-100) based on filled sections';

GRANT EXECUTE ON FUNCTION public.get_profile_completion_percentage(UUID) TO authenticated;

-- ============================================================================
-- SECTION 5.5: OPTIMISTIC LOCKING FUNCTIONS
-- ============================================================================
-- Functions for handling concurrent updates and preventing race conditions

-- --------------------------------------------
-- FUNCTION: increment_post_counter
-- --------------------------------------------
-- Atomic counter increment for reaction_count, comment_count, share_count
-- Prevents race conditions when multiple users react/comment simultaneously
CREATE OR REPLACE FUNCTION public.increment_post_counter(
  post_id UUID,
  counter_field TEXT,
  increment_by INTEGER DEFAULT 1
)
RETURNS INTEGER AS $$
DECLARE
  current_value INTEGER;
BEGIN
  UPDATE public.posts
  SET 
    reaction_count = CASE 
      WHEN counter_field = 'reaction_count' THEN reaction_count + increment_by 
      ELSE reaction_count 
    END,
    comment_count = CASE 
      WHEN counter_field = 'comment_count' THEN comment_count + increment_by 
      ELSE comment_count 
    END,
    share_count = CASE 
      WHEN counter_field = 'share_count' THEN share_count + increment_by 
      ELSE share_count 
    END,
    version = version + 1,
    updated_at = NOW()
  WHERE id = post_id
  RETURNING 
    CASE 
      WHEN counter_field = 'reaction_count' THEN reaction_count
      WHEN counter_field = 'comment_count' THEN comment_count
      WHEN counter_field = 'share_count' THEN share_count
    END INTO current_value;
  
  IF current_value IS NULL THEN
    RAISE EXCEPTION 'Post not found: %', post_id;
  END IF;
  
  RETURN current_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.increment_post_counter(UUID, TEXT, INTEGER) TO authenticated;

-- --------------------------------------------
-- FUNCTION: get_post_counter_with_lock
-- --------------------------------------------
-- Get counter value with row lock (for read-modify-write operations)
CREATE OR REPLACE FUNCTION public.get_post_counter_with_lock(
  post_id UUID,
  counter_field TEXT
)
RETURNS INTEGER AS $$
DECLARE
  counter_value INTEGER;
BEGIN
  SELECT 
    CASE 
      WHEN counter_field = 'reaction_count' THEN reaction_count
      WHEN counter_field = 'comment_count' THEN comment_count
      WHEN counter_field = 'share_count' THEN share_count
    END INTO counter_value
  FROM public.posts
  WHERE id = post_id
  FOR UPDATE;
  
  RETURN counter_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_post_counter_with_lock(UUID, TEXT) TO authenticated;

-- --------------------------------------------
-- FUNCTION: posts_bump_version
-- --------------------------------------------
-- Trigger function to auto-increment version on post updates
CREATE OR REPLACE FUNCTION public.posts_bump_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only bump version if it wasn't already incremented
  IF NEW.version = OLD.version THEN
    NEW.version = OLD.version + 1;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS posts_bump_version_trigger ON public.posts;
CREATE TRIGGER posts_bump_version_trigger
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.posts_bump_version();

-- ============================================================================
-- SECTION 5.6: NEW ML FEATURE FUNCTIONS
-- ============================================================================

-- --------------------------------------------
-- FUNCTION: find_similar_users
-- --------------------------------------------
-- Find users with similar embeddings using pgvector
CREATE OR REPLACE FUNCTION public.find_similar_users(
    query_embedding VECTOR(384),
    match_limit INTEGER DEFAULT 50,
    exclude_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    user_id UUID,
    display_name TEXT,
    headline TEXT,
    avatar_url TEXT,
    location TEXT,
    similarity_score REAL,
    profile_completion INTEGER,
    is_online BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.display_name,
        p.headline,
        p.avatar_url,
        p.location,
        (1 - (pe.embedding <-> query_embedding)) as similarity_score,
        p.profile_completion,
        COALESCE((ua.last_active > NOW() - INTERVAL '5 minutes'), false) as is_online
    FROM profiles p
    INNER JOIN profile_embeddings pe ON p.id = pe.user_id
    LEFT JOIN user_analytics ua ON p.id = ua.user_id
    WHERE p.id != COALESCE(exclude_user_id, p.id)
        AND p.onboarding_completed = true
        AND p.id NOT IN (
            SELECT receiver_id FROM connections 
            WHERE requester_id = exclude_user_id AND status = 'accepted'
            UNION
            SELECT requester_id FROM connections 
            WHERE receiver_id = exclude_user_id AND status = 'accepted'
        )
        AND p.id NOT IN (
            SELECT receiver_id FROM connections 
            WHERE requester_id = exclude_user_id AND status = 'pending'
            UNION
            SELECT requester_id FROM connections 
            WHERE receiver_id = exclude_user_id AND status = 'pending'
        )
        AND p.id NOT IN (
            SELECT receiver_id FROM connections 
            WHERE requester_id = exclude_user_id AND status = 'declined'
            UNION
            SELECT requester_id FROM connections 
            WHERE receiver_id = exclude_user_id AND status = 'declined'
        )
        AND p.id NOT IN (
            SELECT blocked_id FROM blocked_users WHERE blocker_id = exclude_user_id
            UNION
            SELECT blocker_id FROM blocked_users WHERE blocked_id = exclude_user_id
        )
        AND p.id NOT IN (
            SELECT matched_user_id FROM match_suggestions
            WHERE user_id = exclude_user_id 
            AND created_at > NOW() - INTERVAL '30 days'
        )
    ORDER BY pe.embedding <-> query_embedding
    LIMIT match_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: get_user_skills
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_skills(p_user_id UUID)
RETURNS TABLE (
    skill_id UUID,
    name TEXT,
    category TEXT,
    proficiency_level TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        us.id as skill_id,
        us.skill_name as name,
        NULL::TEXT as category,
        us.proficiency as proficiency_level
    FROM user_skills us
    WHERE us.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: get_user_interests
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_interests(p_user_id UUID)
RETURNS TABLE (
    interest_id UUID,
    name TEXT,
    category TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ui.id as interest_id,
        ui.interest as name,
        NULL::TEXT as category
    FROM user_interests ui
    WHERE ui.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: calculate_skills_overlap
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.calculate_skills_overlap(
    user1_id UUID,
    user2_id UUID
)
RETURNS TABLE (
    overlap_ratio REAL,
    user1_skills TEXT[],
    user2_skills TEXT[],
    shared_skills TEXT[],
    complementary_skills TEXT[]
) AS $$
DECLARE
    user1_skill_names TEXT[];
    user2_skill_names TEXT[];
    shared_skill_names TEXT[];
    all_skill_names TEXT[];
BEGIN
    SELECT ARRAY_AGG(skill_name) INTO user1_skill_names
    FROM user_skills WHERE user_id = user1_id;
    
    SELECT ARRAY_AGG(skill_name) INTO user2_skill_names
    FROM user_skills WHERE user_id = user2_id;
    
    IF user1_skill_names IS NULL OR user2_skill_names IS NULL THEN
        overlap_ratio := 0;
        user1_skills := ARRAY[]::TEXT[];
        user2_skills := ARRAY[]::TEXT[];
        shared_skills := ARRAY[]::TEXT[];
        complementary_skills := ARRAY[]::TEXT[];
        RETURN NEXT;
        RETURN;
    END IF;
    
    SELECT ARRAY(
        SELECT UNNEST(user1_skill_names)
        INTERSECT
        SELECT UNNEST(user2_skill_names)
    ) INTO shared_skill_names;
    
    SELECT ARRAY(
        SELECT UNNEST(user1_skill_names)
        UNION
        SELECT UNNEST(user2_skill_names)
    ) INTO all_skill_names;
    
    IF array_length(all_skill_names, 1) > 0 THEN
        overlap_ratio := array_length(shared_skill_names, 1)::REAL / array_length(all_skill_names, 1)::REAL;
    ELSE
        overlap_ratio := 0;
    END IF;
    
    user1_skills := user1_skill_names;
    user2_skills := user2_skill_names;
    shared_skills := shared_skill_names;
    
    -- Get complementary skills (skills one has but other doesn't)
    SELECT ARRAY_AGG(DISTINCT skill) INTO complementary_skills
    FROM (
        SELECT UNNEST(user1_skill_names) AS skill
        EXCEPT
        SELECT UNNEST(user2_skill_names)
        UNION
        SELECT UNNEST(user2_skill_names) AS skill
        EXCEPT
        SELECT UNNEST(user1_skill_names)
    ) AS complementary;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: get_users_needing_matches
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_users_needing_matches()
RETURNS TABLE (id UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT p.id
    FROM profiles p
    WHERE p.onboarding_completed = true
        AND p.id IN (SELECT user_id FROM profile_embeddings WHERE status = 'completed')
        AND NOT EXISTS (
            SELECT 1 FROM match_suggestions ms
            WHERE ms.user_id = p.id
                AND ms.created_at > NOW() - INTERVAL '7 days'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: cleanup_old_match_suggestions
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.cleanup_old_match_suggestions(retention_days INTEGER DEFAULT 30)
RETURNS VOID AS $$
BEGIN
    DELETE FROM match_scores
    WHERE suggestion_id IN (
        SELECT id FROM match_suggestions
        WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL
    );
    
    DELETE FROM match_suggestions
    WHERE created_at < NOW() - (retention_days || ' days')::INTERVAL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- --------------------------------------------
-- FUNCTION: get_user_match_stats
-- --------------------------------------------
CREATE OR REPLACE FUNCTION public.get_user_match_stats(p_user_id UUID)
RETURNS TABLE (
    total_suggestions INTEGER,
    accepted_count INTEGER,
    pending_count INTEGER,
    avg_match_score REAL,
    high_confidence_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_suggestions,
        COUNT(CASE WHEN c.status = 'accepted' THEN 1 END)::INTEGER as accepted_count,
        COUNT(CASE WHEN c.status = 'pending' THEN 1 END)::INTEGER as pending_count,
        AVG(ms.match_percentage)::REAL as avg_match_score,
        COUNT(CASE WHEN ms.match_percentage >= 80 THEN 1 END)::INTEGER as high_confidence_count
    FROM match_suggestions ms
    LEFT JOIN connections c ON (
        (c.requester_id = ms.user_id AND c.receiver_id = ms.matched_user_id) OR
        (c.receiver_id = ms.user_id AND c.requester_id = ms.matched_user_id)
    )
    WHERE ms.user_id = p_user_id
        AND ms.created_at > NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Grant permissions for new functions
GRANT EXECUTE ON FUNCTION public.find_similar_users(VECTOR, INTEGER, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_skills(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_interests(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_skills_overlap(UUID, UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_users_needing_matches() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_old_match_suggestions(INTEGER) TO service_role;
GRANT EXECUTE ON FUNCTION public.get_user_match_stats(UUID) TO authenticated;

-- ============================================================================
-- SECTION 6: ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Drop ALL existing policies first (prevents conflicts on re-run)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I CASCADE', 
            pol.policyname, pol.schemaname, pol.tablename);
    END LOOP;
END $$;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_interests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_mentor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_mentor_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.theme_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profile_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embedding_dead_letter_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embedding_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.embedding_pending_queue ENABLE ROW LEVEL SECURITY;
-- ML Feature Tables - Enable RLS
ALTER TABLE public.feed_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_moderation_logs ENABLE ROW LEVEL SECURITY;

-- --------------------------------------------
-- PROFILES RLS
-- --------------------------------------------
CREATE POLICY "Users can view any profile" ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

-- --------------------------------------------
-- USER SKILLS RLS
-- --------------------------------------------

CREATE POLICY "Users can view any skills" ON public.user_skills FOR SELECT USING (true);
CREATE POLICY "Users can manage own skills" ON public.user_skills FOR ALL USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- USER INTERESTS RLS
-- --------------------------------------------
CREATE POLICY "Users can view any interests" ON public.user_interests FOR SELECT USING (true);

CREATE POLICY "Users can manage own interests" ON public.user_interests FOR ALL USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- USER EXPERIENCES RLS
-- --------------------------------------------
CREATE POLICY "Users can view any experiences" ON public.user_experiences FOR SELECT USING (true);

CREATE POLICY "Users can manage own experiences" ON public.user_experiences FOR ALL USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- USER PROJECTS RLS
-- --------------------------------------------
CREATE POLICY "Users can view projects" ON public.user_projects 
    FOR SELECT USING (is_public = TRUE OR user_id = (SELECT auth.uid()));

CREATE POLICY "Users can manage own projects" ON public.user_projects FOR ALL USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- POSTS RLS
-- --------------------------------------------
CREATE POLICY "Users can view posts" ON public.posts FOR SELECT USING (is_archived = FALSE);

CREATE POLICY "Users can create posts" ON public.posts FOR INSERT WITH CHECK ((SELECT auth.uid()) = author_id);

CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING ((SELECT auth.uid()) = author_id);

CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING ((SELECT auth.uid()) = author_id);

-- --------------------------------------------
-- POST ATTACHMENTS RLS
-- --------------------------------------------
CREATE POLICY "Users can view post attachments" ON public.post_attachments
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_attachments.post_id AND p.is_archived = FALSE));

CREATE POLICY "Users can create post attachments" ON public.post_attachments
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_attachments.post_id AND p.author_id = (SELECT auth.uid())));

CREATE POLICY "Users can delete post attachments" ON public.post_attachments
    FOR DELETE USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_attachments.post_id AND p.author_id = (SELECT auth.uid())));

-- --------------------------------------------
-- POST REACTIONS RLS
-- --------------------------------------------
CREATE POLICY "Users can view post reactions" ON public.post_reactions
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_reactions.post_id AND p.is_archived = FALSE));

CREATE POLICY "Users can create post reactions" ON public.post_reactions FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own post reactions" ON public.post_reactions FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- COMMENTS RLS
-- --------------------------------------------
CREATE POLICY "Users can view comments" ON public.comments
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND p.is_archived = FALSE));

CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = author_id AND EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND p.is_archived = FALSE));

CREATE POLICY "Users can update own comments" ON public.comments FOR UPDATE USING ((SELECT auth.uid()) = author_id);

CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING ((SELECT auth.uid()) = author_id);

-- --------------------------------------------
-- COMMENT LIKES RLS
-- --------------------------------------------
CREATE POLICY "Users can view comment likes" ON public.comment_likes
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.comments c JOIN public.posts p ON c.post_id = p.id WHERE c.id = comment_likes.comment_id AND p.is_archived = FALSE));

CREATE POLICY "Users can create comment likes" ON public.comment_likes FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own comment likes" ON public.comment_likes FOR DELETE USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- CONNECTIONS RLS
-- --------------------------------------------
CREATE POLICY "Users can view their connections" ON public.connections FOR SELECT USING (requester_id = (SELECT auth.uid()) OR receiver_id = (SELECT auth.uid()));

CREATE POLICY "Users can create connection requests" ON public.connections FOR INSERT WITH CHECK ((SELECT auth.uid()) = requester_id AND receiver_id != auth.uid());

CREATE POLICY "Users can update connection status" ON public.connections FOR UPDATE USING ((SELECT auth.uid()) = receiver_id OR (SELECT auth.uid()) = requester_id);

CREATE POLICY "Users can delete own pending requests" ON public.connections FOR DELETE USING ((SELECT auth.uid()) = requester_id AND status = 'pending');

-- --------------------------------------------
-- MATCH SUGGESTIONS RLS
-- --------------------------------------------
CREATE POLICY "Users can view own match suggestions" ON public.match_suggestions FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Service role can insert match suggestions" ON public.match_suggestions FOR INSERT WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Users can update suggestion status" ON public.match_suggestions FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- MATCH SCORES RLS
-- --------------------------------------------
CREATE POLICY "Service role can view match scores" ON public.match_scores FOR SELECT USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Service role can insert match scores" ON public.match_scores FOR INSERT WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- --------------------------------------------
-- MATCH ACTIVITY RLS
-- --------------------------------------------
CREATE POLICY "Users can view own match activity" ON public.match_activity FOR SELECT USING ((SELECT auth.uid()) = target_user_id);

CREATE POLICY "Service role can insert match activity" ON public.match_activity FOR INSERT WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Users can update match activity" ON public.match_activity FOR UPDATE USING ((SELECT auth.uid()) = target_user_id);

-- --------------------------------------------
-- MATCH PREFERENCES RLS
-- --------------------------------------------
CREATE POLICY "Users can view own match preferences" ON public.match_preferences FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can manage own match preferences" ON public.match_preferences FOR ALL USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- CONVERSATIONS RLS
-- --------------------------------------------
CREATE POLICY "Users can view own conversations" ON public.conversations FOR SELECT USING (participant_1 = (SELECT auth.uid()) OR participant_2 = (SELECT auth.uid()));

CREATE POLICY "Service role can create conversations" ON public.conversations FOR INSERT WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Users can update own conversations" ON public.conversations FOR UPDATE USING (participant_1 = (SELECT auth.uid()) OR participant_2 = (SELECT auth.uid()));

CREATE POLICY "Users can delete own conversations" ON public.conversations FOR DELETE USING (participant_1 = (SELECT auth.uid()) OR participant_2 = (SELECT auth.uid()));

-- --------------------------------------------
-- MESSAGES RLS
-- --------------------------------------------
CREATE POLICY "Users can view conversation messages" ON public.messages
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.participant_1 = (SELECT auth.uid()) OR c.participant_2 = (SELECT auth.uid()))));

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.participant_1 = (SELECT auth.uid()) OR c.participant_2 = (SELECT auth.uid()))));

CREATE POLICY "Users can update own messages" ON public.messages FOR UPDATE USING ((SELECT auth.uid()) = sender_id);

CREATE POLICY "Users can delete own messages" ON public.messages FOR DELETE USING ((SELECT auth.uid()) = sender_id);

-- --------------------------------------------
-- NOTIFICATIONS RLS
-- --------------------------------------------
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Service role can insert notifications" ON public.notifications FOR INSERT WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- AI MENTOR SESSIONS RLS
-- --------------------------------------------
CREATE POLICY "Users can view own AI mentor sessions" ON public.ai_mentor_sessions FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can create AI mentor sessions" ON public.ai_mentor_sessions FOR INSERT WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own AI mentor sessions" ON public.ai_mentor_sessions FOR UPDATE USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- AI MENTOR MESSAGES RLS
-- --------------------------------------------
CREATE POLICY "Users can view own AI mentor messages" ON public.ai_mentor_messages
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.ai_mentor_sessions s WHERE s.id = ai_mentor_messages.session_id AND s.user_id = (SELECT auth.uid())));

CREATE POLICY "Users can create AI mentor messages" ON public.ai_mentor_messages
    FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.ai_mentor_sessions s WHERE s.id = ai_mentor_messages.session_id AND s.user_id = (SELECT auth.uid())));

-- --------------------------------------------
-- NOTIFICATION PREFERENCES RLS
-- --------------------------------------------
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences FOR ALL USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- THEME PREFERENCES RLS
-- --------------------------------------------
CREATE POLICY "Users can view own theme preferences" ON public.theme_preferences FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can manage own theme preferences" ON public.theme_preferences FOR ALL USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- PROFILE EMBEDDINGS RLS
-- --------------------------------------------
CREATE POLICY "Users can view own embedding status" ON public.profile_embeddings FOR SELECT USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Service role can manage embeddings" ON public.profile_embeddings FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- --------------------------------------------
-- DEAD LETTER QUEUE RLS
-- --------------------------------------------
CREATE POLICY "service_role_manage_dlq" ON public.embedding_dead_letter_queue FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "users_view_own_dlq" ON public.embedding_dead_letter_queue FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- RATE LIMITS RLS
-- --------------------------------------------
CREATE POLICY "service_role_manage_rate_limits" ON public.embedding_rate_limits FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "users_view_own_rate_limits" ON public.embedding_rate_limits FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- PENDING QUEUE RLS
-- --------------------------------------------
CREATE POLICY "service_role_manage_pending_queue" ON public.embedding_pending_queue FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

CREATE POLICY "users_view_own_pending_queue" ON public.embedding_pending_queue FOR SELECT USING ((SELECT auth.uid()) = user_id);

-- --------------------------------------------
-- FEED SCORES RLS
-- --------------------------------------------
CREATE POLICY "Users can view own feed scores" ON public.feed_scores FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role can manage feed scores" ON public.feed_scores FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- --------------------------------------------
-- EVENTS RLS
-- --------------------------------------------
CREATE POLICY "Users can view own events" ON public.events FOR SELECT USING (actor_id = (SELECT auth.uid()));

CREATE POLICY "Service role can manage events" ON public.events FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- --------------------------------------------
-- USER ANALYTICS RLS
-- --------------------------------------------
CREATE POLICY "Users can view own analytics" ON public.user_analytics FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users can update own analytics" ON public.user_analytics FOR UPDATE USING (user_id = (SELECT auth.uid())) WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role can manage analytics" ON public.user_analytics FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- --------------------------------------------
-- PLATFORM ANALYTICS RLS
-- --------------------------------------------
CREATE POLICY "Authenticated users can view platform analytics" ON public.platform_analytics FOR SELECT USING ((select auth.role()) = 'authenticated');

CREATE POLICY "Service role can manage platform analytics" ON public.platform_analytics FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- --------------------------------------------
-- CONTENT MODERATION LOGS RLS
-- --------------------------------------------
CREATE POLICY "Service role can manage moderation logs" ON public.content_moderation_logs FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- ============================================================================
-- SECTION 7: REALTIME
-- ============================================================================

-- Add all tables to realtime publication (ignore if already exists)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_skills;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_interests;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_experiences;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_projects;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_attachments;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.post_reactions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comment_likes;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_suggestions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_scores;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_activity;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.match_preferences;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_mentor_sessions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_mentor_messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notification_preferences;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.theme_preferences;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.profile_embeddings;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.embedding_dead_letter_queue;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.embedding_rate_limits;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.embedding_pending_queue;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_scores;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.events;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_analytics;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.platform_analytics;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.content_moderation_logs;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================================
-- SECTION 8: STORAGE BUCKETS
-- ============================================================================

-- Drop storage policies first (storage.objects policies aren't in pg_policies)
DROP POLICY IF EXISTS "Public read access to post-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload to post-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update own files in post-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete own files in post-media" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to profile-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload to profile-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update own files in profile-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete own files in profile-media" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to project-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload to project-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update own files in project-media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete own files in project-media" ON storage.objects;

-- Create storage buckets (idempotent with ON CONFLICT)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('post-media', 'post-media', true, 52428800, ARRAY['image/*', 'video/*', 'application/pdf']),
    ('profile-media', 'profile-media', true, 10485760, ARRAY['image/*']),
    ('project-media', 'project-media', true, 10485760, ARRAY['image/*'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- --------------------------------------------
-- STORAGE POLICIES: post-media
-- --------------------------------------------
CREATE POLICY "Public read access to post-media" ON storage.objects FOR SELECT USING (bucket_id = 'post-media');

CREATE POLICY "Authenticated upload to post-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'post-media' AND (SELECT auth.jwt() ->> 'role') = 'authenticated');

CREATE POLICY "Authenticated update own files in post-media" ON storage.objects FOR UPDATE USING (bucket_id = 'post-media' AND (SELECT auth.uid()) = owner);

CREATE POLICY "Authenticated delete own files in post-media" ON storage.objects FOR DELETE USING (bucket_id = 'post-media' AND (SELECT auth.uid()) = owner);

-- --------------------------------------------
-- STORAGE POLICIES: profile-media
-- --------------------------------------------
CREATE POLICY "Public read access to profile-media" ON storage.objects FOR SELECT USING (bucket_id = 'profile-media');

CREATE POLICY "Authenticated upload to profile-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'profile-media' AND (SELECT auth.jwt() ->> 'role') = 'authenticated');

CREATE POLICY "Authenticated update own files in profile-media" ON storage.objects FOR UPDATE USING (bucket_id = 'profile-media' AND (SELECT auth.uid()) = owner);

CREATE POLICY "Authenticated delete own files in profile-media" ON storage.objects FOR DELETE USING (bucket_id = 'profile-media' AND (SELECT auth.uid()) = owner);

-- --------------------------------------------
-- STORAGE POLICIES: project-media
-- --------------------------------------------
CREATE POLICY "Public read access to project-media" ON storage.objects FOR SELECT USING (bucket_id = 'project-media');

CREATE POLICY "Authenticated upload to project-media" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-media' AND (SELECT auth.jwt() ->> 'role') = 'authenticated');

CREATE POLICY "Authenticated update own files in project-media" ON storage.objects FOR UPDATE USING (bucket_id = 'project-media' AND (SELECT auth.uid()) = owner);

CREATE POLICY "Authenticated delete own files in project-media" ON storage.objects FOR DELETE USING (bucket_id = 'project-media' AND (SELECT auth.uid()) = owner);

-- ============================================================================
-- SECTION 9: TABLE COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE public.profile_embeddings IS 'Vector embeddings for semantic profile matching (384 dimensions, all-MiniLM-L6-v2)';
COMMENT ON TABLE public.embedding_dead_letter_queue IS 'Dead letter queue for failed embedding generation with automatic retry';
COMMENT ON TABLE public.embedding_rate_limits IS 'Rate limiting for embedding generation (3 requests/hour/user)';
COMMENT ON TABLE public.embedding_pending_queue IS 'Queue for pending embedding requests from onboarding';
COMMENT ON TABLE public.privacy_settings IS 'User-controlled privacy settings for profile visibility and data sharing';
COMMENT ON TABLE public.blocked_users IS 'User blocking system to prevent unwanted interactions';
COMMENT ON TABLE public.messages IS 'Direct messages between users with read receipts (read_at timestamp)';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- 
-- ✅ 31 Tables created (26 core + 5 ML features)
-- ✅ 80+ Indexes created (including HNSW for vector search)
-- ✅ 25+ Triggers created
-- ✅ 60+ RLS policies created
-- ✅ 35+ Helper functions created (ALL consolidated from deprecated files)
-- ✅ 3 Storage buckets configured
-- ✅ All tables added to realtime
-- ✅ SECURITY: All functions have SECURITY DEFINER SET search_path = public
--
-- ML FEATURES:
-- - feed_scores: Personalized feed ranking with Thompson Sampling
-- - events: Central event store for real-time processing
-- - user_analytics: Per-user engagement metrics
-- - platform_analytics: Daily aggregated platform metrics
-- - content_moderation_logs: AI content moderation audit trail
--
-- MATCH SYSTEM:
-- - find_similar_users: pgvector cosine similarity search
-- - get_user_skills: User skills retrieval
-- - get_user_interests: User interests retrieval
-- - calculate_skills_overlap: Jaccard similarity
-- - calculate_match_percentage: Basic match scoring
-- - get_shared_skills: Shared skills array
-- - get_shared_interests: Shared interests array
-- - get_users_needing_matches: Batch job query
-- - cleanup_old_match_suggestions: Maintenance (30-day retention)
-- - get_user_match_stats: User match statistics
--
-- CONNECTION HELPERS:
-- - get_pending_connection_count: Pending requests count
-- - get_connection_status: Status between users
--
-- NOTIFICATION HELPERS:
-- - get_unread_notification_count: Unread count
--
-- COMMENT HELPERS:
-- - get_comment_depth: Nesting level
-- - get_comment_replies_count: Total replies (recursive)
--
-- PROFILE HELPERS:
-- - get_profile_completion_percentage: Completion (0-100%)
--
-- EMBEDDING SYSTEM:
-- - profile_embeddings: 384-dimension vectors with HNSW index
-- - embedding_dead_letter_queue: Failed retry queue (3 retries max)
-- - embedding_rate_limits: 3 requests/hour/user limit
-- - embedding_pending_queue: Reliable onboarding queue
-- - check_embedding_rate_limit: Rate limit checker (100/hour)
-- - queue_embedding_request: Queue management
-- - get_pending_queue_stats: Queue statistics
--
-- DEPRECATED FILES (functionality merged into this file):
-- - supabase/setup/99-rate-limit-function.sql ❌ DELETED
-- - supabase/setup/100-helper-functions.sql ❌ DELETED
--
-- ✅ 31 Tables created (26 core + 5 ML features)
-- ✅ 80+ Indexes created (including HNSW for vector search)
-- ✅ 25+ Triggers created
-- ✅ 60+ RLS policies created
-- ✅ 25+ Helper functions created
-- ✅ 3 Storage buckets configured
-- ✅ All tables added to realtime
-- ✅ SECURITY: All functions have SECURITY DEFINER SET search_path = public
--
-- ML FEATURES (NEW):
-- - feed_scores: Personalized feed ranking with Thompson Sampling
-- - events: Central event store for real-time processing
-- - user_analytics: Per-user engagement metrics
-- - platform_analytics: Daily aggregated platform metrics
-- - content_moderation_logs: AI content moderation audit trail
--
-- MATCH SYSTEM:
-- - find_similar_users: pgvector cosine similarity search
-- - get_user_skills: User skills retrieval
-- - get_user_interests: User interests retrieval
-- - calculate_skills_overlap: Jaccard similarity for skills
-- - get_users_needing_matches: Batch job query
-- - cleanup_old_match_suggestions: Maintenance (30-day retention)
-- - get_user_match_stats: User match statistics
--
-- EMBEDDING SYSTEM:
-- - profile_embeddings: 384-dimension vectors with HNSW index
-- - embedding_dead_letter_queue: Failed retry queue (3 retries max)
-- - embedding_rate_limits: 3 requests/hour/user limit
-- - embedding_pending_queue: Reliable onboarding queue
--
-- VERIFICATION:
-- 1. Verify tables: SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
--    Expected: 27 (26 tables + storage.objects)
-- 2. Test embedding: SELECT * FROM public.get_pending_queue_stats();
-- 3. Check health: SELECT * FROM public.get_embedding_status('your-user-uuid');
--
-- DOCUMENTATION:
-- - Schema: supabase/setup/99-master-all-tables.sql (this file)
-- - Objects: expected-objects/ (column-level docs)
-- - Guides: docs/ (implementation guides)
-- - Alignment: docs/DATABASE-SCHEMA-ALIGNMENT.md (verification report)
--
-- ============================================================================

-- ============================================================================
-- SECTION 2.6: PRIVACY & SECURITY TABLES
-- ============================================================================
-- These tables handle user privacy, blocking, and audit logging

-- --------------------------------------------
-- TABLE: privacy_settings
-- --------------------------------------------
-- User-controlled privacy settings for profile visibility and data sharing
CREATE TABLE IF NOT EXISTS public.privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    profile_visibility TEXT NOT NULL DEFAULT 'public' CHECK (profile_visibility IN ('public', 'friends-only', 'private')),
    show_email BOOLEAN NOT NULL DEFAULT FALSE,
    show_connections_list BOOLEAN NOT NULL DEFAULT TRUE,
    activity_status_visible BOOLEAN NOT NULL DEFAULT TRUE,
    allow_data_download BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_privacy_settings_user_id ON public.privacy_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_privacy_settings_visibility ON public.privacy_settings(profile_visibility);

-- --------------------------------------------
-- TABLE: blocked_users
-- --------------------------------------------
-- User blocking system to prevent unwanted interactions
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(blocker_id, blocked_id),
    CHECK (blocker_id != blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_users_blocker ON public.blocked_users(blocker_id);
CREATE INDEX IF NOT EXISTS idx_blocked_users_blocked ON public.blocked_users(blocked_id);

-- --------------------------------------------
-- TABLE: audit_logs
-- --------------------------------------------
-- Security audit trail for user actions and system events
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_details ON public.audit_logs USING GIN(details);

COMMENT ON TABLE public.audit_logs IS 'Security audit trail for user actions and system events';

-- ============================================================================
-- SECTION 5.7: NOTIFICATION TRIGGERS
-- ============================================================================

-- notify_connection_request
CREATE OR REPLACE FUNCTION notify_connection_request()
RETURNS trigger AS $$
BEGIN
  INSERT INTO notifications (user_id, type, actor_id, content, resource_type, resource_id)
  VALUES (NEW.receiver_id, 'connect', NEW.requester_id, 'sent you a connection request', 'profile', NEW.requester_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS notify_connection_request_trigger ON public.connections;
CREATE TRIGGER notify_connection_request_trigger
  AFTER INSERT ON connections
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION notify_connection_request();

-- notify_post_reaction
CREATE OR REPLACE FUNCTION notify_post_reaction()
RETURNS trigger AS $$
DECLARE
  post_author uuid;
BEGIN
  SELECT author_id INTO post_author FROM posts WHERE posts.id = NEW.post_id;
  IF post_author IS NOT NULL AND post_author != NEW.user_id THEN
    INSERT INTO notifications (user_id, type, actor_id, content, resource_type, resource_id)
    VALUES (post_author, 'like', NEW.user_id, 'liked your post', 'post', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS notify_post_reaction_trigger ON public.post_reactions;
CREATE TRIGGER notify_post_reaction_trigger
  AFTER INSERT ON post_reactions
  FOR EACH ROW
  EXECUTE FUNCTION notify_post_reaction();

-- notify_new_comment
CREATE OR REPLACE FUNCTION notify_new_comment()
RETURNS trigger AS $$
DECLARE
  post_author uuid;
BEGIN
  SELECT author_id INTO post_author FROM posts WHERE posts.id = NEW.post_id;
  IF post_author IS NOT NULL AND post_author != NEW.author_id THEN
    INSERT INTO notifications (user_id, type, actor_id, content, resource_type, resource_id)
    VALUES (post_author, 'comment', NEW.author_id, 'commented on your post', 'post', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS notify_new_comment_trigger ON public.comments;
CREATE TRIGGER notify_new_comment_trigger
  AFTER INSERT ON comments
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_comment();

-- notify_new_message
CREATE OR REPLACE FUNCTION notify_new_message()
RETURNS trigger AS $$
DECLARE
  other_participant uuid;
BEGIN
  SELECT CASE 
    WHEN conversations.participant_1 = NEW.sender_id THEN conversations.participant_2
    ELSE conversations.participant_1
  END INTO other_participant
  FROM conversations WHERE conversations.id = NEW.conversation_id;
  
  IF other_participant IS NOT NULL AND other_participant != NEW.sender_id THEN
    INSERT INTO notifications (user_id, type, actor_id, content, resource_type, resource_id)
    VALUES (other_participant, 'message', NEW.sender_id, 'sent you a message', 'conversation', NEW.conversation_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS notify_new_message_trigger ON public.messages;
CREATE TRIGGER notify_new_message_trigger
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_message();

-- notify_match_suggested
CREATE OR REPLACE FUNCTION notify_match_suggested()
RETURNS trigger AS $$
DECLARE
  matched_user_profile record;
BEGIN
  IF NEW.match_percentage >= 80 THEN
    SELECT display_name, headline INTO matched_user_profile
    FROM profiles WHERE id = NEW.matched_user_id;
    
    IF matched_user_profile.display_name IS NOT NULL THEN
      INSERT INTO notifications (user_id, type, actor_id, content, resource_type, resource_id)
      VALUES (NEW.user_id, 'match', NEW.matched_user_id, 
        format('You have a %s%% match with %s!', NEW.match_percentage::text, matched_user_profile.display_name),
        'match', NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS notify_match_suggested_trigger ON public.match_suggestions;
CREATE TRIGGER notify_match_suggested_trigger
  AFTER INSERT ON match_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION notify_match_suggested();

-- notify_connection_accepted
CREATE OR REPLACE FUNCTION notify_connection_accepted()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, type, actor_id, content, resource_type, resource_id)
    VALUES (NEW.requester_id, 'connect', NEW.receiver_id, 'accepted your connection request', 'profile', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS notify_connection_accepted_trigger ON public.connections;
CREATE TRIGGER notify_connection_accepted_trigger
  AFTER UPDATE ON connections
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'accepted')
  EXECUTE FUNCTION notify_connection_accepted();

GRANT EXECUTE ON FUNCTION notify_connection_request TO service_role;
GRANT EXECUTE ON FUNCTION notify_post_reaction TO service_role;
GRANT EXECUTE ON FUNCTION notify_new_comment TO service_role;
GRANT EXECUTE ON FUNCTION notify_new_message TO service_role;
GRANT EXECUTE ON FUNCTION notify_match_suggested TO service_role;
GRANT EXECUTE ON FUNCTION notify_connection_accepted TO service_role;

-- ============================================================================
-- SECTION 5.8: EVENT CAPTURE TRIGGERS
-- ============================================================================

-- Generic event capture
CREATE OR REPLACE FUNCTION capture_event()
RETURNS trigger AS $$
DECLARE
  event_type_param text;
  target_id_val uuid;
  target_type_val text;
  metadata_val jsonb;
BEGIN
  -- Get event type from trigger argument (TG_ARGV[0])
  event_type_param := TG_ARGV[0];
  
  CASE TG_TABLE_NAME
    WHEN 'post_reactions' THEN
      target_id_val := NEW.post_id;
      target_type_val := 'post';
      metadata_val := jsonb_build_object('post_id', NEW.post_id);
    WHEN 'comments' THEN
      target_id_val := NEW.post_id;
      target_type_val := 'post';
      metadata_val := jsonb_build_object('post_id', NEW.post_id);
    WHEN 'connections' THEN
      target_id_val := CASE WHEN NEW.requester_id = auth.uid() THEN NEW.receiver_id ELSE NEW.requester_id END;
      target_type_val := 'profile';
      metadata_val := jsonb_build_object('status', NEW.status);
    WHEN 'messages' THEN
      target_id_val := NEW.conversation_id;
      target_type_val := 'conversation';
      metadata_val := jsonb_build_object('conversation_id', NEW.conversation_id);
    WHEN 'match_activity' THEN
      target_id_val := NEW.target_user_id;
      target_type_val := 'profile';
      metadata_val := jsonb_build_object('type', NEW.type);
    ELSE
      target_id_val := NULL;
      target_type_val := 'unknown';
      metadata_val := '{}'::jsonb;
  END CASE;
  
  INSERT INTO events (event_type, actor_id, target_id, target_type, metadata)
  VALUES (event_type_param, COALESCE(NEW.user_id, NEW.author_id, NEW.actor_user_id, NEW.requester_id, NEW.sender_id), 
    target_id_val, target_type_val, metadata_val);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS capture_post_reaction_event ON public.post_reactions;
CREATE TRIGGER capture_post_reaction_event AFTER INSERT ON post_reactions FOR EACH ROW EXECUTE FUNCTION capture_event('post_reaction');
DROP TRIGGER IF EXISTS capture_comment_event ON public.comments;
CREATE TRIGGER capture_comment_event AFTER INSERT ON comments FOR EACH ROW EXECUTE FUNCTION capture_event('comment_created');
DROP TRIGGER IF EXISTS capture_connection_request_event ON public.connections;
CREATE TRIGGER capture_connection_request_event AFTER INSERT ON connections FOR EACH ROW WHEN (NEW.status = 'pending') EXECUTE FUNCTION capture_event('connection_requested');
DROP TRIGGER IF EXISTS capture_connection_accepted_event ON public.connections;
CREATE TRIGGER capture_connection_accepted_event AFTER UPDATE ON connections FOR EACH ROW WHEN (OLD.status = 'pending' AND NEW.status = 'accepted') EXECUTE FUNCTION capture_event('connection_accepted');
DROP TRIGGER IF EXISTS capture_message_sent_event ON public.messages;
CREATE TRIGGER capture_message_sent_event AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION capture_event('message_sent');
DROP TRIGGER IF EXISTS capture_profile_view_event ON public.match_activity;
CREATE TRIGGER capture_profile_view_event AFTER INSERT ON match_activity FOR EACH ROW WHEN (NEW.type = 'profile_view') EXECUTE FUNCTION capture_event('profile_viewed');

-- Post creation event
CREATE OR REPLACE FUNCTION capture_post_created_event()
RETURNS trigger AS $$
BEGIN
  INSERT INTO events (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('post_created', NEW.author_id, NEW.id, 'post', jsonb_build_object('post_type', NEW.post_type, 'intent', NEW.intent));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS capture_post_created_event ON public.posts;
CREATE TRIGGER capture_post_created_event AFTER INSERT ON posts FOR EACH ROW EXECUTE FUNCTION capture_post_created_event();

-- Profile update event
CREATE OR REPLACE FUNCTION capture_profile_updated_event()
RETURNS trigger AS $$
BEGIN
  INSERT INTO events (event_type, actor_id, target_id, target_type, metadata)
  VALUES ('profile_updated', NEW.id, NEW.id, 'profile', jsonb_build_object('updated_at', now()));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS capture_profile_updated_event ON public.profiles;
CREATE TRIGGER capture_profile_updated_event AFTER UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION capture_profile_updated_event();

GRANT EXECUTE ON FUNCTION capture_event TO service_role;
GRANT EXECUTE ON FUNCTION capture_post_created_event TO service_role;
GRANT EXECUTE ON FUNCTION capture_profile_updated_event TO service_role;

-- ============================================================================
-- SECTION 5.9: REALTIME BROADCAST
-- ============================================================================

CREATE OR REPLACE FUNCTION broadcast_realtime()
RETURNS trigger AS $$
DECLARE
  channel_prefix text;
  channel_name text;
  payload jsonb;
BEGIN
  -- Get channel prefix from trigger argument (TG_ARGV[0])
  channel_prefix := TG_ARGV[0];
  
  CASE TG_TABLE_NAME
    WHEN 'notifications' THEN
      channel_name := channel_prefix || ':user:' || NEW.user_id::text;
      payload := jsonb_build_object('type', 'new_notification', 'timestamp', now());
    WHEN 'messages' THEN
      channel_name := channel_prefix || ':conversation:' || NEW.conversation_id::text;
      payload := jsonb_build_object('type', 'new_message', 'timestamp', now());
    WHEN 'match_activity' THEN
      channel_name := channel_prefix || ':user:' || NEW.target_user_id::text;
      payload := jsonb_build_object('type', 'match_activity', 'timestamp', now());
    WHEN 'match_suggestions' THEN
      channel_name := channel_prefix || ':user:' || NEW.user_id::text;
      payload := jsonb_build_object('type', 'new_match_suggestion', 'timestamp', now());
    ELSE
      channel_name := channel_prefix || ':unknown';
      payload := jsonb_build_object('type', 'unknown_event', 'table', TG_TABLE_NAME);
  END CASE;
  PERFORM pg_notify(channel_name, payload::text);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS broadcast_notification_realtime ON public.notifications;
CREATE TRIGGER broadcast_notification_realtime AFTER INSERT ON notifications FOR EACH ROW EXECUTE FUNCTION broadcast_realtime('notifications');
DROP TRIGGER IF EXISTS broadcast_message_realtime ON public.messages;
CREATE TRIGGER broadcast_message_realtime AFTER INSERT ON messages FOR EACH ROW EXECUTE FUNCTION broadcast_realtime('messages');
DROP TRIGGER IF EXISTS broadcast_match_activity_realtime ON public.match_activity;
CREATE TRIGGER broadcast_match_activity_realtime AFTER INSERT ON match_activity FOR EACH ROW EXECUTE FUNCTION broadcast_realtime('match_activity');
DROP TRIGGER IF EXISTS broadcast_match_suggestion_realtime ON public.match_suggestions;
CREATE TRIGGER broadcast_match_suggestion_realtime AFTER INSERT ON match_suggestions FOR EACH ROW EXECUTE FUNCTION broadcast_realtime('matches');

GRANT EXECUTE ON FUNCTION broadcast_realtime TO service_role;

-- ============================================================================
-- SECTION 5.10: PROFILE COMPLETION AUTO-UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION public.calculate_profile_completion(p_user_id uuid)
RETURNS integer AS $$
DECLARE
  v_score integer := 0;
  v_profile RECORD;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;
  
  IF v_profile.full_name IS NOT NULL OR v_profile.display_name IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_profile.headline IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_profile.bio IS NOT NULL THEN v_score := v_score + 5; END IF;
  
  SELECT COUNT(*) INTO v_score FROM user_skills WHERE user_id = p_user_id HAVING COUNT(*) > 0;
  v_score := v_score + 25;
  
  SELECT COUNT(*) INTO v_score FROM user_interests WHERE user_id = p_user_id HAVING COUNT(*) > 0;
  v_score := v_score + 15;
  
  IF v_profile.looking_for IS NOT NULL AND array_length(v_profile.looking_for, 1) > 0 THEN v_score := v_score + 10; END IF;
  
  SELECT COUNT(*) INTO v_score FROM user_experiences WHERE user_id = p_user_id HAVING COUNT(*) > 0;
  v_score := v_score + 25;
  
  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.update_profile_completion_from_profile() RETURNS TRIGGER AS $$
BEGIN NEW.profile_completion := public.calculate_profile_completion(NEW.id); RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_profile_completion_on_profile_update ON public.profiles;
CREATE TRIGGER update_profile_completion_on_profile_update BEFORE UPDATE ON profiles FOR EACH ROW
  WHEN (OLD.full_name IS DISTINCT FROM NEW.full_name OR OLD.display_name IS DISTINCT FROM NEW.display_name OR
        OLD.headline IS DISTINCT FROM NEW.headline OR OLD.bio IS DISTINCT FROM NEW.bio)
  EXECUTE FUNCTION public.update_profile_completion_from_profile();

CREATE OR REPLACE FUNCTION public.update_profile_completion_from_related() RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles SET profile_completion = public.calculate_profile_completion(COALESCE(NEW.user_id, OLD.user_id))
  WHERE id = COALESCE(NEW.user_id, OLD.user_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS update_profile_completion_on_skills_change ON public.user_skills;
CREATE TRIGGER update_profile_completion_on_skills_change AFTER INSERT OR DELETE OR UPDATE ON user_skills FOR EACH ROW EXECUTE FUNCTION public.update_profile_completion_from_related();
DROP TRIGGER IF EXISTS update_profile_completion_on_interests_change ON public.user_interests;
CREATE TRIGGER update_profile_completion_on_interests_change AFTER INSERT OR DELETE OR UPDATE ON user_interests FOR EACH ROW EXECUTE FUNCTION public.update_profile_completion_from_related();
DROP TRIGGER IF EXISTS update_profile_completion_on_experiences_change ON public.user_experiences;
CREATE TRIGGER update_profile_completion_on_experiences_change AFTER INSERT OR DELETE OR UPDATE ON user_experiences FOR EACH ROW EXECUTE FUNCTION public.update_profile_completion_from_related();

CREATE OR REPLACE FUNCTION public.recalculate_all_profile_completions() RETURNS integer AS $$
DECLARE 
  v_count integer := 0; 
  v_profile RECORD; 
BEGIN
  FOR v_profile IN SELECT id FROM profiles LOOP
    UPDATE profiles SET profile_completion = public.calculate_profile_completion(v_profile.id) WHERE id = v_profile.id;
    IF FOUND THEN v_count := v_count + 1; END IF;
  END LOOP;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.calculate_profile_completion TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_profile_completion TO service_role;
GRANT EXECUTE ON FUNCTION public.recalculate_all_profile_completions TO service_role;

-- ============================================================================
-- SECTION 6.X: NEW TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- privacy_settings RLS
CREATE POLICY "Users can view own privacy settings" ON public.privacy_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own privacy settings" ON public.privacy_settings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own privacy settings" ON public.privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- blocked_users RLS
CREATE POLICY "Users can view own blocked list" ON public.blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others" ON public.blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock" ON public.blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- audit_logs RLS
CREATE POLICY "Users can view own audit logs" ON public.audit_logs FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK ((SELECT auth.jwt() ->> 'role') = 'service_role');

-- Add new tables to realtime (ignore if already exists)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.privacy_settings;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.blocked_users;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.audit_logs;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- updated_at triggers for new tables
CREATE TRIGGER update_privacy_settings_updated_at BEFORE UPDATE ON public.privacy_settings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Note: audit_logs and blocked_users don't need updated_at triggers (audit trail is immutable)

-- ============================================================================
-- SECTION 10: FINAL DOCUMENTATION & VERIFICATION
-- ============================================================================
-- 
-- COMPLETE DATABASE SCHEMA - VERSION 4.1.0 (FINAL)
-- ================================================
-- 
-- TABLES: 34 total
-- - 22 core tables (profiles through theme_preferences)
-- - 4 embedding tables (profile_embeddings through embedding_pending_queue)
-- - 5 ML feature tables (feed_scores through content_moderation_logs)
-- - 3 privacy/security tables (privacy_settings, blocked_users, audit_logs)
-- 
-- FUNCTIONS: 46 total including:
-- - Helper functions (get_comment_depth, get_profile_completion_percentage, etc.)
-- - Match functions (find_similar_users, calculate_skills_overlap, etc.)
-- - Notification triggers (7 functions)
-- - Event capture triggers (3 functions)
-- - Realtime broadcast (1 function)
-- - Profile completion auto-update (4 functions)
-- - Embedding functions (validate_embedding_before_insert, etc.)
-- - Optimistic locking functions (increment_post_counter, get_post_counter_with_lock, posts_bump_version)
-- 
-- TRIGGERS: 39+ total
-- - updated_at triggers (10 tables)
-- - Count update triggers (posts, comments, comment_likes)
-- - Notification triggers (7: connection, reaction, comment, message, match, acceptance)
-- - Event capture triggers (8: post_reaction, comment, connection, message, match, post, profile)
-- - Realtime broadcast triggers (4)
-- - Profile completion triggers (4)
-- - Embedding timestamp trigger (1)
-- - Optimistic locking trigger (posts_bump_version)
-- 
-- INDEXES: 103 total (including HNSW for vector search)
-- RLS POLICIES: 100 total
-- STORAGE BUCKETS: 3 (post-media, profile-media, project-media)
-- REALTIME: Enabled for all 34 tables
-- 
-- POST-INSTALLATION VERIFICATION:
-- ================================
-- Run these queries to verify the installation:
--
-- 1. Count tables (should return 34 + storage.objects):
--    SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
--
-- 2. Verify RLS is enabled on all tables:
--    SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
--
-- 3. Count policies per table:
--    SELECT tablename, COUNT(*) as policy_count FROM pg_policies WHERE schemaname = 'public' GROUP BY tablename ORDER BY tablename;
--
-- 4. Test helper functions:
--    SELECT * FROM public.get_pending_queue_stats();
--    SELECT * FROM public.get_embedding_status('your-user-uuid-here');
--
-- 5. Verify indexes (should return 87):
--    SELECT COUNT(*) FROM pg_indexes WHERE schemaname = 'public';
--
-- 6. Verify storage buckets:
--    SELECT * FROM storage.buckets;
--
-- 7. Recalculate profile completions (first-time setup):
--    SELECT recalculate_all_profile_completions();
--
-- 8. Verify messages read_at column:
--    SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages' AND column_name = 'read_at';
--
-- PERFORMANCE & SECURITY NOTES:
-- =============================
-- - All functions use SECURITY DEFINER with SET search_path = public (prevents privilege escalation)
-- - HNSW index on profile_embeddings enables fast vector similarity search
-- - Partial indexes on notifications (is_read = false) and messages (is_read = true) optimize common queries
-- - Composite indexes on connections (requester_id, receiver_id, status) optimize connection queries
-- - RLS policies enforce row-level security on all tables
-- - Audit logs track all user actions for security compliance
--
-- DEPRECATED FILES (all content merged into this file):
-- - 01-23-*.sql (core tables)
-- - 30-match-scores.sql, 31-feed-scores.sql, 32-events.sql, 33-user-analytics.sql, 34-platform-analytics.sql
-- - 35-notification-triggers.sql, 36-event-capture-triggers.sql, 37-realtime-broadcast.sql
-- - 38-match-sql-functions.sql, 39-match-helpers.sql
-- - 40-messages-read-at.sql (migration merged)
-- - 41-profile-completion-trigger.sql (content merged)
-- - 50-audit-logs.sql (content merged)
-- - 99-missing-indexes.sql (content merged)
-- - 99-rate-limit-function.sql, 100-helper-functions.sql
--
-- KEPT FILES (reference/verification only):
--
-- ============================================================================
-- SECTION 11: RLS VERIFICATION QUERIES
-- ============================================================================
-- Run these queries to verify RLS is properly configured on all tables

-- 1. Verify all tables have RLS enabled (should return 0 rows with issues)
-- SELECT 
--     schemaname,
--     tablename,
--     'MISSING RLS!' as issue
-- FROM pg_tables 
-- WHERE schemaname = 'public'
--   AND rowsecurity = false
--   AND tablename NOT LIKE 'pg_%'
-- ORDER BY tablename;

-- 2. Count policies per table (each table should have at least 1 policy)
-- SELECT 
--     tablename,
--     COUNT(*) as policy_count,
--     string_agg(policyname, ', ' ORDER BY policyname) as policies
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- GROUP BY tablename
-- ORDER BY tablename;

-- 3. Verify specific critical tables have expected policies
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
--   AND tablename IN ('conversations', 'messages', 'profiles')
-- ORDER BY tablename, policyname;

-- 4. Check for tables without SELECT policies (potential security issue)
-- SELECT 
--     t.tablename,
--     'NO SELECT POLICY' as issue
-- FROM pg_tables t
-- LEFT JOIN pg_policies p ON t.tablename = p.tablename AND p.cmd = 'SELECT'
-- WHERE t.schemaname = 'public'
--   AND p.policyname IS NULL
--   AND t.tablename NOT LIKE 'embedding_%'
--   AND t.tablename NOT IN ('platform_analytics', 'content_moderation_logs', 'audit_logs')
-- ORDER BY t.tablename;

-- 5. Summary statistics
-- SELECT 
--     'Total Tables' as metric,
--     COUNT(*) as count
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND tablename NOT LIKE 'pg_%'
-- UNION ALL
-- SELECT 
--     'Tables with RLS Enabled',
--     COUNT(*)
-- FROM pg_tables 
-- WHERE schemaname = 'public' AND rowsecurity = true
-- UNION ALL
-- SELECT 
--     'Total Policies',
--     COUNT(*)
-- FROM pg_policies 
-- WHERE schemaname = 'public';

-- 6. Detailed policy report
-- SELECT 
--     tablename,
--     policyname,
--     cmd as operation,
--     CASE 
--         WHEN qual IS NOT NULL AND with_check IS NOT NULL THEN 'SELECT/INSERT'
--         WHEN qual IS NOT NULL THEN 'SELECT/UPDATE/DELETE'
--         WHEN with_check IS NOT NULL THEN 'INSERT ONLY'
--         ELSE 'UNKNOWN'
--     END as policy_type,
--     CASE 
--         WHEN qual LIKE '%auth.uid()%' OR with_check LIKE '%auth.uid()%' THEN 'User-specific'
--         WHEN qual LIKE '%service_role%' OR with_check LIKE '%service_role%' THEN 'Service role'
--         WHEN qual LIKE '%authenticated%' OR with_check LIKE '%authenticated%' THEN 'Authenticated users'
--         WHEN qual = 'true' THEN 'Public read'
--         ELSE 'Custom'
--     END as access_level
-- FROM pg_policies 
-- WHERE schemaname = 'public'
-- ORDER BY tablename, policyname;

-- ============================================================================
-- DATABASE SCHEMA COMPLETE - VERSION 4.0.0
-- All tables, indexes, triggers, functions, RLS policies, and storage configured.
-- Run verification queries in Section 11 to confirm successful installation.
-- ============================================================================
-- 
-- COMPLETE DATABASE SCHEMA - VERSION 4.0.0
-- ========================================
-- 
-- TABLES: 34 total
-- - 22 core tables (profiles through theme_preferences)
-- - 4 embedding tables (profile_embeddings through embedding_pending_queue)
-- - 5 ML feature tables (feed_scores through content_moderation_logs)
-- - 3 privacy/security tables (privacy_settings, blocked_users, audit_logs)
-- 
-- FUNCTIONS: 40+ total including:
-- - Helper functions (get_comment_depth, get_profile_completion_percentage, etc.)
-- - Match functions (find_similar_users, calculate_skills_overlap, etc.)
-- - Notification triggers (7 functions)
-- - Event capture triggers (3 functions)
-- - Realtime broadcast (1 function)
-- - Profile completion auto-update (4 functions)
-- 
-- TRIGGERS: 35+ total
-- - updated_at triggers (22 tables)
-- - Count update triggers (posts, comments)
-- - Notification triggers (7)
-- - Event capture triggers (8)
-- - Realtime broadcast triggers (4)
-- - Profile completion triggers (4)
-- 
-- INDEXES: 85+ total (including HNSW for vectors)
-- RLS POLICIES: 70+ total
-- STORAGE BUCKETS: 3 (post-media, profile-media, project-media)
-- 
-- POST-INSTALLATION:
-- 1. Run: SELECT recalculate_all_profile_completions();
-- 2. Run: supabase/setup/40-messages-read-at.sql (migration for existing messages)
-- 3. Verify: SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';
-- 
-- DEPRECATED FILES (all content merged into this file):
-- - 01-23-*.sql (core tables)
-- - 30-match-scores.sql, 31-feed-scores.sql, 32-events.sql, 33-user-analytics.sql, 34-platform-analytics.sql
-- - 35-notification-triggers.sql, 36-event-capture-triggers.sql, 37-realtime-broadcast.sql
-- - 38-match-sql-functions.sql, 39-match-helpers.sql
-- - 99-missing-indexes.sql
-- 
-- KEPT FILES:
-- - 99-master-all-tables.sql (this file - complete schema)
-- - 40-messages-read-at.sql (standalone migration)
-- - 41-profile-completion-trigger.sql (reference only, content merged)
-- - 50-audit-logs.sql (reference only, content merged)
-- - 99-rls-policies-test.sql (verification tool)
-- - README.md (documentation)
-- 
-- ============================================================================
