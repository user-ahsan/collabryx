
import * as React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { useSidebar } from "@/components/shared/sidebar-context"
import { useSettings } from "@/hooks/use-settings"
import { NotificationsWidget } from "@/components/features/dashboard/notifications-widget"
import {
    LayoutDashboard,
    Sparkles,
    MessageSquare,
    Bot,
    UserCircle,
    Menu,
    X,
    TrendingUp,
    Briefcase,
    Bell,
    Settings,
    LucideIcon
} from "lucide-react"
import { AnimatedThemeToggler } from "@/components/ui/animated-theme-toggler"

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> {
    isMobile?: boolean
}

export function SidebarNav({ className, isMobile, ...props }: SidebarNavProps) {
    const pathname = usePathname()
    // If usage is mobile, we don't need the context toggler, we just want it expanded.
    // However, hooks cannot be conditional. We must call useSidebar always or handle it gracefully.
    // We'll call it, but ignore isCollapsed if isMobile is true.
    // We'll call it, but ignore isCollapsed if isMobile is true.
    const sidebarContext = useSidebar()
    const isCollapsed = isMobile ? false : sidebarContext.isCollapsed
    const toggleSidebar = sidebarContext.toggleSidebar

    const { openSettings } = useSettings()

    const [showTooltips, setShowTooltips] = React.useState(false)

    React.useEffect(() => {
        if (isCollapsed) {
            const timer = setTimeout(() => {
                setShowTooltips(true)
            }, 500) // Match transition duration + buffer
            return () => clearTimeout(timer)
        } else {
            setShowTooltips(false)
        }
    }, [isCollapsed])

    // Intent-driven navigation structure
    const navigationSections = [
        {
            label: "MAIN",
            items: [
                {
                    title: "Dashboard",
                    href: "/dashboard",
                    icon: LayoutDashboard,
                },
                {
                    title: "Smart Matches",
                    href: "/matches",
                    icon: Sparkles,
                    badge: 8, // AI-powered match count
                },
            ]
        },
        {
            label: "COLLABORATION",
            items: [
                {
                    title: "Messages",
                    href: "/messages",
                    icon: MessageSquare,
                },
                {
                    title: "Requests",
                    href: "/requests",
                    icon: TrendingUp,
                    badge: 2,
                },
            ]
        },
        {
            label: "AI TOOLS",
            items: [
                {
                    title: "AI Mentor",
                    href: "/assistant",
                    icon: Bot,
                },
            ]
        },
        {
            label: "ACCOUNT",
            items: [
                {
                    title: "My Profile",
                    href: "/my-profile",
                    icon: UserCircle,
                },
            ]
        }
    ]

    return (
        <div id="sidebar-nav" className={cn("flex h-full flex-col relative bg-background overflow-hidden", className)} {...props}>
            {/* Header Section */}
            <div className={cn("flex shrink-0 transition-all duration-300",
                isCollapsed ? "flex-col items-center gap-4 py-6" : "items-center justify-between h-20 px-5")}>
                <Link href="/" className={cn("flex items-center font-bold text-xl group overflow-hidden transition-all duration-300", isCollapsed ? "justify-center w-full" : "flex-1 px-1")}>
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

                {/* Toggle Button - Desktop Only */}
                {!isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("text-muted-foreground hover:text-foreground hidden md:flex", isCollapsed ? "h-9 w-9" : "h-7 w-7")}
                        onClick={toggleSidebar}
                        aria-expanded={!isCollapsed}
                        aria-controls="sidebar-nav"
                        aria-label={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
                    >
                        <div className="relative h-4 w-4">
                            <Menu className={cn("absolute inset-0 transition-all duration-300", isCollapsed ? "scale-100 opacity-100 rotate-0" : "scale-0 opacity-0 -rotate-90")} />
                            <X className={cn("absolute inset-0 transition-all duration-300", isCollapsed ? "scale-0 opacity-0 rotate-90" : "scale-100 opacity-100 rotate-0")} />
                        </div>
                    </Button>
                )}
            </div>

            {/* Profile Section */}
            <div className={cn("px-4 transition-all duration-500 ease-in-out shrink-0", isCollapsed ? "py-4" : "py-6")}>
                <TooltipProvider delayDuration={0}>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className={cn("flex rounded-2xl transition-all duration-300 overflow-hidden relative cursor-pointer group",
                                !isCollapsed ? "flex-col p-4 border shadow-sm bg-card" : "items-center justify-center gap-2 bg-transparent border-0 shadow-none p-0")}>

                                <div className={cn("flex items-center transition-all duration-300", !isCollapsed ? "flex-col" : "")}>
                                    <div className={cn("relative transition-all duration-300", isCollapsed ? "mb-0" : "mb-3")}>
                                        <div className={cn("rounded-full bg-background transition-all duration-300", !isCollapsed ? "ring-2 ring-border/50 p-1" : "ring-2 ring-primary/10 shadow-sm group-hover:ring-primary/30")}>
                                            <Avatar className={cn("transition-all duration-300", !isCollapsed ? "h-20 w-20" : "h-10 w-10")}>
                                                <AvatarImage src="/avatars/01.png" alt="@sophie" />
                                                <AvatarFallback>SC</AvatarFallback>
                                            </Avatar>
                                        </div>
                                        <div className={cn("absolute bg-green-500 rounded-full shadow-sm transition-all duration-300",
                                            !isCollapsed
                                                ? "bottom-1 right-1 h-5 w-5 border-[3px] border-background"
                                                : "bottom-0 right-0 h-3 w-3 border-2 border-background shadow-none")} />
                                    </div>

                                    <div className={cn("text-center transition-all duration-300 whitespace-nowrap overflow-hidden",
                                        isCollapsed ? "max-w-0 max-h-0 opacity-0" : "max-w-[200px] max-h-[50px] opacity-100 delay-[50ms]")}>
                                        <h3 className="font-bold text-lg text-foreground tracking-tight truncate">Sophie Chen</h3>
                                        <p className="text-xs text-muted-foreground font-medium mt-0.5 flex items-center justify-center gap-1.5 truncate">
                                            <Briefcase className="h-3 w-3 shrink-0" />
                                            Frontend Architect
                                        </p>
                                    </div>
                                </div>
                                <div className={cn("transition-all duration-300", isCollapsed ? "h-0" : "h-2 w-full")} />
                            </div>
                        </TooltipTrigger>
                        {isCollapsed && showTooltips && (
                            <TooltipContent side="right" className="font-medium">
                                <p>Sophie Chen</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
                </TooltipProvider>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 min-h-0 overflow-hidden w-full">
                <ScrollArea className="h-full w-full px-3 py-2 [&_[data-slot=scroll-area-scrollbar]]:hidden">
                    <div className="flex flex-col gap-1">
                        <TooltipProvider delayDuration={0}>
                            {navigationSections.map((section) => (
                                <div key={section.label} className="mb-4">
                                    {/* Section Label - Fades seamlessly */}
                                    <div className={cn("transition-all duration-300 ease-out delay-[50ms] overflow-hidden whitespace-nowrap", isCollapsed ? "max-h-0 max-w-0 opacity-0 mb-0 px-0" : "max-h-[20px] max-w-[200px] opacity-100 mb-2 px-3")}>
                                        <span className="text-xs md:text-[10px] font-extrabold tracking-widest text-foreground/80 uppercase">
                                            {section.label}
                                        </span>
                                    </div>

                                    {/* Section Items */}
                                    <div className="flex flex-col gap-1">
                                        {section.items.map((item: { title: string; href: string; icon: LucideIcon; badge?: number }) => {
                                            const isActive = pathname === item.href
                                            return (
                                                <Tooltip key={item.href}>
                                                    <TooltipTrigger asChild>
                                                        <Link
                                                            href={item.href}
                                                            className={cn(
                                                                "relative flex items-center rounded-xl py-3 text-sm transition-all duration-200 group overflow-hidden cursor-pointer",
                                                                isActive
                                                                    ? "bg-primary/15 text-primary font-semibold"
                                                                    : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                                                                isCollapsed ? "justify-center px-4" : "justify-start px-3.5 hover:translate-x-1"
                                                            )}
                                                        >
                                                            {/* Add left border accent when active */}
                                                            {isActive && !isCollapsed && (
                                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-primary rounded-r-full transition-all duration-300" />
                                                            )}
                                                            <item.icon className={cn("h-[1.15rem] w-[1.15rem] shrink-0 transition-colors relative z-10",
                                                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                                                            )} />
                                                            <div className={cn("flex items-center overflow-hidden transition-all duration-300 ease-out whitespace-nowrap",
                                                                isCollapsed ? "max-w-0 opacity-0" : "max-w-[200px] opacity-100 delay-[50ms] flex-1 ml-3")}>
                                                                <span className="tracking-wide relative z-10">{item.title}</span>
                                                                {item.badge && item.badge > 0 && (
                                                                    <span className="ml-auto flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive text-xs md:text-[10px] font-bold text-destructive-foreground animate-none">
                                                                        {item.badge}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </Link>
                                                    </TooltipTrigger>
                                                    {isCollapsed && showTooltips && (
                                                        <TooltipContent side="right" className="font-medium" sideOffset={10}>
                                                            {item.title}
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </TooltipProvider>
                    </div>
                </ScrollArea>
            </div>

            {/* Footer Actions - Redesigned */}
            <div className="p-3 mt-auto shrink-0 relative z-[60]">
                {!isCollapsed ? (
                    <div className="flex flex-col gap-2 p-2 bg-card rounded-xl border shadow-sm">
                        <TooltipProvider delayDuration={0}>
                            <div className="flex items-center gap-1 relative">
                                <div className="relative z-[60]">
                                    <NotificationsWidget>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Bell className="h-4 w-4" />
                                            <span className="sr-only">Notifications</span>
                                        </Button>
                                    </NotificationsWidget>
                                </div>

                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button onClick={() => openSettings('profile')} variant="ghost" size="icon" className="h-10 w-10 hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                                            <Settings className="h-4 w-4" />
                                            <span className="sr-only">Settings</span>
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Settings</TooltipContent>
                                </Tooltip>
                            </div>
                        </TooltipProvider>

                        <div className="h-px w-full bg-border/40 my-1" />

                        <div className="flex justify-center">
                            <AnimatedThemeToggler variant="slider" />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-2 items-center">
                        <TooltipProvider delayDuration={0}>
                            <div className="relative z-[60]">
                                <NotificationsWidget>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-10 w-10 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground"
                                    >
                                        <Bell className="h-4 w-4" />
                                        <span className="sr-only">Notifications</span>
                                    </Button>
                                </NotificationsWidget>
                            </div>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => openSettings('profile')} variant="ghost" size="icon" className="h-10 w-10 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground">
                                        <Settings className="h-4 w-4" />
                                        <span className="sr-only">Settings</span>
                                    </Button>
                                </TooltipTrigger>
                                {showTooltips && <TooltipContent side="right">Settings</TooltipContent>}
                            </Tooltip>
                        </TooltipProvider>

                        <div className="h-px w-8 bg-border/40" />

                        <AnimatedThemeToggler className="h-10 w-10 hover:bg-muted rounded-xl" />
                    </div>
                )}
            </div>

            {/* Notifications Widget replaced Dialog */}
        </div>
    )
}
