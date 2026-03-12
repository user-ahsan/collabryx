# 🔄 Cache Strategy & State Management Optimization

**Trigger:** `always_on`

**Priority:** CRITICAL - Directly impacts perceived performance and server load

---

## 🎯 Objective

Achieve instant perceived loading with:
- 90%+ cache hit rate
- Stale-while-revalidate patterns
- Optimistic updates
- Minimal refetching

---

## 📊 React Query Optimization

### 1. **Query Key Structure**

```typescript
// ✅ Hierarchical query keys
const postKeys = {
  all: ["posts"] as const,
  lists: () => [...postKeys.all, "list"] as const,
  list: (filters: PostFilters) => [...postKeys.lists(), filters] as const,
  details: () => [...postKeys.all, "detail"] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
}

// ✅ Usage in hooks
export function usePosts(filters: PostFilters) {
  return useQuery({
    queryKey: postKeys.list(filters),
    queryFn: () => postsService.getPosts(filters),
    staleTime: 5 * 60 * 1000,  // 5 minutes
    gcTime: 10 * 60 * 1000,    // 10 minutes (formerly cacheTime)
  })
}

export function usePost(id: string) {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postsService.getPost(id),
    staleTime: 2 * 60 * 1000,  // 2 minutes
  })
}
```

### 2. **Stale Time Optimization**

```typescript
// ✅ Set appropriate stale times
const queryConfig = {
  // Frequently changing data
  notifications: { staleTime: 30 * 1000, gcTime: 60 * 1000 },
  
  // Moderately changing data
  posts: { staleTime: 5 * 60 * 1000, gcTime: 10 * 60 * 1000 },
  
  // Rarely changing data
  profiles: { staleTime: 15 * 60 * 1000, gcTime: 30 * 60 * 1000 },
  
  // Static data
  settings: { staleTime: Infinity, gcTime: Infinity },
}

// ✅ Usage
export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    ...queryConfig.notifications,
    refetchInterval: 30 * 1000,  // Poll every 30s
  })
}
```

### 3. **Prefetching Patterns**

```typescript
// ✅ Prefetch on hover
import { useQueryClient } from "@tanstack/react-query"

function PostList({ posts }) {
  const queryClient = useQueryClient()
  
  const handleHover = (postId: string) => {
    queryClient.prefetchQuery({
      queryKey: postKeys.detail(postId),
      queryFn: () => postsService.getPost(postId),
      staleTime: 5 * 60 * 1000,
    })
  }
  
  return (
    <div>
      {posts.map(post => (
        <div 
          key={post.id}
          onMouseEnter={() => handleHover(post.id)}
        >
          {post.title}
        </div>
      ))}
    </div>
  )
}

// ✅ Prefetch in loader
export async function loader({ params }: LoaderFunctionArgs) {
  const queryClient = getQueryClient()
  
  queryClient.prefetchQuery({
    queryKey: postKeys.detail(params.id),
    queryFn: () => postsService.getPost(params.id),
  })
  
  return null
}
```

### 4. **Optimistic Updates**

```typescript
// ✅ Optimistic mutations
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: updatePost,
  
  // Optimistically update
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: postKeys.all })
    
    // Snapshot previous value
    const previousPosts = queryClient.getQueryData(postKeys.list())
    
    // Update cache optimistically
    queryClient.setQueryData(postKeys.list(), (old) => 
      old.map(post => 
        post.id === newData.id ? { ...post, ...newData } : post
      )
    )
    
    return { previousPosts }
  },
  
  // Rollback on error
  onError: (err, newData, context) => {
    queryClient.setQueryData(postKeys.list(), context.previousPosts)
    toast.error("Failed to update post")
  },
  
  // Refetch after mutation
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: postKeys.all })
  },
})
```

### 5. **Infinite Queries for Pagination**

```typescript
// ✅ Infinite scroll pattern
export function useInfinitePosts() {
  return useInfiniteQuery({
    queryKey: ["posts", "infinite"],
    queryFn: ({ pageParam = 0 }) => 
      postsService.getPosts({ page: pageParam, limit: 20 }),
    getNextPageParam: (lastPage) => 
      lastPage.length === 20 ? lastPage.page + 1 : undefined,
    staleTime: 5 * 60 * 1000,
  })
}

// ✅ Usage in component
function PostFeed() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfinitePosts()
  
  return (
    <div>
      {data.pages.map((page) =>
        page.map((post) => <PostCard key={post.id} post={post} />)
      )}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage ? "Loading..." : "Load More"}
      </button>
    </div>
  )
}
```

---

## 🗄️ Dashboard Cache Implementation

### Existing Pattern (`lib/dashboard-cache.ts`)

```typescript
// ✅ Use existing dashboard cache utility
import { getDashboardCache, setDashboardCache } from "@/lib/dashboard-cache"

export async function getDashboardData(userId: string) {
  // Check cache first
  const cached = getDashboardCache(userId)
  if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
    return cached.data
  }
  
  // Fetch fresh data
  const data = await fetchDashboardData(userId)
  
  // Update cache
  setDashboardCache(userId, data)
  
  return data
}
```

### Cache Tags Pattern (`lib/cache-tags.ts`)

```typescript
// ✅ Use cache tags for invalidation
import { CacheTags } from "@/lib/cache-tags"

// Tag structure
const tags = {
  posts: CacheTags.posts.all,
  profile: CacheTags.profile.detail(userId),
  matches: CacheTags.matches.suggestions(userId),
}

// Invalidate by tag
queryClient.invalidateQueries({ queryKey: [CacheTags.posts.all] })
```

---

## 🎯 Zustand Client State

### Store Optimization

