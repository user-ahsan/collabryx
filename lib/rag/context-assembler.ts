import { fetchUserProfileContext } from './context-fetcher'
import { retrieveContextFromVectorStore } from './vector-retriever'
import { summarizeSessionIfNeeded } from './session-summarizer'
import { buildEnhancedSystemPrompt, buildFallbackSystemPrompt } from '@/lib/prompt/ai-mentor-prompts'
import type { RAGContext, AIMessage } from './types'

export interface AssemblerResult {
  context: RAGContext
  systemPrompt: string
  warnings: string[]
}

export async function assembleRAGContext(
  userId: string,
  query: string,
  sessionId: string,
  messages: AIMessage[]
): Promise<RAGContext> {
  const warnings: string[] = []

  const profileResult = await fetchUserProfileContext(userId)
  if (profileResult.error) {
    warnings.push(`Profile fetch failed: ${profileResult.error.message}`)
  }

  const vectorResult = await retrieveContextFromVectorStore(query, userId, { limit: 5 })
  if (vectorResult.warnings.length > 0) {
    warnings.push(...vectorResult.warnings)
  }

  const summaryResult = await summarizeSessionIfNeeded(messages, sessionId)
  if (summaryResult.warnings.length > 0) {
    warnings.push(...summaryResult.warnings)
  }

  return {
    profile: profileResult.data ?? null,
    retrieved_contexts: vectorResult.contexts,
    session_summary: summaryResult.summary,
    conversation_history: messages.slice(-10),
    assembled_at: new Date().toISOString(),
  }
}

export async function assembleAndBuildPrompt(
  userId: string,
  query: string,
  sessionId: string,
  messages: AIMessage[]
): Promise<AssemblerResult> {
  const warnings: string[] = []

  try {
    const context = await assembleRAGContext(userId, query, sessionId, messages)
    const systemPrompt = buildEnhancedSystemPrompt(context, query)
    return { context, systemPrompt, warnings }
  } catch (error) {
    warnings.push(`RAG assembly failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      context: {
        profile: null,
        retrieved_contexts: [],
        session_summary: null,
        conversation_history: [],
        assembled_at: new Date().toISOString(),
      },
      systemPrompt: buildFallbackSystemPrompt(),
      warnings,
    }
  }
}
