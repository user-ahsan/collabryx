/**
 * Database Connection Pooling Configuration
 * 
 * Configures Supabase connection pool settings for optimal performance
 * Implements connection limits, timeouts, and idle cleanup
 */

// ===========================================
// POOL CONFIGURATION
// ===========================================

export const DATABASE_POOL_CONFIG = {
  // Pool size limits
  MIN_POOL_SIZE: 2,
  MAX_POOL_SIZE: 20,
  
  // Timeouts (in milliseconds)
  CONNECTION_TIMEOUT: 10000,        // 10 seconds
  ACQUIRE_TIMEOUT: 30000,           // 30 seconds
  IDLE_TIMEOUT: 600000,             // 10 minutes
  CREATE_TIMEOUT: 30000,            // 30 seconds
  
  // Retry configuration
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000,                // 1 second
  
  // Health check
  HEALTH_CHECK_INTERVAL: 300000,    // 5 minutes
  HEALTH_CHECK_TIMEOUT: 5000,       // 5 seconds
  
  // Query limits
  QUERY_TIMEOUT: 30000,             // 30 seconds
  STATEMENT_TIMEOUT: 60000,         // 60 seconds
  
  // Environment-specific overrides
  ENV_OVERRIDES: {
    development: {
      MAX_POOL_SIZE: 5,
      MIN_POOL_SIZE: 1,
      IDLE_TIMEOUT: 300000,         // 5 minutes
    },
    test: {
      MAX_POOL_SIZE: 2,
      MIN_POOL_SIZE: 1,
      IDLE_TIMEOUT: 60000,          // 1 minute
    },
    production: {
      MAX_POOL_SIZE: 20,
      MIN_POOL_SIZE: 5,
      IDLE_TIMEOUT: 600000,         // 10 minutes
    },
  },
} as const

// ===========================================
// TYPES
// ===========================================

export interface PoolConfig {
  minSize: number
  maxSize: number
  connectionTimeout: number
  acquireTimeout: number
  idleTimeout: number
  maxRetries: number
  retryDelay: number
  healthCheckInterval: number
  queryTimeout: number
  statementTimeout: number
}

// ===========================================
// CONFIGURATION FUNCTIONS
// ===========================================

/**
 * Get pool configuration based on environment
 */
export function getPoolConfig(): PoolConfig {
  const env = process.env.NODE_ENV || 'development'
  const envOverrides = DATABASE_POOL_CONFIG.ENV_OVERRIDES[env as keyof typeof DATABASE_POOL_CONFIG.ENV_OVERRIDES]
  
  const baseConfig: PoolConfig = {
    minSize: DATABASE_POOL_CONFIG.MIN_POOL_SIZE,
    maxSize: DATABASE_POOL_CONFIG.MAX_POOL_SIZE,
    connectionTimeout: DATABASE_POOL_CONFIG.CONNECTION_TIMEOUT,
    acquireTimeout: DATABASE_POOL_CONFIG.ACQUIRE_TIMEOUT,
    idleTimeout: DATABASE_POOL_CONFIG.IDLE_TIMEOUT,
    maxRetries: DATABASE_POOL_CONFIG.MAX_RETRIES,
    retryDelay: DATABASE_POOL_CONFIG.RETRY_DELAY,
    healthCheckInterval: DATABASE_POOL_CONFIG.HEALTH_CHECK_INTERVAL,
    queryTimeout: DATABASE_POOL_CONFIG.QUERY_TIMEOUT,
    statementTimeout: DATABASE_POOL_CONFIG.STATEMENT_TIMEOUT,
  }
  
  // Apply environment-specific overrides
  if (envOverrides) {
    return {
      ...baseConfig,
      ...envOverrides,
    }
  }
  
  return baseConfig
}

/**
 * Get pool configuration for Supabase client
 */
export function getSupabasePoolConfig() {
  const config = getPoolConfig()
  
  return {
    // Connection settings
    max: config.maxSize,
    min: config.minSize,
    
    // Timeouts
    connectionTimeoutMillis: config.connectionTimeout,
    idleTimeoutMillis: config.idleTimeout,
    acquireTimeoutMillis: config.acquireTimeout,
    
    // Health check
    keepAlive: true,
    keepAliveInitialDelayMillis: config.healthCheckInterval,
  }
}

