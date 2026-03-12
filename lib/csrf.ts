import { cookies } from 'next/headers'
import { randomBytes, createHash } from 'crypto'

const CSRF_COOKIE_NAME = 'csrf_token'
const TOKEN_LENGTH = 32
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000

export function generateCSRFToken(): string {
  return randomBytes(TOKEN_LENGTH).toString('hex')
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
    token = generateCSRFToken()
  }

  return token
}

export async function setCSRFToken(): Promise<string> {
  const token = generateCSRFToken()
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

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
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

  const hashedRequest = hashToken(requestToken)
  const hashedCookie = hashToken(cookieToken)

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
