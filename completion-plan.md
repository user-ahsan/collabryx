# 🚀 COLLABRYX BACKEND ARCHITECTURE COMPLETION PLAN

## Dual-Environment Backend with Production Render + Local Docker

**Version:** 1.0.0  
**Created:** 2026-03-15  
**Status:** Ready for Implementation  
**Estimated Timeline:** 7 Days  

---

## 🎯 EXECUTIVE SUMMARY

### Architecture Decision

| Environment | Backend | Purpose |
|-------------|---------|---------|
| **Production** (Vercel deployment) | Render-deployed Python worker | Live user traffic |
| **Local Development** (`npm run dev`) | Docker-deployed Python worker | Development & testing |
| **Fallback** (always available) | Supabase Edge Function | Backup if backend unavailable |
| **Data Loading** | React Query on login | Smart matches + feed fetched on login |

### Key Features

- ✅ **Concurrent backend detection** - No manual switching required
- ✅ **Developer-friendly error messages** - Clear terminal output if Docker not running
- ✅ **Production-ready with health checks** - Automatic failover logic
- ✅ **Preserves existing infrastructure** - Queue processors, DLQ, rate limiting kept intact
- ✅ **Minimal code changes** - Leverages existing services and hooks

---

## 📁 FILE STRUCTURE CHANGES

### NEW FILES TO CREATE

```
collabryx/
├── lib/
│   ├── config/
│   │   └── backend.ts              # Backend URL resolver with health checks
│   ├── actions/
│   │   ├── ai-mentor.ts            # AI Mentor server actions (NEW)
│   │   └── index.ts                # Server actions barrel export
│   └── utils/
│       └── detect-docker.ts        # Docker container detection utility
├── app/
│   └── api/
│       └── embeddings/
│           └── generate/
│               └── route.ts        # UPDATE: Add backend health routing
├── components/
│   └── features/
│       └── assistant/
│           ├── chat-input.tsx      # UPDATE: Connect to real API
│           └── chat-list.tsx       # UPDATE: Load real sessions
├── scripts/
│   ├── check-docker.mjs            # Pre-dev Docker check script
│   └── seed-ai-sessions.ts         # Sample AI mentor data
├── python-worker/
│   └── main.py                     # KEEP AS-IS (don't remove features)
├── render.yaml                     # NEW: Render deployment config
├── docker-compose.dev.yml          # NEW: Local dev orchestration
└── .env                            # UPDATE: Add new variables
```

---

## 🔧 PHASE 0: INFRASTRUCTURE SETUP (Day 0)

### Step 0.1: Add Missing Dependencies

**File:** `package.json`

```json
{
  "dependencies": {
    "openai": "^4.28.0",
    "zod": "^3.22.4"
  },
  "scripts": {
    "dev": "node scripts/check-docker.mjs && next dev",
    "dev:skip-docker": "next dev",
    "docker:up": "cd python-worker && docker-compose up -d",
    "docker:down": "cd python-worker && docker-compose down",
    "docker:logs": "cd python-worker && docker-compose logs -f",
    "docker:health": "curl http://localhost:8000/health"
  }
}
```

**Action:** Run `npm install` after updating package.json

---

### Step 0.2: Environment Variables

**File:** `.env`

```env
# ===========================================
# BACKEND CONFIGURATION
# ===========================================
# Backend mode: 'auto' | 'docker' | 'render' | 'edge-only'
# - auto: Detect based on VERCEL env var
# - docker: Force local Docker (for local dev)
# - render: Force Render backend (for testing prod config)
# - edge-only: Skip backend, use Edge Function only
BACKEND_MODE=auto

# Render backend URL (production)
BACKEND_URL_RENDER=https://collabryx-backend.onrender.com

# Local Docker backend URL
BACKEND_URL_DOCKER=http://localhost:8000

# Fallback: Use Edge Function if backend unavailable
BACKEND_FALLBACK=edge

# ===========================================
# EXISTING VARIABLES (keep these)
# ===========================================
NEXT_PUBLIC_SUPABASE_URL=https://supabase.ahsanali.cc
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
NEXT_PUBLIC_APP_URL=http://localhost:3000
PYTHON_WORKER_URL=http://localhost:8000
ALLOWED_ORIGINS=http://localhost:3000,https://collabryx.vercel.app

# ===========================================
# AI MENTOR (NEW)
# ===========================================
# Choose ONE provider:
OPENAI_API_KEY=sk-...                  # For GPT-4 Turbo
# ANTHROPIC_API_KEY=sk-ant-...         # For Claude 3 Haiku
LLM_PROVIDER=openai                    # or 'anthropic'
```

---

### Step 0.3: Backend Configuration Module

**File:** `lib/config/backend.ts`

