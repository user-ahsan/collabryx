"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { startConversationAction } from "@/lib/actions/conversations.server"
import { MessageSquare, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface MessageButtonProps {
  userId: string
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function MessageButton({
  userId,
  variant = "outline",
  size = "default",
}: MessageButtonProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleMessage = async () => {
    if (isLoading) return
    setIsLoading(true)
    try {
      const formData = new FormData()
      formData.append("participant_id", userId)
      const result = await startConversationAction(formData)
      if (result?.data?.id) {
        router.push(`/messages/${result.data.id}`)
      } else {
        router.push(`/messages`)
      }
    } catch {
      router.push(`/messages`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleMessage}
      disabled={isLoading}
      className={cn(
        "transition-colors",
        !isLoading && "hover:bg-primary/90"
      )}
    >
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Opening...
        </>
      ) : (
        <>
          <MessageSquare className="mr-2 h-4 w-4" />
          Message
        </>
      )}
    </Button>
  )
}
