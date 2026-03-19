// Auto-generated types from Supabase schema based on 99-master-all-tables.sql
// Types for the Collabryx database schema

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
  company: string;
  description?: string;
  start_date: string; // DATE
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
  reasons: string[]; // JSONB array
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
  skills_overlap: number; // 0-100
  complementary_score: number; // 0-100
  shared_interests: number; // 0-100
  availability_score?: number; // 0-100
  overlapping_skills: string[];
  complementary_explanation?: string;
  shared_interest_tags: string[];
  insights?: string[]; // JSONB
  created_at: string; // TIMESTAMPTZ
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
  attachment_url?: string;
  attachment_type?: 'image' | 'file';
  created_at: string; // TIMESTAMPTZ
}

// ===========================================
// TABLE: notifications
// ===========================================
export interface Notification {
  id: string; // UUID
  user_id: string; // UUID
  type: 'connect' | 'message' | 'like' | 'comment' | 'system' | 'match';
  actor_id?: string; // UUID
  actor_name?: string;
  actor_avatar?: string;
  content: string;
  resource_type?: 'post' | 'profile' | 'conversation' | 'match';
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

// Extended MatchSuggestion type for UI components
export interface MatchSuggestionWithProfile extends MatchSuggestion {
  matched_user_name?: string;
  matched_user_role?: string;
  matched_user_avatar?: string;
  matched_user_initials?: string;
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
// TABLE: blocked_users
// ===========================================
export interface BlockedUser {
  id: string; // UUID
  blocker_id: string; // UUID (the user who blocked)
  blocked_id: string; // UUID (the user who is blocked)
  reason?: string;
  created_at: string; // TIMESTAMPTZ
  updated_at?: string; // TIMESTAMPTZ
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
