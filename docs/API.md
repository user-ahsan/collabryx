# 📡 API Documentation

Complete API reference for Collabryx backend services.

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [API Routes](#api-routes)
- [Server Actions](#server-actions)
- [Supabase Database](#supabase-database)
- [Edge Functions](#edge-functions)
- [Error Handling](#error-handling)
- [Rate Limiting](#rate-limiting)

---

## Overview

Collabryx uses a hybrid API approach:

1. **Next.js API Routes** - `/app/api/*` for custom endpoints
2. **Server Actions** - Server-side functions called from components
3. **Supabase Client** - Direct database access with RLS
4. **Edge Functions** - Deno-based serverless functions

### Base URL

```
Development: http://localhost:3000
Production:  https://yourdomain.com
```

### Response Format

All API responses follow this structure:

```typescript
// Success
{
  "success": true,
  "data": { /* response data */ }
}

// Error
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

---

## Authentication

All authenticated endpoints require a valid session.

### Session Management

#### Client-Side

```typescript
import { createBrowserClient } from "@/lib/supabase/client";

const supabase = createBrowserClient();

// Get current session
const { data: { session } } = await supabase.auth.getSession();

// Get current user
const { data: { user } } = await supabase.auth.getUser();
```

#### Server-Side

```typescript
import { createServerClient } from "@/lib/supabase/server";

const supabase = createServerClient();

// Get session
const { data: { session } } = await supabase.auth.getSession();

// Get user
const { data: { user } } = await supabase.auth.getUser();
```

### Authentication Headers

For API routes that require authentication:

```typescript
// Automatic via Supabase client
// No manual headers needed
```

---

## API Routes

### Auth Endpoints

#### `POST /api/auth/sign-up`

Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com"
    }
  }
}
```

**Errors:**
- `400` - Invalid input
- `409` - Email already exists

---

#### `POST /api/auth/sign-in`

Sign in with email and password.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "session": { /* session object */ },
    "user": { /* user object */ }
  }
}
```

**Errors:**
- `400` - Invalid credentials
- `401` - Unauthorized

---

#### `POST /api/auth/sign-out`

Sign out the current user.

**Request:** No body required

**Response:**
```json
{
  "success": true
}
```

---

### User Endpoints

#### `GET /api/user/profile`

Get current user's profile.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "avatar_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

---

#### `PATCH /api/user/profile`

Update user profile.

**Authentication:** Required

**Request:**
```json
{
  "name": "Jane Doe",
  "avatar_url": "https://..."
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Jane Doe",
    "avatar_url": "https://..."
  }
}
```

---

### Project Endpoints

#### `GET /api/projects`

Get all projects for the current user.

**Authentication:** Required

**Query Parameters:**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)

**Response:**
```json
{
  "success": true,
  "data": {
    "projects": [
      {
        "id": "uuid",
        "name": "Project Name",
        "description": "Project description",
        "created_at": "2024-01-01T00:00:00Z",
        "updated_at": "2024-01-02T00:00:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 25,
      "pages": 3
    }
  }
}
```

---

#### `POST /api/projects`

Create a new project.

**Authentication:** Required

**Request:**
```json
{
  "name": "New Project",
  "description": "Project description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "New Project",
    "description": "Project description",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `400` - Validation error
- `401` - Unauthorized

---

#### `GET /api/projects/:id`

Get a specific project by ID.

**Authentication:** Required

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Project Name",
    "description": "Description",
    "members": [
      {
        "user_id": "uuid",
        "name": "User Name",
        "role": "owner"
      }
    ],
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

**Errors:**
- `404` - Project not found
- `403` - Access denied

---

#### `PATCH /api/projects/:id`

Update a project.

**Authentication:** Required

**Request:**
```json
{
  "name": "Updated Name",
  "description": "Updated description"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "name": "Updated Name",
    "description": "Updated description"
  }
}
```

---

#### `DELETE /api/projects/:id`

Delete a project.

**Authentication:** Required

**Response:**
```json
{
  "success": true
}
```

**Errors:**
- `403` - Not project owner
- `404` - Project not found

---

## Server Actions

Server Actions are server-side functions that can be called directly from components.

### Usage

```typescript
// app/actions/projects.ts
"use server"

import { revalidatePath } from "next/cache";
import { createServerClient } from "@/lib/supabase/server";

export async function createProject(formData: FormData) {
  const supabase = createServerClient();
  
  // Get user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");
  
  // Validate input
  const name = formData.get("name") as string;
  if (!name) throw new Error("Name is required");
  
  // Create project
  const { data, error } = await supabase
    .from("projects")
    .insert({ name, user_id: user.id })
    .select()
    .single();
    
  if (error) throw error;
  
  // Revalidate cache
  revalidatePath("/dashboard");
  
  return { success: true, data };
}
```

### Calling from Component

```typescript
"use client"

import { createProject } from "@/app/actions/projects";

export function CreateProjectForm() {
  async function handleSubmit(formData: FormData) {
    const result = await createProject(formData);
    if (result.success) {
      // Handle success
    }
  }
  
  return (
    <form action={handleSubmit}>
      <input name="name" required />
      <button type="submit">Create</button>
    </form>
  );
}
```

---

## Supabase Database

### Direct Database Access

```typescript
import { createServerClient } from "@/lib/supabase/server";

const supabase = createServerClient();

// Select
const { data, error } = await supabase
  .from("table_name")
  .select("*")
  .eq("user_id", userId);

// Insert
const { data, error } = await supabase
  .from("table_name")
  .insert({ column: "value" });

// Update
const { data, error } = await supabase
  .from("table_name")
  .update({ column: "new_value" })
  .eq("id", id);

// Delete
const { data, error } = await supabase
  .from("table_name")
  .delete()
  .eq("id", id);
```

### Tables

#### `users`
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### `projects`
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row Level Security (RLS)

All tables have RLS enabled:

```sql
-- Users can only access their own data
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id);

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own projects"
  ON projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create projects"
  ON projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects"
  ON projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects"
  ON projects FOR DELETE
  USING (auth.uid() = user_id);
```

---

## Edge Functions

Edge Functions are deployed to Supabase and run on the edge.

### Location
`supabase/functions/`

### Example: AI Chat Function

```typescript
// supabase/functions/ai-chat/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {
  try {
    const { message } = await req.json();
    
    // Process with AI
    const response = await processAIChat(message);
    
    return new Response(
      JSON.stringify({ success: true, data: response }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
```

### Calling Edge Functions

```typescript
const supabase = createBrowserClient();

const { data, error } = await supabase.functions.invoke("ai-chat", {
  body: { message: "Hello, AI!" }
});
```

---

## Error Handling

### Standard Error Codes

| Code | Description |
|------|-------------|
| `400` | Bad Request - Invalid input |
| `401` | Unauthorized - Authentication required |
| `403` | Forbidden - Insufficient permissions |
| `404` | Not Found - Resource doesn't exist |
| `409` | Conflict - Resource already exists |
| `422` | Unprocessable Entity - Validation error |
| `429` | Too Many Requests - Rate limit exceeded |
| `500` | Internal Server Error |

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid email format",
    "details": {
      "field": "email",
      "value": "invalid-email"
    }
  }
}
```

### Client-Side Error Handling

```typescript
try {
  const response = await fetch("/api/endpoint");
  const data = await response.json();
  
  if (!data.success) {
    // Handle error
    console.error(data.error.message);
    toast.error(data.error.message);
  } else {
    // Handle success
    console.log(data.data);
  }
} catch (error) {
  console.error("Network error:", error);
  toast.error("An unexpected error occurred");
}
```

---

## Rate Limiting

### Default Limits

- **API Routes**: 100 requests per minute per IP
- **Authentication**: 5 login attempts per 15 minutes
- **Edge Functions**: 60 requests per minute

### Rate Limit Headers

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

### Handling Rate Limits

```typescript
if (response.status === 429) {
  const resetTime = response.headers.get("X-RateLimit-Reset");
  const waitTime = parseInt(resetTime) - Date.now();
  console.log(`Rate limited. Retry after ${waitTime}ms`);
}
```

---

## Webhooks

### Supabase Database Webhooks

Configure webhooks in Supabase Dashboard for:
- New user registration
- Project creation
- Data changes

### Verifying Webhook Signatures

```typescript
import { createHmac } from "crypto";

function verifyWebhook(payload: string, signature: string, secret: string) {
  const hmac = createHmac("sha256", secret);
  const digest = hmac.update(payload).digest("hex");
  return digest === signature;
}
```

---

## Best Practices

### 1. Always Validate Input

```typescript
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  name: z.string().min(2)
});

const validated = schema.parse(input);
```

### 2. Use Server Actions for Mutations

Prefer Server Actions over API routes for data mutations when possible.

### 3. Implement Error Boundaries

```typescript
try {
  // API call
} catch (error) {
  // Log error
  // Show user-friendly message
  // Send to error tracking (Sentry)
}
```

### 4. Cache Appropriately

```typescript
// Use React Query for caching
const { data } = useQuery({
  queryKey: ["projects"],
  queryFn: fetchProjects,
  staleTime: 5 * 60 * 1000, // 5 minutes
});
```

---

## Additional Resources

- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Need help?** Check other docs or open an issue on GitHub.

[← Back to README](../README.md) | [Installation Guide →](./INSTALLATION.md)
