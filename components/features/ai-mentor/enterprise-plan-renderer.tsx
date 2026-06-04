'use client'

/**
 * ============================================================================
 * EnterprisePlanRenderer — Formatted startup plan with charts, bars & tables
 * ============================================================================
 *
 * Parses AI-generated markdown plan content into properly formatted sections
 * with visual elements: progress bars for scores, styled tables for financial
 * data, glass cards for each section, and section-scroll navigation.
 *
 * Since no charting library is available (zero package policy), all visual
 * elements use pure CSS + Tailwind — progress bars, score indicators, etc.
 *
 * Expected markdown sections (from the AI prompt template):
 *   ## 1. 📌 Executive Brief & Core Architecture
 *   ## 2. 👥 Dual-Founder Execution Matrix
 *   ## 3. 📊 Market Dynamics & Geographic Arbitrage Financials
 *   ## 4. 🎯 Deep Validation & Strategic Risk Scores
 *   ## 5. 🗺️ Go-To-Market & 6-Week Sprints
 *
 * ============================================================================
 */

import { useMemo, useRef, useCallback } from 'react'
import { GlassCard } from '@/components/shared/glass-card'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/utils/glass-variants'
import {
  Lightbulb, Users, BarChart3, Target, Rocket,
  TrendingUp, ShieldCheck, Star,
} from 'lucide-react'
import { MarkdownRenderer } from '@/components/shared/markdown-renderer'

// ─── Section config ────────────────────────────────────────────────────────

interface SectionConfig {
  id: string
  label: string
  icon: typeof Lightbulb
  color: string
}

const SECTIONS: SectionConfig[] = [
  { id: 'executive', label: 'Executive Brief', icon: Lightbulb, color: 'text-sky-500' },
  { id: 'founders', label: 'Founder Matrix', icon: Users, color: 'text-violet-500' },
  { id: 'market', label: 'Market Dynamics', icon: BarChart3, color: 'text-emerald-500' },
  { id: 'validation', label: 'Validation Scores', icon: Target, color: 'text-amber-500' },
  { id: 'gtm', label: 'Go-To-Market', icon: Rocket, color: 'text-rose-500' },
]

// Section heading pattern: ## 1. 📌 text or ## text
const SECTION_HEADING_RE = /^##\s+(?:\d+\.\s*)?(?:\p{Emoji}\s*)?(.+)$/mu

// Score pattern: "Something Score: 85%" or "Score: 85%"
const SCORE_LINE_RE = /^\s*[-*]\s*(.+?)[:：]\s*(\d+)%\s*$/m

// ─── Parsed types ──────────────────────────────────────────────────────────

interface ParsedSection {
  title: string
  rawContent: string
  type: 'executive' | 'founders' | 'market' | 'validation' | 'gtm' | 'other'
}

interface ScoreRow {
  label: string
  value: number
  icon: typeof TrendingUp
  color: string
}

// ─── Score icons ────────────────────────────────────────────────────────────

const SCORE_ICONS: Record<string, { icon: typeof TrendingUp; color: string }> = {
  market: { icon: TrendingUp, color: 'text-blue-500' },
  urgency: { icon: TrendingUp, color: 'text-blue-500' },
  founder: { icon: Users, color: 'text-violet-500' },
  skill: { icon: Star, color: 'text-emerald-500' },
  time: { icon: Target, color: 'text-amber-500' },
  defensibility: { icon: ShieldCheck, color: 'text-purple-500' },
  moat: { icon: ShieldCheck, color: 'text-purple-500' },
}

