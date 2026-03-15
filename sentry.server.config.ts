import * as Sentry from "@sentry/nextjs"

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  
  // Performance monitoring
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  beforeSend(event, hint) {
    // Filter sensitive data from error events
    // Use hint.originalException to access the original error if needed
    void hint // Keep hint for potential future use
    
    if (event.request?.url?.includes('password') || 
        event.request?.url?.includes('token') ||
        event.request?.url?.includes('key')) {
      return null
    }
    
    // Log in development instead of sending
    if (process.env.NODE_ENV === 'development') {
      console.warn('[Sentry]', event)
      return null
    }
    
    return event
  },
  
  beforeSendTransaction(event) {
    // Filter sensitive data from transactions
    if (event.transaction?.includes('password') ||
        event.transaction?.includes('token')) {
      return null
    }
    
    return event
  },
})
