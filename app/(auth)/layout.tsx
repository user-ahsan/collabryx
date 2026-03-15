import { SidebarProvider, useSidebar } from "@/components/shared/sidebar-context"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import { MobileNav } from "@/components/shared/mobile-nav"
import { SettingsDialog } from "@/components/features/settings/settings-dialog"
import { cn } from "@/lib/utils"
import { useLoginData } from "@/hooks/use-login-data"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

// Create query client once
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

async function checkAuth() {
  const supabase = await createClient()
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  return session
}

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar()
    const { isReady, isLoading, error } = useLoginData()

    useEffect(() => {
        if (isReady) {
            console.log('✅ Login data loaded:', {
                posts: '✓',
                matches: '✓',
                profile: '✓',
                notifications: '✓',
            })
        }
    }, [isReady])

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

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
    await checkAuth()
    
    return (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider>
                <AuthLayoutContent>{children}</AuthLayoutContent>
            </SidebarProvider>
        </QueryClientProvider>
    )
}
