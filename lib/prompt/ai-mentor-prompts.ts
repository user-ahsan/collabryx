/**
 * ============================================================================
 * AI Mentor Prompts — Hybrid Mentorship + Startup Idea + Collaboration Mode
 * ============================================================================
 *
 * PROBLEM (from analysis: "half correct, not what a mentor is meant to be"):
 * The original prompts ONLY supported "startup idea generator" mode. Every
 * user message was funneled into a prompt that said "Your ONLY task is to
 * generate personalized startup ideas." This meant:
 *  - General career questions were ignored or shoehorned into startup ideas
 *  - Users asking "How can I improve my skills?" got business ideas instead
 *  - There was no way to ask about working with another person (connections)
 *  - The AI couldn't detect when the user was mentioning another profile
 *  - The @mention pattern ("tell me about working with @John") had no handler
 *  - Only structured JSON output was supported, no conversational responses
 *
 * Additionally, the RAG system's multiUser context (fetchMultipleUserContexts,
 * generateCollaborationSystemPrompt) existed but was NEVER triggered because
 * the frontend never passed otherUserIds. The collaboration advisor prompt
 * was dead code.
 *
 * SOLUTION:
 * Complete prompt system rewrite with THREE operating modes:
 *
 *   Mode 1 — General Mentorship:
 *   Triggered when the user asks general questions (career, skills, learning).
 *   The system prompt shifts to a conversational tone, answering thoughtfully
 *   with reference to the user's profile. Returns JSON with just "message"
 *   and "suggestions" fields (no idea cards needed).
 *
 *   Mode 2 — Startup Idea Generation:
 *   Preserved from the original but made opt-in rather than default.
 *   Detected by keywords like "startup", "idea", "build", "what should I".
 *   Returns full JSON schema with ideas array, difficulty, match_score, etc.
 *
 *   Mode 3 — Collaboration / Connection Mention:
 *   NEW — triggered by @mentions, "connect with", "work with", "collaborate",
 *   "how to start with" patterns in the user message. When detected AND there
 *   are retrieved_contexts with profile data, the system builds an ad-hoc
 *   collaboration prompt that references the mentioned person's profile and
 *   suggests startup ideas leveraging BOTH skill sets, plus icebreakers for
 *   reaching out. This finally activates the dead multiUser RAG code.
 *
 *   The default prompt now describes all three modes and tells the LLM to
 *   pick the right one based on the user's message. The output format
 *   instruction tells it which JSON schema to use based on the mode.
 *
 * @see {@link ../rag/startup-prompts.ts} — specialized prompts for startup + collab
 * @see {@link ../rag/context-assembler.ts} — assembles the context passed here
 * ============================================================================
 */
import type { ExtendedRAGContext, AIMessage } from '@/lib/rag/types'
import { generateStartupSystemPrompt, generateCollaborationSystemPrompt } from '@/lib/rag/startup-prompts'

export function buildEnhancedSystemPrompt(
  context: ExtendedRAGContext,
  userMessage: string
): string {
  // Check if this is a startup planning scenario
  if (context.startup) {
    const startupPrompt = generateStartupSystemPrompt(context.profile, context.startup)
    return appendCommonContext(startupPrompt, context, userMessage)
  }

  // Check if this is a collaboration / connection-mention scenario
  if (context.multiUser && context.multiUser.otherUsers.length > 0) {
    const collabPrompt = generateCollaborationSystemPrompt(
      context.multiUser.currentUser,
      context.multiUser.otherUsers
    )
    return appendCommonContext(collabPrompt, context, userMessage)
  }

  // Detect if user is asking about another person / connection
  const userMsgLower = userMessage.toLowerCase()
  const hasMentionPattern = /\@(\w+)/.test(userMessage) ||
    userMsgLower.includes('connect with') ||
    userMsgLower.includes('work with') ||
    userMsgLower.includes('collaborate with') ||
    userMsgLower.includes('mentor') ||
    userMsgLower.includes('how to start with') ||
    userMsgLower.includes('partner with')

  if (hasMentionPattern && context.retrieved_contexts && context.retrieved_contexts.length > 0) {
    // Build an ad-hoc collaboration prompt using retrieved profiles
    const firstProfile = context.retrieved_contexts[0]
    const profileName = firstProfile.metadata?.display_name || 'this person'

    return appendCommonContext(
      `You are Collabryx Collaboration Advisor. The user is asking about connecting with "${profileName}".

## Your Role
Analyze how ${profileName} and the current user could collaborate. Focus on:
1. **Skill complementarity** — what each person brings
2. **Shared interests** — common ground for a project
3. **Startup ideas** — business ideas that leverage BOTH people's combined skills
4. **Icebreakers** — specific conversation starters to reach out
5. **Collaboration format** — co-founder, freelancer, advisor, or mentor relationship

## Response Style
- Be specific and reference actual skills/interests from both profiles
- Suggest 1-2 concrete startup ideas that need BOTH skill sets
- Give actionable "next step" advice for reaching out`,
      context,
      userMessage
    )
  }

  // Default: General mentorship + startup idea generation (hybrid mode)
  return buildDefaultMentorPrompt(context, userMessage)
}

