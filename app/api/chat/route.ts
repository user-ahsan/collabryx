import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { validateCSRFRequest, requiresCSRF } from "@/lib/csrf";

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
      return NextResponse.json(
        { success: false, error: "Invalid CSRF token" },
        { status: 403 }
      );
    }
  }
  
  const supabase = await createClient()
  
  // Get current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    )
  }

  try {
    const body = await request.json().catch(() => null)
    
    if (!body) {
      return NextResponse.json(
        { success: false, error: "Request body is required" },
        { status: 400 }
      )
    }

    const validationResult = ChatRequestSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Invalid request body",
          details: validationResult.error.issues 
        },
        { status: 400 }
      )
    }

    const { message, session_id } = validationResult.data

    // Get or create session
    let sessionId = session_id
    if (!sessionId) {
      const { data: session } = await supabase
        .from('ai_mentor_sessions')
        .insert({
          user_id: user.id,
          title: message.slice(0, 50) + (message.length > 50 ? '...' : ''),
          status: 'active',
        })
        .select()
        .single()
      sessionId = session?.id
    }

    // Save user message
    await supabase
      .from('ai_mentor_messages')
      .insert({
        session_id: sessionId,
        role: 'user',
        content: message,
      })

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
        model: 'claude-3-haiku-20240307',
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
        model: 'gpt-4-turbo-preview',
        messages: openaiMessages,
        max_tokens: 1000,
        temperature: 0.7,
      })
      
      aiResponse = response.choices[0].message?.content || 'Sorry, I could not generate a response.'
    }

    // Save AI response
    const { data: aiMessage } = await supabase
      .from('ai_mentor_messages')
      .insert({
        session_id: sessionId,
        role: 'assistant',
        content: aiResponse,
      })
      .select()
      .single()

    return NextResponse.json({
      success: true,
      data: {
        message: aiMessage,
        session_id: sessionId,
      },
    })

  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { 
        success: false, 
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    )
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
