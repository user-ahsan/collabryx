"use client"

import { useState, useEffect, useRef } from "react"
import { useNotificationPreferences } from "@/hooks/use-notification-preferences"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, Bell, Mail, Smartphone, Heart, MessageCircle, Users, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

interface NotificationPreferencesFormProps {
    userId: string
}

export function NotificationPreferencesForm({ userId }: NotificationPreferencesFormProps) {
    const { preferences, isLoading, error, updatePreferences, isUpdating } = useNotificationPreferences(userId)
    const [hasChanges, setHasChanges] = useState(false)
    const hasSyncedRef = useRef(false)

    const [formData, setFormData] = useState({
        email_new_connections: true,
        email_messages: true,
        email_post_likes: true,
        email_comments: true,
        push_enabled: false,
        ai_smart_match_alerts: true,
    })

    // eslint-disable-next-line react-hooks/set-state-in-effect
    useEffect(() => {
        if (preferences && !hasSyncedRef.current) {
            setFormData({
                email_new_connections: preferences.email_new_connections ?? true,
                email_messages: preferences.email_messages ?? true,
                email_post_likes: preferences.email_post_likes ?? true,
                email_comments: preferences.email_comments ?? true,
                push_enabled: preferences.push_enabled ?? false,
                ai_smart_match_alerts: preferences.ai_smart_match_alerts ?? true,
            })
            hasSyncedRef.current = true
        }
    }, [preferences])

    const updateField = (field: keyof typeof formData, value: boolean) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        setHasChanges(true)
    }

    const handleSave = async () => {
        try {
            await updatePreferences(formData)
            setHasChanges(false)
        } catch (err) {
            console.error("Error saving preferences:", err)
        }
    }

    const handleQuickToggle = (field: keyof typeof formData, value: boolean) => {
        updateField(field, value)
        const updatedData = { ...formData, [field]: value }
        updatePreferences(updatedData).catch((err) => {
            console.error("Error updating preference:", err)
            toast.error("Failed to update preference")
        })
    }

    if (isLoading) {
        return (
            <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

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
                {hasChanges && (
                    <div className="flex items-center justify-between rounded-md bg-primary/10 p-3">
                        <span className="text-sm font-medium text-primary">You have unsaved changes</span>
                        <Button
                            onClick={handleSave}
                            disabled={isUpdating}
                            size="sm"
                            className={cn("h-8", glass("buttonPrimary"), glass("buttonPrimaryGlow"))}
                        >
                            {isUpdating ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                )}

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Email Notifications</h3>
                    </div>

                    <div className="space-y-4 pl-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">Connection Requests</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Receive emails when someone sends you a connection request
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={formData.email_new_connections}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleQuickToggle("email_new_connections", e.target.checked)
                                }
                                disabled={isUpdating}
                            />
                        </div>

                        <Separator className={glass("divider")} />

                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <MessageCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">Messages</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Receive emails when you get new messages
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={formData.email_messages}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleQuickToggle("email_messages", e.target.checked)
                                }
                                disabled={isUpdating}
                            />
                        </div>

                        <Separator className={glass("divider")} />

                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <Heart className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">Post Reactions & Likes</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Get notified when someone likes or reacts to your posts
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={formData.email_post_likes}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleQuickToggle("email_post_likes", e.target.checked)
                                }
                                disabled={isUpdating}
                            />
                        </div>

                        <Separator className={glass("divider")} />

                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <MessageCircle className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">Comments</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Receive notifications when someone comments on your posts
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={formData.email_comments}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleQuickToggle("email_comments", e.target.checked)
                                }
                                disabled={isUpdating}
                            />
                        </div>

                        <Separator className={glass("divider")} />

                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <Sparkles className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">AI Smart Match Alerts</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Weekly digest of AI-curated potential matches
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={formData.ai_smart_match_alerts}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleQuickToggle("ai_smart_match_alerts", e.target.checked)
                                }
                                disabled={isUpdating}
                            />
                        </div>
                    </div>
                </div>

                <Separator className={glass("divider")} />

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Push Notifications</h3>
                    </div>

                    <div className="space-y-4 pl-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Enable Push Notifications</Label>
                                <p className="text-xs text-muted-foreground">
                                    Receive browser push notifications (coming soon)
                                </p>
                            </div>
                            <Switch
                                checked={formData.push_enabled}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleQuickToggle("push_enabled", e.target.checked)
                                }
                                disabled={isUpdating}
                            />
                        </div>
                    </div>
                </div>

                {!hasChanges && (
                    <div className="flex justify-end pt-2">
                        <Button
                            onClick={handleSave}
                            disabled={isUpdating}
                            className={cn(glass("buttonPrimary"), glass("buttonPrimaryGlow"))}
                        >
                            {isUpdating ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
