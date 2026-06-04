/**
 * ============================================================================
 * MentionPopover — @mention Autocomplete Dropdown
 * ============================================================================
 *
 * Displays a dropdown list of matching users when @ is typed in the chat input.
 * Supports keyboard navigation (↑↓ to select, Enter to confirm, Esc to dismiss).
 *
 * Positioned absolutely above the textarea for a Slack/Discord-like experience.
 *
 * @see {@link ../../../hooks/use-mentions.ts} — mention detection hook
 * ============================================================================
 */
'use client'

import { useState, useEffect, useRef } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/utils/glass-variants'
import { Loader2, User, AtSign } from 'lucide-react'
import type { MentionState, MentionUser } from '@/hooks/use-mentions'

interface MentionPopoverProps {
  mentionState: MentionState
  onSelect: (user: MentionUser) => void
  onDismiss: () => void
}

export function MentionPopover({ mentionState, onSelect, onDismiss }: MentionPopoverProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  // Handle keyboard events via a global listener
  useEffect(() => {
    if (!mentionState.active) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (!mentionState.active) return

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(prev =>
            prev < mentionState.users.length - 1 ? prev + 1 : 0
          )
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(prev =>
            prev > 0 ? prev - 1 : mentionState.users.length - 1
          )
          break
        case 'Enter':
        case 'Tab':
          if (mentionState.users.length > 0 && selectedIndex >= 0) {
            e.preventDefault()
            onSelect(mentionState.users[selectedIndex])
          }
          break
        case 'Escape':
          e.preventDefault()
          onDismiss()
          break
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [mentionState.active, mentionState.users, selectedIndex, onSelect, onDismiss])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return
    const item = listRef.current.children[selectedIndex] as HTMLElement | undefined
    item?.scrollIntoView({ block: 'nearest' })
  }, [selectedIndex])

  if (!mentionState.active) return null
  if (!mentionState.loading && mentionState.users.length === 0) return null

  // Clamp selectedIndex to valid range at render time (pure computation, no side effects)
  // Handles the edge case where users list shrinks and selectedIndex would be out of bounds
  const validSelectedIndex = mentionState.users.length > 0
    ? Math.min(selectedIndex, mentionState.users.length - 1)
    : 0

  return (
    <div
      className={cn(
        'absolute bottom-full left-0 right-0 mb-2 mx-1 z-50',
        'rounded-lg border border-border/40 shadow-lg overflow-hidden',
        glass('card'),
      )}
      style={{ maxHeight: '240px' }}
    >
      {/* Header */}
      <div className="px-3 py-1.5 text-[10px] text-muted-foreground/60 font-medium uppercase tracking-wider border-b border-border/20 flex items-center gap-1.5">
        <AtSign className="h-3 w-3" />
        Matching people
      </div>

      {/* Loading state */}
      {mentionState.loading && mentionState.users.length === 0 && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Results list */}
      {mentionState.users.length > 0 && (
        <div ref={listRef} className="overflow-y-auto" style={{ maxHeight: '200px' }}>
          {mentionState.users.map((user, index) => (
            <button
              key={user.id}
              type="button"
              className={cn(
                'w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
                'hover:bg-accent/50',
                index === validSelectedIndex && 'bg-accent'
              )}
              onMouseDown={(e) => {
                e.preventDefault() // Prevent textarea blur
                onSelect(user)
              }}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <Avatar className="h-6 w-6 shrink-0">
                <AvatarImage src={user.avatar_url || undefined} alt={user.name} />
                <AvatarFallback className="text-[10px]">
                  <User className="h-3 w-3" />
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm truncate">{user.name}</div>
                {user.headline && (
                  <div className="text-[10px] text-muted-foreground truncate">{user.headline}</div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results (when not loading) */}
      {!mentionState.loading && mentionState.users.length === 0 && (
        <div className="px-3 py-3 text-xs text-muted-foreground text-center">
          No users found for &ldquo;{mentionState.query}&rdquo;
        </div>
      )}
    </div>
  )
}
