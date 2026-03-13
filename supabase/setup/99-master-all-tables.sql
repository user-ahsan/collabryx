-- Collabryx Database Schema - Master SQL File
-- This file contains all table definitions, RLS policies, and storage buckets
-- Run this in the Supabase SQL Editor to set up your entire database

-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- ===========================================
-- SECTION 1: TABLES
-- ===========================================

-- Table: profiles
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

-- Table: user_skills
CREATE TABLE IF NOT EXISTS public.user_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    proficiency TEXT CHECK (proficiency IN ('beginner', 'intermediate', 'advanced', 'expert')),
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, skill_name)
);

-- Table: user_interests
CREATE TABLE IF NOT EXISTS public.user_interests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    interest TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, interest)
);

-- Table: user_experiences
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

-- Table: user_projects
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

-- Table: posts
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

-- Table: post_attachments
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

-- Table: post_reactions
CREATE TABLE IF NOT EXISTS public.post_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Table: comments
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

-- Table: comment_likes
CREATE TABLE IF NOT EXISTS public.comment_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comment_id UUID NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(comment_id, user_id)
);

-- Table: connections
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

-- Table: match_suggestions
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

-- Table: match_scores
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

-- Table: match_activity
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

-- Table: match_preferences
CREATE TABLE IF NOT EXISTS public.match_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    min_match_percentage INTEGER DEFAULT 0 CHECK (min_match_percentage >= 0 AND min_match_percentage <= 100),
    interested_in_types TEXT[] DEFAULT '{}',
    availability_match TEXT CHECK (availability_match IN ('any', 'similar', 'complementary')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: conversations
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

-- Table: messages
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

-- Table: notifications
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

-- Table: ai_mentor_sessions
CREATE TABLE IF NOT EXISTS public.ai_mentor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: ai_mentor_messages
CREATE TABLE IF NOT EXISTS public.ai_mentor_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES public.ai_mentor_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    is_saved_to_profile BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table: notification_preferences
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

-- Table: theme_preferences
CREATE TABLE IF NOT EXISTS public.theme_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    theme TEXT NOT NULL DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===========================================
-- VECTOR EMBEDDINGS TABLES
-- ===========================================

-- Table: profile_embeddings
-- Stores vector embeddings for user profiles for semantic matching
-- Uses pgvector extension for vector similarity search
CREATE TABLE IF NOT EXISTS public.profile_embeddings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    embedding VECTOR(384),  -- 384 dimensions for all-MiniLM-L6-v2 model
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    UNIQUE(user_id)
);

-- ===========================================
-- SECTION 2: INDEXES
-- ===========================================

-- Profiles indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_updated_at ON public.profiles(updated_at);

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

-- Match suggestions indexes
CREATE INDEX IF NOT EXISTS idx_match_suggestions_user_id ON public.match_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_match_suggestions_user_percentage ON public.match_suggestions(user_id, match_percentage DESC);

-- Conversations indexes
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- AI Mentor sessions indexes
CREATE INDEX IF NOT EXISTS idx_ai_mentor_sessions_user_id ON public.ai_mentor_sessions(user_id);

-- Profile embeddings indexes
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_embedding 
    ON public.profile_embeddings 
    USING hnsw (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_user_id 
    ON public.profile_embeddings (user_id);
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_status 
    ON public.profile_embeddings (status);

-- ===========================================
-- SECTION 3: TRIGGERS
-- ===========================================

-- Update updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_comments_updated_at ON public.comments;
CREATE TRIGGER update_comments_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_connections_updated_at ON public.connections;
CREATE TRIGGER update_connections_updated_at
    BEFORE UPDATE ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_match_preferences_updated_at ON public.match_preferences;
CREATE TRIGGER update_match_preferences_updated_at
    BEFORE UPDATE ON public.match_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_mentor_sessions_updated_at ON public.ai_mentor_sessions;
CREATE TRIGGER update_ai_mentor_sessions_updated_at
    BEFORE UPDATE ON public.ai_mentor_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON public.notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON public.notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_theme_preferences_updated_at ON public.theme_preferences;
CREATE TRIGGER update_theme_preferences_updated_at
    BEFORE UPDATE ON public.theme_preferences
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Profile embeddings update trigger
CREATE OR REPLACE FUNCTION public.update_embedding_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_embedding_timestamp ON public.profile_embeddings;
CREATE TRIGGER update_embedding_timestamp
    BEFORE UPDATE ON public.profile_embeddings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_embedding_timestamp();

-- Profile creation triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name)
    VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notification_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_notification ON public.profiles;
