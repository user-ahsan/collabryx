"use client"

import { SidebarProvider, useSidebar } from "@/components/shared/sidebar-context"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import { MobileNav } from "@/components/shared/mobile-nav"
import { cn } from "@/lib/utils"

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed, toggleSidebar } = useSidebar()

    return (
        <div className="min-h-screen bg-background relative">
            {/* Mobile Topbar */}
            <MobileNav />

            <div className="flex">
                {/* Desktop Sidebar - Fixed & Overlay */}
                <aside
                    className={cn(
                        "hidden md:block fixed inset-y-0 z-50 transition-all duration-300 ease-in-out border-r bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 overflow-visible shadow-xl",
                        isCollapsed ? "w-20" : "w-64"
                    )}
                >
                    <SidebarNav />
                </aside>

                {/* Backdrop Overlay (Desktop Only) */}
                {!isCollapsed && (
                    <div
                        className="hidden md:block fixed inset-0 z-40 bg-background/80 transition-all duration-300 animate-in fade-in"
                        onClick={toggleSidebar}
                        aria-hidden="true"
                    />
                )}

                {/* Main Content Area */}
                <main
                    className="flex-1 min-h-[calc(100vh-65px)] md:min-h-screen transition-all duration-300 ease-in-out md:pl-20"
                >
                    {children}
                </main>
            </div>
        </div>
    )
}

export function DashboardShell({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <DashboardContent>{children}</DashboardContent>
        </SidebarProvider>
    )
}
