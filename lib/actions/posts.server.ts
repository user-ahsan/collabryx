'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { PostReactionType } from '@/types/actions'

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

const UpdatePostSchema = z.object({
  content: z.string().min(1).max(5000).optional(),
  post_type: z.enum(['project-launch', 'teammate-request', 'announcement', 'general']).optional(),
  intent: z.enum(['cofounder', 'teammate', 'mvp', 'fyp']).optional(),
  link_url: z.string().url().optional().or(z.literal('')).optional(),
  is_pinned: z.boolean().optional(),
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

  // Create post
  const { data: post, error } = await supabase
    .from('posts')
    .insert({
      author_id: user.id,
      ...validated.data,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create post:', error)
    return { error: 'Failed to create post' }
  }

  // Revalidate dashboard to show new post
  revalidatePath('/dashboard')
  
  return { data: post }
}

// ===========================================
// UPDATE POST
// ===========================================
export async function updatePost(postId: string, formData: FormData) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Verify ownership
  const { data: existingPost } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single()

  if (!existingPost || existingPost.author_id !== user.id) {
    return { error: 'Post not found or unauthorized' }
  }

  // Parse and validate
  const validated = UpdatePostSchema.safeParse({
    content: formData.get('content'),
    post_type: formData.get('post_type'),
    intent: formData.get('intent'),
    link_url: formData.get('link_url'),
    is_pinned: formData.get('is_pinned') === 'true',
  })

  if (!validated.success) {
    return { error: 'Invalid input', details: validated.error.issues }
  }

  // Update post
  const { error } = await supabase
    .from('posts')
    .update(validated.data)
    .eq('id', postId)

  if (error) {
    console.error('Failed to update post:', error)
    return { error: 'Failed to update post' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/post/${postId}`)
  
  return { success: true }
}

// ===========================================
// DELETE POST (Soft Delete)
// ===========================================
export async function deletePost(postId: string) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Verify ownership
  const { data: existingPost } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single()

  if (!existingPost || existingPost.author_id !== user.id) {
    return { error: 'Post not found or unauthorized' }
  }

  // Soft delete by setting is_archived to true
  const { error } = await supabase
    .from('posts')
    .update({ is_archived: true })
    .eq('id', postId)

  if (error) {
    console.error('Failed to delete post:', error)
    return { error: 'Failed to delete post' }
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

  // Update reaction count
  const { count } = await supabase
    .from('post_reactions')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', postId)

  await supabase
    .from('posts')
    .update({ reaction_count: count || 0 })
    .eq('id', postId)

  revalidatePath('/dashboard')
  revalidatePath(`/post/${postId}`)
  
  return { success: true, count: count || 0 }
}

// ===========================================
// SHARE POST
// ===========================================
export async function sharePost(postId: string) {
  const supabase = await createClient()
  
  // Increment share count
  const { data: post } = await supabase
    .from('posts')
    .select('share_count')
    .eq('id', postId)
    .single()

  if (!post) {
    return { error: 'Post not found' }
  }

  const { error } = await supabase
    .from('posts')
    .update({ share_count: (post.share_count || 0) + 1 })
    .eq('id', postId)

  if (error) {
    return { error: 'Failed to share post' }
  }

  revalidatePath('/dashboard')
  revalidatePath(`/post/${postId}`)
  
  return { success: true }
}

// ===========================================
// PIN POST
// ===========================================
export async function pinPost(postId: string, pinned: boolean) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Verify ownership
  const { data: existingPost } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single()

  if (!existingPost || existingPost.author_id !== user.id) {
    return { error: 'Post not found or unauthorized' }
  }

  const { error } = await supabase
    .from('posts')
    .update({ is_pinned: pinned })
    .eq('id', postId)

  if (error) {
    return { error: 'Failed to update pin status' }
  }

  revalidatePath('/dashboard')
  
  return { success: true }
}

// ===========================================
// ARCHIVE POST
// ===========================================
export async function archivePost(postId: string, archived: boolean) {
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  // Verify ownership
  const { data: existingPost } = await supabase
    .from('posts')
    .select('author_id')
    .eq('id', postId)
    .single()

  if (!existingPost || existingPost.author_id !== user.id) {
    return { error: 'Post not found or unauthorized' }
  }

  const { error } = await supabase
    .from('posts')
    .update({ is_archived: archived })
    .eq('id', postId)

  if (error) {
    return { error: 'Failed to archive post' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/my-profile')
  
  return { success: true }
}
