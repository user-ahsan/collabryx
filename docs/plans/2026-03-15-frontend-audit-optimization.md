# Frontend Audit & Standardization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Comprehensive frontend audit to identify and fix routing bugs, UI/UX issues, misalignments, and component standardization problems across all 16 pages.

**Architecture:** Systematic audit approach: (1) Map all routes and identify routing issues, (2) Audit each page for UI/UX bugs and misalignments, (3) Analyze component usage patterns for standardization violations, (4) Create fix tasks prioritized by impact, (5) Implement fixes with testing.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict mode, Tailwind CSS v4, Radix UI, shadcn/ui, Framer Motion, GSAP

---

## Phase 1: Route Mapping & Routing Bug Detection

### Task 1: Create Route Audit Matrix

**Files:**
- Create: `docs/audit/route-matrix.md`
- Read: All `app/**/page.tsx` files (16 pages)

**Step 1: Document all routes**

Create route matrix with:
```markdown
| Route Path | Page Component | Layout | Auth Required | Status | Issues |
|------------|---------------|--------|---------------|--------|--------|
| /landing | app/(public)/page.tsx | (public) | No | ✅ | - |
| /login | app/(public)/login/page.tsx | (public) | No | ✅ | - |
| /dashboard | app/(auth)/dashboard/page.tsx | (auth) | Yes | ? | TBD |
```

**Step 2: Identify routing patterns**

Check for:
- Route group separation: `(auth)` vs `(public)` ✓
- Dynamic routes: `[id]` parameters
- Nested layouts
- Missing error boundaries
- Missing loading states

**Step 3: Test route access patterns**

Verify:
- Protected routes redirect unauthenticated users
- Public routes don't show auth UI
- Dynamic routes handle missing IDs
- 404 page exists and works

**Step 4: Document routing bugs**

Create issues list in `route-matrix.md`:
```markdown
## Routing Bugs Found
1. Route X: Missing auth check
2. Route Y: No error boundary
3. Route Z: Broken dynamic parameter handling
```

**Step 5: Commit**

```bash
git add docs/audit/route-matrix.md
git commit -m "docs: add route audit matrix with identified bugs"
```

---

### Task 2: Check Route Protection Implementation

**Files:**
- Read: `app/(auth)/layout.tsx`
- Read: `hooks/use-auth.ts`
- Read: `lib/supabase/server.ts`

**Step 1: Verify auth layout protection**

Check `app/(auth)/layout.tsx`:
```typescript
// Should have auth check that redirects to /login
const { data: { session } } = await createServerClient().auth.getSession()
if (!session) redirect('/login')
```

**Step 2: Test each protected route**

For each route in `(auth)/`:
- Access without auth → should redirect to `/login`
- Access with auth → should render page

**Step 3: Document auth bypasses**

Add to `route-matrix.md`:
```markdown
## Auth Bypasses
1. /dashboard/embedding-queue-admin - Missing session check
2. /messages/[id] - No connection verification
```

**Step 4: Commit**

```bash
git add docs/audit/route-matrix.md
git commit -m "audit: document auth protection gaps"
```

---

### Task 3: Audit Dynamic Route Parameters

**Files:**
- Read: `app/(auth)/messages/[id]/page.tsx`
- Read: `app/(auth)/post/[id]/page.tsx`
- Read: `app/(auth)/profile/[id]/page.tsx`

**Step 1: Check parameter validation**

Each dynamic route should:
```typescript
// Validate ID format
if (!params.id || typeof params.id !== 'string') {
  notFound()
}

// Handle missing data
if (!data) {
  notFound()
}
```

**Step 2: Verify error handling**

Check for:
- Try/catch around data fetching
- Loading states for async data
- Error states for failed queries
- 404 for missing resources

**Step 3: Document issues**

Add to `route-matrix.md`:
```markdown
## Dynamic Route Issues
1. /messages/[id] - No ID validation, crashes on invalid ID
2. /post/[id] - Missing 404 handling
3. /profile/[id] - No error boundary
```