```typescript
/**
 * Backend Configuration
 * Automatically resolves backend URL based on deployment environment
 */

export type BackendMode = 'auto' | 'docker' | 'render' | 'edge-only'

export interface BackendConfig {
  endpoint: string | null  // null = use Edge Function
  mode: BackendMode
  isHealthy: boolean
  healthCheck?: () => Promise<boolean>
}

/**
 * Get backend configuration
 * 
 * Resolution order:
 * 1. If BACKEND_MODE='edge-only' → return null (use Edge Function)
 * 2. If running on Vercel → use Render backend
 * 3. If BACKEND_MODE='docker' → use Docker backend
 * 4. If BACKEND_MODE='render' → use Render backend
 * 5. Auto-detect: try Docker health check, fallback to Edge Function
 */
export async function getBackendConfig(): Promise<BackendConfig> {
  const mode = process.env.BACKEND_MODE as BackendMode || 'auto'
  
  // Case 1: Edge-only mode (no backend)
  if (mode === 'edge-only') {
    return {
      endpoint: null,
      mode: 'edge-only',
      isHealthy: true,
    }
  }
  
  // Case 2: Running on Vercel (production)
  if (process.env.VERCEL) {
    const renderUrl = process.env.BACKEND_URL_RENDER
    if (!renderUrl) {
      console.warn('⚠️ Vercel deployment detected but BACKEND_URL_RENDER not set')
      console.warn('⚠️ Falling back to Edge Function')
      return {
        endpoint: null,
        mode: 'edge-only',
        isHealthy: false,
      }
    }
    
    // Health check for Render backend
    const isHealthy = await checkHealth(renderUrl)
    
    return {
      endpoint: renderUrl,
      mode: 'render',
      isHealthy,
      healthCheck: () => checkHealth(renderUrl),
    }
  }
  
  // Case 3: Force Docker mode (local dev)
  if (mode === 'docker') {
    const dockerUrl = process.env.BACKEND_URL_DOCKER || 'http://localhost:8000'
    const isHealthy = await checkHealth(dockerUrl)
    
    if (!isHealthy) {
      console.error('❌ Docker backend not responding at', dockerUrl)
      console.error('❌ Run: npm run docker:up')
      console.error('❌ Falling back to Edge Function')
    }
    
    return {
      endpoint: isHealthy ? dockerUrl : null,
      mode: isHealthy ? 'docker' : 'edge-only',
      isHealthy,
      healthCheck: () => checkHealth(dockerUrl),
    }
  }
  
  // Case 4: Force Render mode (testing prod config locally)
  if (mode === 'render') {
    const renderUrl = process.env.BACKEND_URL_RENDER
    if (!renderUrl) {
      throw new Error('BACKEND_MODE=render but BACKEND_URL_RENDER not set')
    }
    
    const isHealthy = await checkHealth(renderUrl)
    
    return {
      endpoint: renderUrl,
      mode: 'render',
      isHealthy,
      healthCheck: () => checkHealth(renderUrl),
    }
  }
  
  // Case 5: Auto-detect (default)
  // Try Docker first, fallback to Edge Function
  const dockerUrl = process.env.BACKEND_URL_DOCKER || 'http://localhost:8000'
  
  try {
    const isHealthy = await checkHealth(dockerUrl, 2000) // 2s timeout
    
    return {
      endpoint: dockerUrl,
      mode: 'docker',
      isHealthy,
      healthCheck: () => checkHealth(dockerUrl),
    }
  } catch (error) {
    console.log('⚠️ Docker backend not available, using Edge Function fallback')
    console.log('💡 Tip: Run "npm run docker:up" to start local backend')
    
    return {
      endpoint: null,
      mode: 'edge-only',
      isHealthy: false,
    }
  }
}

/**
 * Check backend health with timeout
 */
async function checkHealth(url: string, timeoutMs = 5000): Promise<boolean> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs)
    
    const response = await fetch(`${url}/health`, {
      signal: controller.signal,
      method: 'GET',
    })
    
    clearTimeout(timeoutId)
    
    if (!response.ok) return false
    
    const data = await response.json()
    return data.status === 'healthy'
  } catch (error) {
    return false
  }
}

/**
 * Get backend URL for API calls
 * Returns null if Edge Function should be used
 */
export async function getBackendUrl(): Promise<string | null> {
  const config = await getBackendConfig()
  return config.endpoint
}

/**
 * Middleware: Check backend health before route execution
 * Usage: wrap API route handlers with this
 */
export async function withBackendHealth<T>(
  handler: () => Promise<T>,
  fallbackHandler: () => Promise<T>
): Promise<T> {
  const config = await getBackendConfig()
  
  if (!config.isHealthy) {
    console.warn('⚠️ Backend unhealthy, using fallback')
    return fallbackHandler()
  }
  
  try {
    return await handler()
  } catch (error) {
    console.error('Backend error, falling back:', error)
    return fallbackHandler()
  }
}
```

