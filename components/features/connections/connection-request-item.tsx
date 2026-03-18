"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Check, X } from "lucide-react"
import { GlassBubble } from "@/components/shared/glass-bubble"
import {
  useAcceptConnectionRequest,
  useDeclineConnectionRequest,
} from "@/hooks/use-connections"
import type { ConnectionWithUser } from "@/lib/services/connections"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

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
    <GlassBubble className={cn("p-4", glass("bubble"))}>
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <Avatar className="h-12 w-12 sm:h-14 sm:w-14 ring-1 ring-white/10 shrink-0">
          <AvatarImage src={request.other_user_avatar} />
          <AvatarFallback>{request.other_user_initials}</AvatarFallback>
        </Avatar>

        {/* User Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">
            {request.other_user_name}
          </p>
          {request.other_user_headline && (
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {request.other_user_headline}
            </p>
          )}
          <p className="text-xs text-muted-foreground/70 mt-1 flex items-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-muted-foreground/40" />
            {request.created_at_formatted}
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <Button
            size="icon"
            variant="outline"
            className={cn(
              "h-11 w-11 rounded-full transition-all",
              glass("buttonGhost")
            )}
            onClick={handleAccept}
            disabled={isPending}
            aria-label="Accept connection request"
          >
            <Check className="h-5 w-5 text-green-500" />
          </Button>
          <Button
            size="icon"
            variant="outline"
            className={cn(
              "h-11 w-11 rounded-full transition-all",
              glass("buttonGhost")
            )}
            onClick={handleDecline}
            disabled={isPending}
            aria-label="Decline connection request"
          >
            <X className="h-5 w-5 text-red-500" />
          </Button>
        </div>
      </div>
    </GlassBubble>
  )
}
