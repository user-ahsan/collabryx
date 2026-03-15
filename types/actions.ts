// Shared types for server actions

export interface AuditLogInput {
  action: string
  resource_type?: string
  resource_id?: string
  details?: Record<string, unknown>
}

export interface AuditLogPayload {
  action: string
  userId: string
  metadata?: Record<string, unknown>
  timestamp?: string
  ipAddress?: string
  userAgent?: string
}

export type ProfileUpdatePayload = Partial<{
  full_name: string
  headline: string
  bio: string
  location: string
  website: string
  github: string
  twitter: string
  linkedin: string
  looking_for: string[]
  interests: string[]
}>

export type CommentReactionType = 'like' | 'love' | 'insightful' | 'celebrate' | 'support'

export type PostReactionType = 'like' | 'love' | 'insightful' | 'celebrate' | 'curious'

export type ReactionType = PostReactionType | CommentReactionType
