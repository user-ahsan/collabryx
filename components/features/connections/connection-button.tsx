"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useCheckConnectionStatus, useSendConnectionRequest } from "@/hooks/use-connections"
import { cn } from "@/lib/utils"
import { UserPlus, UserCheck, Clock, Loader2 } from "lucide-react"

interface ConnectionButtonProps {
  userId: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function ConnectionButton({
  userId,
  variant = "default",
  size = "default",
}: ConnectionButtonProps) {
  const { data: status, isLoading: statusLoading } = useCheckConnectionStatus(userId)
  const sendRequest = useSendConnectionRequest()
  const [isPending, setIsPending] = useState(false)

  const handleConnect = async () => {
    setIsPending(true)
    try {
      await sendRequest.mutateAsync({
        receiver_id: userId,
        message: "I'd like to connect with you",
      })
    } finally {
      setIsPending(false)
    }
  }

  if (statusLoading) {
    return (
      <Button variant={variant} size={size} disabled aria-label="Loading connection status">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading...
      </Button>
    )
  }

  // Different states based on connection status
  switch (status) {
    case "accepted":
      return (
        <Button
          variant="outline"
          size={size}
          disabled
          className="border-green-500/30 bg-green-500/10 text-green-600 dark:text-green-400 cursor-default"
        >
          <UserCheck className="mr-2 h-4 w-4" />
          Connected
        </Button>
      )

    case "pending":
      return (
        <Button
          variant="outline"
          size={size}
          disabled
          className="border-yellow-500/30 bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 cursor-default"
        >
          <Clock className="mr-2 h-4 w-4" />
          Pending
        </Button>
      )

    case "blocked":
      return null // Don't show button for blocked users

    case "not_connected":
    default:
      return (
        <Button
          variant={variant}
          size={size}
          onClick={handleConnect}
          disabled={isPending}
          className={cn(
            "transition-colors",
            !isPending && "hover:bg-primary/90"
          )}
        >
          {isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sending...
            </>
          ) : (
            <>
              <UserPlus className="mr-2 h-4 w-4" />
              Connect
            </>
          )}
        </Button>
      )
  }
}
