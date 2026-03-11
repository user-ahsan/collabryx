-- Table: connections
-- Bidirectional connection requests between users (like LinkedIn "connect").

-- Create the connections table
CREATE TABLE IF NOT EXISTS public.connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'blocked')),
    message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(requester_id, receiver_id),
    CHECK (requester_id != receiver_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_connections_requester_id ON public.connections(requester_id);
CREATE INDEX IF NOT EXISTS idx_connections_receiver_id ON public.connections(receiver_id);
CREATE INDEX IF NOT EXISTS idx_connections_status ON public.connections(status);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_connections_updated_at ON public.connections;
CREATE TRIGGER update_connections_updated_at
    BEFORE UPDATE ON public.connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_connections_updated_at();

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.connections;

-- Row Level Security
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view connections involving themselves
CREATE POLICY "Users can view their connections" ON public.connections
    FOR SELECT USING (
        requester_id = auth.uid() OR receiver_id = auth.uid()
    );

-- Policy: Users can create connection requests
CREATE POLICY "Users can create connection requests" ON public.connections
    FOR INSERT WITH CHECK (
        auth.uid() = requester_id AND
        receiver_id != auth.uid()
    );

-- Policy: Users can update only when they are the receiver (accepting/declining)
CREATE POLICY "Users can update connection status" ON public.connections
    FOR UPDATE USING (
        auth.uid() = receiver_id OR auth.uid() = requester_id
    );

-- Policy: Users can delete only their own pending requests
CREATE POLICY "Users can delete own pending requests" ON public.connections
    FOR DELETE USING (
        auth.uid() = requester_id AND status = 'pending'
    );
