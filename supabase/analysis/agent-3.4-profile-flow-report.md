# Agent 3.4: Data Flow Analysis - Profiles & Onboarding

**Analysis Date:** 2026-03-21  
**Analyzer:** qwen3.5-plus  
**Scope:** User profiles, onboarding flow, profile completion, embedding generation, skills/interests/experience management

---

## 1. Executive Summary

### Overall Health Assessment: **GOOD** with Minor Issues

The profile and onboarding data flow is **well-architected** with comprehensive automation through database triggers, proper validation layers, and reliable queue-based embedding generation. However, several **critical gaps** and **medium-severity issues** were identified that should be addressed before production.

### Key Findings Summary

| Category | Status | Issues Found |
|----------|--------|--------------|
| Profile Creation | ✅ Good | 1 Low |
| Onboarding Flow | ⚠️ Medium | 2 Medium, 1 Low |
| Profile Completion | ⚠️ Medium | 1 High, 1 Medium |
| Embedding Trigger | ✅ Good | 1 Medium |
| Skills Management | ✅ Good | 1 Low |
| Interests Management | ✅ Good | None |
| Experience Management | ✅ Good | 1 Low |
| Projects Management | ✅ Good | None |
| Privacy Settings | ⚠️ High | 1 Critical |
| Verification System | ⚠️ Medium | 1 Medium |

---

## 2. Profile Creation Flow

### Current Implementation

**Flow:** `auth.users INSERT` → `handle_new_user()` trigger → `profiles INSERT` → `notification_preferences INSERT` + `theme_preferences INSERT`

```sql
-- Trigger on auth.users (line 943-948)
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- handle_new_user() creates profile with:
-- - profile_completion = 25 (base score for email)
-- - onboarding_completed = false
-- - full_name from raw_user_meta_data

-- Auto-creates related records (lines 949-982):
-- - notification_preferences (via on_profile_created_notification)
-- - theme_preferences (via on_profile_created_theme)
```

### ✅ Strengths

1. **Automatic profile creation** - No manual intervention needed
2. **Cascading preference creation** - notification_preferences and theme_preferences auto-created
3. **Initial completion score** - Starts at 25% (email verified base)
4. **SECURITY DEFINER** - All functions use proper security context

### ⚠️ Issues Found

#### LOW: Missing privacy_settings auto-creation

**File:** `99-master-all-tables.sql` (lines 2462-2472)

**Issue:** The `privacy_settings` table exists but is NOT auto-created when a profile is created. Users must manually create privacy settings or encounter NULL issues.

**Current Schema:**
```sql
CREATE TABLE public.privacy_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    profile_visibility TEXT NOT NULL DEFAULT 'public',
    -- ... other fields
);
```

**Impact:** Users may have inconsistent privacy defaults; potential NULL constraint violations if code assumes privacy_settings always exists.

**Recommendation:** Add trigger to auto-create privacy_settings:
```sql
CREATE FUNCTION public.handle_new_privacy_settings()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.privacy_settings (user_id)
    VALUES (NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_profile_created_privacy
    AFTER INSERT ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_privacy_settings();
```

---

## 3. Onboarding Flow (5 Steps)

### Current Implementation

**Files Analyzed:**
- `app/(auth)/onboarding/page.tsx` (815 lines)
- `app/(auth)/onboarding/layout.tsx` (98 lines)
- `components/features/onboarding/step-*.tsx` (6 files)
- `app/(auth)/onboarding/actions.ts` (395 lines)

**Flow Steps:**
1. **Welcome** - Introduction screen
2. **Basic Info** - fullName, displayName, headline, location
3. **Skills** - Select/add skills from database
4. **Interests & Goals** - Select industries and collaboration goals
5. **Experience** - Optional experience/projects/links

### ✅ Strengths

1. **Comprehensive validation** - Zod schemas on both client and server
2. **Draft recovery** - 24-hour sessionStorage persistence
3. **Email verification warning** - Shows warning but allows continuation
4. **Skip option** - "Skip & Complete" available on all steps
5. **CSRF protection** - API route validates CSRF tokens
6. **Rate limiting** - 3 requests/hour/user for embeddings

