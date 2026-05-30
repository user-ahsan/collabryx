import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";
import { errorResponse, successResponse } from '@/lib/utils/api-response';

export const runtime = "edge"
export const dynamic = "force-dynamic"

const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long"),
  session_id: z.string().uuid().optional(),
  context: z.object({
    page: z.string().optional(),
    user_action: z.string().optional(),
  }).optional(),
})

// Lazy initialization - only create clients when route is called
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY is not configured')
  return new OpenAI({ apiKey })
}

function getAnthropic() {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured')
  return new Anthropic({ apiKey })
}

function getProvider(): 'openai' | 'anthropic' {
  if (process.env.ANTHROPIC_API_KEY) return 'anthropic'
  return 'openai'
}

export async function POST(request: NextRequest) {
  // Validate CSRF token for security
  const csrfToken = request.headers.get('x-csrf-token');
  const cookieToken = request.cookies.get('csrf_token')?.value || null;
  
  if (requiresCSRF(request.method)) {
    const isValid = await validateCSRFRequest(csrfToken, cookieToken);
    if (!isValid) {
      console.warn('⚠️ CSRF validation failed:', {
        hasHeaderToken: !!csrfToken,
        hasCookieToken: !!cookieToken,
        path: request.url,
      });
      return errorResponse('INVALID_CSRF', 'Invalid CSRF token', 403)
    }
  }
  
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return errorResponse('UNAUTHORIZED', 'Unauthorized', 401)
  }

  try {
    const body = await request.json().catch(() => null)
    
    if (!body) {
    return errorResponse('REQUEST_BODY_REQUIRED', 'Request body is required', 400)
    }

    const validationResult = ChatRequestSchema.safeParse(body)
    if (!validationResult.success) {
    return errorResponse('INVALID_REQUEST', 'Invalid request body', 400)
    }

    const { message, session_id } = validationResult.data

    // Get or create session
    let sessionId = session_id
    if (!sessionId) {
      const { data: session, error: insertError } = await supabase
        .from('ai_mentor_sessions')
        .insert({
          user_id: user.id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          status: 'active',
        })
        .select('id')
        .single()

      if (insertError || !session) {
        return errorResponse('SESSION_CREATE_ERROR', 'Failed to create session', 500)
      }
      sessionId = session.id
    } else {
      // Verify session ownership when session_id is provided
      const { data: existingSession, error: sessionError } = await supabase
        .from('ai_mentor_sessions')
        .select('id')
        .eq('id', session_id)
        .eq('user_id', user.id)
        .single()

      if (sessionError || !existingSession) {
    return errorResponse('SESSION_NOT_FOUND', 'Session not found or access denied', 404)
      }
    }

    // Save user message
    const { error: userInsertError } = await supabase
      .from('ai_mentor_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message,
      })

    if (userInsertError) {
      return errorResponse('MESSAGE_SAVE_ERROR', 'Failed to save message', 500)
    }

    // Get conversation history
    const { data: messages } = await supabase
      .from('ai_mentor_messages')
      .select('role, content')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(10)

    // Prepare system prompt
    const systemPrompt = `You are Collabryx AI Mentor, a helpful career advisor and collaboration assistant.
Help users:
- Find relevant connections based on their goals
- Improve their profiles
- Discover project opportunities
- Navigate career decisions

Be concise, encouraging, and practical. Focus on actionable advice.`

    // Call AI provider
    const provider = getProvider()
    let aiResponse: string

    if (provider === 'anthropic') {
      const anthropicMessages = messages?.slice(1).map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })) || []
      
      const anthropicClient = getAnthropic()
      const response = await anthropicClient.messages.create({
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
        max_tokens: 1000,
        messages: anthropicMessages,
        system: systemPrompt,
      })
      
      aiResponse = response.content[0].type === 'text' 
        ? response.content[0].text 
        : 'Sorry, I could not generate a response.'
    } else {
      const openaiMessages = [
        { role: 'system', content: systemPrompt },
        ...messages?.map(m => ({
          role: m.role,
          content: m.content,
        })) || []
      ]
      
      const openaiClient = getOpenAI()
      const response = await openaiClient.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: openaiMessages,
        max_tokens: 1000,
        temperature: 0.7,
      })
      
      aiResponse = response.choices[0].message?.content || 'Sorry, I could not generate a response.'
    }

    // Save AI response
    const { data: aiMessage, error: aiInsertError } = await supabase
      .from('ai_mentor_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
      })
      .select('id, session_id, role, content, is_saved_to_profile, created_at')
      .single()

    if (aiInsertError || !aiMessage) {
      return errorResponse('AI_RESPONSE_SAVE_ERROR', 'Failed to save AI response', 500)
    }

    return successResponse({
      message: aiMessage,
      session_id: sessionId,
    })

  } catch (error) {
    console.error("Chat API error:", error)
    return errorResponse('CHAT_ERROR', 'Internal server error', 500)
  }
}

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  return NextResponse.json({
    status: "operational",
    version: "2.0.0",
    authenticated: !!user,
    provider: getProvider(),
    features: {
      streaming: false,
      sessions: true,
      context: true,
    }
  })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type, X-CSRF-Token",
    },
  })
}
