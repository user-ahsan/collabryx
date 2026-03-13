# 🔧 Collabryx Comprehensive Fix Plan

**Created:** 2026-03-14  
**Priority:** P0 (Blockers) → P1 (High) → P2 (Medium)  
**Goal:** Fix all audit issues + Supabase linter warnings without breaking existing functionality

---

## 📊 Issue Summary

| Category | Count | Priority |
|----------|-------|----------|
| **Audit Critical Issues** | 3 | P0 |
| **Audit High Priority** | 6 | P1 |
| **Supabase WARN (Security)** | 16 | P0 |
| **Supabase WARN (Performance)** | 55 | P1 |
| **Supabase INFO** | 39 | P2 |
| **TOTAL** | 119 | - |

---

## 🎯 Phase 1: P0 Blockers (Week 1)

### 1.1 Fix `collaboration_requests` Table Reference ❌

**Problem:** Component references non-existent table

**Files to Fix:**
- `components/features/requests/request-reminder-modal.tsx:92`

**Solution:** Replace with `connections` table

**Steps:**
1. Update component to use `connections` table with `status = 'pending'`
2. Remove all references to `collaboration_requests`
3. Test requests feature

**Time:** 1 hour

---

### 1.2 Complete Validation Schemas 📝

**Problem:** Empty validation files

**Files to Create:**
- `lib/validations/auth.ts` - Login/register validation
- `lib/validations/chat.ts` - Message validation

**Solution:**

```typescript
// lib/validations/auth.ts
import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string().min(1, 'Password is required.'),
})

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address.'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
})

export const resetPasswordSchema = z.object({
  token: z.string().uuid('Invalid reset token.'),
  newPassword: z.string()
    .min(8, 'Password must be at least 8 characters.')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter.')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter.')
    .regex(/[0-9]/, 'Password must contain at least one number.'),
})
```

```typescript
// lib/validations/chat.ts
import { z } from 'zod'

export const messageSchema = z.object({
  text: z.string()
    .min(1, 'Message cannot be empty.')
    .max(2000, 'Message must be less than 2000 characters.'),
  attachment_url: z.string().url().optional().or(z.literal('')),
  attachment_type: z.enum(['image', 'file']).optional(),
})

export const conversationSchema = z.object({
  participant_ids: z.array(z.string().uuid())
    .length(2, 'Conversation must have exactly 2 participants.'),
})
```

**Time:** 2 hours

---

### 1.3 Fix Supabase Function Search Path (16 Functions) 🔐

**Problem:** All database functions have mutable search_path (SECURITY WARNING)

**Affected Functions:**
1. `regenerate_embedding`
2. `handle_new_notification_preferences`
3. `update_updated_at_column`
4. `handle_new_user`
5. `decrement_post_reaction_count`
6. `increment_post_reaction_count`
7. `decrement_comment_like_count`
8. `decrement_post_comment_count`
9. `trigger_embedding_generation`
10. `increment_post_comment_count`
11. `get_conversation`
12. `update_conversation_last_message`
13. `increment_comment_like_count`
14. `are_connected`
15. `handle_new_theme_preferences`
16. `decrement_post_comment_count`

**Solution:** Add `SET search_path = public` to all function definitions

**Migration File:** `supabase/setup/30-fix-function-search-paths.sql`

```sql
-- Fix all functions to have immutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Repeat for all 16 functions with SECURITY DEFINER SET search_path = public
```

**Time:** 4 hours

---

### 1.4 Move Vector Extension Out of Public Schema 🔐

**Problem:** `vector` extension installed in public schema (SECURITY WARNING)

**Solution:** Create new `extensions` schema and move vector extension

**Migration File:** `supabase/setup/31-move-extensions-to-extensions-schema.sql`

```sql
-- Create extensions schema
CREATE SCHEMA IF NOT EXISTS extensions;

-- Note: Moving extensions requires recreation
-- This should be done carefully in production

-- For now, document this as known issue
-- Supabase recommends keeping vector in public for compatibility
```

