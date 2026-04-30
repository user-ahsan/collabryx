export class AIProviderError extends Error {
  constructor(
    message: string,
    public readonly provider: string,
    public readonly statusCode?: number
  ) {
    super(message)
    this.name = 'AIProviderError'
  }
}

export class MiniMaxAPIError extends AIProviderError {
  constructor(
    message: string,
    statusCode?: number,
    public readonly errorCode?: number
  ) {
    super(message, 'minimax', statusCode)
    this.name = 'MiniMaxAPIError'
  }
}

export class CircuitBreakerOpenError extends Error {
  constructor(public readonly provider: string) {
    super(`Circuit breaker is open for ${provider}`)
    this.name = 'CircuitBreakerOpenError'
  }
}

export class AllProvidersFailedError extends Error {
  constructor() {
    super('All AI providers are unavailable')
    this.name = 'AllProvidersFailedError'
  }
}