**Step 4: Commit**

```bash
git add docs/audit/route-matrix.md
git commit -m "audit: document dynamic route parameter issues"
```

---

## Phase 2: Page-by-Page UI/UX Audit

### Task 4: Audit Landing Page (/)

**Files:**
- Read: `app/(public)/page.tsx`
- Read: `components/features/landing/*.tsx`
- Test: `npm run dev` → visit `/`

**Step 1: Visual alignment check**

Verify:
- Hero section centered on all screen sizes
- Grid layouts responsive (mobile → desktop)
- Typography hierarchy consistent
- Spacing uses Tailwind scale (4, 8, 12, 16, 24, 32)

**Step 2: Component standardization**

Check landing components use:
- `FluidGlass` for glassmorphism (not custom CSS)
- `cn()` for conditional classes
- Design tokens: `text-primary`, `bg-muted`
- No magic values: `w-[342px]` ❌

**Step 3: Animation performance**

Verify:
- GSAP animations don't cause layout shifts
- Lenis smooth scroll enabled
- No excessive re-renders (React DevTools)

**Step 4: Document issues**

Create `docs/audit/ui-ux-issues.md`:
```markdown
## Landing Page Issues
1. Hero section: 24px margin mismatch on mobile
2. Feature cards: Inconsistent padding (16px vs 20px)
3. CTA button: Non-standard color (#3B82F6 vs btn-primary)
4. Network visualization: Causes layout shift on load
```

**Step 5: Commit**

```bash
git add docs/audit/ui-ux-issues.md
git commit -m "audit: document landing page UI/UX issues"
```

---

### Task 5: Auth Pages Audit (Login/Register)

**Files:**
- Read: `app/(public)/login/page.tsx`
- Read: `app/(public)/register/page.tsx`
- Read: `components/features/auth/*.tsx`
- Test: `/login`, `/register`

**Step 1: Form validation UX**

Check:
- Error messages appear inline
- Validation triggers on blur (not just submit)
- Loading states during submission
- Success/error toasts

**Step 2: Responsive layout**

Verify:
- Forms centered vertically/horizontally
- Input fields full-width on mobile
- Keyboard doesn't hide form on mobile
- Tab order correct

**Step 3: Accessibility**

Test:
- All inputs have labels
- Error messages linked with `aria-describedby`
- Focus states visible
- Keyboard navigation works

**Step 4: Document issues**

Add to `ui-ux-issues.md`:
```markdown
## Auth Pages Issues
1. Login form: No loading state during submit
2. Register form: Error messages not linked to inputs (a11y)
3. Both: Missing toast on success
4. Mobile: Form cuts off on small screens (<375px)
```

**Step 5: Commit**

```bash
git add docs/audit/ui-ux-issues.md
git commit -m "audit: document auth pages UI/UX issues"
```

---

### Task 6: Dashboard Page Audit

**Files:**
- Read: `app/(auth)/dashboard/page.tsx`
- Read: `components/features/dashboard/*.tsx`
- Test: `/dashboard` (authenticated)

**Step 1: Layout alignment**

Check:
- Sidebar width consistent (240px or 280px)
- Main content padding matches design system
- Stats cards grid responsive (1/2/3/4 columns)
- Feed width constrained (max-w-2xl or similar)

**Step 2: Component consistency**

Verify:
- All cards use `GlassCard` component
- All buttons use shadcn `Button` component
- Icons from `lucide-react` only
- Skeleton loaders match content shape

**Step 3: Data loading states**

Check:
- React Query `isLoading` states
- Skeleton screens during fetch
- Empty states for no data
- Error states with retry

**Step 4: Document issues**

Add to `ui-ux-issues.md`:
```markdown
## Dashboard Issues
1. Stats cards: Grid breaks at 1024px (should be 1280px)
2. Post cards: Inconsistent shadow (some use shadow-md, some shadow-lg)
3. Feed: Missing empty state when no posts
4. AI Context Card: Not using FluidGlass component
5. Suggestions sidebar: Overlaps content on tablet (768-1024px)
```

