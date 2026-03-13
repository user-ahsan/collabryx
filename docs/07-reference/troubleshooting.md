# Troubleshooting

Common issues and solutions for Collabryx development.

---

## Table of Contents

- [Installation Issues](#installation-issues)
- [Development Issues](#development-issues)
- [Database Issues](#database-issues)
- [Authentication Issues](#authentication-issues)
- [Build Issues](#build-issues)

---

## Installation Issues

### Issue: npm install fails

**Symptoms:**
```
npm ERR! peer dependency error
```

**Solutions:**
```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and lock file
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

### Issue: Port 3000 already in use

**Symptoms:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solutions:**
```bash
# Windows - Kill process
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

---

## Development Issues

### Issue: TypeScript errors

**Symptoms:**
```
Type error: Cannot find module '@/components/...'
```

**Solutions:**
```bash
# Clear Next.js cache
rm -rf .next

# Restart TypeScript server
# VS Code: Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Rebuild
npm run dev
```

---

### Issue: Module not found

**Symptoms:**
```
Module not found: Can't resolve 'module-name'
```

**Solutions:**
```bash
# Reinstall dependencies
npm install

# Check package.json
cat package.json | grep "module-name"
```

---

## Database Issues

### Issue: Supabase connection errors

**Symptoms:**
```
Error: Invalid Supabase URL
```

**Solutions:**
1. Verify `.env.local` exists
2. Check environment variables (no extra spaces)
3. Restart development server
4. Verify Supabase project is running

---

### Issue: Row Level Security blocking queries

**Symptoms:**
```
Error: new row violates row-level security policy
```

**Solutions:**
```sql
-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Temporarily disable for testing (development only!)
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Fix policy
CREATE POLICY "Allow all access" ON profiles
  FOR ALL USING (true);
```

---

## Authentication Issues

### Issue: User can't sign in

**Symptoms:**
- Login form submits but no redirect
- No error message shown

**Solutions:**
1. Check Supabase auth settings
2. Verify email confirmation settings
3. Check browser console for errors
4. Verify RLS policies allow profile creation

---

### Issue: Session expires immediately

**Symptoms:**
- User logs in successfully
- Session expires on page refresh

**Solutions:**
```typescript
// Check middleware is handling cookies
// Verify cookie settings in supabase client
cookies: {
  getAll() { ... },
  setAll(cookiesToSet) { ... }
}
```

---

## Build Issues

### Issue: Build fails with type errors

**Symptoms:**
```
Type error TS2345: Argument of type 'X' is not assignable...
```

**Solutions:**
```bash
# Check for type errors
npm run typecheck

# Fix TypeScript errors
# Common issues:
# - Missing type definitions
# - Incorrect generic types
# - Missing null checks
```

---

### Issue: Build succeeds but page is blank

**Symptoms:**
- `npm run build` completes
- Production page is white/blank

**Solutions:**
1. Check browser console for errors
2. Verify environment variables in production
3. Check for client-only code in Server Components
4. Verify all imports are correct

---

## Performance Issues

### Issue: Slow page loads

**Solutions:**
1. Check bundle size: `npm run build:analyze`
2. Optimize images with `next/image`
3. Implement lazy loading
4. Check database query performance

---

### Issue: Too many re-renders

**Solutions:**
```typescript
// Use React.memo for components
export const MyComponent = memo(({ data }) => { ... })

// Use useCallback for functions
const handleClick = useCallback(() => { ... }, [])

// Use useMemo for expensive calculations
const result = useMemo(() => expensive(data), [data])
```

---

## Getting Help

If your issue isn't listed here:

1. **Check Documentation**: [docs/](../README.md)
2. **Search Issues**: [GitHub Issues](https://github.com/your-username/collabryx/issues)
3. **Ask in Discussions**: [GitHub Discussions](https://github.com/your-username/collabryx/discussions)

---

**Last Updated**: 2026-03-14

[← Back to Docs](./README.md)
