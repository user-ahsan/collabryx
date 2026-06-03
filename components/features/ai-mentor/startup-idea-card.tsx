'use client'

import { memo, useState } from 'react'
import { motion } from 'motion/react'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/utils/glass-variants'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Target,
  Lightbulb,
  Users,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Maximize2,
  TrendingUp,
  GitBranch,
  ShieldCheck,
  Star,
} from 'lucide-react'
import type { StartupIdea, StartupIdeaAction, NicheScore } from '@/types/ai-responses'

const ACTION_LABELS: Record<StartupIdeaAction, string> = {
  validate: 'Validate Idea',
  find_cofounder: 'Find Co-founder',
  market_research: 'Market Research',
  build_mvp: 'Build MVP',
  competitor_analysis: 'Competitor Analysis',
  fundraising: 'Fundraising',
  team_building: 'Team Building',
  customer_interviews: 'Customer Interviews',
}

const DIFFICULTY_STYLES: Record<string, string> = {
  easy: 'bg-green-500/10 text-green-600 border-green-500/20',
  moderate: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  hard: 'bg-red-500/10 text-red-600 border-red-500/20',
}

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  moderate: 'Moderate',
  hard: 'Hard',
}

const SECTIONS = [
  { icon: Target, label: 'Problem', key: 'problem' },
  { icon: Lightbulb, label: 'Solution', key: 'solution' },
  { icon: Users, label: 'Target Market', key: 'target_market' },
  { icon: Sparkles, label: 'Why You', key: 'why_you' },
]

const SCORE_META: { key: keyof NicheScore; label: string; icon: typeof TrendingUp; color: string }[] = [
  { key: 'market_fit', label: 'Market Fit', icon: TrendingUp, color: 'text-blue-500' },
  { key: 'skill_match', label: 'Skill Match', icon: GitBranch, color: 'text-emerald-500' },
  { key: 'feasibility', label: 'Feasibility', icon: ShieldCheck, color: 'text-amber-500' },
  { key: 'uniqueness', label: 'Uniqueness', icon: Star, color: 'text-purple-500' },
]

interface StartupIdeaCardProps {
  idea: StartupIdea
  index: number
  onAction?: (ideaId: number, action: StartupIdeaAction) => void
}

function scoreColor(value: number): string {
  if (value >= 80) return 'text-green-500'
  if (value >= 50) return 'text-yellow-500'
  return 'text-red-500'
}

function scoreBg(value: number): string {
  if (value >= 80) return 'bg-green-500'
  if (value >= 50) return 'bg-yellow-500'
  return 'bg-red-500'
}