**Decision:** ⚠️ **SKIP FOR NOW** - Supabase recommends keeping pgvector in public schema for compatibility. Add to documentation as accepted risk.

**Time:** 0 hours (documented risk)

---

## 🎯 Phase 2: P1 High Priority (Week 2)

### 2.1 Fix RLS Policies Missing (2 Tables) 📋

**Problem:** Tables have RLS enabled but no policies

**Affected Tables:**
1. `ai_mentor_messages`
2. `match_preferences`
3. `match_scores`

**Migration File:** `supabase/setup/32-add-missing-rls-policies.sql`

```sql
-- ai_mentor_messages policies
CREATE POLICY "Users can view own AI mentor messages"
  ON public.ai_mentor_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_mentor_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add AI mentor messages"
  ON public.ai_mentor_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ai_mentor_sessions
      WHERE id = session_id AND user_id = auth.uid()
    )
  );

-- match_preferences policies
CREATE POLICY "Users can view own match preferences"
  ON public.match_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own match preferences"
  ON public.match_preferences FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- match_scores policies (service role only)
CREATE POLICY "Service role can manage match scores"
  ON public.match_scores FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');
```

**Time:** 2 hours

---

### 2.2 Fix Auth RLS Performance (42 Policies) ⚡

**Problem:** `auth.uid()` and `current_setting()` re-evaluated for each row

**Solution:** Wrap auth calls in subqueries: `(select auth.uid())`

**Migration File:** `supabase/setup/33-optimize-rls-policies.sql`

```sql
-- Example fix for profiles table
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (id = (select auth.uid()));

-- Example fix for user_skills table
DROP POLICY IF EXISTS "Users can manage own skills" ON public.user_skills;
CREATE POLICY "Users can manage own skills"
  ON public.user_skills FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Repeat for all 42 affected policies
```

**Time:** 6 hours

---

### 2.3 Fix Multiple Permissive Policies (13 Tables) ⚡

**Problem:** Duplicate SELECT policies causing performance issues

**Affected Tables:**
- `notification_preferences` (2 policies → 1)
- `theme_preferences` (2 policies → 1)
- `user_experiences` (2 policies → 1)
- `user_interests` (2 policies → 1)
- `user_projects` (2 policies → 1)
- `user_skills` (2 policies → 1)

**Migration File:** `supabase/setup/34-merge-permissive-policies.sql`

```sql
-- notification_preferences: Merge duplicate SELECT policies
DROP POLICY IF EXISTS "Users can view own notification preferences" ON public.notification_preferences;
DROP POLICY IF EXISTS "Users can manage own notification preferences" ON public.notification_preferences;

CREATE POLICY "Users can manage own notification preferences"
  ON public.notification_preferences FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- Repeat for other 5 tables
```

**Time:** 3 hours

---

### 2.4 Add Missing Indexes (9 Foreign Keys) ⚡

**Problem:** Foreign keys without covering indexes

**Affected Tables:**
1. `ai_mentor_messages.session_id`
2. `comment_likes.user_id`
3. `match_activity.actor_user_id`
4. `match_activity.target_user_id`
5. `match_scores.suggestion_id`
6. `match_suggestions.matched_user_id`
7. `messages.sender_id`
8. `notifications.actor_id`
9. `post_reactions.user_id`

**Migration File:** `supabase/setup/35-add-missing-indexes.sql`

```sql
-- Add missing indexes for foreign keys
CREATE INDEX IF NOT EXISTS idx_ai_mentor_messages_session_id ON public.ai_mentor_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.comment_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_match_activity_actor_user_id ON public.match_activity(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_match_activity_target_user_id ON public.match_activity(target_user_id);
CREATE INDEX IF NOT EXISTS idx_match_scores_suggestion_id ON public.match_scores(suggestion_id);
CREATE INDEX IF NOT EXISTS idx_match_suggestions_matched_user_id ON public.match_suggestions(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications(actor_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON public.post_reactions(user_id);
```

