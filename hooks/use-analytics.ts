/**
 * Analytics Hook - React Query implementation
 * 
 * Provides typed, cached analytics data fetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  fetchUserAnalytics,
  fetchAnalyticsActivity,
  exportAnalyticsToCSV,
  TIME_RANGES,
} from '@/lib/services/analytics'
import type { UserAnalytics, AnalyticsActivityData } from '@/types/database.types'

export const ANALYTICS_QUERY_KEYS = {
  all: ['analytics'] as const,
  user: () => [...ANALYTICS_QUERY_KEYS.all, 'user'] as const,
  activity: (days: 7 | 30 | 90) => [...ANALYTICS_QUERY_KEYS.all, 'activity', days] as const,
}

export { TIME_RANGES }

/**
 * Hook to fetch user analytics data
 */
export function useUserAnalytics() {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.user(),
    queryFn: async () => {
      const { data, error } = await fetchUserAnalytics()
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 30,   // 30 minutes
    retry: 1,
  })
}

/**
 * Hook to fetch analytics activity data for charts
 */
export function useAnalyticsActivity(days: 7 | 30 | 90 = 30) {
  return useQuery({
    queryKey: ANALYTICS_QUERY_KEYS.activity(days),
    queryFn: async () => {
      const { data, error } = await fetchAnalyticsActivity(days)
      if (error) throw error
      return data
    },
    staleTime: 1000 * 60 * 10, // 10 minutes
    gcTime: 1000 * 60 * 60,    // 1 hour
    retry: 1,
  })
}

/**
 * Hook to export analytics data
 */
export function useExportAnalytics() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      analytics,
      activity,
      filename = 'analytics-export',
    }: {
      analytics: UserAnalytics
      activity: AnalyticsActivityData[]
      filename?: string
    }) => {
      const csvContent = exportAnalyticsToCSV(analytics, activity)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${filename}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)

      return { success: true }
    },
    onSuccess: () => {
      // Invalidate queries to refresh data after export
      queryClient.invalidateQueries({ queryKey: ANALYTICS_QUERY_KEYS.all })
    },
  })
}

/**
 * Combined hook for analytics dashboard
 */
export function useAnalyticsDashboard(timeRange: 7 | 30 | 90 = 30) {
  const analyticsQuery = useUserAnalytics()
  const activityQuery = useAnalyticsActivity(timeRange)

  return {
    analytics: analyticsQuery.data,
    activity: activityQuery.data,
    isLoading: analyticsQuery.isLoading || activityQuery.isLoading,
    isError: analyticsQuery.isError || activityQuery.isError,
    error: analyticsQuery.error || activityQuery.error,
    refetch: () => {
      analyticsQuery.refetch()
      activityQuery.refetch()
    },
  }
}
