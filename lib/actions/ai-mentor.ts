'use server'

import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { revalidatePath } from 'next/cache'
import { assembleAndBuildPrompt } from '@/lib/rag/context-assembler'
import type { AIMessage } from '@/lib/rag/types'

// ===========================================
// ZOD VALIDATION SCHEMAS
// ===========================================

const CreateSessionSchema = z.object({
  title: z.string().max(200).optional(),
})

const SendMessageSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
  content: z.string().min(1, 'Message cannot be empty').max(2000, 'Message too long'),
})

const SessionIdSchema = z.object({
  sessionId: z.string().uuid('Invalid session ID'),
})

const SaveMessageToProfileSchema = z.object({
  messageId: z.string().uuid('Invalid message ID'),
  insight: z.string().min(1, 'Insight cannot be empty').max(500, 'Insight too long'),
})

// Lazy-initialize AI clients to avoid build-time errors
let openai: OpenAI | null = null
let anthropic: Anthropic | null = null

function getOpenAIClient(): OpenAI {
  if (!openai) {
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OPENAI_API_KEY or OPENROUTER_API_KEY environment variable is not set')
    }
    const baseURL = process.env.OPENROUTER_API_KEY
      ? (process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1')
      : undefined
    openai = new OpenAI({ apiKey, baseURL })
  }
  return openai
}

function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set')
    }
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  }
  return anthropic
}

// Qwen/DashScope API (Alibaba) - lazy access
function getDashScopeConfig() {
  return {
    apiKey: process.env.DASHSCOPE_API_KEY,
    baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'
  }
}

export interface AISession {
  id: string
  user_id: string
  title: string
  status: 'active' | 'archived'
  created_at: string
  messages: AIMessage[]
}

// Circuit breaker for AI providers
class CircuitBreaker {
  private failures = 0
  private lastFailureTime: number | null = null
  private state: 'closed' | 'open' | 'half-open' = 'closed'
  private readonly threshold: number
  private readonly timeout: number

  constructor(threshold = 3, timeout = 60000) {
    this.threshold = threshold
    this.timeout = timeout
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - (this.lastFailureTime || 0) > this.timeout) {
        this.state = 'half-open'
      } else {
        throw new Error('Circuit breaker is open')
      }
    }

    try {
      const result = await fn()
      if (this.state === 'half-open') {
        this.state = 'closed'
        this.failures = 0
      }
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()
      if (this.failures >= this.threshold) {
        this.state = 'open'
      }
      throw error
    }
  }

  getState() {
    return this.state
  }
}

// Circuit breakers for each provider
const circuitBreakers = {
  openai: new CircuitBreaker(3, 60000),
  anthropic: new CircuitBreaker(3, 60000),
  qwen: new CircuitBreaker(3, 60000),
}

/**
 * Get AI provider based on environment config
 *
 * Provider resolution order:
 *   LLM_PROVIDER=anthropic + ANTHROPIC_API_KEY → Anthropic
 *   LLM_PROVIDER=qwen     + DASHSCOPE_API_KEY  → Qwen (DashScope)
 *   OPENROUTER_API_KEY present                  → OpenRouter (OpenAI-compatible)
 *   OPENAI_API_KEY present                      → OpenAI
 *
 * If an LLM_PROVIDER is set but its corresponding key is missing, an informative
 * error is thrown listing exactly which env var needs to be configured.
 */