**Time:** 1 hour

---

### 2.5 Add Field-Level Validations to Components 📝

**Files to Update:**
1. `components/features/settings/profile-settings-tab.tsx`
2. `components/features/settings/skills-settings-tab.tsx`
3. `components/features/settings/experience-projects-settings-tab.tsx`
4. `components/features/messages/message-input.tsx`
5. `components/features/dashboard/comment-section.tsx`

**Solution:** Add Zod schemas and integrate with React Hook Form

**Example:**
```typescript
// components/features/settings/profile-settings-tab.tsx
import { z } from 'zod'

const profileSettingsSchema = z.object({
  displayName: z.string().min(2).max(50),
  headline: z.string().min(2).max(200),
  bio: z.string().max(2000),
  location: z.string().max(100).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
})
```

**Time:** 6 hours

---

### 2.6 Integrate File Validation 🔒

**File to Update:** `components/features/dashboard/create-post-modal.tsx`

**Solution:** Import and use `lib/utils/file-validation.ts`

```typescript
import { validateFile } from '@/lib/utils/file-validation'

// In file upload handler:
const validation = validateFile(file, {
  maxSize: 50 * 1024 * 1024, // 50MB
  allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4'],
  maxDimensions: { width: 4096, height: 4096 }
})

if (!validation.valid) {
  toast.error(validation.error)
  return
}
```

**Time:** 2 hours

---

### 2.7 Apply Rate Limiting to Forms 🛡️

**Files to Update:**
1. `components/features/auth/login-form.tsx`
2. `components/features/auth/register-form.tsx`
3. `components/features/messages/message-input.tsx`
4. `components/features/requests/requests-client.tsx`

**Solution:** Use `lib/rate-limit.ts` in server actions

**Time:** 4 hours

---

## 🎯 Phase 3: P2 Medium Priority (Week 3)

### 3.1 Remove Unused Indexes (25 Indexes) 🗑️

**Problem:** 25 indexes have never been used (performance overhead)

**Decision:** ⚠️ **KEEP FOR NOW** - These indexes may be used by RLS policies or future queries. Review after monitoring query patterns.

**Time:** 0 hours (deferred)

---

### 3.2 Implement Missing Features 🚀

**Features to Implement:**
1. `connections` table CRUD (currently mock)
2. `notifications` table integration (currently mock)
3. `ai_mentor_*` tables integration (currently mock UI)

**Files to Create:**
- `lib/services/connections.ts`
- `lib/services/notifications.ts`
- `lib/services/ai-mentor.ts`
- `app/api/connections/route.ts`
- `app/api/notifications/route.ts`
- `app/api/ai/chat/route.ts`

**Time:** 20 hours

---

### 3.3 Add Input Sanitization 🛡️

**Files to Update:** All form components

**Solution:** Use `lib/utils/sanitize.ts` before displaying user content

**Time:** 4 hours

---

### 3.4 Clean Up Duplicate RLS Policies 🧹

**Files to Update:** SQL migration from Phase 2.3

**Time:** Already covered in 2.3

---

## 📅 Timeline Summary

| Phase | Duration | Issues Fixed | Risk Level |
|-------|----------|--------------|------------|
| **P0 Blockers** | 1 week | 20 (3 audit + 17 Supabase) | 🔴 High |
| **P1 High** | 1 week | 73 (6 audit + 67 Supabase) | 🟡 Medium |
| **P2 Medium** | 1 week | 26 (26 Supabase) | 🟢 Low |

---

## 🧪 Testing Strategy

### Before Each Migration

1. **Backup Database:**
   ```bash
   supabase db dump -f backup-before-fix.sql
   ```

2. **Run Local Tests:**
   ```bash
   npm run test
   npm run lint
   npm run build
   ```

