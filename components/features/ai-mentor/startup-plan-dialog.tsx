/**
 * ============================================================================
 * StartupPlanDialog — Full Enterprise-Grade Startup Plan View
 * ============================================================================
 *
 * Full-screen dialog that displays a comprehensive startup plan with all
 * enterprise template sections. Content is streamed from the AI in real-time
 * when the dialog opens.
 *
 * Template Sections:
 *  1. 📌 Executive Brief & Core Architecture
 *  2. 👥 Dual-Founder Execution Matrix
 *  3. 📊 Market Dynamics & Geographic Arbitrage Financials
 *  4. 🎯 Deep Validation & Strategic Risk Scores
 *  5. 🗺️ Go-To-Market & 6-Week Sprints
 *
 * @see {@link ../../../lib/prompt/startup-plan-prompt.ts}
 * ============================================================================
 */
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { GlassCard } from '@/components/shared/glass-card'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/utils/glass-variants'
import { Loader2, X, Download, Copy, Sparkles, Lightbulb, TrendingUp, Target, Rocket, Users, BarChart3, ChevronRight, Check } from 'lucide-react'
import type { StartupIdea } from '@/types/ai-responses'

interface StartupPlanDialogProps {
  idea: Omit<StartupIdea, 'id'> & { id?: number }
  open: boolean
  onOpenChange: (open: boolean) => void
  sessionId?: string
}

const TEMPLATE_SECTIONS = [
  { id: 'executive', icon: Lightbulb, label: 'Executive Brief', color: 'text-sky-500' },
  { id: 'founders', icon: Users, label: 'Founder Matrix', color: 'text-violet-500' },
  { id: 'market', icon: BarChart3, label: 'Market Dynamics', color: 'text-emerald-500' },
  { id: 'validation', icon: Target, label: 'Validation Scores', color: 'text-amber-500' },
  { id: 'gtm', icon: Rocket, label: 'Go-To-Market', color: 'text-rose-500' },
]

