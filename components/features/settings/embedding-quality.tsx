'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { formatDistance } from 'date-fns';

interface ValidationDetails {
  dimension: number;
  magnitude: number;
  min_value: number;
  max_value: number;
  mean_value: number;
  validated_at: string;
}

interface EmbeddingQuality {
  status: 'valid' | 'invalid' | 'unknown';
  details?: ValidationDetails;
}

interface EmbeddingQualityIndicatorProps {
  userId: string;
}

export function EmbeddingQualityIndicator({ userId }: EmbeddingQualityIndicatorProps) {
  const [quality, setQuality] = useState<EmbeddingQuality | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadQuality = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('profile_embeddings')
          .select('metadata, status')
          .eq('user_id', userId)
          .single();

        if (error || !data) {
          setQuality({ status: 'invalid' });
          return;
        }

        if (data.status === 'completed' && data?.metadata?.validation) {
          setQuality({
            status: 'valid',
            details: data.metadata.validation as ValidationDetails
          });
        } else if (data.status === 'failed') {
          setQuality({ status: 'invalid' });
        } else {
          setQuality({ status: 'unknown' });
        }
      } catch {
        console.error('Failed to load embedding quality:', error);
        setQuality({ status: 'invalid' });
      } finally {
        setLoading(false);
      }
    };

    if (userId) {
      loadQuality();
    }
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Embedding Quality</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (quality?.status !== 'valid' || !quality.details) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Embedding Quality</CardTitle>
          <Badge variant="default" className="bg-green-500">
            Valid
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Dimensions:</span>
            <span className="ml-2 font-mono">{quality.details.dimension}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Magnitude:</span>
            <span className="ml-2 font-mono">{quality.details.magnitude.toFixed(4)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Value Range:</span>
            <span className="ml-2 font-mono">
              [{quality.details.min_value.toFixed(4)}, {quality.details.max_value.toFixed(4)}]
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Mean Value:</span>
            <span className="ml-2 font-mono">{quality.details.mean_value.toFixed(4)}</span>
          </div>
          <div className="col-span-2">
            <span className="text-muted-foreground">Validated:</span>
            <span className="ml-2">
              {quality.details.validated_at 
                ? `${formatDistance(new Date(quality.details.validated_at), new Date())} ago`
                : 'Unknown'
              }
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