---

### Step 0.4: Pre-Dev Docker Check Script

**File:** `scripts/check-docker.mjs`

```javascript
#!/usr/bin/env node

/**
 * Pre-dev Docker backend check
 * Runs before `npm run dev` when BACKEND_MODE=auto or 'docker'
 */

import { stdout, stderr } from 'process'

const DOCKER_URL = process.env.BACKEND_URL_DOCKER || 'http://localhost:8000'
const HEALTH_ENDPOINT = `${DOCKER_URL}/health`
const TIMEOUT_MS = 3000

async function checkHealth() {
  return new Promise((resolve) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)
    
    fetch(HEALTH_ENDPOINT, {
      signal: controller.signal,
      method: 'GET',
    })
      .then((res) => res.json())
      .then((data) => {
        clearTimeout(timeoutId)
        resolve(data.status === 'healthy')
      })
      .catch(() => {
        clearTimeout(timeoutId)
        resolve(false)
      })
  })
}

async function main() {
  const mode = process.env.BACKEND_MODE || 'auto'
  
  // Skip check if edge-only mode
  if (mode === 'edge-only') {
    stdout.write('✅ Edge-only mode: Skipping Docker check\n')
    return
  }
  
  // Skip check if running on Vercel
  if (process.env.VERCEL) {
    stdout.write('✅ Vercel deployment: Using Render backend\n')
    return
  }
  
  stdout.write('🔍 Checking Docker backend health...\n')
  
  const isHealthy = await checkHealth()
  
  if (isHealthy) {
    stdout.write('✅ Docker backend is healthy at ' + DOCKER_URL + '\n')
    stdout.write('🚀 Starting Next.js dev server...\n')
  } else {
    stderr.write('\n')
    stderr.write('⚠️  ┌─────────────────────────────────────────────────────────┐\n')
    stderr.write('⚠️  │  Docker backend not responding                          │\n')
    stderr.write('⚠️  └─────────────────────────────────────────────────────────┘\n')
    stderr.write('\n')
    stderr.write('📍 Backend URL: ' + DOCKER_URL + '\n')
    stderr.write('\n')
    stderr.write('🔧 Quick fix:\n')
    stderr.write('   1. Start Docker backend:\n')
    stderr.write('      npm run docker:up\n')
    stderr.write('\n')
    stderr.write('   2. Or skip Docker check:\n')
    stderr.write('      npm run dev:skip-docker\n')
    stderr.write('\n')
    stderr.write('   3. Or set edge-only mode:\n')
    stderr.write('      BACKEND_MODE=edge-only npm run dev\n')
    stderr.write('\n')
    stderr.write('💡 The app will still work using Edge Function fallback.\n')
    stderr.write('\n')
    
    // Don't block dev server startup, just warn
    stdout.write('⚠️  Continuing with Edge Function fallback...\n')
  }
}

main().catch((err) => {
  stderr.write('Error in Docker check: ' + err.message + '\n')
  process.exit(1)
})
```

---

### Step 0.5: Render Deployment Config

**File:** `render.yaml`

```yaml
services:
  - type: web
    name: collabryx-backend
    env: docker
    region: oregon
    plan: starter
    dockerfilePath: ./python-worker/Dockerfile
    rootDir: .
    healthCheckPath: /health
    healthCheckTimeout: 10s
    envVars:
      - key: PYTHONUNBUFFERED
        value: 1
      - key: SUPABASE_URL
        sync: false
      - key: SUPABASE_SERVICE_ROLE_KEY
        sync: false
      - key: ALLOWED_ORIGINS
        value: https://collabryx.vercel.app,http://localhost:3000
    disk:
      name: model-cache
      mountPath: /app/model-cache
      sizeGB: 2
```

---

### Step 0.6: Local Dev Docker Orchestration

**File:** `docker-compose.dev.yml`

```yaml
# Local development Docker setup
# Usage: npm run docker:up

services:
  embedding-service:
    build:
      context: ./python-worker
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    environment:
      - PYTHONUNBUFFERED=1
      - SUPABASE_URL=${SUPABASE_URL}
      - SUPABASE_SERVICE_ROLE_KEY=${SUPABASE_SERVICE_ROLE_KEY}
      - ALLOWED_ORIGINS=http://localhost:3000
    volumes:
      - ./python-worker/logs:/app/logs
      - model-cache:/app/model-cache
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 40s
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '1.0'
          memory: 1G

volumes:
  model-cache:
    name: collabryx-model-cache

networks:
  default:
    name: collabryx-network
```

---

## 🚀 PHASE 1: EMBEDDING API ROUTE UPDATE (Day 1)

### Step 1.1: Update Embedding Generation Route

**File:** `app/api/embeddings/generate/route.ts`

