/**
 * Input Sanitization Utilities for Security
 * Prevents XSS, SQL injection, and other injection attacks
 * 
 * P1-01: Input Sanitization
 */

// ===========================================
// TEXT SANITIZATION
// ===========================================

/**
 * Sanitize plain text input
 * Removes HTML tags, control characters, and trims whitespace
 */
export function sanitizeText(input: string, options: {
  maxLength?: number
  trim?: boolean
  allowUnicode?: boolean
} = {}): string {
  if (!input) return ''
  
  let result = input
  
  // Trim whitespace
  if (options.trim !== false) {
    result = result.trim()
  }
  
  // Remove control characters (except newlines and tabs)
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  
  // Strip HTML tags
  result = result.replace(/<[^>]*>/g, '')
  
  // Limit length
  if (options.maxLength && result.length > options.maxLength) {
    result = result.slice(0, options.maxLength)
  }
  
  // Optionally restrict to ASCII only
  if (options.allowUnicode === false) {
    result = result.replace(/[^\x20-\x7E]/g, '')
  }
  
  return result
}

/**
 * Escape HTML special characters for safe display
 */
export function escapeHtml(text: string): string {
  if (!text) return ''
  
  const htmlEscapes: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  }
  
  return text.replace(/[&<>"'`=\/]/g, (char) => htmlEscapes[char])
}

// ===========================================
// HTML SANITIZATION
// ===========================================

/**
 * Allowed HTML tags for sanitization
 */
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li',
  'blockquote', 'code', 'pre',
  'a', 'img',
  'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'b', 'i', 'sub', 'sup', 'hr'
])

/**
 * Allowed HTML attributes
 */
const ALLOWED_ATTRS = new Set([
  'href', 'title', 'target', 'rel',
  'src', 'alt', 'width', 'height',
  'colspan', 'rowspan',
  'class'
])

/**
 * Dangerous protocols to block
 */
const DANGEROUS_PROTOCOLS = ['javascript:', 'data:', 'vbscript:']

/**
 * Sanitize HTML content
 * Removes scripts and dangerous attributes while allowing safe HTML
 */
export function sanitizeHtml(html: string, options: {
  allowScripts?: boolean
  allowStyle?: boolean
} = {}): string {
  if (!html) return ''
  
  // Remove script tags completely
  let result = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
  
  // Remove event handlers
  result = result.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '')
  result = result.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '')
  
  // Remove style if not allowed
  if (!options.allowStyle) {
    result = result.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    result = result.replace(/\s+style\s*=\s*["'][^"']*["']/gi, '')
  }
  
  return result
}

/**
 * Strip all HTML tags from string
 */
export function stripHtml(html: string): string {
  if (!html) return ''
  return html.replace(/<[^>]*>/g, '')
}

// ===========================================
// URL SANITIZATION
// ===========================================

/**
 * Sanitize and validate URL
 * Prevents javascript: and data: protocol attacks
 */
export function sanitizeUrl(url: string): string | null {
  if (!url) return null
  
  const trimmed = url.trim()
  
  // Block dangerous protocols
  const lowerUrl = trimmed.toLowerCase()
  if (
    lowerUrl.startsWith('javascript:') ||
    lowerUrl.startsWith('data:') ||
    lowerUrl.startsWith('vbscript:')
  ) {
    return null
  }
  
  try {
    // Validate URL format
    const parsed = new URL(trimmed)
    
    // Only allow http, https, and mailto protocols
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
      return null
    }
    
    return trimmed
  } catch {
    // If not absolute URL, check if it's a valid relative URL
    if (trimmed.startsWith('/') || trimmed.startsWith('#')) {
      return trimmed
    }
    return null
  }
}

/**
 * Sanitize domain name
 */
export function sanitizeDomain(domain: string): string | null {
  if (!domain) return null
  
  // Remove protocol if present
  let clean = domain.replace(/^https?:\/\//, '').replace(/^www\./, '')
  
  // Validate domain format
  const domainRegex = /^[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])?)*$/
  
  if (!domainRegex.test(clean)) {
    return null
  }
  
  return clean
}

// ===========================================
// FILE NAME SANITIZATION
// ===========================================

/**
 * Sanitize filename for safe storage
 * Removes path components and dangerous characters
 */
export function sanitizeFilename(filename: string): string {
  if (!filename) return ''
  
  // Remove path components (prevent directory traversal)
  let base = filename.split(/[\\/]/).pop() || ''
  
  // Remove or replace dangerous characters
  base = base.replace(/[^a-zA-Z0-9._-]/g, '_')
  
  // Remove null bytes
  base = base.replace(/\0/g, '')
  
  // Limit length (255 is typical filesystem limit)
  return base.slice(0, 255)
}

/**
 * Validate file extension against allowed list
 */
export function validateFileExtension(filename: string, allowed: string[]): boolean {
  if (!filename) return false
  
  const ext = filename.split('.').pop()?.toLowerCase() || ''
  return allowed.includes(ext)
}

// ===========================================
// DATABASE SANITIZATION
// ===========================================

