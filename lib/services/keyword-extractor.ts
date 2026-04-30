const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
  'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
  'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that'
])

export interface KeywordResult {
  keyword: string
  score: number
}

export function extractKeywords(text: string, limit = 20): KeywordResult[] {
  const words = text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !STOP_WORDS.has(w))
  
  const freq = new Map<string, number>()
  words.forEach(w => freq.set(w, (freq.get(w) || 0) + 1))
  
  const maxFreq = Math.max(...freq.values())
  
  return Array.from(freq.entries())
    .map(([keyword, count]) => ({
      keyword,
      score: count / maxFreq
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

export function extractFromProfile(
  headline: string | null,
  bio: string | null,
  skills: string[],
  interests: string[]
): string[] {
  const parts: string[] = []
  
  if (headline) parts.push(headline)
  if (bio) parts.push(bio)
  parts.push(...skills)
  parts.push(...interests)
  
  const keywords = extractKeywords(parts.join(' '), 20)
  return keywords.map(k => k.keyword)
}