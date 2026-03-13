"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bell, Heart, MessageSquare, UserPlus } from "lucide-react"
import { toast } from "sonner"
import { GlassCard } from "@/components/shared/glass-card"
import { glass } from "@/lib/utils/glass-variants"

interface Notification {
    id: string
    type: "connect" | "message" | "like" | "system"
    actor: { name: string; avatar: string }
    content: string
    time: string
    read: boolean
}

interface NotificationsClientProps {
    initialNotifications: Notification[]
}

export function NotificationsClient({ initialNotifications }: NotificationsClientProps) {
    const [notifications, setNotifications] = useState<Notification[]>(initialNotifications)

    const handleMarkAllRead = useCallback(() => {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        toast.success("All notifications marked as read")
    }, [])

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold">Notifications</h1>
                    {unreadCount > 0 && (
                        <span className="px-2.5 py-0.5 text-xs font-medium bg-primary text-primary-foreground rounded-full">
                            {unreadCount} new
                        </span>
                    )}
                </div>
                <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0}
                >
                    Mark all as read
                </Button>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <GlassCard innerClassName="text-center py-12">
                        <Bell className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                        <p className="text-muted-foreground">No notifications yet</p>
                    </GlassCard>
                ) : (
                    notifications.map((n) => (
                        <GlassCard
                            key={n.id}
                            className={cn(
                                "group transition-all hover:-translate-y-0.5",
                                !n.read ? "border-l-4 border-l-primary" : ""
                            )}
                            innerClassName="flex items-start gap-4 p-5"
                        >
                            <div className={cn(
                                "mt-1 p-2 rounded-full shrink-0 backdrop-blur-sm",
                                n.type === "connect" && glass("badgeInfo"),
                                n.type === "message" && glass("badgeSuccess"),
                                n.type === "like" && glass("badgeError"),
                                n.type === "system" && glass("badgeWarning")
                            )}>
                                {n.type === "connect" && <UserPlus className="h-4.5 w-4.5" />}
                                {n.type === "message" && <MessageSquare className="h-4.5 w-4.5" />}
                                {n.type === "like" && <Heart className="h-4.5 w-4.5" />}
                                {n.type === "system" && <Bell className="h-4.5 w-4.5" />}
                            </div>

                            <div className="flex-1 space-y-1.5 min-w-0">
                                <div className="flex justify-between items-start gap-2">
                                    <p className="text-sm leading-relaxed">
                                        <span className="font-semibold text-foreground">{n.actor.name}</span> <span className="text-muted-foreground">{n.content}</span>
                                    </p>
                                    <span className="text-xs text-muted-foreground whitespace-nowrap">{n.time}</span>
                                </div>

                                {n.type === "connect" && (
                                    <div className="flex gap-2 mt-3">
                                        <Button size="sm" className="h-8 px-4">Accept</Button>
                                        <Button size="sm" variant="outline" className="h-8 px-4">Ignore</Button>
                                    </div>
                                )}
                            </div>
                        </GlassCard>
                    ))
                )}
            </div>
        </div>
    )
}
