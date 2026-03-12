# ⚡ Rendering Performance Optimization

**Trigger:** `always_on`

**Priority:** CRITICAL - Directly impacts FCP, TTI, and user experience

---

## 🎯 Objective

Achieve buttery-smooth 60fps rendering with:
- FCP < 1.8s
- LCP < 2.5s
- TTI < 3.5s
- Zero layout shifts (CLS < 0.1)

---

## 🔄 React 19 Compiler Optimization

### Leverage React Compiler (Auto-Memoization)

```typescript
// ✅ React Compiler automatically optimizes this
function UserProfile({ user }) {
  const formatted = formatDate(user.createdAt)  // Auto-memoized
  return <div>{formatted}</div>
}

// ❌ Don't over-optimize (let compiler handle it)
const UserProfile = memo(({ user }) => {
  const formatted = useMemo(() => formatDate(user.createdAt), [user.createdAt])
  return <div>{formatted}</div>
})
```

**When to Manual Optimize:**
- Expensive computations (>10ms)
- Event handlers passed to memoized children
- Third-party components without React Compiler support

---

## 🎨 Component Rendering Patterns

### 1. **Server Component First**

```typescript
// ✅ DEFAULT: Server Component
import { createClient } from "@/lib/supabase/server"

export default async function Dashboard() {
  const supabase = await createClient()
  const { data } = await supabase.from("posts").select()
  
  return <Feed posts={data} />
}

// ✅ CLIENT: Only when needed
"use client"
export function Feed({ posts }) {
  const [filter, setFilter] = useState("all")
  return <div>...</div>
}
```

**Server Component Benefits:**
- Zero bundle size
- Direct database access
- No hydration cost
- Instant TTI

### 2. **Suspense Boundaries**

```typescript
// ✅ Wrap slow data in Suspense
import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"

export default function Dashboard() {
  return (
    <div>
      <Suspense fallback={<Skeleton className="h-64 w-full" />}>
        <Feed />
      </Suspense>
      <Suspense fallback={<Skeleton className="h-48 w-80" />}>
        <SuggestionsSidebar />
      </Suspense>
    </div>
  )
}

// ✅ In component
export async function Feed() {
  const supabase = await createClient()
  const { data } = await supabase.from("posts").select().limit(10)
  return <div>...</div>
}
```

### 3. **Progressive Enhancement**

```typescript
// ✅ Load critical content first
export default function Profile({ params }) {
  return (
    <>
      {/* Critical: Above fold */}
      <ProfileHeader userId={params.id} />
      
      {/* Non-critical: Below fold */}
      <Suspense fallback={<Skeleton className="h-96" />}>
        <ProfileContent userId={params.id} />
      </Suspense>
      
      {/* Lazy: User interaction */}
      <Suspense fallback={null}>
        <Comments userId={params.id} />
      </Suspense>
    </>
  )
}
```

---

## 🎭 Animation Performance

### Framer Motion Optimization

```typescript
// ✅ Use transform and opacity only (GPU accelerated)
<motion.div
  animate={{ 
    x: 100,      // ✅ GPU
    opacity: 0,  // ✅ GPU
    scale: 1.1   // ✅ GPU
  }}
  transition={{ duration: 0.3 }}
/>

// ❌ Avoid layout-triggering properties
<motion.div
  animate={{ 
    width: 200,     // ❌ Layout thrashing
    height: 300,    // ❌ Layout thrashing
    margin: 20      // ❌ Layout thrashing
  }}
/>
```

### GSAP Performance

```typescript
// ✅ Batch animations
gsap.to(".card", {
  y: 100,
  stagger: 0.1,      // ✅ Single timeline
  duration: 0.5
})

// ✅ Use will-change for complex animations
.card {
  will-change: transform, opacity
}

// ❌ Don't overuse will-change (memory cost)
* {
  will-change: transform  // ❌ Memory leak
}
```

### Lenis Smooth Scroll

```typescript
// ✅ Initialize once in provider
"use client"
import { Lenis } from "lenis"
import { useEffect } from "react"

export function SmoothScrollProvider({ children }) {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smooth: true
    })
    
    function raf(time) {
      lenis.raf(time)
      requestAnimationFrame(raf)
    }
    requestAnimationFrame(raf)
  }, [])
  
  return children
}
```

