"use client"

import * as React from "react"
import { useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { ShieldAlertIcon, ShieldCheckIcon, EyeIcon, EyeOffIcon } from "lucide-react"

export interface ModerationResult {
  approved: boolean
  flag_for_review: boolean
  auto_reject: boolean
  risk_score: number
  action: "approved" | "flag_for_review" | "auto_reject"
  details?: {
    toxicity?: { score: number }
    spam?: { score: number }
    nsfw?: { score: number }
    pii?: { detected: boolean; types: string[] }
  }
}

interface ContentModerationGuardProps {
  children: React.ReactNode
  moderationResult: ModerationResult | null
  contentType?: "post" | "comment" | "message" | "profile"
  allowViewAtRisk?: boolean
  className?: string
}

export function ContentModerationGuard({
  children,
  moderationResult,
  contentType = "post",
  allowViewAtRisk = true,
  className,
}: ContentModerationGuardProps) {
  const [showFlaggedContent, setShowFlaggedContent] = useState(false)

  if (!moderationResult) {
    return <>{children}</>
  }

  const { approved, flag_for_review, auto_reject, details } = moderationResult

  if (approved && !flag_for_review) {
    return <>{children}</>
  }

  if (auto_reject) {
    return (
      <div className={className}>
        <Alert variant="destructive" className="border-destructive/50 bg-destructive/10">
          <ShieldAlertIcon className="h-4 w-4" />
          <AlertTitle>Content Blocked</AlertTitle>
          <AlertDescription className="mt-2">
            This {contentType} has been automatically blocked due to policy violations.
            {details?.toxicity && details.toxicity.score >= 0.7 && (
              <span className="block mt-1 text-sm">Reason: Potentially toxic language detected.</span>
            )}
            {details?.spam && details.spam.score >= 0.8 && (
              <span className="block mt-1 text-sm">Reason: Spam-like content detected.</span>
            )}
            {details?.pii?.detected && (
              <span className="block mt-1 text-sm">Reason: Personal information detected.</span>
            )}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  if (flag_for_review) {
    if (showFlaggedContent) {
      return (
        <div className={className}>
          <div className="relative">
            {children}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFlaggedContent(false)}
              className="absolute top-2 right-2 h-8 gap-1"
            >
              <EyeOffIcon className="h-3 w-3" />
              Hide
            </Button>
          </div>
        </div>
      )
    }

    if (allowViewAtRisk) {
      return (
        <div className={className}>
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <ShieldAlertIcon className="h-4 w-4 text-amber-600" />
            <AlertTitle className="text-amber-600">Content Under Review</AlertTitle>
            <AlertDescription className="mt-2 text-amber-700">
              This {contentType} has been flagged for moderation review and may contain inappropriate content.
              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowFlaggedContent(true)}
                  className="h-8 gap-1"
                >
                  <EyeIcon className="h-3 w-3" />
                  View at own risk
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </div>
      )
    }

    return (
      <div className={className}>
        <Alert className="border-amber-500/50 bg-amber-500/10">
          <ShieldAlertIcon className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-600">Content Under Review</AlertTitle>
          <AlertDescription className="mt-2 text-amber-700">
            This {contentType} is currently under moderation review and is not visible.
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  return <>{children}</>
}

interface ModerationStatusBadgeProps {
  result: ModerationResult | null
  showScore?: boolean
  className?: string
}

export function ModerationStatusBadge({
  result,
  showScore = false,
  className,
}: ModerationStatusBadgeProps) {
  if (!result) {
    return null
  }

  const { approved, flag_for_review, auto_reject, risk_score } = result

  if (auto_reject) {
    return (
      <div className={`flex items-center gap-1 text-destructive ${className}`}>
        <ShieldAlertIcon className="h-3 w-3" />
        <span className="text-xs font-medium">Blocked</span>
        {showScore && <span className="text-xs opacity-70">({Math.round(risk_score * 100)}% risk)</span>}
      </div>
    )
  }

  if (flag_for_review) {
    return (
      <div className={`flex items-center gap-1 text-amber-600 ${className}`}>
        <ShieldAlertIcon className="h-3 w-3" />
        <span className="text-xs font-medium">Under Review</span>
        {showScore && <span className="text-xs opacity-70">({Math.round(risk_score * 100)}% risk)</span>}
      </div>
    )
  }

  if (approved) {
    return (
      <div className={`flex items-center gap-1 text-green-600 ${className}`}>
        <ShieldCheckIcon className="h-3 w-3" />
        <span className="text-xs font-medium">Approved</span>
        {showScore && risk_score > 0 && (
          <span className="text-xs opacity-70">({Math.round(risk_score * 100)}% risk)</span>
        )}
      </div>
    )
  }

  return null
}
