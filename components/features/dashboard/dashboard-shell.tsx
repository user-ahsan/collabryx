"use client"

import { SidebarProvider, useSidebar } from "@/components/shared/sidebar-context"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import { MobileNav } from "@/components/shared/mobile-nav"

function DashboardContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar()

    return (
        <div className="min-h-screen bg-background relative flex flex-col md:grid dashboard-grid"
            style={{
                gridTemplateColumns: isCollapsed ? "80px 1fr" : "256px 1fr",
                transitionProperty: "grid-template-columns",
                transitionDuration: "250ms",
                transitionTimingFunction: "cubic-bezier(0.4, 0, 0.2, 1)"
            }}>

            {/* Mobile Topbar */}
            <div className="md:hidden">
                <MobileNav />
            </div>

            {/* Desktop Sidebar - Push */}
            <aside className="hidden md:block border-r bg-background overflow-hidden z-10 sticky top-0 h-screen">
                <SidebarNav />
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 min-h-[calc(100vh-65px)] md:min-h-screen">
                {children}
            </main>
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
