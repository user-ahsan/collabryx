"use client"

import { useEffect, useState } from "react"
import { useSettings } from "@/hooks/use-settings"
import { createClient } from "@/lib/supabase/client"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { User, Shield, Bell, CreditCard, Loader2, Info, Code2, Briefcase } from "lucide-react"
import { ProfileSettingsTab } from "./profile-settings-tab"
import { SkillsInterestsSettingsTab } from "./skills-settings-tab"
import { ExperienceProjectsSettingsTab } from "./experience-projects-settings-tab"

export function SettingsDialog() {
    const { isOpen, setIsOpen, activeTab, setActiveTab } = useSettings()

    const [isLoading, setIsLoading] = useState(true)
    const [, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // User data state
    const [userId, setUserId] = useState<string | null>(null)
    const [email, setEmail] = useState("")
    const [preferences, setPreferences] = useState({
        email_new_connections: true,
        email_messages: true,
        ai_smart_match_alerts: false
    })

    const supabase = createClient()

    useEffect(() => {
        if (!isOpen) return

        const fetchUserData = async () => {
            try {
                setIsLoading(true)
                setError(null)

                if (process.env.NODE_ENV === 'development') {
                    setUserId('dev-user-123')
                    setEmail('developer@example.com')
                    setPreferences({
                        email_new_connections: true,
                        email_messages: true,
                        ai_smart_match_alerts: false,
                    })
                    setIsLoading(false)
                    return
                }

                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError) throw authError
                if (!user) throw new Error("Not authenticated")

                setUserId(user.id)
                setEmail(user.email || "")

                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('email_new_connections, email_messages, ai_smart_match_alerts')
                    .eq('id', user.id)
                    .single()

                if (profileError && profileError.code !== 'PGRST116') {
                    throw profileError
                }

                if (profileData) {
                    setPreferences({
                        email_new_connections: profileData.email_new_connections ?? true,
                        email_messages: profileData.email_messages ?? true,
                        ai_smart_match_alerts: profileData.ai_smart_match_alerts ?? false,
                    })
                }
            } catch (err: unknown) {
                console.error("Error fetching settings:", err)
                setError("Failed to load settings. Showing local defaults.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserData()
    }, [isOpen, supabase])

    const handleSavePreferences = async () => {
        setIsSaving(true)
        setError(null)
        try {
            if (process.env.NODE_ENV === 'development') {
                await new Promise(resolve => setTimeout(resolve, 500))
                return
            }

            if (!userId) throw new Error("Not authenticated")

            const { error: updateError } = await supabase
                .from('profiles')
                .update({
                    ...preferences,
                    updated_at: new Date().toISOString()
                })
                .eq('id', userId)

            if (updateError) throw updateError
        } catch (err: unknown) {
            console.error("Error saving settings:", err)
            setError("Failed to save settings.")
        } finally {
            setIsSaving(false)
        }
    }

    const updatePreferenceField = (field: string, value: boolean) => {
        setPreferences(prev => ({ ...prev, [field]: value }))
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-[95vw] md:max-w-5xl p-0 h-[85vh] overflow-hidden bg-blue-950/[0.05] backdrop-blur-2xl border border-blue-400/10 shadow-[0_4px_32px_0_rgba(59,130,246,0.06),0_1px_0_0_rgba(255,255,255,0.06)_inset] sm:rounded-2xl">
                {/* Top highlight streak */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-blue-300/30 to-transparent pointer-events-none z-0" />
                {/* Left edge highlight */}
                <div className="absolute inset-y-0 left-0 w-px bg-gradient-to-b from-blue-300/20 via-transparent to-transparent pointer-events-none z-0" />
                {/* Blue ambient tint overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.04] via-transparent to-indigo-500/[0.03] pointer-events-none z-0" />

                <div className="relative z-10 flex flex-col h-full w-full">
                    <DialogTitle className="sr-only">Account Settings</DialogTitle>
                    <DialogDescription className="sr-only">
                        Manage your profile, account preferences, notifications, and billing details.
                    </DialogDescription>
                    <DialogHeader className="px-6 py-4 border-b border-white/10 shrink-0">
                        <DialogTitle className="text-2xl font-bold">Settings</DialogTitle>
                        <DialogDescription>
                            Manage your profile, account preferences, and notifications.
                        </DialogDescription>
                    </DialogHeader>

                    {error && (
                        <div className="bg-destructive/15 text-destructive text-sm px-6 py-3 border-b border-destructive/20 font-medium">
                            {error}
                        </div>
                    )}

                    <div className="flex flex-1 overflow-hidden relative z-10">
                        <Tabs
                            value={activeTab}
                            onValueChange={(val) => setActiveTab(val as "profile" | "skills" | "experience" | "account" | "notifications" | "billing")}
                            className="flex flex-col md:flex-row w-full"
                        >
                            {/* Sidebar inside Dialog */}
                            <div className="md:w-60 shrink-0 md:border-r md:border-white/10 overflow-y-auto">
                                <TabsList className="flex md:flex-col h-auto w-full items-stretch justify-start p-2 md:p-4 gap-1 bg-transparent">
                                    <TabsTrigger value="profile" className="justify-start gap-2 px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm font-medium">
                                        <User className="h-4 w-4" />
                                        <span className="hidden md:inline">Profile</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="skills" className="justify-start gap-2 px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm font-medium">
                                        <Code2 className="h-4 w-4" />
                                        <span className="hidden md:inline">Skills & Interests</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="experience" className="justify-start gap-2 px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm font-medium">
                                        <Briefcase className="h-4 w-4" />
                                        <span className="hidden md:inline">Experience & Projects</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="account" className="justify-start gap-2 px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm font-medium">
                                        <Shield className="h-4 w-4" />
                                        <span className="hidden md:inline">Account</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="notifications" className="justify-start gap-2 px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm font-medium">
                                        <Bell className="h-4 w-4" />
                                        <span className="hidden md:inline">Notifications</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="billing" className="justify-start gap-2 px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm font-medium">
                                        <CreditCard className="h-4 w-4" />
                                        <span className="hidden md:inline">Billing</span>
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 md:pb-6">
                                {isLoading ? (
                                    <div className="h-full flex items-center justify-center text-muted-foreground">
                                        <Loader2 className="h-8 w-8 animate-spin" />
                                    </div>
                                ) : (
                                    <>
                                        <TabsContent value="profile" className="mt-0 space-y-6">
                                            {userId ? <ProfileSettingsTab userId={userId} /> : null}
                                        </TabsContent>

                                        <TabsContent value="skills" className="mt-0 space-y-6">
                                            {userId ? <SkillsInterestsSettingsTab userId={userId} /> : null}
                                        </TabsContent>

                                        <TabsContent value="experience" className="mt-0 space-y-6">
                                            {userId ? <ExperienceProjectsSettingsTab userId={userId} /> : null}
                                        </TabsContent>

                                        <TabsContent value="account" className="mt-0 space-y-6">
                                            <Card className="border-none shadow-none bg-transparent">
                                                <CardHeader className="px-0 pt-0">
                                                    <CardTitle>Account Security</CardTitle>
                                                    <CardDescription>Manage your password and security settings.</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-4 px-0 pb-0">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <Label htmlFor="email">Email address</Label>
                                                            <span className="text-xs text-muted-foreground italic">Unchangeable</span>
                                                        </div>
                                                        <Input id="email" value={email} disabled className="bg-white/5 border-white/10 opacity-70 cursor-not-allowed" />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="new-password">New Password</Label>
                                                        <Input id="new-password" type="password" className="bg-white/5 border-white/10 focus:border-primary/50" />
                                                    </div>
                                                    <Button>Change Password</Button>
                                                </CardContent>
                                            </Card>
                                            <Separator />
                                            <Card className="border-none shadow-none bg-transparent">
                                                <CardHeader className="px-0 pt-4">
                                                    <CardTitle className="text-red-500">Danger Zone</CardTitle>
                                                </CardHeader>
                                                <CardContent className="px-0 pb-0">
                                                    <Button variant="destructive">Delete Account</Button>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="notifications" className="mt-0 space-y-6">
                                            <Card className="border-none shadow-none bg-transparent">
                                                <CardHeader className="px-0 pt-0">
                                                    <CardTitle>Email Notifications</CardTitle>
                                                    <CardDescription>Choose what updates you want to receive.</CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-6 px-0 pb-0">
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <Label>New Connections</Label>
                                                            <p className="text-sm text-muted-foreground mr-6">Receive emails when someone invites you.</p>
                                                        </div>
                                                        <Switch
                                                            checked={preferences.email_new_connections}
                                                            onChange={(e) => {
                                                                updatePreferenceField("email_new_connections", e.target.checked)
                                                                handleSavePreferences()
                                                            }}
                                                        />
                                                    </div>
                                                    <Separator />
                                                    <div className="flex items-center justify-between">
                                                        <div className="space-y-0.5">
                                                            <Label>Messages</Label>
                                                            <p className="text-sm text-muted-foreground mr-6">Receive emails for new messages.</p>
                                                        </div>
                                                        <Switch
                                                            checked={preferences.email_messages}
                                                            onChange={(e) => {
                                                                updatePreferenceField("email_messages", e.target.checked)
                                                                handleSavePreferences()
                                                            }}
                                                        />
                                                    </div>
                                                    <Separator />
                                                    <div className="flex items-center justify-between group">
                                                        <div className="space-y-0.5">
                                                            <div className="flex items-center gap-2">
                                                                <Label>AI Smart Match Alerts</Label>
                                                                <TooltipProvider delayDuration={100}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p className="max-w-xs text-xs">Let Collabryx AI find the best co-founders for you and notify you directly.</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            </div>
                                                            <p className="text-sm text-muted-foreground mr-6">Weekly digest of potential tailored matches.</p>
                                                        </div>
                                                        <Switch
                                                            checked={preferences.ai_smart_match_alerts}
                                                            onChange={(e) => {
                                                                updatePreferenceField("ai_smart_match_alerts", e.target.checked)
                                                                handleSavePreferences()
                                                            }}
                                                        />
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="billing" className="mt-0">
                                            <Card className="border-none shadow-none bg-transparent">
                                                <CardContent className="pt-6 text-center text-muted-foreground px-0 pb-0">
                                                    Billing features and invoice management coming soon.
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </>
                                )}
                            </div>
                        </Tabs>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
