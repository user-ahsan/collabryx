---
trigger: always_on
---

Here is a comprehensive **Code Quality & Assurance Protocol**. You should add this to your `.cursorrules`, `.windsurfrules`, or your AI assistant’s system prompt.

It is designed to force the AI to think like a Senior Engineer, prioritizing safety, scalability, and maintainability over "quick fixes."

````markdown
# CODE QUALITY ASSURANCE PROTOCOL (CQA)

You are now operating under the **Senior Architect Protocol**. Your goal is not just to "make it work," but to "make it production-ready." You must adhere to the following logic, style, and quality standards for every single line of code you generate.

## 1. Core Philosophy: The "Production First" Mindset
- **Defensive Coding:** Assume APIs will fail, users will input malformed data, and network connections will drop. Write guards against these scenarios.
- **Type Safety is Non-Negotiable:** TypeScript is not a suggestion. It is a strict contract.
- **Server-First:** In Next.js 14, always default to Server Components. Move to Client Components (`"use client"`) only when specific interactivity (hooks, event listeners) is required.

---

## 2. TypeScript & Data Validation Standards

### ❌ BAD PRACTICE
- Using `any` or `// @ts-ignore`.
- Defining types manually when database types exist.
- Trusting API responses blindly.

### ✅ GOOD PRACTICE
- **Strict Typing:** Use `unknown` instead of `any` if the type is truly dynamic, then narrow it.
- **Single Source of Truth:** Import generated database types from `@/types/database.types.ts`.
- **Runtime Validation:** Use **Zod** to validate all inputs (forms, API params, search params).

#### Example: API Route Validation
```typescript
// BAD: Trusting the body
export async function POST(req: Request) {
  const body = await req.json(); // body is 'any'
  await db.create(body); // dangerous!
}

// GOOD: Zod Validation
import { z } from "zod";
const createSchema = z.object({
  title: z.string().min(3),
  email: z.string().email()
});

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = createSchema.safeParse(body);

  if (!parsed.success) {
    return Response.json({ error: "Invalid input" }, { status: 400 });
  }

  // parsed.data is fully typed
  await db.create(parsed.data);
}
````

-----

## 3\. React & Next.js Logic Patterns

### ❌ BAD PRACTICE

  - Fetching data inside `useEffect` (unless absolutely necessary).
  - Prop drilling more than 2 levels deep.
  - Large components (\> 200 lines) with mixed concerns.

### ✅ GOOD PRACTICE

  - **Server Fetching:** Fetch data in Server Components/Pages and pass it down.
  - **Suspense & Streaming:** Use `loading.tsx` or `<Suspense>` boundaries for slow data.
  - **Composition:** Break complex UIs into small, single-responsibility feature components.

#### Example: Data Fetching

```tsx
// BAD: Client-side waterfall
"use client"
function Dashboard() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/user').then(...)
  }, []);
  if (!data) return <Spinner />;
  return <div>{data.name}</div>;
}

// GOOD: Server Component
import { createServerClient } from "@/lib/supabase/server";

export default async function DashboardPage() {
  const supabase = createServerClient();
  const { data: user, error } = await supabase.from('users').select('*').single();

  if (error) throw error; // Caught by error.tsx

  return <div>{user.name}</div>;
}
```

-----

## 4\. Tailwind CSS & UI Architecture

### ❌ BAD PRACTICE

  - String concatenation for class names (e.g., `` `btn ${isActive ? 'active' : ''}` ``).
  - Magic values (e.g., `w-[342px]`).
  - Inconsistent spacing (mixing `p-4` with `m-5`).

### ✅ GOOD PRACTICE

  - **Utility Merger:** ALWAYS use the `cn()` utility (clsx + tailwind-merge) for conditional classes.
  - **Design Tokens:** Use `text-primary`, `bg-muted` (shadcn tokens) instead of hardcoded colors like `text-blue-500`.
  - **Responsive:** Mobile-first approach (`w-full md:w-1/2`).

#### Example: Conditional Styling

```tsx
// BAD
<button className={`p-2 rounded ${isAdmin ? 'bg-red-500' : 'bg-blue-500'}`}>

// GOOD
import { cn } from "@/lib/utils/cn";
<button className={cn(
  "p-2 rounded transition-colors",
  isAdmin ? "bg-destructive text-destructive-foreground" : "bg-primary text-primary-foreground"
)}>
```

-----

## 5\. Defensive Logic & Error Handling

### ❌ BAD PRACTICE

  - Nested `if` statements (Arrow Code).
  - Silent failures (empty catch blocks).
  - generic error messages ("Something went wrong").

### ✅ GOOD PRACTICE

  - **Guard Clauses:** Return early to reduce nesting.
  - **Granular Errors:** Handle specific error codes (e.g., 401 vs 404).
  - **User Feedback:** Use `toast.error()` for client-side failures.

#### Example: Guard Clauses

```typescript
// BAD: Nested Hell
const processUser = (user) => {
  if (user) {
    if (user.isActive) {
      if (user.hasSubscription) {
        return saveUser(user);
      }
    }
  }
}

// GOOD: Guard Clauses
const processUser = (user) => {
  if (!user) return;
  if (!user.isActive) return;
  if (!user.hasSubscription) return;

  return saveUser(user);
}
```

-----

## 6\. Supabase & Database Interactions

### ❌ BAD PRACTICE

  - Selecting `*` when you only need one column.
  - Ignoring RLS (Row Level Security) policies.
  - Chaining queries without error checking.

### ✅ GOOD PRACTICE

  - **Typed Clients:** Always instantiate clients with `<Database>` generics.
  - **Specific Selects:** `.select('id, name, avatar_url')` to reduce payload.
  - **Error Handling:** Always check `if (error)` immediately after a query.

-----

## 7\. Performance & Optimization Rules

1.  **Image Optimization:** Always use `next/image` with defined `width`/`height` or `fill`.
2.  **Debouncing:** Never attach a raw fetch function to an `onChange` input. Use `useDebounce`.
3.  **Memoization:** Don't premature optimize, but do wrap expensive computations in `useMemo` if they block the render loop.
4.  **Bundle Size:** Import specific icons (`import { Menu } from "lucide-react"`) rather than the whole library.

## SUMMARY CHECKLIST (Before Outputting Code)

1.  Are all variables typed? (No implicit `any`)
2.  Did I use `cn()` for dynamic classes?
3.  Is data fetching happening on the server where possible?
4.  Are API inputs validated with Zod?
5.  Is there a Guard Clause handling null/undefined/error states?
6.  Did I stick to the Feature-Folder structure?

<!-- end list -->

```
```