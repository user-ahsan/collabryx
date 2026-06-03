"use client"

import { useState, useEffect, useRef } from "react"
import { useNotificationPreferences } from "@/hooks/use-notification-preferences"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Loader2,
  Bell,
  BellRing,
  BellOff,
  Mail,
  Smartphone,
  Heart,
  MessageCircle,
  Users,
  UserPlus,
  Sparkles,
  AtSign,
  ThumbsUp,
  Award,
  Moon,
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NotificationPreferencesFormProps {
  userId: string
}

type PreferenceKey =
  | "notifications_enabled"
  | "push_new_connections"
  | "push_connect_accepted"
  | "push_messages"
  | "push_post_likes"
  | "push_comments"
  | "push_comment_likes"
  | "push_mentions"
  | "push_match_alerts"
  | "push_achievements"
  | "push_enabled"
  | "email_new_connections"
  | "email_messages"
  | "email_post_likes"
  | "email_comments"
  | "email_connect_accepted"
  | "email_mentions"
  | "email_achievements"
  | "email_digest"
  | "ai_smart_match_alerts"
  | "in_app_notifications"
  | "quiet_hours_enabled"

// ---------------------------------------------------------------------------
// Notification category definitions
// ---------------------------------------------------------------------------

interface NotificationItem {
  key: PreferenceKey
  label: string
  description: string
  icon: React.ElementType
  inApp: boolean // Show in-app/push toggle
  email: boolean // Show email toggle
}