function appendCommonContext(basePrompt: string, context: ExtendedRAGContext, userMessage: string): string {
  const parts: string[] = [basePrompt]

  if (context.retrieved_contexts && context.retrieved_contexts.length > 0) {
    parts.push(`## RELEVANT PEOPLE & KNOWLEDGE
${context.retrieved_contexts
  .map((c, i) => `${i + 1}. ${c.content} (relevance: ${(c.score * 100).toFixed(0)}%)`)
  .join('\n')}`)
  }

  if (context.session_summary) {
    parts.push(`## SESSION HISTORY
${context.session_summary.summary_text}
Previous action items: ${context.session_summary.action_items?.join(', ') || 'None'}`)
  }

  if (context.conversation_history && context.conversation_history.length > 0) {
    const historyPreview = context.conversation_history
      .slice(-6)
      .map((m: AIMessage) => {
        const truncated = m.content.length > 200 ? m.content.substring(0, 200) + '...' : m.content
        return `${m.role}: ${truncated}`
      })
      .join('\n')
    parts.push(`## CONVERSATION HISTORY\n${historyPreview}`)
  }

  parts.push(`## CURRENT MESSAGE
User: ${userMessage}`)

  return parts.join('\n\n')
}

function buildDefaultMentorPrompt(context: ExtendedRAGContext, userMessage: string): string {
  const outputSchema = `{"message":"Your response text","ideas":[{"id":1,"title":"Startup name","tagline":"Value proposition","problem":"Problem it solves","solution":"How it solves it","target_market":"Who it serves","why_you":"Why this matches their skills","difficulty":"easy","actions":["validate","market_research","build_mvp"]}],"suggestions":["Follow-up 1","Follow-up 2","Follow-up 3"],"profile_match":{"skills_used":["skill1","skill2"],"interests_addressed":["interest1","interest2"],"match_score":85}}`

  const parts: string[] = []

  parts.push(`You are Collabryx AI Mentor — a hybrid mentorship and startup idea generator. Your role is to help users with ANY question about their career, startup ideas, skill development, or collaboration opportunities.

## Your Capabilities
You operate in TWO modes depending on what the user asks:

### Mode 1: General Mentorship
When the user asks general questions (career advice, skill questions, learning paths, industry insights, feedback on ideas):
- Answer thoughtfully and conversationally
- Be specific and reference their profile data when available
- Ask follow-up questions to dig deeper
- End with 2-3 suggestion chips for next steps
- Return a JSON response with just "message" and "suggestions" fields

### Mode 2: Startup Idea Generation
When the user asks for startup ideas, business suggestions, or "what should I build":
- Generate 2-3 specific, actionable startup ideas
- Each idea must reference specific skills from their profile
- Cover different categories when possible
- Include actionable next steps
- Return the FULL JSON schema with ideas array

### Mode 3: Collaboration / People
When the user mentions working with someone, "@mentions" someone, or asks about connections:
- Reference both profiles' skills
- Suggest startup ideas using BOTH skill sets
- Give specific advice about reaching out

## Rules
- Return ONLY valid JSON — no markdown, no code fences, no explanatory text outside the JSON
- If the user asks a follow-up question, stay in the same mode
- Keep responses concise but helpful
- NEVER make up profile data — say "I don't have that info" if missing
- The "suggestions" array should always have 3-5 items
- If generating ideas, "match_score" must be 0-100`)

  if (context.profile) {
    const profile = context.profile
    parts.push(`## USER PROFILE
Name: ${profile.display_name}
Headline: ${profile.headline || 'Not specified'}
Looking for: ${profile.looking_for?.join(', ') || 'Not specified'}
Skills: ${profile.skills?.map(s => s.skill_name).join(', ') || 'None listed'}
Interests: ${profile.interests?.map(i => i.interest).join(', ') || 'None listed'}
Career Level: ${profile.career_level || 'Not specified'}
Location: ${profile.location || 'Not specified'}`)
  }

  if (context.retrieved_contexts && context.retrieved_contexts.length > 0) {
    parts.push(`## RELEVANT PEOPLE (potential collaborators)
${context.retrieved_contexts
  .map((c, i) => `${i + 1}. ${c.content} (relevance: ${(c.score * 100).toFixed(0)}%)`)
  .join('\n')}`)
  }

  if (context.session_summary) {
    parts.push(`## SESSION HISTORY
${context.session_summary.summary_text}
Previous action items: ${context.session_summary.action_items?.join(', ') || 'None'}`)
  }

  parts.push(`## OUTPUT FORMAT
You MUST respond with ONLY a valid JSON object. No markdown, no code fences, no text outside the JSON.

For startup ideas, use this schema:
${outputSchema}

For general chat / mentorship (no ideas), use:
{"message":"Your helpful response","suggestions":["Follow-up 1","Follow-up 2","Follow-up 3"]}

The "actions" array must use values from: validate, find_cofounder, market_research, build_mvp, competitor_analysis, fundraising, team_building, customer_interviews.
The "difficulty" field must be exactly "easy", "moderate", or "hard".`)

  if (context.conversation_history && context.conversation_history.length > 0) {
    const historyPreview = context.conversation_history
      .slice(-6)
      .map((m: AIMessage) => {
        const truncated = m.content.length > 200 ? m.content.substring(0, 200) + '...' : m.content
        return `${m.role}: ${truncated}`
      })
      .join('\n')
    parts.push(`## CONVERSATION HISTORY\n${historyPreview}`)
  }

  parts.push(`## USER REQUEST\n${userMessage}`)

  return parts.join('\n\n')
}

export function buildFallbackSystemPrompt(): string {
  return `You are Collabryx AI Mentor. Help the user with startup ideas, career advice, or collaboration suggestions.

IMPORTANT: Return ONLY a valid JSON object with this structure (no markdown, no code fences):
{"message":"Your response here","suggestions":["Suggestion 1","Suggestion 2","Suggestion 3"]}

If you cannot access user profile data, ask them about their skills and interests to generate personalized ideas.`
}
