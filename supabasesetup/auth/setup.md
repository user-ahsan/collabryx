# Supabase Auth Setup Guide — Collabryx

> Self-hosted Supabase instance at `https://supabase-studio.ahsanali.cc/project/default`

---

## 1. Self-Hosted Supabase Configuration

### What You Need From Your Supabase Instance

Your self-hosted Supabase runs several services behind a Kong API gateway. You need **two URLs**:

| Item | What It Is | Where to Find It |
|------|-----------|-------------------|
| **Supabase URL** | The Kong gateway endpoint your frontend talks to | Your reverse proxy / docker-compose config (NOT the `127.0.0.1:54321` shown in Studio) |
| **Anon Key** | Public JWT key for browser-side auth | Studio → Connect modal → API Keys tab |
| **Service Role Key** | Admin key (server-side ONLY, never expose) | Your `.env` file on the Supabase server |

### Finding Your External Supabase URL

Since Studio shows `127.0.0.1:54321` (internal Docker address), your **actual external URL** is whatever domain/subdomain points to the Kong gateway.

Common patterns:
- `https://supabase-api.ahsanali.cc` (if you set up a subdomain)
- `https://ahsanali.cc:8443` (if using a port)

**Check your reverse proxy (Nginx/Caddy/Traefik) config** to find which domain maps to port `8000` (Kong gateway).

> [!IMPORTANT]
> The URL must end WITHOUT a trailing slash. Example: `https://supabase-api.ahsanali.cc`

### Credentials Found From Studio

```
Anon Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0
```

> [!WARNING]
> The JWT issuer is `supabase-demo` — this is the default demo configuration. For production, you should regenerate keys with a custom JWT secret in your `docker-compose.yml` or `.env` file on the server.

---

## 2. Auth Provider Setup (Server-Side)

Since the Studio UI for providers was not loading (common in self-hosted setups), configure auth via your **server's `.env`** or `docker-compose.yml`:

### Email/Password Auth (Enabled by Default)

Email/password is enabled by default in self-hosted Supabase. No extra config needed.

To **disable email confirmation** during development, set in your Supabase server env:

```env
GOTRUE_MAILER_AUTOCONFIRM=true
```

Or in `docker-compose.yml` under the `auth` service:

```yaml
auth:
  environment:
    GOTRUE_MAILER_AUTOCONFIRM: "true"
```

### Google OAuth (Optional)

```env
GOTRUE_EXTERNAL_GOOGLE_ENABLED=true
GOTRUE_EXTERNAL_GOOGLE_CLIENT_ID=your-google-client-id
GOTRUE_EXTERNAL_GOOGLE_SECRET=your-google-client-secret
GOTRUE_EXTERNAL_GOOGLE_REDIRECT_URI=https://your-supabase-url/auth/v1/callback
```

### GitHub OAuth (Optional)

```env
GOTRUE_EXTERNAL_GITHUB_ENABLED=true
GOTRUE_EXTERNAL_GITHUB_CLIENT_ID=your-github-client-id
GOTRUE_EXTERNAL_GITHUB_SECRET=your-github-client-secret
GOTRUE_EXTERNAL_GITHUB_REDIRECT_URI=https://your-supabase-url/auth/v1/callback
```

### Apple OAuth (Optional)

```env
GOTRUE_EXTERNAL_APPLE_ENABLED=true
GOTRUE_EXTERNAL_APPLE_CLIENT_ID=your-apple-service-id
GOTRUE_EXTERNAL_APPLE_SECRET=your-apple-private-key
GOTRUE_EXTERNAL_APPLE_REDIRECT_URI=https://your-supabase-url/auth/v1/callback
```

> [!NOTE]
> After changing env vars, restart the auth container: `docker compose restart auth`

---

## 3. Frontend Environment Variables

Create `.env.local` in the Collabryx project root:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-api-domain.com
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0

# App URL (for OAuth redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> Replace `https://your-supabase-api-domain.com` with your actual external Supabase URL.

---

## 4. Package Installation

The project already has `@supabase/supabase-js@2.86.0`. You also need:

```bash
npm install @supabase/ssr
```

---

## 5. File Structure (What Gets Created/Modified)

```
lib/supabase/
├── client.ts          # Browser client (createBrowserClient)
└── server.ts          # Server client (createServerClient)

middleware.ts              # Session refresh on every request

app/api/auth/
└── callback/
    └── route.ts           # OAuth callback handler (MODIFY existing stub)

components/features/auth/
└── unified-auth.tsx       # MODIFY — wire to real Supabase auth

hooks/
└── use-auth.ts            # MODIFY — session state hook
```

---

## 6. Auth Flow Architecture

This is how the current unified-auth UI maps to Supabase:

```
┌─────────────────────────────────────────────────────┐
│                    unified-auth.tsx                   │
│                                                       │
│  Step 1: Email Input                                  │
│    └─ Query: supabase.auth.signInWithOtp({email})    │
│       OR custom RPC to check if user exists          │
│                                                       │
│  Step 2a: Login (existing user)                       │
│    └─ supabase.auth.signInWithPassword({email, pw})  │
│                                                       │
│  Step 2b: Signup (new user)                           │
│    └─ supabase.auth.signUp({email, pw, fullName})    │
│                                                       │
│  Social Login:                                        │
│    └─ supabase.auth.signInWithOAuth({provider})      │
│       → Redirects to /api/auth/callback              │
└─────────────────────────────────────────────────────┘
```

### "Does This Email Exist?" Check

The current frontend has a clever flow: enter email → check if user exists → show login or signup. Supabase doesn't have a direct "check if email exists" API (for security reasons). Two approaches:

**Option A: Always try `signInWithPassword` first (recommended)**
- Skip the email-check step entirely
- If sign-in fails with "Invalid login credentials", show signup
- Simpler, more secure (doesn't leak whether an email is registered)

**Option B: Custom RPC function**
- Create a Supabase Edge Function or database RPC that checks `auth.users`
- Less secure (reveals registered emails) but preserves the current UX flow

> The implementation will use **Option A** adapted to preserve the existing 3-step UI feel.

---

## 7. Redirect Configuration

### Site URL (Supabase Server)

Set the site URL in your Supabase server env to match your frontend:

```env
GOTRUE_SITE_URL=http://localhost:3000
GOTRUE_URI_ALLOW_LIST=http://localhost:3000/**
```

For production, update to your actual domain.

### OAuth Callback URL (Frontend)

The callback route at `/api/auth/callback` handles the code exchange after OAuth sign-in.

---

## 8. Post-Setup Verification Checklist

- [ ] `.env.local` has correct `NEXT_PUBLIC_SUPABASE_URL` (external, not `127.0.0.1`)
- [ ] `.env.local` has correct `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `@supabase/ssr` installed
- [ ] Can create a user via the signup form
- [ ] Can sign in with that user
- [ ] Session persists across page refresh
- [ ] Protected routes (`/dashboard`, etc.) redirect to `/login` when not authenticated
- [ ] OAuth buttons work (if providers are configured)

---

## 9. Security Notes

1. **Never expose `SUPABASE_SERVICE_ROLE_KEY`** in frontend code or `NEXT_PUBLIC_` vars
2. Always validate sessions server-side using `supabase.auth.getUser()` (not `getSession()` — getSession reads from cookies which can be tampered with)
3. Set up Row Level Security (RLS) policies on all tables
4. For production: regenerate JWT secret from default demo values
5. Enable email confirmation for production (`GOTRUE_MAILER_AUTOCONFIRM=false`)
