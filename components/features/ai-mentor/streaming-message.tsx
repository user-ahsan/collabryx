'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { Bot } from 'lucide-react'

interface StreamingMessageProps {
  content: string
  isStreaming?: boolean
  timestamp?: Date
  sender?: 'user' | 'ai'
}

export function StreamingMessage({
  content,
  isStreaming = false,
  timestamp,
  sender = 'ai'
}: StreamingMessageProps) {
  return (
    <div className={cn(
      'flex gap-3 p-4 rounded-lg',
      sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted'
    )}>
      {sender === 'ai' && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div className="flex-1 space-y-2">
        <p className="text-sm leading-relaxed">
          {content}
          {isStreaming && (
            <span className="inline-block ml-1 w-2 h-4 bg-foreground animate-pulse" />
          )}
        </p>
        {timestamp && (
          <p className="text-xs text-muted-foreground">
            {timestamp.toLocaleTimeString()}
          </p>
        )}
      </div>
    </div>
  )
}