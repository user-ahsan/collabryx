# Feed Algorithm Audit Report

**Agent:** 4.4 - Feed Algorithm Audit  
**Date:** 2026-03-21  
**Auditor:** AI Development Agent  
**Scope:** Feed scoring, ranking algorithm, Thompson Sampling, and personalization  

---

## 1. Executive Summary

### Overall Health: CRITICAL ISSUES DETECTED

The feed algorithm infrastructure is **partially implemented but NOT integrated** with the frontend. While the database schema and Python worker service exist, the actual feed displayed to users does NOT use the personalized scoring system.

| Component | Status | Integration |
|-----------|--------|-------------|
| `feed_scores` table | Created | NOT used by frontend |
| Thompson Sampling | Partial | Missing data dependencies |
| Semantic Scoring | Placeholder | Not functional |
| Engagement Scoring | Incomplete | Missing impressions tracking |
| Recency Scoring | Implemented | Not applied to feed |
| Connection Boost | Implemented | Not applied to feed |
| Cache Invalidation | Missing | N/A |
| Feed Query | Wrong source | Uses `posts` directly |

### Critical Finding
**The dashboard feed (`components/features/dashboard/feed.tsx`) fetches posts ordered by `created_at` directly from the `posts` table, completely bypassing the `feed_scores` table and all personalization logic.**

---

## 2. Feed Scores Table Analysis

### Schema Verification

```sql
CREATE TABLE IF NOT EXISTS public.feed_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    score REAL NOT NULL DEFAULT 0,
    semantic_score REAL DEFAULT 0,
    engagement_score REAL DEFAULT 0,
    recency_score REAL DEFAULT 0,
    connection_boost REAL DEFAULT 1,
    factors JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    CONSTRAINT unique_user_post_score UNIQUE (user_id, post_id)
);
```

| Field | Type | Constraint | Status |
|-------|------|------------|--------|
| `id` | UUID | PRIMARY KEY | OK |
| `user_id` | UUID | FK -> profiles | OK |
| `post_id` | UUID | FK -> posts | OK |
| `score` | REAL | NOT NULL | OK |
| `semantic_score` | REAL | DEFAULT 0 | OK |
| `engagement_score` | REAL | DEFAULT 0 | OK |
| `recency_score` | REAL | DEFAULT 0 | OK |
| `connection_boost` | REAL | DEFAULT 1 | OK |
| `factors` | JSONB | DEFAULT '{}' | OK |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | OK |
| `expires_at` | TIMESTAMPTZ | NULLABLE | OK |
| UNIQUE constraint | (user_id, post_id) | OK |

### Indexes Analysis

```sql
CREATE INDEX IF NOT EXISTS idx_feed_scores_user_id ON public.feed_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_feed_scores_user_score ON public.feed_scores(user_id, score DESC);
CREATE INDEX IF NOT EXISTS idx_feed_scores_post_id ON public.feed_scores(post_id);
CREATE INDEX IF NOT EXISTS idx_feed_scores_created_at ON public.feed_scores(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feed_scores_expires_at ON public.feed_scores(expires_at) WHERE expires_at IS NOT NULL;
```

**Assessment:** Indexes are well-designed for:
- User-specific feed queries (`user_id, score DESC`)
- Post lookups
- Cache invalidation via `expires_at` partial index

### RLS Policies

```sql
CREATE POLICY "Users can view own feed scores" ON public.feed_scores 
    FOR SELECT USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Service role can manage feed scores" ON public.feed_scores 
    FOR ALL USING ((SELECT auth.jwt() ->> 'role') = 'service_role');
```

**Assessment:** Proper security - users can only view their own scores, service role manages scoring.

---

## 3. Score Formula Analysis

### Current Implementation (Python Worker)

**File:** `python-worker/services/feed_scorer.py`

```python
# Weights configuration
self.weights = {
    "semantic": 0.35,      # 35%
    "engagement": 0.30,    # 30%
    "recency": 0.20,       # 20%
    "connection": 0.15,    # 15%
}

# Formula
base_score = (
    weights["semantic"] * semantic_score +
    weights["engagement"] * engagement_score +
    weights["recency"] * recency_score
)
final_score = base_score * connection_boost
```

### Weight Assessment

