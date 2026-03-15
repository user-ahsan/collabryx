import { MessagesClient } from "@/components/features/messages/messages-client"
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'

export default async function MessagePage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = await params
    const conversationId = resolvedParams.id
    
    const supabase = await createClient()
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
        notFound()
    }
    
    // Check if user is part of conversation
    const { data: conversation } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`)
        .eq('id', conversationId)
        .single()
    
    if (!conversation) {
        notFound()
    }
    
    return <MessagesClient initialChatId={conversationId} />
}
