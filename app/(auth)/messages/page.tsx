import { MessagesClient } from "@/components/features/messages/messages-client"
import type { Metadata } from "next"

export const revalidate = 0

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Messages | Collabryx",
  description: "Real-time messaging for seamless collaboration. Connect with your matches and build relationships.",
  robots: {
    index: false,
    follow: false,
  },
}

export default function MessagesPage() {
    return <MessagesClient />
}
