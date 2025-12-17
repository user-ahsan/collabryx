"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { Bell, Heart, MessageSquare, UserPlus } from "lucide-react"

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

export default function NotificationsPage() {
    return (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-2xl">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-bold">Notifications</h1>
                <Button variant="ghost" size="sm">Mark all as read</Button>
            </div>

            <div className="space-y-4">
                {NOTIFICATIONS.map((n) => (
                    <div
                        key={n.id}
                        className={cn(
                            "group flex items-start gap-4 p-5 rounded-xl border transition-all hover:bg-muted/30 hover:shadow-sm",
                            !n.read ? "bg-card border-l-4 border-l-primary" : "bg-card/50 border-border/40"
                        )}
                    >
                        <div className={cn(
                            "mt-1 p-2 rounded-full shrink-0",
                            n.type === "connect" && "bg-blue-500/10 text-blue-600",
                            n.type === "message" && "bg-green-500/10 text-green-600",
                            n.type === "like" && "bg-red-500/10 text-red-600",
                            n.type === "system" && "bg-yellow-500/10 text-yellow-600"
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
                    </div>
                ))}
            </div>
        </div>
    )
}
