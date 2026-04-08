/**
 * Python Worker API Client
 * Handles dev/prod URL automatically via config
 */

import { config } from '@/lib/config'

const WORKER_BASE_URL = config.worker.url

interface WorkerHealthResponse {
  status: 'healthy' | 'unhealthy'
  version: string
  embedding_model_loaded: boolean
  database_connected: boolean
  timestamp: string
}

interface EmbeddingRequest {
  text: string
  user_id: string
}

interface EmbeddingResponse {
  embedding: number[]
  model: string
  processing_time_ms: number
}

export class WorkerClient {
  private baseUrl: string

  constructor(baseUrl: string = WORKER_BASE_URL) {
    this.baseUrl = baseUrl
  }

  async healthCheck(): Promise<WorkerHealthResponse> {
    const response = await fetch(`${this.baseUrl}/health`, {
      signal: AbortSignal.timeout(5000),
    })
    if (!response.ok) {
      throw new Error(`Worker unhealthy: ${response.status}`)
    }
    return response.json()
  }

  async generateEmbedding(text: string, userId: string): Promise<EmbeddingResponse> {
    const response = await fetch(`${this.baseUrl}/embeddings/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, user_id: userId } satisfies EmbeddingRequest),
      signal: AbortSignal.timeout(30000),
    })
    if (!response.ok) {
      throw new Error(`Embedding failed: ${response.status}`)
    }
    return response.json()
  }

  async isHealthy(): Promise<boolean> {
    try {
      await this.healthCheck()
      return true
    } catch {
      return false
    }
  }
}

export const workerClient = new WorkerClient()