**Step 5: Commit**

```bash
git add docs/audit/ui-ux-issues.md
git commit -m "audit: document dashboard UI/UX issues"
```

---

### Task 7: Messages & Matches Pages Audit

**Files:**
- Read: `app/(auth)/messages/page.tsx`
- Read: `app/(auth)/messages/[id]/page.tsx`
- Read: `app/(auth)/matches/page.tsx`
- Read: `components/features/messages/*.tsx`
- Read: `components/features/matches/*.tsx`
- Test: `/messages`, `/matches`

**Step 1: Messages layout**

Check:
- Chat list width (should be fixed, e.g., 320px)
- Chat window fills remaining space
- Message bubbles aligned (sent=right, received=left)
- Input area fixed at bottom

**Step 2: Matches grid**

Verify:
- Card aspect ratio consistent (3:4 or 4:5)
- Match score badge positioned consistently
- Filter UI doesn't overlap cards
- Infinite scroll loading indicator

**Step 3: Real-time updates**

Test:
- New messages appear without refresh
- Typing indicators work
- Online status updates
- Match suggestions refresh

**Step 4: Document issues**

Add to `ui-ux-issues.md`:
```markdown
## Messages & Matches Issues
1. Messages: Chat list not responsive (overlaps on mobile)
2. Messages: Message input not fixed at bottom on scroll
3. Matches: Match cards different heights (should be equal)
4. Matches: Filter dialog z-index too low (appears under cards)
5. Both: Missing connection state indicators
```

**Step 5: Commit**

```bash
git add docs/audit/ui-ux-issues.md
git commit -m "audit: document messages/matches UI/UX issues"
```

---

### Task 8: Profile & Onboarding Pages Audit

**Files:**
- Read: `app/(auth)/my-profile/page.tsx`
- Read: `app/(auth)/profile/[id]/page.tsx`
- Read: `app/(auth)/onboarding/page.tsx`
- Read: `components/features/profile/*.tsx`
- Read: `components/features/onboarding/*.tsx`
- Test: `/my-profile`, `/onboarding`

**Step 1: Profile layout**

Check:
- Avatar/banner responsive
- Tabs component aligned
- Form inputs consistent width
- Edit/save states clear

**Step 2: Onboarding flow**

Verify:
- Progress indicator visible
- Steps clear and numbered
- Back/Next buttons consistent
- Validation prevents invalid progression

**Step 3: Mobile experience**

Test:
- Profile tabs scrollable on mobile
- Form inputs don't zoom on iOS
- Onboarding stepper responsive

**Step 4: Document issues**

Add to `ui-ux-issues.md`:
```markdown
## Profile & Onboarding Issues
1. Profile: Banner image cropped on mobile
2. Profile: Edit button overlaps tabs on small screens
3. Onboarding: Progress bar not visible in dark mode
4. Onboarding: Step 2 (skills) overflows on iPhone SE
5. Both: Missing success toast after save
```

**Step 5: Commit**

```bash
git add docs/audit/ui-ux-issues.md
git commit -m "audit: document profile/onboarding UI/UX issues"
```

---

### Task 9: Remaining Pages Quick Audit

**Files:**
- Read: `app/(auth)/notifications/page.tsx`
- Read: `app/(auth)/requests/page.tsx`
- Read: `app/(auth)/assistant/page.tsx`
- Read: `app/(auth)/dashboard/embedding-queue-admin/page.tsx`
- Test: Each page

**Step 1: Rapid page review**

For each page check:
- Page loads without errors
- Layout aligned with design system
- No console errors
- Mobile responsive
- Loading/error states exist

**Step 2: Document issues**

Add to `ui-ux-issues.md`:
```markdown
## Other Pages Issues
1. /notifications: No empty state
2. /requests: Action buttons misaligned on mobile
3. /assistant: Chat input not fixed at bottom
4. /embedding-queue-admin: Table overflows on mobile
```

**Step 3: Commit**