const NOTIFICATION_TYPES: NotificationItem[] = [
  {
    key: "push_new_connections",
    label: "Connection Requests",
    description: "When someone sends you a connection request",
    icon: UserPlus,
    inApp: true,
    email: true,
  },
  {
    key: "push_connect_accepted",
    label: "Connection Accepted",
    description: "When someone accepts your connection request",
    icon: Users,
    inApp: true,
    email: true,
  },
  {
    key: "push_messages",
    label: "Messages",
    description: "When you receive a new direct message",
    icon: MessageCircle,
    inApp: true,
    email: true,
  },
  {
    key: "push_post_likes",
    label: "Post Reactions & Likes",
    description: "When someone reacts to your posts",
    icon: Heart,
    inApp: true,
    email: true,
  },
  {
    key: "push_comments",
    label: "Comments",
    description: "When someone comments on your posts",
    icon: MessageCircle,
    inApp: true,
    email: true,
  },
  {
    key: "push_comment_likes",
    label: "Comment Likes",
    description: "When someone likes your comment",
    icon: ThumbsUp,
    inApp: true,
    email: false,
  },
  {
    key: "push_mentions",
    label: "Mentions",
    description: "When someone mentions you in a post or comment",
    icon: AtSign,
    inApp: true,
    email: true,
  },
  {
    key: "push_match_alerts",
    label: "AI Smart Match Alerts",
    description: "New AI-curated potential matches found for you",
    icon: Sparkles,
    inApp: true,
    email: true,
  },
  {
    key: "push_achievements",
    label: "Achievements & Milestones",
    description: "Badges, milestones, and accomplishments",
    icon: Award,
    inApp: true,
    email: true,
  },
]

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function NotificationPreferencesForm({ userId }: NotificationPreferencesFormProps) {
  const { preferences, isLoading, error, updatePreferences, isUpdating } = useNotificationPreferences(userId)
  const [hasChanges, setHasChanges] = useState(false)
  const hasSyncedRef = useRef(false)

  const [formData, setFormData] = useState<Record<string, boolean>>({
    notifications_enabled: true,
    push_new_connections: true,
    push_connect_accepted: true,
    push_messages: true,
    push_post_likes: true,
    push_comments: true,
    push_comment_likes: true,
    push_mentions: true,
    push_match_alerts: true,
    push_achievements: true,
    push_enabled: false,
    email_new_connections: true,
    email_messages: true,
    email_post_likes: true,
    email_comments: true,
    email_connect_accepted: true,
    email_mentions: true,
    email_achievements: true,
    email_digest: false,
    ai_smart_match_alerts: true,
    in_app_notifications: true,
    quiet_hours_enabled: false,
  })

  useEffect(() => {
    if (preferences && !hasSyncedRef.current) {
      setFormData((prev) => {
        const synced = { ...prev }
        // Only sync fields that exist in preferences (handle partial sync gracefully)
        for (const key of Object.keys(synced) as PreferenceKey[]) {
          const prefValue = (preferences as unknown as Record<string, unknown>)[key]
          if (typeof prefValue === "boolean") {
            synced[key] = prefValue
          }
        }
        return synced
      })
      hasSyncedRef.current = true
    }
  }, [preferences])

  const updateField = (field: PreferenceKey, value: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      await updatePreferences(formData as unknown as Parameters<typeof updatePreferences>[0])
      setHasChanges(false)
    } catch (error) {
      console.error("Error saving preferences:", error)
    }
  }

  const handleQuickToggle = (field: PreferenceKey, value: boolean) => {
    updateField(field, value)
    const updatedData = { ...formData, [field]: value }
    updatePreferences(updatedData as unknown as Parameters<typeof updatePreferences>[0]).catch((_err: Error) => {
      console.error("Error updating preference:", _err)
      toast.error("Failed to update preference")
    })
  }

  // Whether notifications are globally enabled
  const globallyEnabled = formData.notifications_enabled

  // Loading state
  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        Failed to load notification preferences. Please try again.
      </div>
    )
  }

  return (
    <Card className={cn("border-none shadow-none bg-transparent", glass("cardInner"))}>
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">Notification Preferences</CardTitle>
        </div>
        <CardDescription className="text-sm">
          Manage how and when you receive notifications from Collabryx.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 px-0 pb-0">
        {/* Unsaved changes banner */}
        {hasChanges && (
          <div className="flex items-center justify-between rounded-md bg-primary/10 p-3">
            <span className="text-sm font-medium text-primary">You have unsaved changes</span>
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              size="sm"
              className={cn("h-8", glass("buttonPrimary"), glass("buttonPrimaryGlow"))}
            >
              {isUpdating ? <Loader2 className="h-3 w-3 animate-spin" /> : "Save Changes"}
            </Button>
          </div>
        )}

        {/* ════════════════════════════════════════════
            GLOBAL MASTER TOGGLE
            ════════════════════════════════════════════ */}
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-border/50 p-4">
            <div className="flex items-start gap-3">
              <div
                className={cn(
                  "mt-0.5 flex h-8 w-8 items-center justify-center rounded-full",
                  globallyEnabled
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {globallyEnabled ? (
                  <BellRing className="h-4 w-4" />
                ) : (
                  <BellOff className="h-4 w-4" />
                )}
              </div>
              <div className="space-y-0.5">
                <Label className="text-sm font-semibold">All Notifications</Label>
                <p className="text-xs text-muted-foreground">
                  {globallyEnabled
                    ? "You are receiving notifications based on your preferences below"
                    : "All notifications are paused. Toggle on to resume."}
                </p>
              </div>
            </div>
            <Switch
              checked={formData.notifications_enabled}
              onCheckedChange={(checked) => handleQuickToggle("notifications_enabled", checked)}
              disabled={isUpdating}
            />
          </div>
        </div>

        {/* Only show individual toggles when globally enabled */}
        {globallyEnabled && (
          <>
            {/* ════════════════════════════════════════════
                IN-APP / PUSH NOTIFICATIONS
                ════════════════════════════════════════════ */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">In-App & Push Notifications</h3>
              </div>

              <div className="space-y-2 pl-6">
                {NOTIFICATION_TYPES.map((item, index) => {
                  const IconComponent = item.icon as React.FC<{ className?: string }>
                  return (
                    <div key={item.key}>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-start gap-3">
                          <IconComponent className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">{item.label}</Label>
                            <p className="text-xs text-muted-foreground">{item.description}</p>
                          </div>
                        </div>
                        <Switch
                          checked={formData[item.key]}
                          onCheckedChange={(checked) => handleQuickToggle(item.key, checked)}
                          disabled={isUpdating}
                        />
                      </div>
                      {index < NOTIFICATION_TYPES.length - 1 && (
                        <Separator className={cn("my-1", glass("divider"))} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <Separator className={glass("divider")} />

            {/* ════════════════════════════════════════════
                EMAIL NOTIFICATIONS
                ════════════════════════════════════════════ */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Email Notifications</h3>
              </div>

              <div className="space-y-3 pl-6">
                {NOTIFICATION_TYPES.filter((t) => t.email).map((item, index) => {
                  const IconComponent = item.icon as React.FC<{ className?: string }>
                  return (
                    <div key={item.key}>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-start gap-3">
                          <IconComponent className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                          <div className="space-y-0.5">
                            <Label className="text-sm font-medium">Email: {item.label}</Label>
                            <p className="text-xs text-muted-foreground">
                              Receive email for {item.description.toLowerCase()}
                            </p>
                          </div>
                        </div>
                        <Switch
                          checked={formData[item.key]}
                          onCheckedChange={(checked) => handleQuickToggle(item.key, checked)}
                          disabled={isUpdating}
                        />
                      </div>
                      {index < NOTIFICATION_TYPES.filter((t) => t.email).length - 1 && (
                        <Separator className={cn("my-1", glass("divider"))} />
                      )}
                    </div>
                  )
                })}

                {/* Email digest */}
                <Separator className={cn("my-1", glass("divider"))} />
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Daily Digest</Label>
                      <p className="text-xs text-muted-foreground">
                        Receive a daily summary of all unread notifications
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.email_digest}
                    onCheckedChange={(checked) => handleQuickToggle("email_digest", checked)}
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>

            <Separator className={glass("divider")} />

            {/* ════════════════════════════════════════════
                QUIET HOURS
                ════════════════════════════════════════════ */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Moon className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold">Quiet Hours</h3>
              </div>

              <div className="pl-6">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-start gap-3">
                    <Moon className="mt-0.5 h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="space-y-0.5">
                      <Label className="text-sm font-medium">Enable Quiet Hours</Label>
                      <p className="text-xs text-muted-foreground">
                        Suppress non-critical notifications between 10 PM and 8 AM
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={formData.quiet_hours_enabled}
                    onCheckedChange={(checked) => handleQuickToggle("quiet_hours_enabled", checked)}
                    disabled={isUpdating}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Bottom save button */}
        {!hasChanges && globallyEnabled && (
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSave}
              disabled={isUpdating}
              className={cn(glass("buttonPrimary"), glass("buttonPrimaryGlow"))}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Preferences"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
