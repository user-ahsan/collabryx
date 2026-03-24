import { createClient } from "@/lib/supabase/client"
import {
  withDatabaseProtection,
  executeProtectedQuery,
  withRetry,
  withTimeout,
  withCircuitBreaker,
  trackDatabaseOperation,
  getConnectionHealth,
  type ProtectedQueryOptions,
  type RetryOptions,
  type TimeoutOptions,
} from "@/lib/database-connection-manager"

export interface QueryStats {
  executionTime: number
  rowsReturned: number
  cacheHit: boolean
}

/**
 * @deprecated Use withDatabaseProtection from database-connection-manager instead
 */
export async function executeOptimizedQuery<T>(
  queryFn: () => Promise<T>,
  options?: ProtectedQueryOptions<T>
): Promise<{ data: T | null; error: Error | null; stats: QueryStats }> {
  const startTime = performance.now()
  
  try {
    const data = await withDatabaseProtection<T>(queryFn, {
      ...options,
      operationName: options?.operationName || 'optimizedQuery',
    })
    const executionTime = performance.now() - startTime
    
    return {
      data,
      error: null,
      stats: {
        executionTime,
        rowsReturned: Array.isArray(data) ? data.length : 1,
        cacheHit: false,
      },
    }
  } catch {
    const executionTime = performance.now() - startTime
    return {
      data: null,
      error: error instanceof Error ? error : new Error('Query failed'),
      stats: {
        executionTime,
        rowsReturned: 0,
        cacheHit: false,
      },
    }
  }
}

export async function fetchWithRetry<T>(
  fetchFn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    maxDelay?: number
    backoffMultiplier?: number
  } = {}
): Promise<{ data: T | null; error: Error | null; attempts: number }> {
  const {
    maxRetries = 3,
    initialDelay = 100,
    maxDelay = 5000,
    backoffMultiplier = 2,
  } = options

  let lastError: Error | null = null
  let delay = initialDelay

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const data = await fetchFn()
      return { data, error: null, attempts: attempt + 1 }
    } catch {
      lastError = error instanceof Error ? error : new Error('Fetch failed')
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay))
        delay = Math.min(delay * backoffMultiplier, maxDelay)
      }
    }
  }

  return { data: null, error: lastError, attempts: maxRetries + 1 }
}

export async function batchFetch<T, R>(
  items: T[],
  fetchFn: (item: T) => Promise<R>,
  options: {
    batchSize?: number
    delayBetweenBatches?: number
  } = {}
): Promise<{ results: R[]; errors: Error[] }> {
  const { batchSize = 5, delayBetweenBatches = 50 } = options
  
  const results: R[] = []
  const errors: Error[] = []
  
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize)
    
    const batchResults = await Promise.allSettled(
      batch.map(item => fetchFn(item))
    )
    
    batchResults.forEach((result) => {
      if (result.status === 'fulfilled') {
        results.push(result.value)
      } else {
        errors.push(result.reason instanceof Error ? result.reason : new Error('Batch fetch failed'))
      }
    })
    
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
    }
  }
  
  return { results, errors }
}

export async function getQueryPerformanceMetrics() {
  const supabase = createClient()
  
  const startTime = performance.now()
  const { data, error } = await supabase.from('profiles').select('id').limit(1)
  const executionTime = performance.now() - startTime
  
  return {
    avgExecutionTime: executionTime,
    rowsReturned: data?.length || 0,
    hasError: !!error,
    timestamp: new Date().toISOString(),
  }
}

export function createIndexRecommendation(
  tableName: string,
  frequentlyFilteredColumns: string[],
  frequentlyJoinedColumns: string[]
) {
  const recommendations: string[] = []
  
  if (frequentlyFilteredColumns.length > 0) {
    recommendations.push(
      `CREATE INDEX idx_${tableName}_${frequentlyFilteredColumns.join('_')}_filter ` +
      `ON ${tableName} (${frequentlyFilteredColumns.join(', ')})`
    )
  }
  
  if (frequentlyJoinedColumns.length > 0) {
    frequentlyJoinedColumns.forEach(column => {
      recommendations.push(
        `CREATE INDEX idx_${tableName}_${column}_join ON ${tableName} (${column})`
      )
    })
  }
  
  return recommendations
}
