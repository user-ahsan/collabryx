# Messaging

Real-time messaging system implementation guide.

---

## Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Implementation](#implementation)
- [Real-time Updates](#real-time-updates)
- [API Reference](#api-reference)

---

## Overview

Collabryx messaging system features:

- Real-time message delivery (Supabase Realtime)
- Conversation management
- Message history
- Read receipts
- Typing indicators

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Messaging Architecture                    │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Client → useChat Hook → Supabase Realtime → Database       │
│                                                             │
│  Components:                                                │
│  - Conversation List                                        │
│  - Message Thread                                           │
│  - Message Input                                            │
│  - Typing Indicator                                         │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation

### Database Schema

```sql
-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id),
  sender_id UUID REFERENCES profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### React Hook

```typescript
// hooks/use-chat.ts
export function useChat(conversationId: string) {
  const [messages, setMessages] = useState<Message[]>([])
  const supabase = createClient()
  
  // Load messages
  useEffect(() => {
    loadMessages()
  }, [conversationId])
  
  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as Message])
      })
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId])
  
  const sendMessage = async (content: string) => {
    await supabase.from('messages').insert({
      conversation_id: conversationId,
      content,
      sender_id: currentUser.id
    })
  }
  
  return { messages, sendMessage }
}
```

---

## Real-time Updates

### Supabase Realtime Setup

```typescript
// Subscribe to conversation updates
const channel = supabase
  .channel(`room:${conversationId}`)
  .on('broadcast', { event: 'message' }, (payload) => {
    handleNewMessage(payload.payload)
  })
  .subscribe()
```

### Typing Indicators

```typescript
// Send typing event
const sendTypingIndicator = () => {
  channel.send({
    type: 'broadcast',
    event: 'typing',
    payload: { userId: currentUser.id }
  })
}
```

---

## API Reference

### GET /api/conversations

Get all conversations for current user.

**Response:**
```json
{
  "conversations": [
    {
      "id": "uuid",
      "participants": [...],
      "last_message": {...},
      "unread_count": 3
    }
  ]
}
```

### POST /api/messages

Send a new message.

**Request:**
```json
{
  "conversation_id": "uuid",
  "content": "Hello!"
}
```

---

**Last Updated**: 2026-03-14

[← Back to Docs](../README.md)
