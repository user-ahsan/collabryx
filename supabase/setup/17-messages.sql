-- Table: messages
-- Individual messages within a conversation.

-- Create the messages table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    attachment_url TEXT,
    attachment_type TEXT CHECK (attachment_type IN ('image', 'file')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON public.messages(created_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages from their conversations
CREATE POLICY "Users can view conversation messages" ON public.messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

-- Policy: Users can send messages in their conversations
CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

-- Policy: Users can mark messages as read in their conversations
CREATE POLICY "Users can update message read status" ON public.messages
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = messages.conversation_id
            AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
        )
    );

-- Policy: Users can delete only their own messages
CREATE POLICY "Users can delete own messages" ON public.messages
    FOR DELETE USING (auth.uid() = sender_id);
