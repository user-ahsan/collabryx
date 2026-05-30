'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { PostReactionType } from '@/types/actions'
import { withAudit } from './audit.server'
import { updatePostWithLock, incrementPostCounter } from '@/lib/services/posts'
import { logger } from '@/lib/logger'

// ===========================================
// POSTS SERVER ACTIONS
// ===========================================

// Validation schemas
const CreatePostSchema = z.object({
  content: z.string().min(1, 'Content is required').max(5000, 'Content too long (max 5000 characters)'),
  post_type: z.enum(['project-launch', 'teammate-request', 'announcement', 'general']),
  intent: z.enum(['cofounder', 'teammate', 'mvp', 'fyp']).optional(),
  link_url: z.string().url().optional().or(z.literal('')),
  is_pinned: z.boolean().default(false),
})

const UpdatePostWithVersionSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  post_type: z.enum(['project-launch', 'teammate-request', 'announcement', 'general']).optional(),
  intent: z.enum(['cofounder', 'teammate', 'mvp', 'fyp']).optional(),
  link_url: z.string().url().optional().or(z.literal('')).optional(),
  is_pinned: z.boolean().optional(),
  version: z.number().min(1, 'Version is required for optimistic locking'),
})

// ===========================================
// CREATE POST
// ===========================================
export async function createPost(formData: FormData) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Parse and validate form data
  const validated = CreatePostSchema.safeParse({
    content: formData.get('content'),
    post_type: formData.get('post_type'),
    intent: formData.get('intent'),
    link_url: formData.get('link_url'),
    is_pinned: formData.get('is_pinned') === 'true',
  })

  if (!validated.success) {
    return { 
      error: 'Invalid input', 
      details: validated.error.issues 
    }
  }

  // Create post with audit logging
  const { data: post, error } = await withAudit(
    async () => {
      return await supabase
        .from('posts')
        .insert({
          author_id: user.id,
          ...validated.data,
        })
        .select('id, author_id, content, post_type, intent, link_url, is_pinned, is_archived, reaction_count, comment_count, share_count, version, created_at, updated_at')
        .single()
    },
    'post_create',
    user.id
  )

  if (error) {
    logger.db.error('Failed to create post:', error)
    return { error: 'Failed to create post' }
  }

  // Revalidate dashboard to show new post
  revalidatePath('/dashboard')
  
  return { data: post }
}

// ===========================================
// UPDATE POST (with optimistic locking)
// ===========================================
export async function updatePost(postId: string, formData: FormData) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Get current post with version
  const { data: existingPost, error: fetchError } = await supabase
    .from('posts')
    .select('author_id, version')
    .eq('id', postId)
    .single()

  if (fetchError || !existingPost || existingPost.author_id !== user.id) {
    return { error: 'Post not found or unauthorized' }
  }

  // Parse and validate (version required from formData or hidden input)
  const validated = UpdatePostWithVersionSchema.safeParse({
    content: formData.get('content'),
    post_type: formData.get('post_type'),
    intent: formData.get('intent'),
    link_url: formData.get('link_url'),
    is_pinned: formData.get('is_pinned') === 'true',
    version: parseInt(formData.get('version') as string) || existingPost.version,
  })

  if (!validated.success) {
    return { error: 'Invalid input', details: validated.error.issues }
  }

  // Update with optimistic locking and retry logic
  const { data, error, conflict } = await updatePostWithLock(
    postId,
    validated.data,
    {
      maxRetries: 3,
      onRetry: (attempt, err) => {
        console.log(`Retry ${attempt} for post update:`, err.message)
      },
    }
  )

  if (conflict) {
    return { error: 'Post was modified by another user. Please refresh and try again.' }
  }

  if (error) {
    logger.db.error('Failed to update post:', error)
    return { error: 'Failed to update post' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/post/${postId}`)
  
  return { success: true, data }
}

// ===========================================
// DELETE POST (Soft Delete with optimistic locking)
// ===========================================
export async function deletePost(postId: string) {
  const supabase = await createClient()

  // Validate input
  const inputValidated = z.string().uuid('Invalid post ID').safeParse(postId)
  if (!inputValidated.success) {
    return { error: 'Invalid input', details: inputValidated.error.issues }
  }
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Get current version
  const { data: existingPost, error: fetchError } = await supabase
    .from('posts')
    .select('author_id, version')
    .eq('id', inputValidated.data)
    .single()

  if (fetchError || !existingPost || existingPost.author_id !== user.id) {
    return { error: 'Post not found or unauthorized' }
  }

  // Soft delete with optimistic locking and audit logging
  const { error, conflict } = await withAudit(
    async () => {
      const result = await updatePostWithLock(inputValidated.data, {
        is_archived: true,
        version: existingPost.version,
      })
      
      if (result.conflict) {
        throw new Error('Post was modified')
      }
      
      if (result.error) {
        throw result.error
      }
      
      return result
    },
    'post_delete',
    user.id
  )

  if (conflict || error) {
    return { error: 'Post was modified. Please refresh and try again.' }
  }

  revalidatePath('/dashboard')
  
  return { success: true }
}

// ===========================================
// REACT TO POST
// ===========================================
export async function reactToPost(postId: string, reactionType: string) {
  const supabase = await createClient()

  // Validate input
  const ReactToPostSchema = z.object({
    postId: z.string().uuid('Invalid post ID'),
    reactionType: z.enum(['like', 'love', 'celebrate', 'insightful', 'curious']),
  })
  const inputValidated = ReactToPostSchema.safeParse({ postId, reactionType })
  if (!inputValidated.success) {
    return { error: 'Invalid input', details: inputValidated.error.issues }
  }

  const { postId: validPostId, reactionType: validReaction } = inputValidated.data
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Check if user already reacted
  const { data: existingReaction, error: reactionFetchError } = await supabase
    .from('post_reactions')
    .select('id, emoji')
    .eq('post_id', validPostId)
    .eq('user_id', user.id)
    .single()

  if (reactionFetchError && reactionFetchError.code !== 'PGRST116') {
    return { error: 'Failed to check existing reaction' }
  }

  if (existingReaction) {
    // Toggle off if same reaction
    if ((existingReaction as { emoji: PostReactionType }).emoji === validReaction) {
      const { error } = await supabase
        .from('post_reactions')
        .delete()
        .eq('id', existingReaction.id)

      if (error) {
        return { error: 'Failed to remove reaction' }
      }
    } else {
      // Update to new reaction
      const { error } = await supabase
        .from('post_reactions')
        .update({ emoji: validReaction })
        .eq('id', existingReaction.id)

      if (error) {
        return { error: 'Failed to update reaction' }
      }
    }
  } else {
    // Create new reaction
    const { error } = await supabase
      .from('post_reactions')
      .insert({
        post_id: validPostId,
        user_id: user.id,
        emoji: validReaction,
      })

    if (error) {
      return { error: 'Failed to add reaction' }
    }
  }

  // Get updated count for response (non-critical if fails)
  const { count } = await supabase
    .from('post_reactions')
    .select('id', { count: 'exact', head: true })
    .eq('post_id', validPostId)

  revalidatePath('/dashboard')
  revalidatePath(`/post/${validPostId}`)
  
  return { success: true, count: count || 0 }
}

// ===========================================
// SHARE POST (atomic increment)
// ===========================================
export async function sharePost(postId: string) {
  // Validate input
  const inputValidated = z.string().uuid('Invalid post ID').safeParse(postId)
  if (!inputValidated.success) {
    return { error: 'Invalid input', details: inputValidated.error.issues }
  }

  // Use atomic increment to prevent race conditions
  const { error } = await incrementPostCounter(inputValidated.data, 'share_count', 1)

  if (error) {
    logger.db.error('Failed to share post:', error)
    return { error: 'Failed to share post' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/post/${inputValidated.data}`)
  
  return { success: true }
}