/**
 * Get environment-specific pool size
 */
export function getPoolSize(): { min: number; max: number } {
  const config = getPoolConfig()
  return {
    min: config.minSize,
    max: config.maxSize,
  }
}

// ===========================================
// CONNECTION MONITORING
// ===========================================

/**
 * Connection pool metrics
 */
export interface PoolMetrics {
  active: number
  idle: number
  waiting: number
  total: number
  max: number
  utilization: number
}

/**
 * Calculate pool utilization percentage
 */
export function calculatePoolUtilization(active: number, max: number): number {
  if (max === 0) return 0
  return Math.round((active / max) * 100)
}

/**
 * Check if pool is near capacity
 */
export function isPoolNearCapacity(active: number, max: number, threshold: number = 0.8): boolean {
  const utilization = calculatePoolUtilization(active, max)
  return utilization >= threshold * 100
}

// ===========================================
// ERROR HANDLING
// ===========================================

export class PoolError extends Error {
  public readonly code: string
  public readonly retryable: boolean
  
  constructor(message: string, code: string = 'POOL_ERROR', retryable: boolean = false) {
    super(message)
    this.name = 'PoolError'
    this.code = code
    this.retryable = retryable
  }
}

export class ConnectionTimeoutError extends PoolError {
  constructor(timeout: number) {
    super(`Connection timeout after ${timeout}ms`, 'CONNECTION_TIMEOUT', true)
    this.name = 'ConnectionTimeoutError'
  }
}

export class PoolExhaustedError extends PoolError {
  constructor(maxSize: number) {
    super(`Connection pool exhausted (max: ${maxSize})`, 'POOL_EXHAUSTED', true)
    this.name = 'PoolExhaustedError'
  }
}

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Validate pool configuration
 */
export function validatePoolConfig(config: PoolConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  
  if (config.minSize < 1) {
    errors.push('minSize must be at least 1')
  }
  
  if (config.maxSize < config.minSize) {
    errors.push('maxSize must be greater than or equal to minSize')
  }
  
  if (config.maxSize > 100) {
    errors.push('maxSize should not exceed 100 for most use cases')
  }
  
  if (config.connectionTimeout <= 0) {
    errors.push('connectionTimeout must be positive')
  }
  
  if (config.idleTimeout <= 0) {
    errors.push('idleTimeout must be positive')
  }
  
  if (config.acquireTimeout <= config.connectionTimeout) {
    errors.push('acquireTimeout should be greater than connectionTimeout')
  }
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Log pool configuration
 */
export function logPoolConfig(): void {
  const config = getPoolConfig()
  const { valid, errors } = validatePoolConfig(config)
  
  console.log('📊 Database Pool Configuration:')
  console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`)
  console.log(`   Min Pool Size: ${config.minSize}`)
  console.log(`   Max Pool Size: ${config.maxSize}`)
  console.log(`   Connection Timeout: ${config.connectionTimeout}ms`)
  console.log(`   Idle Timeout: ${config.idleTimeout}ms`)
  console.log(`   Query Timeout: ${config.queryTimeout}ms`)
  
  if (!valid) {
    console.warn('⚠️  Pool configuration issues:')
    errors.forEach(error => console.warn(`   - ${error}`))
  } else {
    console.log('✅ Pool configuration valid')
  }
}

// ===========================================
// EXPORTS
// ===========================================

export { DATABASE_POOL_CONFIG as databasePoolConfig }
const databaseConfig = {
  getPoolConfig,
  getSupabasePoolConfig,
  getPoolSize,
  calculatePoolUtilization,
  isPoolNearCapacity,
  validatePoolConfig,
  logPoolConfig,
  PoolError,
  ConnectionTimeoutError,
  PoolExhaustedError,
  DATABASE_POOL_CONFIG,
}
export default databaseConfig
