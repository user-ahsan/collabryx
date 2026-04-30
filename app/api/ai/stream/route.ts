import { NextRequest, NextResponse } from 'next/server'
import { assembleAndBuildPrompt } from '@/lib/rag/context-assembler'
import { getProviderRegistry } from '@/lib/ai/providers/registry'
import { createMessageStream } from '@/lib/ai/streaming'
import type { Message } from '@/lib/ai/providers/base'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, sessionId, messages, query, preferredProvider } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const { systemPrompt, warnings } = await assembleAndBuildPrompt(
      userId,
      query || '',
      sessionId,
      messages || []
    )

    const registry = getProviderRegistry()
    const provider = registry.getProvider(preferredProvider)

    const conversationMessages: Message[] = (messages || []).map(
      (msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content,
      })
    )

    return await createMessageStream(conversationMessages, provider, systemPrompt)
  } catch (error) {
    console.error('AI stream error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}