```typescript
// ✅ Slice pattern for large stores
import { create } from "zustand"

interface UIState {
  sidebar: {
    isOpen: boolean
    toggle: () => void
  }
  modal: {
    current: string | null
    open: (id: string) => void
    close: () => void
  }
}

const createUISlice: StateCreator<UIState> = (set) => ({
  sidebar: {
    isOpen: false,
    toggle: () => set((state) => ({ 
      sidebar: { ...state.sidebar, isOpen: !state.sidebar.isOpen } 
    })),
  },
  modal: {
    current: null,
    open: (id) => set({ modal: { current: id } }),
    close: () => set({ modal: { current: null } }),
  },
})

export const useUIStore = create<UIState>()((...args) => ({
  ...createUISlice(...args),
}))

// ✅ Selective subscriptions
function Sidebar() {
  const isOpen = useUIStore((state) => state.sidebar.isOpen)
  const toggle = useUIStore((state) => state.sidebar.toggle)
  
  return <Sidebar isOpen={isOpen} onToggle={toggle} />
}
```

### Shallow Comparison

```typescript
// ✅ Use shallow comparison for multiple values
import { shallow } from "zustand/shallow"

function Component() {
  const { sidebar, modal } = useUIStore(
    (state) => ({ sidebar: state.sidebar, modal: state.modal }),
    shallow
  )
  
  return <div>...</div>
}
```

---

## 🌐 Supabase Realtime Cache Sync

### Pattern for Real-time Updates

```typescript
// ✅ Sync realtime with React Query cache
export function useMessages(conversationId: string) {
  const queryClient = useQueryClient()
  
  // Fetch messages
  const { data: messages } = useQuery({
    queryKey: ["messages", conversationId],
    queryFn: () => messagesService.getMessages(conversationId),
  })
  
  // Subscribe to new messages
  useEffect(() => {
    const channel = supabase
      .channel(`messages:${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          // Update cache optimistically
          queryClient.setQueryData(
            ["messages", conversationId],
            (old) => [...old, payload.new]
          )
        }
      )
      .subscribe()
    
    return () => {
      supabase.removeChannel(channel)
    }
  }, [conversationId, queryClient])
  
  return messages
}
```

---

## 📊 Cache Strategy Matrix

| Data Type | Stale Time | GC Time | Refetch | Optimistic |
|-----------|-----------|---------|---------|------------|
| Notifications | 30s | 1min | 30s | ✅ |
| Messages | 1min | 5min | On event | ✅ |
| Posts Feed | 5min | 10min | On focus | ✅ |
| User Profile | 15min | 30min | On focus | ❌ |
| Match Suggestions | 10min | 20min | Manual | ❌ |
| Settings | ∞ | ∞ | Never | ❌ |

---

## 🔧 Cache Invalidation Patterns

### 1. **Time-Based Invalidation**

```typescript
// ✅ Automatic with staleTime
useQuery({
  queryKey: ["posts"],
  queryFn: fetchPosts,
  staleTime: 5 * 60 * 1000,  // Refetch after 5 min
})
```

### 2. **Event-Based Invalidation**

```typescript
// ✅ Invalidate on mutation
const mutation = useMutation({
  mutationFn: createPost,
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["posts"] })
  },
})
```

### 3. **Optimistic Update + Invalidation**

```typescript
// ✅ Best of both worlds
const mutation = useMutation({
  mutationFn: updatePost,
  onMutate: async (newData) => {
    // Optimistic update
    queryClient.setQueryData(["posts", id], newData)
  },
  onSettled: () => {
    // Background refetch for consistency
    queryClient.invalidateQueries({ queryKey: ["posts"] })
  },
})
```

---

## 📈 Performance Checklist

### Pre-Commit Review

- [ ] Query keys structured hierarchically?
- [ ] Stale times appropriate for data type?
- [ ] Prefetching on hover/navigation?
- [ ] Optimistic updates for mutations?
- [ ] Realtime sync with cache?
- [ ] Selective Zustand subscriptions?
- [ ] Cache invalidation on mutations?

### Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Cache hit rate | > 90% | React Query DevTools |
| Refetch rate | < 10% | React Query DevTools |
| Optimistic updates | 100% mutations | Code review |
| Stale data age | < 5min | React Query DevTools |
| GC memory | < 50MB | React Query DevTools |

---

## 🛠️ Debugging Tools

### React Query DevTools

```bash
npm install @tanstack/react-query-devtools
```

```typescript
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"

function App() {
  return (
    <>
      <App />
      <ReactQueryDevtools initialIsOpen={false} />
    </>
  )
}
```

**Check:**
- Query cache state
- Active queries
- Inactive queries
- Query timing
- Refetch triggers

---

## ⚠️ STRICT RULES

1. **NEVER** fetch data in `useEffect` (use React Query)
2. **NEVER** use `staleTime: 0` (always cache something)
3. **NEVER** invalidate all queries (`invalidateQueries()` without filter)
4. **ALWAYS** use hierarchical query keys
5. **ALWAYS** implement optimistic updates for mutations
6. **ALWAYS** cleanup realtime subscriptions

---

## 🎯 Agent Actions

When implementing data fetching:

1. **Define query keys** in `lib/` constants
2. **Set stale times** based on data type
3. **Add prefetching** for navigation targets
4. **Implement optimistic updates** for all mutations
5. **Sync with realtime** for live data
6. **Test cache behavior** in React Query DevTools

**Remember:** The fastest query is the one you don't make.

---

## 📚 Reference

- **React Query:** `hooks/use-*.ts` (existing hooks)
- **Zustand:** `components/providers/` (existing stores)
- **Dashboard Cache:** `lib/dashboard-cache.ts`
- **Cache Tags:** `lib/cache-tags.ts`
- **Prefetch:** `lib/prefetch.ts`
