'use client'

import { useEffect, useState } from 'react'
import { AlertTriangle, Clock } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

interface RateLimitAlertProps {
  retryAfter?: number
  resetAt?: string
  message?: string
  onRetry?: () => void
  className?: string
}

export function RateLimitAlert({
  retryAfter,
  resetAt,
  message = 'Rate limit exceeded',
  onRetry,
  className,
}: RateLimitAlertProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(retryAfter || 0)

  useEffect(() => {
    if (!retryAfter && !resetAt) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [retryAfter, resetAt])

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '0:00'
    
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  const getResetTime = () => {
    if (resetAt) {
      const resetDate = new Date(resetAt)
      return resetDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
    return null
  }

  const canRetry = timeRemaining <= 0

  return (
    <Alert variant="destructive" className={className}>
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>{message}</AlertTitle>
      <AlertDescription className="mt-2 space-y-2">
        <div className="flex items-center gap-2 text-sm">
          <Clock className="h-4 w-4" />
          <span>
            {canRetry 
              ? 'You can now retry this action' 
              : `Retry available in ${formatTime(timeRemaining)}`}
          </span>
        </div>
        
        {getResetTime() && (
          <p className="text-xs text-muted-foreground">
            Rate limit resets at {getResetTime()}
          </p>
        )}

        {canRetry && onRetry && (
          <Button 
            onClick={onRetry} 
            size="sm" 
            variant="outline"
            className="mt-2"
          >
            Try Again
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}

export function RateLimitToast({
  retryAfter,
  resetAt,
}: Omit<RateLimitAlertProps, 'title' | 'message' | 'onRetry' | 'className'>) {
  const [timeRemaining, setTimeRemaining] = useState<number>(retryAfter || 0)

  useEffect(() => {
    if (!retryAfter && !resetAt) return

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [retryAfter, resetAt])

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '0:00'
    
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <Clock className="h-4 w-4 text-amber-500" />
        <span className="text-sm font-medium">
          {timeRemaining <= 0 
            ? 'You can retry now' 
            : `Wait ${formatTime(timeRemaining)} before retrying`}
        </span>
      </div>
      {resetAt && (
        <p className="text-xs text-muted-foreground">
          Limit resets at {new Date(resetAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      )}
    </div>
  )
}
