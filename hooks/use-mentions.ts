/**
 * ============================================================================
 * useMentions — @mention Detection & User Search Hook
 * ============================================================================
 *
 * Detects when a user types @ in a textarea, searches for matching users
 * via the search API, and provides the state needed for an autocomplete
 * dropdown. Tracks resolved user IDs for submission.
 *
 * USAGE:
 * ```tsx
 * const { mentionState, insertMention, resolvedMentions, searchQuery } = useMentions()
 *
 * // In textarea onChange:
 * mentionState = checkForMention(textarea.value, cursorPosition)
 *
 * // When user selects a mention:
 * insertMention(textarea, selectedUser)
 *
 * // When submitting:
 * sendMessage(content, [], resolvedMentions)
 * ```
 *
 * @see {@link ../app/api/search/route.ts} — user search endpoint
 * ============================================================================
 */
'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

export interface MentionUser {
  id: string
  name: string
  headline: string | null
  avatar_url: string | null
}

export interface MentionState {
  /** Whether the mention popover should be shown */
  active: boolean
  /** The partial query after @ (without the @ symbol) */
  query: string
  /** The start position of the @ mention in the text */
  startPos: number
  /** Users matching the search query */
  users: MentionUser[]
  /** Whether search is in progress */
  loading: boolean
}

interface ResolvedMention {
  id: string
  name: string
  /** The @username text as it appears in the message */
  displayText: string
}

const INITIAL_STATE: MentionState = {
  active: false,
  query: '',
  startPos: -1,
  users: [],
  loading: false,
}

/**
 * Strip HTML tags and truncate query for safe API usage
 */
function sanitizeQuery(query: string): string {
  return query
    .replace(/<[^>]*>/g, '')   // Strip HTML tags
    .replace(/[<>"'`]/g, '')   // Strip injection characters
    .trim()
    .slice(0, 50)              // Limit to 50 chars
}

interface UseMentionsOptions {
  /** Current user ID to filter out from mention results (prevents self-mention) */
  currentUserId?: string
}

export function useMentions({ currentUserId }: UseMentionsOptions = {}) {
  const [mentionState, setMentionState] = useState<MentionState>(INITIAL_STATE)
  const [resolvedMentions, setResolvedMentions] = useState<ResolvedMention[]>([])
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
      abortRef.current?.abort()
    }
  }, [])

  /**
   * Check text for @mention pattern at the given cursor position.
   * Call this on every textarea input/change event.
   */
  const checkForMention = useCallback((text: string, cursorPos: number): MentionState => {
    // Get text before cursor
    const beforeCursor = text.slice(0, cursorPos)
    
    // Find the last @ symbol before cursor
    const lastAtIndex = beforeCursor.lastIndexOf('@')
    
    // @ must exist and must be at word boundary (preceded by space or start of string)
    if (lastAtIndex === -1 || (lastAtIndex > 0 && beforeCursor[lastAtIndex - 1] !== ' ' && beforeCursor[lastAtIndex - 1] !== '\n')) {
      setMentionState(INITIAL_STATE)
      return INITIAL_STATE
    }

    // Extract the query (text after @ until cursor, must be alphanumeric + underscore)
    const afterAt = beforeCursor.slice(lastAtIndex + 1)
    const match = afterAt.match(/^([\w.]*)$/)
    
    if (!match) {
      setMentionState(INITIAL_STATE)
      return INITIAL_STATE
    }

    const query = match[1]

    // Don't search if query is too short or we're at just @
    if (query.length < 1) {
      setMentionState(prev => ({ ...prev, active: false, query: '', startPos: -1 }))
      return { ...INITIAL_STATE }
    }

    // Debounce search
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    if (abortRef.current) abortRef.current.abort()

    const newState: MentionState = {
      active: true,
      query,
      startPos: lastAtIndex,
      users: mentionState.users, // Keep previous results while loading
      loading: true,
    }
    setMentionState(newState)

    searchTimeoutRef.current = setTimeout(async () => {
      const controller = new AbortController()
      abortRef.current = controller

      // Sanitize query before sending (strip HTML, limit length)
      const sanitized = sanitizeQuery(query)

      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(sanitized)}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error('Search failed')
        const data = await res.json()
        
        let users: MentionUser[] = (data.people || []).map((p: { id: string; name: string; headline: string | null; avatar_url: string | null }) => ({
          id: p.id,
          name: p.name,
          headline: p.headline,
          avatar_url: p.avatar_url,
        }))

        // Filter out current user to prevent self-mention
        if (currentUserId) {
          users = users.filter((u) => u.id !== currentUserId)
        }

        // Show "No users found" briefly when search completes with zero results
        if (users.length === 0) {
          const noResultsState: MentionState = {
            active: true,
            query,
            startPos: lastAtIndex,
            users: [],
            loading: false,
          }
          setMentionState(noResultsState)
          // Auto-dismiss empty results after 1 second
          setTimeout(() => {
            setMentionState((prev) =>
              prev.active && prev.users.length === 0 && !prev.loading
                ? INITIAL_STATE
                : prev
            )
          }, 1000)
          return
        }

        const updatedState: MentionState = {
          active: true,
          query,
          startPos: lastAtIndex,
          users,
          loading: false,
        }
        setMentionState(updatedState)
      } catch (err) {
        if (err instanceof DOMException && err.name === 'AbortError') return
        setMentionState(prev => ({ ...prev, loading: false }))
      }
    }, 200) // 200ms debounce

    return newState
  }, [mentionState.users])

  /**
   * Insert a selected user mention into the textarea.
   * Returns the new text and cursor position.
   */
  const insertMention = useCallback((
    text: string,
    cursorPos: number,
    user: MentionUser
  ): { newText: string; newCursorPos: number } => {
    const beforeMention = text.slice(0, mentionState.startPos)
    const afterCursor = text.slice(cursorPos)
    const mentionText = `@${user.name} `
    const newText = beforeMention + mentionText + afterCursor
    const newCursorPos = beforeMention.length + mentionText.length

    // Track the resolved mention
    setResolvedMentions(prev => {
      // Remove any existing mention for this text position
      const filtered = prev.filter(m => m.id !== user.id)
      return [...filtered, {
        id: user.id,
        name: user.name,
        displayText: `@${user.name}`,
      }]
    })

    // Reset state
    setMentionState(INITIAL_STATE)

    return { newText, newCursorPos }
  }, [mentionState.startPos])

  /**
   * Clear resolved mentions (e.g., on message send)
   */
  const clearMentions = useCallback(() => {
    setResolvedMentions([])
  }, [])

  /**
   * Close the mention popover
   */
  const dismissMentions = useCallback(() => {
    setMentionState(INITIAL_STATE)
  }, [])

  return {
    mentionState,
    resolvedMentions,
    checkForMention,
    insertMention,
    clearMentions,
    dismissMentions,
  }
}
