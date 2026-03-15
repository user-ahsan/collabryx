'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { CommentReactionType } from '@/types/actions'

// ===========================================
// COMMENTS SERVER ACTIONS
// ===========================================

const CreateCommentSchema = z.object({
  content: z.string().min(1, 'Comment content is required').max(2000, 'Comment too long'),
  post_id: z.string().uuid(),
  parent_id: z.string().uuid().optional(),
})

// ===========================================
// CREATE COMMENT
// ===========================================
export async function createComment(formData: FormData) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const validated = CreateCommentSchema.safeParse({
    content: formData.get('content'),
    post_id: formData.get('post_id'),
    parent_id: formData.get('parent_id'),
  })

  if (!validated.success) {
    return { error: 'Invalid input', details: validated.error.issues }
  }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({
      post_id: validated.data.post_id,
      author_id: user.id,
      content: validated.data.content,
      parent_id: validated.data.parent_id,
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create comment:', error)
    return { error: 'Failed to create comment' }
  }

  // Update comment count on post
  const { count } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', validated.data.post_id)

  await supabase
    .from('posts')
    .update({ comment_count: count || 0 })
    .eq('id', validated.data.post_id)

  revalidatePath(`/post/${validated.data.post_id}`)
  
  return { data: comment }
}

// ===========================================
// UPDATE COMMENT
// ===========================================
export async function updateComment(commentId: string, content: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { data: existingComment } = await supabase
    .from('comments')
    .select('author_id, post_id')
    .eq('id', commentId)
    .single()

  if (!existingComment || existingComment.author_id !== user.id) {
    return { error: 'Comment not found or unauthorized' }
  }

  const validated = z.string().min(1).max(2000).safeParse(content)
  if (!validated.success) {
    return { error: 'Invalid content' }
  }

  const { error } = await supabase
    .from('comments')
    .update({ content: validated.data })
    .eq('id', commentId)

  if (error) {
    return { error: 'Failed to update comment' }
  }

  revalidatePath(`/post/${existingComment.post_id}`)
  
  return { success: true }
}

// ===========================================
// DELETE COMMENT
// ===========================================
export async function deleteComment(commentId: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const { data: existingComment } = await supabase
    .from('comments')
    .select('author_id, post_id')
    .eq('id', commentId)
    .single()

  if (!existingComment || existingComment.author_id !== user.id) {
    return { error: 'Comment not found or unauthorized' }
  }

  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)

  if (error) {
    return { error: 'Failed to delete comment' }
  }

  // Update comment count
  const { count } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', existingComment.post_id)

  await supabase
    .from('posts')
    .update({ comment_count: count || 0 })
    .eq('id', existingComment.post_id)

  revalidatePath(`/post/${existingComment.post_id}`)
  
  return { success: true }
}

// ===========================================
// REACT TO COMMENT
// ===========================================
export async function reactToComment(commentId: string, reactionType: string) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'Unauthorized' }
  }

  const validReactions = ['like', 'love', 'celebrate', 'insightful']
  if (!validReactions.includes(reactionType)) {
    return { error: 'Invalid reaction type' }
  }

  const { data: existingReaction } = await supabase
    .from('comment_likes')
    .select('id, reaction_type')
    .eq('comment_id', commentId)
    .eq('user_id', user.id)
    .single()

  if (existingReaction) {
    if ((existingReaction as { reaction_type: CommentReactionType }).reaction_type === reactionType) {
      const { error } = await supabase
        .from('comment_likes')
        .delete()
        .eq('id', existingReaction.id)

      if (error) {
        return { error: 'Failed to remove reaction' }
      }
    } else {
      const { error } = await supabase
        .from('comment_likes')
        .update({ reaction_type: reactionType })
        .eq('id', existingReaction.id)

      if (error) {
        return { error: 'Failed to update reaction' }
      }
    }
  } else {
    const { error } = await supabase
      .from('comment_likes')
      .insert({
        comment_id: commentId,
        user_id: user.id,
        reaction_type: reactionType,
      })

    if (error) {
      return { error: 'Failed to add reaction' }
    }
  }

  revalidatePath(`/post/${commentId}`)
  
  return { success: true }
}
