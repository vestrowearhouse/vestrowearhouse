-- Run this in your Supabase SQL Editor to create the Messaging System

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read messages where they are sender or receiver
CREATE POLICY "Users can read their own messages" ON public.messages
    FOR SELECT USING (
        auth.uid() = sender_id OR auth.uid() = receiver_id
    );

-- Policy: Users can insert messages if they are the sender
CREATE POLICY "Users can insert their own messages" ON public.messages
    FOR INSERT WITH CHECK (
        auth.uid() = sender_id
    );

-- Policy: Users can update read status if they are the receiver
CREATE POLICY "Users can mark messages as read" ON public.messages
    FOR UPDATE USING (
        auth.uid() = receiver_id
    );

-- Enable Realtime for the messages table
-- Note: You might need to manually enable Realtime for this table in your Supabase Dashboard 
-- (Database -> Replication -> Source -> Toggle 'messages')
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
