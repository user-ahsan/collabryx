/**
 * Connections Service
 * Handles connection requests, accept/decline, and connection management
 * 
 * @module services/connections
 */

import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import { z } from "zod"
import type { Connection } from "@/types/database.types"

// Module-specific logger
const log = logger.app

// ===========================================
// VALIDATION SCHEMAS
// ===========================================

const SendConnectionRequestSchema = z.object({
  receiver_id: z.string().uuid("Invalid user ID format"),
  message: z.string().max(500, "Message too long (max 500 characters)").optional(),
})

// ===========================================
// TYPES
// ===========================================

export interface ConnectionWithUser extends Connection {
  other_user_id: string
  other_user_name: string
  other_user_avatar: string
  other_user_headline?: string
  other_user_initials: string
  created_at_formatted: string
}

export interface SendConnectionRequestInput {
  receiver_id: string
  message?: string
}

export interface FetchConnectionsOptions {
  limit?: number
  status?: Connection["status"]
}

// ===========================================
// CONNECTIONS SERVICE
// ===========================================

/**
 * Fetch incoming connection requests (pending)
 * 
 * @returns Array of pending connection requests
 */
export async function fetchConnectionRequests(): Promise<{
  data: ConnectionWithUser[]
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], error: new Error("Not authenticated") }
    }

    const { data: connections, error } = await supabase
      .from("connections")
      .select(`
        *,
        requester:profiles (
          display_name,
          full_name,
          avatar_url,
          headline
        )
      `)
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) throw error

    const mappedConnections: ConnectionWithUser[] = (connections || []).map((conn) => ({
      id: conn.id,
      requester_id: conn.requester_id,
      receiver_id: conn.receiver_id,
      status: conn.status,
      message: conn.message,
      created_at: conn.created_at,
      updated_at: conn.updated_at,
      other_user_id: conn.requester_id,
      other_user_name: conn.requester?.display_name || conn.requester?.full_name || "Unknown",
      other_user_avatar: conn.requester?.avatar_url || "",
      other_user_headline: conn.requester?.headline,
      other_user_initials: formatInitials(conn.requester?.display_name || conn.requester?.full_name || "Unknown"),
      created_at_formatted: formatTimeAgo(conn.created_at),
    }))

    return { data: mappedConnections, error: null }
  } catch (error) {
    log.error("Error fetching connection requests:", error)
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error("[Connections] Failed to fetch connection requests") 
    }
  }
}

/**
 * Fetch accepted connections
 * 
 * @param options - Optional limit and status filter
 * @returns Array of accepted connections
 */
export async function fetchConnections(
  options?: FetchConnectionsOptions
): Promise<{
  data: ConnectionWithUser[]
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return { data: [], error: new Error("Not authenticated") }
    }

    let query = supabase
      .from("connections")
      .select(`
        *,
        requester:profiles (
          display_name,
          full_name,
          avatar_url,
          headline
        ),
        receiver:profiles (
          display_name,
          full_name,
          avatar_url,
          headline
        )
      `)
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("updated_at", { ascending: false })

    if (options?.limit) {
      query = query.limit(options.limit)
    }

    const { data: connections, error } = await query

    if (error) throw error

    const mappedConnections: ConnectionWithUser[] = (connections || []).map((conn) => {
      const isRequester = conn.requester_id === user.id
      const otherUser = isRequester ? conn.receiver : conn.requester

      return {
        id: conn.id,
        requester_id: conn.requester_id,
        receiver_id: conn.receiver_id,
        status: conn.status,
        message: conn.message,
        created_at: conn.created_at,
        updated_at: conn.updated_at,
        other_user_id: otherUser?.id || "",
        other_user_name: otherUser?.display_name || otherUser?.full_name || "Unknown",
        other_user_avatar: otherUser?.avatar_url || "",
        other_user_headline: otherUser?.headline,
        other_user_initials: formatInitials(otherUser?.display_name || otherUser?.full_name || "Unknown"),
        created_at_formatted: formatTimeAgo(conn.created_at),
      }
    })

    return { data: mappedConnections, error: null }
  } catch (error) {
    log.error("Error fetching connections:", error)
    return { 
      data: [], 
      error: error instanceof Error ? error : new Error("[Connections] Failed to fetch connections") 
    }
  }
}

