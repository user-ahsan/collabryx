/**
 * ============================================================================
 * SessionSidebar — Past AI Mentor Session Browser with Archive Support
 * ============================================================================
 *
 * Glass-glow themed sidebar for browsing, resuming, and managing AI mentor
 * sessions. Features:
 *  - Real-time polling for new sessions
 *  - Active session highlighting with glass-glow-hover
 *  - Archive/unarchive support
 *  - Relative timestamps
 *  - Empty state with prompt to start chatting
 *
 * @see {@link ../../../lib/actions/ai-mentor.ts}
 * ============================================================================
 */
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Plus, MessageSquare, Archive, Loader2, History, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { glass } from '@/lib/utils/glass-variants'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { getUserSessions, archiveSession, deleteSession } from '@/lib/actions/ai-mentor'
import { getCache, setCache, CACHE_KEYS } from '@/lib/dashboard-cache'
import { Shimmer } from '@/components/ai-elements/shimmer'

interface Session {
  id: string
  title: string
  status: string
  created_at: string
  updated_at: string
}

interface SessionSidebarProps {
  activeSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onNewSession: () => void
  onClose?: () => void
}

export function SessionSidebar({
  activeSessionId,
  onSessionSelect,
  onNewSession,
  onClose,
}: SessionSidebarProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [archivingId, setArchivingId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [switchingId, setSwitchingId] = useState<string | null>(null)
  const prevSessionCount = useRef(0)
  const switchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadSessions = useCallback(async () => {
    const cacheKey = CACHE_KEYS.SESSION_LIST

    // Load cached sessions instantly for immediate display
    const cached = getCache<Session[]>(cacheKey)
    if (cached && cached.length > 0) {
      setSessions(cached)
    }

    try {
      const result = await getUserSessions()
      if (!result.error && result.data) {
        setSessions(result.data)
        // Cache fresh session list (15 min TTL — sessions change infrequently)
        setCache(cacheKey, result.data, 1000 * 60 * 15)
      }
    } catch {
      // ignore — cached data keeps showing
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadSessions()
  }, [loadSessions, activeSessionId])

  // Poll for new sessions (15s interval to avoid excessive requests)
  useEffect(() => {
    const interval = setInterval(loadSessions, 15000)
    return () => clearInterval(interval)
  }, [loadSessions])

  // Auto-scroll to top when a new session is created
  useEffect(() => {
    if (prevSessionCount.current > 0 && sessions.length > prevSessionCount.current) {
      const timer = setTimeout(() => {
        const viewport = document.querySelector('[data-radix-scroll-area-viewport]')
        if (viewport) viewport.scrollTop = 0
      }, 50)
      return () => clearTimeout(timer)
    }
    prevSessionCount.current = sessions.length
  }, [sessions.length])

  const handleArchive = async (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    setArchivingId(sessionId)
    try {
      const result = await archiveSession(sessionId)
      if (result.success) {
        setSessions((prev) => prev.filter((s) => s.id !== sessionId))
        toast.success('Session archived')
        if (activeSessionId === sessionId) {
          onNewSession()
        }
      } else {
        toast.error('Failed to archive session')
      }
    } catch {
      toast.error('Failed to archive session')
    } finally {
      setArchivingId(null)
    }
  }

  const handleDeleteClick = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation()
    setDeleteConfirmId(sessionId)
  }

  const handleConfirmDelete = async () => {
    if (!deleteConfirmId) return
    setDeletingId(deleteConfirmId)
    try {
      const result = await deleteSession(deleteConfirmId)
      if (result.success) {
        setSessions((prev) => prev.filter((s) => s.id !== deleteConfirmId))
        toast.success('Session deleted')
        if (activeSessionId === deleteConfirmId) {
          onNewSession()
        }
      } else {
        toast.error('Failed to delete session')
      }
    } catch {
      toast.error('Failed to delete session')
    } finally {
      setDeletingId(null)
      setDeleteConfirmId(null)
    }
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString()
  }

  return (
    <div className='w-72 md:w-80 border-r border-border/40 flex flex-col shrink-0 bg-background z-10 min-w-0'>
      {/* Header */}
      <div className="px-3 py-3 border-b border-border/40 flex items-center justify-between">
        <h2 className="text-sm font-semibold flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <Shimmer>Chat History</Shimmer>
        </h2>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          className={cn("h-7 px-2 text-xs", glass("buttonGhost"))}
          onClick={() => {
            onNewSession()
            onClose?.()
          }}
        >
          <Plus className="h-3.5 w-3.5 mr-1" />
          New
        </Button>
      </div>

      {/* Session list */}
      <div className="flex-1 w-full min-w-0 overflow-y-auto overflow-x-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <MessageSquare className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground text-xs">
              No past sessions yet.
            </p>
            <p className="text-muted-foreground/60 text-[10px] mt-1">
              Start a new conversation to begin!
            </p>
          </div>
        ) : (
          <div className="p-2 space-y-1 w-full min-w-0">
            {sessions.map((session) => (
              <div
                key={session.id}
                role="button"
                tabIndex={0}
                onClick={() => {
                  setSwitchingId(session.id)
                  onSessionSelect(session.id)
                  if (switchTimeoutRef.current) clearTimeout(switchTimeoutRef.current)
                  switchTimeoutRef.current = setTimeout(() => setSwitchingId(null), 1500)
                }}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onSessionSelect(session.id); } }}
                onTouchStart={() => {/* touch-activated, click handles it */}}
                onTouchEnd={() => {/* touch-activated, click handles it */}}
                className={cn(
                  'w-full max-w-full text-left px-3 py-2.5 rounded-lg text-sm transition-all duration-200 cursor-pointer',
                  'group flex items-start gap-2 relative overflow-hidden',
                  activeSessionId === session.id
                    ? cn('glass-glow-strong', 'bg-accent/50')
                    : cn('hover:bg-accent/30 border border-transparent', 'glass-glow-hover'),
                  switchingId === session.id && 'opacity-70',
                )}
                style={{ touchAction: 'manipulation' }}
              >
                <div className="relative shrink-0 mt-0.5">
                  {switchingId === session.id ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : (
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0 overflow-hidden pr-16 transition-all duration-200">
                  <div className="font-medium truncate text-foreground/90">
                    {session.title || 'Untitled Session'}
                  </div>
                  <div className="text-[10px] text-muted-foreground/60 mt-0.5 truncate">
                    {formatDate(session.updated_at || session.created_at)}
                    {session.status === 'archived' && ' • Archived'}
                  </div>
                </div>
                <div
                  className={cn(
                    "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 p-0.5 rounded-md",
                    "bg-background/80 backdrop-blur-sm border border-border/10 shadow-sm",
                    "opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-all duration-150",
                    (archivingId === session.id || deletingId === session.id) && "opacity-100"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  {session.status !== 'archived' && (
                    <button
                      type="button"
                      onClick={(e) => handleArchive(e, session.id)}
                      className={cn(
                        "p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors",
                        "items-center justify-center flex"
                      )}
                      title="Archive session"
                      aria-label={`Archive session ${session.title}`}
                    >
                      {archivingId === session.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Archive className="h-3.5 w-3.5" />
                      )}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={(e) => handleDeleteClick(e, session.id)}
                    className={cn(
                      "p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
                      "items-center justify-center flex"
                    )}
                    title="Delete session"
                    aria-label={`Delete session ${session.title}`}
                  >
                    {deletingId === session.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={deleteConfirmId !== null} onOpenChange={(open) => { if (!open) setDeleteConfirmId(null) }}>
        <DialogContent className={cn("sm:max-w-md sm:rounded-2xl border border-white/10", glass("overlay"))}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-destructive/10">
                <Trash2 className="h-5 w-5 text-destructive" />
              </div>
              <DialogTitle>Delete Session</DialogTitle>
            </div>
            <DialogDescription className="pt-4 text-muted-foreground">
              Are you sure you want to permanently delete this session? This action cannot be undone, and you will lose all the conversation history.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:mt-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteConfirmId(null)}
              className={cn("w-full sm:w-auto", glass("buttonGhost"))}
              disabled={deletingId !== null}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              className="w-full sm:w-auto gap-2"
              disabled={deletingId !== null}
            >
              {deletingId !== null ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
