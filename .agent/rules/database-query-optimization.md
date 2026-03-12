# 🗄️ Database Query Optimization

**Trigger:** `always_on`

**Priority:** CRITICAL - Directly impacts API response times and user experience

---

## 🎯 Objective

Achieve sub-100ms database queries with:
- Specific column selects (no `*`)
- Proper indexing
- Efficient joins
- Minimal round trips

---

## 📊 Supabase Query Patterns

### 1. **Specific Column Selection (MANDATORY)**

```typescript
// ❌ WRONG - Selects all columns
const { data } = await supabase
  .from("profiles")
  .select("*")

// ✅ CORRECT - Select only needed columns
const { data } = await supabase
  .from("profiles")
  .select("id, full_name, avatar_url, headline")

// ✅ CORRECT - Nested relations with specific columns
const { data } = await supabase
  .from("posts")
  .select(`
    id,
    content,
    created_at,
    profiles (
      id,
      full_name,
      avatar_url
    ),
    post_reactions (
      id,
      type
    )
  `)
```

**Impact:** Reduces data transfer by 60-80%

### 2. **Pagination Patterns**

```typescript
// ✅ Keyset pagination (faster than offset)
const { data } = await supabase
  .from("posts")
  .select("id, content, created_at")
  .order("created_at", { ascending: false })
  .lt("created_at", lastSeenDate)
  .limit(20)

// ✅ Offset pagination (acceptable for small datasets)
const { data } = await supabase
  .from("posts")
  .select("id, content, created_at")
  .range(page * 20, (page + 1) * 20 - 1)

// ✅ Count without fetching data
const { count } = await supabase
  .from("posts")
  .select("*", { count: "exact", head: true })
```

### 3. **Efficient Joins**

```typescript
// ✅ Single query with joins
const { data } = await supabase
  .from("matches")
  .select(`
    id,
    score,
    profiles:matched_user_id (
      id,
      full_name,
      avatar_url,
      headline
    ),
    user_skills (
      skill
    )
  `)
  .eq("user_id", userId)
  .gte("score", 0.7)
  .limit(10)

// ❌ AVOID - N+1 queries
const { data: matches } = await supabase.from("matches").select().eq("user_id", userId)
for (const match of matches) {
  const { data: profile } = await supabase.from("profiles").select().eq("id", match.matched_user_id)
}
```

---

## 🔍 Indexing Strategy

### Required Indexes (Already in Setup Scripts)

```sql
-- ✅ Profiles
CREATE INDEX idx_profiles_user_id ON profiles(user_id)
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC)
CREATE INDEX idx_profiles_headline_search ON profiles USING gin(to_tsvector('english', headline))

-- ✅ Posts
CREATE INDEX idx_posts_user_id ON posts(user_id)
CREATE INDEX idx_posts_created_at ON posts(created_at DESC)
CREATE INDEX idx_posts_embedding ON posts USING ivfflat (embedding vector_cosine_ops)

-- ✅ Matches
CREATE INDEX idx_matches_user_id ON match_suggestions(user_id)
CREATE INDEX idx_matches_score ON match_suggestions(score DESC)
CREATE INDEX idx_matches_created ON match_suggestions(created_at DESC)

-- ✅ Messages
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id)
CREATE INDEX idx_messages_created_at ON messages(created_at DESC)
CREATE INDEX idx_conversations_users ON conversations USING gin(user_ids)
```

### Query Patterns That Use Indexes

```typescript
// ✅ Uses index: idx_profiles_user_id
const { data } = await supabase
  .from("profiles")
  .select("id, full_name, avatar_url")
  .eq("user_id", userId)

// ✅ Uses index: idx_posts_created_at
const { data } = await supabase
  .from("posts")
  .select("id, content, created_at")
  .order("created_at", { ascending: false })
  .limit(20)

// ✅ Uses index: idx_matches_score
const { data } = await supabase
  .from("match_suggestions")
  .select("id, score")
  .eq("user_id", userId)
  .gte("score", 0.7)
  .order("score", { ascending: false })
```

---

## ⚡ Query Optimization Techniques

### 1. **Batch Operations**

```typescript
// ❌ WRONG - Multiple round trips
await supabase.from("user_skills").insert({ user_id, skill: "React" })
await supabase.from("user_skills").insert({ user_id, skill: "TypeScript" })
await supabase.from("user_skills").insert({ user_id, skill: "Node.js" })

// ✅ CORRECT - Single batch insert
await supabase
  .from("user_skills")
  .insert([
    { user_id, skill: "React" },
    { user_id, skill: "TypeScript" },
    { user_id, skill: "Node.js" }
  ])
```