```bash
git add docs/audit/ui-ux-issues.md
git commit -m "audit: document remaining pages issues"
```

---

## Phase 3: Component Standardization Audit

### Task 10: Glassmorphism Component Audit

**Files:**
- Read: `components/shared/glass-card.tsx`
- Read: `components/shared/glass-dialog.tsx`
- Read: `components/shared/glass-bubble.tsx`
- Grep: `grep -r "backdrop-blur" components/ --include="*.tsx"`
- Grep: `grep -r "bg-white/" components/ --include="*.tsx"`

**Step 1: Find glassmorphism usage**

Search for:
- Custom glassmorphism CSS
- Inconsistent backdrop blur values
- Non-standard opacity values
- Missing border treatments

**Step 2: Check component adoption**

Verify:
- All cards use `GlassCard`
- All dialogs use `GlassDialog`
- All message bubbles use `GlassMessageBubble`
- No custom glassmorphism implementations

**Step 3: Document violations**

Create `docs/audit/component-standardization.md`:
```markdown
## Glassmorphism Standardization Issues

### Components NOT using standard glass components:
1. `components/features/dashboard/ai-context-card.tsx` - Custom glass CSS
2. `components/features/landing/feature-card.tsx` - Missing backdrop-blur
3. `components/features/matches/match-card.tsx` - Inconsistent opacity

### Inconsistent values found:
- backdrop-blur: 8px, 12px, 16px (should be 12px)
- bg-opacity: 0.1, 0.2, 0.3 (should be 0.2)
- border-opacity: 0.1, 0.2 (should be 0.15)
```

**Step 4: Commit**

```bash
git add docs/audit/component-standardization.md
git commit -m "audit: document glassmorphism standardization issues"
```

---

### Task 11: Button Component Audit

**Files:**
- Read: `components/ui/button.tsx` (shadcn)
- Grep: `grep -r "<Button" components/ --include="*.tsx" | head -50`
- Grep: `grep -r "<button" components/ --include="*.tsx" | grep -v "shadcn/ui"`

**Step 1: Find button usage patterns**

Check for:
- Native `<button>` elements (should use `Button` component)
- Inconsistent variants (default, destructive, outline, ghost)
- Custom button styles
- Missing loading states

**Step 2: Verify variant consistency**

Look for:
- Primary actions: `variant="default"`
- Destructive: `variant="destructive"`
- Secondary: `variant="outline"` or `variant="ghost"`
- Icons: `size="icon"`

**Step 3: Document violations**

Add to `component-standardization.md`:
```markdown
## Button Standardization Issues

### Native button elements (should use Button component):
1. `components/features/auth/login-form.tsx:45` - Native button
2. `components/features/onboarding/stepper.tsx:78` - Native button
3. `components/features/dashboard/feed.tsx:123` - Native button

### Inconsistent variants:
- Delete actions using `outline` (should be `destructive`)
- Secondary actions using custom CSS (should be `ghost`)

### Missing loading states:
- Login form submit button
- Post creation button
- Save profile button
```

**Step 4: Commit**

```bash
git add docs/audit/component-standardization.md
git commit -m "audit: document button standardization issues"
```

---

### Task 12: Form Input Audit

**Files:**
- Read: `components/ui/input.tsx`, `components/ui/textarea.tsx`, `components/ui/select.tsx`
- Grep: `grep -r "<input" components/features --include="*.tsx" | head -30`
- Grep: `grep -r "react-hook-form" components/features --include="*.tsx"`

**Step 1: Find form input usage**

Check:
- Native inputs vs shadcn components
- React Hook Form integration
- Zod validation
- Error message display

**Step 2: Verify consistency**

Look for:
- All inputs use shadcn components
- Consistent label placement
- Error messages below inputs
- Helper text styling

**Step 3: Document violations**

