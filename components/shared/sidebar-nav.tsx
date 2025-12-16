"use client"

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
    MapPin,
    Link as LinkIcon
} from "lucide-react"
import { motion } from "framer-motion"

interface SidebarNavProps extends React.HTMLAttributes<HTMLDivElement> { }

export function SidebarNav({ className, ...props }: SidebarNavProps) {
    const pathname = usePathname()
    const { isCollapsed, toggleSidebar } = useSidebar()

    const items = [
        {
            title: "Dashboard",
            href: "/dashboard",
            icon: LayoutDashboard,
        },
        {
            title: "Smart Matches",
            href: "/dashboard/matches",
            icon: Sparkles,
        },
        {
            title: "Messages",
            href: "/dashboard/messages",
            icon: MessageSquare,
        },
        {
            title: "AI Mentor",
            href: "/dashboard/mentor",
            icon: Bot,
        },
        {
            title: "My Profile",
            href: "/dashboard/profile",
            icon: UserCircle,
        },
    ]

    return (
        <div className={cn("flex h-full flex-col relative", className)} {...props}>
            {/* Toggle Button - Floating on the right edge */}
            <Button
                variant="outline"
                size="icon"
                className="absolute -right-4 top-6 z-50 h-8 w-8 rounded-full bg-background border shadow-md flex items-center justify-center p-0 hover:bg-muted"
                onClick={toggleSidebar}
                aria-label="Toggle Sidebar"
            >
                {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>

            {/* Logo Section */}
            <div className={cn("flex items-center h-16 px-4 shrink-0 transition-all duration-300", isCollapsed ? "justify-center" : "justify-start")}>
                <Link href="/" className={cn("flex items-center gap-2 font-bold text-xl group overflow-hidden transition-all", isCollapsed ? "w-8" : "w-full")}>
                    <div className="h-8 w-8 min-w-[2rem] rounded-lg bg-primary text-primary-foreground grid place-items-center transition-transform group-hover:scale-110">
                        <span className="text-lg">C</span>
                    </div>
                    {!isCollapsed && (
                        <motion.span
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="bg-gradient-to-r from-primary to-primary/50 bg-clip-text text-transparent whitespace-nowrap"
                        >
                            Collabryx
                        </motion.span>
                    )}
                </Link>
            </div>

            {/* Profile Section (Integrated) */}
            <div className={cn("px-4 transition-all duration-300 shrink-0", isCollapsed ? "py-2" : "py-6")}>
                <div className={cn("flex flex-col", isCollapsed ? "items-center gap-2" : "items-center gap-4")}>
                    {!isCollapsed ? (
                        <>
                            <div className="relative">
                                <Avatar className="h-20 w-20 border-4 border-background shadow-sm">
                                    <AvatarImage src="/avatars/01.png" alt="@sophie" />
                                    <AvatarFallback>SC</AvatarFallback>
                                </Avatar>
                                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-green-500 rounded-full border-2 border-background" />
                            </div>
                            <div className="text-center w-full px-2">
                                <h3 className="font-bold text-lg leading-tight truncate">Sophie Chen</h3>
                                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">Frontend Architect | Building UI at TechFlow</p>
                            </div>

                            {/* Compact Stats for Sidebar */}
                            <div className="w-full grid grid-cols-2 gap-2 mt-2">
                                <div className="bg-muted/30 p-2 rounded-lg text-center">
                                    <span className="block text-xs text-muted-foreground">Views</span>
                                    <span className="block text-sm font-bold text-primary">1.2k</span>
                                </div>
                                <div className="bg-muted/30 p-2 rounded-lg text-center">
                                    <span className="block text-xs text-muted-foreground">Conns</span>
                                    <span className="block text-sm font-bold text-primary">567</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <TooltipProvider delayDuration={0}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm cursor-pointer hover:scale-105 transition-transform">
                                        <AvatarImage src="/avatars/01.png" alt="@sophie" />
                                        <AvatarFallback>SC</AvatarFallback>
                                    </Avatar>
                                </TooltipTrigger>
                                <TooltipContent side="right">
                                    <p>Sophie Chen</p>
                                    <p className="text-xs text-muted-foreground">View Profile</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    )}
                </div>
            </div>

            {!isCollapsed && <Separator className="mx-4 mb-4 w-auto" />}

            {/* Navigation Items */}
            <ScrollArea className="flex-1 px-3">
                <div className="flex flex-col gap-1 py-2">
                    <TooltipProvider delayDuration={0}>
                        {items.map((item) => {
                            const isActive = pathname === item.href
                            return (
                                <Tooltip key={item.href}>
                                    <TooltipTrigger asChild>
                                        <Link
                                            href={item.href}
                                            className={cn(
                                                "relative flex items-center rounded-xl p-3 text-sm font-medium transition-colors hover:bg-muted/50",
                                                isActive ? "bg-primary/10 text-primary" : "text-muted-foreground",
                                                isCollapsed ? "justify-center" : "justify-start"
                                            )}
                                        >
                                            <item.icon className={cn("h-5 w-5", !isCollapsed && "mr-3")} />
                                            {!isCollapsed && <span>{item.title}</span>}
                                            {isActive && !isCollapsed && (
                                                <motion.div
                                                    layoutId="active-nav-indicator"
                                                    className="absolute left-0 w-1 h-6 bg-primary rounded-r-full"
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                />
                                            )}
                                        </Link>
                                    </TooltipTrigger>
                                    {isCollapsed && (
                                        <TooltipContent side="right">
                                            {item.title}
                                        </TooltipContent>
                                    )}
                                </Tooltip>
                            )
                        })}
                    </TooltipProvider>
                </div>
            </ScrollArea>

            {/* Footer User Dropdown */}
            <div className="p-3 mt-auto border-t shrink-0">
                {!isCollapsed ? (
                    <UserNavDropdown />
                ) : (
                    <div className="flex justify-center">
                        <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full">
                            <UserCircle className="h-5 w-5 text-muted-foreground" />
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
