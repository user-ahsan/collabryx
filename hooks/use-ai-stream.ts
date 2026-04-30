'use client'

import { useState, useCallback, useRef } from 'react'
import type { AIMessage } from '@/lib/rag/types'

interface UseAIStreamOptions {
  userId: string
  sessionId?: string
  onChunk?: (chunk: string) => void
  onComplete?: (fullContent: string) => void
  onError?: (error: Error) => void
}

export function useAIStream(options: UseAIStreamOptions) {
  const [messages, setMessages] = useState<AIMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const currentMessageRef = useRef<string>('')

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: AIMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      created_at: new Date().toISOString()
    }
    setMessages(prev => [...prev, userMessage])
    currentMessageRef.current = ''

    setIsStreaming(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: options.userId,
          sessionId: options.sessionId || crypto.randomUUID(),
          messages: [...messages, userMessage],
          query: content
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) throw new Error('No response body')

      const aiMessageId = crypto.randomUUID()
      setMessages(prev => [...prev, {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        created_at: new Date().toISOString()
      }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              if (parsed.error) {
                throw new Error(parsed.error)
              }
              if (parsed.content) {
                currentMessageRef.current += parsed.content
                options.onChunk?.(parsed.content)

                setMessages(prev => prev.map(msg =>
                  msg.id === aiMessageId
                    ? { ...msg, content: currentMessageRef.current }
                    : msg
                ))
              }
            } catch {
              // Ignore parse errors for non-JSON data
            }
          }
        }
      }

      options.onComplete?.(currentMessageRef.current)
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      setError(error)
      options.onError?.(error)
    } finally {
      setIsStreaming(false)
    }
  }, [messages, options])

  return {
    messages,
    isStreaming,
    sendMessage,
    error
  }
}