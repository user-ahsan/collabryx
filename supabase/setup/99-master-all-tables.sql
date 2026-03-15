-- ============================================================================
-- COLLABRYX DATABASE SCHEMA - COMPLETE MASTER FILE
-- ============================================================================
-- Version: 2.1.0 (Production Aligned)
-- Date: 2026-03-14
-- 
-- This file contains the COMPLETE database schema including:
-- - 26 Tables (user management, social, matching, messaging, AI, embeddings)
-- - All indexes optimized for common queries (including HNSW for vectors)
-- - All triggers for automation (updated_at, counts, embeddings)
-- - All RLS policies for security (50+ policies)
-- - All helper functions (get_conversation, are_connected, etc.)
-- - Storage buckets for file uploads (post-media, profile-media, project-media)
-- - Realtime enabled for all tables (Supabase Realtime)
-- - Complete embedding infrastructure (DLQ, rate limiting, pending queue)
--
-- Usage: Run this ONCE in Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/_/sql/new
--
-- PRODUCTION READY: Tested and verified against actual Supabase implementation
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
    skills_overlap INTEGER NOT NULL DEFAULT 0 CHECK (skills_overlap >= 0 AND skills_overlap <= 100),
    complementary_score INTEGER NOT NULL DEFAULT 0 CHECK (complementary_score >= 0 AND complementary_score <= 100),
    shared_interests INTEGER NOT NULL DEFAULT 0 CHECK (shared_interests >= 0 AND shared_interests <= 100),
    availability_score INTEGER CHECK (availability_score >= 0 AND availability_score <= 100),
    overlapping_skills TEXT[] DEFAULT '{}',
    complementary_explanation TEXT,
    shared_interest_tags TEXT[] DEFAULT '{}',
    insights JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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
-- SECTION 3: INDEXES
-- ============================================================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at DESC);

-- User skills indexes
CREATE INDEX IF NOT EXISTS idx_user_skills_user_id ON public.user_skills(user_id);
CREATE INDEX IF NOT EXISTS idx_user_skills_skill_name ON public.user_skills(skill_name);

-- User interests indexes
CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON public.user_interests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_interests_interest ON public.user_interests(interest);

-- User experiences indexes
CREATE INDEX IF NOT EXISTS idx_user_experiences_user_id ON public.user_experiences(user_id);

-- User projects indexes
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON public.user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_public ON public.user_projects(is_public);

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON public.posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_post_type_created ON public.posts(post_type, created_at DESC);

-- Post attachments indexes
CREATE INDEX IF NOT EXISTS idx_post_attachments_post_id ON public.post_attachments(post_id);

-- Post reactions indexes
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON public.post_reactions(post_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON public.comments(author_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON public.comments(parent_id);

-- Connections indexes
CREATE INDEX IF NOT EXISTS idx_connections_requester_id ON public.connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver_id ON public.connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);

-- Match suggestions indexes
CREATE INDEX IF NOT EXISTS idx_match_suggestions_user_id ON public.match_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_match_suggestions_user_percentage ON public.match_suggestions(user_id, match_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_match_suggestions_status ON public.match_suggestions(status);

-- Match scores indexes
CREATE INDEX IF NOT EXISTS idx_match_scores_suggestion_id ON public.match_scores(suggestion_id);

-- Match activity indexes
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
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

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

-- --------------------------------------------
-- MESSAGES RLS
-- --------------------------------------------
CREATE POLICY "Users can view conversation messages" ON public.messages
    FOR SELECT USING (EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.participant_1 = (SELECT auth.uid()) OR c.participant_2 = (SELECT auth.uid()))));

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK ((SELECT auth.uid()) = sender_id AND EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.participant_1 = (SELECT auth.uid()) OR c.participant_2 = (SELECT auth.uid()))));

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
-- SECTION 8.5: PERFORMANCE INDEXES (Idempotent - Safe to Re-run)
-- ============================================================================
-- These indexes improve query performance for common operations
-- Safe to re-run: Uses IF NOT EXISTS and CONCURRENTLY where possible

