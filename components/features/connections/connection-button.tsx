"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useCheckConnectionStatus, useSendConnectionRequest } from "@/hooks/use-connections"
import { cn } from "@/lib/utils"

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
  const { data: status, isLoading } = useCheckConnectionStatus(userId)
  const sendRequest = useSendConnectionRequest()
  const [isPending, setIsPending] = useState(false)
  const [showMenu, setShowMenu] = useState(false)

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

  if (isLoading) {
    return (
      <Button variant={variant} size={size} disabled aria-label="Loading connection status">
        Loading...
      </Button>
    )
  }

  // Different states based on connection status
  switch (status) {
    case "accepted":
      return (
        <Button variant={variant} size={size} disabled className="bg-green-600 hover:bg-green-700">
          ✓ Connected
        </Button>
      )

    case "pending":
      return (
        <Button variant={variant} size={size} disabled className="bg-yellow-600 hover:bg-yellow-700">
          ⏳ Pending
        </Button>
      )

    case "blocked":
      return null // Don't show button for blocked users

    case "not_connected":
    default:
      return (
        <DropdownMenu open={showMenu} onOpenChange={setShowMenu}>
          <DropdownMenuTrigger asChild>
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
              {isPending ? "Sending..." : "Connect"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleConnect}>
              Send connection request
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
  }
}
