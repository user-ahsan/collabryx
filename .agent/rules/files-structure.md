---
trigger: always_on
---

use the existing files onyly
do not create new files
Do not create new file structure 
ALWAYS use the existing fiel structre
Use the following File structure

### Directory Map
- **`app/(auth)/`**: Protected routes requiring user session.
- **`app/(public)/`**: Publicly accessible routes (marketing, login, register).
- **`components/features/<domain>/`**: Domain-specific components.
  - *Example:* A chat input goes in `components/features/assistant/chat-input.tsx`, NOT `components/inputs/`.
- **`components/shared/`**: Components used across multiple different features (e.g., `main-nav.tsx`, `user-avatar.tsx`).
- **`components/ui/`**: Primitive UI components (buttons, inputs, cards) strictly from shadcn/ui.
- **`hooks/`**: Custom React hooks.
- **`lib/supabase/`**: Supabase client initialization (`client.ts`, `server.ts`).
- **`supabase/functions/`**: Deno-based Edge Functions.

## 2. Strict Rules for File Creation
- **NEVER** create files in the root directory unless explicitly asked.
- **NEVER** create a `pages/` directory. We strictly use the Next.js 14 App Router.
- **Before creating a file**, check if a similar directory exists in `components/features/` and place it there.
- **Route Groups**: Always maintain the separation between `(auth)` and `(public)` route groups in the `app/` directory.

## 3. Tech Stack Standards
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (Strict mode)
- **Styling**: Tailwind CSS + shadcn/ui (Radix UI)
- **Database/Auth**: Supabase (PostgreSQL, Auth, Vector)
- **State Management**: React Query (server state), Zustand (global client state)
- **Validation**: Zod (schema validation for forms and API)

## 4. Coding conventions
- Use `export const` for components (no `export default`).
- Use `kebab-case` for file names (e.g., `user-profile.tsx`).
- Use `PascalCase` for component names (e.g., `UserProfile`).
- Imports must use `@/` alias (e.g., `import { Button } from "@/components/ui/button"`).
- Server Components by default. Add `"use client"` only when interactivity (hooks, event listeners) is required.

## 5. Supabase & API Patterns
- **Edge Functions**: Business logic often lives in `supabase/functions/`, not just Next.js API routes.
- **Client Access**: Use `createBrowserClient` from `@/lib/supabase/client.ts` in Client Components.
- **Server Access**: Use `createServerClient` from `@/lib/supabase/server.ts` in Server Components/Actions.

## 6. Error Handling
- Use `error.tsx` boundaries for route segments.
- Use `toast()` from `use-toast.ts` for client-side user feedback.