**Changes:**

1. **Add import at top:**
```typescript
import { getBackendConfig } from '@/lib/config/backend'
```

2. **Replace lines 202-261** (Python worker try-catch block) with:

```typescript
    // Try backend (Docker or Render) first
    let usedFallback = false
    const backendConfig = await getBackendConfig()
    
    if (backendConfig.endpoint) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout
        
        const workerResponse = await fetch(`${backendConfig.endpoint}/generate-embedding`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            text: semanticText,
            user_id: userId,
            request_id: crypto.randomUUID(),
          }),
          signal: controller.signal,
        })
        
        clearTimeout(timeoutId)
        
        // Handle rate limit response
        if (workerResponse.status === 429) {
          const rateLimitData = await workerResponse.json()
          return NextResponse.json(
            {
              success: false,
              error: "Rate limit exceeded",
              message: rateLimitData.detail?.message || "Maximum 3 embedding requests per hour",
              retry_after: rateLimitData.detail?.retry_after,
              reset_at: rateLimitData.detail?.reset_at,
              remaining: rateLimitData.detail?.remaining
            },
            {
              status: 429,
              headers: {
                'Retry-After': rateLimitData.detail?.retry_after?.toString() || '3600',
                'X-RateLimit-Remaining': rateLimitData.detail?.remaining?.toString() || '0',
                'X-RateLimit-Reset': rateLimitData.detail?.reset_at || ''
              }
            }
          )
        }
        
        if (!workerResponse.ok) {
          throw new Error(`Backend error: ${workerResponse.status}`)
        }
        
        // Return queued response immediately!
        return NextResponse.json({
          success: true,
          message: "Your profile is being analyzed. Vector embedding is queued!",
          data: { user_id: userId, status: "queued", backend: backendConfig.mode },
        })
        
      } catch (workerError) {
        console.log("Backend unavailable, using Edge Function fallback:", workerError)
        usedFallback = true
      }
    } else {
      console.log("Using Edge Function (backend mode: edge-only)")
      usedFallback = true
    }

    // Fallback: Call Supabase Edge Function
    if (usedFallback) {
      // ... existing Edge Function code (lines 264-298)
    }
```

---

## 🤖 PHASE 2: AI MENTOR IMPLEMENTATION (Days 2-3)

### Step 2.1: Add OpenAI Dependency

**File:** `package.json`

```json
{
  "dependencies": {
    "openai": "^4.28.0"
  }
}
```

**Action:** Run `npm install`

---

### Step 2.2: Create AI Mentor Server Actions

**File:** `lib/actions/ai-mentor.ts`

```typescript
'use server'

import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Alternative: Anthropic Claude (uncomment if using Claude)
// import Anthropic from '@anthropic-ai/sdk'
// const anthropic = new Anthropic({
//   apiKey: process.env.ANTHROPIC_API_KEY,
// })

// Validation schemas
const CreateSessionSchema = z.object({
  title: z.string().optional(),
})

const SendMessageSchema = z.object({
  sessionId: z.string().uuid(),
  content: z.string().min(1).max(2000),
})

export interface AIMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface AISession {
  id: string
  user_id: string
  title: string
  status: 'active' | 'archived'
  created_at: string
  messages: AIMessage[]
}

/**
 * Create new AI mentor session
 */
export async function createSession(title?: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }
  
  // Generate title from first message or default
  const generatedTitle = title || `Session ${new Date().toLocaleDateString()}`
  
  // Create session in database
  const { data: session, error: sessionError } = await supabase
    .from('ai_mentor_sessions')
    .insert({
      user_id: user.id,
      title: generatedTitle,
      status: 'active',
    })
    .select()
    .single()
  
  if (sessionError) {
    return { error: sessionError }
  }
  
  return { data: session }
}

/**
 * Send message to AI mentor and get response
 */
export async function sendMessage(sessionId: string, content: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }
  
  // Verify session ownership
  const { data: session, error: sessionError } = await supabase
    .from('ai_mentor_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', user.id)
    .single()
  
  if (sessionError || !session) {
    return { error: new Error('Session not found') }
  }
  
  // Save user message
  const { error: userMsgError } = await supabase
    .from('ai_mentor_messages')
    .insert({
      session_id: sessionId,
      role: 'user',
      content: content,
    })
  
  if (userMsgError) {
    return { error: userMsgError }
  }
  
  // Get conversation history (last 10 messages)
  const { data: messages } = await supabase
    .from('ai_mentor_messages')
    .select('role, content')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(10)
  
  // Prepare messages for LLM
  const systemPrompt = `You are Collabryx AI Mentor, a helpful career advisor and collaboration assistant.
Help users:
- Find relevant connections based on their goals
- Improve their profiles
- Discover project opportunities
- Navigate career decisions

