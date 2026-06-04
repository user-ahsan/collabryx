'use client'

/**
 * ============================================================================
 * MarkdownRenderer — Lightweight Markdown-to-JSX Renderer
 * ============================================================================
 *
 * Renders AI mentor responses as formatted rich text WITHOUT external deps.
 * Handles: bold, italic, inline code, code blocks, headings, lists, links,
 * blockquotes, paragraphs, horizontal rules.
 *
 * USAGE:
 * ```tsx
 * <MarkdownRenderer content={aiResponseContent} />
 * ```
 *
 * ============================================================================
 */

import { useMemo, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface MarkdownRendererProps {
  content: string
  className?: string
}

/**
 * Split text into segments: code blocks vs inline content
 */
function parseCodeBlocks(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const parts = text.split(/(```[\s\S]*?```)/g)

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i]
    if (!part) continue

    const codeMatch = part.match(/^```(\w*)\n?([\s\S]*?)```$/)
    if (codeMatch) {
      const [, lang, code] = codeMatch
      nodes.push(
        <pre
          key={`code-${i}`}
          className="relative my-3 rounded-lg bg-muted/80 border border-border/40 overflow-x-auto"
        >
          {lang && (
            <div className="sticky left-0 top-0 px-3 py-1 text-[10px] font-mono text-muted-foreground/50 border-b border-border/20 bg-muted/50">
              {lang}
            </div>
          )}
          <code className="block p-3 text-xs md:text-sm leading-relaxed font-mono">
            {code.trim()}
          </code>
        </pre>
      )
    } else {
      // Inline content — parse for inline formatting and block-level elements
      nodes.push(...parseInlineContent(part, `inline-${i}`))
    }
  }

  return nodes
}

/**
 * Parse inline text with formatting into JSX, splitting at double-newline blocks.
 * Single newlines within a paragraph are preserved as <br /> line breaks.
 */
function parseInlineContent(text: string, keyPrefix: string): ReactNode[] {
  // Split by double newlines to get paragraphs
  const paragraphs = text.split(/\n\n+/)
  const elements: ReactNode[] = []

  for (let p = 0; p < paragraphs.length; p++) {
    const para = paragraphs[p].trim()
    if (!para) continue

    // Check for block-level elements
    if (para.startsWith('#')) {
      elements.push(renderHeading(para, `${keyPrefix}-h-${p}`))
      continue
    }

    if (para.startsWith('> ')) {
      elements.push(renderBlockquote(para, `${keyPrefix}-bq-${p}`))
      continue
    }

    if (para.startsWith('---') || para.startsWith('***')) {
      elements.push(<hr key={`${keyPrefix}-hr-${p}`} className="my-3 border-border/40" />)
      continue
    }

    // Check for unordered/ordered lists
    const listLines = para.split('\n')
    const looksLikeList = listLines.some(l => /^[-*+]\s/.test(l) || /^\d+[.)]\s/.test(l))

    if (looksLikeList) {
      elements.push(renderList(para, `${keyPrefix}-list-${p}`))
      continue
    }

    // Regular paragraph — handle single newlines as <br /> breaks
    // Split on single newline and format each line with inline formatting,
    // joining them with <br /> tags
    const lines = para.split('\n')
    if (lines.length <= 1) {
      elements.push(
        <p key={`${keyPrefix}-p-${p}`} className="my-1.5 leading-relaxed">
          {renderInlineFormatting(para)}
        </p>
      )
    } else {
      elements.push(
        <p key={`${keyPrefix}-p-${p}`} className="my-1.5 leading-relaxed">
          {lines.map((line, li) => {
            const trimmed = line.trim()
            if (!trimmed) return null
            return (
              <span key={`${keyPrefix}-l-${p}-${li}`}>
                {li > 0 && <br />}
                {renderInlineFormatting(trimmed)}
              </span>
            )
          })}
        </p>
      )
    }
  }

  return elements
}

/**
 * Render headings (# through ###)
 */