### ⚠️ Issues Found

#### MEDIUM: Inconsistent profile completion calculation

**Files:** 
- `app/(auth)/onboarding/page.tsx` (lines 417-428)
- `supabase/setup/99-master-all-tables.sql` (lines 1488-1544)

**Issue:** Frontend and backend calculate completion differently:

**Frontend (onboarding/page.tsx):**
```typescript
let calculatedPercentage = 25  // Base for basic info
if (data.skills && data.skills.length > 0) calculatedPercentage += 25
if (data.interests && data.interests.length > 0) calculatedPercentage += 40  // ⚠️ 40% not 25%
// Experience adds 10%
```

**Backend (get_profile_completion_percentage function):**
```sql
-- Basic profile = 25%
-- Skills = 25%
-- Interests = 25%
-- Experience OR Projects = 25%
```

**Impact:** Frontend shows 90-100% but backend calculates 75-100%. User sees different percentages in different places.

**Recommendation:** Use database function `get_profile_completion_percentage()` consistently on frontend via RPC call.

#### MEDIUM: Experience step validation gaps

**File:** `app/(auth)/onboarding/page.tsx` (lines 66-70, 295-310)

**Issue:** Experience schema allows empty experiences:
```typescript
const experienceSchema = z.object({
    experiences: z.array(z.object({
        title: z.string().optional().or(z.literal("")),  // ⚠️ Can be empty
        company: z.string().optional().or(z.literal("")),
        description: z.string().optional().or(z.literal("")),
    })).optional(),
});
```

**Impact:** Users can submit empty experience entries that pass validation but create unnecessary database records.

**Recommendation:** Add refinement to require at least one field:
```typescript
experiences: z.array(z.object({...}).refine(
    (data) => data.title || data.company,
    { message: "At least title or company is required" }
)).optional()
```

#### LOW: No server-side validation for display_name uniqueness

**File:** `app/(auth)/onboarding/actions.ts` (lines 164-179)

**Issue:** Display name uniqueness is not validated server-side. Database schema doesn't have UNIQUE constraint on `display_name`.

**Impact:** Multiple users can have same display_name, causing confusion in mentions/search.

**Recommendation:** Add uniqueness check in `completeOnboarding()` action or add UNIQUE constraint with fallback generation.

---

## 4. Profile Completion Calculation

### Current Implementation

**Database Function:** `get_profile_completion_percentage(UUID)` (lines 1488-1544)

**Scoring:**
- Basic info (display_name/full_name + headline) = 25%
- Skills (any) = 25%
- Interests (any) = 25%
- Experience OR Projects (any) = 25%

**Auto-Update Triggers:**
- `update_profile_completion_on_profile_update` - on profiles UPDATE
- `update_profile_completion_on_skills_change` - on user_skills INSERT/DELETE/UPDATE
- `update_profile_completion_on_interests_change` - on user_interests INSERT/DELETE/UPDATE
- `update_profile_completion_on_experiences_change` - on user_experiences INSERT/DELETE/UPDATE

### ✅ Strengths

1. **Automatic updates** - Triggers keep completion in sync
2. **Clear scoring** - 4 sections × 25% = 100%
3. **Flexible** - Experience OR Projects counts (not both required)

### ⚠️ Issues Found

#### HIGH: calculate_profile_completion() function has SQL bug

**File:** `99-master-all-tables.sql` (lines 2804-2830)

**Issue:** The function uses `SELECT COUNT(*) INTO v_score` incorrectly:

```sql
-- BUGGY CODE:
SELECT COUNT(*) INTO v_score FROM user_skills WHERE user_id = p_user_id HAVING COUNT(*) > 0;
v_score := v_score + 25;  -- ⚠️ v_score could be NULL if HAVING fails
```

**Impact:** If HAVING clause fails (no skills), `v_score` becomes NULL, and all subsequent additions result in NULL. Profile completion shows as NULL i

---

## 12. Critical Issues Summary

### Must Fix Before Production

