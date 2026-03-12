import { NotificationsClient } from "@/components/features/notifications/notifications-client"
import type { Metadata } from "next"

export const revalidate = 30

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Notifications | Collabryx",
  description: "Stay updated with your network. Connection requests, messages, and activity notifications.",
  robots: {
    index: false,
    follow: false,
  },
}

const DEFAULT_NOTIFICATIONS = [
    {
        id: "1",
        type: "connect" as const,
        actor: { name: "David Kim", avatar: "/avatars/04.png" },
        content: "sent you a connection request.",
        time: "2m ago",
        read: false,
    },
    {
        id: "2",
        type: "message" as const,
        actor: { name: "Sarah Chen", avatar: "/avatars/01.png" },
        content: "messaged you: 'Hey! I saw your profile...'",
        time: "1h ago",
        read: false,
    },
    {
        id: "3",
        type: "like" as const,
        actor: { name: "Alex Rivera", avatar: "/avatars/02.png" },
        content: "liked your project 'AI Generator'.",
        time: "3h ago",
        read: true,
    },
    {
        id: "4",
        type: "system" as const,
        actor: { name: "Collabryx", avatar: "" },
        content: "Your profile is getting attention! 5 new views today.",
        time: "1d ago",
        read: true,
    },
]

export default function NotificationsPage() {
    return <NotificationsClient initialNotifications={DEFAULT_NOTIFICATIONS} />
}
