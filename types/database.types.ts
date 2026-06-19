// Auto-generated types from Supabase schema based on 99-master-all-tables.sql
// Types for the Collabryx database schema

// ===========================================
// ROLE TYPE
// ===========================================
export type Role = 'student' | 'investor' | 'founder' | 'professional' | 'mentor';

// ===========================================
// TABLE: profiles
// ===========================================
export interface Profile {
  id: string; // UUID
  email: string;
  display_name?: string;
  full_name?: string;
  headline?: string;
  bio?: string;
  avatar_url?: string;
  banner_url?: string;
  location?: string;
  website_url?: string;
  collaboration_readiness?: 'available' | 'open' | 'not-available';
  is_verified: boolean;
  verification_type?: 'student' | 'faculty' | 'alumni';
  university?: string;
  profile_completion: number; // 0-100
  looking_for: string[];
  onboarding_completed: boolean;
  // --- Multi-role system (20260615) ---
  roles?: Role[];
  // Student fields
  major?: string;
  graduation_year?: number;
  looking_for_team?: boolean;
  project_interests?: string[];
  // Investor fields
  check_size_min?: number;
  check_size_max?: number;
  stage_focus?: string[];
  sectors?: string[];
  portfolio_url?: string;
  investment_history_count?: number;
  accredited_investor?: boolean;
  // Founder / Professional fields
  company_name?: string;
  company_stage?: 'idea' | 'pre_seed' | 'seed' | 'early' | 'growth' | 'established';
  company_role?: string;
  team_size?: number;
  fundraising_stage?: 'not_raising' | 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c_plus';
  hiring_needs?: string[];
  open_to_mentoring?: boolean;
  // Mentor fields
  mentoring_areas?: string[];
  mentoring_format?: 'one_on_one' | 'group' | 'async' | 'any';
  mentoring_availability_hours?: number;
  // Social links (portfolio_url is defined above with investor fields)
  github_url?: string;
  linkedin_url?: string;
  twitter_url?: string;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: user_skills
// ===========================================
export interface UserSkill {
  id: string; // UUID
  user_id: string; // UUID
  skill_name: string;
  skill_category?: string;
  proficiency?: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  is_primary: boolean;
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: user_interests
// ===========================================
export interface UserInterest {
  id: string; // UUID
  user_id: string; // UUID
  interest: string;
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: user_experiences
// ===========================================
export interface UserExperience {
  id: string; // UUID
  user_id: string; // UUID
  title: string;
  company?: string;
  description?: string;
  start_date?: string; // DATE
  end_date?: string; // DATE
  is_current: boolean;
  order_index: number;
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: user_projects
// ===========================================
export interface UserProject {
  id: string; // UUID
  user_id: string; // UUID
  title: string;
  description?: string;
  url?: string;
  image_url?: string;
  tech_stack: string[];
  is_public: boolean;
  order_index: number;
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: posts
// ===========================================
export interface Post {
  id: string; // UUID
  author_id: string; // UUID
  content: string;
  post_type: 'project-launch' | 'teammate-request' | 'announcement' | 'general';
  intent?: 'cofounder' | 'teammate' | 'mvp' | 'fyp';
  link_url?: string;
  is_pinned: boolean;
  is_archived: boolean;
  reaction_count: number;
  comment_count: number;
  share_count: number;
  bookmark_count: number;
  version: number; // Optimistic locking version
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: post_attachments
// ===========================================
export interface PostAttachment {
  id: string; // UUID
  post_id: string; // UUID
  file_url: string;
  file_type: 'image' | 'video';
  file_name?: string;
  file_size?: number;
  mime_type?: string;
  width?: number;
  height?: number;
  order_index: number;
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: post_reactions
// ===========================================
export interface PostReaction {
  id: string; // UUID
  post_id: string; // UUID
  user_id: string; // UUID
  emoji: string;
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: user_bookmarks
// ===========================================
export interface UserBookmark {
  id: string; // UUID
  post_id: string; // UUID
  user_id: string; // UUID
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: comments
// ===========================================
export interface Comment {
  id: string; // UUID
  post_id: string; // UUID
  author_id: string; // UUID
  content: string;
  parent_id?: string; // UUID
  like_count: number;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: comment_likes
// ===========================================
export interface CommentLike {
  id: string; // UUID
  comment_id: string; // UUID
  user_id: string; // UUID
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: connections
// ===========================================
export interface Connection {
  id: string; // UUID
  requester_id: string; // UUID
  receiver_id: string; // UUID
  status: 'pending' | 'accepted' | 'declined' | 'blocked';
  message?: string;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: match_suggestions
// ===========================================
export interface MatchSuggestion {
  id: string; // UUID
  user_id: string; // UUID
  matched_user_id: string; // UUID
  match_percentage: number; // 0-100
  reasons: unknown[]; // JSONB array
  ai_confidence?: number; // 0-1
  ai_explanation?: string;
  status: 'active' | 'dismissed' | 'connected';
  created_at: string; // TIMESTAMPTZ
  expires_at?: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: match_scores
// ===========================================
export interface MatchScore {
  id: string; // UUID
  suggestion_id: string; // UUID
  semantic_similarity: number;
  skills_overlap: number; // 0-100
  complementary_score: number; // 0-100
  shared_interests: number; // 0-100
  activity_match: number;
  skill_gap_score?: number;
  role_complementarity_score?: number;
  overall_score: number;
  model_version: string;
  model_config?: Record<string, unknown>; // JSONB
  overlapping_skills: string[];
  complementary_explanation?: string;
  shared_interest_tags: string[];
  insights?: string[]; // JSONB
  calculated_at?: string; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: match_activity
// ===========================================
export interface MatchActivity {
  id: string; // UUID
  actor_user_id: string; // UUID
  target_user_id: string; // UUID
  type: 'profile_view' | 'building_match' | 'skill_match';
  activity: string;
  match_percentage?: number; // 0-100
  is_read: boolean;
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: match_preferences
// ===========================================
export interface MatchPreference {
  id: string; // UUID
  user_id: string; // UUID (UNIQUE)
  min_match_percentage: number; // 0-100
  interested_in_types: string[];
  availability_match?: 'any' | 'similar' | 'complementary';
  role_matching_enabled?: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: conversations
// ===========================================
export interface Conversation {
  id: string; // UUID
  participant_1: string; // UUID
  participant_2: string; // UUID
  last_message_text?: string;
  last_message_at?: string; // TIMESTAMPTZ
  unread_count_1: number;
  unread_count_2: number;
  is_archived: boolean;
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: messages
// ===========================================
export interface Message {
  id: string; // UUID
  conversation_id: string; // UUID
  sender_id: string; // UUID
  text: string;
  is_read: boolean;
  read_at?: string | null; // TIMESTAMPTZ
  attachment_url?: string;
  attachment_type?: 'image' | 'pdf' | 'document' | 'file';
  file_name?: string;
  file_size?: number;
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: notifications
// ===========================================
export interface Notification {
  id: string; // UUID
  user_id: string; // UUID
  type: 'connect' | 'connect_accepted' | 'message' | 'like' | 'comment' | 'comment_like' | 'match' | 'mention' | 'system' | 'achievement';
  actor_id?: string; // UUID
  actor_name?: string;
  actor_avatar?: string;
  content: string;
  resource_type?: 'post' | 'profile' | 'conversation' | 'match' | 'comment';
  resource_id?: string; // UUID
  is_read: boolean;
  is_actioned: boolean;
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: ai_mentor_sessions
// ===========================================
export interface AiMentorSession {
  id: string; // UUID
  user_id: string; // UUID
  title?: string;
  status: 'active' | 'archived';
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: ai_mentor_messages
// ===========================================
export interface AiMentorMessage {
  id: string; // UUID
  session_id: string; // UUID
  role: 'user' | 'assistant';
  content: string;
  is_saved_to_profile: boolean;
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: notification_preferences
// ===========================================
export interface NotificationPreference {
  id: string; // UUID
  user_id: string; // UUID (UNIQUE)
  email_new_connections: boolean;
  email_messages: boolean;
  ai_smart_match_alerts: boolean;
  email_post_likes: boolean;
  email_comments: boolean;
  push_enabled: boolean;
  push_new_connections: boolean;
  push_connect_accepted: boolean;
  push_messages: boolean;
  push_match_alerts: boolean;
  push_post_likes: boolean;
  push_comments: boolean;
  push_comment_likes: boolean;
  push_mentions: boolean;
  push_achievements: boolean;
  in_app_notifications: boolean;
  updated_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: theme_preferences
// ===========================================
export interface ThemePreference {
  id: string; // UUID
  user_id: string; // UUID (UNIQUE)
  theme: 'light' | 'dark' | 'system';
  updated_at: string; // TIMESTAMPTZ
}

// ===========================================
// TYPE DEFINITIONS FOR COMPONENTS
// ===========================================

// Extended Post type for UI components (includes author info)
export interface PostWithAuthor extends Post {
  author_name?: string;
  author_role?: string;
  author_avatar?: string;
  time_ago?: string;
  media_url?: string;
  media_urls?: string[];
  media_type?: 'image' | 'video';
}

// Post update input with version for optimistic locking
export interface PostUpdateInput {
  content?: string;
  post_type?: 'project-launch' | 'teammate-request' | 'announcement' | 'general';
  intent?: 'cofounder' | 'teammate' | 'mvp' | 'fyp';
  link_url?: string;
  is_pinned?: boolean;
  is_archived?: boolean;
  version: number; // Required for optimistic locking
}

// Extended MatchSuggestion type for UI components
export interface MatchSuggestionWithProfile extends MatchSuggestion {
  matched_user_name?: string;
  matched_user_role?: string;
  matched_user_avatar?: string;
  matched_user_initials?: string;
  matched_user_bio?: string;
  matched_user_location?: string;
  matched_user_collaboration?: string;
  matched_user_skills?: string[];
  matched_user_interests?: string[];
  matched_user_roles?: string[];
  role_boost?: number;
  role_reason?: string;
  role_match_label?: string;
}

// Extended MatchActivity type for UI components
export interface MatchActivityWithUser extends MatchActivity {
  user_name?: string;
  user_avatar?: string;
  user_initials?: string;
}

// ===========================================
// TABLE: embedding_dead_letter_queue
// ===========================================
export interface EmbeddingDeadLetterQueue {
  id: string; // UUID
  user_id: string; // UUID
  semantic_text: string;
  failure_reason?: string;
  retry_count: number;
  max_retries: number;
  status: 'pending' | 'processing' | 'completed' | 'exhausted';
  last_attempt?: string; // TIMESTAMPTZ
  next_retry?: string; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
  resolved_at?: string; // TIMESTAMPTZ
}

// DLQ Item with profile data for UI
export interface DLQItemWithProfile extends EmbeddingDeadLetterQueue {
  profiles?: {
    display_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

// ===========================================
// TABLE: embedding_pending_queue
// ===========================================
export interface EmbeddingPendingQueue {
  id: string; // UUID
  user_id: string; // UUID (UNIQUE)
  status: 'pending' | 'processing' | 'completed' | 'failed';
  trigger_source: 'onboarding' | 'manual' | 'admin' | 'api';
  metadata?: Record<string, unknown>;
  created_at: string; // TIMESTAMPTZ
  first_attempt?: string; // TIMESTAMPTZ
  last_attempt?: string; // TIMESTAMPTZ
  completed_at?: string; // TIMESTAMPTZ
  failure_reason?: string;
}

// Pending Queue Item with profile data for UI
export interface PendingQueueItemWithProfile extends EmbeddingPendingQueue {
  profiles?: {
    display_name?: string;
    email?: string;
  };
}

// ===========================================
// TABLE: user_analytics
// ===========================================
export interface UserAnalytics {
  user_id: string; // UUID
  profile_views_count: number;
  profile_views_last_7_days: number;
  profile_views_last_30_days: number;
  post_impressions_count: number;
  post_reactions_received: number;
  post_comments_received: number;
  posts_created_count: number;
  match_suggestions_count: number;
  matches_accepted_count: number;
  match_acceptance_rate: number;
  high_confidence_matches_count: number;
  connections_count: number;
  connection_requests_sent: number;
  connection_requests_received: number;
  mutual_connections_avg: number;
  messages_sent_count: number;
  messages_received_count: number;
  conversations_count: number;
  avg_response_time_minutes: number;
  ai_sessions_count: number;
  ai_messages_count: number;
  sessions_count: number;
  total_time_spent_minutes: number;
  last_active?: string; // TIMESTAMPTZ
  last_active_ip?: string;
  engagement_score: number;
  influence_score: number;
  activity_streak_days: number;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// Activity data for charts
export interface AnalyticsActivityData {
  date: string;
  profile_views: number;
  matches: number;
  connections: number;
  posts: number;
}

// ===========================================
// TABLE: profile_visits
// ===========================================
export interface ProfileVisit {
  id: string; // UUID
  viewer_id: string; // UUID
  viewed_id: string; // UUID
  viewed_at: string; // TIMESTAMPTZ
  expires_at: string; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: blocked_users
// ===========================================
export interface BlockedUser {
  id: string; // UUID
  blocker_id: string; // UUID (the user who blocked)
  blocked_id: string; // UUID (the user who is blocked)
  reason?: string;
  created_at: string; // TIMESTAMPTZ
}

// Blocked user with profile data for display
export interface BlockedUserWithProfile extends BlockedUser {
  blocked_profile: {
    id: string;
    display_name?: string;
    full_name?: string;
    avatar_url?: string;
    headline?: string;
  };
}

// ===========================================
// TABLE: privacy_settings
// ===========================================
export interface PrivacySetting {
  user_id: string; // UUID
  profile_visibility: 'public' | 'friends-only' | 'private';
  show_email: boolean;
  show_connections_list: boolean;
  activity_status_visible: boolean;
  allow_data_download: boolean;
  created_at: string; // TIMESTAMPTZ
  updated_at?: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: profile_embeddings
// ===========================================
export interface ProfileEmbedding {
  id: string; // UUID
  user_id: string; // UUID (UNIQUE)
  embedding: string | null; // VECTOR(384) — Supabase returns VECTOR as string
  last_updated: string; // TIMESTAMPTZ
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error_message?: string;
  retry_count: number;
  metadata?: Record<string, unknown>;
}

// ===========================================
// TABLE: feed_scores
// ===========================================
export interface FeedScore {
  id: string; // UUID
  user_id: string; // UUID
  post_id: string; // UUID
  score: number;
  semantic_score: number;
  engagement_score: number;
  recency_score: number;
  connection_boost: number;
  factors: Record<string, unknown>;
  created_at: string; // TIMESTAMPTZ
  expires_at?: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: post_impressions
// ===========================================
export interface PostImpression {
  id: string; // UUID
  user_id: string; // UUID
  post_id: string; // UUID
  impression_count: number;
  last_impression_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: feed_thompson_params
// ===========================================
export interface FeedThompsonParams {
  id: string; // UUID
  user_id: string; // UUID
  post_id: string; // UUID
  alpha: number;
  beta: number;
  successes: number;
  failures: number;
  updated_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: events
// ===========================================
export interface Event {
  id: string; // UUID
  event_type: string;
  event_category?: string;
  actor_id?: string; // UUID
  target_id?: string;
  target_type?: string;
  metadata?: Record<string, unknown>;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: audit_logs
// ===========================================
export interface AuditLog {
  id: string; // UUID
  user_id?: string; // UUID
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: embedding_rate_limits
// ===========================================
export interface EmbeddingRateLimit {
  id: string; // UUID
  user_id: string; // UUID
  request_count: number;
  window_start: string; // TIMESTAMPTZ
  window_end: string; // TIMESTAMPTZ
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: platform_analytics
// ===========================================
export interface PlatformAnalytics {
  date: string; // DATE
  dau: number;
  mau: number;
  wau: number;
  new_users: number;
  deleted_users: number;
  active_users_change: number;
  new_posts: number;
  total_posts: number;
  posts_with_media: number;
  avg_post_length: number;
  new_matches: number;
  total_matches: number;
  avg_match_score: number;
  high_confidence_matches: number;
  new_connections: number;
  total_connections: number;
  connection_acceptance_rate: number;
  pending_requests: number;
  new_messages: number;
  total_messages: number;
  new_conversations: number;
  avg_messages_per_conversation: number;
  total_profile_views: number;
  total_post_reactions: number;
  total_comments: number;
  avg_session_duration_minutes: number;
  ai_sessions_count: number;
  ai_messages_count: number;
  avg_session_length: number;
  content_flagged: number;
  content_approved: number;
  content_rejected: number;
  avg_moderation_time_seconds: number;
  api_requests_count: number;
  avg_api_latency_ms: number;
  error_count: number;
  error_rate: number;
  embeddings_generated: number;
  embeddings_pending: number;
  embeddings_failed: number;
  avg_embedding_time_ms: number;
  created_at: string; // TIMESTAMPTZ
  updated_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: content_moderation_logs
// ===========================================
export interface ContentModerationLog {
  id: string; // UUID
  content_type: string;
  content_id?: string;
  user_id?: string; // UUID
  action: 'approved' | 'flag_for_review' | 'auto_reject';
  risk_score?: number;
  toxicity_score?: number;
  spam_score?: number;
  nsfw_score?: number;
  pii_detected?: boolean;
  details?: Record<string, unknown>;
  moderated_at: string; // TIMESTAMPTZ
}

// ===========================================
// DATABASE TYPE FOR SUPABASE CLIENT GENERICS
// ===========================================
// Used to provide TypeScript type safety for Supabase queries
// Note: This type provides Row types for SELECT queries.
// Insert/Update operations use Partial to avoid strict type errors.
// Supabase v2 compatible Database type
// Uses index signatures for Row/Insert/Update to satisfy Record<string, unknown>
export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile>;
        Update: Partial<Profile>;
        Relationships: [];
      };
      user_skills: {
        Row: UserSkill;
        Insert: Partial<UserSkill>;
        Update: Partial<UserSkill>;
        Relationships: [];
      };
      user_interests: {
        Row: UserInterest;
        Insert: Partial<UserInterest>;
        Update: Partial<UserInterest>;
        Relationships: [];
      };
      user_experiences: {
        Row: UserExperience;
        Insert: Partial<UserExperience>;
        Update: Partial<UserExperience>;
        Relationships: [];
      };
      user_projects: {
        Row: UserProject;
        Insert: Partial<UserProject>;
        Update: Partial<UserProject>;
        Relationships: [];
      };
      posts: {
        Row: Post;
        Insert: Partial<Post>;
        Update: Partial<Post>;
        Relationships: [];
      };
      post_attachments: {
        Row: PostAttachment;
        Insert: Partial<PostAttachment>;
        Update: Partial<PostAttachment>;
        Relationships: [];
      };
      post_reactions: {
        Row: PostReaction;
        Insert: Partial<PostReaction>;
        Update: Partial<PostReaction>;
        Relationships: [];
      };
      comments: {
        Row: Comment;
        Insert: Partial<Comment>;
        Update: Partial<Comment>;
        Relationships: [];
      };
      comment_likes: {
        Row: CommentLike;
        Insert: Partial<CommentLike>;
        Update: Partial<CommentLike>;
        Relationships: [];
      };
      connections: {
        Row: Connection;
        Insert: Partial<Connection>;
        Update: Partial<Connection>;
        Relationships: [];
      };
      match_suggestions: {
        Row: MatchSuggestion;
        Insert: Partial<MatchSuggestion>;
        Update: Partial<MatchSuggestion>;
        Relationships: [];
      };
      match_scores: {
        Row: MatchScore;
        Insert: Partial<MatchScore>;
        Update: Partial<MatchScore>;
        Relationships: [];
      };
      match_activity: {
        Row: MatchActivity;
        Insert: Partial<MatchActivity>;
        Update: Partial<MatchActivity>;
        Relationships: [];
      };
      match_preferences: {
        Row: MatchPreference;
        Insert: Partial<MatchPreference>;
        Update: Partial<MatchPreference>;
        Relationships: [];
      };
      conversations: {
        Row: Conversation;
        Insert: Partial<Conversation>;
        Update: Partial<Conversation>;
        Relationships: [];
      };
      messages: {
        Row: Message;
        Insert: Partial<Message>;
        Update: Partial<Message>;
        Relationships: [];
      };
      notifications: {
        Row: Notification;
        Insert: Partial<Notification>;
        Update: Partial<Notification>;
        Relationships: [];
      };
      ai_mentor_sessions: {
        Row: AiMentorSession;
        Insert: Partial<AiMentorSession>;
        Update: Partial<AiMentorSession>;
        Relationships: [];
      };
      ai_mentor_messages: {
        Row: AiMentorMessage;
        Insert: Partial<AiMentorMessage>;
        Update: Partial<AiMentorMessage>;
        Relationships: [];
      };
      notification_preferences: {
        Row: NotificationPreference;
        Insert: Partial<NotificationPreference>;
        Update: Partial<NotificationPreference>;
        Relationships: [];
      };
      theme_preferences: {
        Row: ThemePreference;
        Insert: Partial<ThemePreference>;
        Update: Partial<ThemePreference>;
        Relationships: [];
      };
      embedding_dead_letter_queue: {
        Row: EmbeddingDeadLetterQueue;
        Insert: Partial<EmbeddingDeadLetterQueue>;
        Update: Partial<EmbeddingDeadLetterQueue>;
        Relationships: [];
      };
      embedding_pending_queue: {
        Row: EmbeddingPendingQueue;
        Insert: Partial<EmbeddingPendingQueue>;
        Update: Partial<EmbeddingPendingQueue>;
        Relationships: [];
      };
      user_analytics: {
        Row: UserAnalytics;
        Insert: Partial<UserAnalytics>;
        Update: Partial<UserAnalytics>;
        Relationships: [];
      };
      blocked_users: {
        Row: BlockedUser;
        Insert: Partial<BlockedUser>;
        Update: Partial<BlockedUser>;
        Relationships: [];
      };
      privacy_settings: {
        Row: PrivacySetting;
        Insert: Partial<PrivacySetting>;
        Update: Partial<PrivacySetting>;
        Relationships: [];
      };
      profile_embeddings: {
        Row: ProfileEmbedding;
        Insert: Partial<ProfileEmbedding>;
        Update: Partial<ProfileEmbedding>;
        Relationships: [];
      };
      profile_visits: {
        Row: ProfileVisit;
        Insert: Partial<ProfileVisit>;
        Update: Partial<ProfileVisit>;
        Relationships: [];
      };
      feed_scores: {
        Row: FeedScore;
        Insert: Partial<FeedScore>;
        Update: Partial<FeedScore>;
        Relationships: [];
      };
      post_impressions: {
        Row: PostImpression;
        Insert: Partial<PostImpression>;
        Update: Partial<PostImpression>;
        Relationships: [];
      };
      feed_thompson_params: {
        Row: FeedThompsonParams;
        Insert: Partial<FeedThompsonParams>;
        Update: Partial<FeedThompsonParams>;
        Relationships: [];
      };
      events: {
        Row: Event;
        Insert: Partial<Event>;
        Update: Partial<Event>;
        Relationships: [];
      };
      audit_logs: {
        Row: AuditLog;
        Insert: Partial<AuditLog>;
        Update: Partial<AuditLog>;
        Relationships: [];
      };
      embedding_rate_limits: {
        Row: EmbeddingRateLimit;
        Insert: Partial<EmbeddingRateLimit>;
        Update: Partial<EmbeddingRateLimit>;
        Relationships: [];
      };
      platform_analytics: {
        Row: PlatformAnalytics;
        Insert: Partial<PlatformAnalytics>;
        Update: Partial<PlatformAnalytics>;
        Relationships: [];
      };
      content_moderation_logs: {
        Row: ContentModerationLog;
        Insert: Partial<ContentModerationLog>;
        Update: Partial<ContentModerationLog>;
        Relationships: [];
      };
    };
    Views: Record<string, Record<string, unknown>>;
    Functions: Record<string, { Args: Record<string, unknown>; Returns: unknown }>;
    Enums: Record<string, unknown>;
  };
};