/**
 * Send a connection request
 * 
 * @param input - Connection request input
 * @returns Created connection or error
 */
export async function sendConnectionRequest(
  input: SendConnectionRequestInput
): Promise<{
  data: Connection | null
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to send connection requests.") }
    }

    // Validate input
    const validation = SendConnectionRequestSchema.safeParse(input)
    if (!validation.success) {
      return { 
        data: null, 
        error: new Error(validation.error.errors[0]?.message || "Invalid request data") 
      }
    }

    // Check if already connected or request exists
    const { data: existing } = await supabase
      .from("connections")
      .select("id, status")
      .or(`
        and(requester_id.eq.${user.id},receiver_id.eq.${input.receiver_id}),
        and(requester_id.eq.${input.receiver_id},receiver_id.eq.${user.id})
      `)
      .single()

    if (existing) {
      if (existing.status === "accepted") {
        return { data: null, error: new Error("Already connected with this user") }
      }
      if (existing.status === "pending") {
        return { data: null, error: new Error("Connection request already sent") }
      }
    }

    // Create connection request
    const { data, error } = await supabase
      .from("connections")
      .insert({
        requester_id: user.id,
        receiver_id: input.receiver_id,
        status: "pending",
        message: input.message?.trim(),
      })
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    log.error("Error sending connection request:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("[Connections] Failed to send connection request") 
    }
  }
}

/**
 * Accept a connection request
 * 
 * @param connectionId - Connection UUID
 * @returns Updated connection or error
 */
export async function acceptConnectionRequest(
  connectionId: string
): Promise<{
  data: Connection | null
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to accept connection requests.") }
    }

    // Verify user is the receiver
    const { data: existing } = await supabase
      .from("connections")
      .select("receiver_id, status")
      .eq("id", connectionId)
      .single()

    if (!existing) {
      return { data: null, error: new Error("Connection request not found") }
    }

    if (existing.receiver_id !== user.id) {
      return { data: null, error: new Error("Not authorized to accept this request") }
    }

    if (existing.status !== "pending") {
      return { data: null, error: new Error("Connection request is no longer pending") }
    }

    // Accept the request
    const { data, error } = await supabase
      .from("connections")
      .update({
        status: "accepted",
        updated_at: new Date().toISOString(),
      })
      .eq("id", connectionId)
      .select()
      .single()

    if (error) throw error

    return { data, error: null }
  } catch (error) {
    log.error("Error accepting connection request:", error)
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error("[Connections] Failed to accept connection request") 
    }
  }
}

/**
 * Decline a connection request
 * 
 * @param connectionId - Connection UUID
 * @returns Error or null if successful
 */
export async function declineConnectionRequest(
  connectionId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to decline connection requests.") }
    }

    // Verify user is the receiver
    const { data: existing } = await supabase
      .from("connections")
      .select("receiver_id")
      .eq("id", connectionId)
      .single()

    if (!existing) {
      return { error: new Error("Connection request not found") }
    }

    if (existing.receiver_id !== user.id) {
      return { error: new Error("Not authorized to decline this request") }
    }

    // Delete the request
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    log.error("Error declining connection request:", error)
    return { error: error instanceof Error ? error : new Error("[Connections] Failed to decline connection request") }
  }
}

/**
 * Cancel a sent connection request
 * 
 * @param connectionId - Connection UUID
 * @returns Error or null if successful
 */