Be concise, encouraging, and practical. Focus on actionable advice.`

  const llmMessages = [
    { role: 'system', content: systemPrompt },
    ...(messages || []).map(m => ({
      role: m.role,
      content: m.content,
    })),
  ]
  
  // Call LLM API
  let aiResponse: string
  
  try {
    if (process.env.LLM_PROVIDER === 'anthropic') {
      // Claude implementation
      // const response = await anthropic.messages.create({
      //   model: 'claude-3-haiku-20240307',
      //   max_tokens: 500,
      //   messages: llmMessages.slice(1), // Claude doesn't use system message in array
      //   system: systemPrompt,
      // })
      // aiResponse = response.content[0].text
      throw new Error('Anthropic not implemented yet')
    } else {
      // OpenAI implementation
      const response = await openai.chat.completions.create({
        model: 'gpt-4-turbo-preview',
        messages: llmMessages as any,
        max_tokens: 500,
        temperature: 0.7,
      })
      
      aiResponse = response.choices[0].message.content || 'Sorry, I could not generate a response.'
    }
  } catch (llmError) {
    console.error('LLM API error:', llmError)
    return { error: new Error('Failed to get AI response') }
  }
  
  // Save AI response
  const { data: aiMessage, error: aiMsgError } = await supabase
    .from('ai_mentor_messages')
    .insert({
      session_id: sessionId,
      role: 'assistant',
      content: aiResponse,
    })
    .select()
    .single()
  
  if (aiMsgError) {
    return { error: aiMsgError }
  }
  
  revalidatePath('/assistant')
  
  return { data: aiMessage }
}

/**
 * Get session history
 */
export async function getSessionHistory(sessionId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }
  
  const { data, error } = await supabase
    .from('ai_mentor_messages')
    .select('*')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
  
  if (error) {
    return { error }
  }
  
  return { data }
}

/**
 * Get all user sessions
 */
export async function getUserSessions() {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }
  
  const { data, error } = await supabase
    .from('ai_mentor_sessions')
    .select('*')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  
  if (error) {
    return { error }
  }
  
  return { data }
}

/**
 * Archive session
 */
export async function archiveSession(sessionId: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }
  
  const { error } = await supabase
    .from('ai_mentor_sessions')
    .update({ status: 'archived' })
    .eq('id', sessionId)
    .eq('user_id', user.id)
  
  if (error) {
    return { error }
  }
  
  revalidatePath('/assistant')
  
  return { success: true }
}

/**
 * Save message to profile (user insights)
 */
export async function saveMessageToProfile(messageId: string, insight: string) {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  
  if (authError || !user) {
    return { error: new Error('Unauthorized') }
  }
  
  // Update user's profile with insight
  const { error } = await supabase
    .from('profiles')
    .update({
      bio: insight, // Or append to existing bio
    })
    .eq('id', user.id)
  
  if (error) {
    return { error }
  }
  
  revalidatePath('/my-profile')
  
  return { success: true }
}
```

---

### Step 2.3: Update Chat Input Component

**File:** `components/features/assistant/chat-input.tsx`

```typescript
"use client"

import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { SendHorizontal, Loader2 } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { glass } from "@/lib/utils/glass-variants"
import { toast } from "sonner"
import { sendMessage } from "@/lib/actions/ai-mentor"

interface ChatInputProps {
  sessionId: string | null
  onMessageSent: () => void
}

export function ChatInput({ sessionId, onMessageSent }: ChatInputProps) {
    const [input, setInput] = useState("")
    const [isSending, setIsSending] = useState(false)

    const handleSubmit = async () => {
        if (!input.trim() || !sessionId) return
        
        setIsSending(true)
        
        try {
            const result = await sendMessage(sessionId, input.trim())
            
            if (result.error) {
                toast.error(result.error.message || "Failed to send message")
                return
            }
            
            setInput("")
            onMessageSent()
            toast.success("Message sent")
        } catch (error) {
            console.error("Error sending message:", error)
            toast.error("Failed to send message. Please try again.")
        } finally {
            setIsSending(false)
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit()
        }
    }

    return (
        <div className={cn(
            "relative rounded-xl overflow-hidden shadow-sm focus-within:ring-1 focus-within:ring-primary transition-all",
            glass("input"),
            "border"
        )}>
            <Textarea
                placeholder="Ask for advice, career tips, or connection strategies..."
                className={cn(
                    "min-h-[3.5rem] md:min-h-[3.5rem] max-h-32 resize-none border-0 focus-visible:ring-0 p-3 md:p-4 pr-11 md:pr-12 text-sm",
                    "bg-transparent"
                )}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isSending || !sessionId}
            />
            <div className="absolute right-2 bottom-2">
                <Button
                    size="icon"
                    className={cn("h-8 w-8 md:h-8 md:w-8 rounded-lg", glass("buttonPrimary"))}
                    disabled={!input.trim() || isSending || !sessionId}
                    onClick={handleSubmit}
                >
                    {isSending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <SendHorizontal className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div>
    )
}
```

