import posthog from 'posthog-js'

/**
 * Track analytics events with PostHog
 * @param event - Event name to track
 * @param properties - Optional event properties
 */
export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    posthog.capture(event, properties)
  }
}

/**
 * Identify user with PostHog
 * @param userId - Unique user identifier
 * @param properties - Optional user properties
 */
export function identifyUser(userId: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined') {
    posthog.identify(userId, properties)
  }
}

/**
 * Predefined analytics events for consistent tracking
 */
export const AnalyticsEvents = {
  // Authentication
  USER_REGISTERED: 'user_registered',
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  
  // Onboarding
  ONBOARDING_STARTED: 'onboarding_started',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  ONBOARDING_STEP_COMPLETED: 'onboarding_step_completed',
  
  // Profile
  PROFILE_VIEWED: 'profile_viewed',
  PROFILE_UPDATED: 'profile_updated',
  PROFILE_COMPLETION_CHANGED: 'profile_completion_changed',
  
  // Posts
  POST_CREATED: 'post_created',
  POST_VIEWED: 'post_viewed',
  POST_EDITED: 'post_edited',
  POST_DELETED: 'post_deleted',
  POST_REACTED: 'post_reacted',
  
  // Connections
  CONNECTION_REQUEST_SENT: 'connection_request_sent',
  CONNECTION_REQUEST_ACCEPTED: 'connection_request_accepted',
  CONNECTION_REQUEST_REJECTED: 'connection_request_rejected',
  CONNECTION_REMOVED: 'connection_removed',
  
  // Matching
  MATCH_VIEWED: 'match_viewed',
  MATCH_SCORE_CHANGED: 'match_score_changed',
  MATCH_PREFERENCES_UPDATED: 'match_preferences_updated',
  
  // Messaging
  CONVERSATION_STARTED: 'conversation_started',
  MESSAGE_SENT: 'message_sent',
  MESSAGE_READ: 'message_read',
  
  // Search & Discovery
  SEARCH_PERFORMED: 'search_performed',
  SEARCH_RESULT_CLICKED: 'search_result_clicked',
  FILTER_APPLIED: 'filter_applied',
  
  // AI Features
  AI_MENTOR_SESSION_STARTED: 'ai_mentor_session_started',
  AI_MENTOR_MESSAGE_SENT: 'ai_mentor_message_sent',
  AI_EMBEDDING_GENERATED: 'ai_embedding_generated',
  
  // Notifications
  NOTIFICATION_RECEIVED: 'notification_received',
  NOTIFICATION_CLICKED: 'notification_clicked',
  NOTIFICATION_PREFERENCES_UPDATED: 'notification_preferences_updated',
  
  // Settings
  SETTINGS_UPDATED: 'settings_updated',
  THEME_CHANGED: 'theme_changed',
  
  // Errors
  ERROR_OCCURRED: 'error_occurred',
  API_ERROR: 'api_error',
} as const

/**
 * Type for predefined analytics events
 */
export type AnalyticsEventType = typeof AnalyticsEvents[keyof typeof AnalyticsEvents]

/**
 * Track a predefined event with type safety
 * @param event - Predefined event type
 * @param properties - Event properties
 */
export function trackTypedEvent(event: AnalyticsEventType, properties?: Record<string, unknown>) {
  trackEvent(event, properties)
}
