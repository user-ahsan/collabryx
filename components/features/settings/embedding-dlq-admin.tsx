"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, RefreshCcw, AlertCircle, CheckCircle2, Clock, XCircle } from "lucide-react"
import { formatDistance } from "date-fns"
import type { DLQItemWithProfile } from "@/types/database.types"

export function EmbeddingDeadLetterQueueAdmin() {
  const supabase = createClient()
  const [dlqItems, setDlqItems] = useState<DLQItemWithProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [retryingId, setRetryingId] = useState<string | null>(null)

  useEffect(() => {
    // Subscribe to DLQ updates for realtime
    const channel = supabase
      .channel("dlq-changes")
      .on(
        "postgres_changes",
        {
          schema: "public",
          table: "embedding_dead_letter_queue",
          event: "*",
        },
        () => {
          loadDLQItems()
        }
      )
      .subscribe()

    loadDLQItems()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const loadDLQItems = async () => {
    try {
      const { data, error } = await supabase
        .from("embedding_dead_letter_queue")
        .select("*, profiles(display_name, email, avatar_url)")
        .order("created_at", { ascending: false })
        .limit(50)

      if (error) throw error
      if (data) setDlqItems(data)
    } catch (error) {
      console.error("Failed to load DLQ items:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async (id: string, userId: string) => {
    setRetryingId(id)
    try {
      const response = await fetch("/api/embeddings/retry-dlq", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, user_id: userId }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Retry failed")
      }

      // Optimistic update
      setDlqItems((prev) =>
        prev.map((item) =>
          item.id === id ? { ...item, status: "pending", next_retry: new Date().toISOString() } : item
        )
      )
    } catch (error) {
      console.error("Retry failed:", error)
    } finally {
      setRetryingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="gap-1 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
            <Clock className="w-3 h-3" />
            Pending
          </Badge>
        )
      case "processing":
        return (
          <Badge variant="secondary" className="gap-1 bg-blue-500/10 text-blue-500 border-blue-500/20">
            <RefreshCcw className="w-3 h-3 animate-spin" />
            Processing
          </Badge>
        )
      case "completed":
        return (
          <Badge variant="secondary" className="gap-1 bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </Badge>
        )
      case "exhausted":
        return (
          <Badge variant="destructive" className="gap-1">
            <XCircle className="w-3 h-3" />
            Exhausted
          </Badge>
        )
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const getRetryCountBadge = (retryCount: number, maxRetries: number) => {
    const percentage = (retryCount / maxRetries) * 100

    if (percentage >= 100) {
      return <Badge variant="destructive">{retryCount}/{maxRetries}</Badge>
    } else if (percentage >= 50) {
      return <Badge variant="secondary" className="bg-orange-500/10 text-orange-500 border-orange-500/20">{retryCount}/{maxRetries}</Badge>
    } else {
      return <Badge variant="outline">{retryCount}/{maxRetries}</Badge>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Failed Embedding Retries</CardTitle>
          <CardDescription>Dead letter queue for automatic retry of failed embeddings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Failed Embedding Retries</CardTitle>
            <CardDescription>Dead letter queue for automatic retry of failed embeddings</CardDescription>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDLQItems}
            className="gap-2"
          >
            <RefreshCcw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {dlqItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No failed embedding requests</p>
            <p className="text-sm text-muted-foreground mt-1">All embeddings are being processed successfully</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-md border">
              <div className="grid grid-cols-12 gap-4 p-4 border-b bg-muted/50 text-sm font-medium">
                <div className="col-span-3">User</div>
                <div className="col-span-2">Status</div>
                <div className="col-span-2">Retries</div>
                <div className="col-span-3">Next Retry</div>
                <div className="col-span-2 text-right">Actions</div>
              </div>
              <div className="divide-y">
                {dlqItems.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-colors"
                  >
                    <div className="col-span-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium">
                          {(item.profiles?.display_name?.[0] || item.user_id.slice(0, 2)).toUpperCase()}
                        </div>
                        <div className="overflow-hidden">
                          <div className="font-medium truncate">
                            {item.profiles?.display_name || "Unknown User"}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {item.profiles?.email || item.user_id}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="col-span-2">
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="col-span-2">
                      {getRetryCountBadge(item.retry_count, item.max_retries)}
                    </div>

                    <div className="col-span-3">
                      {item.next_retry ? (
                        <div className="text-sm">
                          {item.status === "exhausted" ? (
                            <span className="text-muted-foreground">Max retries reached</span>
                          ) : (
                            <>
                              <span className="text-muted-foreground">in </span>
                              {formatDistance(new Date(item.next_retry), new Date(), { addSuffix: false })}
                            </>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">N/A</span>
                      )}
                    </div>

                    <div className="col-span-2 flex justify-end">
                      {item.status === "pending" && (
                        <Button
                          size="sm"
                          onClick={() => handleRetry(item.id, item.user_id)}
                          disabled={retryingId === item.id}
                          className="gap-1"
                        >
                          {retryingId === item.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <RefreshCcw className="w-3 h-3" />
                          )}
                          Retry Now
                        </Button>
                      )}
                      {item.status === "exhausted" && (
                        <Badge variant="outline" className="text-xs">
                          Manual Review
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Failure reason details */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Recent Failure Reasons</h4>
              <div className="grid gap-2">
                {dlqItems
                  .filter((item) => item.failure_reason && item.status !== "completed")
                  .slice(0, 3)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="p-3 rounded-md bg-destructive/10 border border-destructive/20 text-sm"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertCircle className="w-4 h-4 text-destructive" />
                        <span className="font-medium">{item.profiles?.display_name || "Unknown User"}</span>
                        <span className="text-muted-foreground">•</span>
                        <span className="text-muted-foreground">Retry {item.retry_count}/{item.max_retries}</span>
                      </div>
                      <div className="text-destructive/80 font-mono text-xs truncate">
                        {item.failure_reason}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