---

### Step 2.4: Update Chat List Component

**File:** `components/features/assistant/chat-list.tsx`

```typescript
"use client"

import { useEffect, useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { MessageBubble } from "./message-bubble"
import { Loader2 } from "lucide-react"
import { getSessionHistory } from "@/lib/actions/ai-mentor"
import type { AIMessage } from "@/lib/actions/ai-mentor"

interface ChatListProps {
    sessionId: string | null
}

export function ChatList({ sessionId }: ChatListProps) {
    const [messages, setMessages] = useState<AIMessage[]>([])
    const [isLoading, setIsLoading] = useState(false)

    useEffect(() => {
        if (!sessionId) {
            setMessages([])
            return
        }

        const loadMessages = async () => {
            setIsLoading(true)
            try {
                const result = await getSessionHistory(sessionId)
                
                if (result.error) {
                    console.error("Failed to load messages:", result.error)
                    return
                }
                
                setMessages(result.data || [])
            } catch (error) {
                console.error("Error loading messages:", error)
            } finally {
                setIsLoading(false)
            }
        }

        loadMessages()
    }, [sessionId])

    if (!sessionId) {
        return (
            <ScrollArea className="flex-1 p-3 md:p-4">
                <div className="flex items-center justify-center h-full text-muted-foreground">
                    Start a conversation with AI Mentor
                </div>
            </ScrollArea>
        )
    }

    if (isLoading) {
        return (
            <ScrollArea className="flex-1 p-3 md:p-4">
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </ScrollArea>
        )
    }

    return (
        <ScrollArea className="flex-1 p-3 md:p-4">
            <div className="flex flex-col gap-3 md:gap-4 max-w-3xl mx-auto w-full">
                {messages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                        Start the conversation! Ask for career advice or collaboration tips.
                    </div>
                ) : (
                    messages.map((msg) => (
                        <MessageBubble
                            key={msg.id}
                            message={{
                                role: msg.role as 'user' | 'assistant',
                                content: msg.content,
                            }}
                        />
                    ))
                )}
            </div>
        </ScrollArea>
    )
}
```

---

## 📊 PHASE 3: SMART MATCHES + FEED ON LOGIN (Days 4-5)

### Step 3.1: Create Login Data Fetching Hook

**File:** `hooks/use-login-data.ts` (NEW)

```typescript
/**
 * Login Data Hook
 * Fetches all initial data when user logs in:
 * - Feed posts
 * - Smart matches
 * - Notifications
 * - User profile
 */

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { fetchPosts } from '@/lib/services/posts'
import { fetchMatches } from '@/lib/services/matches'

export interface LoginData {
  posts: ReturnType<typeof fetchPosts>
  matches: ReturnType<typeof fetchMatches>
  profile: any
  notifications: any[]
}

export function useLoginData() {
  const [isReady, setIsReady] = useState(false)

  // Fetch posts
  const postsQuery = useQuery({
    queryKey: ['feed-initial'],
    queryFn: async () => {
      const result = await fetchPosts({ limit: 20 })
      return result.data || []
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10,   // 10 minutes
    enabled: false, // Manually trigger
  })

  // Fetch matches
  const matchesQuery = useQuery({
    queryKey: ['matches-initial'],
    queryFn: async () => {
      const result = await fetchMatches({ limit: 20 })
      return result.data || []
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15,   // 15 minutes
    enabled: false, // Manually trigger
  })

  // Fetch profile
  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return null
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      return data
    },
    staleTime: 1000 * 60 * 5,
    enabled: false,
  })

  // Fetch notifications
  const notificationsQuery = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) return []
      
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10)
      
      return data || []
    },
    staleTime: 1000 * 60 * 1, // 1 minute
    enabled: false,
  })

  // Trigger all queries on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        await Promise.all([
          postsQuery.refetch(),
          matchesQuery.refetch(),
          profileQuery.refetch(),
          notificationsQuery.refetch(),
        ])
        setIsReady(true)
      } catch (error) {
        console.error('Error fetching login data:', error)
      }
    }

    fetchAllData()
  }, [])

  return {
    isReady,
    posts: postsQuery.data || [],
    matches: matchesQuery.data || [],
    profile: profileQuery.data,
    notifications: notificationsQuery.data || [],
    isLoading: postsQuery.isLoading || matchesQuery.isLoading || profileQuery.isLoading,
    error: postsQuery.error || matchesQuery.error || profileQuery.error,
  }
}
```

---

### Step 3.2: Update Auth Layout with Data Prefetching

**File:** `app/(auth)/layout.tsx`

