# Table: `profile_embeddings`

> Stores 384-dimensional vector embeddings for semantic profile matching using the all-MiniLM-L6-v2 model.

## Purpose

Enables semantic similarity search for matching users based on skills, interests, and goals rather than keyword matching. Used by the matching algorithm to find compatible collaborators.

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | — | FK → `profiles(id)`, unique per user |
| `embedding` | `vector(384)` | YES | `null` | 384-dimensional semantic embedding vector |
| `status` | `text` | NO | `'pending'` | Generation status: `pending`, `processing`, `completed`, `failed` |
| `last_updated` | `timestamptz` | NO | `now()` | Last update timestamp (auto-updated) |

## Indexes

```sql
-- HNSW index for efficient cosine similarity search
CREATE INDEX idx_profile_embeddings_embedding 
    ON profile_embeddings 
    USING hnsw (embedding vector_cosine_ops);

-- User lookup index
CREATE INDEX idx_profile_embeddings_user_id 
    ON profile_embeddings (user_id);

-- Status filtering index
CREATE INDEX idx_profile_embeddings_status 
    ON profile_embeddings (status);
```

## RLS Policies

```sql
-- Users can view their own embedding status
CREATE POLICY "Users can view own embedding status" 
    ON profile_embeddings
    FOR SELECT 
    USING (auth.uid() = user_id);

-- Service role can manage all embeddings
CREATE POLICY "Service role can manage embeddings" 
    ON profile_embeddings
    FOR ALL 
    USING (auth.role() = 'service_role');
```

## Helper Functions

### `has_embedding(user_id UUID)`
Returns `true` if user has a completed embedding.

```sql
SELECT has_embedding('user-uuid-here');
-- Returns: boolean
```

### `get_embedding_status(user_id UUID)`
Returns embedding status details for a user.

```sql
SELECT * FROM get_embedding_status('user-uuid-here');
-- Returns: user_id, status, last_updated, has_embedding
```

### `regenerate_embedding(user_id UUID)`
Manually trigger embedding regeneration (for retries).

```sql
SELECT regenerate_embedding('user-uuid-here');
-- Sets status to 'pending' for regeneration
```

## Usage Examples

### Query Similar Profiles
```sql
-- Find 10 most similar profiles to user X
SELECT 
    p.user_id,
    p.full_name,
    p.headline,
    1 - (pe.embedding <=> :query_embedding) AS similarity
FROM profile_embeddings pe
JOIN profiles p ON pe.user_id = p.id
WHERE pe.user_id != :current_user_id
  AND pe.status = 'completed'
ORDER BY pe.embedding <=> :query_embedding
LIMIT 10;
```

### Check Embedding Status
```sql
SELECT status, last_updated
FROM profile_embeddings
WHERE user_id = auth.uid();
```

### Get Embedding Count
```sql
SELECT COUNT(*) 
FROM profile_embeddings 
WHERE status = 'completed';
```

## Generation Workflow

### 1. Trigger Generation
```typescript
// Frontend triggers via API
await fetch('/api/embeddings/generate', {
  method: 'POST',
  body: JSON.stringify({ user_id: userId })
});
```

### 2. Status Polling (with Realtime)
```typescript
// Subscribe to status updates
const unsubscribe = subscribeToEmbeddingStatus(userId, (status) => {
  console.log('Embedding status:', status.status);
  if (status.status === 'completed') {
    // Embedding ready
  }
});
```

### 3. Use in Matching
```typescript
// Get user's embedding
const { data } = await supabase
  .from('profile_embeddings')
  .select('embedding')
  .eq('user_id', userId)
  .single();

// Use embedding for similarity search
```

## Error Handling

### Failed Generation
- Status set to `failed`
- `last_updated` timestamp recorded
- Can be retried via `regenerate_embedding()` function

### Retry Logic
Python worker implements automatic retry with exponential backoff:
- Max 3 attempts
- Wait times: 2s, 4s, 8s
- Reraises error after all attempts fail

### Fallback Mechanism
If Python worker unavailable:
1. Edge Function generates local embedding
2. Response marked with `used_fallback: true`
3. Embedding stored with `model: "local-tfidf-fallback"`

## Performance Considerations

### HNSW Index Parameters
- `m`: 16 (connections per layer)
- `ef_construction`: 64 (search depth during indexing)
- Optimized for datasets up to 1M vectors

### Query Performance
- Similarity search: ~10-50ms for 10K profiles
- Index creation: ~1ms per embedding
- Storage: ~1.5KB per embedding (384 floats)

### Scaling
- Queue-based processing (max 100 pending requests)
- Concurrent processing limit: 5 embeddings
- Timeout: 10 seconds per request

## Monitoring

### Key Metrics
- Queue size (target: < 50)
- Processing time (target: < 5s)
- Success rate (target: > 95%)
- Fallback usage rate (target: < 5%)

### Health Checks
```bash
GET http://localhost:8000/health
{
  "status": "healthy",
  "supabase_connected": true,
  "queue_size": 3,
  "queue_capacity": 100
}
```

## Related Tables

- `profiles` - User profile data (source for embedding generation)
- `match_suggestions` - Stores generated match recommendations
- `match_scores` - Detailed match scoring including embedding similarity

## Migration Notes

### Dimension Change (768 → 384)
- Changed in v1.1.0 (2026-03-12)
- Model: `all-MiniLM-L6-v2` (384d) replaced `all-mpnet-base-v2` (768d)
- Reason: Faster inference, smaller storage, sufficient quality
- Migration: Re-run embedding generation for all users

### Required Extensions
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

## Security

- Embeddings are user-specific and private
- Only accessible via RLS policies
- No embedding data exposed in public APIs
- Service role key required for bulk operations
