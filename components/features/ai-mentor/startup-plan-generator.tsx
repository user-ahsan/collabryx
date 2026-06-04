/**
 * ============================================================================
 * StartupPlanGenerator — Renders startup idea cards from AI response text
 * ============================================================================
 *
 * Parses the AI's natural language response to detect startup ideas (via
 * --IDEA-- markers or heuristic patterns) and renders them as clickable
 * cards. Each card opens the full enterprise-grade plan dialog.
 *
 * The AI is instructed to wrap idea metadata in:
 *   --IDEA--
 *   title: ...
 *   tagline: ...
 *   difficulty: ...
 *   --END--
 *
 * @see {@link ./startup-plan-card.tsx}
 * @see {@link ./startup-plan-dialog.tsx}
 * ============================================================================
 */
'use client'

import { useMemo } from 'react'
import { StartupPlanCard } from './startup-plan-card'
import { cn } from '@/lib/utils'
import { Sparkles, Loader2 } from 'lucide-react'

interface ExtractedIdea {
  title: string
  tagline: string
  problem: string
  solution: string
  target_market: string
  why_you: string
  difficulty: 'easy' | 'moderate' | 'hard'
}

interface StartupPlanGeneratorProps {
  /** The AI's response text to parse for ideas */
  text: string
  sessionId?: string
  className?: string
  /** When true, shows streaming indicator on the section header */
  isStreaming?: boolean
  /** Real authenticated user ID — passed down for enterprise plan generation */
  userId?: string
}

/** Parse --IDEA-- markers from the AI response text */
function extractIdeas(text: string): ExtractedIdea[] {
  const ideas: ExtractedIdea[] = []
  const ideaRegex = /--IDEA--\s*([\s\S]*?)--END--/g
  let match

  while ((match = ideaRegex.exec(text)) !== null) {
    const block = match[1]
    const fields: Record<string, string> = {}
    
    // Parse key: value pairs
    const lineRegex = /^(\w+):\s*(.+)$/gm
    let lineMatch
    while ((lineMatch = lineRegex.exec(block)) !== null) {
      fields[lineMatch[1].toLowerCase()] = lineMatch[2].trim()
    }

    if (fields.title) {
      ideas.push({
        title: fields.title,
        tagline: fields.tagline || fields.problem?.slice(0, 100) || '',
        problem: fields.problem || '',
        solution: fields.solution || '',
        target_market: fields.target || fields.target_market || '',
        why_you: fields.why_you || fields['why-you'] || '',
        difficulty: (fields.difficulty as 'easy' | 'moderate' | 'hard') || 'moderate',
      })
    }
  }

  return ideas
}

/** Heuristic detection for startup ideas in natural text */
function heuristicDetect(text: string): ExtractedIdea[] {
  const ideas: ExtractedIdea[] = []
  const lines = text.split('\n')
  let currentIdea: Partial<ExtractedIdea> = {}

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Detect patterns like "**Idea 1:** Title" or "## Idea: Title"
    const ideaMatch = line.match(/(?:\*\*)?Idea\s*\d+\s*(?::|\.)?\s*\*{0,2}(.+?)(?:\*{0,2}\s*—?\s*)?/i)
    if (ideaMatch && currentIdea.title) {
      // Save previous idea
      if (currentIdea.title) {
        ideas.push({
          title: currentIdea.title,
          tagline: currentIdea.tagline || '',
          problem: currentIdea.problem || '',
          solution: currentIdea.solution || '',
          target_market: currentIdea.target_market || '',
          why_you: currentIdea.why_you || '',
          difficulty: currentIdea.difficulty || 'moderate',
        })
      }
      currentIdea = { title: ideaMatch[1].trim() }
      continue
    }

    // Detect "**Title** — Description" pattern
    if (!currentIdea.title) {
      const titleMatch = line.match(/^\*\*(.+?)\*\*\s*[—–-]\s*(.+)/)
      if (titleMatch) {
        currentIdea = {
          title: titleMatch[1].trim(),
          tagline: titleMatch[2].trim(),
        }
        continue
      }
    }
  }

  // Save last idea
  if (currentIdea.title) {
    ideas.push({
      title: currentIdea.title,
      tagline: currentIdea.tagline || '',
      problem: currentIdea.problem || '',
      solution: currentIdea.solution || '',
      target_market: currentIdea.target_market || '',
      why_you: currentIdea.why_you || '',
      difficulty: currentIdea.difficulty || 'moderate',
    })
  }

  return ideas
}

export function StartupPlanGenerator({ text, sessionId, className, isStreaming, userId }: StartupPlanGeneratorProps) {
  const ideas = useMemo(() => {
    // First try structured markers
    const fromMarkers = extractIdeas(text)
    if (fromMarkers.length > 0) return fromMarkers
    
    // Fall back to heuristic detection
    return heuristicDetect(text)
  }, [text])

  if (ideas.length === 0) {
    // During streaming, show a loading hint that ideas are being extracted
    if (isStreaming && text.length > 200) {
      return (
        <div className={cn('mt-3 flex items-center gap-2 text-xs text-muted-foreground/50', className)}>
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Extracting startup ideas...</span>
        </div>
      )
    }
    return null
  }

  return (
    <div className={cn('mt-3 space-y-2', className)}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground/70">
        {isStreaming ? (
          <>
            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
            <span>Startup Ideas — generating...</span>
          </>
        ) : (
          <>
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span>Startup Ideas — click to view full enterprise plan</span>
          </>
        )}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {ideas.map((idea, i) => (
          <StartupPlanCard
            key={`${idea.title}-${i}`}
            idea={{ id: i + 1, ...idea, actions: [] }}
            sessionId={sessionId}
            isStreaming={isStreaming}
            userId={userId}
          />
        ))}
      </div>
    </div>
  )
}