```typescript
"use client"

import { SidebarProvider, useSidebar } from "@/components/shared/sidebar-context"
import { SidebarNav } from "@/components/shared/sidebar-nav"
import { MobileNav } from "@/components/shared/mobile-nav"
import { SettingsDialog } from "@/components/features/settings/settings-dialog"
import { cn } from "@/lib/utils"
import { useLoginData } from "@/hooks/use-login-data"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useEffect } from 'react'

// Create query client once
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function AuthLayoutContent({ children }: { children: React.ReactNode }) {
    const { isCollapsed } = useSidebar()
    const { isReady, isLoading, error } = useLoginData()

    useEffect(() => {
        if (isReady) {
            console.log('✅ Login data loaded:', {
                posts: '✓',
                matches: '✓',
                profile: '✓',
                notifications: '✓',
            })
        }
    }, [isReady])

    return (
        <>
            <div className={cn(
                "min-h-screen bg-background flex flex-col md:flex-row",
                !isReady && "opacity-50 pointer-events-none"
            )}>
                {/* Loading overlay */}
                {!isReady && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
                        <div className="text-center">
                            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4" />
                            <p className="text-muted-foreground">Loading your dashboard...</p>
                        </div>
                    </div>
                )}

                {/* Mobile Navigation */}
                <MobileNav />

                {/* Desktop Sidebar */}
                <aside className={cn(
                    "hidden md:flex flex-col fixed inset-y-0 left-0 z-50 border-r bg-background transition-all duration-300 ease-in-out",
                    isCollapsed ? "w-[80px]" : "w-[280px]"
                )}>
                    <SidebarNav />
                </aside>

                {/* Main Content */}
                <main className={cn(
                    "flex-1 transition-all duration-300 ease-in-out pt-0 md:pt-0 min-h-screen pb-6 md:pb-0",
                    isCollapsed ? "md:ml-[80px]" : "md:ml-[280px]"
                )}>
                    {children}
                </main>
            </div>
            <SettingsDialog />
        </>
    )
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <QueryClientProvider client={queryClient}>
            <SidebarProvider>
                <AuthLayoutContent>{children}</AuthLayoutContent>
            </SidebarProvider>
        </QueryClientProvider>
    )
}
```

---

## 🧪 PHASE 4: TESTING & DEPLOYMENT (Days 6-7)

### Step 4.1: Local Testing Checklist

```bash
# 1. Start Docker backend
npm run docker:up

# 2. Verify health
npm run docker:health

# Expected output:
# {"status":"healthy","model_info":{...},"supabase_connected":true}

# 3. Start dev server
npm run dev

# Expected console output:
# 🔍 Checking Docker backend health...
# ✅ Docker backend is healthy at http://localhost:8000
# 🚀 Starting Next.js dev server...

# 4. Test embedding generation
# - Go to /my-profile
# - Update profile
# - Check console for: "Your profile is being analyzed. Vector embedding is queued!"

# 5. Test AI Mentor
# - Go to /assistant
# - Send a message
# - Verify response appears in chat

# 6. Test matches + feed on login
# - Logout
# - Login
# - Verify loading screen appears
# - Verify feed and matches load
```

---

### Step 4.2: Production Deployment

**Vercel Environment Variables:**

```env
BACKEND_MODE=auto
BACKEND_URL_RENDER=https://collabryx-backend.onrender.com
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

**Render Deployment:**

```bash
# 1. Connect GitHub repo to Render
# 2. Select render.yaml config
# 3. Add environment variables:
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
ALLOWED_ORIGINS=https://collabryx.vercel.app

