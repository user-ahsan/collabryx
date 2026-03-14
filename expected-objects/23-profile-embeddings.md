# Table: `profile_embeddings`

> Stores 384-dimensional vector embeddings for semantic profile matching using the all-MiniLM-L6-v2 model.

## Purpose

Enables semantic similarity search for matching users based on skills, interests, and goals rather than keyword matching. Used by the matching algorithm to find compatible collaborators.

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | Primary key |
| `user_id` | `uuid` | NO | — | FK → `profiles(id)`, unique per user |
| `embedding` | `vector(384)` | YES | `null` | 384-dim semantic vector (CHECK: vector_dims = 384 OR NULL) |
| `status` | `text` | NO | `'pending'` | Generation status: `pending`, `processing`, `completed`, `failed` |
| `error_message` | `text` | YES | `null` | Error details if generation failed |
| `retry_count` | `integer` | NO | `0` | Number of retry attempts |
| `last_updated` | `timestamptz` | NO | `now()` | Last update timestamp (auto-updated) |
| `metadata` | `jsonb` | YES | `'{}'` | Additional metadata (model version, source, etc.) |

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

-- Last updated index
CREATE INDEX idx_profile_embeddings_updated 
    ON profile_embeddings (last_updated DESC);

-- Retry count index
CREATE INDEX idx_profile_embeddings_retry 
    ON profile_embeddings (retry_count);

-- Metadata GIN index
CREATE INDEX idx_profile_embeddings_metadata 
    ON profile_embeddings USING GIN (metadata);
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

## Triggers

```sql
-- Auto-update last_updated timestamp
CREATE TRIGGER update_embedding_timestamp
    BEFORE UPDATE ON profile_embeddings
    FOR EACH ROW 
    EXECUTE FUNCTION public.update_embedding_timestamp();
```

## Relationships

| Relationship | Table | Column | On Delete |
|-------------|-------|--------|-----------|
| Embeds profile | `profiles` | `user_id` | CASCADE |

## Usage Examples

### Query User Embedding Status

```sql
SELECT user_id, status, last_updated, retry_count
FROM profile_embeddings
WHERE user_id = 'user-uuid';
```

### Find Similar Profiles (Cosine Similarity)

```sql
SELECT user_id, 1 - (embedding <=> $query_embedding) AS similarity
FROM profile_embeddings
WHERE status = 'completed'
  AND user_id != $current_user_id
ORDER BY embedding <=> $query_embedding
LIMIT 10;
```

### Check if User Has Embedding

```sql
SELECT EXISTS (
    SELECT 1 FROM profile_embeddings
    WHERE user_id = $user_id AND status = 'completed'
) AS has_embedding;
```

## Status Flow

```
pending → processing → completed
                     ↘
                      failed → (retry) → pending
```

## Notes

- **Vector Dimensions**: 384 (all-MiniLM-L6-v2 model)
- **Distance Metric**: Cosine similarity (`<=>` operator)
- **Index Type**: HNSW for fast approximate nearest neighbor search
- **Auto-Generated**: Triggered when user completes onboarding
- **Metadata**: Stores model version, generation source, etc.
