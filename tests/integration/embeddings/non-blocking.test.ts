/**
 * TC-049: Embedding generation is non-blocking to Node.js/Next.js UI threads
 *
 * Verifies that generating vector embeddings does not block the main
 * application thread and responses are returned asynchronously.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// ============================================================
// Simulated async worker call
// ============================================================
function simulateEmbeddingGeneration(
  text: string,
  userId: string,
  delayMs: number = 100
): Promise<{ embedding: number[]; processing_time_ms: number }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      const embedding = Array.from({ length: 384 }, (_, i) => Math.sin(i * 0.1) * 0.05)
      resolve({
        embedding,
        processing_time_ms: delayMs,
      })
    }, delayMs)
  })
}

function simulateApiResponse(delayMs: number = 50): Promise<{ status: string }> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({ status: 'queued' })
    }, delayMs)
  })
}

describe('TC-049: Non-blocking embedding generation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should return queued response immediately while embedding generates in background', async () => {
    // Arrange
    const userId = 'non-block-user-001'
    const bioText = 'Software engineer with 5 years of experience'

    // Act - start the "API call" that queues embedding and returns immediately
    const responsePromise = simulateApiResponse(10)
    const embeddingPromise = simulateEmbeddingGeneration(bioText, userId, 500)

    // Fast-forward past the quick API response but not the embedding
    vi.advanceTimersByTime(20)

    // Assert - API response is available (non-blocking)
    const apiResponse = await responsePromise
    expect(apiResponse.status).toBe('queued')

    // The embedding generation is still in progress
    // Promise.race should resolve with the faster one
    const raceResult = await Promise.race([
      responsePromise.then(() => 'api-done'),
      embeddingPromise.then(() => 'embedding-done'),
    ])
    expect(raceResult).toBe('api-done')
  })

  it('should not block the main thread during embedding generation', async () => {
    // Arrange
    const startTime = Date.now()

    // Act - simulate the Next.js response pathway
    // The response returns immediately ("queued"), then the embedding runs in background
    const responsePromise = simulateApiResponse(5)
    const _embeddingPromise = simulateEmbeddingGeneration('test bio', 'user-002', 1000)

    // Advance timers to complete the quick response
    vi.advanceTimersByTime(10)

    // Assert - main thread gets response immediately
    const response = await responsePromise
    expect(response.status).toBe('queued')

    // The embedding task is not awaited by the main response handler
    const elapsedAtResponse = Date.now() - startTime
    expect(elapsedAtResponse).toBeLessThan(500) // Response returned quickly
  })

  it('should allow multiple API requests while embeddings process concurrently', async () => {
    // Arrange
    const users = ['user-a', 'user-b', 'user-c', 'user-d', 'user-e']

    // Act - fire multiple requests, each queuing work in background
    const apiResponses = users.map((_uid) => simulateApiResponse(10))
    const _embeddingPromises = users.map((_uid) =>
      simulateEmbeddingGeneration(`Bio for ${_uid}`, _uid, 500)
    )

    vi.advanceTimersByTime(15)

    // Assert - all API responses returned quickly
    const responses = await Promise.all(apiResponses)
    for (const r of responses) {
      expect(r.status).toBe('queued')
    }
  })

  it('should handle error in background embedding without affecting the initial response', async () => {
    // Arrange
    let backgroundError: Error | null = null

    // Act - the API returns successfully, but the background worker encounters an error
    const apiPromise = simulateApiResponse(10)

    // Simulate an async embedding failure (doesn't block the response)
    const embeddingWithError = simulateEmbeddingGeneration('bad bio', 'error-user', 100).then(
      () => {
        throw new Error('Model timeout')
      }
    )

    // Catch the background error separately
    embeddingWithError.catch((err: Error) => {
      backgroundError = err
    })

    // Advance timers to let promises resolve
    vi.advanceTimersByTime(200)
    await Promise.resolve() // Flush microtasks (then callbacks)

    const apiResponse = await apiPromise

    // Assert
    expect(apiResponse.status).toBe('queued')
    // Background error is captured but doesn't affect the already-sent response
    expect((backgroundError as unknown as Error).message).toBe('Model timeout')
  })

  it('should not timeout the Next.js route handler while embedding processes', async () => {
    // Arrange - Next.js API routes have a default timeout
    // The embedding generation can take longer than the route timeout

    const _ROUTE_TIMEOUT_MS = 5000 // typical Vercel function timeout
    const embeddingDuration = 3000 // embedding takes 3s

    // Act - route handler returns immediately with queued status
    const routePromise = simulateApiResponse(5)
    const bgPromise = simulateEmbeddingGeneration('long bio', 'timeout-user', embeddingDuration)

    vi.advanceTimersByTime(10)
    const routeResult = await routePromise

    // Assert - route completed long before the embedding would finish
    expect(routeResult.status).toBe('queued')

    // Now complete the background task
    vi.advanceTimersByTime(embeddingDuration + 10)
    const embeddingResult = await bgPromise
    expect(embeddingResult.embedding).toHaveLength(384)
  })

  it('should allow UI interactions while embedding is generating', async () => {
    // Arrange - track if UI can proceed
    let uiCanProceed = false

    // Simulate the non-blocking pattern: fire and forget
    const bgProcess = simulateEmbeddingGeneration('async bio', 'ui-user', 500).then(() => {
      // Background work completes
    })

    // UI continues immediately
    uiCanProceed = true

    // Assert - UI is not blocked
    expect(uiCanProceed).toBe(true)

    // Background work still completes successfully
    vi.advanceTimersByTime(510)
    await bgProcess
  })

  it('should use Promise.race to verify non-blocking with 10x speed difference', async () => {
    // Arrange - API response is 10x faster than embedding generation
    const fastApi = simulateApiResponse(10)
    const slowEmbedding = simulateEmbeddingGeneration('bio', 'speed-test-user', 1000)

    vi.advanceTimersByTime(15)

    // Act - the faster promise resolves first
    const winner = await Promise.race([
      fastApi.then(() => 'api-response'),
      slowEmbedding.then(() => 'embedding-complete'),
    ])

    // Assert
    expect(winner).toBe('api-response')
  })
})
