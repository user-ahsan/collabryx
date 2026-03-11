"use client"

import { useEffect, useState } from "react"
import { Loader2, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { getEmbeddingStatus, EmbeddingStatus } from "@/lib/services/embeddings"
import { Button } from "@/components/ui/button"

interface EmbeddingProgressProps {
  userId: string;
  onComplete?: () => void;
  onFailed?: () => void;
}

type ExtendedStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'not_found'

interface ExtendedEmbeddingStatus extends Omit<EmbeddingStatus, 'status'> {
  status: ExtendedStatus
}

export function EmbeddingProgress({ userId, onComplete, onFailed }: EmbeddingProgressProps) {
  const [status, setStatus] = useState<ExtendedEmbeddingStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [retryCount, setRetryCount] = useState(0)

  const checkStatus = async () => {
    try {
      const statusData = await getEmbeddingStatus(userId)
      
      // Handle case where no embedding record exists
      if (!statusData) {
        setStatus({
          user_id: userId,
          status: "not_found",
          last_updated: new Date().toISOString()
        })
        setLoading(false)
        return
      }

      setStatus(statusData as ExtendedEmbeddingStatus)
      
      if (statusData.status === "completed" || statusData.status === "failed") {
        setLoading(false)
        if (statusData.status === "completed" && onComplete) {
          onComplete()
        } else if (statusData.status === "failed" && onFailed) {
          onFailed()
        }
      }
    } catch (error) {
      console.error("Error checking embedding status:", error)
    }
  }

  useEffect(() => {
    checkStatus()
    const interval = setInterval(checkStatus, 2000)
    return () => clearInterval(interval)
  }, [userId])

  const handleRetry = async () => {
    setLoading(true)
    setRetryCount(prev => prev + 1)
    const result = await fetch('/api/embeddings/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId })
    })
    const data = await result.json()
    console.log("Retry result:", data)
  }

  if (!status) {
    return (
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="text-sm">Initializing embedding generation...</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg">
        {loading && status.status === "processing" && (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        )}
        {!loading && status.status === "completed" && (
          <CheckCircle2 className="h-4 w-4 text-green-500" />
        )}
        {!loading && status.status === "failed" && (
          <XCircle className="h-4 w-4 text-red-500" />
        )}
        {(status.status === "pending" || status.status === "not_found") && (
          <Loader2 className="h-4 w-4 animate-spin text-yellow-500" />
        )}
        
        <span className="text-sm">
          {status.status === "pending" && "Waiting to start embedding generation..."}
          {status.status === "processing" && "Generating your profile embedding..."}
          {status.status === "completed" && "Profile embedding ready!"}
          {status.status === "failed" && "Failed to generate embedding"}
          {status.status === "not_found" && "No embedding found"}
        </span>
      </div>

      {status.status === "failed" && (
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline" 
            onClick={handleRetry}
            disabled={loading}
          >
            <RefreshCw className="h-4 w-4 mr-1" />
            Retry
          </Button>
          <span className="text-xs text-muted-foreground">
            Attempt {retryCount + 1}
          </span>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        This enables semantic matching to connect you with the right collaborators.
      </p>
    </div>
  )
}