### 2. **Conditional Queries**

```typescript
// ✅ Only fetch if needed
if (needsSuggestions) {
  const { data } = await supabase
    .from("match_suggestions")
    .select("id, score, profiles(full_name, avatar_url)")
    .eq("user_id", userId)
    .limit(5)
}
```

### 3. **Upsert Pattern**

```typescript
// ✅ Update or insert in one query
const { data } = await supabase
  .from("profiles")
  .upsert({
    user_id: userId,
    full_name,
    headline,
    updated_at: new Date().toISOString()
  }, {
    onConflict: "user_id"
  })
```

### 4. **Full-Text Search**

```typescript
// ✅ Use PostgreSQL full-text search
const { data } = await supabase
  .from("profiles")
  .select("id, full_name, headline")
  .textSearch("headline", "developer", {
    config: "english",
    type: "websearch"
  })
  .limit(10)
```

---

## 🎯 Realtime Subscription Optimization

### Selective Subscriptions

```typescript
// ✅ Subscribe only to needed columns
const channel = supabase
  .channel("posts")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "posts",
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Only get specific columns
      const newPost = {
        id: payload.new.id,
        content: payload.new.content,
        created_at: payload.new.created_at
      }
      queryClient.setQueryData(["posts"], (old) => [newPost, ...old])
    }
  )
  .subscribe()

// ❌ AVOID - Subscribe to all changes
const channel = supabase
  .channel("posts")
  .on("postgres_changes", { event: "*", table: "posts" }, callback)
  .subscribe()
```

### Cleanup Subscriptions

```typescript
// ✅ Always cleanup in useEffect
useEffect(() => {
  const channel = supabase
    .channel("messages")
    .on("postgres_changes", { table: "messages" }, handleNewMessage)
    .subscribe()
  
  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

---

## 📈 Query Performance Checklist

### Pre-Commit Review

- [ ] Specific columns selected (no `*`)?
- [ ] Using indexes (check query plan)?
- [ ] Pagination implemented?
- [ ] N+1 queries avoided?
- [ ] Batch operations used?
- [ ] Realtime subscriptions cleaned up?
- [ ] RLS policies optimized?

### Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Simple query | < 50ms | Supabase logs |
| Join query | < 100ms | Supabase logs |
| Full-text search | < 150ms | Supabase logs |
| Realtime latency | < 500ms | Browser DevTools |
| Data transfer | < 50KB/page | Network tab |

---

## 🛠️ Debugging Tools

### Query Analysis

```typescript
// ✅ Enable query logging
const supabase = createClient({
  log: async (level, message, args) => {
    if (level === "error") {
      console.error("Supabase error:", message, args)
    }
  }
})

// ✅ Check query performance in Supabase dashboard
// Go to: Database > Query Performance
```

### EXPLAIN ANALYZE

```sql
-- Run in Supabase SQL Editor
EXPLAIN ANALYZE
SELECT id, full_name, avatar_url
FROM profiles
WHERE user_id = '123'
ORDER BY created_at DESC
LIMIT 20;

-- Check for:
-- ✅ Index Scan (good)
-- ❌ Seq Scan (bad - needs index)
```

---

## ⚠️ STRICT RULES

1. **NEVER** use `.select("*")` in production code
2. **NEVER** run N+1 queries (use joins)
3. **NEVER** forget to cleanup realtime subscriptions
4. **ALWAYS** use pagination for lists
5. **ALWAYS** check query plans for new queries
6. **ALWAYS** batch insert/update operations

---

## 🎯 Agent Actions

When writing database queries:

1. **List required columns** before writing query
2. **Check existing indexes** in `supabase/setup/`
3. **Use joins** instead of multiple queries
4. **Add pagination** for any list > 20 items
5. **Batch operations** for multiple inserts/updates
6. **Test query performance** in Supabase dashboard

**Remember:** Every millisecond counts. Users notice 100ms delays.

---

## 📚 Reference

- **Table Schemas:** `@expected-objects/` (22 tables documented)
- **Setup Scripts:** `@supabase/setup/` (SQL files 01-22)
- **Vector Indexes:** `supabase/setup/23-profile-embeddings.sql`
- **RLS Policies:** All setup scripts include RLS
