"use client"

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import * as ConnectionService from "@/lib/services/connections"
import type { ConnectionRequest } from "@/lib/services/connections"

// ===========================================
// REACT QUERY KEYS
// ===========================================

export const CONNECTION_QUERY_KEYS = {
  all: ["connections"] as const,
  requests: ["connections", "requests"] as const,
  received: ["connections", "requests", "received"] as const,
  sent: ["connections", "requests", "sent"] as const,
  accepted: ["connections", "accepted"] as const,
  byUser: (userId: string) => [...CONNECTION_QUERY_KEYS.all, userId] as const,
}

// ===========================================
// CONNECTION REQUESTS QUERIES
// ===========================================

export function useReceivedConnectionRequests() {
  return useQuery<ConnectionRequest[], Error>({
    queryKey: CONNECTION_QUERY_KEYS.received,
    queryFn: async () => {
      const { data, error } = await ConnectionService.getReceivedConnectionRequests()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
  })
}

export function useSentConnectionRequests() {
  return useQuery<ConnectionRequest[], Error>({
    queryKey: CONNECTION_QUERY_KEYS.sent,
    queryFn: async () => {
      const { data, error } = await ConnectionService.getSentConnectionRequests()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  })
}

export function useAcceptedConnections() {
  return useQuery<ConnectionRequest[], Error>({
    queryKey: CONNECTION_QUERY_KEYS.accepted,
    queryFn: async () => {
      const { data, error } = await ConnectionService.getAcceptedConnections()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes
  })
}

// ===========================================
// SEND CONNECTION REQUEST MUTATION
// ===========================================

export function useSendConnectionRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: ConnectionService.CreateConnectionInput) =>
      ConnectionService.sendConnectionRequest(input),
    onSuccess: (data) => {
      if (data.error) {
        console.error("Failed to send connection request:", data.error)
        return
      }

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.sent })
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.all })
    },
  })
}

// ===========================================
// ACCEPT CONNECTION REQUEST MUTATION
// ===========================================

export function useAcceptConnectionRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (connectionId: string) =>
      ConnectionService.acceptConnectionRequest(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.received })
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.accepted })
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.all })
    },
  })
}

// ===========================================
// DECLINE CONNECTION REQUEST MUTATION
// ===========================================

export function useDeclineConnectionRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (connectionId: string) =>
      ConnectionService.declineConnectionRequest(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.received })
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.all })
    },
  })
}

// ===========================================
// CANCEL CONNECTION REQUEST MUTATION
// ===========================================

export function useCancelConnectionRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (connectionId: string) =>
      ConnectionService.cancelConnectionRequest(connectionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.sent })
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.all })
    },
  })
}

// ===========================================
// BLOCK USER MUTATION
// ===========================================

export function useBlockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => ConnectionService.blockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.all })
    },
  })
}

// ===========================================
// UNBLOCK USER MUTATION
// ===========================================

export function useUnblockUser() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userId: string) => ConnectionService.unblockUser(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CONNECTION_QUERY_KEYS.all })
    },
  })
}

// ===========================================
// CHECK CONNECTION STATUS HOOK
// ===========================================

export function useConnectionStatus(targetUserId: string) {
  return useQuery<{
    status: "pending" | "accepted" | "declined" | "blocked" | "none"
    connectionId?: string
  } | null>({
    queryKey: CONNECTION_QUERY_KEYS.byUser(targetUserId),
    queryFn: async () => {
      // This would need a new API endpoint to check status efficiently
      // For now, we'll check accepted connections
      const { data } = await ConnectionService.getAcceptedConnections()
      if (!data) return null

      const connection = data.find(
        (c) =>
          c.requester_id === targetUserId || c.receiver_id === targetUserId
      )

      if (connection) {
        return {
          status: connection.status,
          connectionId: connection.id,
        }
      }

      return { status: "none" }
    },
    enabled: !!targetUserId,
    staleTime: 1000 * 60 * 5,
  })
}
