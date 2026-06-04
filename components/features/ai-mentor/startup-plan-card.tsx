/**
 * ============================================================================
 * StartupPlanCard — Clickable Card for Startup Ideas
 * ============================================================================
 *
 * Displays a startup idea as a glass-themed card with title, tagline, and
 * difficulty badge. Clicking opens the full enterprise-grade plan dialog.
 *
 * @see {@link ./startup-plan-dialog.tsx} — full detail view
 * ============================================================================
 */
'use client'

import { useState } from 'react'
import { GlassCard } from '@/components/shared/glass-card'
import { cn } from '@/lib/utils'
import { Lightbulb, ChevronRight, Sparkles } from 'lucide-react'
import { StartupPlanDialog } from './startup-plan-dialog'
import type { StartupIdea } from '@/types/ai-responses'

const difficultyConfig = {
  easy: { label: 'Beginner', class: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' },
  moderate: { label: 'Intermediate', class: 'text-amber-500 bg-amber-500/10 border-amber-500/20' },
  hard: { label: 'Advanced', class: 'text-rose-500 bg-rose-500/10 border-rose-500/20' },
} as const

interface StartupPlanCardProps {
  idea: Omit<StartupIdea, 'id'> & { id?: number }
  sessionId?: string
  isStreaming?: boolean
  userId?: string
}

export function StartupPlanCard({ idea, sessionId, isStreaming, userId }: StartupPlanCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const diff = difficultyConfig[idea.difficulty || 'moderate']

  return (
    <>
      <GlassCard
        hoverable
        glow
        className={cn(
          'group cursor-pointer transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
          isStreaming && 'animate-pulse',
        )}
        innerClassName="p-4 space-y-3"
        onClick={() => setDialogOpen(true)}
      >
        {/* Header: icon + difficulty badge */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="rounded-lg bg-primary/10 p-1.5 shrink-0">
              <Lightbulb className="h-4 w-4 text-primary" />
            </div>
            <h3 className="font-semibold text-sm leading-tight truncate">
              {idea.title || 'Untitled Idea'}
            </h3>
          </div>
          <span className={cn(
            'shrink-0 text-[10px] font-medium px-2 py-0.5 rounded-full border',
            diff.class
          )}>
            {diff.label}
          </span>
        </div>

        {/* Tagline / brief */}
        <p className="text-xs md:text-sm text-muted-foreground leading-relaxed line-clamp-2">
          {idea.tagline || idea.problem || idea.solution || 'No description'}
        </p>

        {/* Footer: actions hint */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/60">
            <Sparkles className="h-3 w-3" />
            Click to generate full plan
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-primary/60 transition-colors" />
        </div>
      </GlassCard>

      {/* Full enterprise-grade plan dialog */}
      <StartupPlanDialog
        idea={idea}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        sessionId={sessionId}
        userId={userId}
      />
    </>
  )
}
