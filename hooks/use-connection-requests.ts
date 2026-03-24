"use client"



// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  fetchConnectionRequests, 
  fetchConnections,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  type ConnectionWithUser 
} from "@/lib/services/connections"
import { logger } from "@/lib/logger"

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
      // Fetch incoming (received) requests
      const { data: received, error: receivedError } = await fetchConnectionRequests()
      
      if (receivedError) {
        throw receivedError
      }
      
      // Fetch outgoing (sent) requests - fetch accepted connections and filter for pending sent
      const { data: allConnections, error: connectionsError } = await fetchConnections({ limit: 100 })
      
      if (connectionsError) {
        throw connectionsError
      }
      
      // Get current user to determine which requests are sent vs received
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Filter for pending requests where current user is the requester
        const sent = (allConnections || []).filter(
          conn => conn.requester_id === user.id && conn.status === "pending"
        )
        setSentRequests(sent)
      }
      
      setReceivedRequests(received || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch connection requests"
      logger.app.error("Error fetching connection requests", err)
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
      const { data, error } = await acceptConnectionRequest(connectionId)
      
      if (error) {
        logger.app.error("Failed to accept connection request", error)
        return false
      }
      
      // Refresh the list
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
      
      // Refresh the list
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
      
      // Refresh the list
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