Add to `component-standardization.md`:
```markdown
## Form Input Standardization Issues

### Native inputs (should use shadcn):
1. `components/features/onboarding/step-basic-info.tsx:34` - Native input
2. `components/features/settings/profile-settings-tab.tsx:67` - Native textarea

### Missing validation:
- Profile form: No Zod schema
- Settings form: Client-side validation only

### Inconsistent error display:
- Some show errors inline
- Some show in toast only
- Error text color varies (red-500 vs red-600)
```

**Step 4: Commit**

```bash
git add docs/audit/component-standardization.md
git commit -m "audit: document form input standardization issues"
```

---

### Task 13: Typography & Spacing Audit

**Files:**
- Read: `app/globals.css` (Tailwind config)
- Grep: `grep -r "text-\[" components/ --include="*.tsx"`
- Grep: `grep -r "w-\[" components/ --include="*.tsx"`
- Grep: `grep -r "p-\[0-9]" components/ --include="*.tsx"`

**Step 1: Find magic values**

Search for:
- Arbitrary values: `text-[16px]`, `w-[342px]`
- Non-standard spacing: `p-3.5`, `m-2.5`
- Custom colors not in design tokens

**Step 2: Check typography scale**

Verify:
- Headings: `text-2xl`, `text-3xl`, `text-4xl`
- Body: `text-sm`, `text-base`, `text-lg`
- Small: `text-xs`
- No custom pixel values

**Step 3: Document violations**

Create `docs/audit/typography-spacing.md`:
```markdown
## Typography Issues

### Arbitrary font sizes (should use Tailwind scale):
1. `components/features/landing/hero-3d-viewer.tsx:23` - text-[18px]
2. `components/features/dashboard/stats-cards.tsx:45` - text-[14px]
3. `components/features/messages/chat-window.tsx:67` - text-[16px]

### Inconsistent heading hierarchy:
- Dashboard uses h1, h2, h3 correctly
- Profile page skips h2 (h1 → h3)
- Landing page has multiple h1 tags

## Spacing Issues

### Arbitrary spacing values:
1. `components/features/matches/match-card.tsx:34` - p-[18px]
2. `components/features/dashboard/feed.tsx:89` - gap-[22px]
3. `components/features/onboarding/stepper.tsx:56` - m-[15px]

### Inconsistent section padding:
- Dashboard: p-6 (24px)
- Profile: p-8 (32px)
- Settings: p-4 (16px)
```

**Step 4: Commit**

```bash
git add docs/audit/typography-spacing.md
git commit -m "audit: document typography and spacing violations"
```

---

### Task 14: Icon Usage Audit

**Files:**
- Read: `package.json` (verify lucide-react installed)
- Grep: `grep -r "from \"lucide-react\"" components/ --include="*.tsx" | wc -l`
- Grep: `grep -r "import.*Icon" components/ --include="*.tsx"`

**Step 1: Check icon imports**

Verify:
- All icons from `lucide-react`
- Named imports (not default): `import { Menu } from "lucide-react"`
- Consistent sizing: `size={20}` or `className="w-5 h-5"`

**Step 2: Find custom icons**

Look for:
- SVG icons inline
- Icon component files
- Icon font usage

**Step 3: Document violations**

Add to `component-standardization.md`:
```markdown
## Icon Standardization Issues

### Non-lucide icons:
1. `components/features/landing/hero-3d-viewer.tsx` - Custom SVG icons
2. `components/features/dashboard/match-progress-tracker.tsx` - Icon font

### Inconsistent sizing:
- Some use size prop: `<Menu size={20} />`
- Some use className: `<Menu className="w-5 h-5" />`
- Mixed sizes: 16px, 18px, 20px, 24px (should be 20px)
```

**Step 4: Commit**

```bash
git add docs/audit/component-standardization.md
git commit -m "audit: document icon standardization issues"
```

---

## Phase 4: Priority Matrix & Fix Planning

### Task 15: Create Priority Matrix

**Files:**
- Create: `docs/audit/priority-matrix.md`

**Step 1: Categorize all issues**