function getScoreMeta(label: string): { icon: typeof TrendingUp; color: string } {
  const lower = label.toLowerCase()
  for (const [key, meta] of Object.entries(SCORE_ICONS)) {
    if (lower.includes(key)) return meta
  }
  return { icon: TrendingUp, color: 'text-primary' }
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

// ─── Parser ─────────────────────────────────────────────────────────────────

function parsePlanContent(content: string): {
  sections: ParsedSection[]
  scores: ScoreRow[]
  tables: Array<{ headers: string[]; rows: string[][] }>
} {
  const lines = content.split('\n')
  const sections: ParsedSection[] = []
  const scores: ScoreRow[] = []
  const tables: Array<{ headers: string[]; rows: string[][] }> = []

  let currentSection: ParsedSection | null = null
  let currentSectionLines: string[] = []
  let inTable = false
  let currentTable: { headers: string[]; rows: string[][] } | null = null
  let currentTableRows: string[][] = []

  // Extract scores from validation section
  const scoreMatch = content.match(SCORE_LINE_RE)
  if (scoreMatch) {
    // Single score line
  }

  // Extract all scores with regex
  const allScoreLines = content.matchAll(/^\s*[-*]\s*(.+?)[:：]\s*(\d+)%\s*$/gm)
  for (const match of allScoreLines) {
    const label = match[1].trim()
    const value = parseInt(match[2], 10)
    if (!isNaN(value) && label.length < 60) {
      scores.push({ label, value, ...getScoreMeta(label) })
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const headingMatch = line.match(SECTION_HEADING_RE)

    if (headingMatch) {
      // Save previous section
      if (currentSection) {
        currentSection.rawContent = currentSectionLines.join('\n').trim()
      }

      const title = headingMatch[1].trim()
      const type = determineSectionType(title)

      currentSection = { title, rawContent: '', type }
      currentSectionLines = []
      sections.push(currentSection)

      // Detect table start coming up
      inTable = false
      continue
    }

    // Detect table rows
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line.split('|').filter(c => c.trim()).map(c => c.trim())

      if (!inTable) {
        // First table row — this is a header
        inTable = true
        currentTable = { headers: cells, rows: [] }
        currentTableRows = []
      } else if (line.includes('---')) {
        // Separator row — skip
        continue
      } else if (currentTable) {
        currentTableRows.push(cells)
      }

      // Check if next line ends the table
      const nextLine = lines[i + 1]
      if (nextLine && !nextLine.startsWith('|')) {
        inTable = false
        if (currentTable) {
          currentTable.rows = currentTableRows
          tables.push(currentTable)
          currentTable = null
        }
      }
      continue
    }

    if (currentSection) {
      currentSectionLines.push(line)
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.rawContent = currentSectionLines.join('\n').trim()
  }

  return { sections, scores, tables }
}

function determineSectionType(title: string): ParsedSection['type'] {
  const lower = title.toLowerCase()
  if (lower.includes('executive') || lower.includes('brief') || lower.includes('architecture')) return 'executive'
  if (lower.includes('founder') || lower.includes('execution')) return 'founders'
  if (lower.includes('market') || lower.includes('financial') || lower.includes('economic')) return 'market'
  if (lower.includes('validation') || lower.includes('risk') || lower.includes('score')) return 'validation'
  if (lower.includes('go-to-market') || lower.includes('gtm') || lower.includes('sprint') || lower.includes('roadmap')) return 'gtm'
  return 'other'
}

// ─── Renderers ──────────────────────────────────────────────────────────────

function ScoreBar({ label, value, icon: Icon, color }: ScoreRow) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Icon className={cn('h-3.5 w-3.5', color)} />
          {label}
        </span>
        <span className={cn('font-bold tabular-nums', scoreColor(value))}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted-foreground/15 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-700', scoreBg(value))}
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  )
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  if (headers.length === 0) return null
  return (
    <div className="overflow-x-auto my-4 rounded-lg border border-border/40">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-muted/50">
            {headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-medium text-muted-foreground">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri} className={cn('border-t border-border/20', ri % 2 === 0 && 'bg-background/50')}>
              {row.map((cell, ci) => (
                <td key={ci} className="px-3 py-2 text-foreground/80">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SectionCard({
  section,
  icon: Icon,
  color,
  scores,
  tables,
}: {
  section: ParsedSection
  icon: typeof Lightbulb
  color: string
  scores: ScoreRow[]
  tables: Array<{ headers: string[]; rows: string[][] }>
}) {
  const isValidation = section.type === 'validation'
  const isMarket = section.type === 'market'

  return (
    <GlassCard glow className="mb-6" innerClassName="p-5 space-y-4">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className={cn('rounded-lg p-2', color.replace('text-', 'bg-').replace(/\S+$/, '10'))}>
          <Icon className={cn('h-5 w-5', color)} />
        </div>
        <h2 className="text-base font-semibold">{section.title}</h2>
      </div>

      {/* Scores section — render as progress bars */}
      {isValidation && scores.length > 0 && (
        <div className={cn('p-4 rounded-lg border', glass('overlay'))}>
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            Strategic Risk Scores
          </h3>
          <div className="space-y-3">
            {scores.map((s, i) => (
              <ScoreBar key={i} {...s} />
            ))}
          </div>
        </div>
      )}

      {/* Tables — for market/financial sections */}
      {isMarket && tables.length > 0 && (
        <div className="space-y-4">
          {tables.map((t, i) => (
            <div key={i}>
              <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-emerald-500" />
                Unit Economics
              </h3>
              <DataTable headers={t.headers} rows={t.rows} />
            </div>
          ))}
        </div>
      )}

      {/* All tables (non-market sections) */}
      {!isMarket && tables.length > 0 && tables.map((t, i) => (
        <DataTable key={i} headers={t.headers} rows={t.rows} />
      ))}

      {/* General markdown content (strip score lines from validation to avoid dup) */}
      {section.rawContent && (
        <div className="text-sm leading-relaxed">
          <MarkdownRenderer
            content={isValidation
              ? section.rawContent.replace(SCORE_LINE_RE, '').trim()
              : section.rawContent
            }
          />
        </div>
      )}
    </GlassCard>
  )
}

// ─── Main Component ─────────────────────────────────────────────────────────

interface EnterprisePlanRendererProps {
  content: string
}

export function EnterprisePlanRenderer({ content }: EnterprisePlanRendererProps) {
  const { sections, scores, tables } = useMemo(() => parsePlanContent(content), [content])
  const scrollRef = useRef<HTMLDivElement>(null)

  const scrollToSection = useCallback((sectionId: string) => {
    if (!scrollRef.current) return
    const el = scrollRef.current.querySelector(`[data-section-id="${sectionId}"]`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  // Find the section config for each parsed section
  const getSectionConfig = (type: ParsedSection['type']): SectionConfig | undefined => {
    return SECTIONS.find(s => s.id === type)
  }

  if (!content) return null

  return (
    <div className="flex flex-col h-full">
      {/* Section navigation tabs */}
      <div className="flex items-center gap-1 px-4 py-2 border-b border-border/20 bg-muted/10 overflow-x-auto shrink-0">
        {sections.map((section, i) => {
          const config = getSectionConfig(section.type)
          if (!config) return null
          return (
            <button
              key={i}
              type="button"
              onClick={() => scrollToSection(config.id)}
              className={cn(
                'flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[10px] font-medium whitespace-nowrap',
                'text-muted-foreground/70 hover:text-foreground hover:bg-accent/50 transition-colors',
              )}
            >
              <config.icon className={cn('h-3 w-3', config.color)} />
              {config.label}
            </button>
          )
        })}
      </div>

      {/* Scrollable content */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Overall assessment bar — show top scores */}
        {scores.length > 0 && (
          <div className={cn('p-4 rounded-xl border', glass('overlay'))}>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold">Feasibility Overview</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {scores.slice(0, 4).map((s, i) => (
                <div key={i} className="text-center">
                  <div className={cn('text-lg font-bold', scoreColor(s.value))}>{s.value}%</div>
                  <div className="text-[10px] text-muted-foreground truncate">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Each section as a GlassCard */}
        {sections.map((section, i) => {
          const config = getSectionConfig(section.type)
          if (!config) {
            // Render unknown sections as plain markdown
            return (
              <div key={i} data-section-id="other">
                <GlassCard glow innerClassName="p-5">
                  <MarkdownRenderer content={section.rawContent || `# ${section.title}`} />
                </GlassCard>
              </div>
            )
          }

          return (
            <div key={i} data-section-id={config.id}>
              <SectionCard
                section={section}
                icon={config.icon}
                color={config.color}
                scores={scores}
                tables={tables}
              />
            </div>
          )
        })}

        {/* Bottom spacing */}
        <div className="h-8" />
      </div>
    </div>
  )
}