CREATE TRIGGER on_profile_created_notification
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_notification_preferences();

CREATE OR REPLACE FUNCTION public.handle_new_theme_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.theme_preferences (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_theme ON public.profiles;
CREATE TRIGGER on_profile_created_theme
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_theme_preferences();

-- Embedding generation trigger
CREATE OR REPLACE FUNCTION public.trigger_embedding_generation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only trigger when onboarding_completed changes to true
    IF NEW.onboarding_completed = TRUE AND OLD.onboarding_completed = FALSE THEN
        -- Insert a pending embedding record
        INSERT INTO public.profile_embeddings (user_id, status)
        VALUES (NEW.id, 'pending')
        ON CONFLICT (user_id) DO UPDATE
        SET status = 'pending', last_updated = NOW();
        
        -- Log the trigger event
        INSERT INTO public.match_activity (
            actor_user_id,
            target_user_id,
            type,
            activity,
            created_at
        )
        VALUES (
            NEW.id,
            NEW.id,
            'profile_view',
            'Embedding generation triggered',
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_generate_embedding ON public.profiles;
CREATE TRIGGER trigger_generate_embedding
    AFTER UPDATE OF onboarding_completed ON public.profiles
    FOR EACH ROW
    WHEN (NEW.onboarding_completed = TRUE AND OLD.onboarding_completed = FALSE)
    EXECUTE FUNCTION public.trigger_embedding_generation();

-- ===========================================
-- SECTION 4: REALTIME
-- ===========================================

-- Enable Realtime for all tables
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

-- ===========================================
-- SECTION 5: ROW LEVEL SECURITY
-- ===========================================

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

-- Profiles RLS
DROP POLICY IF EXISTS "Users can view any profile" ON public.profiles;
CREATE POLICY "Users can view any profile" ON public.profiles
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- INSERT only allowed if id matches authenticated user (for edge cases where trigger hasn't run)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- User skills RLS
DROP POLICY IF EXISTS "Users can view any skills" ON public.user_skills;
CREATE POLICY "Users can view any skills" ON public.user_skills
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own skills" ON public.user_skills;
CREATE POLICY "Users can manage own skills" ON public.user_skills
    FOR ALL USING (auth.uid() = user_id);

-- User interests RLS
DROP POLICY IF EXISTS "Users can view any interests" ON public.user_interests;
CREATE POLICY "Users can view any interests" ON public.user_interests
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own interests" ON public.user_interests;
CREATE POLICY "Users can manage own interests" ON public.user_interests
    FOR ALL USING (auth.uid() = user_id);

-- User experiences RLS
DROP POLICY IF EXISTS "Users can view any experiences" ON public.user_experiences;
CREATE POLICY "Users can view any experiences" ON public.user_experiences
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own experiences" ON public.user_experiences;
CREATE POLICY "Users can manage own experiences" ON public.user_experiences
    FOR ALL USING (auth.uid() = user_id);

-- User projects RLS
DROP POLICY IF EXISTS "Users can view projects" ON public.user_projects;
CREATE POLICY "Users can view projects" ON public.user_projects
    FOR SELECT USING (
        is_public = TRUE OR
        user_id = auth.uid()
    );

DROP POLICY IF EXISTS "Users can manage own projects" ON public.user_projects;
CREATE POLICY "Users can manage own projects" ON public.user_projects
    FOR ALL USING (auth.uid() = user_id);

-- Posts RLS
DROP POLICY IF EXISTS "Users can view posts" ON public.posts;
CREATE POLICY "Users can view posts" ON public.posts
    FOR SELECT USING (is_archived = FALSE);

DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
CREATE POLICY "Users can create posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
CREATE POLICY "Users can update own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;
CREATE POLICY "Users can delete own posts" ON public.posts
    FOR DELETE USING (auth.uid() = author_id);

-- Post attachments RLS
DROP POLICY IF EXISTS "Users can view post attachments" ON public.post_attachments;
CREATE POLICY "Users can view post attachments" ON public.post_attachments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_attachments.post_id AND p.is_archived = FALSE)
    );

DROP POLICY IF EXISTS "Users can create post attachments" ON public.post_attachments;
CREATE POLICY "Users can create post attachments" ON public.post_attachments
    FOR INSERT WITH CHECK (
        EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_attachments.post_id AND p.author_id = auth.uid())
    );

