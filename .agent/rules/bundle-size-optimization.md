# 🚀 Bundle Size & Import Optimization

**Trigger:** `always_on`

**Priority:** CRITICAL - Directly impacts Core Web Vitals (FCP, TTI)

---

## 🎯 Objective

Minimize bundle size through strategic imports and code splitting to achieve:
- FCP < 1.8s
- TTI < 3.5s
- Main bundle < 500KB (gzipped)

---

## 📦 Import Optimization Rules

### 1. **Specific Icon Imports (MANDATORY)**

```typescript
// ❌ WRONG - Imports entire icon library
import * as Icons from "lucide-react"

// ✅ CORRECT - Import only what you need
import { Menu, X, ChevronDown } from "lucide-react"

// ✅ CORRECT - Dynamic imports for large icon sets
const Icon = dynamic(() => import("lucide-react").then(mod => mod[iconName]))
```

**Impact:** Reduces bundle by 50-100KB per page

### 2. **Component-Level Code Splitting**

```typescript
// Heavy 3D components - lazy load
const ModelViewer = dynamic(() => import("@/components/shared/model-viewer"), {
  loading: () => <Skeleton className="w-full h-64" />,
  ssr: false  // Three.js doesn't need SSR
})

// Complex animations - lazy load
const ScrollStack = dynamic(() => import("@/components/shared/scroll-stack"), {
  loading: () => <div className="h-96 bg-muted animate-pulse" />
})

// Dashboard widgets - split by visibility
const SuggestionsSidebar = dynamic(() => import("@/features/dashboard/suggestions-sidebar"), {
  suspense: true
})
```

**When to Lazy Load:**
- Components with Three.js/R3F
- Components with GSAP animations
- Below-fold content
- Conditional UI (modals, dropdowns)
- Heavy data visualizations

### 3. **Library Import Patterns**

```typescript
// ❌ WRONG
import _ from "lodash"
import { format } from "date-fns"

// ✅ CORRECT
import debounce from "lodash/debounce"
import format from "date-fns/format"

// ✅ EVEN BETTER - Use native when possible
const debounce = (fn, ms) => {
  let timeoutId
  return (...args) => {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => fn(...args), ms)
  }
}
```

### 4. **shadcn/ui Import Strategy**

```typescript
// ❌ WRONG - Don't import from index
import { Button, Card, Input } from "@/components/ui"

// ✅ CORRECT - Direct file imports
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
```

---

## 🎨 3D & Animation Bundle Rules

### Three.js Optimization

```typescript
// ✅ Use @react-three/drei helpers (tree-shakeable)
import { OrbitControls, Environment } from "@react-three/drei"

// ❌ Avoid importing entire drei
import * as Drei from "@react-three/drei"

// ✅ Dynamic imports for heavy 3D
const Globe = dynamic(() => import("@/components/ui/globe"), { ssr: false })
const GridBackground = dynamic(() => import("@/components/ui/grid-background"), { ssr: false })
```

### GSAP Optimization

```typescript
// ✅ Import only needed plugins
import { gsap } from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
gsap.registerPlugin(ScrollTrigger)

// ❌ Don't import entire GSAP
import gsap from "gsap/all"
```

---

## 📊 Bundle Analysis Checklist

Before merging PRs, verify:

```bash
# Analyze bundle
npm run build
# Check .next/static/chunks/

# Tools to use:
- @next/bundle-analyzer
- webpack-bundle-analyzer
- source-map-explorer
```

**Red Flags:**
- Any chunk > 200KB
- Duplicate lodash imports
- Full library imports
- Three.js in main bundle
- GSAP in main bundle

---

## 🔧 Implementation Patterns

### Server Component Imports (No Bundle Impact)

```typescript
// ✅ Server Components don't add to client bundle
import { profiles } from "@/lib/services/profiles"
import { matches } from "@/lib/services/matches"

export default async function Dashboard() {
  const data = await profiles.getFeatured()
  return <DashboardFeed data={data} />
}
```

### Client Component Optimization

```typescript
"use client"

// ✅ Import hooks at top level
import { useState, useMemo, useCallback } from "react"

// ✅ Memoize expensive computations
const filteredMatches = useMemo(() => {
  return matches.filter(m => m.score > threshold)
}, [matches, threshold])

// ✅ Callback memoization
const handleMatch = useCallback((id) => {
  // handler logic
}, [dependencies])
```

---

## 📈 Performance Metrics

| Metric | Target | Current | Status |
|--------|--------|---------|--------|
| Main bundle size | < 500KB | TBD | 🟡 |
| Largest chunk | < 200KB | TBD | 🟡 |
| Icon bundle | < 20KB | TBD | 🟡 |
| 3D bundle (lazy) | < 150KB | TBD | 🟡 |
| Animation bundle | < 50KB | TBD | 🟡 |

---

## 🛠️ Quick Fixes

### 1. Find Bundle Bloat

```bash
# Install analyzer
npm install -D @next/bundle-analyzer

# Add to next.config.ts
import bundleAnalyzer from '@next/bundle-analyzer'
const withBundleAnalyzer = bundleAnalyzer({ enabled: true })

# Run build
npm run build
```

### 2. Fix Common Issues

| Issue | Fix | Impact |
|-------|-----|--------|
| Full lodash import | Use lodash-es or specific imports | -70KB |
| Full moment.js | Switch to date-fns | -200KB |
| Three.js in main bundle | Dynamic import + ssr: false | -150KB |
| Full icon library | Named imports only | -50KB |

---

## ⚠️ STRICT RULES

1. **NEVER** import entire libraries (`import _ from "lodash"`)
2. **NEVER** import Three.js in root layout
3. **NEVER** use `require()` for dynamic imports (use `dynamic()`)
4. **ALWAYS** use specific icon imports
5. **ALWAYS** add `ssr: false` for WebGL components
6. **ALWAYS** verify imports exist before adding

---

## 🎯 Agent Actions

When writing code:

1. **Check existing imports** in target file
2. **Use specific imports** from day one
3. **Add dynamic imports** for heavy components
4. **Verify bundle impact** before committing
5. **Suggest splits** for large components (>300 lines)

**Remember:** Every KB counts. Users on mobile networks feel every byte.
