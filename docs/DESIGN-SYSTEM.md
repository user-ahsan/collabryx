# 🎨 Collabryx Design System

**Version:** 1.0.0  
**Last Updated:** 2026-03-18  
**Maintainer:** Design System Architect

---

## 📋 Overview

The Collabryx Design System provides a comprehensive set of components, utilities, and guidelines for building consistent, accessible, and visually stunning user interfaces.

### Core Principles

1. **Glassmorphism First** - Signature glassmorphic aesthetic across all components
2. **Design Tokens** - Use semantic tokens over hardcoded values
3. **Accessibility** - WCAG 2.1 AA compliance for all interactive elements
4. **Performance** - Optimized rendering with minimal re-renders
5. **Consistency** - Unified visual language across all features

---

## 🪞 Glass Variants System

### 10-Tier Glass System

The glassmorphism system is built on 10 standardized tiers, each optimized for specific use cases.

| Tier | Variant | Use Case | Example Components |
|------|---------|----------|-------------------|
| 1 | `glass("card")` | Post cards, Match cards, Profile cards | PostCard, MatchCard |
| 2 | `glass("overlay")` | Dialogs, Modals, Popovers | DialogContent, Sheet |
| 3 | `glass("dropdown")` | Dropdown menus, Context menus | DropdownMenu, ContextMenu |
| 4 | `glass("bubble")` | Comments, Chat bubbles | CommentBubble, ChatMessage |
| 5 | `glass("subtle")` | Inputs, Small elements | Input, Select |
| 5.5 | `glass("input")` | Text inputs, Textareas | Input, Textarea |
| 5.6 | `glass("buttonGhost")` | Ghost buttons | Button variant="ghost" |
| 5.7 | `glass("buttonPrimary")` | Primary buttons | Button variant="default" |
| 5.8 | `glass("buttonPrimaryGlow")` | Primary buttons with signature glow | CTA buttons |
| 5.9 | `glass("buttonSecondaryGlow")` | Secondary buttons with subtle glow | Secondary CTAs |
| 6 | `glass("mediaOverlay")` | Media viewers, Image captions | MediaViewer |
| 7 | `glass("tabActive")` | Active tabs | Tab trigger active |
| 8 | `glass("badge")` | Status badges, Notification badges | Badge |
| 9 | `glass("divider")` | Section dividers | hr, section separators |
| 10 | `glass("header")` | Sticky headers | Header, Navbar |

### Usage

```tsx
import { glass } from "@/lib/utils/glass-variants"
import { cn } from "@/lib/utils"

// Basic usage
<div className={cn("base-styles", glass("card"))}>
  Content
</div>

// With additional classes
<div className={cn("base-styles", glass("overlay"), "p-6 rounded-2xl")}>
  Content
</div>
```

### Decorative Elements

The base `DialogContent` component includes optional decorative glass elements:

- **Top Highlight** - Gradient streak at top edge
- **Left Highlight** - Vertical gradient on left edge  
- **Ambient Tint** - Subtle blue gradient overlay

These can be disabled with `showDecorations={false}` prop when needed.

```tsx
<DialogContent showDecorations={false}>
  {/* Clean dialog without decorative elements */}
</DialogContent>
```

---

## 🎨 Design Tokens

### Color Tokens

Use semantic color tokens instead of hardcoded values:

```tsx
// ✅ Good - Uses design tokens
<div className="bg-card text-primary border-border">

// ❌ Bad - Hardcoded values
<div className="bg-[#0A0A0F] text-[#FFFFFF] border-[#1A1A1A]">
```

### Standard Color Tokens

| Token | Light Mode | Dark Mode | Use Case |
|-------|------------|-----------|----------|
| `bg-background` | White | `#0A0A0F` | Page backgrounds |
| `bg-card` | White | `#0A0A0F` | Card backgrounds |
| `bg-primary` | Black | White | Primary text/buttons |
| `bg-secondary` | Gray-100 | Gray-800 | Secondary elements |
| `bg-muted` | Gray-50 | Gray-900 | Muted backgrounds |
| `text-primary` | Black | White | Primary text |
| `text-secondary` | Gray-700 | Gray-300 | Secondary text |
| `text-muted-foreground` | Gray-500 | Gray-400 | Muted text |
| `border-border` | Gray-200 | Gray-800 | Default borders |

### Brand Colors

Brand colors are **oklch** based for consistent appearance across themes:

- **Primary Brand:** `oklch(0.488 0.243 264.376)` (Purple-Blue)
- **Accent:** `oklch(0.55 0.2 265)` (Vibrant Purple)

---

## 📏 Arbitrary Tailwind Values

### ✅ Acceptable Uses

Arbitrary values (e.g., `w-[600px]`) are acceptable for:

1. **Responsive Constraints**
   ```tsx
   <div className="max-w-[600px] md:max-w-[800px]">
   <div className="h-[50vh] lg:h-[70vh]">
   ```

2. **Viewport-Based Sizing**
   ```tsx
   <div className="w-[95vw] h-[85vh]">
   ```