function getProvider(): 'openai' | 'anthropic' | 'qwen' {
  const provider = process.env.LLM_PROVIDER || 'openai'

  if (provider === 'anthropic') {
    if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
    throw new Error(
      `LLM_PROVIDER is set to 'anthropic' but ANTHROPIC_API_KEY is not configured. ` +
      `Set the ANTHROPIC_API_KEY environment variable, or change LLM_PROVIDER to 'openai' or 'qwen'.`
    )
  }

  if (provider === 'qwen') {
    if (process.env.DASHSCOPE_API_KEY) return 'qwen'
    throw new Error(
      `LLM_PROVIDER is set to 'qwen' but DASHSCOPE_API_KEY is not configured. ` +
      `Set the DASHSCOPE_API_KEY environment variable, or change LLM_PROVIDER to 'openai' or 'anthropic'.`
    )
  }

  if (process.env.OPENROUTER_API_KEY) return 'openai'  // OpenRouter uses OpenAI-compatible API
  if (process.env.OPENAI_API_KEY) return 'openai'

  throw new Error(
    'No AI provider credentials found. Set one of:\n' +
    '  - OPENAI_API_KEY (OpenAI)\n' +
    '  - OPENROUTER_API_KEY (OpenRouter, OpenAI-compatible)\n' +
    '  - ANTHROPIC_API_KEY with LLM_PROVIDER=anthropic\n' +
    '  - DASHSCOPE_API_KEY with LLM_PROVIDER=qwen'
  )
}

/**
 * Call AI API with circuit breaker
 *
 * Model selection uses env vars with sensible defaults:
 *   ANTHROPIC_MODEL   → default 'claude-3-haiku-20240307'
 *   QWEN_MODEL        → default 'qwen-plus'
 *   OPENROUTER_MODEL  → default 'gpt-4-turbo-preview' (also used for native OpenAI)
 */
