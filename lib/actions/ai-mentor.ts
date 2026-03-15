'use server'

import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// Initialize AI clients
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// Qwen/DashScope API (Alibaba)
const DASHSCOPE_API_KEY = process.env.DASHSCOPE_API_KEY
const DASHSCOPE_BASE_URL = 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1'



export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
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
 */
function getProvider(): 'openai' | 'anthropic' | 'qwen' {
  const provider = process.env.LLM_PROVIDER || 'openai'
  if (provider === 'anthropic' && process.env.ANTHROPIC_API_KEY) return 'anthropic'
  if (provider === 'qwen' && process.env.DASHSCOPE_API_KEY) return 'qwen'
  if (process.env.OPENAI_API_KEY) return 'openai'
  throw new Error('No AI provider configured')
}

/**
 * Call AI API with circuit breaker
 */
async function callAI(messages: Array<{ role: string; content: string }>, systemPrompt: string): Promise<string> {
  const provider = getProvider()
  const breaker = circuitBreakers[provider]

  return breaker.execute(async () => {
    if (provider === 'anthropic') {
      const anthropicMessages = messages.slice(1).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }))
      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: anthropicMessages,
        system: systemPrompt,
      })
      return response.content[0].type === 'text' ? response.content[0].text : 'Sorry, I could not generate a response.'
    }

    if (provider === 'qwen') {
      const response = await fetch(`${DASHSCOPE_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DASHSCOPE_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'qwen-plus',
          messages,
          max_tokens: 500,
          temperature: 0.7,
        }),
      })

      if (!response.ok) {
        throw new Error(`Qwen API error: ${response.status}`)
      }

      const data = await response.json()
      return data.choices?.[0]?.message?.content || 'Sorry, I could not generate a response.'
    }

    // Default: OpenAI
    const openaiMessages = messages.map(m => ({
      role: m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }))
    const response = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: openaiMessages,
      max_tokens: 500,
      temperature: 0.7,
    })

    return response.choices[0].message.content || 'Sorry, I could not generate a response.'
  })
}

/**
 * Create new AI mentor session
 */
export async function createSession(title?: string) {
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
    .select()
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
    .select('*')
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
 */
export async function sendMessage(sessionId: string, content: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }

  // Verify session ownership
  const { data: session, error: sessionError } = await supabase
    .from('ai_mentor_sessions')
    .select('*')
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

  // Get conversation history (last 10 messages)
  const { data: messages } = await supabase
    .from('ai_mentor_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(10)

  // Prepare messages for LLM
  const systemPrompt = `You are Collabryx AI Mentor, a helpful career advisor and collaboration assistant.
Help users:
- Find relevant connections based on their goals
- Improve their profiles
- Discover project opportunities
- Navigate career decisions

Be concise, encouraging, and practical. Focus on actionable advice.`

  const llmMessages = [
    { role: 'system', content: systemPrompt },
    ...(messages || []).map(m => ({
      role: m.role,
      content: m.content,
    })),
  ]

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
    .select()
    .single()

  if (aiMsgError) {
    return { error: aiMsgError }
  }

  revalidatePath('/assistant')

  return { data: aiMessage }
}

/**
 * Get session history
 */
export async function getSessionHistory(sessionId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }

  const { data, error } = await supabase
    .from('ai_mentor_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })

  if (error) {
    return { error }
  }

  return { data }
}

/**
 * Get all user sessions
 */
export async function getUserSessions() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }

  const { data, error } = await supabase
    .from('ai_mentor_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) {
    return { error }
  }

  return { data }
}

/**
 * Archive session
 */
export async function archiveSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }

  const { error } = await supabase
    .from('ai_mentor_sessions')
    .update({ status: 'archived' })
    .eq('id', sessionId)
    .eq('user_id', user.id)

  if (error) {
    return { error }
  }

  revalidatePath('/assistant')

  return { success: true }
}

/**
 * Save message to profile (user insights)
 */
export async function saveMessageToProfile(messageId: string, insight: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }

  // Update user's profile with insight
  const { error } = await supabase
    .from('profiles')
    .update({
      bio: insight,
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
