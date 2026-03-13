/**
 * Posts Hook - React Query implementation
 * 
 * Provides typed, cached, and optimized post data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchPosts, createPost, deletePost, addReaction, removeReaction } from '@/lib/services/posts'
import type { PostsQueryOptions } from '@/lib/services/posts'
import type { PostWithAuthor } from '@/types/database.types'

export const POST_QUERY_KEYS = {
  all: ['posts'] as const,
  lists: () => [...POST_QUERY_KEYS.all, 'list'] as const,
  list: (filters: PostsQueryOptions) => [...POST_QUERY_KEYS.lists(), filters] as const,
  details: () => [...POST_QUERY_KEYS.all, 'detail'] as const,
  detail: (id: string) => [...POST_QUERY_KEYS.details(), id] as const,
}

export function usePosts(options: PostsQueryOptions = {}) {
  return useQuery({
    queryKey: POST_QUERY_KEYS.list(options),
    queryFn: async () => {
      const { data, error } = await fetchPosts(options)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
    retry: 1,
  })
}

export function useCreatePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.lists() })
    },
  })
}

export function useDeletePost() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: deletePost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.lists() })
    },
  })
}

export function useAddReaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ postId, emoji }: { postId: string; emoji: string }) => addReaction(postId, emoji),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.lists() })
    },
  })
}

export function useRemoveReaction() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: ({ postId }: { postId: string }) => removeReaction(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: POST_QUERY_KEYS.lists() })
    },
  })
}