export async function cancelConnectionRequest(
  connectionId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to cancel connection requests.") }
    }

    // Verify user is the requester
    const { data: existing } = await supabase
      .from("connections")
      .select("requester_id, status")
      .eq("id", connectionId)
      .single()

    if (!existing) {
      return { error: new Error("Connection request not found") }
    }

    if (existing.requester_id !== user.id) {
      return { error: new Error("Not authorized to cancel this request") }
    }

    if (existing.status !== "pending") {
      return { error: new Error("Cannot cancel a request that is no longer pending") }
    }

    // Delete the request
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    log.error("Error canceling connection request:", error)
    return { error: error instanceof Error ? error : new Error("[Connections] Failed to cancel connection request") }
  }
}

/**
 * Remove an existing connection
 * 
 * @param connectionId - Connection UUID
 * @returns Error or null if successful
 */
export async function removeConnection(
  connectionId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to remove connections.") }
    }

    // Verify user is part of the connection
    const { data: existing } = await supabase
      .from("connections")
      .select("requester_id, receiver_id, status")
      .eq("id", connectionId)
      .single()

    if (!existing) {
      return { error: new Error("Connection not found") }
    }

    if (existing.requester_id !== user.id && existing.receiver_id !== user.id) {
      return { error: new Error("Not authorized to remove this connection") }
    }

    if (existing.status !== "accepted") {
      return { error: new Error("Can only remove accepted connections") }
    }

    // Delete the connection
    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId)

    if (error) throw error

    return { error: null }
  } catch (error) {
    log.error("Error removing connection:", error)
    return { error: error instanceof Error ? error : new Error("[Connections] Failed to remove connection") }
  }
}

/**
 * Block a user (creates blocked connection status)
 * 
 * @param userId - User UUID to block
 * @returns Error or null if successful
 */
export async function blockUser(
  userId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to block users.") }
    }

    if (userId === user.id) {
      return { error: new Error("Cannot block yourself") }
    }

    // Check if connection exists
    const { data: existing } = await supabase
      .from("connections")
      .select("id, status")
      .or(`
        and(requester_id.eq.${user.id},receiver_id.eq.${userId}),
        and(requester_id.eq.${userId},receiver_id.eq.${user.id})
      `)
      .single()

    if (existing) {
      // Update existing connection to blocked
      const { error } = await supabase
        .from("connections")
        .update({
          status: "blocked",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)

      if (error) throw error
    } else {
      // Create new blocked connection
      const { error } = await supabase
        .from("connections")
        .insert({
          requester_id: user.id,
          receiver_id: userId,
          status: "blocked",
        })

      if (error) throw error
    }

    return { error: null }
  } catch (error) {
    log.error("Error blocking user:", error)
    return { error: error instanceof Error ? error : new Error("[Connections] Failed to block user") }
  }
}

/**
 * Check connection status between two users
 * 
 * @param userId - Other user's UUID
 * @returns Connection status or error
 */
export async function checkConnectionStatus(
  userId: string
): Promise<{
  status: Connection["status"] | "not_connected"
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      return { status: "not_connected", error: new Error("Not authenticated") }
    }

    if (!user) {
      return { status: "not_connected", error: new Error("Not authenticated") }
    }

    if (userId === user.id) {
      return { status: "not_connected", error: null }
    }

    const { data, error } = await supabase
      .from("connections")
      .select("status")
      .or(`
        and(requester_id.eq.${user.id},receiver_id.eq.${userId}),
        and(requester_id.eq.${userId},receiver_id.eq.${user.id})
      `)
      .single()

    if (error) {
      if (error.code === "PGRST116") {
        // No rows returned - not connected
        return { status: "not_connected", error: null }
      }
      throw error
    }

    return { status: data?.status || "not_connected", error: null }
  } catch (error) {
    log.error("Error checking connection status:", error)
    return { 
      status: "not_connected", 
      error: error instanceof Error ? error : new Error("[Connections] Failed to check connection status") 
    }
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Format initials from name
 * 
 * @param name - Full name to format
 * @returns First two characters of initials (e.g., "John Doe" → "JD")
 */
function formatInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

/**
 * Format timestamp to relative time string
 */
function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return "Just now"
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`

  return date.toLocaleDateString()
}
