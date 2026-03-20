"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { QUERY_CACHE_CONFIG, QUERY_PRESETS } from "@/lib/query-cache"

/**
 * Query Provider with optimized cache configuration
 * 
 * Features:
 * - Centralized cache settings (staleTime, gcTime)
 * - Retry logic with exponential backoff
 * - Query presets for different data types
 * - Disabled refetch on window focus (better UX)
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(() => new QueryClient({
        defaultOptions: {
            queries: {
                // Cache timing
                staleTime: QUERY_CACHE_CONFIG.staleTime,
                gcTime: QUERY_CACHE_CONFIG.gcTime,
                
                // Retry configuration
                retry: QUERY_CACHE_CONFIG.retry,
                retryDelay: QUERY_CACHE_CONFIG.retryDelay,
                
                // UX improvements
                refetchOnWindowFocus: false,
                refetchOnReconnect: true,
                
                // Error handling
                throwOnError: false,
            },
            mutations: {
                retry: QUERY_PRESETS.mutation.retry,
                retryDelay: QUERY_PRESETS.mutation.retryDelay,
            },
        },
    }))

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    )
}