/**
 * Sanitize for database storage
 * Note: Always use parameterized queries, this is defense in depth
 */
export function sanitizeForDatabase(value: string): string {
  if (!value) return ''
  
  // Remove null bytes
  return value.replace(/\0/g, '')
}

/**
 * Sanitize SQL LIKE pattern input
 * Escapes special LIKE characters
 */
export function sanitizeLikePattern(pattern: string): string {
  if (!pattern) return ''
  
  // Escape LIKE special characters
  return pattern
    .replace(/%/g, '\\%')
    .replace(/_/g, '\\_')
    .replace(/\\/g, '\\\\')
}

// ===========================================
// JSON SANITIZATION
// ===========================================

/**
 * Sanitize JSON input
 * Prevents prototype pollution and injection
 */
export function sanitizeJson<T>(input: unknown): T | null {
  if (input === null || input === undefined) {
    return null
  }
  
  try {
    // If string, parse it
    const parsed = typeof input === 'string' ? JSON.parse(input) : input
    
    // Block prototype pollution
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      ('__proto__' in parsed || 'constructor' in parsed || 'prototype' in parsed)
    ) {
      console.warn('Blocked prototype pollution attempt')
      return null
    }
    
    return parsed as T
  } catch {
    return null
  }
}

// ===========================================
// EMAIL SANITIZATION
// ===========================================

/**
 * Sanitize email address
 */
export function sanitizeEmail(email: string): string | null {
  if (!email) return null
  
  const trimmed = email.trim().toLowerCase()
  
  // Basic email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  if (!emailRegex.test(trimmed)) {
    return null
  }
  
  // Limit length
  if (trimmed.length > 254) {
    return null
  }
  
  return trimmed
}

// ===========================================
// COMPREHENSIVE INPUT SANITIZATION
// ===========================================

/**
 * Sanitize a single field based on type
 */
function sanitizeField(value: unknown, type: string, options: {
  maxLength?: number
  allowHtml?: boolean
  allowScripts?: boolean
} = {}): unknown {
  switch (type) {
    case 'text':
      return sanitizeText(String(value), { maxLength: options.maxLength })
    
    case 'html':
      return options.allowHtml
        ? sanitizeHtml(String(value), { allowScripts: options.allowScripts })
        : stripHtml(String(value))
    
    case 'url':
      return sanitizeUrl(String(value))
    
    case 'email':
      return sanitizeEmail(String(value))
    
    case 'filename':
      return sanitizeFilename(String(value))
    
    case 'number': {
      const num = Number(value)
      return isNaN(num) ? null : num
    }
    
    case 'boolean':
      return Boolean(value)
    
    default:
      return sanitizeText(String(value), { maxLength: options.maxLength })
  }
}

/**
 * Comprehensive input sanitization for API endpoints
 * Use this for all user input from forms and API requests
 */
export function sanitizeInput<T extends Record<string, unknown>>(
  input: T,
  schema: {
    [K in keyof T]?: {
      type?: 'text' | 'html' | 'url' | 'email' | 'filename' | 'number' | 'boolean'
      maxLength?: number
      required?: boolean
      allowHtml?: boolean
      allowScripts?: boolean
    }
  }
): { sanitized: Partial<T>; errors: string[] } {
  const sanitized: Partial<T> = {}
  const errors: string[] = []
  
  for (const [key, config] of Object.entries(schema)) {
    const value = input[key as keyof T]
    
    // Handle required fields
    if (config?.required && (value === null || value === undefined || value === '')) {
      errors.push(`${key} is required`)
      continue
    }
    
    // Skip undefined optional fields
    if (value === undefined || value === null) {
      continue
    }
    
    // Sanitize based on type
    const sanitizedValue = sanitizeField(value, config?.type || 'text', {
      maxLength: config?.maxLength,
      allowHtml: config?.allowHtml,
      allowScripts: config?.allowScripts,
    })
    
    // Check for validation errors
    if (sanitizedValue === null && ['url', 'email', 'number'].includes(config?.type || '')) {
      errors.push(`Invalid ${config?.type || 'value'}: ${key}`)
      continue
    }
    
    sanitized[key as keyof T] = sanitizedValue as T[keyof T]
  }
  
  return { sanitized, errors }
}

// ===========================================
// RATE LIMIT HELPERS
// ===========================================

/**
 * Check if input is trying to bypass rate limits via array expansion
 */
export function validateInputSize(input: unknown, maxSize: number): boolean {
  if (Array.isArray(input)) {
    return input.length <= maxSize
  }
  if (typeof input === 'object' && input !== null) {
    return Object.keys(input).length <= maxSize
  }
  if (typeof input === 'string') {
    return input.length <= maxSize
  }
  return true
}

/**
 * Validate array input size and return sanitized array
 */
export function sanitizeArray<T>(
  input: unknown[],
  sanitizeFn: (item: unknown) => T,
  maxSize: number = 100
): T[] {
  if (!Array.isArray(input)) {
    return []
  }
  
  // Enforce max size
  const limited = input.slice(0, maxSize)
  
  // Sanitize each item
  return limited.map(sanitizeFn)
}