| Priority | Issue | File | Severity |
|----------|-------|------|----------|
| 1 | calculate_profile_completion() SQL bug | 99-master-all-tables.sql:2804-2830 | CRITICAL |
| 2 | privacy_settings not auto-created | 99-master-all-tables.sql | CRITICAL |
| 3 | Profile completion calculation inconsistency | Multiple files | HIGH |
| 4 | No verification workflow | profiles table | MEDIUM |
| 5 | Embedding retry mechanism missing | 99-master-all-tables.sql:1007 | MEDIUM |
| 6 | Experience UNIQUE constraint too strict | 99-master-all-tables.sql:112 | LOW |
| 7 | Skills proficiency not collected | step-skills.tsx | LOW |

---

## 13. Recommendations (Prioritized)

### P0 - Immediate (Before Production)

1. **Fix calculate_profile_completion() SQL bug**
   - File: supabase/setup/99-master-all-tables.sql
   - Use proper variable handling (see Section 4)
   - Test with users having no skills/interests/experience

2. **Add privacy_settings auto-creation trigger**
   - File: supabase/setup/99-master-all-tables.sql
   - Add handle_new_privacy_settings() function
   - Add trigger on profiles INSERT

3. **Standardize profile completion calculation**
   - Frontend should use get_profile_completion_percentage() RPC
   - Remove duplicate calculation logic from use-profile.ts

### P1 - High Priority

4. **Add embedding retry mechanism**
   - Add trigger to retry failed embeddings on profile update
   - Add admin endpoint to manually retry all failed embeddings

5. **Implement verification workflow**
   - Create verification_requests table
   - Add UI for verification requests
   - Add admin approval dashboard

### P2 - Medium Priority

6. **Fix experience UNIQUE constraint**
   - Change to UNIQUE(user_id, title, company, start_date) or remove

7. **Add proficiency collection in onboarding**
   - Add optional proficiency selector in step-skills
   - Default to intermediate if not specified

8. **Add display_name uniqueness validation**
   - Server-side check in completeOnboarding()
   - Auto-generate unique suffix if conflict

### P3 - Low Priority

9. **Add experience validation refinement**
   - Require at least title OR company in experience entries

10. **Add profile completion recalculation on migration**
    - Run SELECT recalculate_all_profile_completions() after schema deployment

---

## 14. RLS Verification

### Current RLS Coverage: GOOD

| Table | SELECT | INSERT | UPDATE | DELETE | Status |
|-------|--------|--------|--------|--------|--------|
| profiles | Public | Own | Own | - | OK |
| user_skills | Public | Own | Own | Own | OK |
| user_interests | Public | Own | Own | Own | OK |
| user_experiences | Public | Own | Own | Own | OK |
| user_projects | Public/Own | Own | Own | Own | OK |
| privacy_settings | Own | Own | Own | - | OK |
| profile_embeddings | Own | Service | Service | Service | OK |
| embedding_pending_queue | Own | Service | Service | Service | OK |

Note: All embedding tables correctly restrict write access to service_role only.

---

## 15. Testing Checklist

### Before Production Deployment

- [ ] Run SELECT recalculate_all_profile_completions() to fix existing NULL values
- [ ] Test profile creation with new user (verify all 3 preference tables created)
- [ ] Test onboarding completion (verify embedding queued)
- [ ] Test profile completion updates (add skill, verify percentage updates)
- [ ] Test embedding failure recovery (simulate failure, verify retry)
- [ ] Test privacy settings access (verify defaults exist)
- [ ] Verify RLS policies block unauthorized access
- [ ] Load test with 100 concurrent onboarding completions

---

## 16. Conclusion

The profile and onboarding data flow is **well-designed** with comprehensive automation and proper security controls. However, the **critical SQL bug** in calculate_profile_completion() and the **missing privacy_settings auto-creation** must be fixed before production deployment.

**Overall Assessment:** Ready for production after fixing P0 issues (estimated 2-4 hours of work).

---

**Report Generated:** 2026-03-21  
**Model:** qwen3.5-plus  
**Files Analyzed:** 20+ files across schema, components, hooks, and API routes
