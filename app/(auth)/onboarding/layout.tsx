"use client"

import { SidebarProvider, useSidebar } from "@/components/shared/sidebar-context"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import { MobileNav } from "@/components/shared/mobile-nav"
import { SettingsDialog } from "@/components/features/settings/settings-dialog"
import { cn } from "@/lib/utils"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

function OnboardingLayoutContent({ children, isNewUser }: { children: React.ReactNode, isNewUser: boolean }) {
    const { isCollapsed } = useSidebar()

    // For new users, show only the onboarding screen without sidebar
    if (isNewUser) {
        return (
            <div className="min-h-screen bg-background">
                {children}
            </div>
        )
    }

    // For returning users, show normal layout with sidebar
    return (
        <div className="min-h-screen bg-background flex flex-col md:flex-row">
            {/* Mobile Navigation */}
            <MobileNav />

            {/* Desktop Sidebar */}
            <aside className={cn(
                "hidden md:flex flex-col fixed inset-y-0 left-0 z-50 border-r bg-background transition-all duration-300 ease-in-out",
                isCollapsed ? "w-[80px]" : "w-[280px]"
            )}>
                <SidebarNav />
            </aside>

            {/* Main Content */}
            <main className={cn(
                "flex-1 transition-all duration-300 ease-in-out pt-0 md:pt-0 min-h-screen pb-6 md:pb-0",
                isCollapsed ? "md:ml-[80px]" : "md:ml-[280px]"
            )}>
                {children}
            </main>
            <SettingsDialog />
        </div>
    )
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
    const [isNewUser, setIsNewUser] = useState<boolean | null>(null)

    useEffect(() => {
        let mounted = true
        
        async function checkOnboardingStatus() {
            try {
                const supabase = await createClient()
                const { data: { user } } = await supabase.auth.getUser()
                
                if (!user) {
                    if (mounted) setIsNewUser(false)
                    return
                }

                const { data: profile } = await supabase
                    .from("profiles")
                    .select("onboarding_completed")
                    .eq("id", user.id)
                    .single()

                // New user if profile doesn't exist or onboarding not completed
                if (mounted) setIsNewUser(!profile || profile.onboarding_completed !== true)
            } catch {
                console.error("Error checking onboarding status:", error)
                if (mounted) setIsNewUser(false)
            }
        }

        checkOnboardingStatus()
        
        return () => {
            mounted = false
        }
    }, [])

    // Show nothing until we determine user status
    if (isNewUser === null) {
        return null
    }

    return (
        <SidebarProvider>
            <OnboardingLayoutContent isNewUser={isNewUser}>
                {children}
            </OnboardingLayoutContent>
        </SidebarProvider>
    )
}