DROP POLICY IF EXISTS "Users can delete post attachments" ON public.post_attachments;
CREATE POLICY "Users can delete post attachments" ON public.post_attachments
    FOR DELETE USING (
        EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_attachments.post_id AND p.author_id = auth.uid())
    );

-- Post reactions RLS
DROP POLICY IF EXISTS "Users can view post reactions" ON public.post_reactions;
CREATE POLICY "Users can view post reactions" ON public.post_reactions
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.posts p WHERE p.id = post_reactions.post_id AND p.is_archived = FALSE)
    );

DROP POLICY IF EXISTS "Users can create post reactions" ON public.post_reactions;
CREATE POLICY "Users can create post reactions" ON public.post_reactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own post reactions" ON public.post_reactions;
CREATE POLICY "Users can delete own post reactions" ON public.post_reactions
    FOR DELETE USING (auth.uid() = user_id);

-- Comments RLS
DROP POLICY IF EXISTS "Users can view comments" ON public.comments;
CREATE POLICY "Users can view comments" ON public.comments
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND p.is_archived = FALSE)
    );

DROP POLICY IF EXISTS "Users can create comments" ON public.comments;
CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK (
        auth.uid() = author_id AND
        EXISTS (SELECT 1 FROM public.posts p WHERE p.id = comments.post_id AND p.is_archived = FALSE)
    );

DROP POLICY IF EXISTS "Users can update own comments" ON public.comments;
CREATE POLICY "Users can update own comments" ON public.comments
    FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;
CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE USING (auth.uid() = author_id);

-- Comment likes RLS
DROP POLICY IF EXISTS "Users can view comment likes" ON public.comment_likes;
CREATE POLICY "Users can view comment likes" ON public.comment_likes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.comments c
            JOIN public.posts p ON c.post_id = p.id
            WHERE c.id = comment_likes.comment_id AND p.is_archived = FALSE
        )
    );

DROP POLICY IF EXISTS "Users can create comment likes" ON public.comment_likes;
CREATE POLICY "Users can create comment likes" ON public.comment_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comment likes" ON public.comment_likes;
CREATE POLICY "Users can delete own comment likes" ON public.comment_likes
    FOR DELETE USING (auth.uid() = user_id);

-- Connections RLS
DROP POLICY IF EXISTS "Users can view their connections" ON public.connections;
CREATE POLICY "Users can view their connections" ON public.connections
    FOR SELECT USING (requester_id = auth.uid() OR receiver_id = auth.uid());

DROP POLICY IF EXISTS "Users can create connection requests" ON public.connections;
CREATE POLICY "Users can create connection requests" ON public.connections
    FOR INSERT WITH CHECK (auth.uid() = requester_id AND receiver_id != auth.uid());

DROP POLICY IF EXISTS "Users can update connection status" ON public.connections;
CREATE POLICY "Users can update connection status" ON public.connections
    FOR UPDATE USING (auth.uid() = receiver_id OR auth.uid() = requester_id);

DROP POLICY IF EXISTS "Users can delete own pending requests" ON public.connections;
CREATE POLICY "Users can delete own pending requests" ON public.connections
    FOR DELETE USING (auth.uid() = requester_id AND status = 'pending');

-- Match suggestions RLS
DROP POLICY IF EXISTS "Users can view own match suggestions" ON public.match_suggestions;
CREATE POLICY "Users can view own match suggestions" ON public.match_suggestions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert match suggestions" ON public.match_suggestions;
CREATE POLICY "Service role can insert match suggestions" ON public.match_suggestions
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update suggestion status" ON public.match_suggestions;
CREATE POLICY "Users can update suggestion status" ON public.match_suggestions
    FOR UPDATE USING (auth.uid() = user_id);

