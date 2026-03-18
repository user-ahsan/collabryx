/**
 * AI Mentor Message API Route
 * Proxies requests to Python worker for AI mentor responses
 */

import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getBackendConfig } from "@/lib/config/backend";

export const dynamic = "force-dynamic";

const MentorMessageRequestSchema = z.object({
  user_id: z.string().uuid("Invalid user ID format"),
  message: z.string().min(1, "Message cannot be empty").max(2000, "Message too long (max 2000 characters)"),
  session_id: z.string().uuid().optional().nullable(),
});

export interface MentorMessageResponse {
  response: string;
  action_items: Array<{ task: string; priority: string }>;
  session_id: string;
  message_id?: string;
  suggested_next_steps: string[];
  error?: string;
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    
    const validationResult = MentorMessageRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { 
          error: "Invalid request body",
          details: validationResult.error.errors 
        },
        { status: 400 }
      );
    }

    // Verify user can only access their own data
    if (validationResult.data.user_id !== user.id) {
      return NextResponse.json(
        { error: "Cannot access other users' data" },
        { status: 403 }
      );
    }

    const backendConfig = await getBackendConfig();
    
    if (!backendConfig.endpoint) {
      // Fallback: Predefined helpful responses
      const fallbackResult = fallbackMentorResponse(validationResult.data.message);
      return NextResponse.json(fallbackResult);
    }

    // Call Python worker
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout for AI
    
    const workerResponse = await fetch(`${backendConfig.endpoint}/api/ai-mentor/message`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(validationResult.data),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    if (!workerResponse.ok) {
      throw new Error(`Python worker error: ${workerResponse.status}`);
    }
    
    const data: MentorMessageResponse = await workerResponse.json();
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("AI Mentor API error:", error);
    
    // Fallback to predefined responses
    const fallbackResult = fallbackMentorResponse(request.body ? String(request.body) : "");
    fallbackResult.error = "Using fallback response (service unavailable)";
    
    return NextResponse.json(fallbackResult);
  }
}

/**
 * Fallback AI mentor responses
 * Used when Python worker is unavailable
 */
function fallbackMentorResponse(message: string): MentorMessageResponse {
  const lowerMessage = message.toLowerCase();
  
  // Simple keyword-based responses
  let response = "Thank you for reaching out! I'm here to help you with your career and project goals.";
  const action_items: Array<{ task: string; priority: string }> = [];
  const suggested_next_steps: string[] = [];
  
  if (lowerMessage.includes('career') || lowerMessage.includes('job')) {
    response = "I'd be happy to help with your career goals! Here are some suggestions:\n\n" +
      "1. **Update your profile** - Make sure your skills and experience are up to date\n" +
      "2. **Explore matches** - Check out potential collaborators in your field\n" +
      "3. **Join projects** - Look for projects that align with your career interests\n\n" +
      "Remember, building a strong professional network takes time. Focus on quality connections!";
    
    action_items.push(
      { task: "Review and update your profile skills", priority: "high" },
      { task: "Browse match suggestions", priority: "medium" }
    );
    
    suggested_next_steps.push(
      "Complete your profile to 100%",
      "Connect with 3-5 people in your field",
      "Join a project that interests you"
    );
  } else if (lowerMessage.includes('project') || lowerMessage.includes('startup')) {
    response = "Great! Let's talk about your project ideas. Here's my advice:\n\n" +
      "1. **Validate your idea** - Talk to potential users first\n" +
      "2. **Build a MVP** - Start small and iterate\n" +
      "3. **Find the right team** - Look for complementary skills\n\n" +
      "The key to a successful startup is solving a real problem for real people. Focus on that!";
    
    action_items.push(
      { task: "Write down your value proposition", priority: "high" },
      { task: "Identify 3 potential team members", priority: "medium" }
    );
    
    suggested_next_steps.push(
      "Create a project post to attract collaborators",
      "Research similar projects in your space",
      "Define your MVP scope"
    );
  } else if (lowerMessage.includes('skill') || lowerMessage.includes('learn')) {
    response = "Learning new skills is essential! Here's how to approach it:\n\n" +
      "1. **Start with fundamentals** - Master the basics first\n" +
      "2. **Build projects** - Apply what you learn immediately\n" +
      "3. **Get feedback** - Share your work and iterate\n\n" +
      "Consistency is key. Even 30 minutes a day can lead to significant progress!";
    
    action_items.push(
      { task: "Set a learning goal for this week", priority: "high" },
      { task: "Find a project to apply your skills", priority: "medium" }
    );
    
    suggested_next_steps.push(
      "Add new skills to your profile",
      "Find a mentor in that skill area",
      "Join a related project"
    );
  } else {
    // Generic helpful response
    response = "Thanks for sharing! I'm here to support your journey. Here are some general tips:\n\n" +
      "1. **Stay active** - Regular engagement helps you get noticed\n" +
      "2. **Be specific** - Clear goals attract the right collaborators\n" +
      "3. **Give back** - Help others and they'll help you\n\n" +
      "Feel free to ask me anything about your career, projects, or skill development!";
    
    action_items.push(
      { task: "Review your profile completeness", priority: "medium" },
      { task: "Explore potential matches", priority: "low" }
    );
    
    suggested_next_steps.push(
      "Update your headline and bio",
      "Add more skills to your profile",
      "Browse the dashboard for opportunities"
    );
  }
  
  return {
    response,
    action_items,
    session_id: "",
    message_id: undefined,
    suggested_next_steps,
  };
}

// Handle CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Authorization, Content-Type",
    },
  });
}
