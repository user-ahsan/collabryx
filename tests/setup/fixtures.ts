import type { Profile, Post, Comment, Connection, Notification, Conversation, Message } from '@/types/database.types'

export const mockUser: Profile = {
  id: 'test-user-id',
  email: 'test@example.com',
  display_name: 'Test User',
  full_name: 'Test User',
  headline: 'Software Developer',
  bio: 'Test bio',
  avatar_url: undefined,
  banner_url: undefined,
  location: 'Remote',
  website_url: undefined,
  collaboration_readiness: 'open',
  is_verified: false,
  verification_type: undefined,
  university: undefined,
  profile_completion: 50,
  looking_for: ['collaboration'],
  onboarding_completed: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockPost: Post = {
  id: 'test-post-id',
  author_id: 'test-user-id',
  content: 'Test post content',
  post_type: 'general',
  intent: 'mvp',
  link_url: undefined,
  is_pinned: false,
  is_archived: false,
  reaction_count: 0,
  comment_count: 0,
  share_count: 0,
  version: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export interface PostWithAuthor extends Post {
  author_name: string
  author_role: string
  author_avatar: string | undefined
  time_ago: string
}

export const mockPostWithAuthor: PostWithAuthor = {
  ...mockPost,
  author_name: 'Test User',
  author_role: 'Member',
  author_avatar: undefined,
  time_ago: 'Just now',
}

export const mockComment: Comment = {
  id: 'test-comment-id',
  post_id: 'test-post-id',
  author_id: 'test-user-id',
  content: 'Test comment',
  parent_id: undefined,
  like_count: 0,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockConnection: Connection = {
  id: 'test-connection-id',
  requester_id: 'test-user-id',
  receiver_id: 'test-user-2-id',
  status: 'accepted',
  message: undefined,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

export const mockNotification: Notification = {
  id: 'test-notification-id',
  user_id: 'test-user-id',
  type: 'connect',
  actor_id: 'test-user-2-id',
  actor_name: 'Test User 2',
  actor_avatar: undefined,
  content: 'Your connection request was accepted',
  resource_type: 'profile',
  resource_id: undefined,
  is_read: false,
  is_actioned: false,
  created_at: new Date().toISOString(),
}

export const mockConversation: Conversation = {
  id: 'test-conversation-id',
  participant_1: 'test-user-id',
  participant_2: 'test-user-2-id',
  last_message_text: undefined,
  last_message_at: undefined,
  unread_count_1: 0,
  unread_count_2: 0,
  is_archived: false,
  created_at: new Date().toISOString(),
}

export const mockMessage: Message = {
  id: 'test-message-id',
  conversation_id: 'test-conversation-id',
  sender_id: 'test-user-id',
  text: 'Test message',
  is_read: false,
  created_at: new Date().toISOString(),
}

// Helper function to create mock users
export function createMockUser(overrides?: Partial<Profile>) {
  return { ...mockUser, ...overrides }
}

// Helper function to create mock posts
export function createMockPost(overrides?: Partial<Post>) {
  return { ...mockPost, ...overrides }
}

// Helper function to create mock comments
export function createMockComment(overrides?: Partial<Comment>) {
  return { ...mockComment, ...overrides }
}