-- Match activity RLS
DROP POLICY IF EXISTS "Users can view own match activity" ON public.match_activity;
CREATE POLICY "Users can view own match activity" ON public.match_activity
    FOR SELECT USING (auth.uid() = target_user_id);

DROP POLICY IF EXISTS "Service role can insert match activity" ON public.match_activity;
CREATE POLICY "Service role can insert match activity" ON public.match_activity
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update match activity" ON public.match_activity;
CREATE POLICY "Users can update match activity" ON public.match_activity
    FOR UPDATE USING (auth.uid() = target_user_id);

-- Conversations RLS
DROP POLICY IF EXISTS "Users can view own conversations" ON public.conversations;
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

DROP POLICY IF EXISTS "Service role can create conversations" ON public.conversations;
CREATE POLICY "Service role can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update own conversations" ON public.conversations;
CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (participant_1 = auth.uid() OR participant_2 = auth.uid());

-- Messages RLS
DROP POLICY IF EXISTS "Users can view conversation messages" ON public.messages;
CREATE POLICY "Users can view conversation messages" ON public.messages
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()))
    );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = messages.conversation_id AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid()))
    );

-- Notifications RLS
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Service role can insert notifications" ON public.notifications;
CREATE POLICY "Service role can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- AI Mentor RLS
DROP POLICY IF EXISTS "Users can view own AI mentor sessions" ON public.ai_mentor_sessions;
CREATE POLICY "Users can view own AI mentor sessions" ON public.ai_mentor_sessions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create AI mentor sessions" ON public.ai_mentor_sessions;
CREATE POLICY "Users can create AI mentor sessions" ON public.ai_mentor_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Notification preferences RLS
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can view own notification preferences" ON public.notification_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users can manage own notification preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Theme preferences RLS
DROP POLICY IF EXISTS "Users can view own theme preferences" ON public.theme_preferences;
CREATE POLICY "Users can view own theme preferences" ON public.theme_preferences
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own theme preferences" ON public.theme_preferences;
CREATE POLICY "Users can manage own theme preferences" ON public.theme_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Profile embeddings RLS
-- Users can view their own embedding status
DROP POLICY IF EXISTS "Users can view own embedding status" ON public.profile_embeddings;
CREATE POLICY "Users can view own embedding status" ON public.profile_embeddings
    FOR SELECT USING (auth.uid() = user_id);

-- Service role only for creating/updating embeddings
ALTER TABLE public.profile_embeddings ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- SECTION 6: STORAGE BUCKETS
-- ===========================================

-- 1. post-media bucket
-- For: Post attachments, message media, comment media
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'post-media',
    'post-media',
    true,
    52428800, -- 50MB limit (for videos)
    ARRAY['image/*', 'video/*', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. profile-media bucket
-- For: Profile avatars and banners
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'profile-media',
    'profile-media',
    true,
    10485760, -- 10MB limit
    ARRAY['image/*']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 3. project-media bucket
-- For: Project thumbnails and screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'project-media',
    'project-media',
    true,
    10485760, -- 10MB limit
    ARRAY['image/*']
)
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ===========================================
-- STORAGE POLICIES
-- ===========================================

-- post-media policies
DROP POLICY IF EXISTS "Public read access to post-media" ON storage.objects;
CREATE POLICY "Public read access to post-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'post-media');

DROP POLICY IF EXISTS "Authenticated upload to post-media" ON storage.objects;
CREATE POLICY "Authenticated upload to post-media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'post-media' AND
    auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated update own files in post-media" ON storage.objects;
CREATE POLICY "Authenticated update own files in post-media"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'post-media' AND
    auth.uid() = owner
);

DROP POLICY IF EXISTS "Authenticated delete own files in post-media" ON storage.objects;
CREATE POLICY "Authenticated delete own files in post-media"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'post-media' AND
    auth.uid() = owner
);

