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
  // Fallback for environments without Web Crypto
  const array = new Uint8Array(length)
  for (let i = 0; i < length; i++) {
    array[i] = Math.floor(Math.random() * 256)
  }
  return array
}

async function hashSHA256(message: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(message)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  // Simple fallback hash (not cryptographically secure, but works for validation)
  let hash = 0
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return Math.abs(hash).toString(16).padStart(64, '0')
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
  
  cookieStore.set(CSRF_COOKIE_NAME, token, {
    httpOnly: false,
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
