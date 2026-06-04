/**
 * ============================================================================
 * MessageBubble — Production AI Chat Message with ai-elements Integration
 * ============================================================================
 *
 * Features:
 *  - Conversation-style alternating layout (assistant left, user right)
 *  - Reasoning collapsible for streaming "thinking" state
 *  - Sources citation display for RAG responses
 *  - Structured response rendering (idea cards, suggestions, plans)
 *  - Pulsing cursor during streaming
 *  - Glass-glow themed styling
 *  - Avatar with role-based icons
 *
 * @see {@link ../../ai-elements/reasoning.tsx} — Thinking collapsible
 * @see {@link ../../ai-elements/sources.tsx} — Source citations
 * @see {@link ../ai-mentor/ai-structured-response.tsx} — Structured data cards
 * ============================================================================
 */
'use client'

import { useMemo, useState } from 'react'
import { Bot, User, Lightbulb } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/utils/glass-variants'
import type { AIStructuredResponse, StartupIdeaAction } from '@/types/ai-responses'
import { isAIStructuredResponse } from '@/types/ai-responses'
import { AIStructuredResponse as StructuredResponseRenderer } from '@/components/features/ai-mentor/ai-structured-response'

import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from '@/components/ai-elements/reasoning'
import {
  Sources,
  SourcesTrigger,
  SourcesContent,
  Source,
} from '@/components/ai-elements/sources'
import {
  Plan,
  PlanHeader,
  PlanTitle,
  PlanDescription,
  PlanContent,
  PlanTrigger,
} from '@/components/ai-elements/plan'
import { Suggestions, Suggestion } from '@/components/ai-elements/suggestion'
import { StartupPlanGenerator } from '@/components/features/ai-mentor/startup-plan-generator'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'

interface Message {
  role: 'user' | 'assistant'
  content: string
  structured?: AIStructuredResponse
}

interface MessageBubbleProps {
  message: Message
  isStreaming?: boolean
  onSuggestionClick?: (suggestion: string) => void
  onIdeaAction?: (ideaId: number, action: StartupIdeaAction) => void
  sessionId?: string
  userId?: string
}

/** Get a preview of reasoning steps from structured data */
function getReasoningSteps(data: AIStructuredResponse | null): string[] {
  if (!data?.message) return []
  // Extract bullet points and numbered steps as reasoning steps
  const steps = data.message
    .split('\n')
    .filter(line => /^[-*\d.]/.test(line.trim()))
    .slice(0, 5)
  return steps
}

/** Check if content looks like a plan */
function isPlanContent(steps: string[]): boolean {
  return steps.length >= 3
}