| Factor | Weight | Status | Issue |
|--------|--------|--------|-------|
| Semantic | 35% | Placeholder | Returns hardcoded 0.7 |
| Engagement | 30% | Broken | Uses non-existent `impressions` field |
| Recency | 20% | Good | Exponential decay implemented |
| Connection | 15% | Good | 1.5x boost for connections |

### Additional Boosts (Implemented but Unverified)

```python
# Shared interests boost
if await self._has_shared_interests(user_id, post.get("author_id")):
    final_score *= 1.2  # 20% boost

# Intent matching boost
if post.get("intent") and user_data.get("looking_for") == post.get("intent"):
    final_score *= 1.1  # 10% boost
```

**Issue:** These boosts can push scores above 1.0, but there is a `min(1.0, final_score)` cap.

---

## 4. Thompson Sampling Analysis

### Implementation Status: PARTIAL

**File:** `python-worker/services/feed_scorer.py` (lines 253-262)

```python
def _thompson_sample(self, successes: int, failures: int) -> float:
    """Thompson Sampling for engagement prediction."""
    try:
        # Beta distribution sampling
        samples = np.random.beta(successes + 1, failures + 1, self.ts_samples)
        return float(np.mean(samples))
    except Exception as e:
        logger.error(f"Error in Thompson Sampling: {str(e)}")
        return 0.5
```

### Critical Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| Missing `impressions` field | CRITICAL | Posts table has no `impressions` column |
| Missing `engagements` field | CRITICAL | No tracking of post impressions |
| No alpha/beta persistence | HIGH | Distribution parameters not stored/updated |
| No exploration tracking | HIGH | No record of which posts were shown |
| Static sampling | MEDIUM | `ts_samples=1000` hardcoded, not tunable |

### Usage in Engagement Score (BROKEN)

```python
# Line 63-68 - THIS WILL FAIL IN PRODUCTION
engagement_score = self._thompson_sample(
    successes=post.get("reaction_count", 0) + post.get("comment_count", 0),
    failures=max(0, post.get("impressions", 1) - post.get("engagements", 0)),  # These fields don't exist!
)
```

### Required Fixes

1. Add `impressions_count` to `posts` table or `user_analytics`
2. Track impressions via events table on post view
3. Store alpha/beta parameters per user-post pair
4. Implement exploration bonus for new/uncertain posts

---

## 5. Semantic Scoring Analysis

### Implementation Status: PLACEHOLDER ONLY

**File:** `python-worker/services/feed_scorer.py` (lines 264-300)

```python
async def _calculate_semantic_score(self, user_id: str, post: Dict[str, Any]) -> float:
    """Calculate semantic similarity between user and post."""
    try:
        # Get user embedding
        user_emb_response = ...  # Correct query
        
        if not user_emb_response.data:
            return 0.5
        
        # Get post embedding (uses author's embedding)
        post_emb_response = ...  # Correct query
        
        if not post_emb_response.data:
            return 0.5
        
        # Cosine similarity (placeholder - would use actual vector math in production)
        return 0.7  # HARDCODED PLACEHOLDER!
        
    except Exception as e:
        logger.error(f"Error calculating semantic score: {str(e)}")
        return 0.5
```

### Critical Issues

| Issue | Severity | Description |
|-------|----------|-------------|
| Hardcoded return value | CRITICAL | Always returns 0.7, no actual similarity calculation |
| No cosine similarity | CRITICAL | Vector math not implemented |
| No post embeddings | HIGH | Posts don't have their own embeddings, uses author's |
| No content analysis | HIGH | Post content not embedded separately |

### Required Implementation

