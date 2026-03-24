"use client"

import * as React from "react"
import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ShieldAlertIcon,
  CheckCircleIcon,
  XCircleIcon,
  EyeIcon,
  MoreVerticalIcon,
  Loader2Icon,
  AlertTriangleIcon,
  UserXIcon,
} from "lucide-react"
import { toast } from "sonner"

interface ReportedContent {
  id: string
  content_type: "post" | "comment" | "message" | "profile"
  content_id: string
  content_preview: string
  reason: string
  additional_details: string | null
  status: "pending" | "reviewed" | "actioned"
  reported_by: {
    id: string
    name: string
  }
  reported_by_user: {
    id: string
    name: string
    avatar_url: string | null
  }
  created_at: string
  moderation_result: {
    risk_score: number
    action: "approved" | "flag_for_review" | "auto_reject"
  } | null
}

type StatusFilter = "all" | "pending" | "reviewed" | "actioned"
type TypeFilter = "all" | "post" | "comment" | "message" | "profile"

export function ModerationDashboardClient() {
  const [reports, setReports] = useState<ReportedContent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  const loadReports = useCallback(async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (typeFilter !== "all") params.set("content_type", typeFilter)

      const response = await fetch(`/api/admin/moderation/reports?${params}`)
      if (!response.ok) {
        throw new Error("Failed to load reports")
      }

      const data = await response.json()
      setReports(data.reports || [])
    } catch {
      console.error("Error loading reports:", error)
      toast.error("Failed to load moderation reports")
    } finally {
      setIsLoading(false)
    }
  }, [statusFilter, typeFilter])

  useEffect(() => {
    loadReports()
  }, [loadReports])

  const handleApprove = async (reportId: string) => {
    setActionInProgress(reportId)
    try {
      const response = await fetch(`/api/admin/moderation/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "actioned",
          action: "approved",
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to approve content")
      }

      toast.success("Content approved")
      loadReports()
    } catch {
      console.error("Error approving content:", error)
      toast.error("Failed to approve content")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleReject = async (reportId: string, contentId: string, contentType: string) => {
    setActionInProgress(reportId)
    try {
      const response = await fetch(`/api/admin/moderation/reports/${reportId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: "actioned",
          action: "rejected",
          content_id: contentId,
          content_type: contentType,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to reject content")
      }

      toast.success("Content removed")
      loadReports()
    } catch {
      console.error("Error rejecting content:", error)
      toast.error("Failed to reject content")
    } finally {
      setActionInProgress(null)
    }
  }

  const handleBanUser = async (userId: string) => {
    if (!confirm("Are you sure you want to ban this user? This action is irreversible.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/moderation/users/${userId}/ban`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error("Failed to ban user")
      }

      toast.success("User has been banned")
      loadReports()
    } catch {
      console.error("Error banning user:", error)
      toast.error("Failed to ban user")
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 border-amber-500/50">
            <AlertTriangleIcon className="h-3 w-3 mr-1" />
            Pending
          </Badge>
        )
      case "reviewed":
        return (
          <Badge variant="secondary" className="bg-blue-500/20 text-blue-700 border-blue-500/50">
            <EyeIcon className="h-3 w-3 mr-1" />
            Reviewed
          </Badge>
        )
      case "actioned":
        return (
          <Badge variant="secondary" className="bg-green-500/20 text-green-700 border-green-500/50">
            <CheckCircleIcon className="h-3 w-3 mr-1" />
            Actioned
          </Badge>
        )
      default:
        return <Badge>{status}</Badge>
    }
  }

  const getTypeBadge = (type: string) => {
    return <Badge variant="outline" className="text-xs">{type}</Badge>
  }

  const getRiskBadge = (riskScore: number) => {
    if (riskScore >= 0.7) {
      return (
        <Badge variant="destructive" className="text-xs">
          High Risk ({Math.round(riskScore * 100)}%)
        </Badge>
      )
    }
    if (riskScore >= 0.3) {
      return (
        <Badge variant="secondary" className="bg-amber-500/20 text-amber-700 text-xs">
          Medium Risk ({Math.round(riskScore * 100)}%)
        </Badge>
      )
    }
    return (
      <Badge variant="secondary" className="bg-green-500/20 text-green-700 text-xs">
        Low Risk ({Math.round(riskScore * 100)}%)
      </Badge>
    )
  }

  const filteredReports = reports

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2Icon className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading reports...</span>
      </div>
    )
  }

  if (filteredReports.length === 0) {
    return (
      <Alert className="bg-muted/50">
        <ShieldAlertIcon className="h-4 w-4" />
        <AlertDescription>
          No reports found for the selected filters.
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-center">
        <div className="flex-1">
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="reviewed">Reviewed</SelectItem>
              <SelectItem value="actioned">Actioned</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={typeFilter} onValueChange={(v) => setTypeFilter(v as TypeFilter)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="post">Posts</SelectItem>
              <SelectItem value="comment">Comments</SelectItem>
              <SelectItem value="message">Messages</SelectItem>
              <SelectItem value="profile">Profiles</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4">
        {filteredReports.map((report) => (
          <div
            key={report.id}
            className="border rounded-lg p-4 bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {getStatusBadge(report.status)}
                  {getTypeBadge(report.content_type)}
                  {report.moderation_result && getRiskBadge(report.moderation_result.risk_score)}
                  <span className="text-xs text-muted-foreground">
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-medium">
                    Reported by: {report.reported_by.name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Content by: {report.reported_by_user.name}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">Reason: {report.reason}</div>
                  <div className="text-sm bg-muted p-3 rounded-md">
                    {report.content_preview}
                  </div>
                  {report.additional_details && (
                    <div className="text-sm text-muted-foreground">
                      <span className="font-medium">Additional details:</span> {report.additional_details}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" disabled={actionInProgress === report.id}>
                      {actionInProgress === report.id ? (
                        <Loader2Icon className="h-4 w-4 animate-spin" />
                      ) : (
                        <MoreVerticalIcon className="h-4 w-4" />
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem
                      onClick={() => handleApprove(report.id)}
                      disabled={actionInProgress === report.id}
                      className="gap-2"
                    >
                      <CheckCircleIcon className="h-4 w-4 text-green-600" />
                      Approve Content
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleReject(report.id, report.content_id, report.content_type)}
                      disabled={actionInProgress === report.id}
                      className="gap-2"
                    >
                      <XCircleIcon className="h-4 w-4 text-destructive" />
                      Remove Content
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleBanUser(report.reported_by_user.id)}
                      disabled={actionInProgress === report.id}
                      className="gap-2 text-destructive"
                    >
                      <UserXIcon className="h-4 w-4" />
                      Ban User
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
