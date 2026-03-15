'use server'

import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Alternative: Anthropic Claude (uncomment if using Claude)
// import Anthropic from '@anthropic-ai/sdk'
// const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// })

// Validation schemas
const CreateSessionSchema = z.object({
  title: z.string().optional(),
})

const SendMessageSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(2000),
})

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
  
  // Call LLM API
  let aiResponse: string
  
  try {
    if (process.env.LLM_PROVIDER === 'anthropic') {
      // Claude implementation
      // const response = await anthropic.messages.create({
      //   model: 'claude-3-haiku-20240307',
      //   max_tokens: 500,
      //   messages: llmMessages.slice(1), // Claude doesn't use system message in array
      //   system: systemPrompt,
      // })
      // aiResponse = response.content[0].text
      throw new Error('Anthropic not implemented yet')
    } else {
      // OpenAI implementation
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: llmMessages as any,
        max_tokens: 500,
        temperature: 0.7,
      })
      
      aiResponse = response.choices[0].message.content || 'Sorry, I could not generate a response.'
    }
  } catch (llmError) {
    console.error('LLM API error:', llmError)
    return { error: new Error('Failed to get AI response') }
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
      bio: insight, // Or append to existing bio
    })
    .eq('id', user.id)
  
  if (error) {
    return { error }
  }
  
  revalidatePath('/my-profile')
  
  return { success: true }
}
