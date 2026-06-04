"use client"

import { SidebarProvider, useSidebar } from "@/components/shared/sidebar-context"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import { MobileNav } from "@/components/shared/mobile-nav"
import { GlobalSearchDialog } from "@/components/features/search/global-search-dialog"
import { SettingsDialog } from "@/components/features/settings/settings-dialog"
import { SessionHeartbeat } from "@/components/features/analytics/session-heartbeat"
import { cn } from "@/lib/utils"
import { useLoginData } from "@/hooks/use-login-data"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState, useEffect, useCallback } from "react"

// NOTE: Auth protection is handled by proxy.ts (middleware).
// Do NOT duplicate auth checks here — layout checks do not re-run
// on navigation due to Partial Rendering (Next.js 16 behavior).
// See: https://nextjs.org/docs/app/building-your-application/authentication

// Query client factory - creates fresh instance per request
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  })
}

// Store query client instance
let browserQueryClient: QueryClient | undefined = undefined

// Get or create query client instance (singleton in browser)
function getQueryClient() {
  if (typeof window === 'undefined') {
    // Server: always create new instance
    return makeQueryClient()
  } else {
    // Browser: use singleton to prevent data loss
    if (!browserQueryClient) {
      browserQueryClient = makeQueryClient()
    }
    return browserQueryClient
  }
}

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar()
    const { isReady } = useLoginData()
    const [searchOpen, setSearchOpen] = useState(false)

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "k") {
            e.preventDefault()
            setSearchOpen(true)
        }
    }, [])

    useEffect(() => {
        document.addEventListener("keydown", handleKeyDown)
        return () => document.removeEventListener("keydown", handleKeyDown)
    }, [handleKeyDown])

    return (
        <>
            <div className={cn(
                "min-h-screen bg-background flex flex-col md:flex-row",
                !isReady && "opacity-50 pointer-events-none"
            )}>
                {/* Loading overlay */}
                {!isReady && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading your dashboard...</p>
                        </div>
                    </div>
                )}

                {/* Mobile Navigation */}
                <MobileNav />

                {/* Desktop Sidebar */}
                <aside className={cn(
                    "hidden md:flex flex-col fixed inset-y-0 left-0 z-50 transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-[80px]" : "w-[280px]"
                )}>
                    <SidebarNav />
                </aside>

                {/* Main Content */}
                <main className={cn(
                    "flex-1 flex flex-col transition-all duration-300 ease-in-out pt-0 md:pt-0 min-h-screen pb-6 md:pb-0",
                    isCollapsed ? "md:ml-[80px]" : "md:ml-[280px]"
                )}>
                    {children}
                </main>
            </div>
            <SessionHeartbeat />
            <SettingsDialog />
            <GlobalSearchDialog open={searchOpen} onOpenChange={setSearchOpen} />
        </>
    )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    const queryClient = getQueryClient()
    
    return (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider>
                <AuthLayoutContent>{children}</AuthLayoutContent>
            </SidebarProvider>
        </QueryClientProvider>
    )
}