// ===========================================
// PIN POST (with optimistic locking)
// ===========================================
export async function pinPost(postId: string, pinned: boolean) {
  const supabase = await createClient()

  // Validate input
  const PinPostSchema = z.object({
    postId: z.string().uuid('Invalid post ID'),
    pinned: z.boolean(),
  })
  const inputValidated = PinPostSchema.safeParse({ postId, pinned })
  if (!inputValidated.success) {
    return { error: 'Invalid input', details: inputValidated.error.issues }
  }

  const { postId: validPostId, pinned: validPinned } = inputValidated.data
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Get current version
  const { data: existingPost, error: fetchError } = await supabase
    .from('posts')
    .select('author_id, version')
    .eq('id', validPostId)
    .single()

  if (fetchError || !existingPost || existingPost.author_id !== user.id) {
    return { error: 'Post not found or unauthorized' }
  }

  // Update with optimistic locking
  const { error, conflict } = await updatePostWithLock(validPostId, {
    is_pinned: validPinned,
    version: existingPost.version,
  })

  if (conflict) {
    return { error: 'Post was modified. Please refresh and try again.' }
  }

  if (error) {
    return { error: 'Failed to update pin status' }
  }

  revalidatePath('/dashboard')
  
  return { success: true }
}

// ===========================================
// ARCHIVE POST (with optimistic locking)
// ===========================================
export async function archivePost(postId: string, archived: boolean) {
  const supabase = await createClient()

  // Validate input
  const ArchivePostSchema = z.object({
    postId: z.string().uuid('Invalid post ID'),
    archived: z.boolean(),
  })
  const inputValidated = ArchivePostSchema.safeParse({ postId, archived })
  if (!inputValidated.success) {
    return { error: 'Invalid input', details: inputValidated.error.issues }
  }

  const { postId: validPostId, archived: validArchived } = inputValidated.data
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Get current version
  const { data: existingPost, error: fetchError } = await supabase
    .from('posts')
    .select('author_id, version')
    .eq('id', validPostId)
    .single()

  if (fetchError || !existingPost || existingPost.author_id !== user.id) {
    return { error: 'Post not found or unauthorized' }
  }

  // Update with optimistic locking
  const { error, conflict } = await updatePostWithLock(validPostId, {
    is_archived: validArchived,
    version: existingPost.version,
  })

  if (conflict) {
    return { error: 'Post was modified. Please refresh and try again.' }
  }

  if (error) {
    return { error: 'Failed to archive post' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/my-profile')
  
  return { success: true }
}
