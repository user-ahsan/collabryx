# Performance Optimization Guide

## Bundle Optimization

### Analyze Bundle Size

```bash
# Generate bundle analysis report
npm run build
ANALYZE=true npm run build
```

This generates a visual report showing:
- Bundle sizes per page
- Largest dependencies
- Code splitting effectiveness
- Tree-shaking opportunities

### Current Optimizations

✅ **React Compiler** - Automatic memoization
✅ **Next.js Image** - Optimized images with WebP/AVIF
✅ **Code Splitting** - Automatic route-based splitting
✅ **Tree Shaking** - Dead code elimination
✅ **Compression** - Brotli/Gzip compression

### Recommended Improvements

1. **Dynamic Imports**
   ```typescript
   // Heavy components
   const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
     loading: () => <Skeleton />,
     ssr: false, // if client-only
   })
   ```

2. **Icon Imports**
   ```typescript
   // ✅ Good - imports only used icon
   import { Menu } from 'lucide-react'
   
   // ❌ Bad - imports entire library
   import * as Icons from 'lucide-react'
   ```

3. **Third-Party Libraries**
   - Use CDN for large libraries when possible
   - Lazy load non-critical dependencies
   - Consider lighter alternatives

---

## React Query Optimization

### Current Configuration

```typescript
// hooks/use-posts.ts
staleTime: 2 * 60 * 1000, // 2 minutes
gcTime: 10 * 60 * 1000,   // 10 minutes

// hooks/use-matches-query.ts
staleTime: 5 * 60 * 1000, // 5 minutes
gcTime: 15 * 60 * 1000,   // 15 minutes
```

### Best Practices

✅ **Stale Time** - Data considered fresh for X minutes
✅ **GC Time** - Inactive queries cached for X minutes
✅ **Prefetching** - Load data before user navigates
✅ **Optimistic Updates** - Instant UI feedback

### Implementation

```typescript
// Prefetch on hover
const prefetchPost = useQueryClient()
onMouseEnter: () => {
  queryClient.prefetchQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId),
    staleTime: 5 * 60 * 1000,
  })
}

// Optimistic update
useMutation({
  mutationFn: updatePost,
  onMutate: async (newData) => {
    await queryClient.cancelQueries(['posts'])
    const previous = queryClient.getQueryData(['posts'])
    queryClient.setQueryData(['posts'], newData)
    return { previous }
  },
  onError: (err, variables, context) => {
    queryClient.setQueryData(['posts'], context.previous)
  },
})
```

---

## Image Optimization

### Current Setup

✅ Remote patterns configured for:
- Unsplash
- Supabase Storage

✅ Formats: AVIF, WebP (smaller than JPEG/PNG)

### Usage

```typescript
import Image from 'next/image'

// ✅ Optimized
<Image
  src={avatarUrl}
  alt="User avatar"
  width={100}
  height={100}
  priority={true} // for above-fold images
  loading="eager" // for LCP images
  quality={75} // 0-100, default 75
/>
```

### Lazy Loading

```typescript
// Below-fold images (default)
<Image src="..." alt="..." loading="lazy" />

// Above-fold (hero, LCP)
<Image src="..." alt="..." priority />
```

---

## Font Optimization

### Current Setup

Using `next/font` for automatic optimization:

```typescript
import { Inter } from 'next/font/google'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
})
```

### Benefits

✅ Self-hosted fonts (no Google CDN)
✅ Automatic font subsetting
✅ Zero layout shift
✅ Privacy compliant

---

## Caching Strategy

### Static Pages

```typescript
// app/dashboard/page.tsx
export const revalidate = 60 // Revalidate every 60s
export const dynamic = 'force-dynamic' // Always fetch fresh
```

### API Routes

```typescript
// app/api/posts/route.ts
export const revalidate = 30 // Cache for 30s
```

### Server Actions

```typescript
import { revalidatePath } from 'next/cache'

await revalidatePath('/dashboard')
```

---

## Database Optimization

### Query Optimization

✅ **Specific selects** - Only fetch needed columns
✅ **Indexes** - Optimized for common queries
✅ **Limit/Offset** - Pagination implemented
✅ **RLS** - Row-level security for access control

### Connection Pooling

Supabase handles connection pooling automatically.

### Vector Embeddings

HNSW index configured for fast similarity search:

```sql
CREATE INDEX profile_embeddings_idx 
ON profile_embeddings 
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 64);
```

---

## Monitoring

### Core Web Vitals

Track these metrics:

- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **FCP** (First Contentful Paint): < 1.8s

### Vercel Analytics

Enabled in production:
- Real User Monitoring (RUM)
- Web Vitals tracking
- Page performance insights

### Lighthouse

Run audits:

```bash
# Chrome DevTools
# Lighthouse tab -> Generate report

# CLI
npm install -g lighthouse
lighthouse https://collabryx.com --view
```

Target scores:
- Performance: > 90
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 90

---

## Performance Budget

Set limits to prevent regressions:

```json
{
  "performance": {
    "maxBundleSize": "500KB",
    "maxInitialLoad": "3s",
    "maxTTFB": "200ms",
    "maxLCP": "2.5s",
    "maxCLS": "0.1"
  }
}
```

---

## Checklist

### Pre-Deploy

- [ ] Bundle size < 500KB
- [ ] Images optimized
- [ ] Fonts self-hosted
- [ ] Code splitting active
- [ ] Caching configured

### Post-Deploy

- [ ] Lighthouse score > 90
- [ ] Core Web Vitals passing
- [ ] No console errors
- [ ] API response < 500ms
- [ ] Page load < 3s

---

**Last Updated:** March 15, 2026
**Status:** ✅ Implemented
