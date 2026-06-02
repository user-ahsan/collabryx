import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { BM25, BM25Document } from '@/lib/services/bm25'
import type { RetrievedContext } from './types'

let openaiInstance: OpenAI | null = null

// Ability to refresh the instance when the API key is rotated
export function refreshOpenAIClient(newApiKey: string) {
  openaiInstance = new OpenAI({ apiKey: newApiKey })
}

// Module-level BM25 index cache with LRU properties to prevent unbounded memory growth.
interface BM25CacheEntry {
  index: BM25
  timestamp: number
}

// Simple LRU cache structure supporting up to 10 indices keyed by profile groups or tenant
const bm25Cache = new Map<string, BM25CacheEntry>()
const MAX_CACHE_SIZE = 10
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

function getOpenAIClient(): OpenAI {
  if (!openaiInstance) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured — cannot create OpenAI client')
    }
    openaiInstance = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return openaiInstance
}

export interface VectorRetrieverOptions {
  limit?: number
  vectorWeight?: number
  keywordWeight?: number
  matchThreshold?: number
}

export async function retrieveContextFromVectorStore(
  query: string,
  userId: string,
  options: VectorRetrieverOptions = {}
): Promise<{ contexts: RetrievedContext[]; warnings: string[] }> {
  const {
    limit = 5,
    vectorWeight = 0.7,
    keywordWeight = 0.3,
    matchThreshold = 0.7
  } = options

  const warnings: string[] = []

  let queryEmbedding: number[] | null = null
  let vectorResults: RetrievedContext[] = []
  let keywordResults: RetrievedContext[] = []

  try {
    queryEmbedding = await generateQueryEmbedding(query)
  } catch (error) {
    warnings.push(`Failed to generate query embedding: ${error instanceof Error ? error.message : 'Unknown error'}`)
    return { contexts: [], warnings }
  }

  if (queryEmbedding) {
    try {
      vectorResults = await searchVectorStore(queryEmbedding, userId, limit, matchThreshold)
    } catch (error) {
      warnings.push(`Vector search failed, falling back to keyword search: ${error instanceof Error ? error.message : 'Unknown error'}`)
      vectorResults = []
    }
  }

  try {
    keywordResults = await searchKeywordIndex(query, limit)
  } catch (error) {
    warnings.push(`Keyword search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    keywordResults = []
  }

  const contexts = combineResults(vectorResults, keywordResults, vectorWeight, keywordWeight)

  if (contexts.length === 0 && warnings.length === 0) {
    warnings.push('No relevant context found for query')
  }

  return { contexts, warnings }
}

async function generateQueryEmbedding(query: string): Promise<number[]> {
  try {
    const response = await getOpenAIClient().embeddings.create({
      model: 'text-embedding-3-small',
      input: query,
      dimensions: 384
    })
    return response.data[0]?.embedding ?? []
  } catch (openaiError) {
    // Local fallback to python embedding worker if OpenAI is offline
    try {
      const pythonWorkerUrl = process.env.PYTHON_WORKER_URL || "http://localhost:8000"
      const res = await fetch(`${pythonWorkerUrl}/generate-embedding`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: query, user_id: "system-fallback" })
      })
      if (res.ok) {
        const body = await res.json()
        if (body.embedding) return body.embedding
      }
    } catch (fallbackError) {
      console.error("Local fallback embedding generator failed:", fallbackError)
    }
    throw openaiError;
  }
}

async function searchVectorStore(
  embedding: number[],
  userId: string,
  limit: number,
  matchThreshold: number
): Promise<RetrievedContext[]> {
  const supabase = await createClient()

  const { data, error } = await supabase.rpc('match_profile_embeddings', {
    query_embedding: embedding,
    match_threshold: matchThreshold,
    match_count: limit,
    exclusion_user_id: userId
  })

  if (error) {
    throw new Error(`Database query failed: ${error.message}`)
  }

  if (!data || data.length === 0) {
    return []
  }

  return data.map((row: Record<string, unknown>) => ({
    content: buildContentFromProfile(row),
    score: (row.similarity as number) ?? 0,
    source: 'vector' as const,
    metadata: {
      user_id: row.user_id,
      display_name: row.display_name,
      headline: row.headline
    }
  }))
}

async function searchKeywordIndex(
  query: string,
  limit: number
): Promise<RetrievedContext[]> {
  const supabase = await createClient()
  const cacheKey = "global_bm25_index"
  const now = Date.now()

  // Retrieve cached BM25 index if still active
  const cached = bm25Cache.get(cacheKey)
  if (cached && (now - cached.timestamp) < CACHE_TTL_MS) {
    // Move cache entry to end to represent LRU activity
    bm25Cache.delete(cacheKey)
    bm25Cache.set(cacheKey, cached)
    
    const results = cached.index.search(query, limit)
    const maxScore = results.length > 0 ? results[0].score : 1
    return results.map(result => ({
      content: result.doc.text,
      score: maxScore > 0 ? result.score / maxScore : 0,
      source: 'keyword' as const,
      metadata: result.doc.metadata ?? {}
    }))
  }

  // Retrieve all profiles using cursor-based pagination for scalability
  const allProfiles: Record<string, unknown>[] = []
  let lastId: string | null = null
  const pageSize = 200
  let keepFetching = true

  while (keepFetching) {
    let q = supabase
      .from('profiles')
      .select('id, display_name, headline, bio, looking_for, skills, interests')
      .order('id', { ascending: true })
      .limit(pageSize)

    if (lastId) {
      q = q.gt('id', lastId)
    }

    const { data: batch, error } = await q
    if (error) throw new Error(`Failed to fetch profiles for keyword search: ${error.message}`)

    if (!batch || batch.length === 0) {
      keepFetching = false
    } else {
      allProfiles.push(...batch)
      lastId = batch[batch.length - 1].id
      if (batch.length < pageSize || allProfiles.length >= 1000) {
        keepFetching = false // Stop at 1000 profiles max to protect memory
      }
    }
  }

  if (allProfiles.length === 0) {
    return []
  }

  const documents: BM25Document[] = allProfiles.map((profile: Record<string, unknown>) => ({
    id: profile.id as string,
    text: buildSearchableText(profile),
    metadata: {
      user_id: profile.id,
      display_name: profile.display_name,
      headline: profile.headline
    }
  }))

  const bm25 = new BM25()
  bm25.index(documents)

  // Enforce LRU eviction if size limit reached
  if (bm25Cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = bm25Cache.keys().next().value
    if (oldestKey) bm25Cache.delete(oldestKey)
  }

  // Update BM25 cache entry
  bm25Cache.set(cacheKey, { index: bm25, timestamp: now })

  const results = bm25.search(query, limit)
  const maxScore = results.length > 0 ? results[0].score : 1

  return results.map(result => ({
    content: result.doc.text,
    score: maxScore > 0 ? result.score / maxScore : 0,
    source: 'keyword' as const,
    metadata: result.doc.metadata ?? {}
  }))
}

function buildSearchableText(profile: Record<string, unknown>): string {
  const parts: string[] = []

  if (profile.display_name) {
    parts.push(profile.display_name as string)
  }
  if (profile.headline) {
    parts.push(profile.headline as string)
  }
  if (profile.bio) {
    parts.push(profile.bio as string)
  }
  if (Array.isArray(profile.looking_for)) {
    parts.push(...(profile.looking_for as string[]))
  }
  if (profile.skills && Array.isArray(profile.skills)) {
    const skillNames = (profile.skills as Array<{ skill_name?: string }>)
      .map(s => s.skill_name)
      .filter((name): name is string => typeof name === 'string')
    parts.push(...skillNames)
  }
  if (profile.interests && Array.isArray(profile.interests)) {
    const interestNames = (profile.interests as Array<{ interest?: string }>)
      .map(i => i.interest)
      .filter((name): name is string => typeof name === 'string')
    parts.push(...interestNames)
  }

  return parts.join(' ')
}

function buildContentFromProfile(row: Record<string, unknown>): string {
  const parts: string[] = []

  if (row.display_name) {
    parts.push(`Name: ${row.display_name}`)
  }
  if (row.headline) {
    parts.push(`Headline: ${row.headline}`)
  }
  if (row.bio) {
    parts.push(`Bio: ${row.bio}`)
  }
  if (Array.isArray(row.looking_for)) {
    parts.push(`Looking for: ${(row.looking_for as string[]).join(', ')}`)
  }
  if (row.skills && Array.isArray(row.skills)) {
    const skillNames = (row.skills as Array<{ skill_name?: string }>)
      .map(s => s.skill_name)
      .filter(Boolean)
    if (skillNames.length > 0) {
      parts.push(`Skills: ${skillNames.join(', ')}`)
    }
  }
  if (row.interests && Array.isArray(row.interests)) {
    const interestNames = (row.interests as Array<{ interest?: string }>)
      .map(i => i.interest)
      .filter(Boolean)
    if (interestNames.length > 0) {
      parts.push(`Interests: ${interestNames.join(', ')}`)
    }
  }

  return parts.join('\n')
}

function combineResults(
  vectorResults: RetrievedContext[],
  keywordResults: RetrievedContext[],
  vectorWeight: number,
  keywordWeight: number
): RetrievedContext[] {
  const scoreMap = new Map<string, RetrievedContext>()

  for (const result of vectorResults) {
    const key = result.metadata?.user_id as string
    if (key) {
      scoreMap.set(key, {
        ...result,
        score: result.score * vectorWeight,
        source: 'hybrid'
      })
    }
  }

  for (const result of keywordResults) {
    const key = result.metadata?.user_id as string
    if (key) {
      const existing = scoreMap.get(key)
      if (existing) {
        existing.score += result.score * keywordWeight
        existing.source = 'hybrid'
      } else {
        scoreMap.set(key, {
          ...result,
          score: result.score * keywordWeight,
          source: 'keyword'
        })
      }
    }
  }

  const combined = Array.from(scoreMap.values())

  combined.sort((a, b) => b.score - a.score)

  return combined
}