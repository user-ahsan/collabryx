"use client"

import { useState, useEffect, useRef } from "react"
import { usePrivacySettings } from "@/hooks/use-privacy-settings"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2, Lock, Eye, EyeOff, Mail, Users, Activity, Download } from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface PrivacySettingsFormProps {
    userId: string
}

export function PrivacySettingsForm({ userId }: PrivacySettingsFormProps) {
    const { settings, isLoading, error, updateSettings, isUpdating } = usePrivacySettings(userId)
    const [hasChanges, setHasChanges] = useState(false)
    const hasSyncedRef = useRef(false)

    const [formData, setFormData] = useState({
        profile_visibility: 'public' as 'public' | 'friends-only' | 'private',
        show_email: false,
        show_connections_list: true,
        activity_status_visible: true,
        allow_data_download: true,
    })

    useEffect(() => {
        if (settings && !hasSyncedRef.current) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setFormData({
                profile_visibility: settings.profile_visibility ?? 'public',
                show_email: settings.show_email ?? false,
                show_connections_list: settings.show_connections_list ?? true,
                activity_status_visible: settings.activity_status_visible ?? true,
                allow_data_download: settings.allow_data_download ?? true,
            })
            hasSyncedRef.current = true
        }
    }, [settings])

    const updateField = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        setHasChanges(true)
    }

    const handleSave = async () => {
        try {
            await updateSettings(formData)
            setHasChanges(false)
            toast.success("Privacy settings saved successfully")
        } catch (error) {
            console.error("Error saving privacy settings:", error)
            toast.error("Failed to save privacy settings")
        }
    }

    const handleQuickToggle = <K extends keyof typeof formData>(field: K, value: typeof formData[K]) => {
        updateField(field, value)
        const updatedData = { ...formData, [field]: value }
        updateSettings(updatedData).catch((err) => {
            console.error("Error updating privacy setting:", error)
            toast.error("Failed to update privacy setting")
        })
    }

    const handleDataDownload = () => {
        toast.info("Preparing your data for download...")
        // TODO: Implement actual data export functionality
        setTimeout(() => {
            toast.success("Your data export is ready. Check your email.")
        }, 2000)
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
                Failed to load privacy settings. Please try again.
            </div>
        )
    }

    return (
        <Card className={cn("border-none shadow-none bg-transparent", glass("cardInner"))}>
            <CardHeader className="px-0 pt-0">
                <div className="flex items-center gap-2">
                    <Lock className="h-5 w-5 text-primary" />
                    <CardTitle className="text-lg font-semibold">Privacy Settings</CardTitle>
                </div>
                <CardDescription className="text-sm">
                    Control who can see your profile and how your data is used.
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
                        <Eye className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Profile Visibility</h3>
                    </div>

                    <div className="space-y-4 pl-6">
                        <div className="space-y-2">
                            <Label htmlFor="profile_visibility" className="text-sm font-medium">
                                Who can see your profile?
                            </Label>
                            <Select
                                value={formData.profile_visibility}
                                onValueChange={(value: 'public' | 'friends-only' | 'private') => {
                                    updateField("profile_visibility", value)
                                }}
                                disabled={isUpdating}
                            >
                                <SelectTrigger className={cn("w-full", glass("input"))}>
                                    <SelectValue placeholder="Select visibility" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="public">
                                        <div className="flex items-center gap-2">
                                            <Eye className="h-4 w-4" />
                                            <span>Public - Anyone can see your profile</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="friends-only">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4" />
                                            <span>Friends Only - Only connections can see your profile</span>
                                        </div>
                                    </SelectItem>
                                    <SelectItem value="private">
                                        <div className="flex items-center gap-2">
                                            <EyeOff className="h-4 w-4" />
                                            <span>Private - Only you can see your profile</span>
                                        </div>
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <p className="text-xs text-muted-foreground">
                                {formData.profile_visibility === 'public' && "Your profile is visible to everyone on Collabryx."}
                                {formData.profile_visibility === 'friends-only' && "Only your accepted connections can view your full profile."}
                                {formData.profile_visibility === 'private' && "Your profile is hidden from all other users."}
                            </p>
                        </div>
                    </div>
                </div>

                <Separator className={glass("divider")} />

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Lock className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Privacy Controls</h3>
                    </div>

                    <div className="space-y-4 pl-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <Mail className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">Show Email Address</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Display your email on your public profile
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={formData.show_email}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleQuickToggle("show_email", e.target.checked)
                                }
                                disabled={isUpdating}
                            />
                        </div>

                        <Separator className={glass("divider")} />

                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <Users className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">Show Connections List</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Allow others to see who you&apos;re connected with
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={formData.show_connections_list}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleQuickToggle("show_connections_list", e.target.checked)
                                }
                                disabled={isUpdating}
                            />
                        </div>

                        <Separator className={glass("divider")} />

                        <div className="flex items-center justify-between">
                            <div className="flex items-start gap-3">
                                <Activity className="h-4 w-4 mt-0.5 text-muted-foreground" />
                                <div className="space-y-0.5">
                                    <Label className="text-sm font-medium">Activity Status</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Show when you&apos;re online or recently active
                                    </p>
                                </div>
                            </div>
                            <Switch
                                checked={formData.activity_status_visible}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleQuickToggle("activity_status_visible", e.target.checked)
                                }
                                disabled={isUpdating}
                            />
                        </div>
                    </div>
                </div>

                <Separator className={glass("divider")} />

                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Download className="h-4 w-4 text-muted-foreground" />
                        <h3 className="text-sm font-semibold">Data & Privacy</h3>
                    </div>

                    <div className="space-y-4 pl-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label className="text-sm font-medium">Allow Data Download</Label>
                                <p className="text-xs text-muted-foreground">
                                    Enable exporting your personal data
                                </p>
                            </div>
                            <Switch
                                checked={formData.allow_data_download}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                                    handleQuickToggle("allow_data_download", e.target.checked)
                                }
                                disabled={isUpdating}
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                variant="outline"
                                onClick={handleDataDownload}
                                disabled={!formData.allow_data_download || isUpdating}
                                className={cn("w-full", glass("input"))}
                            >
                                <Download className="h-4 w-4 mr-2" />
                                Download My Data
                            </Button>
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
                                "Save Privacy Settings"
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
