# Onboarding Flow & Profile Completion

> This document outlines the expected onboarding flow, data gathered, and profile completion calculations.

## Flow & Screens

The onboarding is a multi-step process presented to the user after signing up. It should contain a **Skip** button to optionally bypass the process for now, though core features like matching will be restricted until the profile is sufficiently complete.

### Step 1: Basic Profile (Mandatory for 25%)
- Full Name (Mandatory)
- Display Name (Optional)
- Headline / Role (Mandatory)
- Location (Optional)

### Step 2: Skills & Expertise (Adds 25% -> 50%)
- Select Primary Skills (e.g., React, Python, UI Design) (Mandatory)
- List Proficiency Levels (Optional)

### Step 3: Interests & Goals (Adds 40% -> 90%)
- Select Interests/Industries (e.g., Fintech, EdTech, Web3) (Mandatory)
- Select Collaboration Goals (`looking_for`) (e.g., Co-founder, Open Source, Mentorship) (Mandatory)

### Step 4: Add Experience/Projects (Adds 10% -> 100%)
- Add at least one past experience or project (Optional)
- Link Portfolio/Website (Optional)

### Post-Onboarding: Vector Embedding Generation (Automatic)
After completing onboarding:
- Embedding generation is automatically triggered in the background
- User receives toast notification: "Profile setup complete! Your vector embedding is queued."
- Status can be monitored via Supabase Realtime subscription
- Matching features unlock once embedding status is `completed`

## Profile Completion Metrics

* **25%**: Basic Profile completed (Name, Headline)
* **50%**: Skills added
* **90%**: Interests and matching goals defined (Unlocks Matching Engine)
* **100%**: Experience, projects, or external links added

## Authentication & Routing Rules

1. **Routing Check**: After login or signup, check the `onboarding_completed` flag on the `profiles` table.
2. **If False**: Redirect user to `/onboarding`.
3. **Feature Gates**: Matchmaking and personalized feeds require at least 90% profile completion.
4. **Development Mode**: If `process.env.DEVELOPMENT_MODE === 'true'`, the app should allow bypassing the onboarding flow, meaning the auth middleware/checks will not force redirection to `/onboarding`, and users can access the onboarding route directly for testing without strict auth guards.

## Embedding Generation Flow

### Trigger Point
Embedding generation is triggered immediately after successful onboarding completion:

```typescript
// In onboarding/page.tsx onSubmit
const result = await completeOnboarding(data, completionPercentage)

if (result.success && result.userId) {
  // Trigger embedding generation
  fetch('/api/embeddings/generate', {
    method: 'POST',
    body: JSON.stringify({ user_id: result.userId })
  })
  
  toast.success("Profile setup complete! Your vector embedding is queued.")
  router.push("/dashboard")
}
```

### Generation Pipeline

```
Onboarding Complete
        ↓
Construct Semantic Text (profile + skills + interests)
        ↓
Try Python Worker (http://localhost:8000/generate-embedding)
        ├─ Success → Queue for processing → Store in DB → Realtime update
        └─ Timeout/Error (10s)
              ↓
        Use Edge Function Fallback
              ↓
        Generate local embedding → Store in DB
```

### Status States

| Status | Description | UI Feedback |
|--------|-------------|-------------|
| `pending` | Queued, waiting to start | "Analyzing your profile..." |
| `processing` | Currently generating | "Generating embeddings..." |
| `completed` | Ready for matching | "✓ Profile analyzed" |
| `failed` | Generation failed | "Analysis failed - Retry" |

### Realtime Monitoring

Frontend subscribes to status updates:

```typescript
import { subscribeToEmbeddingStatus } from '@/lib/services/embeddings'

useEffect(() => {
  const unsubscribe = subscribeToEmbeddingStatus(userId, (status) => {
    if (status.status === 'completed') {
      toast.success("Profile matching is now active!")
      // Enable matching features
    } else if (status.status === 'failed') {
      toast.error("Profile analysis failed. Please retry.")
    }
  })
  
  return () => unsubscribe()
}, [userId])
```

### Retry Mechanism

Users can manually retry embedding generation:

```typescript
import { regenerateEmbedding } from '@/lib/services/embeddings'

const handleRetry = async () => {
  const result = await regenerateEmbedding(userId)
  if (result.success) {
    toast.success("Retrying profile analysis...")
  }
}
```

## Data Validation

### Text Length Limits
To ensure optimal embedding generation:

| Field | Min | Max | Validation |
|-------|-----|-----|------------|
| Headline | 2 chars | 200 chars | Required |
| Bio | - | 500 chars | Optional |
| Skills | 1 skill | 20 skills | At least 1 required |
| Interests | 1 interest | 30 interests | At least 1 required |

### Semantic Text Construction

The profile data is formatted into a structured text string:

```
Role: Student.
Headline: React Developer.
Bio: Passionate about building web applications.
Skills: React, TypeScript, Node.js.
Interests: Fintech, EdTech.
Goals: cofounder, teammate.
Location: San Francisco.
```

**Max Length**: 2000 characters (truncated if longer)  
**Min Length**: 10 characters (validation error if shorter)
