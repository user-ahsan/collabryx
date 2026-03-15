"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X } from "lucide-react"
import { GlassBubble } from "@/components/shared/glass-bubble"
import { cn } from "@/lib/utils"
import {
  useAcceptConnectionRequest,
  useDeclineConnectionRequest,
} from "@/hooks/use-connections"
import type { ConnectionWithUser } from "@/lib/services/connections"

interface ConnectionRequestItemProps {
  request: ConnectionWithUser
}

export function ConnectionRequestItem({ request }: ConnectionRequestItemProps) {
  const acceptRequest = useAcceptConnectionRequest()
  const declineRequest = useDeclineConnectionRequest()
  const [isPending, setIsPending] = useState(false)

  const handleAccept = async () => {
    setIsPending(true)
    await acceptRequest.mutateAsync(request.id)
    setIsPending(false)
  }

  const handleDecline = async () => {
    setIsPending(true)
    await declineRequest.mutateAsync(request.id)
    setIsPending(false)
  }

  return (
    <GlassBubble className="p-4">
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <Avatar className="h-12 w-12 ring-1 ring-white/10">
          <AvatarImage src={request.other_user_avatar} />
          <AvatarFallback>{request.other_user_initials}</AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {request.other_user_name}
          </p>
          {request.other_user_headline && (
            <p className="text-xs text-muted-foreground truncate">
              {request.other_user_headline}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            {request.created_at_formatted}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-full"
            onClick={handleAccept}
            disabled={isPending}
          >
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="h-9 w-9 rounded-full"
            onClick={handleDecline}
            disabled={isPending}
          >
            <X className="h-4 w-4 text-red-600" />
          </Button>
        </div>
      </div>
    </GlassBubble>
  )
}
