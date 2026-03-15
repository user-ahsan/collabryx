import { createClient } from "@/lib/supabase/client"

// ===========================================
// CONNECTIONS SERVICE
// ===========================================

export interface Connection {
  id: string
  requester_id: string
  receiver_id: string
  status: "pending" | "accepted" | "declined" | "blocked"
  message: string | null
  created_at: string
  updated_at: string
}
type ConnectionWithProfile = Connection & {
  requester_profile?: {
    full_name: string | null
    display_name: string | null
    avatar_url: string | null
    headline: string | null
  }
  receiver_profile?: {
    full_name: string | null
    display_name: string | null
    avatar_url: string | null
    headline: string | null
  }
}

export interface ConnectionRequest {
  id: string
  requester_id: string
  receiver_id: string
  status: Connection["status"]
  message: string | null
  created_at: string
  updated_at: string
  requester_profile?: ConnectionWithProfile["requester_profile"]
  receiver_profile?: ConnectionWithProfile["receiver_profile"]
  time_ago: string
}

export interface CreateConnectionInput {
  receiver_id: string
  message?: string
}

/**
 * Send a connection request
 */
export async function sendConnectionRequest(
  input: CreateConnectionInput
): Promise<{
  data: Connection | null
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { data: null, error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: null, error: new Error("Please log in to send connection requests.") }
    }

    // Check if connection already exists
    const { data: existing } = await supabase
      .from("connections")
      .select("id, status")
      .or(`and(requester_id.eq.${user.id},receiver_id.eq.${input.receiver_id}),and(requester_id.eq.${input.receiver_id},receiver_id.eq.${user.id})`)
      .single()

    if (existing) {
      if (existing.status === "accepted") {
        return { data: null, error: new Error("You are already connected with this user") }
      }
      if (existing.status === "pending") {
        return { data: null, error: new Error("Connection request already sent") }
      }
    }

    const { data, error } = await supabase
      .from("connections")
      .insert({
        requester_id: user.id,
        receiver_id: input.receiver_id,
        status: "pending",
        message: input.message || null,
      })
      .select()
      .single()

    if (error) throw error

    // Create notification for receiver
    await supabase.from("notifications").insert({
      user_id: input.receiver_id,
      type: "connect",
      actor_id: user.id,
      actor_name: user.user_metadata?.full_name || "Someone",
      actor_avatar: user.user_metadata?.avatar_url || "",
      content: "sent you a connection request",
      resource_type: "profile",
      resource_id: user.id,
    })

    return { data, error: null }
  } catch (error) {
    console.error("Error sending connection request:", error)
    return { data: null, error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Accept a connection request
 */
export async function acceptConnectionRequest(
  connectionId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to accept connection requests.") }
    }

    const { error } = await supabase
      .from("connections")
      .update({ status: "accepted" })
      .eq("id", connectionId)
      .eq("receiver_id", user.id)

    if (error) throw error

    // Get the requester to notify them
    const { data: connection } = await supabase
      .from("connections")
      .select("requester_id")
      .eq("id", connectionId)
      .single()

    if (connection) {
      await supabase.from("notifications").insert({
        user_id: connection.requester_id,
        type: "connect",
        actor_id: user.id,
        actor_name: user.user_metadata?.full_name || "Someone",
        actor_avatar: user.user_metadata?.avatar_url || "",
        content: "accepted your connection request",
        resource_type: "profile",
        resource_id: user.id,
      })
    }

    return { error: null }
  } catch (error) {
    console.error("Error accepting connection request:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Decline a connection request
 */
export async function declineConnectionRequest(
  connectionId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to decline connection requests.") }
    }

    const { error } = await supabase
      .from("connections")
      .update({ status: "declined" })
      .eq("id", connectionId)
      .eq("receiver_id", user.id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Error declining connection request:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Cancel a sent connection request
 */
export async function cancelConnectionRequest(
  connectionId: string
): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to cancel connection requests.") }
    }

    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("id", connectionId)
      .eq("requester_id", user.id)

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Error canceling connection request:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Get pending connection requests (received)
 */
export async function getReceivedConnectionRequests(): Promise<{
  data: ConnectionRequest[]
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { data: [], error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: [], error: new Error("Please log in to view connection requests.") }
    }

    const { data, error } = await supabase
      .from("connections")
      .select(`
        *,
        requester_profile:profiles!requester_id (
          full_name,
          display_name,
          avatar_url,
          headline
        )
      `)
      .eq("receiver_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) throw error

    const mappedConnections: ConnectionRequest[] = (data || []).map((conn: any) => ({
      id: conn.id,
      requester_id: conn.requester_id,
      receiver_id: conn.receiver_id,
      status: conn.status,
      message: conn.message,
      created_at: conn.created_at,
      updated_at: conn.updated_at,
      requester_profile: conn.requester_profile,
      time_ago: formatTimeAgo(conn.created_at),
    }))

    return { data: mappedConnections, error: null }
  } catch (error) {
    console.error("Error fetching connection requests:", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Get sent connection requests
 */
export async function getSentConnectionRequests(): Promise<{
  data: ConnectionRequest[]
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { data: [], error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: [], error: new Error("Please log in to view sent requests.") }
    }

    const { data, error } = await supabase
      .from("connections")
      .select(`
        *,
        receiver_profile:profiles!receiver_id (
          full_name,
          display_name,
          avatar_url,
          headline
        )
      `)
      .eq("requester_id", user.id)
      .eq("status", "pending")
      .order("created_at", { ascending: false })

    if (error) throw error

    const mappedConnections: ConnectionRequest[] = (data || []).map((conn: any) => ({
      id: conn.id,
      requester_id: conn.requester_id,
      receiver_id: conn.receiver_id,
      status: conn.status,
      message: conn.message,
      created_at: conn.created_at,
      updated_at: conn.updated_at,
      receiver_profile: conn.receiver_profile,
      time_ago: formatTimeAgo(conn.created_at),
    }))

    return { data: mappedConnections, error: null }
  } catch (error) {
    console.error("Error fetching sent connection requests:", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Get accepted connections (user's network)
 */
export async function getAcceptedConnections(): Promise<{
  data: ConnectionRequest[]
  error: Error | null
}> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { data: [], error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { data: [], error: new Error("Please log in to view connections.") }
    }

    const { data, error } = await supabase
      .from("connections")
      .select(`
        *,
        requester_profile:profiles!requester_id (
          full_name,
          display_name,
          avatar_url,
          headline
        ),
        receiver_profile:profiles!receiver_id (
          full_name,
          display_name,
          avatar_url,
          headline
        )
      `)
      .eq("status", "accepted")
      .or(`requester_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("updated_at", { ascending: false })

    if (error) throw error

    const mappedConnections: ConnectionRequest[] = (data || []).map((conn: any) => {
      const isRequester = conn.requester_id === user.id
      const otherProfile = isRequester ? conn.receiver_profile : conn.requester_profile

      return {
        id: conn.id,
        requester_id: conn.requester_id,
        receiver_id: conn.receiver_id,
        status: conn.status,
        message: conn.message,
        created_at: conn.created_at,
        updated_at: conn.updated_at,
        requester_profile: conn.requester_profile,
        receiver_profile: conn.receiver_profile,
        time_ago: formatTimeAgo(conn.updated_at),
        other_profile: otherProfile,
      }
    })

    return { data: mappedConnections, error: null }
  } catch (error) {
    console.error("Error fetching accepted connections:", error)
    return { data: [], error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Block a user (creates a blocked connection)
 */
export async function blockUser(userId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to block users.") }
    }

    const { error } = await supabase
      .from("connections")
      .upsert({
        requester_id: user.id,
        receiver_id: userId,
        status: "blocked",
      })
      .onConflict("requester_id,receiver_id")

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Error blocking user:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

/**
 * Unblock a user
 */
export async function unblockUser(userId: string): Promise<{ error: Error | null }> {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError) {
      console.error("Auth error:", authError)
      return { error: new Error("Authentication failed. Please log in again.") }
    }

    if (!user) {
      return { error: new Error("Please log in to unblock users.") }
    }

    const { error } = await supabase
      .from("connections")
      .delete()
      .eq("requester_id", user.id)
      .eq("receiver_id", userId)
      .eq("status", "blocked")

    if (error) throw error

    return { error: null }
  } catch (error) {
    console.error("Error unblocking user:", error)
    return { error: error instanceof Error ? error : new Error("Unknown error") }
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

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