/** Internal card content that can be shared between card and dialog */
function IdeaContent({
  idea,
  index,
  expanded,
  onAction,
}: {
  idea: StartupIdea
  index: number
  expanded: boolean
  onAction?: (ideaId: number, action: StartupIdeaAction) => void
}) {
  const displaySections = expanded ? SECTIONS : SECTIONS.slice(0, 2)
  const hasWhyYouTwo = idea.why_you_two && idea.why_you_two.length > 0
  const hasNicheScore = idea.niche_score !== undefined

  return (
    <>
      {/* Top bar */}
      <div className="flex items-center gap-2 mb-2">
        <Badge
          variant="outline"
          className={cn(DIFFICULTY_STYLES[idea.difficulty], 'mr-auto')}
        >
          {DIFFICULTY_LABELS[idea.difficulty]}
        </Badge>
        {hasNicheScore && (
          <span className={cn('text-sm font-bold tabular-nums', scoreColor(idea.niche_score!.overall))}>
            {idea.niche_score!.overall}/100
          </span>
        )}
        <span className="text-xs text-muted-foreground tabular-nums">
          #{index + 1}
        </span>
      </div>

      {/* Title & Tagline */}
      <h3 className="text-lg font-semibold leading-tight">{idea.title}</h3>
      <p className="text-sm text-muted-foreground mb-3 leading-snug">{idea.tagline}</p>

      {/* Sections */}
      {displaySections.map(({ icon: Icon, label, key }) => (
        <div key={key} className="mb-2.5">
          <h4
            className={cn(
              'text-xs font-semibold uppercase tracking-wider',
              'text-muted-foreground flex items-center gap-1.5'
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" />
            {label}
          </h4>
          <p className="text-sm ml-5 leading-relaxed">
            {idea[key as keyof StartupIdea] as string}
          </p>
        </div>
      ))}

      {/* why_you_two - only shown when expanded */}
      {expanded && hasWhyYouTwo && (
        <div className="mb-2.5">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
            <Users className="h-3.5 w-3.5" />
            Why You Two
          </h4>
          <p className="text-sm ml-5 leading-relaxed text-primary/80">
            {idea.why_you_two}
          </p>
        </div>
      )}

      {/* Scoring breakdown - only in expanded view */}
      {expanded && hasNicheScore && (
        <div className={cn('mt-3 p-3 rounded-lg border', glass('overlay'))}>
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <TrendingUp className="h-3.5 w-3.5" />
            Scoring Breakdown
          </h4>
          <div className="space-y-2">
            {SCORE_META.map(({ key, label, icon: Icon, color }) => {
              const value = idea.niche_score![key]
              return (
                <div key={key}>
                  <div className="flex items-center justify-between text-xs mb-0.5">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Icon className={cn('h-3 w-3', color)} />
                      {label}
                    </span>
                    <span className={cn('font-bold', scoreColor(value))}>
                      {value}/100
                    </span>
                  </div>
                  <div className="h-1.5 bg-muted-foreground/20 rounded-full overflow-hidden">
                    <div
                      className={cn('h-full rounded-full transition-all duration-500', scoreBg(value))}
                      style={{ width: `${value}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {onAction && idea.actions.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mt-3">
          {idea.actions.map((action: StartupIdeaAction) => (
            <Button
              key={`${idea.id}-${action}`}
              type="button"
              size="sm"
              variant="outline"
              className={glass('buttonGhost')}
              aria-label={`Start ${ACTION_LABELS[action]}`}
              onClick={() => onAction(idea.id, action)}
            >
              {ACTION_LABELS[action]}
            </Button>
          ))}
        </div>
      )}
    </>
  )
}

export const StartupIdeaCard = memo(function StartupIdeaCard({
  idea,
  index,
  onAction,
}: StartupIdeaCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)

  const hasNicheScore = idea.niche_score !== undefined

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.08, duration: 0.3 }}
        className={cn(
          glass('card'),
          'rounded-xl overflow-hidden transition-all duration-200',
          'hover:shadow-md hover:-translate-y-0.5',
          expanded && 'shadow-md',
        )}
      >
        <Card className="border-0 shadow-none bg-transparent">
          <CardContent className="p-5">
            <IdeaContent idea={idea} index={index} expanded={expanded} onAction={onAction} />

            {/* Expand / Full View controls */}
            <div className="flex items-center gap-2 mt-3 pt-2 border-t border-border/40">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn('text-xs gap-1 h-7 px-2', glass('buttonGhost'))}
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    <ChevronUp className="h-3.5 w-3.5" />
                    Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3.5 w-3.5" />
                    {hasNicheScore ? 'Details & Scores' : 'More Details'}
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className={cn('text-xs gap-1 h-7 px-2 ml-auto', glass('buttonGhost'))}
                onClick={() => setDetailOpen(true)}
              >
                <Maximize2 className="h-3 w-3" />
                Full View
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Full Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {idea.title}
              <Badge
                variant="outline"
                className={cn(DIFFICULTY_STYLES[idea.difficulty], 'ml-2')}
              >
                {DIFFICULTY_LABELS[idea.difficulty]}
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-base">{idea.tagline}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 mt-2">
            {/* Full scoring in dialog */}
            {hasNicheScore && (
              <div className={cn('p-4 rounded-lg border', glass('overlay'))}>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  Niche Score: <span className={cn('text-lg font-bold', scoreColor(idea.niche_score!.overall))}>{idea.niche_score!.overall}/100</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {SCORE_META.map(({ key, label, icon: Icon, color }) => {
                    const value = idea.niche_score![key]
                    return (
                      <div key={key}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Icon className={cn('h-3.5 w-3.5', color)} />
                            {label}
                          </span>
                          <span className={cn('font-bold', scoreColor(value))}>{value}/100</span>
                        </div>
                        <div className="h-2 bg-muted-foreground/20 rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', scoreBg(value))}
                            style={{ width: `${value}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* All sections in full */}
            {SECTIONS.map(({ icon: Icon, label, key }) => (
              <div key={key}>
                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Icon className="h-4 w-4 text-primary" />
                  {label}
                </h4>
                <p className="text-sm text-foreground/80 ml-6 mt-1 leading-relaxed">
                  {idea[key as keyof StartupIdea] as string}
                </p>
              </div>
            ))}

            {idea.why_you_two && idea.why_you_two.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                  <Users className="h-4 w-4 text-primary" />
                  Why You Two
                </h4>
                <p className="text-sm text-primary/80 ml-6 mt-1 leading-relaxed">
                  {idea.why_you_two}
                </p>
              </div>
            )}

            {/* Full actions */}
            {onAction && idea.actions.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-border/40">
                {idea.actions.map((action: StartupIdeaAction) => (
                  <Button
                    key={`dialog-${idea.id}-${action}`}
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setDetailOpen(false)
                      onAction(idea.id, action)
                    }}
                  >
                    {ACTION_LABELS[action]}
                  </Button>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
})