function renderHeading(text: string, key: string): ReactNode {
  const match = text.match(/^(#{1,3})\s+(.+)$/m)
  if (!match) return <p key={key}>{renderInlineFormatting(text)}</p>

  const level = match[1].length
  const content = match[2].trim()

  const styles = {
    1: 'text-lg font-bold mt-4 mb-2 text-foreground',
    2: 'text-base font-semibold mt-3 mb-1.5 text-foreground/90',
    3: 'text-sm font-medium mt-2 mb-1 text-foreground/80',
  }

  const Component = ({ children }: { children: ReactNode }) => {
    switch (level) {
      case 1: return <h1 className={styles[1]}>{children}</h1>
      case 2: return <h2 className={styles[2]}>{children}</h2>
      case 3: return <h3 className={styles[3]}>{children}</h3>
      default: return <p className="font-bold">{children}</p>
    }
  }

  return <Component key={key}>{renderInlineFormatting(content)}</Component>
}

/**
 * Render blockquotes
 */
function renderBlockquote(text: string, key: string): ReactNode {
  const lines = text.split('\n').map(l => l.replace(/^>\s?/, ''))
  const content = lines.join(' ')

  return (
    <blockquote
      key={key}
      className="border-l-2 border-primary/30 pl-3 my-2 text-sm italic text-muted-foreground"
    >
      {renderInlineFormatting(content)}
    </blockquote>
  )
}

/**
 * Render ordered/unordered lists
 */
function renderList(text: string, key: string): ReactNode {
  const lines = text.split('\n')
  const items: string[] = []
  let isOrdered = false

  for (const line of lines) {
    const ulMatch = line.match(/^[-*+]\s+(.+)/)
    const olMatch = line.match(/^\d+[.)]\s+(.+)/)

    if (ulMatch) {
      items.push(ulMatch[1])
    } else if (olMatch) {
      items.push(olMatch[1])
      isOrdered = true
    } else if (items.length > 0 && line.trim()) {
      // Continuation of last item
      items[items.length - 1] += ' ' + line.trim()
    }
  }

  const ListTag = isOrdered ? 'ol' : 'ul'
  return (
    <ListTag
      key={key}
      className={cn('my-2 pl-5 space-y-1', isOrdered ? 'list-decimal' : 'list-disc')}
    >
      {items.map((item, i) => (
        <li key={`${key}-li-${i}`} className="text-sm leading-relaxed">
          {renderInlineFormatting(item)}
        </li>
      ))}
    </ListTag>
  )
}

/**
 * Render bold, italic, inline code, links, strikethrough
 */
function renderInlineFormatting(text: string): ReactNode {
  if (!text) return text

  // Split by inline markers and render segments
  const segments: ReactNode[] = []
  const regex = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`|~~(.+?)~~|\[(.+?)\]\((.+?)\))/g
  let lastIndex = 0
  let match: RegExpExecArray | null
  let keyIndex = 0

  while ((match = regex.exec(text)) !== null) {
    // Add text before this match
    if (match.index > lastIndex) {
      segments.push(text.slice(lastIndex, match.index))
    }

    const fullMatch = match[0]

    if (fullMatch.startsWith('***') && match[2]) {
      // Bold + italic
      segments.push(
        <strong key={`fmt-${keyIndex++}`} className="font-bold italic">
          {match[2]}
        </strong>
      )
    } else if (fullMatch.startsWith('**') && match[3]) {
      // Bold
      segments.push(
        <strong key={`fmt-${keyIndex++}`} className="font-semibold">
          {match[3]}
        </strong>
      )
    } else if (fullMatch.startsWith('*') && !fullMatch.startsWith('**') && match[4]) {
      // Italic
      segments.push(
        <em key={`fmt-${keyIndex++}`} className="italic">
          {match[4]}
        </em>
      )
    } else if (fullMatch.startsWith('`') && match[5]) {
      // Inline code
      segments.push(
        <code
          key={`fmt-${keyIndex++}`}
          className="px-1 py-0.5 rounded text-xs font-mono bg-muted/80 text-foreground border border-border/30"
        >
          {match[5]}
        </code>
      )
    } else if (fullMatch.startsWith('~~') && match[6]) {
      // Strikethrough
      segments.push(
        <del key={`fmt-${keyIndex++}`} className="line-through text-muted-foreground">
          {match[6]}
        </del>
      )
    } else if (fullMatch.startsWith('[') && match[7] && match[8]) {
      // Link
      segments.push(
        <a
          key={`fmt-${keyIndex++}`}
          href={match[8]}
          target="_blank"
          rel="noopener noreferrer"
          className="text-primary underline underline-offset-2 hover:text-primary/80 transition-colors"
        >
          {match[7]}
        </a>
      )
    }

    lastIndex = match.index + fullMatch.length
  }

  // Add remaining text
  if (lastIndex < text.length) {
    segments.push(text.slice(lastIndex))
  }

  return segments.length > 0 ? segments : text
}

/**
 * Pre-process content: strip IDEA/SUGGESTIONS markers from display text
 * (they're handled by other components), normalize line endings
 */
function preprocessContent(content: string): string {
  return content
    // Remove --IDEA-- blocks (they render as cards) — handles multi-line content
    .replace(/--IDEA--[\s\S]*?--END--/g, '')
    // Remove ---SUGGESTIONS: [...]--- or ---SUGGESTIONS: [...] (no trailing ---)
    // The AI sometimes omits the closing ---, so handle both
    .replace(/---SUGGESTIONS:\s*\[[\s\S]*?\](?:---|[\n]|$)/g, '')
    // Also handle SUGGESTIONS at the end of content (no newline after)
    .replace(/---SUGGESTIONS:\s*\[[\s\S]*?\]\s*$/gm, '')
    // Remove standalone --IDEA-- and --END-- markers
    .replace(/--IDEA--/g, '')
    .replace(/--END--/g, '')
    // Remove ---SUGGESTIONS lines without brackets (malformed)
    .replace(/---SUGGESTIONS:.*$/gm, '')
    // Remove leftover empty lines from removed blocks
    .replace(/\n{3,}/g, '\n\n')
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .trim()
}

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  const rendered = useMemo(() => {
    const cleaned = preprocessContent(content)
    if (!cleaned) return null
    return parseCodeBlocks(cleaned)
  }, [content])

  if (!rendered) return null

  return (
    <div className={cn('markdown-content text-sm leading-relaxed', className)}>
      {rendered}
    </div>
  )
}
