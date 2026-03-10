"use client"

import { useState } from "react"
import { useIsMobile } from "@/hooks/use-media-query"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Bell, Heart, MessageSquare, UserPlus, Check } from "lucide-react"
import { GlassCard } from "@/components/shared/glass-card"

const NOTIFICATIONS = [
    {
        id: "1",
        type: "connect",
        actor: { name: "David Kim", avatar: "/avatars/04.png" },
        content: "sent you a connection request.",
        time: "2m ago",
        read: false,
    },
    {
        id: "2",
        type: "message",
        actor: { name: "Sarah Chen", avatar: "/avatars/01.png" },
        content: "messaged you: 'Hey! I saw your profile...'",
        time: "1h ago",
        read: false,
    },
    {
        id: "3",
        type: "like",
        actor: { name: "Alex Rivera", avatar: "/avatars/02.png" },
        content: "liked your project 'AI Generator'.",
        time: "3h ago",
        read: true,
    },
    {
        id: "4",
        type: "system",
        actor: { name: "Collabryx", avatar: "" },
        content: "Your profile is getting attention! 5 new views today.",
        time: "1d ago",
        read: true,
    },
]

interface NotificationsWidgetProps {
    children: React.ReactNode
}

function NotificationList() {
    return (
        <ScrollArea className="flex-1 overflow-y-auto w-full">
            <div className="space-y-2 p-3 sm:p-4 pb-6">
                {NOTIFICATIONS.map((n) => (
                    <GlassCard
                        key={n.id}
                        hoverable
                        className={cn(
                            !n.read ? "border-l-2 border-l-primary shadow-[0_0_15px_rgba(59,130,246,0.05)]" : ""
                        )}
                        innerClassName="flex items-start gap-3 p-3 sm:p-4"
                    >
                        <div className={cn(
                            "mt-0.5 p-2 rounded-full shrink-0",
                            n.type === "connect" && "bg-blue-500/10 text-blue-500",
                            n.type === "message" && "bg-green-500/10 text-green-500",
                            n.type === "like" && "bg-red-500/10 text-red-500",
                            n.type === "system" && "bg-yellow-500/10 text-yellow-500"
                        )}>
                            {n.type === "connect" && <UserPlus className="h-4 w-4" />}
                            {n.type === "message" && <MessageSquare className="h-4 w-4" />}
                            {n.type === "like" && <Heart className="h-4 w-4" />}
                            {n.type === "system" && <Bell className="h-4 w-4" />}
                        </div>

                        <div className="flex-1 space-y-1.5 min-w-0">
                            <div className="flex justify-between items-start gap-2">
                                <p className="text-sm leading-relaxed">
                                    <span className="font-semibold text-foreground/90">{n.actor.name}</span>{" "}
                                    <span className="text-muted-foreground/80">{n.content}</span>
                                </p>
                                <span className="text-[10px] text-muted-foreground/60 whitespace-nowrap mt-0.5">{n.time}</span>
                            </div>

                            {n.type === "connect" && (
                                <div className="flex gap-2 mt-2">
                                    <Button size="sm" className="h-8 px-4 text-xs font-medium">Accept</Button>
                                    <Button size="sm" variant="ghost" className="h-8 px-4 text-xs font-medium hover:bg-white/5">Ignore</Button>
                                </div>
                            )}
                        </div>
                    </GlassCard>
                ))}
            </div>
        </ScrollArea>
    )
}

export function NotificationsWidget({ children }: NotificationsWidgetProps) {
    const isMobile = useIsMobile()
    const [open, setOpen] = useState(false)

    if (isMobile) {
        return (
            <Sheet open={open} onOpenChange={setOpen}>
                <SheetTrigger asChild>
                    {children}
                </SheetTrigger>
                <SheetContent side="right" className="p-0 border-l border-border/60 w-80 sm:w-96 flex flex-col bg-card/95 backdrop-blur-xl">
                    <SheetHeader className="px-5 py-4 border-b border-border/60 text-left shrink-0 bg-transparent">
                        <div className="flex items-center justify-between">
                            <SheetTitle className="text-lg font-bold">Notifications</SheetTitle>
                            <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground opacity-80 hover:opacity-100">
                                <Check className="mr-1.5 h-3.5 w-3.5" />
                                Mark all read
                            </Button>
                        </div>
                    </SheetHeader>
                    <NotificationList />
                </SheetContent>
            </Sheet>
        )
    }

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                {children}
            </PopoverTrigger>
            <PopoverContent
                side="right"
                align="end"
                sideOffset={16}
                className="w-96 p-0 bg-card/80 backdrop-blur-xl border border-border/60 shadow-lg flex flex-col overflow-hidden rounded-xl z-50"
            >
                <div className="flex items-center justify-between px-5 py-4 border-b border-border/60 shrink-0 bg-transparent">
                    <h3 className="font-bold text-lg tracking-tight">Notifications</h3>
                    <Button variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground hover:text-foreground hover:bg-white/5 opacity-80 hover:opacity-100">
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Mark all read
                    </Button>
                </div>
                <div className="max-h-[80vh] flex flex-col">
                    <NotificationList />
                </div>
            </PopoverContent>
        </Popover>
    )
}
