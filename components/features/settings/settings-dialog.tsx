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
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { User, Shield, Bell, CreditCard, Loader2, Info } from "lucide-react"

export function SettingsDialog() {
    const { isOpen, setIsOpen, activeTab, setActiveTab } = useSettings()

    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)

    // User data state
    const [email, setEmail] = useState("")
    const [profile, setProfile] = useState({
        display_name: "",
        headline: "",
        bio: "",
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

                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError) throw authError
                if (!user) throw new Error("Not authenticated")

                setEmail(user.email || "")

                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('*')
                    .eq('id', user.id)
                    .single()

                if (profileError && profileError.code !== 'PGRST116') {
                    // Ignore not found error as row might not exist yet
                    throw profileError
                }

                if (profileData) {
                    setProfile({
                        display_name: profileData.display_name || "",
                        headline: profileData.headline || "",
                        bio: profileData.bio || "",
                        email_new_connections: profileData.email_new_connections ?? true,
                        email_messages: profileData.email_messages ?? true,
                        ai_smart_match_alerts: profileData.ai_smart_match_alerts ?? false,
                    })
                }
            } catch (err: any) {
                console.error("Error fetching settings:", err)
                setError("Failed to load settings. Showing local defaults.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserData()
    }, [isOpen, supabase])

    const handleSaveProfile = async () => {
        setIsSaving(true)
        setError(null)
        try {
            const { data: { user } } = await supabase.auth.getUser()
            if (!user) throw new Error("Not authenticated")

            const { error: updateError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    ...profile,
                    updated_at: new Date().toISOString()
                })

            if (updateError) throw updateError
        } catch (err: any) {
            console.error("Error saving settings:", err)
            setError("Failed to save settings.")
        } finally {
            setIsSaving(false)
        }
    }

    const updateProfileField = (field: string, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }))
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[700px] h-[85vh] md:h-[600px] flex flex-col p-0 overflow-hidden gap-0">
                <DialogHeader className="px-6 py-4 border-b shrink-0">
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

                <div className="flex flex-1 overflow-hidden">
                    <Tabs
                        value={activeTab}
                        onValueChange={(val: any) => setActiveTab(val)}
                        className="flex flex-col md:flex-row w-full"
                    >
                        {/* Sidebar inside Dialog */}
                        <div className="md:w-48 shrink-0 md:border-r overflow-y-auto">
                            <TabsList className="flex md:flex-col h-auto w-full items-stretch justify-start p-2 md:p-4 gap-1 bg-transparent">
                                <TabsTrigger value="profile" className="justify-start gap-2 px-3 py-2 data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all text-sm font-medium">
                                    <User className="h-4 w-4" />
                                    <span className="hidden md:inline">Profile</span>
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
                                        <Card className="border-none shadow-none bg-transparent">
                                            <CardHeader className="px-0 pt-0">
                                                <CardTitle>Profile Information</CardTitle>
                                                <CardDescription>Update your public profile details.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4 px-0 pb-0">
                                                <div className="space-y-2">
                                                    <Label htmlFor="display-name">Display Name</Label>
                                                    <Input
                                                        id="display-name"
                                                        value={profile.display_name}
                                                        onChange={(e) => updateProfileField("display_name", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="headline">Headline</Label>
                                                    <Input
                                                        id="headline"
                                                        value={profile.headline}
                                                        onChange={(e) => updateProfileField("headline", e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="bio">Bio</Label>
                                                    <Textarea
                                                        id="bio"
                                                        className="h-24 resize-none"
                                                        value={profile.bio}
                                                        onChange={(e) => updateProfileField("bio", e.target.value)}
                                                    />
                                                </div>
                                                <Button onClick={handleSaveProfile} disabled={isSaving} className="mt-4">
                                                    {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                                                    {isSaving ? "Saving..." : "Save Profile"}
                                                </Button>
                                            </CardContent>
                                        </Card>
                                    </TabsContent>

                                    <TabsContent value="account" className="mt-0 space-y-6">
                                        <Card className="border-none shadow-none bg-transparent">
                                            <CardHeader className="px-0 pt-0">
                                                <CardTitle>Account Security</CardTitle>
                                                <CardDescription>Manage your password and security settings.</CardDescription>
                                            </CardHeader>
                                            <CardContent className="space-y-4 px-0 pb-0">
                                                <div className="space-y-2">
                                                    <Label htmlFor="email">Email</Label>
                                                    <Input id="email" value={email} disabled />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label htmlFor="new-password">New Password</Label>
                                                    <Input id="new-password" type="password" />
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
                                                        checked={profile.email_new_connections}
                                                        onChange={(e) => {
                                                            updateProfileField("email_new_connections", e.target.checked)
                                                            handleSaveProfile()
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
                                                        checked={profile.email_messages}
                                                        onChange={(e) => {
                                                            updateProfileField("email_messages", e.target.checked)
                                                            handleSaveProfile()
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
                                                        checked={profile.ai_smart_match_alerts}
                                                        onChange={(e) => {
                                                            updateProfileField("ai_smart_match_alerts", e.target.checked)
                                                            handleSaveProfile()
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
            </DialogContent>
        </Dialog>
    )
}
