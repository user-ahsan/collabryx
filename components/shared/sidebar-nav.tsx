
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
import {
    LayoutDashboard,
    Sparkles,
    MessageSquare,
    Bot,
    UserCircle,
    ChevronLeft,
    ChevronRight,
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
    const sidebarContext = useSidebar()
    const isCollapsed = isMobile ? false : sidebarContext.isCollapsed
    const toggleSidebar = sidebarContext.toggleSidebar

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

    const items = [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Smart Matches",
            href: "/matches",
            icon: Sparkles,
        },
        {
            title: "Messages",
            href: "/messages",
            icon: MessageSquare,
        },

        {
            title: "AI Mentor",
            href: "/assistant",
            icon: Bot,
        },
        {
            title: "My Profile",
            href: "/profile/1",
            icon: UserCircle,
        },
    ]

    return (
        <div className={cn("flex h-full flex-col relative bg-gradient-to-b from-background via-background to-muted/20 overflow-hidden", className)} {...props}>
            {/* Toggle Button - Refined */}
            <Button
                variant="ghost"
                size="icon"
                className="hidden md:flex absolute -right-3 top-6 z-50 h-7 w-7 rounded-full bg-background border shadow-sm hover:shadow-md transition-all items-center justify-center p-0 text-muted-foreground hover:text-foreground"
                onClick={toggleSidebar}
                aria-label="Toggle Sidebar"
            >
                {isCollapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
            </Button>

            {/* Logo Section */}
            <div className={cn("flex items-center h-20 px-5 shrink-0 transition-all duration-300", isCollapsed ? "justify-center" : "justify-start")}>
                <Link href="/" className={cn("flex items-center gap-2.5 font-bold text-xl group overflow-hidden transition-all", isCollapsed ? "w-9" : "w-full")}>
                    <div className="h-9 w-9 min-w-[2.25rem] rounded-xl bg-primary shadow-lg shadow-primary/25 grid place-items-center transition-transform group-hover:scale-105 duration-300">
                        <span className="text-lg text-primary-foreground font-extrabold">C</span>
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
            </div>

            {/* Profile Section (Integrated) */}
            <div className={cn("px-4 transition-all duration-500 ease-in-out shrink-0", isCollapsed ? "py-4" : "py-6")}>
                <div className={cn("flex flex-col bg-card/50 rounded-2xl transition-all duration-300",
                    !isCollapsed ? "p-4 border shadow-sm" : "items-center gap-2 bg-transparent border-0 shadow-none p-0")}>
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

                            <Separator className="my-4 bg-border/50" />

                            {/* Compact Stats for Sidebar */}
                            <div className="grid grid-cols-2 divide-x divide-border/50">
                                <div className="text-center px-1 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer py-2">
                                    <span className="block text-lg font-bold text-foreground">1.2k</span>
                                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Views</span>
                                </div>
                                <div className="text-center px-1 hover:bg-muted/50 rounded-lg transition-colors cursor-pointer py-2">
                                    <div className="flex items-center justify-center gap-1">
                                        <span className="block text-lg font-bold text-foreground">567</span>
                                        <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                                    </div>
                                    <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Conns</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Avatar className="h-10 w-10 ring-2 ring-primary/10 shadow-sm cursor-pointer hover:ring-primary/30 transition-all">
                                        <AvatarImage src="/avatars/01.png" alt="@sophie" />
                                        <AvatarFallback>SC</AvatarFallback>
                                    </Avatar>
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
                    <div className="flex flex-col gap-2">
                        <TooltipProvider delayDuration={0}>
                            {items.map((item) => {
                                const isActive = pathname === item.href
                                return (
                                    <Tooltip key={item.href}>
                                        <TooltipTrigger asChild>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    "relative flex items-center rounded-xl px-3.5 py-3 text-sm font-medium transition-all duration-200 group overflow-hidden",
                                                    isActive
                                                        ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                                                        : "text-muted-foreground hover:bg-muted/80 hover:text-foreground hover:translate-x-1",
                                                    isCollapsed ? "justify-center px-2 hover:translate-x-0" : "justify-start"
                                                )}
                                            >
                                                <item.icon className={cn("h-[1.15rem] w-[1.15rem] transition-colors",
                                                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground",
                                                    !isCollapsed && "mr-3"
                                                )} />
                                                {!isCollapsed && (
                                                    <span className="tracking-wide">{item.title}</span>
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
                        </TooltipProvider>
                    </div>
                </ScrollArea>
            </div>

            {/* Footer Actions - Redesigned */}
            <div className="p-4 mt-auto shrink-0">
                {!isCollapsed ? (
                    <div className="flex items-center justify-between gap-1 p-1.5 bg-card/30 rounded-xl border border-border/40 shadow-sm backdrop-blur-sm">
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/notifications">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                                            <Bell className="h-4.5 w-4.5" />
                                            <span className="sr-only">Notifications</span>
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>Notifications</TooltipContent>
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/settings">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted/80 rounded-lg text-muted-foreground hover:text-foreground transition-colors">
                                            <Settings className="h-4.5 w-4.5" />
                                            <span className="sr-only">Settings</span>
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>Settings</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <div className="h-5 w-px bg-border/40 mx-1" />

                        <div className="flex justify-center">
                            <AnimatedThemeToggler className="h-9 w-9 hover:bg-muted/80 rounded-lg" />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-3 items-center">
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/notifications">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground">
                                            <Bell className="h-5 w-5" />
                                            <span className="sr-only">Notifications</span>
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                {showTooltips && <TooltipContent side="right">Notifications</TooltipContent>}
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link href="/settings">
                                        <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground">
                                            <Settings className="h-5 w-5" />
                                            <span className="sr-only">Settings</span>
                                        </Button>
                                    </Link>
                                </TooltipTrigger>
                                {showTooltips && <TooltipContent side="right">Settings</TooltipContent>}
                            </Tooltip>
                        </TooltipProvider>

                        <AnimatedThemeToggler className="h-9 w-9 hover:bg-muted rounded-xl" />
                    </div>
                )}
            </div>
        </div>
    )
}
