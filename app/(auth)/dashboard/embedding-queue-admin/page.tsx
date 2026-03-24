'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDistance } from 'date-fns';
import { useEmbeddingQueueStats } from '@/hooks/use-embedding-queue-status';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle } from 'lucide-react';

interface PendingQueueItem {
  id: string;
  user_id: string;
  status: string;
  trigger_source: string;
  created_at: string;
  first_attempt: string | null;
  last_attempt: string | null;
  completed_at: string | null;
  failure_reason: string | null;
  profiles: {
    display_name: string | null;
    email: string;
  } | null;
}

interface DLQItem {
  id: string;
  user_id: string;
  status: string;
  retry_count: number;
  failure_reason: string | null;
  next_retry: string | null;
  created_at: string;
  profiles: {
    display_name: string | null;
    email: string;
  } | null;
}

export default function EmbeddingQueueAdminPage() {
  const [pendingItems, setPendingItems] = useState<PendingQueueItem[]>([]);
  const [dlqItems, setDlqItems] = useState<DLQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { stats, loading: statsLoading } = useEmbeddingQueueStats();

  useEffect(() => {
    loadQueueItems();
  }, []);

  const loadQueueItems = async () => {
    try {
      const supabase = createClient();
      
      // Load pending queue
      const { data: pendingData } = await supabase
        .from('embedding_pending_queue')
        .select('*, profiles(display_name, email)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (pendingData) {
        setPendingItems(pendingData);
      }

      // Load dead letter queue
      const { data: dlqData } = await supabase
        .from('embedding_dead_letter_queue')
        .select('*, profiles(display_name, email)')
        .order('created_at', { ascending: false })
        .limit(50);
      
      if (dlqData) {
        setDlqItems(dlqData);
      }
    } catch (error) {
      console.error('Error loading queue items:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      case 'processing':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Embedding Queue Administration</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage embedding generation queues
          </p>
        </div>
        <button
          onClick={loadQueueItems}
          className="flex items-center gap-2 px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Queue Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.pending || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Processing</CardTitle>
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.processing || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.completed || 0}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsLoading ? '...' : stats?.failed || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Embedding Requests
          </CardTitle>
          <CardDescription>
            Users waiting for embedding generation from onboarding and other sources
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : pendingItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No pending requests
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Queued At</TableHead>
                  <TableHead>First Attempt</TableHead>
                  <TableHead>Failure Reason</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.profiles?.display_name || item.profiles?.email || item.user_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.trigger_source === 'onboarding' ? 'default' : 'secondary'}>
                        {item.trigger_source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(item.status)} className="gap-1">
                        {getStatusIcon(item.status)}
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistance(new Date(item.created_at), new Date(), { addSuffix: true })}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.first_attempt 
                        ? formatDistance(new Date(item.first_attempt), new Date(), { addSuffix: true })
                        : 'Not started'}
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-destructive">
                      {item.failure_reason || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dead Letter Queue */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Dead Letter Queue (Failed Embeddings)
          </CardTitle>
          <CardDescription>
            Failed embedding requests scheduled for automatic retry
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : dlqItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No failed requests
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Retries</TableHead>
                  <TableHead>Failure Reason</TableHead>
                  <TableHead>Next Retry</TableHead>
                  <TableHead>Created At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dlqItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {item.profiles?.display_name || item.profiles?.email || item.user_id}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(item.status)} className="gap-1">
                        {getStatusIcon(item.status)}
                        {item.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.retry_count >= 3 ? 'destructive' : 'secondary'}>
                        {item.retry_count}/3
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate text-sm text-destructive">
                      {item.failure_reason || '-'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {item.next_retry 
                        ? formatDistance(new Date(item.next_retry), new Date(), { addSuffix: true })
                        : item.status === 'exhausted' 
                          ? 'Exhausted'
                          : 'Pending'}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistance(new Date(item.created_at), new Date(), { addSuffix: true })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
