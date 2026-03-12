"use client"

import { Suspense, ReactNode } from "react"
import { motion } from "framer-motion"

interface LoadingSkeletonProps {
  className?: string
  lines?: number
}

export function LoadingSkeleton({ className = "", lines = 3 }: LoadingSkeletonProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <motion.div
          key={i}
          className="h-4 bg-gradient-to-r from-muted/50 via-muted to-muted/50 rounded animate-pulse"
          style={{
            width: `${100 - (i % 3) * 15}%`,
          }}
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            duration: 1,
            repeat: Infinity,
            repeatType: "reverse",
            delay: i * 0.1,
          }}
        />
      ))}
    </div>
  )
}

interface StreamBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
}

export function StreamBoundary({ children, fallback }: StreamBoundaryProps) {
  return (
    <Suspense fallback={fallback || <LoadingSkeleton lines={4} />}>
      {children}
    </Suspense>
  )
}

interface ParallelRouteProps {
  primary: ReactNode
  secondary?: ReactNode
  loadingPrimary?: ReactNode
  loadingSecondary?: ReactNode
}

export function ParallelRoute({
  primary,
  secondary,
  loadingPrimary = <LoadingSkeleton lines={6} />,
  loadingSecondary = <LoadingSkeleton lines={3} />,
}: ParallelRouteProps) {
  return (
    <>
      <StreamBoundary fallback={loadingPrimary}>{primary}</StreamBoundary>
      {secondary && (
        <StreamBoundary fallback={loadingSecondary}>{secondary}</StreamBoundary>
      )}
    </>
  )
}

export function CardSkeleton() {
  return (
    <div className="p-6 space-y-4 rounded-xl border bg-card">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-32 bg-muted rounded animate-pulse" />
          <div className="h-3 w-24 bg-muted/50 rounded animate-pulse" />
        </div>
      </div>
      <LoadingSkeleton lines={2} />
    </div>
  )
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  )
}

export function MatchesSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="p-6 rounded-xl border bg-card space-y-4">
          <div className="flex flex-col items-center gap-3">
            <div className="h-20 w-20 rounded-full bg-muted animate-pulse" />
            <div className="space-y-2 text-center">
              <div className="h-5 w-32 bg-muted rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
          <LoadingSkeleton lines={3} />
        </div>
      ))}
    </div>
  )
}

export function MessagesSkeleton() {
  return (
    <div className="flex gap-4">
      <div className="w-64 border-r p-4 space-y-3 hidden md:block">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
              <div className="h-3 w-32 bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      <div className="flex-1 p-4 space-y-4">
        <div className="h-16 bg-muted/30 rounded animate-pulse" />
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-48 bg-muted rounded animate-pulse" />
              <div className="h-3 w-64 bg-muted/50 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
