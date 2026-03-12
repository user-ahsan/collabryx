/**
 * Centralized logger for consistent logging across the application
 * 
 * Usage:
 * ```ts
 * logger.info("User logged in", { userId: "123" })
 * logger.error("Failed to fetch data", error)
 * logger.debug("Debug info", { data })
 * ```
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error'

interface LogContext {
  [key: string]: unknown
}

class Logger {
  private prefix: string
  private minLevel: LogLevel

  constructor(prefix: string = '', minLevel: LogLevel = 'debug') {
    this.prefix = prefix
    this.minLevel = minLevel
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    return levels.indexOf(level) >= levels.indexOf(this.minLevel)
  }

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString()
    const prefix = this.prefix ? `[${this.prefix}] ` : ''
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    return `[${timestamp}] ${prefix}[${level.toUpperCase()}] ${message}${contextStr}`
  }

  debug(message: string, context?: LogContext): void {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message, context))
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message, context))
    }
  }

  warn(message: string, context?: LogContext): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message, context))
    }
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    if (this.shouldLog('error')) {
      const fullContext = {
        ...context,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      }
      console.error(this.formatMessage('error', message, fullContext))
    }
  }
}

// Create logger instances for different modules
export const logger = {
  // General application logger
  app: new Logger('App'),
  
  // Authentication logger
  auth: new Logger('Auth'),
  
  // Database logger
  db: new Logger('Database'),
  
  // API logger
  api: new Logger('API'),
  
  // Development/Debug logger (only in development)
  dev: process.env.NODE_ENV === 'development' ? new Logger('Dev') : new Logger('Dev', 'warn'),
}

// Default export for general use
export default logger.app
