"use client"

import * as React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { FlagIcon, Loader2Icon } from "lucide-react"
import { toast } from "sonner"

export type ReportReason = 
  | "spam"
  | "harassment"
  | "inappropriate"
  | "hate_speech"
  | "misinformation"
  | "copyright"
  | "other"

export interface ReportContentProps {
  contentType: "post" | "comment" | "message" | "profile"
  contentId: string
  trigger?: React.ReactNode
  onReportSuccess?: () => void
}

const reportReasons: { value: ReportReason; label: string; description: string }[] = [
  {
    value: "spam",
    label: "Spam",
    description: "Promotional content, scams, or repetitive posts",
  },
  {
    value: "harassment",
    label: "Harassment",
    description: "Bullying, threats, or targeted abuse",
  },
  {
    value: "inappropriate",
    label: "Inappropriate Content",
    description: "NSFW, violent, or disturbing content",
  },
  {
    value: "hate_speech",
    label: "Hate Speech",
    description: "Discrimination based on identity or beliefs",
  },
  {
    value: "misinformation",
    label: "Misinformation",
    description: "False or misleading information",
  },
  {
    value: "copyright",
    label: "Copyright Violation",
    description: "Unauthorized use of copyrighted material",
  },
  {
    value: "other",
    label: "Other",
    description: "Something else not listed here",
  },
]

export function ReportContentDialog({
  contentType,
  contentId,
  trigger,
  onReportSuccess,
}: ReportContentProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null)
  const [additionalDetails, setAdditionalDetails] = useState("")

  const handleSubmit = async () => {
    if (!selectedReason) {
      toast.error("Please select a reason for reporting")
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          content_type: contentType,
          content_id: contentId,
          reason: selectedReason,
          additional_details: additionalDetails || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || "Failed to submit report")
      }

      toast.success("Report submitted successfully")
      setOpen(false)
      setSelectedReason(null)
      setAdditionalDetails("")
      onReportSuccess?.()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to submit report"
      toast.error(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const defaultTrigger = (
    <Button
      variant="ghost"
      size="sm"
      className="h-8 gap-1 text-muted-foreground hover:text-destructive"
    >
      <FlagIcon className="h-3 w-3" />
      Report
    </Button>
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger || defaultTrigger}</DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Report {contentType}</DialogTitle>
          <DialogDescription>
            Help us keep our community safe by reporting inappropriate content. All reports are reviewed by our moderation team.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="space-y-3">
            <label className="text-sm font-medium">Select a reason</label>
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {reportReasons.map((reason) => (
                <button
                  key={reason.value}
                  onClick={() => setSelectedReason(reason.value)}
                  className={`w-full text-left p-3 rounded-lg border transition-colors ${
                    selectedReason === reason.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/50"
                  }`}
                >
                  <div className="font-medium text-sm">{reason.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {reason.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {selectedReason === "other" && (
            <div className="space-y-2">
              <label htmlFor="details" className="text-sm font-medium">
                Additional Details
              </label>
              <textarea
                id="details"
                value={additionalDetails}
                onChange={(e) => setAdditionalDetails(e.target.value)}
                placeholder="Please provide more information about your report..."
                className="w-full min-h-[100px] p-3 text-sm border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          {selectedReason && (
            <Alert className="bg-blue-500/10 border-blue-500/50">
              <AlertDescription className="text-sm">
                Your report will be reviewed anonymously. The content creator will not be notified that you reported this content.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedReason || isSubmitting}
            className="gap-2"
          >
            {isSubmitting && <Loader2Icon className="h-4 w-4 animate-spin" />}
            Submit Report
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