```python
# MISSING: Actual cosine similarity calculation
import numpy as np

def cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """Calculate cosine similarity between two vec

---

## 10. Critical Issues Summary

### CRITICAL (Must Fix Before Production)

| # | Issue | Impact | File(s) | Fix Required |
|---|-------|--------|---------|--------------|
| 1 | Feed doesn't use feed_scores | All personalization bypassed | lib/services/posts.ts, components/features/dashboard/feed.tsx | Integrate feed_scores query |
| 2 | Thompson Sampling uses non-existent fields | Engagement scores wrong | python-worker/services/feed_scorer.py | Add impressions tracking |
| 3 | Semantic score is hardcoded placeholder | No actual personalization | python-worker/services/feed_scorer.py | Implement cosine similarity |
| 4 | No impressions tracking | Cannot calculate engagement rate | Database schema | Add impressions_count to posts or events |
| 5 | No cache invalidation triggers | Stale scores served | Database triggers | Add triggers on engagement events |

### HIGH (Should Fix Soon)

| # | Issue | Impact | File(s) | Fix Required |
|---|-------|--------|---------|--------------|
| 6 | Posts lack content embeddings | Semantic matching uses author profile only | Database, Python worker | Generate post content embeddings |
| 7 | No exploration tracking | Thompson Sampling can't learn | Python worker | Track which posts shown to users |
| 8 | Share count not used in formula | Engagement score incomplete | feed_scorer.py | Include shares in engagement |
| 9 | No alpha/beta persistence | Thompson Sampling resets each run | Database | Store distribution params |
| 10 | No feed score API endpoint | Frontend can't request scored feed | API routes | Create /api/feed/personalized |

### MEDIUM (Nice to Have)

| # | Issue | Impact | Recommendation |
|---|-------|--------|----------------|
| 11 | Fixed 24-hour half-life | May not suit all content types | Make configurable per user |
| 12 | No cold-start handling | New posts never shown | Add discovery boost |
| 13 | No diversity factor | Feed may become echo chamber | Add topic diversity |
| 14 | No A/B testing framework | Can't test algorithm changes | Add experiment tracking |
| 15 | No score explanation | Users don't know why posts shown | Store factors JSONB with reasons |

---

## 11. Recommendations

### Phase 1: Critical Fixes (Week 1-2)

#### 1.1 Integrate Feed Scores with Frontend

**Priority:** CRITICAL

**Files to modify:**
- lib/services/posts.ts - Add fetchPersonalizedFeed() function
- components/features/dashboard/feed.tsx - Use personalized feed

**Implementation:**
```typescript
// NEW: lib/services/posts.ts
export async function fetchPersonalizedFeed(
  userId: string,
  limit: number = 20,
  offset: number = 0
): Promise<{ data: PostWithAuthor[]; error: Error | null }> {
  const supabase = createClient();
  
  // Query posts with feed scores
  const { data, error } = await supabase
    .from('feed_scores')
    .select(`
      score,
      post:posts (
        *,
        author:profiles (
          full_name,
          display_name,
          avatar_url
        )
      )
    `)
    .eq('user_id', userId)
    .or('expires_at.is.null,expires_at.gt.' + new Date().toISOString())
    .order('score', { ascending: false })
    .range(offset, offset + limit - 1);
  
  // Fallback to chronological if no scores
  if (!data || data.length === 0) {
    return fetchPosts({ limit, offset });
  }
  
  // Transform data
  const posts = data.map(item => ({
    ...item.post,
    feed_score: item.score
  }));
  
  return { data: posts, error: null };
}
```

#### 1.2 Fix Thompson Sampling Data Dependencies

**Priority:** CRITICAL

**Steps:**
1. Add impressions_count to user_analytics table (per-user per-post)
2. Create post_impressions tracking table
3. Add impression tracking on post view
4. Update feed_scorer.py to use actual data

**Schema addition:**
```sql
CREATE TABLE IF NOT EXISTS public.post_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id),
    post_id UUID NOT NULL REFERENCES posts(id),
    impression_count INTEGER DEFAULT 0,
    last_impression_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

CREATE INDEX idx_post_impressions_post ON post_impressions(post_id);
CREATE INDEX idx_post_impressions_user ON post_impressions(user_id);
```

#### 1.3 Implement Real Cosine Similarity

**Priority:** CRITICAL

**Fix in feed_scorer.py:**
```python
import numpy as np

async def _calculate_semantic_score(self, user_id: str, post: Dict[str, Any]) -> float:
    """Calculate actual cosine similarity."""
    try:
        # Get user embedding
        user_emb_response = await asyncio.to_thread(
            self.supabase.table("profile_embeddings")
            .select("embedding")
            .eq("user_id", user_id)
            .eq("status", "completed")
            .single()
            .execute
        )
        
        if not user_emb_response.data:
            return 0.5
        
        user_embedding = user_emb_response.data["embedding"]
        
        # Get author embedding as proxy for post
        author_emb_response = await asyncio.to_thread(
            self.supabase.table("profile_embeddings")
            .select("embedding")
            .eq("user_id", post.get("author_id"))
            .eq("status", "completed")
            .single()
            .execute
        )
        
        if not author_emb_response.data:
            return 0.5
        
        author_embedding = author_emb_response.data["embedding"]
        
        # ACTUAL COSINE SIMILARITY CALCULATION
        user_vec = np.array([float(x) for x in user_embedding])
        author_vec = np.array([float(x) for x in author_embedding])
        
        similarity = np.dot(user_vec, author_vec) / (
            np.linalg.norm(user_vec) * np.linalg.norm(author_vec)
        )
        
        # Normalize from [-1, 1] to [0, 1]
        return float((similarity + 1) / 2)
        
    except Exception as e:
        logger.error(f"Error calculating semantic score: {str(e)}")
        return 0.5