Use Eisenhower Matrix:
```markdown
## P0: Critical (Fix Immediately)
- Routing bugs causing crashes
- Auth bypasses
- Accessibility blockers
- Mobile layout breaks

## P1: High (Fix This Sprint)
- UI misalignments affecting UX
- Component inconsistencies
- Missing error states
- Performance issues

## P2: Medium (Fix Next Sprint)
- Typography inconsistencies
- Spacing variations
- Missing loading states
- Minor responsive issues

## P3: Low (Backlog)
- Color shade variations
- Icon size inconsistencies
- Optional enhancements
```

**Step 2: Map issues to priority**

Go through all audit docs and categorize each issue.

**Step 3: Estimate effort**

For each issue add:
- [XS] < 30 min
- [S] 30-60 min
- [M] 1-2 hours
- [L] 2-4 hours
- [XL] > 4 hours

**Step 4: Commit**

```bash
git add docs/audit/priority-matrix.md
git commit -m "audit: create priority matrix for all identified issues"
```

---

### Task 16: Create Fix Implementation Plan

**Files:**
- Create: `docs/audit/fix-plan.md`

**Step 1: Group fixes by component**

Organize:
```markdown
## Fix Batch 1: Routing & Auth (P0)
1. Fix /messages/[id] ID validation
2. Add auth check to /embedding-queue-admin
3. Add error boundaries to dynamic routes

## Fix Batch 2: Dashboard (P1)
1. Standardize glassmorphism
2. Fix responsive grid
3. Add empty states

## Fix Batch 3: Forms (P1)
1. Replace native inputs with shadcn
2. Add Zod validation
3. Standardize error display
```

**Step 2: Define fix order**

Priority:
1. P0 issues (routing, auth, crashes)
2. P1 issues (UX, major misalignments)
3. P2 issues (minor inconsistencies)
4. P3 issues (nice-to-have)

**Step 3: Estimate total effort**

Calculate:
- P0: X hours
- P1: Y hours
- P2: Z hours
- Total: X+Y+Z hours

**Step 4: Commit**

```bash
git add docs/audit/fix-plan.md
git commit -m "audit: create fix implementation plan with priorities"
```

---

## Phase 5: Implementation (Use executing-plans Skill)

### Task 17+: Execute Fixes

**Follow:** `docs/audit/fix-plan.md`

**For each fix batch:**
1. Create subagent for batch
2. Implement fixes
3. Test changes
4. Commit
5. Review before next batch

---

## Summary of Audit Deliverables

### Documentation Created:
1. `docs/audit/route-matrix.md` - All routes with issues documented
2. `docs/audit/ui-ux-issues.md` - Page-by-page UI/UX bugs
3. `docs/audit/component-standardization.md` - Component usage violations
4. `docs/audit/typography-spacing.md` - Typography and spacing issues
5. `docs/audit/priority-matrix.md` - Eisenhower matrix of all issues
6. `docs/audit/fix-plan.md` - Implementation plan for fixes

### Expected Issues to Find:
- **Routing:** 5-10 bugs (auth bypasses, missing error handling)
- **UI/UX:** 20-30 issues (misalignments, missing states)
- **Components:** 15-25 violations (non-standard usage)
- **Typography/Spacing:** 20-30 magic values

### Total Estimated Effort:
- **Audit Phase:** 4-6 hours
- **Fix Phase:** 16-24 hours (depending on issue count)
- **Testing:** 4-6 hours
- **Total:** 24-36 hours

---

## Testing Strategy

### For Each Fix:
1. **Visual Test:** Open page, verify fix
2. **Responsive Test:** Mobile (375px), Tablet (768px), Desktop (1920px)
3. **Browser Test:** Chrome, Firefox, Safari
4. **Accessibility Test:** Tab navigation, screen reader
5. **Performance Test:** No new re-renders, no layout shifts

### Commit Frequency:
- **One commit per fix** (granular)
- **Descriptive messages:** `fix: standardize button usage in login form`
- **Before/after screenshots** for UI changes

---

**Ready to begin audit? I can start with Phase 1 (Route Mapping) immediately.**
