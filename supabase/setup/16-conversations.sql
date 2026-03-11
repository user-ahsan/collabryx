-- Table: conversations
-- Chat threads between two users. Created when first message is sent.

-- Create the conversations table
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_1 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant_2 UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message_text TEXT,
    last_message_at TIMESTAMPTZ,
    unread_count_1 INTEGER NOT NULL DEFAULT 0,
    unread_count_2 INTEGER NOT NULL DEFAULT 0,
    is_archived BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(participant_1, participant_2),
    CHECK (participant_1 < participant_2)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversations_participant_1 ON public.conversations(participant_1);
CREATE INDEX IF NOT EXISTS idx_conversations_participant_2 ON public.conversations(participant_2);
CREATE INDEX IF NOT EXISTS idx_conversations_last_message ON public.conversations(last_message_at DESC);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;

-- Row Level Security
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view conversations they participate in
CREATE POLICY "Users can view own conversations" ON public.conversations
    FOR SELECT USING (
        participant_1 = auth.uid() OR participant_2 = auth.uid()
    );

-- Policy: Conversations are created via messages, not directly
-- Service role can create conversations (via edge functions)
CREATE POLICY "Service role can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Policy: Users can update their conversation (archive, unread count)
CREATE POLICY "Users can update own conversations" ON public.conversations
    FOR UPDATE USING (
        participant_1 = auth.uid() OR participant_2 = auth.uid()
    );

-- Policy: Users can archive their conversations
CREATE POLICY "Users can archive own conversations" ON public.conversations
    FOR DELETE USING (
        participant_1 = auth.uid() OR participant_2 = auth.uid()
    );
