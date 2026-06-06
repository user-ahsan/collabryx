"use client";

import * as React from "react"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useSidebar } from "@/components/shared/sidebar-context"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"
import { useConnectionRequests } from "@/hooks/use-connections"
import { GlobalSearch } from "@/components/features/search/global-search"
import {
    LayoutDashboard,
    Sparkles,
    MessageSquare,
    Bot,
    UserCircle,
    Menu,
    X,
    TrendingUp,
    Bell,
    Settings,
    BarChart3,
    Bookmark,
    HelpCircle,
    MoreVertical,
    LogOut,
    LucideIcon,
} from "lucide-react"
import { useUser } from "@/hooks/use-profile"
import { createClient } from "@/lib/supabase/client"

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
    isMobile?: boolean
}

interface NavItem {
    title: string
    href: string
    icon: LucideIcon
    badge?: number
}

export function SidebarNav({ className, isMobile, ...props }: SidebarNavProps) {
    const pathname = usePathname()
    const router = useRouter()
    const supabase = createClient()
    const { user, profile } = useUser()
    const sidebarContext = useSidebar()
    const isCollapsed = isMobile ? false : sidebarContext.isCollapsed
    const toggleSidebar = sidebarContext.toggleSidebar

    const { receivedRequests } = useConnectionRequests()
    const requestCount = receivedRequests.length

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push('/login')
    }

    // Active route matching — handles nested routes like /messages/123, /settings/billing
    const isActive = (href: string) => {
        if (pathname === href) return true
        if (href !== '/' && pathname.startsWith(href + '/')) return true
        return false
    }

    // Primary navigation — core daily workflow (no section label)
    const primaryItems: NavItem[] = [
        { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
        { title: "Messages", href: "/messages", icon: MessageSquare },
        { title: "Smart Matches", href: "/matches", icon: Sparkles },
        { title: "Notifications", href: "/notifications", icon: Bell },
        { title: "AI Mentor", href: "/assistant", icon: Bot },
    ]

    // Secondary navigation — utilities & account (no section label, just a divider)
    const secondaryItems: NavItem[] = [
        { title: "Requests", href: "/requests", icon: TrendingUp, badge: requestCount },
        { title: "Analytics", href: "/analytics", icon: BarChart3 },
        { title: "My Profile", href: "/my-profile", icon: UserCircle },
        { title: "Bookmarks", href: "/bookmarks", icon: Bookmark },
        { title: "Settings", href: "/settings", icon: Settings },
        { title: "Help", href: "/help", icon: HelpCircle },
    ]

    function NavLink({ item }: { item: NavItem }) {
        const active = isActive(item.href)
        return (
            <Link
                href={item.href}
                className={cn(
                    "relative flex items-center rounded-xl py-2.5 text-sm transition-all duration-200 group cursor-pointer",
                    active
                        ? "bg-primary/15 text-primary font-semibold shadow-[0_0_16px_rgba(99,102,241,0.12)]"
                        : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                    isCollapsed ? "justify-center px-4" : "justify-start px-3.5"
                )}
                aria-current={active ? "page" : undefined}
            >
                {active && !isCollapsed && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-primary rounded-r-full transition-all duration-300" />
                )}
                <item.icon
                    className={cn(
                        "h-[1.15rem] w-[1.15rem] shrink-0 transition-colors relative z-10",
                        active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                />
                <div
                    className={cn(
                        "flex items-center overflow-hidden transition-all duration-300 ease-out whitespace-nowrap",
                        isCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100 delay-[50ms] flex-1 ml-3"
                    )}
                >
                    <span className="tracking-wide relative z-10">{item.title}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                        <span
                            className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground px-1"
                            aria-label={`${item.badge} pending ${item.title.toLowerCase()}`}
                        >
                            {item.badge}
                        </span>
                    )}
                </div>
            </Link>
        )
    }

    return (
        <nav
            id="sidebar-nav"
            data-testid="sidebar-nav"
            data-ismobile={String(!!isMobile)}
            className={cn(
                "flex h-full flex-col relative bg-background shadow-[4px_0_32px_rgba(99,102,241,0.04)]",
                className
            )}
            aria-label="Main navigation"
            {...props}
        >
            {/* ── Header: Logo + Toggle ── */}
            <div
                className={cn(
                    "flex shrink-0 transition-all duration-300",
                    isCollapsed ? "flex-col items-center gap-4 py-5" : "items-center justify-between h-16 px-5"
                )}
            >
                <Link
                    href="/"
                    className={cn(
                        "flex items-center font-bold text-xl group overflow-hidden transition-all duration-300",
                        isCollapsed ? "justify-center w-full" : "flex-1 px-1"
                    )}
                >
                    <div className="h-9 w-9 shrink-0 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            <path d="M14.5 16.5c-2.5 2-6.5 1-8-2-1.5-3 1-7 4-8" />
                            <path d="M17 10c0 1.5-.5 3-1.5 4" />
                        </svg>
                    </div>
                    <div
                        className={cn(
                            "overflow-hidden transition-all duration-300 ease-in-out whitespace-nowrap",
                            isCollapsed ? "max-w-0 opacity-0" : "max-w-[150px] opacity-100 delay-[50ms] ml-2"
                        )}
                    >
                        <span className="text-foreground tracking-tight">Collabryx</span>
                    </div>
                </Link>

                {/* Toggle Button — Desktop Only */}
                {!isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                            "text-muted-foreground hover:text-foreground hidden md:flex",
                            isCollapsed ? "h-9 w-9" : "h-7 w-7"
                        )}
                        onClick={toggleSidebar}
                        aria-expanded={!isCollapsed}
                        aria-controls="sidebar-nav"
                        aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
                    >
                        <div className="relative h-4 w-4">
                            <Menu className={cn("absolute inset-0 transition-all duration-300", isCollapsed ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 -rotate-90")} />
                            <X className={cn("absolute inset-0 transition-all duration-300", isCollapsed ? "scale-0 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0")} />
                        </div>
                    </Button>
                )}
            </div>

            {/* ── Universal Search ── */}
            <div className={cn(
                "shrink-0 transition-all duration-300",
                isCollapsed ? "px-3 pt-0 pb-1.5" : "px-3 pb-1"
            )}>
                <GlobalSearch
                    isCollapsed={isCollapsed}
                    onExpand={toggleSidebar}
                />
            </div>

            {/* Divider below search */}
            <div className={cn(
                "mx-3 h-px bg-border/40",
                isCollapsed ? "mb-0" : "mb-1"
            )} role="separator" aria-orientation="horizontal" />

            {/* ── Navigation Items — Flat list with divider ── */}
            <ScrollArea className="flex-1 w-full px-3" type="auto">
                <div className="flex flex-col py-2">
                    {/* Primary group */}
                    <ul role="list" className="flex flex-col gap-0.5" aria-label="Primary">
                        {primaryItems.map((item) => (
                            <li key={item.href} role="listitem">
                                <NavLink item={item} />
                            </li>
                        ))}
                    </ul>

                    {/* Visual divider — no section label */}
                    <div className="my-3 mx-3 h-px bg-border/50" role="separator" aria-orientation="horizontal" />

                    {/* Secondary group */}
                    <ul role="list" className="flex flex-col gap-0.5" aria-label="More">
                        {secondaryItems.map((item) => (
                            <li key={item.href} role="listitem">
                                <NavLink item={item} />
                            </li>
                        ))}
                    </ul>
                </div>
            </ScrollArea>

            {/* ── Compact Profile Footer with three-dot menu ── */}
            <div className={cn("shrink-0 border-t border-border/20 flex flex-col gap-2", isCollapsed ? "p-3" : "p-3")}>
                <div className={cn(
                    "flex items-center rounded-xl transition-all duration-200",
                    isCollapsed ? "justify-center py-2" : "justify-between px-3.5 py-2 hover:bg-muted/30"
                )}>
                    {!isCollapsed && (
                        <span className="text-sm font-medium text-muted-foreground">Theme</span>
                    )}
                    <AnimatedThemeToggler variant={isCollapsed ? "icon" : "slider"} className="shrink-0" />
                </div>

                <div className={cn(
                    "flex items-center rounded-xl transition-colors group",
                    isCollapsed ? "justify-center" : "gap-2"
                )}>
                    <Link
                        href="/my-profile"
                        className={cn(
                            "flex items-center flex-1 rounded-xl hover:bg-muted transition-colors min-w-0",
                            isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
                        )}
                    >
                        <Avatar className="h-9 w-9 shrink-0 ring-1 ring-border/40 group-hover:ring-primary/30 transition-all">
                            <AvatarImage src={profile?.avatar_url || '/avatars/01.png'} alt={profile?.full_name || 'User'} />
                            <AvatarFallback className="text-xs">
                                {profile?.full_name
                                    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                                    : 'U'
                                }
                            </AvatarFallback>
                        </Avatar>
                        {!isCollapsed && (
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                    {profile?.full_name || 'User'}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    {profile?.headline || 'Member'}
                                </p>
                            </div>
                        )}
                    </Link>

                    {/* Three-dot overflow menu */}
                    {!isCollapsed && (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 shrink-0 rounded-lg text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100"
                                    aria-label="Profile options"
                                >
                                    <MoreVertical className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent side="top" align="end" sideOffset={8} className="w-48">
                                <DropdownMenuLabel className="font-normal">
                                    <div className="flex flex-col space-y-0.5">
                                        <p className="text-sm font-medium">
                                            {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {user?.email || ''}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuGroup>
                                    <DropdownMenuItem asChild>
                                        <Link href="/my-profile" className="flex items-center cursor-pointer">
                                            <UserCircle className="mr-2 h-4 w-4" />
                                            <span>View Profile</span>
                                        </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem asChild>
                                        <Link href="/settings" className="flex items-center cursor-pointer">
                                            <Settings className="mr-2 h-4 w-4" />
                                            <span>Settings</span>
                                        </Link>
                                    </DropdownMenuItem>
                                </DropdownMenuGroup>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    <span>Sign out</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    )}
                </div>
            </div>
        </nav>
    )
}
