"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatDistance } from "date-fns"
import { useEmbeddingQueueStats } from "@/hooks/use-embedding-queue-status"
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react"

interface PendingQueueItem {
  id: string
  user_id: string
  status: string
  trigger_source: string
  created_at: string
  first_attempt: string | null
  last_attempt: string | null
  completed_at: string | null
  failure_reason: string | null
  profiles: {
    display_name: string | null
    email: string
  } | null
}

interface DLQItem {
  id: string
  user_id: string
  status: string
  trigger_source: string
  failure_reason: string
  failed_at: string
  retry_count: number
  profiles: {
    display_name: string | null
    email: string
  } | null
}

type QueueTab = "pending" | "processing" | "completed" | "failed" | "dlq"

export default function EmbeddingQueueAdminContent() {
  const [tab, setTab] = useState<QueueTab>("pending")
  const [pendingItems, setPendingItems] = useState<PendingQueueItem[]>([])
  const [dlqItems, setDlqItems] = useState<DLQItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { stats } = useEmbeddingQueueStats()

  const fetchQueueItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data: pendingData, error: pendingErr } = await supabase
        .from("embedding_pending_queue")
        .select("*, profiles!inner(display_name, email)")
        .eq("status", tab)
        .order("created_at", { ascending: false })
        .limit(50)

      if (pendingErr) throw pendingErr
      setPendingItems(pendingData || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch queue items")
    } finally {
      setLoading(false)
    }
  }

  const fetchDLQItems = async () => {
    setLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { data, error: dlqErr } = await supabase
        .from("embedding_dead_letter_queue")
        .select("*, profiles!inner(display_name, email)")
        .order("failed_at", { ascending: false })
        .limit(50)

      if (dlqErr) throw dlqErr
      setDlqItems(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch DLQ items")
    } finally {
      setLoading(false)
    }
  }

  const retryDLQItem = async (itemId: string) => {
    try {
      const supabase = createClient()
      const { error: retryErr } = await supabase.rpc("retry_dlq_item", { p_item_id: itemId })
      if (retryErr) throw retryErr
      await fetchDLQItems()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to retry item")
    }
  }

  const tabs: QueueTab[] = ["pending", "processing", "completed", "failed", "dlq"]

  useEffect(() => {
    if (tab === "dlq") {
      fetchDLQItems()
    } else {
      fetchQueueItems()
    }
  }, [tab])

  return (
    <div className="container max-w-7xl mx-auto py-6 px-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Embedding Queue Admin</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage the embedding generation pipeline
          </p>
        </div>
        <button
          onClick={() => {
            if (tab === "dlq") fetchDLQItems()
            else fetchQueueItems()
          }}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-500">{stats.pending ?? "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Processing</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{stats.processing ?? "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{stats.completed ?? "—"}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{stats.failed ?? "—"}</div>
            </CardContent>
          </Card>
            <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">DLQ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{dlqItems.length}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              tab === t
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm">{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : tab === "dlq" ? (
        <Card>
          <CardHeader>
            <CardTitle>Dead Letter Queue</CardTitle>
            <CardDescription>Items that permanently failed embedding generation</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Failed At</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dlqItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No items in dead letter queue
                    </TableCell>
                  </TableRow>
                ) : (
                  dlqItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.profiles?.display_name || item.profiles?.email || item.user_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{item.trigger_source}</Badge>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistance(new Date(item.failed_at), new Date(), { addSuffix: true })}
                      </TableCell>
                      <TableCell>{item.retry_count}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-sm text-destructive">
                        {item.failure_reason}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => retryDLQItem(item.id)}
                          className="text-sm text-primary hover:underline"
                        >
                          Retry
                        </button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>
              {tab.charAt(0).toUpperCase() + tab.slice(1)} Items
            </CardTitle>
            <CardDescription>
              {tab === "pending" && "Awaiting processing by the Python worker"}
              {tab === "processing" && "Currently being processed"}
              {tab === "completed" && "Successfully processed items"}
              {tab === "failed" && "Failed items available for retry"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Trigger</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  {tab === "failed" && <TableHead>Reason</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={tab === "failed" ? 5 : 4} className="text-center text-muted-foreground py-8">
                      No {tab} items
                    </TableCell>
                  </TableRow>
                ) : (
                  pendingItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">
                        {item.profiles?.display_name || item.profiles?.email || item.user_id}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">{item.trigger_source}</Badge>
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDistance(new Date(item.created_at), new Date(), { addSuffix: true })}
                      </TableCell>
                      {tab === "failed" && (
                        <TableCell className="max-w-[200px] truncate text-sm text-destructive">
                          {item.failure_reason || "—"}
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "pending":
      return (
        <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 border-amber-500/50">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      )
    case "processing":
      return (
        <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-500/50">
          <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
          Processing
        </Badge>
      )
    case "completed":
      return (
        <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/50">
          <CheckCircle className="h-3 w-3 mr-1" />
          Completed
        </Badge>
      )
    case "failed":
      return (
        <Badge variant="secondary" className="bg-red-500/20 text-red-700 border-red-500/50">
          <XCircle className="h-3 w-3 mr-1" />
          Failed
        </Badge>
      )
    default:
      return <Badge>{status}</Badge>
  }
}