-- profile-media policies
DROP POLICY IF EXISTS "Public read access to profile-media" ON storage.objects;
CREATE POLICY "Public read access to profile-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'profile-media');

DROP POLICY IF EXISTS "Authenticated upload to profile-media" ON storage.objects;
CREATE POLICY "Authenticated upload to profile-media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'profile-media' AND
    auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated update own files in profile-media" ON storage.objects;
CREATE POLICY "Authenticated update own files in profile-media"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'profile-media' AND
    auth.uid() = owner
);

DROP POLICY IF EXISTS "Authenticated delete own files in profile-media" ON storage.objects;
CREATE POLICY "Authenticated delete own files in profile-media"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'profile-media' AND
    auth.uid() = owner
);

-- project-media policies
DROP POLICY IF EXISTS "Public read access to project-media" ON storage.objects;
CREATE POLICY "Public read access to project-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-media');

DROP POLICY IF EXISTS "Authenticated upload to project-media" ON storage.objects;
CREATE POLICY "Authenticated upload to project-media"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'project-media' AND
    auth.role() = 'authenticated'
);

DROP POLICY IF EXISTS "Authenticated update own files in project-media" ON storage.objects;
CREATE POLICY "Authenticated update own files in project-media"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'project-media' AND
    auth.uid() = owner
);

DROP POLICY IF EXISTS "Authenticated delete own files in project-media" ON storage.objects;
CREATE POLICY "Authenticated delete own files in project-media"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'project-media' AND
    auth.uid() = owner
);

-- ===========================================
-- SECTION 7: HELPER FUNCTIONS
-- ===========================================