---

## 🖼️ Image Optimization

### Next/Image Best Practices

```typescript
// ✅ Always use next/image with dimensions
import Image from "next/image"

<Image
  src={avatar}
  alt="User avatar"
  width={48}
  height={48}
  priority={true}  // ✅ Above fold only
  className="rounded-full"
/>

// ✅ Lazy loading for below fold
<Image
  src={postImage}
  alt="Post"
  width={600}
  height={400}
  loading="lazy"   // ✅ Default
  placeholder="blur"
  blurDataURL={blur}
/>

// ✅ OptimizedImage component (existing)
import { OptimizedImage } from "@/components/ui/optimized-image"

<OptimizedImage
  src={image}
  alt="Description"
  quality={75}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

**Image Rules:**
1. **NEVER** use `<img>` tag
2. **ALWAYS** specify width/height
3. **ALWAYS** use `placeholder="blur"` for LCP images
4. **NEVER** use `priority` on below-fold images
5. **ALWAYS** use WebP/AVIF format

---

## 📊 List & Table Optimization

### Virtual Scrolling for Large Lists

```typescript
// ✅ Use windowing for 100+ items
import { useVirtualizer } from "@tanstack/react-virtual"

export function MessageList({ messages }) {
  const parentRef = useRef(null)
  
  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 5
  })
  
  return (
    <div ref={parentRef} className="h-96 overflow-auto">
      <div style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map(virtualRow => (
          <MessageItem 
            key={virtualRow.key}
            message={messages[virtualRow.index]}
          />
        ))}
      </div>
    </div>
  )
}
```

### Pagination Pattern

```typescript
// ✅ Server-side pagination
export async function Feed({ page = 1 }) {
  const supabase = await createClient()
  const { data } = await supabase
    .from("posts")
    .select()
    .range((page - 1) * 20, page * 20 - 1)
  
  return <Posts posts={data} />
}
```

---

## 🎯 Performance Checklist

### Pre-Commit Review

- [ ] Server Component by default?
- [ ] Suspense boundaries for slow data?
- [ ] Images optimized with next/image?
- [ ] Animations use GPU properties?
- [ ] No layout shifts (CLS)?
- [ ] Lazy loaded heavy components?
- [ ] Virtual scrolling for long lists?

### Performance Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| FCP | < 1.8s | Lighthouse |
| LCP | < 2.5s | Lighthouse |
| TTI | < 3.5s | Lighthouse |
| CLS | < 0.1 | Lighthouse |
| FPS | 60fps | Chrome DevTools |
| Hydration | < 500ms | React DevTools |

---

## 🛠️ Debugging Tools

### React DevTools Profiler

```typescript
// ✅ Wrap components to find bottlenecks
import { Profiler } from "react"

<Profiler id="Dashboard" onRender={onRenderCallback}>
  <Dashboard />
</Profiler>

function onRenderCallback(
  id, phase, actualDuration, baseDuration, startTime, commitTime
) {
  console.log(`${id} took ${actualDuration}ms`)
}
```

### Chrome DevTools Performance Tab

1. **Record** user flow
2. **Identify** long tasks (>50ms)
3. **Find** layout thrashing
4. **Check** paint events
5. **Analyze** main thread activity

---

## ⚠️ STRICT RULES

1. **NEVER** use `useEffect` for data fetching (use Server Components)
2. **NEVER** render lists without `key` props
3. **NEVER** animate width/height/margin (use transform)
4. **ALWAYS** add `width` and `height` to images
5. **ALWAYS** use `Suspense` for async components
6. **NEVER** use `* { will-change: transform }`

---

## 🎯 Agent Actions

When writing components:

1. **Start with Server Component**
2. **Add Suspense boundaries** for async data
3. **Optimize images** with next/image
4. **Use GPU-accelerated animations** (transform, opacity)
5. **Virtualize lists** with 50+ items
6. **Profile before optimizing** (measure first)

**Remember:** Fast by default, optimize when needed.
