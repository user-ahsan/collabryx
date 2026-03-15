"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as CommentService from "@/lib/services/comments"
import type { CommentWithAuthor } from "@/lib/services/comments"

// ===========================================
// REACT QUERY KEYS
// ===========================================

export const COMMENT_QUERY_KEYS = {
  all: ["comments"] as const,
  byPost: (postId: string) => [...COMMENT_QUERY_KEYS.all, postId] as const,
  byComment: (commentId: string) => [...COMMENT_QUERY_KEYS.all, commentId] as const,
}

// ===========================================
// COMMENTS QUERY HOOK
// ===========================================

export function useComments(postId: string, options?: { limit?: number }) {
  return useQuery<CommentWithAuthor[], Error>({
    queryKey: COMMENT_QUERY_KEYS.byPost(postId),
    queryFn: async () => {
      const { data, error } = await CommentService.fetchCommentsWithReplies(postId)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,  // 30 minutes
    enabled: !!postId,
  })
}

// ===========================================
// CREATE COMMENT MUTATION
// ===========================================

export function useCreateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: CommentService.CreateCommentInput) => 
      CommentService.createComment(input),
    onSuccess: (data, variables) => {
      if (data.error) {
        console.error("Failed to create comment:", data.error)
        return
      }

      // Invalidate comments query for this post
      queryClient.invalidateQueries({ 
        queryKey: COMMENT_QUERY_KEYS.byPost(variables.post_id) 
      })
    },
  })
}

// ===========================================
// DELETE COMMENT MUTATION
// ===========================================

export function useDeleteComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) => CommentService.deleteComment(commentId),
    onSuccess: (_, variables) => {
      // We need to know the post_id to invalidate, so we could pass it or refetch all
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.all })
    },
  })
}

// ===========================================
// UPDATE COMMENT MUTATION
// ===========================================

export function useUpdateComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ commentId, content }: { commentId: string; content: string }) =>
      CommentService.updateComment(commentId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: COMMENT_QUERY_KEYS.byComment(variables.commentId) 
      })
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.all })
    },
  })
}

// ===========================================
// LIKE COMMENT MUTATION
// ===========================================

export function useLikeComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) => CommentService.likeComment(commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: COMMENT_QUERY_KEYS.byComment(variables) 
      })
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.all })
    },
  })
}

// ===========================================
// UNLIKE COMMENT MUTATION
// ===========================================

export function useUnlikeComment() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (commentId: string) => CommentService.unlikeComment(commentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: COMMENT_QUERY_KEYS.byComment(variables) 
      })
      queryClient.invalidateQueries({ queryKey: COMMENT_QUERY_KEYS.all })
    },
  })
}

// ===========================================
// CHECK USER LIKE HOOK
// ===========================================

export function useCheckUserLike(commentId: string) {
  return useQuery({
    queryKey: COMMENT_QUERY_KEYS.byComment(commentId),
    queryFn: async () => {
      const { liked, error } = await CommentService.checkUserLike(commentId)
      if (error) throw error
      return liked
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
    enabled: !!commentId,
  })
}
