# Table: `ai_mentor_messages`

> Messages within an AI Mentor session (user messages + AI responses).

## Used By

- **Message Bubble** component in assistant
- **AI Output Workspace** → displays AI-generated content for editing/export
- **Save to Profile** → copies AI output to profile fields

## Columns

| Column | Type | Nullable | Default | Description |
|--------|------|----------|---------|-------------|
| `id` | `uuid` | NO | `gen_random_uuid()` | PK |
| `session_id` | `uuid` | NO | — | FK → `ai_mentor_sessions.id` ON DELETE CASCADE |
| `role` | `text` | NO | — | Enum: `user`, `assistant` |
| `content` | `text` | NO | — | The message text |
| `is_saved_to_profile` | `boolean` | NO | `false` | Whether user saved this output |
| `created_at` | `timestamptz` | NO | `now()` | |

## Frontend Expectations

```ts
// Chat displays bubbles:
// role === "user"      → right-aligned, primary color
// role === "assistant" → left-aligned, muted bg

// AI Output Workspace shows assistant content with:
// Edit, Copy, Export (.md), Save to Profile actions
```

## AI Integration Notes

- Backend calls Supabase Edge Function → LLM API (OpenAI, Gemini, etc.)
- System prompt includes user's profile context (skills, interests, goals)
- AI suggests: bio improvements, project ideas, match explanations, role guidance
