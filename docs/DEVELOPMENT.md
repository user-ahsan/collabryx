# 🛠️ Development Guide

Complete guide for developing with the Collabryx codebase.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Project Commands](#project-commands)
- [Code Standards](#code-standards)
- [Git Workflow](#git-workflow)
- [Testing](#testing)
- [Debugging](#debugging)
- [Performance Optimization](#performance-optimization)
- [Common Tasks](#common-tasks)

---

## Getting Started

### First-Time Setup

If you haven't already, complete the [Installation Guide](./INSTALLATION.md) first.

### Development Server

Start the Next.js development server:

```bash
npm run dev
```

The application will be available at:
- **Local:** http://localhost:3000
- **Network:** http://192.168.x.x:3000 (for testing on other devices)

**Features enabled in development mode:**
- ⚡ Hot Module Replacement (HMR)
- 🔍 Detailed error messages
- 📊 React Developer Tools support
- 🎨 Source maps for debugging

---

## Development Workflow

### Daily Development Flow

```bash
# 1. Pull latest changes
git pull origin main

# 2. Create a new feature branch
git checkout -b feature/your-feature-name

# 3. Start development server
npm run dev

# 4. Make your changes
# Edit files in app/, components/, etc.

# 5. Test your changes
# Manual testing in browser
# Check for console errors

# 6. Lint your code
npm run lint

# 7. Commit your changes
git add .
git commit -m "feat: your descriptive commit message"

# 8. Push to your branch
git push origin feature/your-feature-name

# 9. Create a Pull Request on GitHub
```

---

## Project Commands

### Core Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `npm run dev` | Start development server | Daily development |
| `npm run build` | Create production build | Before deployment |
| `npm run start` | Run production build locally | Test production build |
| `npm run lint` | Run ESLint | Code quality check |

### Development Commands

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Start production server (after build)
npm run start

# Run linter
npm run lint

# Run linter with auto-fix
npm run lint -- --fix
```

### Package Management

```bash
# Install a new dependency
npm install package-name

# Install a dev dependency
npm install -D package-name

# Remove a dependency
npm uninstall package-name

# Update all dependencies (use with caution)
npm update

# Check for outdated packages
npm outdated

# Audit for vulnerabilities
npm audit

# Fix vulnerabilities automatically
npm audit fix
```

---

## Code Standards

### TypeScript Standards

#### ✅ DO: Use Strict Types

```typescript
// ✅ GOOD: Proper typing
interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string;
}

const user: UserProfile = {
  id: "123",
  name: "John Doe",
  email: "john@example.com"
};

// ❌ BAD: Using 'any'
const user: any = {
  id: "123",
  name: "John Doe"
};
```

#### ✅ DO: Import Types Properly

```typescript
// ✅ GOOD: Absolute imports with @/ alias
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";

// ❌ BAD: Relative imports
import { Button } from "../../../components/ui/button";
```

#### ✅ DO: Use Zod for Validation

```typescript
import { z } from "zod";

const userSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(2)
});

type User = z.infer<typeof userSchema>;
```

### React Component Standards

#### ✅ DO: Use Server Components by Default

```typescript
// ✅ GOOD: Server Component (default)
export const HomePage = async () => {
  const data = await fetchData();
  return <div>{data.title}</div>;
};

// Only use Client Component when needed
"use client"
export const InteractiveButton = () => {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(count + 1)}>Click: {count}</button>;
};
```

#### ✅ DO: Follow Feature-Based Architecture

```
components/
├── features/
│   ├── assistant/          # AI assistant feature
│   │   ├── chat-input.tsx
│   │   ├── message-list.tsx
│   │   └── index.ts
│   ├── dashboard/          # Dashboard feature
│   │   ├── stats-card.tsx
│   │   └── recent-activity.tsx
├── shared/                 # Shared across features
│   ├── main-nav.tsx
│   └── user-avatar.tsx
└── ui/                     # shadcn/ui primitives
    ├── button.tsx
    └── card.tsx
```

#### ✅ DO: Use Proper Naming Conventions

```typescript
// File names: kebab-case
// user-profile.tsx ✅
// UserProfile.tsx ❌

// Component names: PascalCase
export const UserProfile = () => { }  // ✅
export const userProfile = () => { }  // ❌

// Functions: camelCase
const fetchUserData = () => { }  // ✅
const FetchUserData = () => { }  // ❌

// Constants: UPPER_SNAKE_CASE
const API_BASE_URL = "https://api.example.com";  // ✅
const apiBaseUrl = "https://api.example.com";    // ❌
```

### Styling Standards

#### ✅ DO: Use Tailwind + shadcn Design Tokens

```tsx
// ✅ GOOD: Use design tokens
<div className="bg-background text-foreground border border-border">
  <p className="text-muted-foreground">Muted text</p>
</div>

// ❌ BAD: Hardcoded colors
<div className="bg-white text-black border border-gray-300">
  <p className="text-gray-500">Muted text</p>
</div>
```

#### ✅ DO: Use the `cn()` Utility

```tsx
import { cn } from "@/lib/utils/cn";

// ✅ GOOD: Using cn() for conditional classes
<button 
  className={cn(
    "px-4 py-2 rounded-md transition-colors",
    isActive ? "bg-primary text-primary-foreground" : "bg-muted",
    disabled && "opacity-50 cursor-not-allowed"
  )}
>
  Click me
</button>

// ❌ BAD: String concatenation
<button className={`px-4 py-2 ${isActive ? 'bg-blue-500' : 'bg-gray-200'}`}>
```

---

## Git Workflow

### Branch Naming Convention

```bash
# Feature branches
feature/user-authentication
feature/ai-chat-integration

# Bug fixes
fix/login-redirect-issue
fix/mobile-menu-bug

# Documentation
docs/update-readme
docs/api-documentation

# Refactoring
refactor/component-structure
refactor/database-queries

# Performance improvements
perf/optimize-images
perf/reduce-bundle-size
```

### Commit Message Convention

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```bash
# Format
<type>(<scope>): <description>

# Types
feat:     # New feature
fix:      # Bug fix
docs:     # Documentation changes
style:    # Code style changes (formatting, no logic change)
refactor: # Code refactoring
perf:     # Performance improvements
test:     # Adding or updating tests
chore:    # Build process or auxiliary tool changes

# Examples
feat(auth): add social login with Google
fix(dashboard): resolve data loading race condition
docs(readme): update installation instructions
refactor(components): migrate to feature-based structure
perf(images): implement lazy loading and optimization
```

### Pull Request Process

1. **Create descriptive PR title**
   ```
   feat: Add AI-powered chat assistant
   ```

2. **Fill out PR description**
   ```markdown
   ## What does this PR do?
   Implements AI chat assistant with streaming responses
   
   ## Changes
   - Added ChatAssistant component
   - Integrated OpenAI API
   - Added streaming message support
   
   ## Testing
   - [x] Tested on Chrome
   - [x] Tested on Firefox
   - [x] Mobile responsive
   
   ## Screenshots
   (Add screenshots if UI changes)
   ```

3. **Request review**
4. **Address feedback**
5. **Merge after approval**

---

## Testing

### Manual Testing Checklist

Before submitting a PR, verify:

- [ ] **Functionality Works**
  - Core feature works as expected
  - No console errors
  - No TypeScript errors

- [ ] **Responsiveness**
  - Mobile (320px - 767px)
  - Tablet (768px - 1023px)
  - Desktop (1024px+)

- [ ] **Browser Compatibility**
  - Chrome/Edge (latest)
  - Firefox (latest)
  - Safari (latest)

- [ ] **Accessibility**
  - Keyboard navigation works
  - Screen reader friendly
  - Proper ARIA labels

- [ ] **Performance**
  - No unnecessary re-renders
  - Images are optimized
  - Bundle size impact is minimal

### Testing in Multiple Browsers

```bash
# Test on different devices using network URL
npm run dev
# Access via http://192.168.x.x:3000 on other devices
```

---

## Debugging

### Next.js Debugging

#### Browser DevTools

1. **Open DevTools** (F12)
2. **Check Console** for errors
3. **Use React DevTools** extension
4. **Network Tab** for API calls
5. **Performance Tab** for rendering issues

#### VS Code Debugging

Create `.vscode/launch.json`:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    },
    {
      "name": "Next.js: debug client-side",
      "type": "chrome",
      "request": "launch",
      "url": "http://localhost:3000"
    }
  ]
}
```

### Common Debugging Scenarios

#### Issue: Component not updating

```typescript
// Check if you're mutating state directly
// ❌ BAD
const [user, setUser] = useState({ name: "John" });
user.name = "Jane";  // Mutation!

// ✅ GOOD
setUser({ ...user, name: "Jane" });
```

#### Issue: Infinite re-renders

```typescript
// ❌ BAD: Function called on every render
<Component onUpdate={fetchData()} />

// ✅ GOOD: Pass function reference
<Component onUpdate={fetchData} />

// ✅ GOOD: Use callback
<Component onUpdate={() => fetchData()} />
```

#### Issue: Hydration mismatch

```typescript
// ❌ BAD: Server and client render differently
const Component = () => {
  return <div>{new Date().toISOString()}</div>;
};

// ✅ GOOD: Use client component for dynamic data
"use client"
const Component = () => {
  const [date, setDate] = useState("");
  
  useEffect(() => {
    setDate(new Date().toISOString());
  }, []);
  
  return <div>{date}</div>;
};
```

---

## Performance Optimization

### Image Optimization

```tsx
import Image from "next/image";

// ✅ GOOD: Use next/image with proper sizing
<Image
  src="/hero.png"
  alt="Hero image"
  width={1200}
  height={600}
  priority  // For above-fold images
/>

// For dynamic images
<Image
  src={user.avatar}
  alt={user.name}
  fill
  className="object-cover"
/>
```

### Code Splitting

```typescript
// ✅ GOOD: Lazy load heavy components
import dynamic from "next/dynamic";

const HeavyComponent = dynamic(() => import("@/components/features/heavy-component"), {
  loading: () => <div>Loading...</div>,
  ssr: false  // Disable SSR if not needed
});
```

### Debouncing Input

```typescript
import { useDebounce } from "@/hooks/use-debounce";

const SearchComponent = () => {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);
  
  useEffect(() => {
    // API call with debounced value
    fetchResults(debouncedSearch);
  }, [debouncedSearch]);
};
```

---

## Common Tasks

### Adding a New Page

```bash
# Create page file
touch app/(auth)/dashboard/new-page/page.tsx
```

```typescript
// app/(auth)/dashboard/new-page/page.tsx
export default async function NewPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold">New Page</h1>
    </div>
  );
}
```

### Adding a New Component

```bash
# Create component file
mkdir -p components/features/my-feature
touch components/features/my-feature/my-component.tsx
```

```typescript
// components/features/my-feature/my-component.tsx
interface MyComponentProps {
  title: string;
}

export const MyComponent = ({ title }: MyComponentProps) => {
  return <div>{title}</div>;
};
```

### Adding a New API Route

```bash
# Create API route
mkdir -p app/api/my-endpoint
touch app/api/my-endpoint/route.ts
```

```typescript
// app/api/my-endpoint/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const data = { message: "Hello from API" };
  return NextResponse.json(data);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  // Process data
  return NextResponse.json({ success: true });
}
```

### Working with Supabase

```typescript
// Client Component
"use client"
import { createBrowserClient } from "@/lib/supabase/client";

const MyComponent = () => {
  const supabase = createBrowserClient();
  
  const fetchData = async () => {
    const { data, error } = await supabase
      .from("table_name")
      .select("*");
    
    if (error) console.error(error);
    return data;
  };
};

// Server Component
import { createServerClient } from "@/lib/supabase/server";

const MyServerComponent = async () => {
  const supabase = createServerClient();
  
  const { data, error } = await supabase
    .from("table_name")
    .select("*");
    
  if (error) throw error;
  
  return <div>{/* Render data */}</div>;
};
```

---

## Best Practices Summary

### DO's ✅

- Use TypeScript strictly (no `any` types)
- Follow the feature-based architecture
- Use Server Components by default
- Implement proper error handling
- Write descriptive commit messages
- Test on multiple browsers/devices
- Optimize images with `next/image`
- Use design tokens from theme
- Keep components small and focused
- Document complex logic with comments

### DON'Ts ❌

- Don't commit `.env.local` or secrets
- Don't use relative imports (use `@/` alias)
- Don't skip TypeScript errors with `@ts-ignore`
- Don't install packages without approval
- Don't mutate state directly
- Don't hardcode URLs or API keys
- Don't mix styling approaches (stick to Tailwind)
- Don't create overly large components (>200 lines)

---

## Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Supabase Guides](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)

---

**Need help?** Check the [Installation Guide](./INSTALLATION.md) or [Architecture Guide](./ARCHITECTURE.md).

[← Back to README](../README.md) | [Architecture Guide →](./ARCHITECTURE.md)
