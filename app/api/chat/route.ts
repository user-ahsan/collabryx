import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge"

export const dynamic = "force-dynamic"

const ChatRequestSchema = z.object({
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long (max 2000 characters)"),
  conversation_id: z.string().uuid().optional(),
  context: z.object({
    page: z.string().optional(),
    user_action: z.string().optional(),
  }).optional(),
})

export async function POST(request: NextRequest) {
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

    const { message, conversation_id, context } = validationResult.data

    return NextResponse.json({
      success: true,
      data: {
        message: "Chat API is under development",
        conversation_id,
        context,
        user_message: message,
      },
      note: "Full chat functionality coming soon with AI mentor integration"
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
  return NextResponse.json({
    status: "operational",
    version: "1.0.0",
    note: "Chat API under development"
  })
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  })
}