-- AI Mentor indexes
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_user_status 
  ON public.ai_mentor_sessions(user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_mentor_messages_session_created 
  ON public.ai_mentor_messages(session_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_ai_mentor_messages_role 
  ON public.ai_mentor_messages(role) WHERE role = 'user';

-- Posts and feed indexes
CREATE INDEX IF NOT EXISTS idx_posts_author_created 
  ON public.posts(author_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_posts_created 
  ON public.posts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_post_reactions_post_user 
  ON public.post_reactions(post_id, user_id);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_post_created 
  ON public.comments(post_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_comments_author 
  ON public.comments(author_id);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_user 
  ON public.comment_likes(comment_id, user_id);

-- Connections indexes
CREATE INDEX IF NOT EXISTS idx_connections_user1_status 
  ON public.connections(user_id_1, status);

CREATE INDEX IF NOT EXISTS idx_connections_user2_status 
  ON public.connections(user_id_2, status);

-- Matches indexes
CREATE INDEX IF NOT EXISTS idx_match_suggestions_user_score 
  ON public.match_suggestions(user_id, match_score DESC);

CREATE INDEX IF NOT EXISTS idx_match_scores_user 
  ON public.match_scores(user_id_1, user_id_2);

CREATE INDEX IF NOT EXISTS idx_match_activity_user_last 
  ON public.match_activity(user_id, last_interaction DESC);

-- Conversations and messages indexes
CREATE INDEX IF NOT EXISTS idx_conversations_user_updated 
  ON public.conversations(user_id, last_message_at DESC);

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created 
  ON public.messages(conversation_id, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_messages_sender 
  ON public.messages(sender_id);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created 
  ON public.notifications(user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_notifications_unread 
  ON public.notifications(user_id, is_read) WHERE is_read = false;

-- Profile embeddings indexes (additional)
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_status_updated 
  ON public.profile_embeddings(status, last_updated DESC);

CREATE INDEX IF NOT EXISTS idx_profile_embeddings_user_status 
  ON public.profile_embeddings(user_id, status);

-- Embedding reliability indexes
CREATE INDEX IF NOT EXISTS idx_dlq_status_priority 
  ON public.embedding_dead_letter_queue(status, retry_count, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_dlq_user_status 
  ON public.embedding_dead_letter_queue(user_id, status);

CREATE INDEX IF NOT EXISTS idx_rate_limits_user_window 
  ON public.embedding_rate_limits(user_id, window_start, window_end);

CREATE INDEX IF NOT EXISTS idx_pending_queue_user_status 
  ON public.embedding_pending_queue(user_id, status, created_at ASC);

-- User data indexes
CREATE INDEX IF NOT EXISTS idx_user_skills_user 
  ON public.user_skills(user_id);

CREATE INDEX IF NOT EXISTS idx_user_interests_user 
  ON public.user_interests(user_id);

CREATE INDEX IF NOT EXISTS idx_user_experiences_user 
  ON public.user_experiences(user_id);

CREATE INDEX IF NOT EXISTS idx_user_projects_user 
  ON public.user_projects(user_id);

-- ============================================================================
-- SECTION 9: TABLE COMMENTS (Documentation)
-- ============================================================================

COMMENT ON TABLE public.profile_embeddings IS 'Vector embeddings for semantic profile matching (384 dimensions, all-MiniLM-L6-v2)';
COMMENT ON TABLE public.embedding_dead_letter_queue IS 'Dead letter queue for failed embedding generation with automatic retry';
COMMENT ON TABLE public.embedding_rate_limits IS 'Rate limiting for embedding generation (3 requests/hour/user)';
COMMENT ON TABLE public.embedding_pending_queue IS 'Queue for pending embedding requests from onboarding';

-- ============================================================================
-- SETUP COMPLETE
-- ============================================================================
-- 
-- ✅ 26 Tables created
-- ✅ 60+ Indexes created (including HNSW for vector search)
-- ✅ 20+ Triggers created
-- ✅ 50+ RLS policies created
-- ✅ 15+ Helper functions created
-- ✅ 3 Storage buckets configured
-- ✅ All tables added to realtime
-- ✅ SECURITY: All functions have SECURITY DEFINER SET search_path = public
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
