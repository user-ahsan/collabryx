import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { BM25, BM25Document } from '@/lib/services/bm25'
import type { RetrievedContext } from './types'

let openaiInstance: OpenAI | null = null

// TODO: Add ability to refresh the instance when the API key is rotated. The module-level
// singleton holds a stale key reference forever once created. (#167)

// TODO: Use external cache or scoped instance instead of module-level cache. Module-level
// state persists across requests in serverless environments and can cause memory leaks. (#166)

// Module-level BM25 index cache to avoid rebuilding on every query.
// NOTE: Shared across all users intentionally — for a single-tenant / embedded deployment
// this is fine because all profiles are indexed together. The cache is invalidated by
// CACHE_TTL_MS below. If multi-tenant isolation is needed, scope the cache by tenant ID.
interface BM25Cache {
  index: BM25 | null
  timestamp: number
}

const bm25Cache: BM25Cache = {
  index: null,
  timestamp: 0
}

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
  // TODO: Add fallback to Python worker embeddings when OpenAI is unavailable.
  // The Python embedding worker (python-worker/embedding_generator.py) can generate
  // embeddings locally as a backup to reduce OpenAI dependency costs. (#163)
  const response = await getOpenAIClient().embeddings.create({
    model: 'text-embedding-3-small',
    input: query,
    dimensions: 384
  })

  return response.data[0]?.embedding ?? []
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

  // TODO: Add LRU eviction to BM25 cache. The current unbounded cache grows indefinitely
  // as different query patterns trigger rebuilds. Add a max-age or size limit. (#165)
  // Check if cached BM25 index is still valid (reuse to avoid rebuilding on every query)
  const now = Date.now()
  if (bm25Cache.index && (now - bm25Cache.timestamp) < CACHE_TTL_MS) {
    const results = bm25Cache.index.search(query, limit)
    const maxScore = results.length > 0 ? results[0].score : 1
    return results.map(result => ({
      content: result.doc.text,
      score: maxScore > 0 ? result.score / maxScore : 0,
      source: 'keyword' as const,
      metadata: result.doc.metadata ?? {}
    }))
  }

  // TODO: Implement pagination for BM25 index. The current limit(100) on BM25 search results
  // may miss relevant matches for large user bases. Add offset-based or cursor-based pagination
  // and merge results across pages. (#164)
  // NOTE: 500-profile limit for BM25 index construction. The BM25 index is built in-memory
  // and searched locally, so the payload is proportional to avg profile text length × 500.
  // If the user base grows beyond 500, consider paginating or switching to Postgres full-text search.
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, display_name, headline, bio, looking_for, skills, interests')
    .limit(500)

  if (error) {
    throw new Error(`Failed to fetch profiles for keyword search: ${error.message}`)
  }

  if (!profiles || profiles.length === 0) {
    return []
  }

  const documents: BM25Document[] = profiles.map((profile: Record<string, unknown>) => ({
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

  // Update cache
  bm25Cache.index = bm25
  bm25Cache.timestamp = now

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