# 4. Deploy
# Wait for health check to pass
```

---

## 📈 OPTIMIZATION RECOMMENDATIONS

### Performance Optimizations

1. **React Query Caching** (Already implemented)
   - Feed: 2min stale, 10min GC
   - Matches: 5min stale, 15min GC
   - Profile: 5min stale

2. **Backend Health Caching**
   ```typescript
   // Cache health check for 30s
   const healthCache = new Map<string, { healthy: boolean; timestamp: number }>()
   
   async function checkHealth(url: string): Promise<boolean> {
     const cached = healthCache.get(url)
     if (cached && Date.now() - cached.timestamp < 30000) {
       return cached.healthy
     }
     
     const healthy = await fetchHealth(url)
     healthCache.set(url, { healthy, timestamp: Date.now() })
     return healthy
   }
   ```

3. **Python Worker Optimizations** (KEEP AS-IS)
   - ✅ Queue processors (async, non-blocking)
   - ✅ Dead Letter Queue (auto-retry)
   - ✅ Rate limiting (3 requests/hour)
   - ✅ Pending queue (onboarding flow)

---

### Cost Optimizations

| Service | Current | Optimized | Savings |
|---------|---------|-----------|---------|
| Render Starter | $7/mo | $7/mo | - |
| OpenAI GPT-4 | ~$10/mo | Switch to Claude Haiku | ~$8/mo |
| Supabase Pro | $25/mo | $25/mo | - |
| **Total** | **$42/mo** | **$34/mo** | **19%** |

---

## ⚠️ RISK MITIGATION

### Risk 1: Docker Not Running

| | |
|---|---|
| **Mitigation** | Pre-dev check script + clear error messages |
| **Fallback** | Edge Function always available |

### Risk 2: Render Downtime

| | |
|---|---|
| **Mitigation** | Health checks + automatic failover |
| **Fallback** | Edge Function for embeddings |

### Risk 3: AI Mentor API Costs

| | |
|---|---|
| **Mitigation** | Rate limiting + Claude Haiku option |
| **Fallback** | Disable AI Mentor if costs exceed budget |

### Risk 4: Slow Login

| | |
|---|---|
| **Mitigation** | Parallel data fetching + loading screen |
| **Fallback** | Show cached data first, refresh in background |

---

## 📋 IMPLEMENTATION CHECKLIST

### Phase 0: Infrastructure (Day 0)

- [ ] Create `lib/config/backend.ts`
- [ ] Create `scripts/check-docker.mjs`
- [ ] Update `package.json` with new scripts
- [ ] Update `.env` with new variables
- [ ] Create `render.yaml`
- [ ] Create `docker-compose.dev.yml`

### Phase 1: Embedding API (Day 1)

- [ ] Update `app/api/embeddings/generate/route.ts`
- [ ] Test Docker backend routing
- [ ] Test Render backend routing
- [ ] Test Edge Function fallback

### Phase 2: AI Mentor (Days 2-3)

- [ ] Install OpenAI dependency
- [ ] Create `lib/actions/ai-mentor.ts`
- [ ] Update `components/features/assistant/chat-input.tsx`
- [ ] Update `components/features/assistant/chat-list.tsx`
- [ ] Test AI Mentor conversations

### Phase 3: Login Data (Days 4-5)

- [ ] Create `hooks/use-login-data.ts`
- [ ] Update `app/(auth)/layout.tsx`
- [ ] Add loading screen
- [ ] Test parallel data fetching
- [ ] Test error handling

### Phase 4: Testing (Days 6-7)

- [ ] Local dev testing
- [ ] Docker health check testing
- [ ] Vercel deployment
- [ ] Render deployment
- [ ] End-to-end testing

---

## 🎯 SUCCESS CRITERIA

- ✅ **Local Dev:** `npm run dev` checks Docker, shows clear errors if unavailable
- ✅ **Production:** Vercel → Render routing works automatically
- ✅ **Fallback:** Edge Function works if backend is down
- ✅ **AI Mentor:** Real conversations with OpenAI/Claude
- ✅ **Login:** Feed + matches load on login with loading screen
- ✅ **No Breaking Changes:** Existing features continue working

---

## ❓ CLARIFYING QUESTIONS

### 1. AI Mentor LLM Provider

| Provider | Cost | Quality | Recommendation |
|----------|------|---------|----------------|
| OpenAI GPT-4 Turbo | ~$0.01/1K tokens | Better quality | Use if quality is priority |
| Anthropic Claude 3 Haiku | ~$0.00025/1K tokens | 40x cheaper | **Recommended** for cost savings |

### 2. Login Loading Screen

| Approach | Pros | Cons | Recommendation |
|----------|------|------|----------------|
| Block entire app | Better UX, consistent state | Slower perceived load | **Recommended** for 2s max |
| Partial data | Faster initial render | More complex state | Good for future optimization |

### 3. Render Region

| Region | Latency | Cost | Recommendation |
|--------|---------|------|----------------|
| Oregon (us-west-2) | ~50ms (US West) | $7/mo | **Recommended** (closest to Vercel US) |
| Frankfurt (eu-central-1) | ~100ms (US West) | $7/mo | Better for EU users |

### 4. Docker Memory Limit

| Limit | Safety | Cost | Recommendation |
|-------|--------|------|----------------|
| 2GB | Safe, prevents OOM | Included in plan | **Recommended** for now |
| 1GB | Might be tight | Same cost | Monitor usage, optimize later |

---

## 📝 NOTES

- **Python worker `main.py` should NOT be modified** - Keep all queue processors, DLQ, and rate limiting intact
- **Edge Function fallback is critical** - Always ensure embeddings work even if backend is down
- **Health checks should be cached** - Don't check health on every request (30s cache recommended)
- **AI Mentor is optional** - Can be disabled if costs are concern
- **Login data fetching is parallel** - All queries run concurrently for fastest load time

---

**Last Updated:** 2026-03-15  
**Author:** Collabryx Development Team  
**Status:** Ready for Implementation
