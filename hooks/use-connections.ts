/**
 * Connections Hook - React Query implementation
 * Provides typed, cached connection data fetching with real-time updates
 * 
 * @module hooks/use-connections
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchConnectionRequests,
  fetchConnections,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
  checkConnectionStatus,
  type FetchConnectionsOptions,
} from '@/lib/services/connections'

// ===========================================
// QUERY KEYS
// ===========================================

export const CONNECTION_QUERY_KEYS = {
  all: ['connections'] as const,
  requests: () => [...CONNECTION_QUERY_KEYS.all, 'requests'] as const,
  list: (options?: FetchConnectionsOptions) => [...CONNECTION_QUERY_KEYS.all, 'list', options] as const,
  status: (userId: string) => [...CONNECTION_QUERY_KEYS.all, 'status', userId] as const,
}

// ===========================================
// HOOKS
// ===========================================

/**
 * Fetch pending incoming connection requests
 * 
 * @example
 * ```tsx
 * const { data: requests, isLoading } = useConnectionRequests()
 * ```
 */
export function useConnectionRequests() {
  return useQuery({
    queryKey: CONNECTION_QUERY_KEYS.requests(),
    queryFn: async () => {
      const { data, error } = await fetchConnectionRequests()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 2,  // 2 minutes
    gcTime: 1000 * 60 * 10,    // 10 minutes
    retry: 1,
  })
}

/**
 * Fetch accepted connections
 * 
 * @param options - Optional limit filter
 * 
 * @example
 * ```tsx
 * const { data: connections } = useConnections({ limit: 20 })
 * ```
 */
export function useConnections(options?: FetchConnectionsOptions) {
  return useQuery({
    queryKey: CONNECTION_QUERY_KEYS.list(options),
    queryFn: async () => {
      const { data, error } = await fetchConnections(options)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 15,    // 15 minutes
    retry: 1,
  })
}

/**
 * Send a connection request mutation
 * Invalidates relevant queries on success
 * 
 * @example
 * ```tsx
 * const { mutate: sendRequest } = useSendConnectionRequest()
 * sendRequest({ receiver_id: 'uuid', message: 'Hi!' })
 * ```
 */
export function useSendConnectionRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (input: { receiver_id: string; message?: string }) => {
      const { data, error } = await sendConnectionRequest(input)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.all })
    },
  })
}

/**
 * Accept a connection request mutation
 * Invalidates relevant queries on success
 * 
 * @example
 * ```tsx
 * const { mutate: acceptRequest } = useAcceptConnectionRequest()
 * acceptRequest(connectionId)
 * ```
 */
export function useAcceptConnectionRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { data, error } = await acceptConnectionRequest(connectionId)
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.all })
    },
  })
}

/**
 * Decline a connection request mutation
 * Invalidates relevant queries on success
 * 
 * @example
 * ```tsx
 * const { mutate: declineRequest } = useDeclineConnectionRequest()
 * declineRequest(connectionId)
 * ```
 */
export function useDeclineConnectionRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await declineConnectionRequest(connectionId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.requests() })
    },
  })
}

/**
 * Cancel a sent connection request mutation
 * Invalidates relevant queries on success
 * 
 * @example
 * ```tsx
 * const { mutate: cancelRequest } = useCancelConnectionRequest()
 * cancelRequest(connectionId)
 * ```
 */
export function useCancelConnectionRequest() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await cancelConnectionRequest(connectionId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.all })
    },
  })
}

/**
 * Remove an existing connection mutation
 * Invalidates relevant queries on success
 * 
 * @example
 * ```tsx
 * const { mutate: removeConnection } = useRemoveConnection()
 * removeConnection(connectionId)
 * ```
 */
export function useRemoveConnection() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await removeConnection(connectionId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.all })
    },
  })
}

/**
 * Check connection status between current user and another user
 * 
 * @param userId - Other user's UUID
 * 
 * @example
 * ```tsx
 * const { data: status } = useCheckConnectionStatus(otherUserId)
 * // status: 'pending' | 'accepted' | 'declined' | 'blocked' | 'not_connected'
 * ```
 */
export function useCheckConnectionStatus(userId: string) {
  return useQuery({
    queryKey: CONNECTION_QUERY_KEYS.status(userId),
    queryFn: async () => {
      const { status, error } = await checkConnectionStatus(userId)
      if (error) throw error
      return status
    },
    staleTime: 1000 * 60 * 5,  // 5 minutes
    gcTime: 1000 * 60 * 15,    // 15 minutes
    retry: 1,
    enabled: !!userId,
  })
}
