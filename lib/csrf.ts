import { cookies } from 'next/headers'

const CSRF_COOKIE_NAME = 'csrf_token'
const TOKEN_LENGTH = 32
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000

// Web Crypto API replacement for Node.js crypto (Edge Runtime compatible)
async function generateRandomBytes(length: number): Promise<Uint8Array> {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint8Array(length)
    crypto.getRandomValues(array)
    return array
  }
  // No secure fallback — throw error instead of using insecure Math.random()
  throw new Error('Cryptographically secure random number generation is not available in this environment')
}

async function hashSHA256(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  throw new Error('SHA-256 hashing is not available in this environment')
}

export async function generateCSRFToken(): Promise<string> {
  const randomBytes = await generateRandomBytes(TOKEN_LENGTH)
  return Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export function validateCSRFToken(token: string): boolean {
  if (!token || token.length !== TOKEN_LENGTH * 2) {
    return false
  }
  
  const tokenPattern = /^[a-f0-9]{64}$/i
  return tokenPattern.test(token)
}

export async function getCSRFToken(): Promise<string> {
  const cookieStore = await cookies()
  let token = cookieStore.get(CSRF_COOKIE_NAME)?.value

  if (!token || !validateCSRFToken(token)) {
    token = await generateCSRFToken()
  }

  return token
}

export async function setCSRFToken(): Promise<string> {
  const token = await generateCSRFToken()
  const cookieStore = await cookies()

  // httpOnly: true prevents XSS from reading the token — SameSite:strict alone is insufficient
  // The token must be read from a meta tag or API response and set as a request header
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: TOKEN_EXPIRY / 1000,
    path: '/',
  })

  return token
}

export async function hashToken(token: string): Promise<string> {
  return hashSHA256(token)
}

export async function validateCSRFRequest(
  requestToken: string | null,
  cookieToken: string | null
): Promise<boolean> {
  if (!requestToken || !cookieToken) {
    return false
  }

  if (!validateCSRFToken(requestToken) || !validateCSRFToken(cookieToken)) {
    return false
  }

  const [hashedRequest, hashedCookie] = await Promise.all([
    hashToken(requestToken),
    hashToken(cookieToken)
  ])

  return hashedRequest === hashedCookie || requestToken === cookieToken
}

export function getCSRFHeaders(token: string) {
  return {
    'X-CSRF-Token': token,
    'Access-Control-Expose-Headers': 'X-CSRF-Token',
  }
}

export const SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

export function requiresCSRF(method: string): boolean {
  return !SAFE_METHODS.includes(method.toUpperCase())
}

// Runtime validation for client-side
export function validateCSRFTokenClient(token: string | null): boolean {
  if (!token) {
    return false
  }
  
  if (token.length !== TOKEN_LENGTH * 2) {
    return false
  }
  
  const tokenPattern = /^[a-f0-9]{64}$/i
  return tokenPattern.test(token)
}

/**
 * Helper wrapper for enforcing CSRF validation in API route handlers.
 * Returns a 403 response if validation fails, or null if it passes.
 * Usage:
 *   const csrfError = await enforceCSRF(request)
 *   if (csrfError) return csrfError
 */
export async function enforceCSRF(request: Request): Promise<Response | null> {
  if (!requiresCSRF(request.method)) {
    return null
  }

  const csrfToken = request.headers.get('x-csrf-token')
  // Use next/headers cookies() for server context compatibility
  const cookieStore = await cookies()
  const cookieToken = cookieStore.get(CSRF_COOKIE_NAME)?.value ?? null

  if (!cookieToken) {
    if (!csrfToken || !validateCSRFToken(csrfToken)) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      )
    }
    return null
  }

  const isValid = await validateCSRFRequest(csrfToken, cookieToken)
  if (!isValid) {
    return new Response(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    )
  }

  return null
}
