/**
 * Connections Hook - React Query implementation
 * Provides typed, cached connection data fetching with real-time updates
 * 
 * @module hooks/use-connections
 */

import { useState, useEffect, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
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
  type ConnectionWithUser,
} from '@/lib/services/connections'
import { logger } from '@/lib/logger'

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
 * Fetch pending incoming connection requests (React Query)
 * 
 * @deprecated Internal — prefer useConnectionRequests (raw state)
 */
export function useConnectionRequestsQuery() {
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

// ===========================================
// RAW-STATE CONNECTION REQUESTS (merged from use-connection-requests.ts)
// ===========================================

interface UseConnectionRequestsReturn {
  receivedRequests: ConnectionWithUser[]
  sentRequests: ConnectionWithUser[]
  isLoading: boolean
  error: string | null
  acceptRequest: (connectionId: string) => Promise<boolean>
  declineRequest: (connectionId: string) => Promise<boolean>
  cancelRequest: (connectionId: string) => Promise<boolean>
  refreshRequests: () => Promise<void>
}

export function useConnectionRequests(): UseConnectionRequestsReturn {
  const [receivedRequests, setReceivedRequests] = useState<ConnectionWithUser[]>([])
  const [sentRequests, setSentRequests] = useState<ConnectionWithUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAllRequests = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const { data: received, error: receivedError } = await fetchConnectionRequests()
      
      if (receivedError) {
        throw receivedError
      }
      
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: sent, error: sentError } = await supabase
          .from('connections')
          .select('*')
          .eq('requester_id', user.id)
          .eq('status', 'pending')
        
        if (sentError) {
          throw sentError
        }
        
        setSentRequests(sent || [])
      }
      
      setReceivedRequests(received || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch connection requests"
      logger.app.warn("Error fetching connection requests (new user may not have connections)", { error: err })
      setError(errorMessage)
      setReceivedRequests([])
      setSentRequests([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAllRequests()
  }, [fetchAllRequests])

  const acceptRequest = async (connectionId: string): Promise<boolean> => {
    try {
      const { error } = await acceptConnectionRequest(connectionId)
      
      if (error) {
        logger.app.error("Failed to accept connection request", error)
        return false
      }
      
      await fetchAllRequests()
      return true
    } catch (err) {
      logger.app.error("Failed to accept connection request", err)
      return false
    }
  }

  const declineRequest = async (connectionId: string): Promise<boolean> => {
    try {
      const { error } = await declineConnectionRequest(connectionId)
      
      if (error) {
        logger.app.error("Failed to decline connection request", error)
        return false
      }
      
      await fetchAllRequests()
      return true
    } catch (err) {
      logger.app.error("Failed to decline connection request", err)
      return false
    }
  }

  const cancelRequest = async (connectionId: string): Promise<boolean> => {
    try {
      const { error } = await cancelConnectionRequest(connectionId)
      
      if (error) {
        logger.app.error("Failed to cancel connection request", error)
        return false
      }
      
      await fetchAllRequests()
      return true
    } catch (err) {
      logger.app.error("Failed to cancel connection request", err)
      return false
    }
  }

  return {
    receivedRequests,
    sentRequests,
    isLoading,
    error,
    acceptRequest,
    declineRequest,
    cancelRequest,
    refreshRequests: fetchAllRequests
  }
}
