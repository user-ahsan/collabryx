/**
 * Frontend hooks for new Python worker endpoints
 * - Content Moderation
 * - AI Mentor
 * - Analytics
 */

import { useState, useCallback } from 'react';

// ============================================================================
// Content Moderation Hook
// ============================================================================

export interface ModerateRequest {
  content: string;
  content_type?: 'post' | 'comment' | 'message' | 'profile';
}

export interface ModerateResponse {
  approved: boolean;
  flag_for_review: boolean;
  auto_reject: boolean;
  risk_score: number;
  action: 'approved' | 'flag_for_review' | 'auto_reject';
  details: {
    toxicity?: { score: number };
    spam?: { score: number };
    nsfw?: { score: number };
    pii?: { detected: boolean; types: string[] };
  };
  error?: string;
}

export function useContentModeration() {
  const [isModerating, setIsModerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const moderate = useCallback(async (
    content: string,
    contentType: 'post' | 'comment' | 'message' | 'profile' = 'post'
  ): Promise<ModerateResponse | null> => {
    setIsModerating(true);
    setError(null);

    try {
      const response = await fetch('/api/moderate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content,
          content_type: contentType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Moderation failed: ${response.statusText}`);
      }

      const data: ModerateResponse = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Moderation failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsModerating(false);
    }
  }, []);

  const canProceed = useCallback((result: ModerateResponse | null): boolean => {
    if (!result) return false;
    return result.approved || result.flag_for_review;
  }, []);

  return {
    moderate,
    isModerating,
    error,
    canProceed,
  };
}

// ============================================================================
// AI Mentor Hook
// ============================================================================

export interface MentorMessageRequest {
  user_id: string;
  message: string;
  session_id?: string | null;
}

export interface MentorMessageResponse {
  response: string;
  action_items: Array<{ task: string; priority: string }>;
  session_id: string;
  message_id?: string;
  suggested_next_steps: string[];
  error?: string;
}

export function useAIMentor() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    userId: string
  ): Promise<MentorMessageResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai-mentor/message', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: userId,
          message,
          session_id: sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`AI Mentor failed: ${response.statusText}`);
      }

      const data: MentorMessageResponse = await response.json();
      
      // Update session ID for follow-up messages
      if (data.session_id) {
        setSessionId(data.session_id);
      }
      
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'AI Mentor failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [sessionId]);

  const clearSession = useCallback(() => {
    setSessionId(null);
  }, []);

  return {
    sendMessage,
    isLoading,
    error,
    sessionId,
    clearSession,
  };
}

// ============================================================================
// Analytics Hook
// ============================================================================

export interface AnalyticsDailyRequest {
  date?: string; // YYYY-MM-DD format
}

export interface AnalyticsDailyResponse {
  status: 'success' | 'error';
  date: string;
  metrics: {
    dau?: number;
    mau?: number;
    wau?: number;
    new_users?: number;
    new_posts?: number;
    new_matches?: number;
    new_connections?: number;
    new_messages?: number;
    content_flagged?: number;
    [key: string]: number | undefined;
  };
  error?: string;
}

export function useAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getDailyStats = useCallback(async (
    date?: string
  ): Promise<AnalyticsDailyResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analytics/daily', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ date }),
      });

      if (!response.ok) {
        throw new Error(`Analytics failed: ${response.statusText}`);
      }

      const data: AnalyticsDailyResponse = await response.json();
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Analytics failed';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    getDailyStats,
    isLoading,
    error,
  };
}