```

#### 1.4 Add Cache Invalidation Triggers

**Priority:** CRITICAL

**Add to 99-master-all-tables.sql:**
```sql
-- Trigger: Invalidate feed scores on new reaction
CREATE OR REPLACE FUNCTION public.invalidate_feed_score_on_reaction()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.feed_scores 
    SET expires_at = NOW() - INTERVAL '1 second'
    WHERE post_id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_invalidate_feed_score_on_reaction
    AFTER INSERT ON public.post_reactions
    FOR EACH ROW EXECUTE FUNCTION public.invalidate_feed_score_on_reaction();

-- Trigger: Invalidate on new comment
CREATE OR REPLACE FUNCTION public.invalidate_feed_score_on_comment()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.feed_scores 
    SET expires_at = NOW() - INTERVAL '1 second'
    WHERE post_id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_invalidate_feed_score_on_comment
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.invalidate_feed_score_on_comment();

-- Trigger: Invalidate on new connection
CREATE OR REPLACE FUNCTION public.invalidate_feed_score_on_connection()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'accepted' THEN
        UPDATE public.feed_scores 
        SET expires_at = NOW() - INTERVAL '1 second'
        WHERE (
            user_id = NEW.requester_id 
            AND post_id IN (SELECT id FROM posts WHERE author_id = NEW.receiver_id)
        )
        OR (
            user_id = NEW.receiver_id 
            AND post_id IN (SELECT id FROM posts WHERE author_id = NEW.requester_id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trg_invalidate_feed_score_on_connection
    AFTER INSERT OR UPDATE OF status ON public.connections
    FOR EACH ROW EXECUTE FUNCTION public.invalidate_feed_score_on_connection();
```

### Phase 2: High Priority (Week 3-4)

#### 2.1 Add Post Content Embeddings
Generate embeddings for post content, not jus

#### 2.2 Implement Impression Tracking
Add API route to track post impressions.

#### 2.3 Create Personalized Feed API
Create /api/feed/personalized endpoint.

#### 2.4 Store Thompson Sampling Parameters
Add feed_thompson_params table for alpha/beta tracking.

### Phase 3: Medium Priority (Month 2)

#### 3.1 Add Diversity Factor
Prevent filter bubbles.

#### 3.2 Implement Cold-Start Handling
Boost new posts.

#### 3.3 Add Score Explanation
Store detailed factors in JSONB.

#### 3.4 A/B Testing Framework
Enable experimentation.

---

## 12. Summary

### Current State
The feed algorithm is **architecturally complete but functionally broken**. All components exist but are not integrated:

- [x] Database schema is correct
- [x] Python worker has scoring logic
- [x] Indexes are well-designed
- [x] RLS policies are secure
- [ ] Frontend doesn't use feed_scores
- [ ] Thompson Sampling has missing data
- [ ] Semantic scoring is a placeholder
- [ ] No cache invalidation

### Path to Production

| Week | Focus | Deliverables |
|------|-------|--------------|
| 1-2 | Critical fixes | Feed integration, real semantic scoring, cache triggers |
| 3-4 | High priority | Impressions tracking, post embeddings, Thompson params |
| 5-8 | Enhancements | Diversity, cold-start, explanations, A/B testing |

### Final Recommendation

**DO NOT DEPLOY TO PRODUCTION** until Phase 1 critical fixes are complete. The current implementation gives users a non-personalized chronological feed while the infrastructure for personalization exists but is unused.

---

**Report Generated:** 2026-03-21  
**Next Review:** After Phase 1 completion  
**Contact:** Development Team
---

## 6. Engagement Scoring Analysis

### Implementation Status: BROKEN

**Current Formula:**
```python
engagement_score = self._thompson_sample(
    successes=post.get("reaction_count", 0) + post.get("comment_count", 0),
    failures=max(0, post.get("impressions", 1) - post.get("engagements", 0)),
)
```

### Missing Data Dependencies

| Field | Required By | Exists In Schema |
|-------|-------------|------------------|
| impressions | Thompson Sampling | NO |
| engagements | Thompson Sampling | NO |

### Posts Table Structure (Actual)

```sql
CREATE TABLE public.posts (
    id UUID PRIMARY KEY,
    reaction_count INTEGER NOT NULL DEFAULT 0,  -- Available
    comment_count INTEGER NOT NULL DEFAULT 0,   -- Available
    share_count INTEGER NOT NULL DEFAULT 0,     -- Available (but not used)
    ...
);
```

### Engagement Score Should Include

- [x] reaction_count - Available
- [x] comment_count - Available  
- [x] share_count - Available but NOT used in formula
- [ ] impressions_count - MISSING
- [ ] engagement_rate - MISSING (engagements/impressions)
- [ ] time_weighted_engagement - MISSING

---

## 7. Recency Scoring Analysis

### Implementation Status: GOOD

**File:** python-worker/services/feed_scorer.py (lines 302-315)

```python
def _calculate_recency_score(self, created_at: Optional[str]) -> float:
    """Calculate recency score with exponential decay."""
    try:
        if not created_at:
            return 0.0
        
        dt = datetime.fromisoformat(created_at.replace("Z", "+00:00"))
        hours_old = (datetime.now(dt.tzinfo) - dt).total_seconds() / 3600
        
        # Exponential decay with 24-hour half-life
        return float(np.exp(-hours_old / 24))
        
    except Exception as e:
        logger.error(f"Error calculating recency score: {str(e)}")
        return 0.0
```

### Assessment

| Aspect | Status | Notes |
|--------|--------|-------|
| Decay function | Exponential | exp(-hours/24) |
| Half-life | 24 hours | Posts lose ~50% score per day |
| Edge cases | Handled | Returns 0.0 for missing dates |
| Timezone aware | Yes | Uses dt.tzinfo |

### Score Decay Table

| Age | Recency Score |
|-----|---------------|
| 0 hours (new) | 1.00 |
| 6 hours | 0.78 |
| 12 hours | 0.61 |
| 24 hours (1 day) | 0.37 |
| 48 hours (2 days) | 0.14 |
| 72 hours (3 days) | 0.05 |
| 168 hours (7 days) | 0.0009 |

---

## 8. Feed Query Analysis

### Current Frontend Implementation

**File:** lib/services/posts.ts (lines 97-139)

```typescript
let query = supabase
  .from("posts")
  .select("*, author:profiles (...)")
  .eq("is_archived", false)

// Default: ordered by creation date
query = query.order("created_at", { ascending: false })  // NOT USING feed_scores!
```

### Expected Feed Query (NOT IMPLEMENTED)

```sql
SELECT p.*, fs.score as feed_score
FROM posts p
LEFT JOIN feed_scores fs ON fs.post_id = p.id AND fs.user_id = :user_id
WHERE p.is_archived = false
  AND (fs.expires_at IS NULL OR fs.expires_at > NOW())
ORDER BY fs.score DESC NULLS LAST
LIMIT 20;
```

### Integration Gap Analysis

| Component | Expected | Actual | Gap |
|-----------|----------|--------|-----|
| Data source | feed_scores JOIN posts | posts only | CRITICAL |
| Ordering | feed_scores.score DESC | posts.created_at DESC | CRITICAL |
| Personalization | Per-user scores | None | CRITICAL |
| Cache usage | expires_at check | None | HIGH |

---

## 9. Cache Invalidation Analysis

### Current Status: NOT IMPLEMENTED

**Expected Behavior:**
- Feed scores should be invalidated when:
  - Post receives new reaction
  - Post receives new comment
  - Post receives new share
  - New connection is formed
  - User profile changes

**Actual Behavior:**
- Scores have expires_at set to 1 hour in future
- No database triggers to invalidate on engagement
- No trigger on connection changes

### Cache Expiration Strategy

| Strategy | Current | Recommended |
|----------|---------|-------------|
| Time-based | 1 hour | 1 hour (OK) |
| Event-based | None | On engagement |
| On-demand | None | Manual refresh |
| Batch recalc | Manual | Scheduled job |