3. **Check Build:**
   ```bash
   npm run build
   ```

### After Each Migration

1. **Verify RLS Policies:**
   ```sql
   SELECT tablename, policyname, cmd, qual, with_check
   FROM pg_policies
   WHERE schemaname = 'public'
   ORDER BY tablename, policyname;
   ```

2. **Verify Functions:**
   ```sql
   SELECT proname, proconfig
   FROM pg_proc
   WHERE pronamespace = 'public'::regnamespace
   AND proconfig IS NOT NULL;
   ```

3. **Verify Indexes:**
   ```sql
   SELECT indexname, indexdef
   FROM pg_indexes
   WHERE schemaname = 'public'
   ORDER BY indexname;
   ```

4. **Test Critical Flows:**
   - Login/Register
   - Onboarding
   - Profile update
   - Post creation
   - Messaging
   - Matching

---

## 📝 Migration Order

**Execute in this exact order:**

1. `30-fix-function-search-paths.sql` (P0 - Security)
2. `32-add-missing-rls-policies.sql` (P1 - Security)
3. `33-optimize-rls-policies.sql` (P1 - Performance)
4. `34-merge-permissive-policies.sql` (P1 - Performance)
5. `35-add-missing-indexes.sql` (P1 - Performance)

---

## ✅ Verification Checklist

### After Phase 1 (P0)

- [ ] No `collaboration_requests` references in codebase
- [ ] `lib/validations/auth.ts` exists with schemas
- [ ] `lib/validations/chat.ts` exists with schemas
- [ ] All 16 functions have `SET search_path = public`
- [ ] Supabase linter: 0 function_search_path_mutable warnings

### After Phase 2 (P1)

- [ ] `ai_mentor_messages` has RLS policies
- [ ] `match_preferences` has RLS policies
- [ ] `match_scores` has RLS policies
- [ ] All 42 RLS policies use `(select auth.uid())`
- [ ] Duplicate permissive policies merged
- [ ] 9 missing indexes created
- [ ] Field validation on all settings forms
- [ ] File validation integrated in create-post
- [ ] Rate limiting on auth forms and messages
- [ ] Supabase linter: 0 auth_rls_initplan warnings
- [ ] Supabase linter: 0 multiple_permissive_policies warnings

### After Phase 3 (P2)

- [ ] Connections CRUD operational
- [ ] Notifications integrated
- [ ] AI mentor feature working
- [ ] Input sanitization applied

---

## 🚨 Rollback Plan

If any migration fails:

```bash
# Restore database
psql -h db.<project>.supabase.co -U postgres -d postgres -f backup-before-fix.sql

# Or restore individual migration
git checkout HEAD -- supabase/setup/
```

---

## 📊 Expected Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| **Supabase WARN (Security)** | 17 | 1 | 94% ↓ |
| **Supabase WARN (Performance)** | 55 | 0 | 100% ↓ |
| **Supabase INFO** | 39 | 25 | 36% ↓ |
| **Validation Coverage** | 60% | 95% | 58% ↑ |
| **Feature Completeness** | 70% | 95% | 36% ↑ |
| **Overall Alignment** | 77% | 98% | 27% ↑ |

---

## 🎯 Success Criteria

1. ✅ Zero P0 security warnings from Supabase
2. ✅ Zero P1 performance warnings from Supabase
3. ✅ All validation schemas complete
4. ✅ All forms have field-level validation
5. ✅ File uploads validated client-side
6. ✅ Rate limiting on all mutation endpoints
7. ✅ All 3 missing features implemented
8. ✅ Build passes with 0 errors
9. ✅ Lint passes with 0 errors
10. ✅ All critical user flows tested and working

---

**Plan Created:** 2026-03-14  
**Estimated Total Time:** 48 hours (3 weeks part-time)  
**Risk Level:** Medium (mitigated by testing strategy)  
**Rollback Available:** Yes (database backups)