export function MessageBubble({ message, isStreaming, onSuggestionClick, onIdeaAction, sessionId, userId }: MessageBubbleProps) {
  const isAssistant = message.role === 'assistant'
  const [reasoningOpen, setReasoningOpen] = useState(isStreaming)

  const structuredData = useMemo<AIStructuredResponse | null>(() => {
    if (message.structured) return message.structured
    if (!isAssistant) return null
    try {
      const parsed = JSON.parse(message.content)
      return isAIStructuredResponse(parsed) ? parsed : null
    } catch {
      return null
    }
  }, [message.content, message.structured, isAssistant])

  const displayContent = structuredData ? structuredData.message : message.content
  const reasoningSteps = getReasoningSteps(structuredData)
  const hasReasoning = reasoningSteps.length > 0 && isStreaming

  // Extract source URLs from content, filtering out URLs inside code blocks to avoid false positives
  const displayWithoutCodeBlocks = displayContent.replace(/```[\s\S]*?```/g, '')
  const sourceUrls = displayWithoutCodeBlocks.match(/https?:\/\/[^\s)]+/g)?.slice(0, 5) ?? []

  return (
    <div className={cn(
      'flex gap-2 md:gap-2.5 max-w-[90%] md:max-w-[80%] transition-colors',
      isAssistant ? 'self-start' : 'self-end flex-row-reverse',
    )}>
      {/* Avatar */}
      <Avatar className={cn(
        'h-6 w-6 md:h-7 md:w-7 mt-1 shrink-0 border',
        isAssistant ? '' : 'border-primary/30',
      )}>
        {isAssistant ? (
          <AvatarFallback className="bg-primary/10 text-primary text-[10px]">
            <Bot className="h-3 w-3 md:h-3.5 md:w-3.5" />
          </AvatarFallback>
        ) : (
          <AvatarFallback className="bg-primary/20 text-primary text-[10px]">
            <User className="h-3 w-3 md:h-3.5 md:w-3.5" />
          </AvatarFallback>
        )}
      </Avatar>

      {/* Content column */}
      <div className="flex-1 min-w-0 space-y-2">
        {/* REASONING — Collapsible thinking section while streaming */}
        {isAssistant && hasReasoning && (
          <Reasoning
            isStreaming={isStreaming}
            open={reasoningOpen}
            onOpenChange={setReasoningOpen}
            duration={0}
          >
            <ReasoningTrigger getThinkingMessage={(streaming) =>
              streaming
                ? <span className="text-xs">Analyzing your request...</span>
                : <span className="text-xs">Completed analysis</span>
            } />
            <ReasoningContent>
              {reasoningSteps.map((s, i) => `${i + 1}. ${s.replace(/^[-*\d.]+\s*/, '')}`).join('\n')}
            </ReasoningContent>
          </Reasoning>
        )}

        {/* PLAN — Expandable action plan for structured responses with steps */}
        {isAssistant && structuredData && isPlanContent(reasoningSteps) && (
          <Plan defaultOpen={false}>
            <PlanHeader>
              <div className="flex items-center gap-2">
                <Lightbulb className="size-4 text-primary" />
                <PlanTitle>Action Plan</PlanTitle>
              </div>
              <PlanTrigger />
            </PlanHeader>
            <PlanDescription>
              {structuredData.suggestions?.length
                ? `${structuredData.suggestions.length} suggested actions`
                : 'Steps to get started'}
            </PlanDescription>
            <PlanContent>
              <div className="space-y-2 text-sm">
                {reasoningSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2 text-muted-foreground">
                    <span className="text-primary font-mono text-xs mt-0.5">{i + 1}.</span>
                    <span>{step.replace(/^[-*\d.]+\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </PlanContent>
          </Plan>
        )}

        {/* Main bubble content */}
        <div className={cn(
          'rounded-2xl px-3.5 py-2 md:px-4 md:py-2.5 text-sm leading-relaxed',
          isAssistant
            ? cn('bg-card/90 border border-border/40 text-card-foreground shadow-sm rounded-bl-md', glass('bubble'))
            : 'bg-primary/10 border border-primary/20 text-foreground rounded-br-md',
        )}>
          {isAssistant ? (
            <div className="break-words overflow-x-auto">
              {isStreaming && !displayContent ? (
                <span className="text-muted-foreground italic">Thinking...</span>
              ) : displayContent ? (
                <MarkdownRenderer content={displayContent} />
              ) : (
                <span className="text-muted-foreground/50 italic">...</span>
              )}
              {isStreaming && displayContent && (
                <span className="inline-block ml-0.5 w-1.5 h-3.5 bg-foreground/60 animate-pulse rounded-sm align-text-bottom" />
              )}
            </div>
          ) : (
            /* User messages stay as plain text (no markdown) */
            <div className="whitespace-pre-wrap break-words">
              {displayContent}
            </div>
          )}
        </div>

        {/* SOURCES — Citation links for non-structured responses with detected URLs */}
        {/* Only shown for plain-text responses (no structured data) and excludes URLs inside code blocks */}
        {isAssistant && sourceUrls.length > 0 && !structuredData && (
          <Sources>
            <SourcesTrigger count={sourceUrls.length} />
            <SourcesContent>
              {sourceUrls.map((url, i) => (
                <Source key={i} href={url} title={url.length > 50 ? url.slice(0, 50) + '...' : url} />
              ))}
            </SourcesContent>
          </Sources>
        )}

        {/* Startup idea cards — shown for --IDEA-- markers in plain text or structuredData with ideas */}
        {isAssistant && (
          displayContent.includes('--IDEA--') || (structuredData?.ideas && structuredData.ideas.length > 0)
        ) && (
          <StartupPlanGenerator
            text={displayContent}
            sessionId={sessionId}
            isStreaming={isStreaming}
            userId={userId}
          />
        )}

        {/* Structured data (idea cards, suggestions) rendered below assistant bubbles */}
        {isAssistant && structuredData && (
          <StructuredResponseRenderer
            data={structuredData}
            onSuggestionClick={onSuggestionClick}
            onIdeaAction={onIdeaAction}
          />
        )}

        {/* Suggestion chips from structured data */}
        {isAssistant && structuredData?.suggestions && structuredData.suggestions.length > 0 && onSuggestionClick && (
          <div className="pt-1">
            <Suggestions>
              {structuredData.suggestions.slice(0, 4).map((s) => (
                <Suggestion key={s} suggestion={s} onClick={onSuggestionClick} />
              ))}
            </Suggestions>
          </div>
        )}
      </div>
    </div>
  )
}
