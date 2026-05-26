import { fetchUserProfileContext, fetchMultipleUserContexts } from './context-fetcher'
import { retrieveContextFromVectorStore } from './vector-retriever'
import { summarizeSessionIfNeeded } from './session-summarizer'
import { buildEnhancedSystemPrompt, buildFallbackSystemPrompt } from '@/lib/prompt/ai-mentor-prompts'
import type { ExtendedRAGContext, AIMessage, StartupContext, MultiUserContext } from './types'

export interface AssemblerOptions {
  userId: string
  query: string
  sessionId: string
  messages: AIMessage[]
  otherUserIds?: string[] // For collaboration advice
  startupContext?: StartupContext | null // For startup planning
}

export interface AssemblerResult {
  context: ExtendedRAGContext
  systemPrompt: string
  warnings: string[]
}

export async function assembleRAGContext(options: AssemblerOptions): Promise<ExtendedRAGContext> {
  const { userId, query, sessionId, messages, otherUserIds, startupContext } = options
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

  // Fetch multi-user context if otherUserIds provided
  let multiUser: MultiUserContext | null = null
  if (otherUserIds && otherUserIds.length > 0 && profileResult.data) {
    const otherUsersMap = await fetchMultipleUserContexts([userId, ...otherUserIds])
    const otherUsers = otherUserIds
      .map(id => otherUsersMap.get(id))
      .filter((u): u is NonNullable<typeof u> => u !== undefined)

    if (otherUsers.length > 0) {
      multiUser = {
        currentUser: profileResult.data,
        otherUsers,
        relationship: 'potential_match',
      }
    }
  }

  return {
    profile: profileResult.data ?? null,
    startup: startupContext ?? null,
    multiUser,
    retrieved_contexts: vectorResult.contexts,
    session_summary: summaryResult.summary,
    // TODO: Implement token-aware truncation instead of message-count truncation.
    // The current messages.slice(-10) can overflow the context window when messages
    // contain long code blocks or file contents. Count actual tokens and truncate
    // to a safe budget (e.g. 4000 tokens) instead of a fixed message count. (#158)
    conversation_history: messages.slice(-10),
    assembled_at: new Date().toISOString(),
  }
}

export async function assembleAndBuildPrompt(
  options: AssemblerOptions
): Promise<AssemblerResult> {
  const warnings: string[] = []

  try {
    const context = await assembleRAGContext(options)
    const systemPrompt = buildEnhancedSystemPrompt(context, options.query)
    return { context, systemPrompt, warnings }
  } catch (error) {
    warnings.push(`RAG assembly failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return {
      context: {
        profile: null,
        startup: null,
        multiUser: null,
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
