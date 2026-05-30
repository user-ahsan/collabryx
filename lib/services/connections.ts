/**
 * Connections Service
 * Handles connection requests, accept/decline, and connection management
 * 
 * @module services/connections
 */

import { createClient } from "@/lib/supabase/client"
import { logger } from "@/lib/logger"
import { toast } from "sonner"
import { z } from "zod"
import type { Connection } from "@/types/database.types"
import { formatTimeAgo } from "@/lib/utils/time-ago"

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
        id,
        requester_id,
        receiver_id,
        status,
        message,
        created_at,
        updated_at,
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

    // Use separate queries instead of template-literal .or() to avoid injection (#137)
    const queryBase = `
      id,
      requester_id,
      receiver_id,
      status,
      message,
      created_at,
      updated_at,
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
    `

    const [asRequester, asReceiver] = await Promise.all([
      supabase
        .from("connections")
        .select(queryBase)
        .eq("status", "accepted")
        .eq("requester_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(options?.limit ?? 100),
      supabase
        .from("connections")
        .select(queryBase)
        .eq("status", "accepted")
        .eq("receiver_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(options?.limit ?? 100),
    ])

    if (asRequester.error) throw asRequester.error
    if (asReceiver.error) throw asReceiver.error

    const connections = [...(asRequester.data || []), ...(asReceiver.data || [])]
    connections.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())

    if (options?.limit) {
      connections.splice(options.limit)
    }

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
    // Use parameterized .in() pattern instead of template-literal .or() to avoid injection
    const { data: existingRows, error: existingError } = await supabase
      .from("connections")
      .select("id, status")
      .in("requester_id", [user.id, input.receiver_id])
      .in("receiver_id", [user.id, input.receiver_id])

    if (existingError) throw existingError

    const existing = existingRows?.[0] ?? null

    if (existing) {
      if (existing.status === "accepted") {
        return { data: null, error: new Error("Already connected with this user") }
      }
      if (existing.status === "pending") {
        return { data: null, error: new Error("Connection request already sent") }
      }
    }

    // Create connection request
    // Wrap .single() to handle unexpected multiple-row results (#135)
    let data: Connection | null = null
    try {
      const { data: inserted, error: insertError } = await supabase
        .from("connections")
        .insert({
          requester_id: user.id,
          receiver_id: input.receiver_id,
          status: "pending",
          message: input.message?.trim(),
        })
        .select('id, requester_id, receiver_id, status, message, created_at')
        .single()
      if (insertError) throw insertError
      data = inserted
    } catch (insertErr) {
      throw insertErr
    }

    toast.success("Connection request sent")
    return { data, error: null }
  } catch (error) {
    log.error("Error sending connection request:", error)
    toast.error("Failed to send connection request")
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
    // Wrap .single() in try/catch to handle PGRST116 (no rows) and multiple-row errors (#135)
    let existing: { receiver_id: string; status: string } | null = null
    try {
      const { data } = await supabase
        .from("connections")
        .select("receiver_id, status")
        .eq("id", connectionId)
        .single()
      existing = data
    } catch (singleErr) {
      const err = singleErr as { code?: string; message?: string }
      if (err.code === "PGRST116") {
        return { data: null, error: new Error("Connection request not found") }
      }
      return {
        data: null,
        error: new Error(`Unexpected database state for connection ${connectionId}: ${err.message}`),
      }
    }

    if (!existing) {
      return { data: null, error: new Error("Connection request not found") }
    }

    if (existing.receiver_id !== user.id) {
      return { data: null, error: new Error("Not authorized to accept this request") }
    }

    if (existing.status !== "pending") {
      return { data: null, error: new Error("Connection request is no longer pending") }
    }

    // Get requester_id for conversation creation
    // Wrap .single() in try/catch for specific error handling (#135)
    let connData: { requester_id: string; receiver_id: string } | null = null
    try {
      const { data } = await supabase
        .from("connections")
        .select("requester_id, receiver_id")
        .eq("id", connectionId)
        .single()
      connData = data
    } catch (singleErr) {
      const err = singleErr as { code?: string; message?: string }
      return {
        data: null,
        error: new Error(`Unexpected database state for connection ${connectionId}: ${err.message}`),
      }
    }

    // Accept the request
    // Wrap .single() to handle unexpected multiple-row results (#135)
    let acceptResult: Connection | null = null
    try {
      const { data: updated, error: updateError } = await supabase
        .from("connections")
        .update({
          status: "accepted",
          updated_at: new Date().toISOString(),
        })
        .eq("id", connectionId)
        .select('id, requester_id, receiver_id, status, updated_at')
        .single()
      if (updateError) throw updateError
      acceptResult = updated
    } catch (updateErr) {
      const err = updateErr as { code?: string; message?: string }
      return {
        data: null,
        error: new Error(`Failed to accept connection ${connectionId}: ${err.message}`),
      }
    }

    // Create conversation for messaging
    if (connData) {
      const participant1 = connData.requester_id < connData.receiver_id ? connData.requester_id : connData.receiver_id
      const participant2 = connData.requester_id < connData.receiver_id ? connData.receiver_id : connData.requester_id

      try {
        await supabase
          .from("conversations")
          .insert({
            participant_1: participant1,
            participant_2: participant2,
          })
          .select('id')
          .single()
      } catch (err) {
        // Ignore unique constraint violations (conversation may already exist)
        const error = err as { code?: string }
        if (error.code !== "23505") {
          log.error("Failed to create conversation:", err)
        }
      }
    }

    toast.success("Connection accepted")
    return { data: acceptResult, error: null }
  } catch (error) {
    log.error("Error accepting connection request:", error)
    toast.error("Failed to accept connection")
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
    // Wrap .single() in try/catch to handle multiple-row errors (#135)
    let existing: { receiver_id: string } | null = null
    try {
      const { data } = await supabase
        .from("connections")
        .select("receiver_id")
        .eq("id", connectionId)
        .single()
      existing = data
    } catch (singleErr) {
      const err = singleErr as { code?: string; message?: string }
      if (err.code === "PGRST116") {
        return { error: new Error("Connection request not found") }
      }
      return { error: new Error(`Unexpected database state: ${err.message}`) }
    }

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

    toast.success("Connection request declined")
    return { error: null }
  } catch (error) {
    log.error("Error declining connection request:", error)
    toast.error("Failed to decline connection")
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
    // Wrap .single() in try/catch to handle multiple-row errors (#135)
    let existing: { requester_id: string; status: string } | null = null
    try {
      const { data } = await supabase
        .from("connections")
        .select("requester_id, status")
        .eq("id", connectionId)
        .single()
      existing = data
    } catch (singleErr) {
      const err = singleErr as { code?: string; message?: string }
      if (err.code === "PGRST116") {
        return { error: new Error("Connection request not found") }
      }
      return { error: new Error(`Unexpected database state: ${err.message}`) }
    }

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
    // Wrap .single() in try/catch to handle multiple-row errors (#135)
    let existing: { requester_id: string; receiver_id: string; status: string } | null = null
    try {
      const { data } = await supabase
        .from("connections")
        .select("requester_id, receiver_id, status")
        .eq("id", connectionId)
        .single()
      existing = data
    } catch (singleErr) {
      const err = singleErr as { code?: string; message?: string }
      if (err.code === "PGRST116") {
        return { error: new Error("Connection not found") }
      }
      return { error: new Error(`Unexpected database state: ${err.message}`) }
    }

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

    // Insert directly into dedicated blocked_users table
    // Uses upsert to handle duplicate blocks (UNIQUE constraint on blocker_id + blocked_id)
    const { error } = await supabase
      .from("blocked_users")
      .upsert(
        {
          blocker_id: user.id,
          blocked_id: userId,
        },
        { onConflict: "blocker_id,blocked_id" },
      )

    if (error) throw error

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

    // Use parameterized .in() pattern instead of template-literal .or() to avoid injection (#137)
    const { data: existingRows, error } = await supabase
      .from("connections")
      .select("status")
      .in("requester_id", [user.id, userId])
      .in("receiver_id", [user.id, userId])
      .limit(1)

    if (error) throw error

    const data = existingRows?.[0] ?? null

    if (!data) {
      return { status: "not_connected", error: null }
    }

    return { status: data.status, error: null }
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
// formatTimeAgo now imported from @/lib/utils/time-ago (deduplicated)
