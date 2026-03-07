
import * as React from "react"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { UserNavDropdown } from "@/components/shared/user-nav-dropdown"
import { useSidebar } from "@/components/shared/sidebar-context"
import { useSettings } from "@/hooks/use-settings"
import { NotificationsDialog } from "@/components/features/dashboard/notifications-dialog"
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
    Settings
} from "lucide-react"
import { motion } from "framer-motion"
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
    const [notificationsOpen, setNotificationsOpen] = React.useState(false)

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
        <div className={cn("flex h-full flex-col relative bg-background overflow-hidden", className)} {...props}>
            {/* Header Section */}
            <div className={cn("flex shrink-0 transition-all duration-300",
                isCollapsed ? "flex-col items-center gap-4 py-6" : "items-center justify-between h-20 px-5")}>
                <Link href="/" className={cn("flex items-center gap-2.5 font-bold text-xl group overflow-hidden transition-all", isCollapsed ? "w-9" : "flex-1")}>
                    <div className="h-9 w-9 min-w-[2.25rem] flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-primary">
                            <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
                            <path d="M14.5 16.5c-2.5 2-6.5 1-8-2-1.5-3 1-7 4-8" />
                            <path d="M17 10c0 1.5-.5 3-1.5 4" />
                        </svg>
                    </div>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="text-foreground tracking-tight whitespace-nowrap"
                        >
                            Collabryx
                        </motion.span>
                    )}
                </Link>

                {/* Toggle Button - Desktop Only */}
                {!isMobile && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className={cn("text-muted-foreground hover:text-foreground hidden md:flex", isCollapsed ? "h-9 w-9" : "h-7 w-7")}
                        onClick={toggleSidebar}
                        aria-label="Toggle Sidebar"
                    >
                        {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
                    </Button>
                )}
            </div>

            {/* Profile Section (Integrated) */}
            <div className={cn("px-4 transition-all duration-500 ease-in-out shrink-0", isCollapsed ? "py-4" : "py-6")}>
                <div className={cn("flex flex-col rounded-2xl transition-all duration-300",
                    !isCollapsed ? "p-4 border shadow-sm bg-card" : "items-center gap-2 bg-transparent border-0 shadow-none p-0")}>
                    {!isCollapsed ? (
                        <>
                            <div className="flex flex-col items-center">
                                <div className="relative mb-3">
                                    <div className="rounded-full p-1 bg-background ring-2 ring-border/50">
                                        <Avatar className="h-20 w-20">
                                            <AvatarImage src="/avatars/01.png" alt="@sophie" />
                                            <AvatarFallback>SC</AvatarFallback>
                                        </Avatar>
                                    </div>
                                    <div className="absolute bottom-1 right-1 h-5 w-5 bg-green-500 rounded-full border-[3px] border-background shadow-sm" />
                                </div>
                                <div className="text-center w-full">
                                    <h3 className="font-bold text-lg text-foreground tracking-tight truncate">Sophie Chen</h3>
                                    <p className="text-xs text-muted-foreground font-medium mt-0.5 flex items-center justify-center gap-1.5 truncate">
                                        <Briefcase className="h-3 w-3 shrink-0" />
                                        Frontend Architect
                                    </p>
                                </div>
                            </div>

                            <div className="h-2" />
                        </>
                    ) : (
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="relative cursor-pointer group">
                                        <Avatar className="h-10 w-10 ring-2 ring-primary/10 shadow-sm group-hover:ring-primary/30 transition-all">
                                            <AvatarImage src="/avatars/01.png" alt="@sophie" />
                                            <AvatarFallback>SC</AvatarFallback>
                                        </Avatar>
                                        <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-background shadow-none" />
                                    </div>
                                </TooltipTrigger>
                                {isCollapsed && showTooltips && (
                                    <TooltipContent side="right" className="font-medium">
                                        <p>Sophie Chen</p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 min-h-0 overflow-hidden w-full">
                <ScrollArea className="h-full w-full px-3 py-2 [&_[data-slot=scroll-area-scrollbar]]:hidden">
                    <div className="flex flex-col gap-1">
                        <TooltipProvider delayDuration={0}>
                            {navigationSections.map((section) => (
                                <div key={section.label} className="mb-4">
                                    {/* Section Label - Only show when expanded */}
                                    {!isCollapsed && (
                                        <div className="px-3 mb-2">
                                            <span className="text-xs md:text-[10px] font-extrabold tracking-widest text-foreground/80 uppercase">
                                                {section.label}
                                            </span>
                                        </div>
                                    )}

                                    {/* Section Items */}
                                    <div className="flex flex-col gap-1">
                                        {section.items.map((item: any) => {
                                            const isActive = pathname === item.href
                                            return (
                                                <Tooltip key={item.href}>
                                                    <TooltipTrigger asChild>
                                                        <Link
                                                            href={item.href}
                                                            className={cn(
                                                                "relative flex items-center rounded-xl px-3.5 py-3 text-sm transition-all duration-200 group overflow-hidden",
                                                                isActive
                                                                    ? "bg-primary/15 text-primary font-semibold"
                                                                    : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground hover:translate-x-1",
                                                                isCollapsed ? "justify-center px-2 hover:translate-x-0" : "justify-start"
                                                            )}
                                                        >
                                                            {/* Add left border accent when active */}
                                                            {isActive && !isCollapsed && (
                                                                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1/2 w-1 bg-primary rounded-r-full" />
                                                            )}
                                                            <item.icon className={cn("h-[1.15rem] w-[1.15rem] transition-colors relative z-10",
                                                                isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground",
                                                                !isCollapsed && "mr-3"
                                                            )} />
                                                            {!isCollapsed && (
                                                                <div className="flex items-center w-full">
                                                                    <span className="tracking-wide relative z-10">{item.title}</span>
                                                                    {item.badge && item.badge > 0 && (
                                                                        <span className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-xs md:text-[10px] font-bold text-destructive-foreground animate-none">
                                                                            {item.badge}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
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
            <div className="p-4 mt-auto shrink-0">
                {!isCollapsed ? (
                    <div className="flex items-center justify-between gap-1 p-1.5 bg-card rounded-xl border shadow-sm">
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-11 w-11 md:h-9 md:w-9 hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={() => setNotificationsOpen(true)}
                                    >
                                        <Bell className="h-4.5 w-4.5" />
                                        <span className="sr-only">Notifications</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Notifications</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => openSettings('profile')} variant="ghost" size="icon" className="h-11 w-11 md:h-9 md:w-9 hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                                        <Settings className="h-4.5 w-4.5" />
                                        <span className="sr-only">Settings</span>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Settings</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <div className="h-5 w-px bg-border/40 mx-1" />

                        <div className="flex justify-center flex-1 ml-2">
                            <AnimatedThemeToggler variant="slider" />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 items-center">
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-11 w-11 md:h-9 md:w-9 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground"
                                        onClick={() => setNotificationsOpen(true)}
                                    >
                                        <Bell className="h-5 w-5" />
                                        <span className="sr-only">Notifications</span>
                                    </Button>
                                </TooltipTrigger>
                                {showTooltips && <TooltipContent side="right">Notifications</TooltipContent>}
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={() => openSettings('profile')} variant="ghost" size="icon" className="h-11 w-11 md:h-9 md:w-9 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground">
                                        <Settings className="h-5 w-5" />
                                        <span className="sr-only">Settings</span>
                                    </Button>
                                </TooltipTrigger>
                                {showTooltips && <TooltipContent side="right">Settings</TooltipContent>}
                            </Tooltip>
                        </TooltipProvider>

                        <AnimatedThemeToggler className="h-11 w-11 md:h-9 md:w-9 hover:bg-muted rounded-xl" />
                    </div>
                )}
            </div>

            {/* Notifications Dialog */}
            <NotificationsDialog open={notificationsOpen} onOpenChange={setNotificationsOpen} />
        </div>
    )
}
