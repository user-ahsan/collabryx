'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';

export interface EmbeddingQueueStatus {
  pending: boolean;
  processing: boolean;
  completed: boolean;
  failed: boolean;
  queue_id?: string;
  created_at?: string;
  completed_at?: string;
  failure_reason?: string;
}

/**
 * Hook to monitor embedding queue status for a specific user
 * Subscribes to realtime updates from embedding_pending_queue table
 */
export function useEmbeddingQueueStatus(userId: string) {
  const [status, setStatus] = useState<EmbeddingQueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // Skip if already initialized
    if (initialized.current) return;
    initialized.current = true;

    if (!userId) {
      // Initialize with null status when no userId
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Initialization pattern
      setStatus({ pending: false, processing: false, completed: false, failed: false });
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Initialization pattern
      setLoading(false);
      return;
    }

    const supabase = createClient();
    let isMounted = true;

    const loadStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('embedding_pending_queue')
          .select('id, status, created_at, completed_at, failure_reason')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No record found
            if (isMounted) {
              setStatus(null);
              setLoading(false);
            }
            return;
          }
          console.error('Error loading embedding queue status:', error);
          if (isMounted) {
            setStatus(null);
            setLoading(false);
          }
          return;
        }

        if (isMounted && data) {
          setStatus({
            pending: data.status === 'pending',
            processing: data.status === 'processing',
            completed: data.status === 'completed',
            failed: data.status === 'failed',
            queue_id: data.id,
            created_at: data.created_at,
            completed_at: data.completed_at,
            failure_reason: data.failure_reason
          });
          setLoading(false);
        }
      } catch (error) {
        console.error('Exception loading embedding queue status:', error);
        if (isMounted) {
          setStatus(null);
          setLoading(false);
        }
      }
    };

    // Load initial status
    loadStatus();

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`embedding-queue-${userId}`)
      .on('postgres_changes', {
        schema: 'public',
        table: 'embedding_pending_queue',
        filter: `user_id=eq.${userId}`,
        event: '*'
      }, async () => {
        await loadStatus();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return { status, loading };
}

/**
 * Hook to get overall embedding queue statistics
 * For admin dashboard monitoring
 */
export function useEmbeddingQueueStats() {
  const [stats, setStats] = useState<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    let isMounted = true;

    const loadStats = async () => {
      try {
        const { data, error } = await supabase
          .from('embedding_pending_queue')
          .select('status');

        if (error) {
          console.error('Error loading queue stats:', error);
          return;
        }

        if (isMounted && data) {
          const counts = {
            pending: data.filter(item => item.status === 'pending').length,
            processing: data.filter(item => item.status === 'processing').length,
            completed: data.filter(item => item.status === 'completed').length,
            failed: data.filter(item => item.status === 'failed').length
          };
          setStats(counts);
          setLoading(false);
        }
      } catch (error) {
        console.error('Exception loading queue stats:', error);
      }
    };

    loadStats();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('embedding-queue-stats')
      .on('postgres_changes', {
        schema: 'public',
        table: 'embedding_pending_queue',
        event: '*'
      }, async () => {
        await loadStats();
      })
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  return { stats, loading };
}