async function callAI(messages: Array<{ role: string; content: string }>, systemPrompt: string): Promise<string> {
  const provider = getProvider()
  const breaker = circuitBreakers[provider]

  return breaker.execute(async () => {
    if (provider === 'anthropic') {
      const anthropicMessages = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
      const anthropicClient = getAnthropicClient()
      const response = await anthropicClient.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
        max_tokens: 4000,
        messages: anthropicMessages,
        system: systemPrompt,
      })
      return response.content[0].type === 'text' ? response.content[0].text : 'Sorry, I could not generate a response.'
    }

    if (provider === 'qwen') {
      const { apiKey: dashscopeKey, baseURL } = getDashScopeConfig()
      if (!dashscopeKey) {
        throw new Error('DASHSCOPE_API_KEY environment variable is not set')
      }
      const response = await fetch(`${baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dashscopeKey}`,
        },
        body: JSON.stringify({
          model: process.env.QWEN_MODEL || 'qwen-plus',
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages,
          ],
          max_tokens: 4000,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`Qwen API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'
    }

    // Default: OpenAI (native or OpenRouter)
    const openaiMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
    ]
    const openaiClient = getOpenAIClient()
    const response = await openaiClient.chat.completions.create({
      model: process.env.OPENROUTER_MODEL || 'gpt-4-turbo-preview',
      messages: openaiMessages,
      max_tokens: 4000,
      temperature: 0.7,
    })

    return response.choices[0].message.content || 'Sorry, I could not generate a response.'
  })
}

/**
 * Create new AI mentor session
 */
export async function createSession(title?: string) {
  const validation = CreateSessionSchema.safeParse({ title })
  if (!validation.success) {
    return { error: new Error('Invalid title') }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }

  // Generate title from first message or default
  const generatedTitle = title || `Session ${new Date().toLocaleDateString()}`

  // Create session in database
  const { data: session, error: sessionError } = await supabase
    .from('ai_mentor_sessions')
    .insert({
      user_id: user.id,
      title: generatedTitle,
      status: 'active',
    })
    .select('id, user_id, title, status, created_at, updated_at')
    .single()

  if (sessionError) {
    return { error: sessionError }
  }

  return { data: session }
}

/**
 * Get or create active session for user
 */
export async function getOrCreateActiveSession() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }

  // Try to get existing active session
  const { data: existingSession } = await supabase
    .from('ai_mentor_sessions')
    .select('id, user_id, title, status, created_at, updated_at')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (existingSession) {
    return { data: existingSession }
  }

  // Create new session
  return createSession()
}

/**
 * Send message to AI mentor and get response
 *
 * NOTE: This server action saves messages to the database directly. The streaming
 * endpoint (`/api/ai/stream`) ALSO saves messages. The ChatInput component uses
 * `useAIStream` → `/api/ai/stream`, NOT this action. Therefore this function
 * serves as a **fallback for server-side / non-streaming contexts only**.
 * Do NOT call this from client components that also use the streaming endpoint,
 * or messages will be duplicated.
 */
export async function sendMessage(sessionId: string, content: string) {
  const validation = SendMessageSchema.safeParse({ sessionId, content })
  if (!validation.success) {
    return { error: new Error(validation.error.issues[0]?.message || 'Invalid input') }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }

  // Verify session ownership
  const { data: session, error: sessionError } = await supabase
    .from('ai_mentor_sessions')
    .select('id, user_id, title, status, created_at, updated_at')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) {
    return { error: new Error('Session not found') }
  }

  // Save user message
  const { error: userMsgError } = await supabase
    .from('ai_mentor_messages')
    .insert({
      session_id: sessionId,
      role: 'user',
      content: content,
    })

  if (userMsgError) {
    return { error: userMsgError }
  }

  // Get conversation history (last 20 messages — increased from 10 for richer context)
  const { data: messages } = await supabase
    .from('ai_mentor_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(20)

  const ragMessages: AIMessage[] = (messages || []).map((m, i) => ({
    id: `msg-${i}`,
    role: m.role as 'user' | 'assistant',
    content: m.content,
    created_at: new Date().toISOString(),
  }))

  // Assemble RAG context and build enhanced prompt
  const { context, systemPrompt, warnings } = await assembleAndBuildPrompt({ userId: user.id, query: content, sessionId, messages: ragMessages })

  // Prepare messages for LLM with RAG-enhanced system prompt
  const llmMessages = ragMessages.map(m => ({
    role: m.role,
    content: m.content,
  }))

  // Call LLM API with circuit breaker
  let aiResponse: string

  try {
    aiResponse = await callAI(llmMessages, systemPrompt)
  } catch (llmError) {
    console.error('LLM API error:', llmError)
    return { error: new Error('Failed to get AI response. Please try again later.') }
  }

  // Save AI response
  const { data: aiMessage, error: aiMsgError } = await supabase
    .from('ai_mentor_messages')
    .insert({
      session_id: sessionId,
      role: 'assistant',
      content: aiResponse,
    })
    .select('id, session_id, role, content, is_saved_to_profile, created_at')
    .single()

  if (aiMsgError) {
    return { error: aiMsgError }
  }

  revalidatePath('/(auth)/ai-mentor')

  return {
    data: aiMessage,
    context_used: {
      profile: !!context.profile,
      retrieved_contexts: context.retrieved_contexts?.length || 0,
      session_summarized: !!context.session_summary
    },
    warnings
  }
}

/**
 * Get session history
 *
 * @param sessionId - The session UUID
 * @param limit     - Max messages to return (default 100). Prevents slow queries on large sessions.
 */
export async function getSessionHistory(sessionId: string, limit = 100) {
  const validation = SessionIdSchema.safeParse({ sessionId })
  if (!validation.success) {
    return { error: new Error('Invalid session ID') }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }

  // Verify session ownership
  const { data: session, error: sessionError } = await supabase
    .from('ai_mentor_sessions')
    .select('id')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()

  if (sessionError || !session) {
    return { error: new Error('Session not found or access denied') }
  }

  // Fetch messages (session ownership verified)
  const { data, error } = await supabase
    .from('ai_mentor_messages')
    .select('id, session_id, role, content, is_saved_to_profile, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(limit)

  if (error) {
    return { error }
  }

  return { data }
}

/**
 * Get all user sessions (active AND archived)
 *
 * WHY THIS CHANGE:
 * The original query only returned 'active' sessions, which made the
 * SessionSidebar useless for browsing past conversations. The sidebar needs
 * to show ALL sessions the user has ever had, including archived ones, so
 * they can browse, select, and resume any past mentoring conversation.
 *
 * The query was updated from:
 *   .eq('status', 'active')
 * to:
 *   .in('status', ['active', 'archived'])
 *   .order('updated_at', { ascending: false })
 *   .limit(50)
 *
 * This returns the 50 most recently updated sessions regardless of status,
 * sorted by recency. The sidebar uses updated_at (not created_at) so that
 * sessions recent activity bubbles to the top even if they were created
 * weeks ago.
 *
 * PAGINATION NOTE: Limited to 50 results. If users routinely exceed this,
 * add offset-based or cursor-based pagination (e.g. pass a `page` param).
 */
export async function getUserSessions() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }

  const { data, error } = await supabase
    .from('ai_mentor_sessions')
    .select('id, user_id, title, status, created_at, updated_at')
    .eq('user_id', user.id)
    .in('status', ['active', 'archived'])
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) {
    return { error }
  }

  return { data }
}

/**
 * Archive session
 *
 * Archives are non-destructive: all messages and context are preserved and
 * the session remains visible in the sidebar (filtered to 'archived').
 * Returns the archived session info so callers can show a confirmation.
 */
export async function archiveSession(sessionId: string) {
  const validation = SessionIdSchema.safeParse({ sessionId })
  if (!validation.success) {
    return { error: new Error('Invalid session ID') }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }

  const { data: session, error } = await supabase
    .from('ai_mentor_sessions')
    .update({ status: 'archived' })
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .select('id, title, status')
    .single()

  if (error) {
    return { error }
  }

  revalidatePath('/(auth)/ai-mentor')

  return {
    success: true,
    data: session,
    message: `Session "${session.title}" archived. All messages preserved.`,
  }
}

/**
 * Delete session
 *
 * Deletes the session permanently. This will cascade delete all associated messages.
 */
export async function deleteSession(sessionId: string) {
  const validation = SessionIdSchema.safeParse({ sessionId })
  if (!validation.success) {
    return { error: new Error('Invalid session ID') }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }

  const { error } = await supabase
    .from('ai_mentor_sessions')
    .delete()
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    return { error }
  }

  revalidatePath('/(auth)/ai-mentor')

  return {
    success: true,
  }
}

/**
 * Save message to profile (user insights)
 *
 * NOTE: This appends AI-generated insights directly to the user's `bio` field,
 * which is destructive — if the user later edits their bio, the AI content
 * remains and can appear out of place. A future improvement should store
 * insights in a separate `ai_insights` column or a dedicated table so they
 * are rendered independently of user-authored bio text.
 */
export async function saveMessageToProfile(messageId: string, insight: string) {
  const validation = SaveMessageToProfileSchema.safeParse({ messageId, insight })
  if (!validation.success) {
    return { error: new Error(validation.error.issues[0]?.message || 'Invalid input') }
  }

  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }

  // Read current bio to append insight
  const { data: profile } = await supabase
    .from('profiles')
    .select('bio')
    .eq('id', user.id)
    .single()

  const currentBio = profile?.bio || ''
  const updatedBio = currentBio
    ? `${currentBio}\n\n---\n${insight}`
    : insight

  // Update user's profile with insight
  const { error } = await supabase
    .from('profiles')
    .update({
      bio: updatedBio,
    })
    .eq('id', user.id)

  if (error) {
    return { error }
  }

  revalidatePath('/my-profile')

  return { success: true }
}

/**
 * Get circuit breaker status for all providers
 */
export async function getAICircuitBreakerStatus() {
  return {
    openai: circuitBreakers.openai.getState(),
    anthropic: circuitBreakers.anthropic.getState(),
    qwen: circuitBreakers.qwen.getState(),
    activeProvider: getProvider(),
  }
}