3. **Specific Layout Requirements**
   ```tsx
   <div className="w-[280px]"> {/* Sidebar width */}
   <div className="max-w-[calc(100%-2rem)]"> {/* Constrained width */}
   ```

4. **Custom Shadows** (when matching brand aesthetic)
   ```tsx
   <Button className="shadow-[0_4px_20px_0_rgba(59,130,246,0.3)]">
   ```

### ❌ Unacceptable Uses

Avoid arbitrary values for:

1. **Colors** - Use design tokens
   ```tsx
   // ❌ Bad
   <div className="bg-[#0A0A0F]">
   
   // ✅ Good
   <div className="bg-background">
   ```

2. **Spacing** - Use Tailwind scale
   ```tsx
   // ❌ Bad
   <div className="p-[16px] gap-[24px]">
   
   // ✅ Good
   <div className="p-4 gap-6">
   ```

3. **Border Radius** - Use design tokens
   ```tsx
   // ❌ Bad
   <div className="rounded-[12px]">
   
   // ✅ Good
   <div className="rounded-xl">
   ```

4. **Font Sizes** - Use typography scale
   ```tsx
   // ❌ Bad
   <p className="text-[14px]">
   
   // ✅ Good
   <p className="text-sm">
   ```

---

## 🔧 Component Standards

### Dialog Components

All dialogs must use the `DialogContent` base component which includes:

- `glass("overlay")` variant by default
- Optional decorative elements (`showDecorations` prop)
- Optional close button (`showCloseButton` prop)
- Consistent animations and transitions

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

<Dialog>
  <DialogContent className="max-w-2xl">
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    Content here
  </DialogContent>
</Dialog>
```

### Button Components

Use standardized button variants with glass effects:

```tsx
import { Button } from "@/components/ui/button"
import { glass } from "@/lib/utils/glass-variants"

// Primary button with glow
<Button className={cn("px-6 py-3", glass("buttonPrimaryGlow"))}>
  Primary CTA
</Button>

// Secondary button with subtle glow
<Button variant="outline" className={cn("px-6 py-3", glass("buttonSecondaryGlow"))}>
  Secondary Action
</Button>
```

### Card Components

Use `GlassCard` for consistent card styling:

```tsx
import { GlassCard } from "@/components/shared/glass-card"

<GlassCard hoverable className="p-6">
  <h3 className="text-lg font-semibold">Card Title</h3>
  <p className="text-muted-foreground">Card content</p>
</GlassCard>
```

---

## 🎯 Border Radius Standards

Consistent border radius values across all components:

| Token | Value | Use Case |
|-------|-------|----------|
| `rounded-xs` | 0.125rem | Small elements |
| `rounded-sm` | 0.25rem | Minimal rounding |
| `rounded` | 0.5rem | Default |
| `rounded-lg` | 0.75rem | Cards, buttons |
| `rounded-xl` | 1rem | Cards, inputs |
| `rounded-2xl` | 1.5rem | Dialogs, modals |
| `rounded-3xl` | 2rem | Large containers |
| `rounded-full` | 9999px | Avatars, badges |

---

## ✨ Shadow System

### Standard Shadows

| Token | Value | Use Case |
|-------|-------|----------|
| `shadow-sm` | 0 1px 2px | Subtle elevation |
| `shadow` | 0 1px 3px | Default |
| `shadow-md` | 0 4px 6px | Cards |
| `shadow-lg` | 0 10px 15px | Dialogs |
| `shadow-xl` | 0 20px 25px | Modals |
| `shadow-2xl` | 0 25px 50px | Large overlays |
| `shadow-glass-card` | Custom | Glass cards |

### Custom Brand Shadows

For signature blue glow effects:

```tsx
// Primary button glow
shadow-[0_4px_20px_0_rgba(59,130,246,0.3)]

// Hover state
hover:shadow-[0_6px_28px_0_rgba(59,130,246,0.4)]

// Card glow
shadow-[0_4px_32px_0_rgba(59,130,246,0.06)]
```

---

## 📚 Related Documentation

- [Architecture Overview](./ARCHITECTURE.md)
- [Component Guidelines](./02-architecture/components.md)
- [Styling Guide](./02-architecture/styling.md)
- [Glass Variants Implementation](../lib/utils/glass-variants.ts)

---

## 🔍 Audit Checklist

Use this checklist when reviewing components for design system compliance:

- [ ] Uses `glass()` variants instead of manual styling
- [ ] Uses design tokens (`bg-card`, `text-primary`) over hardcoded values
- [ ] Follows border radius standards (`rounded-xl`, `rounded-2xl`)
- [ ] Uses acceptable arbitrary values only for responsive/layout constraints
- [ ] Includes proper hover states and transitions
- [ ] Maintains accessibility (contrast ratios, focus states)
- [ ] Consistent with other components in same category

---

**Design System Version:** 1.0.0  
**Last Audit:** 2026-03-18  
**Next Review:** After major feature releases
