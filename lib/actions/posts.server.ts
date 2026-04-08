'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { PostReactionType } from '@/types/actions'
import { withAudit } from './audit.server'
import { updatePostWithLock, incrementPostCounter } from '@/lib/services/posts'

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
        .select()
        .single()
    },
    'post_create',
    user.id
  )

  if (error) {
    console.error('Failed to create post:', error)
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
  const { data: existingPost, error: _fetchError } = await supabase
    .from('posts')
    .select('author_id, version')
    .eq('id', postId)
    .single()

  if (!existingPost || existingPost.author_id !== user.id) {
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
    console.error('Failed to update post:', error)
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
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Get current version
  const { data: existingPost } = await supabase
    .from('posts')
    .select('author_id, version')
    .eq('id', postId)
    .single()

  if (!existingPost || existingPost.author_id !== user.id) {
    return { error: 'Post not found or unauthorized' }
  }

  // Soft delete with optimistic locking and audit logging
  const { error, conflict } = await withAudit(
    async () => {
      const result = await updatePostWithLock(postId, {
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
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Valid reaction types
  const validReactions = ['like', 'love', 'celebrate', 'insightful', 'curious']
  if (!validReactions.includes(reactionType)) {
    return { error: 'Invalid reaction type' }
  }

  // Check if user already reacted
  const { data: existingReaction } = await supabase
    .from('post_reactions')
    .select('id, reaction_type')
    .eq('post_id', postId)
    .eq('user_id', user.id)
    .single()

  if (existingReaction) {
    // Toggle off if same reaction
    if ((existingReaction as { reaction_type: PostReactionType }).reaction_type === reactionType) {
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
        .update({ reaction_type: reactionType })
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
        post_id: postId,
        user_id: user.id,
        reaction_type: reactionType,
      })

    if (error) {
      return { error: 'Failed to add reaction' }
    }
  }

  // Get updated count for response (non-critical if fails)
  const { count } = await supabase
    .from('post_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  revalidatePath('/dashboard')
  revalidatePath(`/post/${postId}`)
  
  return { success: true, count: count || 0 }
}

// ===========================================
// SHARE POST (atomic increment)
// ===========================================
export async function sharePost(postId: string) {
  // Use atomic increment to prevent race conditions
  const { error } = await incrementPostCounter(postId, 'share_count', 1)

  if (error) {
    console.error('Failed to share post:', error)
    return { error: 'Failed to share post' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/post/${postId}`)
  
  return { success: true }
}

// ===========================================
// PIN POST (with optimistic locking)
// ===========================================
export async function pinPost(postId: string, pinned: boolean) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Get current version
  const { data: existingPost } = await supabase
    .from('posts')
    .select('author_id, version')
    .eq('id', postId)
    .single()

  if (!existingPost || existingPost.author_id !== user.id) {
    return { error: 'Post not found or unauthorized' }
  }

  // Update with optimistic locking
  const { error, conflict } = await updatePostWithLock(postId, {
    is_pinned: pinned,
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
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Get current version
  const { data: existingPost } = await supabase
    .from('posts')
    .select('author_id, version')
    .eq('id', postId)
    .single()

  if (!existingPost || existingPost.author_id !== user.id) {
    return { error: 'Post not found or unauthorized' }
  }

  // Update with optimistic locking
  const { error, conflict } = await updatePostWithLock(postId, {
    is_archived: archived,
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
