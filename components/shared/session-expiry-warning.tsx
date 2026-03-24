'use client'

/**
 * Session Expiry Warning Component (P1-04)
 * Shows warning when session is about to expire
 */

import * as React from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Clock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { 
  formatSessionExpiryMessage, 
  refreshSessionIfNeeded,
  SESSION_CHECK_INTERVAL_MS,
  SESSION_WARNING_THRESHOLD_SECONDS,
} from '@/lib/config/session'
import { cn } from '@/lib/utils'
import { glass } from '@/lib/utils/glass-variants'
import { toast } from 'sonner'

interface SessionExpiryWarningProps {
  className?: string
}

export function SessionExpiryWarning({ className }: SessionExpiryWarningProps) {
  const [showWarning, setShowWarning] = React.useState(false)
  const [expiryMessage, setExpiryMessage] = React.useState<string>('')
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  const supabase = createClient()

  React.useEffect(() => {
    let mounted = true

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session || !session.expires_at) {
          return
        }

        const expiresAt = new Date(session.expires_at * 1000)
        const now = new Date()
        const timeUntilExpiry = expiresAt.getTime() - now.getTime()
        const warningThreshold = SESSION_WARNING_THRESHOLD_SECONDS * 1000

        if (timeUntilExpiry <= warningThreshold && timeUntilExpiry > 0) {
          if (mounted) {
            setShowWarning(true)
            setExpiryMessage(formatSessionExpiryMessage(expiresAt))
          }
        } else {
          if (mounted) {
            setShowWarning(false)
          }
        }
      } catch {
        console.error('Session check failed:', error)
      }
    }

    // Check immediately, then check periodically
    const checkInterval = setInterval(checkSession, SESSION_CHECK_INTERVAL_MS)

    return () => {
      mounted = false
      if (checkInterval) {
        clearInterval(checkInterval)
      }
    }
  }, [supabase.auth])

  const handleRefreshSession = async () => {
    setIsRefreshing(true)
    
    try {
      const result = await refreshSessionIfNeeded(supabase)
      
      if (result.refreshed) {
        setShowWarning(false)
        toast.success('Session extended')
      } else if (result.expired) {
        toast.error('Session expired. Please log in again.')
        // Redirect to login
        window.location.assign('/login')
      } else {
        toast.error('Failed to refresh session')
      }
    } catch {
      console.error('Session refresh failed:', error)
      toast.error('Failed to refresh session')
    } finally {
      setIsRefreshing(false)
    }
  }

  const handleDismiss = () => {
    setShowWarning(false)
  }

  if (!showWarning) {
    return null
  }

  return (
    <div className={cn(
      'fixed bottom-4 right-4 z-50 max-w-sm p-4 rounded-xl shadow-lg',
      'bg-amber-500/10 border border-amber-500/30 backdrop-blur-sm',
      'animate-in slide-in-from-bottom-4 fade-in duration-300',
      glass('overlay'),
      className
    )}>
      <div className="flex items-start gap-3">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-amber-500/20 shrink-0">
          <Clock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            <p className="font-medium text-sm text-amber-900 dark:text-amber-200">
              Session Expiring Soon
            </p>
          </div>
          
          <p className="text-xs text-amber-700 dark:text-amber-300 mb-3">
            {expiryMessage}
          </p>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleRefreshSession}
              disabled={isRefreshing}
              className="h-8 text-xs px-3"
            >
              {isRefreshing ? 'Refreshing...' : 'Extend Session'}
            </Button>
            
            <Button
              size="sm"
              variant="ghost"
              onClick={handleDismiss}
              className="h-8 text-xs px-3"
            >
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
