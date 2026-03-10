import { MessagesClient } from "@/components/features/messages/messages-client"

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params
    return <MessagesClient initialChatId={resolvedParams.id} />
}
