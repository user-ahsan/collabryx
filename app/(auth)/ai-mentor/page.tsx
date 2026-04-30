'use client'

import { useState } from 'react'
import { useAIStream } from '@/hooks/use-ai-stream'
import { StreamingMessage } from '@/components/features/ai-mentor/streaming-message'
import { useAuth } from '@/hooks/use-auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function AIMentorPage() {
  const { user } = useAuth()
  const [input, setInput] = useState('')
  
  const { 
    messages, 
    isStreaming, 
    sendMessage, 
    error 
  } = useAIStream({
    userId: user?.id || '',
    onChunk: (chunk) => console.log('Token:', chunk),
    onComplete: (content) => console.log('Complete:', content.length, 'chars')
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isStreaming) return
    await sendMessage(input)
    setInput('')
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <StreamingMessage
            key={msg.id}
            content={msg.content}
            sender={msg.role === 'user' ? 'user' : 'ai'}
            isStreaming={isStreaming && msg === messages[messages.length - 1] && msg.role === 'assistant'}
            timestamp={new Date(msg.created_at)}
          />
        ))}
        {error && (
          <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-sm">
            Error: {error.message}
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask me anything..."
            disabled={isStreaming}
          />
          <Button type="submit" disabled={isStreaming || !input.trim()}>
            Send
          </Button>
        </div>
      </form>
    </div>
  )
}