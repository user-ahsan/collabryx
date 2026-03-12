import { NextRequest } from 'next/server'

const KNOWN_BOT_PATTERNS = [
  /bot/i,
  /spider/i,
  /crawler/i,
  /scraper/i,
  /curl/i,
  /wget/i,
  /python/i,
  /httpclient/i,
  /java\//i,
  /perl/i,
  /ruby/i,
  /phantom/i,
  /headless/i,
  /puppeteer/i,
  /selenium/i,
]

const SAFE_BOT_PATTERNS = [
  /googlebot/i,
  /bingbot/i,
  /slurp/i,
  /duckduckbot/i,
  /baiduspider/i,
  /yandexbot/i,
  /facebot/i,
  /twitterbot/i,
  /linkedinbot/i,
]

const SUSPICIOUS_PATHS = [
  '/wp-admin',
  '/wp-login',
  '/.env',
  '/.git',
  '/config',
  '/backup',
  '/admin',
  '/phpmyadmin',
  '/.aws',
  '/.ssh',
]

interface BotCheckResult {
  isBot: boolean
  isSafeBot: boolean
  isSuspicious: boolean
  score: number
  reason: string
}

export function checkBot(request: NextRequest): BotCheckResult {
  const userAgent = request.headers.get('user-agent') || ''
  const path = request.nextUrl.pathname
  const acceptLanguage = request.headers.get('accept-language') || ''
  const acceptEncoding = request.headers.get('accept-encoding') || ''
  
  let score = 0
  const reasons: string[] = []
  let isSafeBot = false
  let isSuspicious = false

  if (SAFE_BOT_PATTERNS.some(pattern => pattern.test(userAgent))) {
    isSafeBot = true
    return {
      isBot: true,
      isSafeBot: true,
      isSuspicious: false,
      score: 0,
      reason: 'Safe search engine bot',
    }
  }

  if (KNOWN_BOT_PATTERNS.some(pattern => pattern.test(userAgent))) {
    score += 40
    reasons.push('Known bot pattern in User-Agent')
  }

  if (SUSPICIOUS_PATHS.some(p => path.startsWith(p))) {
    score += 50
    isSuspicious = true
    reasons.push('Accessing suspicious path')
  }

  if (!userAgent || userAgent.length < 10) {
    score += 30
    reasons.push('Missing or very short User-Agent')
  }

  if (!acceptLanguage) {
    score += 15
    reasons.push('Missing Accept-Language header')
  }

  if (!acceptEncoding) {
    score += 15
    reasons.push('Missing Accept-Encoding header')
  }

  if (acceptEncoding && !acceptEncoding.includes('gzip') && !acceptEncoding.includes('br')) {
    score += 10
    reasons.push('Unusual Accept-Encoding')
  }

  const hasHumanHeaders = acceptLanguage && acceptEncoding && userAgent.length > 50
  if (!hasHumanHeaders) {
    score += 20
    reasons.push('Missing typical browser headers')
  }

  return {
    isBot: score >= 50,
    isSafeBot,
    isSuspicious,
    score: Math.min(score, 100),
    reason: reasons.join('; ') || 'No bot indicators',
  }
}

export function shouldBlockBot(result: BotCheckResult): boolean {
  if (result.isSafeBot) return false
  if (result.isSuspicious) return true
  if (result.score >= 70) return true
  return false
}

export function getBotHeaders(result: BotCheckResult) {
  return {
    'X-Bot-Score': result.score.toString(),
    'X-Bot-Detected': result.isBot.toString(),
    'X-Bot-Reason': encodeURIComponent(result.reason),
  }
}
