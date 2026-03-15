/**
 * Comments Hook - React Query implementation
 * 
 * Provides typed, cached comment data fetching with real-time updates
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
 * Fetch comments for a post
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
 * Create a new comment
 */
export function useCreateComment(postId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (content: string) => createComment({ post_id: postId, content }),
    onSuccess: () => {
      // Invalidate comments query to refetch
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.byPost(postId) })
    },
  })
}

/**
 * Delete a comment
 */
export function useDeleteComment(postId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (commentId: string) => deleteComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.byPost(postId) })
    },
  })
}

/**
 * Like a comment
 */
export function useLikeComment(postId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (commentId: string) => likeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.byPost(postId) })
    },
  })
}

/**
 * Unlike a comment
 */
export function useUnlikeComment(postId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: (commentId: string) => unlikeComment(commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.byPost(postId) })
    },
  })
}

/**
 * Toggle like on a comment (optimistic update)
 */
export function useToggleLikeComment(postId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ commentId, isLiked }: { commentId: string; isLiked: boolean }) => {
      if (isLiked) {
        return unlikeComment(commentId)
      } else {
        return likeComment(commentId)
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
    },
  })
}
