"use client"



import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  fetchConnectionRequests,
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
      
      // Fetch outgoing (sent) requests - query pending connections where current user is requester
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        const { data: sentRequestsData, error: sentError } = await supabase
          .from('connections')
          .select('*')
          .eq('requester_id', user.id)
          .eq('status', 'pending')
        
        if (sentError) {
          throw sentError
        }
        
        setSentRequests(sentRequestsData || [])
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
      const { data: _data, error } = await acceptConnectionRequest(connectionId)
      
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
