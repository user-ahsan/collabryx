import { NextRequest, NextResponse } from 'next/server'
import { assembleAndBuildPrompt } from '@/lib/rag/context-assembler'
import { getProviderRegistry } from '@/lib/ai/providers/registry'

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

    const { context, systemPrompt, warnings } = await assembleAndBuildPrompt(
      userId,
      query || '',
      sessionId,
      messages || []
    )

    const registry = getProviderRegistry()
    
    let result
    if (preferredProvider) {
      const provider = registry.getProvider(preferredProvider)
      result = await provider.chat(messages, systemPrompt)
    } else {
      result = await registry.chatWithFallback(messages, { timeout: 60000 })
    }

    return NextResponse.json({
      content: result.content,
      provider: 'minimax',
      model: result.model,
      usage: result.usage,
      context_used: {
        profile_used: !!context.profile,
        contexts_retrieved: context.retrieved_contexts?.length || 0,
        session_summarized: !!context.session_summary
      }
    })
  } catch (error) {
    console.error('AI chat error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
