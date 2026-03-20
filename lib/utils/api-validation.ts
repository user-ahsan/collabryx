/**
 * API Request Validation Utilities
 * 
 * Centralized validation schemas and utilities for all API endpoints
 * Implements Zod validation for request bodies, query params, and headers
 */

import { z } from "zod"

// ===========================================
// COMMON VALIDATION SCHEMAS
// ===========================================

/**
 * UUID validation for user IDs, session IDs, etc.
 */
export const uuidSchema = z.string().uuid("Invalid UUID format")

/**
 * Pagination schema for list endpoints
 */
export const paginationSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
})

/**
 * Authentication header validation
 */
export const authHeaderSchema = z.object({
  authorization: z.string().optional(),
})

/**
 * Content-Type header validation
 */
export const contentTypeSchema = z.object({
  "content-type": z.string().optional(),
})

// ===========================================
// USER & AUTH SCHEMAS
// ===========================================

export const userUpdateSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long").optional(),
  bio: z.string().max(500, "Bio too long").optional(),
  avatar_url: z.string().url("Invalid URL").optional(),
  banner_url: z.string().url("Invalid URL").optional(),
  location: z.string().max(100, "Location too long").optional(),
  website: z.string().url("Invalid URL").optional(),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
})

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
})

export const resetPasswordSchema = z.object({
  token: z.string(),
  password: z.string().min(8, "Password must be at least 8 characters").max(128),
})

// ===========================================
// POST & CONTENT SCHEMAS
// ===========================================

export const postCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  content: z.string().min(1, "Content is required").max(10000, "Content too long"),
  tags: z.array(z.string().max(50)).max(10, "Maximum 10 tags").optional(),
  project_type: z.string().max(50).optional(),
  looking_for: z.array(z.string().max(50)).max(10).optional(),
})

export const postUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  tags: z.array(z.string().max(50)).max(10).optional(),
  status: z.enum(["draft", "published", "archived"]).optional(),
})

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(2000, "Comment too long"),
  post_id: uuidSchema,
  parent_id: uuidSchema.optional(),
})

export const reactionSchema = z.object({
  post_id: uuidSchema,
  type: z.enum(["like", "love", "insight", "celebrate"]),
})

// ===========================================
// MATCHING & CONNECTIONS SCHEMAS
// ===========================================

export const matchGenerateSchema = z.object({
  user_id: uuidSchema.optional(),
  limit: z.number().min(1).max(100).default(20),
  min_score: z.number().min(0).max(100).default(50),
})

export const connectionRequestSchema = z.object({
  target_user_id: uuidSchema,
  message: z.string().max(500, "Message too long").optional(),
})

export const connectionResponseSchema = z.object({
  request_id: uuidSchema,
  action: z.enum(["accept", "decline"]),
  message: z.string().max(500).optional(),
})

// ===========================================
// MESSAGING SCHEMAS
// ===========================================

export const messageSendSchema = z.object({
  conversation_id: uuidSchema.optional(),
  recipient_id: uuidSchema.optional(),
  content: z.string().min(1, "Message cannot be empty").max(5000, "Message too long"),
  attachment_url: z.string().url().optional(),
})

export const conversationCreateSchema = z.object({
  participant_ids: z.array(uuidSchema).min(2).max(10, "Maximum 10 participants"),
  title: z.string().max(100).optional(),
})

// ===========================================
// NOTIFICATION SCHEMAS
// ===========================================

export const notificationPreferenceSchema = z.object({
  email_notifications: z.boolean().optional(),
  push_notifications: z.boolean().optional(),
  match_notifications: z.boolean().optional(),
  message_notifications: z.boolean().optional(),
  mention_notifications: z.boolean().optional(),
})

// ===========================================
// ACTIVITY TRACKING SCHEMAS
// ===========================================

export const activityTrackSchema = z.object({
  action: z.enum(["view", "click", "search", "share", "like", "comment"]),
  target_type: z.enum(["profile", "post", "project", "match"]),
  target_id: uuidSchema,
  metadata: z.record(z.string(), z.unknown()).optional(),
})

export const activityFeedSchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  offset: z.coerce.number().min(0).default(0),
  action: z.enum(["view", "click", "search", "share", "like", "comment"]).optional(),
})

// ===========================================
// AI & CHAT SCHEMAS
// ===========================================

export const aiMessageSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  session_id: uuidSchema.optional().nullable(),
  context: z.object({
    page: z.string().optional(),
    user_action: z.string().optional(),
  }).optional(),
})

export const aiMentorSchema = z.object({
  user_id: uuidSchema,
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  session_id: uuidSchema.optional().nullable(),
})

// ===========================================
// MODERATION SCHEMAS
// ===========================================

export const moderateContentSchema = z.object({
  content: z.string().min(1, "Content cannot be empty"),
  content_type: z.enum(["post", "comment", "message", "profile"]).default("post"),
  user_id: uuidSchema.optional(),
})

// ===========================================
// EMBEDDING SCHEMAS
// ===========================================

export const embeddingGenerateSchema = z.object({
  user_id: uuidSchema,
  content: z.string().min(1, "Content required").max(5000, "Content too long"),
  content_type: z.enum(["profile", "post", "skill"]),
})

export const embeddingRetrySchema = z.object({
  embedding_id: uuidSchema,
  force: z.boolean().default(false),
})

// ===========================================
// UPLOAD SCHEMAS
// ===========================================

export const uploadSchema = z.object({
  fileName: z.string().min(1).max(255, "File name too long"),
  fileSize: z.number().min(1).max(10 * 1024 * 1024, "File too large"),
  fileType: z.string().min(1),
  uploadType: z.enum(["post", "avatar", "banner", "message"]),
})

// ===========================================
// ANALYTICS SCHEMAS
// ===========================================

export const analyticsDailySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
  user_id: uuidSchema.optional(),
})

// ===========================================
// QUERY PARAMETER SCHEMAS
// ===========================================

export const searchQuerySchema = z.object({
  q: z.string().min(1, "Search query required").max(200, "Query too long"),
  type: z.enum(["users", "posts", "projects", "all"]).default("all"),
  limit: z.coerce.number().min(1).max(50).default(20),
  offset: z.coerce.number().min(0).default(0),
})

export const userIdParamSchema = z.object({
  userId: uuidSchema,
})

export const postIdParamSchema = z.object({
  postId: uuidSchema,
})

export const conversationIdParamSchema = z.object