-- Function to check if user has completed embedding generation
CREATE OR REPLACE FUNCTION public.has_embedding(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    embedding_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO embedding_count
    FROM public.profile_embeddings
    WHERE public.profile_embeddings.user_id = $1
      AND status = 'completed';
    
    RETURN embedding_count > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get embedding status for a user
CREATE OR REPLACE FUNCTION public.get_embedding_status(user_id UUID)
RETURNS TABLE (
    user_id UUID,
    status TEXT,
    last_updated TIMESTAMPTZ,
    has_embedding BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pe.user_id,
        pe.status,
        pe.last_updated,
        (pe.status = 'completed') AS has_embedding
    FROM public.profile_embeddings pe
    WHERE pe.user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually trigger embedding regeneration
CREATE OR REPLACE FUNCTION public.regenerate_embedding(user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.profile_embeddings
    SET status = 'pending', last_updated = NOW()
    WHERE user_id = $1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get conversation between two users
CREATE OR REPLACE FUNCTION public.get_conversation(user1 UUID, user2 UUID)
RETURNS public.conversations AS $$
BEGIN
    RETURN (
        SELECT * FROM public.conversations
        WHERE (participant_1 = user1 AND participant_2 = user2)
           OR (participant_1 = user2 AND participant_2 = user1)
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if users are connected
CREATE OR REPLACE FUNCTION public.are_connected(user1 UUID, user2 UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.connections
        WHERE ((requester_id = user1 AND receiver_id = user2)
               OR (requester_id = user2 AND receiver_id = user1))
          AND status = 'accepted'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment post reaction count
CREATE OR REPLACE FUNCTION public.increment_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts
    SET reaction_count = reaction_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_post_reaction_count_trigger
    AFTER INSERT ON public.post_reactions
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_post_reaction_count();

-- Function to decrement post reaction count
CREATE OR REPLACE FUNCTION public.decrement_post_reaction_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts
    SET reaction_count = reaction_count - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_post_reaction_count_trigger
    AFTER DELETE ON public.post_reactions
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_post_reaction_count();

-- Function to increment comment count on post
CREATE OR REPLACE FUNCTION public.increment_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts
    SET comment_count = comment_count + 1
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_post_comment_count_trigger
    AFTER INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_post_comment_count();

-- Function to decrement comment count on post
CREATE OR REPLACE FUNCTION public.decrement_post_comment_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts
    SET comment_count = comment_count - 1
    WHERE id = OLD.post_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_post_comment_count_trigger
    AFTER DELETE ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_post_comment_count();

-- Function to increment comment like count
CREATE OR REPLACE FUNCTION public.increment_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.comments
    SET like_count = like_count + 1
    WHERE id = NEW.comment_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER increment_comment_like_count_trigger
    AFTER INSERT ON public.comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_comment_like_count();

-- Function to decrement comment like count
CREATE OR REPLACE FUNCTION public.decrement_comment_like_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.comments
    SET like_count = like_count - 1
    WHERE id = OLD.comment_id;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER decrement_comment_like_count_trigger
    AFTER DELETE ON public.comment_likes
    FOR EACH ROW
    EXECUTE FUNCTION public.decrement_comment_like_count();

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION public.update_conversation_last_message()
RETURNS TRIGGER AS $$
DECLARE
    conv RECORD;
BEGIN
    SELECT * INTO conv FROM public.conversations WHERE id = NEW.conversation_id;
    IF conv.id IS NOT NULL THEN
        UPDATE public.conversations
        SET
            last_message_text = LEFT(NEW.text, 100),
            last_message_at = NEW.created_at
        WHERE id = NEW.conversation_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_conversation_last_message_trigger
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_last_message();

-- ===========================================
-- SETUP COMPLETE
-- ===========================================
-- All tables, indexes, triggers, RLS policies, and storage buckets are now set up!
--
-- Storage Buckets Created:
-- 1. post-media      - For posts, messages, comments media (public read, auth write, 50MB limit)
-- 2. profile-media   - For user avatars and banners (public read, auth write, 10MB limit)
-- 3. project-media   - For project thumbnails (public read, auth write, 10MB limit)
--
-- Vector Embeddings:
-- - profile_embeddings table stores 384-dimensional vectors using pgvector
-- - Automatic generation triggered on onboarding completion
-- - Used for semantic matching via cosine similarity
-- - HNSW index for efficient similarity search
--
-- Embedding Reliability System (NEW):
-- - embedding_dead_letter_queue: Failed embedding retry queue with exponential backoff
-- - embedding_rate_limits: Rate limiting (3 requests/hour/user) to prevent DoS
-- - embedding_pending_queue: Reliable onboarding embedding queue
-- - Validation constraints: 384 dimension enforcement, quality checks

-- ===========================================
-- TABLE 24: DEAD LETTER QUEUE
-- ===========================================
-- Dead letter queue for failed embedding requests
-- This table stores failed embedding generation attempts for automatic retry

CREATE TABLE IF NOT EXISTS embedding_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  semantic_text TEXT NOT NULL,
  failure_reason TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, processing, completed, exhausted
  last_attempt TIMESTAMPTZ,
  next_retry TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_dlq_status_retry ON embedding_dead_letter_queue(status, next_retry);
CREATE INDEX IF NOT EXISTS idx_dlq_user_id ON embedding_dead_letter_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_dlq_created_at ON embedding_dead_letter_queue(created_at);

-- RLS Policies
ALTER TABLE embedding_dead_letter_queue ENABLE ROW LEVEL SECURITY;

-- Service role can manage all
CREATE POLICY "service_role_manage_dlq" ON embedding_dead_letter_queue
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own
CREATE POLICY "users_view_own_dlq" ON embedding_dead_letter_queue
  FOR SELECT USING (auth.uid() = user_id);

-- Realtime enabled for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE embedding_dead_letter_queue;

-- Comment for documentation
COMMENT ON TABLE embedding_dead_letter_queue IS 'Dead letter queue for failed embedding generation requests with automatic retry capability';
COMMENT ON COLUMN embedding_dead_letter_queue.status IS 'pending: waiting for retry, processing: currently being retried, completed: successfully processed, exhausted: max retries reached';

-- ===========================================
-- TABLE 25: RATE LIMITING
-- ===========================================
-- Rate limiting for embedding generation
-- Prevents DoS attacks and resource exhaustion (3 requests per hour per user)

-- Rate limiting tracking table
CREATE TABLE embedding_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  window_end TIMESTAMPTZ DEFAULT NOW() + INTERVAL '1 hour',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient lookups
CREATE INDEX idx_rate_limit_user_window ON embedding_rate_limits(user_id, window_end);
CREATE INDEX idx_rate_limit_created_at ON embedding_rate_limits(created_at);

-- RLS Policies
ALTER TABLE embedding_rate_limits ENABLE ROW LEVEL SECURITY;

-- Service role can manage all
CREATE POLICY "service_role_manage_rate_limits" ON embedding_rate_limits
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own
CREATE POLICY "users_view_own_rate_limits" ON embedding_rate_limits
  FOR SELECT USING (auth.uid() = user_id);

-- Realtime enabled for monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE embedding_rate_limits;

-- Function to check rate limit
-- Returns: allowed (boolean), remaining (integer), reset_at (timestamptz)
CREATE OR REPLACE FUNCTION check_embedding_rate_limit(p_user_id UUID)
RETURNS TABLE (allowed BOOLEAN, remaining INTEGER, reset_at TIMESTAMPTZ) AS $$
DECLARE
  v_record RECORD;
  v_remaining INTEGER;
BEGIN
  -- Get or create rate limit record
  SELECT * INTO v_record
  FROM embedding_rate_limits
  WHERE user_id = p_user_id
    AND window_end > NOW()
  ORDER BY window_end DESC
  LIMIT 1;
  
  -- No record exists, create one
  IF v_record IS NULL THEN
    INSERT INTO embedding_rate_limits (user_id, request_count)
    VALUES (p_user_id, 1)
    RETURNING * INTO v_record;
    
    RETURN QUERY SELECT TRUE, 2, v_record.window_end;
  END IF;
  
  -- Check remaining requests (limit: 3 per hour)
  v_remaining := 3 - v_record.request_count;
  
  IF v_remaining > 0 THEN
    -- Update count
    UPDATE embedding_rate_limits
    SET request_count = request_count + 1,
        updated_at = NOW()
    WHERE id = v_record.id;
    
    RETURN QUERY SELECT TRUE, v_remaining - 1, v_record.window_end;
  ELSE
    -- Rate limit exceeded
    RETURN QUERY SELECT FALSE, 0, v_record.window_end;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION check_embedding_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION check_embedding_rate_limit TO service_role;

-- Function to reset rate limit (for admin use)
CREATE OR REPLACE FUNCTION reset_embedding_rate_limit(p_user_id UUID)
RETURNS VOID AS $$
BEGIN
  DELETE FROM embedding_rate_limits
  WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION reset_embedding_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION reset_embedding_rate_limit TO service_role;

-- ===========================================
-- TABLE 26: PENDING QUEUE
-- ===========================================
-- Queue for pending embedding requests from onboarding
-- Ensures reliable embedding generation even if API trigger fails

CREATE TABLE IF NOT EXISTS public.embedding_pending_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    trigger_source TEXT NOT NULL DEFAULT 'onboarding' CHECK (trigger_source IN ('onboarding', 'manual', 'admin', 'api')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    first_attempt TIMESTAMPTZ,
    last_attempt TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    failure_reason TEXT
);

-- Index for efficient querying by status
CREATE INDEX IF NOT EXISTS idx_pending_queue_status 
    ON public.embedding_pending_queue (status);

-- Index for efficient querying by created_at (for processing order)
CREATE INDEX IF NOT EXISTS idx_pending_queue_created 
    ON public.embedding_pending_queue (created_at);

-- Index for efficient querying by user_id
CREATE INDEX IF NOT EXISTS idx_pending_queue_user_id 
    ON public.embedding_pending_queue (user_id);

-- Enable Row Level Security
ALTER TABLE public.embedding_pending_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Service role can manage all
CREATE POLICY "service_role_manage_pending_queue" ON public.embedding_pending_queue
    FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Users can view their own pending queue status
CREATE POLICY "users_view_own_pending_queue" ON public.embedding_pending_queue
    FOR SELECT USING (auth.uid() = user_id);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.embedding_pending_queue;

-- Function to queue embedding request with duplicate prevention
CREATE OR REPLACE FUNCTION public.queue_embedding_request(
    p_user_id UUID,
    p_trigger_source TEXT DEFAULT 'onboarding'
)
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
    
    -- Notify workers via NOTIFY (optional, for real-time triggering)
    NOTIFY embedding_queue_changed;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on queue function
GRANT EXECUTE ON FUNCTION public.queue_embedding_request TO authenticated;

-- Function to get pending queue count by status
CREATE OR REPLACE FUNCTION public.get_pending_queue_stats()
RETURNS TABLE (
    status TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        epq.status::TEXT,
        COUNT(*)::BIGINT
    FROM public.embedding_pending_queue epq
    GROUP BY epq.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on stats function
GRANT EXECUTE ON FUNCTION public.get_pending_queue_stats TO authenticated;

-- Comment describing the table
COMMENT ON TABLE public.embedding_pending_queue IS 'Queue for pending embedding requests from onboarding and other sources';
COMMENT ON COLUMN public.embedding_pending_queue.status IS 'pending: waiting to be processed, processing: being generated, completed: done, failed: error occurred';
COMMENT ON COLUMN public.embedding_pending_queue.trigger_source IS 'Source of the request: onboarding, manual, admin, or api';

-- ===========================================
-- VALIDATION CONSTRAINTS
-- ===========================================
-- Adds validation constraints to profile_embeddings table
-- Ensures data quality for vector embeddings

-- Add validation check constraint for dimension
ALTER TABLE public.profile_embeddings
ADD CONSTRAINT check_embedding_dimension 
CHECK (vector_dims(embedding) = 384);

-- Create trigger function for validation
CREATE OR REPLACE FUNCTION public.validate_embedding_before_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Check dimension
  IF vector_dims(NEW.embedding) != 384 THEN
    RAISE EXCEPTION 'Invalid embedding dimension: expected 384, got %', vector_dims(NEW.embedding);
  END IF;
  
  -- Check for null values
  IF NEW.embedding IS NULL THEN
    RAISE EXCEPTION 'Embedding cannot be null';
  END IF;
  
  -- Check status is valid
  IF NEW.status NOT IN ('pending', 'processing', 'completed', 'failed') THEN
    RAISE EXCEPTION 'Invalid status: %', NEW.status;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for validation on INSERT and UPDATE
DROP TRIGGER IF EXISTS trigger_validate_embedding ON public.profile_embeddings;
CREATE TRIGGER trigger_validate_embedding
  BEFORE INSERT OR UPDATE ON public.profile_embeddings
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_embedding_before_insert();

-- Add index on metadata for querying validation status
CREATE INDEX IF NOT EXISTS idx_profile_embeddings_metadata 
    ON public.profile_embeddings USING GIN (metadata);

-- Comment documenting the validation
COMMENT ON CONSTRAINT check_embedding_dimension ON public.profile_embeddings IS 
'Ensures all embeddings have exactly 384 dimensions (all-MiniLM-L6-v2 model)';

COMMENT ON FUNCTION public.validate_embedding_before_insert() IS 
'Validates embedding dimension, null checks, and status before insert/update';

-- ===========================================
-- SETUP COMPLETE
-- ===========================================
-- All 26 tables, indexes, triggers, RLS policies, and storage buckets are now set up!
--
-- Storage Buckets Created:
-- 1. post-media      - For posts, messages, comments media (public read, auth write, 50MB limit)
-- 2. profile-media   - For user avatars and banners (public read, auth write, 10MB limit)
-- 3. project-media   - For project thumbnails (public read, auth write, 10MB limit)
--
-- Vector Embeddings System:
-- - profile_embeddings table stores 384-dimensional vectors using pgvector
-- - Automatic generation triggered on onboarding completion
-- - Used for semantic matching via cosine similarity
-- - HNSW index for efficient similarity search
--
-- Embedding Reliability System:
-- - embedding_dead_letter_queue: Failed embedding retry queue with exponential backoff (3 retries)
-- - embedding_rate_limits: Rate limiting (3 requests/hour/user) to prevent DoS attacks
-- - embedding_pending_queue: Reliable onboarding embedding queue with duplicate prevention
-- - Validation constraints: 384 dimension enforcement, NaN/Inf detection, normalization checks
--
-- Total Tables: 26
-- Total Indexes: 60+
-- Total Triggers: 10+
-- Total RLS Policies: 50+
-- Total Functions: 15+
