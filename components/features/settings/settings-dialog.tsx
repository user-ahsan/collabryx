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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { User, Shield, Bell, CreditCard, Loader2, Code2, Briefcase, Lock } from "lucide-react"
import { ProfileSettingsTab } from "./profile-settings-tab"
import { SkillsInterestsSettingsTab } from "./skills-settings-tab"
import { ExperienceProjectsSettingsTab } from "./experience-projects-settings-tab"
import { NotificationPreferencesForm } from "./notification-preferences-form"
import { PrivacySettingsForm } from "./privacy-settings-form"
import { BlockedUsersList } from "./blocked-users-list"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"

export function SettingsDialog() {
    const { isOpen, setIsOpen, activeTab, setActiveTab } = useSettings()

    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // User data state
    const [userId, setUserId] = useState<string | null>(null)
    const [email, setEmail] = useState("")

    type SettingsTab = 'profile' | 'skills' | 'experience' | 'account' | 'notifications' | 'privacy' | 'billing'

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
                    setIsLoading(false)
                    return
                }

                const { data: { user }, error: authError } = await supabase.auth.getUser()

                if (authError) throw authError
                if (!user) throw new Error("Not authenticated")

                setUserId(user.id)
                setEmail(user.email || "")
            } catch (error) {
                console.error("Error fetching settings:", error)
                setError("Failed to load settings. Showing local defaults.")
            } finally {
                setIsLoading(false)
            }
        }

        fetchUserData()
    }, [isOpen, supabase])

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent 
                className={cn(
                    "max-w-[95vw] md:max-w-5xl p-0 h-[85vh] overflow-hidden sm:rounded-2xl",
                    glass("overlay"),
                    glass("dialogHighlights")
                )}
                showDecorations={false}
            >
                <div className="relative z-20 flex flex-col h-full w-full">
                    <DialogTitle className="sr-only">Account Settings</DialogTitle>
                    <DialogDescription className="sr-only">
                        Manage your profile, account preferences, notifications, and billing details.
                    </DialogDescription>
                    <DialogHeader className="px-4 md:px-6 py-4 border-b border-blue-400/10 shrink-0">
                        <DialogTitle className="text-xl md:text-2xl font-bold">Settings</DialogTitle>
                        <DialogDescription className="text-sm">
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
                            onValueChange={(val) => setActiveTab(val as SettingsTab)}
                            className="flex flex-col md:flex-row w-full"
                        >
                            {/* Sidebar inside Dialog - Desktop: Vertical, Mobile: Horizontal Scroll */}
                            <div className="md:w-60 shrink-0 md:border-r md:border-white/10 overflow-x-auto md:overflow-y-auto">
                                <TabsList className="flex md:flex-col h-auto w-full items-stretch justify-start p-2 md:p-4 gap-2 bg-transparent min-h-[44px]">
                                    <TabsTrigger value="profile" className={cn(
                                        "justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap",
                                        glass("tabActive"),
                                        glass("tabInactive")
                                    )}>
                                        <User className="h-4 w-4 shrink-0" />
                                        <span className="hidden md:inline">Profile</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="skills" className={cn(
                                        "justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap",
                                        glass("tabActive"),
                                        glass("tabInactive")
                                    )}>
                                        <Code2 className="h-4 w-4 shrink-0" />
                                        <span className="hidden md:inline">Skills & Interests</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="experience" className={cn(
                                        "justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap",
                                        glass("tabActive"),
                                        glass("tabInactive")
                                    )}>
                                        <Briefcase className="h-4 w-4 shrink-0" />
                                        <span className="hidden md:inline">Experience & Projects</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="account" className={cn(
                                        "justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap",
                                        glass("tabActive"),
                                        glass("tabInactive")
                                    )}>
                                        <Shield className="h-4 w-4 shrink-0" />
                                        <span className="hidden md:inline">Account</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="notifications" className={cn(
                                        "justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap",
                                        glass("tabActive"),
                                        glass("tabInactive")
                                    )}>
                                        <Bell className="h-4 w-4 shrink-0" />
                                        <span className="hidden md:inline">Notifications</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="privacy" className={cn(
                                        "justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap",
                                        glass("tabActive"),
                                        glass("tabInactive")
                                    )}>
                                        <Lock className="h-4 w-4 shrink-0" />
                                        <span className="hidden md:inline">Privacy</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="billing" className={cn(
                                        "justify-start gap-2 px-3 py-2 min-h-[44px] transition-all text-sm font-medium rounded-lg whitespace-nowrap",
                                        glass("tabActive"),
                                        glass("tabInactive")
                                    )}>
                                        <CreditCard className="h-4 w-4 shrink-0" />
                                        <span className="hidden md:inline">Billing</span>
                                    </TabsTrigger>
                                </TabsList>
                            </div>

                            {/* Content Area */}
                            <div className="flex-1 overflow-y-auto p-4 md:p-6 pb-24 md:pb-6">
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
                                                         <Input id="email" value={email} disabled className={cn("opacity-70 cursor-not-allowed", glass("input"))} />
                                                     </div>
                                                     <div className="space-y-2">
                                                         <Label htmlFor="new-password">New Password</Label>
                                                         <Input id="new-password" type="password" className={cn("focus:border-primary/50", glass("input"))} />
                                                     </div>
                                                     <Button className={cn("mt-2", glass("buttonPrimary"), glass("buttonPrimaryGlow"))}>Change Password</Button>
                                                </CardContent>
                                            </Card>
                                             <Separator className={glass("divider")} />
                                             <Card className="border-none shadow-none bg-transparent">
                                                 <CardHeader className="px-0 pt-4">
                                                     <CardTitle className="text-red-500 font-semibold">Danger Zone</CardTitle>
                                                 </CardHeader>
                                                 <CardContent className="px-0 pb-0">
                                                     <Button variant="destructive" className={glass("buttonSecondaryGlow")}>Delete Account</Button>
                                                 </CardContent>
                                             </Card>
                                        </TabsContent>

                                        <TabsContent value="notifications" className="mt-0">
                                            {userId ? <NotificationPreferencesForm userId={userId} /> : null}
                                        </TabsContent>

                                        <TabsContent value="privacy" className="mt-0 space-y-6">
                                            {userId ? <PrivacySettingsForm userId={userId} /> : null}
                                            {userId ? <BlockedUsersList userId={userId} /> : null}
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
