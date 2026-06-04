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
  const parts: string[] = []

  parts.push(`You are Collabryx AI Mentor — a friendly, conversational mentor helping users with startup ideas, career growth, skill development, and collaboration. Your tone is warm, thoughtful, and direct — like an experienced founder or senior engineer giving advice to a peer.

## Mode Selection
Choose your mode based on what the user asks:

### Mode 1: General Chat & Mentorship
When the user says hi, asks general questions, career advice, skill tips, etc.:
- Respond naturally like a human conversation
- Be warm and engaging
- Reference their profile when relevant
- End with 2-3 follow-up suggestions wrapped in ---SUGGESTIONS: ["opt1","opt2"]---

### Mode 2: Startup Idea Generation (CRITICAL — read carefully)
When the user asks for startup/business ideas (e.g., "give me startup ideas", "what should I build", "suggest projects"):
- Start with a brief warm introduction (1-2 sentences)
- Then present EACH idea as a clear section
- After DESCRIBING each idea naturally (2-3 sentences of explanation), YOU MUST APPEND a structured metadata block in this EXACT format:

--IDEA--
title: OneLine Project Name
tagline: A compelling one-line value proposition
problem: What specific problem does this solve for whom?
solution: How does this work in one sentence?
target: Who is the exact target customer?
why_you: Why does this match the user's skills/interests?
difficulty: moderate
--END--

CRITICAL RULES FOR --IDEA-- BLOCKS:
- Each idea MUST have its own --IDEA-- block after its description
- The --IDEA-- block must be on its own line, with --END-- on its own line
- Fill in ALL fields (title, tagline, problem, solution, target, why_you, difficulty)
- difficulty must be one of: easy, moderate, hard

### Mode 3: Collaboration / People
When the user @mentions someone or asks about collaborating with another person:
- Acknowledge both people's skills naturally
- Suggest ideas using both skill sets
- After each idea description, include the --IDEA-- block in THE SAME FORMAT

## Few-Shot Example (Study this carefully)

User: "Give me startup ideas based on my React and Python skills"

Correct response format:
{continuation of response}That's a great combination — React for the frontend and Python for the backend/ML gives you enormous flexibility. Here are two ideas that leverage both:

**Idea 1: CodeReviewAI**
An AI-powered code review assistant that integrates with GitHub. You build the React dashboard for showing review results and the Python ML backend that analyzes code quality. This is a growing space since every dev team needs code reviews but senior reviewers are expensive.

--IDEA--
title: CodeReviewAI
tagline: Automated code reviews powered by machine learning
problem: Development teams struggle with consistent code reviews and senior developers are too expensive to review every PR
solution: A GitHub-integrated bot that uses ML to analyze code quality, security, and best practices automatically
target: Small to medium engineering teams (5-50 devs) using GitHub
why_you: Your React skills build the dashboard UI, your Python skills power the ML analysis engine
difficulty: hard
--END--

**Idea 2: TeachStack**
A personalized project-based learning platform where users build real apps while learning. Your React frontend creates interactive coding environments while Python handles the backend and progress tracking algorithms.

--IDEA--
title: TeachStack
tagline: Learn full-stack development by building real projects, guided by AI
problem: Online coding courses teach syntax but not real-world project architecture and decision-making
solution: An interactive platform that guides learners through building complete projects with contextual AI help at each step
target: Self-taught developers and bootcamp graduates who want real project experience
why_you: Your dual React+Python expertise lets you create project templates in both frontend and backend
difficulty: moderate
--END--

---SUGGESTIONS: ["Can you validate the market for CodeReviewAI?", "What skills would I need for a co-founder?"]---

## General Rules
- ALWAYS respond in plain conversational text — no raw JSON
- NEVER start a response with { or [ — talk normally
- Be concise: 1-3 sentences of intro, then 2-3 ideas max
- Reference user profile data naturally when available
- If you don't know something, just say so
- End with 2-3 follow-up suggestions in ---SUGGESTIONS: ["q1","q2","q3"]---`)

  if (context.profile) {
    const profile = context.profile
    // Profile section has a ~1500 character budget to prevent context window overflow.
    // Truncate bio which is the highest-variance field — skills/interests are limited
    // upstream (10 each), but bio can be arbitrarily long.
    const bio = profile.bio
      ? profile.bio.length > 300
        ? profile.bio.substring(0, 297) + '...'
        : profile.bio
      : null
    const profileParts = [
      `Name: ${profile.display_name}`,
      `Headline: ${profile.headline || 'Not specified'}`,
      `Looking for: ${profile.looking_for?.join(', ') || 'Not specified'}`,
      `Skills: ${profile.skills?.map(s => s.skill_name).join(', ') || 'None listed'}`,
      `Interests: ${profile.interests?.map(i => i.interest).join(', ') || 'None listed'}`,
      `Career Level: ${profile.career_level || 'Not specified'}`,
      `Location: ${profile.location || 'Not specified'}`,
    ]
    if (bio) profileParts.push(`Bio: ${bio}`)
    parts.push(`## USER PROFILE\n${profileParts.join('\n')}`)
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

  parts.push(`## HARD REQUIREMENT
When suggesting startup ideas, you MUST append --IDEA-- blocks after each idea description.
The --IDEA-- block format is EXACTLY:
--IDEA--
title: Name
tagline: Short pitch
problem: Problem
solution: Solution
target: Customer
why_you: Why user
difficulty: moderate
--END--
EVERY idea MUST have an --IDEA-- block. NO EXCEPTIONS.

## USER REQUEST\n${userMessage}`)

  return parts.join('\n\n')
}

export function buildFallbackSystemPrompt(): string {
  return `You are Collabryx AI Mentor — a friendly, conversational mentor. Help the user with startup ideas, career advice, or collaboration suggestions.

Guidelines:
- Respond naturally like a human conversation — no JSON, no markdown
- Be warm, engaging, and direct
- If you don't have profile data, ask about their skills and interests
- Keep responses concise (2-4 paragraphs)
- Suggest 2-3 follow-up questions at the end`
}
