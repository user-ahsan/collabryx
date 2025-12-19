"use client"

import { SidebarProvider, useSidebar } from "@/components/shared/sidebar-context"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import { MobileNav } from "@/components/shared/mobile-nav"
import { cn } from "@/lib/utils"

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar()
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
        </div>
    )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AuthLayoutContent>{children}</AuthLayoutContent>
        </SidebarProvider>
    )
}
