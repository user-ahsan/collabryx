/**
 * Comments Hook - React Query implementation
 * Provides typed, cached comment data fetching with real-time updates
 * 
 * @module hooks/use-comments
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  fetchComments, 
  createComment, 
  deleteComment, 
  likeComment, 
  unlikeComment,
  type FetchCommentsOptions 
} from '@/lib/services/comments'
import type { CommentWithAuthor } from '@/lib/services/comments'

// ===========================================
// QUERY KEYS
// ===========================================

export const COMMENT_QUERY_KEYS = {
  all: ['comments'] as const,
  byPost: (postId: string) => [...COMMENT_QUERY_KEYS.all, 'post', postId] as const,
  byId: (commentId: string) => [...COMMENT_QUERY_KEYS.all, 'comment', commentId] as const,
}

// ===========================================
// HOOKS
// ===========================================

/**
 * Fetch comments for a post with caching and real-time updates
 * 
 * @param postId - Post UUID to fetch comments for
 * @param options - Optional fetch options (limit, includeReplies)
 * 
 * @example
 * ```tsx
 * const { data: comments, isLoading, error } = useComments(postId, { limit: 10 })
 * ```
 */
export function useComments(postId: string, options?: Partial<FetchCommentsOptions>) {
  return useQuery({
    queryKey: COMMENT_QUERY_KEYS.byPost(postId),
    queryFn: async () => {
      const { data, error } = await fetchComments({
        postId,
        limit: options?.limit,
        includeReplies: options?.includeReplies !== false,
      })
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
    retry: 1,
    enabled: !!postId,
  })
}

/**
 * Create a new comment mutation
 * Invalidates comments query on success
 * 
 * @param postId - Post UUID to create comment for
 * 
 * @example
 * ```tsx
 * const { mutate: createComment, isPending } = useCreateComment(postId)
 * createComment('Great post!', { onSuccess: () => toast.success('Comment added') })
 * ```
 */
export function useCreateComment(postId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (content: string) => {
      const { data, error } = await createComment({ post_id: postId, content })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate comments query to refetch
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.byPost(postId) })
      // Also invalidate posts feed to update comment counts
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

/**
 * Delete a comment mutation
 * Invalidates comments query on success
 * 
 * @param postId - Post UUID
 * 
 * @example
 * ```tsx
 * const { mutate: deleteComment } = useDeleteComment(postId)
 * deleteComment(commentId)
 * ```
 */
export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await deleteComment(commentId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.byPost(postId) })
    },
  })
}

/**
 * Like a comment mutation
 * Invalidates comments query on success
 * 
 * @param postId - Post UUID
 * 
 * @example
 * ```tsx
 * const { mutate: likeComment } = useLikeComment(postId)
 * likeComment(commentId)
 * ```
 */
export function useLikeComment(postId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { data, error } = await likeComment(commentId)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.byPost(postId) })
      // Also invalidate posts feed to update comment counts
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

/**
 * Unlike a comment mutation
 * Invalidates comments query on success
 * 
 * @param postId - Post UUID
 * 
 * @example
 * ```tsx
 * const { mutate: unlikeComment } = useUnlikeComment(postId)
 * unlikeComment(commentId)
 * ```
 */
export function useUnlikeComment(postId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (commentId: string) => {
      const { error } = await unlikeComment(commentId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.byPost(postId) })
      // Also invalidate posts feed to update comment counts
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}

/**
 * Toggle like on a comment with OPTIMISTIC UPDATE
 * Provides instant UI feedback before server confirmation
 * 
 * @param postId - Post UUID
 * 
 * @example
 * ```tsx
 * const { mutate: toggleLike } = useToggleLikeComment(postId)
 * toggleLike({ commentId, isLiked: comment.user_has_liked })
 * ```
 */
export function useToggleLikeComment(postId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) => {
      if (isLiked) {
        const { error } = await unlikeComment(commentId)
        if (error) throw error
      } else {
        const { data, error } = await likeComment(commentId)
        if (error) throw error
        return data
      }
    },
    onMutate: async ({ commentId, isLiked }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: COMMENT_QUERY_KEYS.byPost(postId) })
      
      // Snapshot previous value
      const previousComments = queryClient.getQueryData<CommentWithAuthor[]>(
        COMMENT_QUERY_KEYS.byPost(postId)
      )
      
      // Optimistically update like status
      if (previousComments) {
        const updatedComments = previousComments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              user_has_liked: isLiked,
              like_count: isLiked ? (comment.like_count || 0) - 1 : (comment.like_count || 0) + 1,
            }
          }
          return comment
        })
        queryClient.setQueryData(COMMENT_QUERY_KEYS.byPost(postId), updatedComments)
      }
      
      return { previousComments }
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousComments) {
        queryClient.setQueryData(
          COMMENT_QUERY_KEYS.byPost(postId),
          context.previousComments
        )
      }
    },
    onSettled: () => {
      // Always refetch after mutation
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.byPost(postId) })
      // Also invalidate posts feed to update comment counts
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })
}
