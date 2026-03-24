"use client"

import { SidebarProvider, useSidebar } from "@/components/shared/sidebar-context"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import { MobileNav } from "@/components/shared/mobile-nav"
import { SettingsDialog } from "@/components/features/settings/settings-dialog"
import { cn } from "@/lib/utils"
import { useLoginData } from "@/hooks/use-login-data"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

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
    const router = useRouter()
    const [isChecking, setIsChecking] = useState(true)
    const queryClient = getQueryClient()

    useEffect(() => {
        async function checkAuth() {
            try {
                const supabase = createClient()
                const { data: { session } } = await supabase.auth.getSession()
                
                if (!session) {
                    // Clear cache before redirecting to prevent data leakage
                    queryClient.clear()
                    router.push('/login')
                    return
                }
                
                setIsChecking(false)
            } catch {
                console.error('Auth check failed:', error)
                // On error, clear cache and redirect to login
                queryClient.clear()
                router.push('/login')
            }
        }
        
        checkAuth()
    }, [router, queryClient])



    if (isChecking) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-muted-foreground">Checking authentication...</p>
                </div>
            </div>
        )
    }

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
            <SettingsDialog />
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