export function StartupPlanDialog({ idea, open, onOpenChange, sessionId }: StartupPlanDialogProps) {
  const [planContent, setPlanContent] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const abortRef = useRef<AbortController | null>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  // Generate the full plan when dialog opens
  useEffect(() => {
    if (!open || !idea.title) return

    setPlanContent('')
    setError(null)
    setIsStreaming(true)
    setCopied(false)

    abortRef.current?.abort()
    abortRef.current = new AbortController()
    const { signal } = abortRef.current

    const generatePlan = async () => {
      try {
        const prompt = buildPlanPrompt(idea)
        const response = await fetch('/api/ai/stream', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal,
          body: JSON.stringify({
            userId: 'plan-generation', // System-level, not user-specific
            sessionId: sessionId || undefined,
            query: prompt,
            messages: [{ role: 'user', content: prompt }],
            preferredProvider: 'openrouter',
            startupContext: {
              idea: idea.title,
              stage: 'idea',
              industry: 'tech',
            },
          }),
        })

        if (!response.ok) {
          const err = await response.json().catch(() => ({}))
          throw new Error(err.error || 'Failed to generate plan')
        }

        const reader = response.body?.getReader()
        if (!reader) throw new Error('No response body')

        const decoder = new TextDecoder()
        let fullContent = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split('\n')

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6)
              if (data === '[DONE]') continue
              if (data.startsWith('{')) {
                try {
                  const parsed = JSON.parse(data)
                  if (parsed.content) {
                    fullContent += parsed.content
                    setPlanContent(fullContent)
                  }
                } catch { /* skip */ }
              }
            }
          }
        }
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setError(err instanceof Error ? err.message : 'Generation failed')
      } finally {
        setIsStreaming(false)
      }
    }

    generatePlan()

    return () => {
      abortRef.current?.abort()
    }
  }, [open, idea.title, sessionId])

  // Auto-scroll to bottom as content streams
  useEffect(() => {
    if (contentRef.current && isStreaming) {
      contentRef.current.scrollTop = contentRef.current.scrollHeight
    }
  }, [planContent, isStreaming])

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(planContent)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [planContent])

  const handleDownload = useCallback(() => {
    const blob = new Blob([planContent], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${(idea.title || 'startup-plan').replace(/\s+/g, '-').toLowerCase()}.md`
    a.click()
    URL.revokeObjectURL(url)
  }, [planContent, idea.title])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        'max-w-4xl w-[95vw] h-[85vh] max-h-[900px] p-0 gap-0',
        glass('card'),
      )}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="rounded-full bg-primary/10 p-2 shrink-0">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-semibold truncate">
                {idea.title || 'Startup Plan'}
              </DialogTitle>
              <p className="text-xs text-muted-foreground truncate">
                {idea.tagline || 'Enterprise-grade investment proposal'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="ghost" size="icon-sm" onClick={handleCopy} className={glass('buttonGhost')}>
              {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={handleDownload} className={glass('buttonGhost')}>
              <Download className="h-4 w-4" />
            </Button>
            <DialogClose className={cn(
              'flex items-center justify-center h-8 w-8 rounded-lg',
              'hover:bg-accent transition-colors',
            )}>
              <X className="h-4 w-4" />
            </DialogClose>
          </div>
        </div>

        {/* Section navigation tabs */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-border/20 bg-muted/10 overflow-x-auto shrink-0">
          {TEMPLATE_SECTIONS.map((section) => (
            <span
              key={section.id}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium',
                'text-muted-foreground/70 whitespace-nowrap',
              )}
            >
              <section.icon className={cn('h-3 w-3', section.color)} />
              {section.label}
            </span>
          ))}
        </div>

        {/* Content area */}
        <ScrollArea ref={contentRef} className="flex-1 p-6">
          {isStreaming && !planContent && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Generating your enterprise-grade plan...</p>
              <div className="flex gap-1.5 mt-2">
                {TEMPLATE_SECTIONS.map((s) => (
                  <span key={s.id} className="text-[10px] text-muted-foreground/40 animate-pulse">
                    {s.label}
                  </span>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <p className="text-sm text-destructive">{error}</p>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Close
              </Button>
            </div>
          )}

          {planContent && (
            <div className="prose prose-sm dark:prose-invert max-w-none">
              {planContent.split('\n').map((line, i) => {
                if (line.startsWith('# ')) return <h1 key={i} className="text-xl font-bold mt-6 mb-2">{line.slice(2)}</h1>
                if (line.startsWith('## ')) return <h2 key={i} className="text-lg font-semibold mt-5 mb-2 text-primary">{line.slice(3)}</h2>
                if (line.startsWith('### ')) return <h3 key={i} className="text-base font-medium mt-4 mb-1">{line.slice(4)}</h3>
                if (line.startsWith('---')) return <hr key={i} className="my-4 border-border/40" />
                if (line.startsWith('- ')) return <li key={i} className="text-sm text-muted-foreground ml-4">{line.slice(2)}</li>
                if (line.startsWith('> ')) return (
                  <blockquote key={i} className="border-l-2 border-primary/30 pl-4 my-2 text-sm italic text-muted-foreground">
                    {line.slice(2)}
                  </blockquote>
                )
                if (line.startsWith('| ')) return (
                  <pre key={i} className="text-xs font-mono text-muted-foreground/70 my-0.5">{line}</pre>
                )
                if (line.trim() === '') return <div key={i} className="h-2" />
                return <p key={i} className="text-sm leading-relaxed text-foreground/90 my-1.5">{line}</p>
              })}
            </div>
          )}

          {isStreaming && planContent && (
            <div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground/60">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              Generating...
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

/** Build the system prompt for generating a full enterprise-grade plan */
function buildPlanPrompt(idea: Omit<StartupIdea, 'id'> & { id?: number }): string {
  return `Generate a comprehensive enterprise-grade startup plan for "${idea.title || 'Untitled'}".

Context:
- Tagline: ${idea.tagline || 'Not specified'}
- Problem: ${idea.problem || 'Not specified'}
- Solution: ${idea.solution || 'Not specified'}
- Target Market: ${idea.target_market || 'Not specified'}
- Why Us: ${idea.why_you || 'Not specified'}
- Difficulty: ${idea.difficulty || 'moderate'}

Structure the plan with EXACTLY these sections using markdown headings:

# 🚀 ${idea.title} — Full Enterprise Plan

## 1. 📌 Executive Brief & Core Architecture
- Problem Statement (The Burning Pain Point)
- The Solution & Automated Workflow
- Core Product Definition with data flow diagram

## 2. 👥 Dual-Founder Execution Matrix
- Founder A: Product & UI/UX Lead — specific responsibilities
- Founder B: Infra & Core Systems — specific responsibilities
- The Combined Advantage (Velocity Loop)

## 3. 📊 Market Dynamics & Geographic Arbitrage Financials
- TAM-SAM-SOM stack with realistic numbers
- Unit Economics table (pricing tier, ACV, burn rate, gross margin)
- Geographic cost arbitrage strategy

## 4. 🎯 Deep Validation & Strategic Risk Scores
- Market Urgency Score (0-100%) with justification
- Founder-Skill Alignment Score (0-100%)
- Time-to-Value Score (0-100%)
- Defensibility Score (0-100%)
- Pre-mortem: #1 threat + counter-strategy

## 5. 🗺️ Go-To-Market & 6-Week Sprints
- Primary client acquisition channel
- Lead magnet strategy
- Tactical 6-week roadmap with concrete milestones

Be specific, realistic, and actionable. Use tables where helpful. Write at least 2000 words total.`
}
