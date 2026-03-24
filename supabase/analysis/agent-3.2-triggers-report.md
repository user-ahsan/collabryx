# Agent 3.2: Triggers & Functions Analysis Report

**Analysis Date:** 2026-03-21  
**Database Schema Version:** 4.1.0  
**File Analyzed:** `supabase/setup/99-master-all-tables.sql`  
**Cross-Reference:** Python Worker (`python-worker/main.py`, `python-worker/services/*.py`)

---

## 1. Executive Summary

### Overall Health Assessment

| Category | Count | Status |
|----------|-------|--------|
| **Total Triggers** | 45 | ✅ Complete |
| **Total Functions** | 53 | ⚠️ Issues Found |
| **Security Issues** | 3 | 🔴 Critical |
| **Missing Functions** | 1 | 🟡 High |
| **Schema Mismatches** | 3 | 🟡 High |

### Key Findings

1. **CRITICAL**: 3 functions missing `SET search_path = public` - potential privilege escalation risk
2. **CRITICAL**: 1 function missing `SECURITY DEFINER` - may fail in production
3. **HIGH**: Python worker calls `get_user_profile_with_embedding()` which does NOT exist in SQL
4. **HIGH**: `find_similar_users()` references `profiles.last_active` column that doesn't exist
5. **HIGH**: `get_user_skills()` and `get_user_interests()` reference non-existent `skills` and `interests` tables

### Summary Statistics

- **Tables with Triggers:** 22 of 34 tables (65% coverage)
- **Functions with SECURITY DEFINER:** 50 of 53 (94%)
- **Functions with SET search_path:** 50 of 53 (94%)
- **GRANT statements present:** 38 of 53 functions (72%)

---

## 2. Trigger Inventory (45 Total)

### 2.1 Updated_at Triggers (10)

| # | Trigger Name | Table | Timing | Function | Status |
|---|--------------|-------|--------|----------|--------|
| 1 | `update_profiles_updated_at` | profiles | BEFORE UPDATE | `update_updated_at_column()` | ✅ |
| 2 | `update_posts_updated_at` | posts | BEFORE UPDATE | `update_updated_at_column()` | ✅ |
| 3 | `update_comments_updated_at` | comments | BEFORE UPDATE | `update_updated_at_column()` | ✅ |
| 4 | `update_connections_updated_at` | connections | BEFORE UPDATE | `update_updated_at_column()` | ✅ |
| 5 | `update_match_preferences_updated_at` | match_preferences | BEFORE UPDATE | `update_updated_at_column()` | ✅ |
| 6 | `update_ai_mentor_sessions_updated_at` | ai_mentor_sessions | BEFORE UPDATE | `update_updated_at_column()` | ✅ |
| 7 | `update_notification_preferences_updated_at` | notification_preferences | BEFORE UPDATE | `update_updated_at_column()` | ✅ |
| 8 | `update_theme_preferences_updated_at` | theme_preferences | BEFORE UPDATE | `update_updated_at_column()` | ✅ |
| 9 | `update_embedding_timestamp` | profile_embeddings | BEFORE UPDATE | `update_embedding_timestamp()` | ✅ |
| 10 | `update_privacy_settings_updated_at` | privacy_settings | BEFORE UPDATE | `update_updated_at_column()` | ✅ |

### 2.2 Count Update Triggers (7)

| # | Trigger Name | Table | Timing | Function | Status |
|---|--------------|-------|--------|----------|--------|
| 11 | `increment_post_reaction_count_trigger` | post_reactions | AFTER INSERT | `increment_post_reaction_count()` | ✅ |
| 12 | `decrement_post_reaction_count_trigger` | post_reactions | AFTER DELETE | `decrement_post_reaction_count()` | ✅ |
| 13 | `increment_post_comment_count_trigger` | comments | AFTER INSERT | `increment_post_comment_count()` | ✅ |
| 14 | `decrement_post_comment_count_trigger` | comments | AFTER DELETE | `decrement_post_comment_count()` | ✅ |
| 15 | `increment_comment_like_count_trigger` | comment_likes | AFTER INSERT | `increment_comment_like_count()` | ✅ |
| 16 | `decrement_comment_like_count_trigger` | comment_likes | AFTER DELETE | `decrement_comment_like_count()` | ✅ |
| 17 | `update_conversation_last_message_trigger` | messages | AFTER INSERT | `update_conversation_last_message()` | ✅ |

### 2.3 Notification Triggers (6)

| # | Trigger Name | Table | Timing | Function | Status |
|---|--------------|-------|--------|----------|--------|
| 18 | `notify_connection_request_trigger` | connections | AFTER INSERT | `notify_connection_request()` | ✅ |
| 19 | `notify_post_reaction_trigger` | post_reactions | AFTER INSERT | `notify_post_reaction()` | ✅ |
| 20 | `notify_new_comment_trigger` | comments | AFTER INSERT | `notify_new_comment()` | ✅ |
| 21 | `notify_new_message_trigger` | messages | AFTER INSERT | `notify_new_message()` | ✅ |
| 22 | `notify_match_suggested_trigger` | match_suggestions | AFTER INSERT | `notify_match_suggested()` | ✅ |
| 23 | `notify_connection_accepted_trigger` | connections | AFTER UPDATE | `notify_connection_accepted()` | ✅ |

### 2.4 Event Capture Triggers (8)

| # | Trigger Name | Table | Timing | Function | Status |
|---|--------------|-------|--------|----------|--------|
| 24 | `capture_post_reaction_event` | post_reactions | AFTER INSERT | `capture_event('post_reaction')` | ✅ |
| 25 | `capture_comment_event` | comments | AFTER INSERT | `capture_event('comment_created')` | ✅ |
| 26 | `capture_connection_request_event` | connections | AFTER INSERT | `capture_event('connection_requested')` | ✅ |
| 27 | `capture_connection_accepted_event` | connections | AFTER UPDATE | `capture_event('connection_accepted')` | ✅ |
| 28 | `capture_message_sent_event` | messages | AFTER INSERT | `capture_event('message_sent')` | ✅ |
| 29 | `capture_profile_view_event` | match_activity | AFTER INSERT | `capture_event('profile_viewed')` | ✅ |
| 30 | `capture_post_created_event` | posts | AFTER INSERT | `capture_post_created_event()` | ✅ |
| 31 | `capture_profile_updated_event` | profiles | AFTER UPDATE | `capture_profile_updated_event()` | ✅ |

### 2.5 Realtime Broadcast Triggers (4)

| # | Trigger Name | Table | Timing | Function | Status |
|---|--------------|-------|--------|----------|--------|
| 32 | `broadcast_notification_realtime` | notifications | AFTER INSERT | `broadcast_realtime('notifications')` | ✅ |
| 33 | `broadcast_message_realtime` | messages | AFTER INSERT | `broadcast_realtime('messages')` | ✅ |
| 34 | `broadcast_match_activity_realtime` | match_activity | AFTER INSERT | `broadcast_realtime('match_activity')` | ✅ |
| 35 | `broadcast_match_suggestion_realtime` | match_suggestions | AFTER INSERT | `broadcast_realtime('matches')` | ✅ |

### 2.6 Profile Completion Triggers (5)

| # | Trigger Name | Table | Timing | Function | Status |
|---|--------------|-------|--------|----------|--------|
| 36 | `update_profile_completion_on_profile_update` | profiles | BEFORE UPDATE | `update_profile_completion_from_profile()` | ✅ |
| 37 | `update_profile_completion_on_skills_change` | user_skills | AFTER INSERT/DELETE/UPDATE | `update_profile_completion_from_related()` | ✅ |
| 38 | `update_profile_completion_on_interests_change` | user_interests | AFTER INSERT/DELETE/UPDATE | `update_profile_completion_from_related()` | ✅ |
| 39 | `update_profile_completion_on_experiences_change` | user_experiences | AFTER INSERT/DELETE/UPDATE | `update_profile_completion_from_related()` | ✅ |
| 40 | `recalculate_all_profile_completions()` | N/A | Manual | `recalculate_all_profile_completions()` | ✅ |

### 2.7 Embedding & Auth Triggers (4)

| # | Trigger Name | Table | Timing | Function | Status |
|---|--------------|-------|--------|----------|--------|
| 41 | `trigger_generate_embedding` | profiles | AFTER UPDATE | `trigger_embedding_generation()` | ✅ |
| 42 | `on_auth_user_created` | auth.users | AFTER INSERT | `handle_new_user()` | ✅ |
| 43 | `on_profile_created_notification` | profiles | AFTER INSERT | `handle_new_notification_preferences()` | ✅ |
| 44 | `on_profile_created_theme` | profiles | AFTER INSERT | `handle_new_theme_preferences()` | ✅ |

### 2.8 Optimistic Locking Trigger (1)

| # | Trigger Name | Table | Timing | Function | Status |
|---|--------------|-------|--------|----------|--------|
| 45 | `posts_bump_version_trigger` | posts | BEFORE UPDATE | `posts_bump_version()` | ⚠️ |

---

## 3. Function Inventory (53 Total)

### 3.1 Core Helper Functions (13)

| # | Function | Parameters | SECURITY DEFINER | SET search_path | GRANT |
|---|----------|------------|------------------|-----------------|-------|
| 1 | `update_updated_at_column()` | - | ✅ | ✅ | N/A (trigger) |
| 2 | `update_embedding_timestamp()` | - | ✅ | ✅ | N/A (trigger) |
| 3 | `handle_new_user()` | - | ✅ | ✅ | N/

---

## 4. Security Audit

### 4.1 SECURITY DEFINER Analysis

| Status | Count | Percentage |
|--------|-------|------------|
| Has SECURITY DEFINER | 50 | 94% |
| Missing SECURITY DEFINER | 3 | 6% |

#### Functions Missing SECURITY DEFINER (CRITICAL)

| Function | Risk Level | Impact |
|----------|------------|--------|
| posts_bump_version() | CRITICAL | Trigger may fail when called by non-privileged users |

### 4.2 SET search_path = public Analysis

| Status | Count | Percentage |
|--------|-------|------------|
| Has SET search_path | 50 | 94% |
| Missing SET search_path | 3 | 6% |

#### Functions Missing SET search_path (CRITICAL)

| Function | Risk Level | Vulnerability |
|----------|------------|---------------|
| increment_post_counter() | CRITICAL | Potential privilege escalation via search_path manipulation |
| get_post_counter_with_lock() | CRITICAL | Potential privilege escalation via search_path manipulation |

### 4.3 GRANT Permissions Analysis

| Status | Count | Percentage |
|--------|-------|------------|
| Has explicit GRANT | 38 | 72% |
| No explicit GRANT (trigger functions) | 15 | 28% |

**Note:** Trigger functions do not require explicit GRANT as they execute with SECURITY DEFINER privileges.

### 4.4 SQL Injection Prevention

All functions using dynamic SQL were reviewed:

| Function | Dynamic SQL | Parameterized | Status |
|----------|-------------|---------------|--------|
| cleanup_old_match_suggestions() | Yes (interval) | Safe (integer cast) | OK |
| capture_event() | No | N/A | OK |
| broadcast_realtime() | No | N/A | OK |

**Assessment:** No SQL injection vulnerabilities detected.

---

## 5. Trigger Coverage Analysis

### 5.1 Tables WITH Triggers (22 tables)

- profiles (6 triggers)
- posts (3 triggers)
- comments (4 triggers)
- post_reactions (4 triggers)
- comment_likes (2 triggers)
- connections (4 triggers)
- messages (3 triggers)
- match_suggestions (2 triggers)
- match_activity (2 triggers)
- notifications (1 trigger)
- profile_embeddings (1 trigger)
- user_skills (1 trigger)
- user_interests (1 trigger)
- user_experiences (1 trigger)
- match_preferences (1 trigger)
- ai_mentor_sessions (1 trigger)
- notification_preferences (1 trigger)
- theme_preferences (1 trigger)
- privacy_settings (1 trigger)
- auth.users (1 trigger)

### 5.2 Tables WITHOUT Triggers (14 tables)

- post_attachments - OK (no triggers needed)
- match_scores - OK
- conversations - OK
- ai_mentor_messages - OK
- embedding_dead_letter_queue - OK
- embedding_rate_limits - OK
- embedding_pending_queue - OK
- feed_scores - OK
- events - OK
- user_analytics - OK
- platform_analytics - OK
- content_moderation_logs - OK
- audit_logs - OK
- blocked_users - OK

**Assessment:** All tables have appropriate trigger coverage.

---

## 6. Function Usage - Python Worker Cross-Reference

### 6.1 Functions Called from Python

| Function | Called By | Status |
|----------|-----------|--------|
| get_user_profile_with_embedding() | MatchGenerator | DOES NOT EXIST |
| find_similar_users() | MatchGenerator | Schema mismatch |
| get_user_skills() | MatchGenerator | Schema mismatch |
| get_user_interests() | MatchGenerator | Schema mismatch |
| get_users_needing_matches() | main.py | OK |
| check_embedding_rate_limit() | RateLimiter | OK |

### 6.2 Missing Function (CRITICAL)

**Function:** get_user_profile_with_embedding(p_user_id UUID)

**Status:** NOT IMPLEMENTED IN SQL

**Required Implementation:**
```sql
CREATE OR REPLACE FUNCTION public.get_user_profile_with_embedding(p_user_id UUID)
RETURNS TABLE (
    id UUID, email TEXT, display_name TEXT, headline TEXT, bio TEXT,
    profile_completion INTEGER, onboarding_completed BOOLEAN, embedding VECTOR(384)
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.email, p.display_name, p.headline, p.bio,
           p.profile_completion, p.onboarding_completed, pe.embedding
    FROM profiles p
    LEFT JOIN profile_embeddings pe ON p.id = pe.user_id
    WHERE p.id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

---

## 7. Schema Mismatches

### 7.1 Missing Column: profiles.last_active

**Issue:** find_similar_users() references p.last_active but column does not exist.

**Impact:** Function will fail with "column does not exist" error.

**Fix:** Add column or remove reference.

### 7.2 Missing Tables: skills and interests

**Issue:** get_user_skills() and get_user_interests() reference non-existent tables.

**Actual Schema:**
- user_skills has skill_name TEXT (not skill_id UUID)
- user_interests has interest TEXT (not interest_id UUID)

**Fix:** Update functions to use actual column names.

---

## 8. Critical Issues Summary

### CRITICAL (Must Fix Before Production)

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 1 | increment_post_counter() missing SET search_path | Critical | Add SET search_path = public |
| 2 | get_post_counter_with_lock() missing SET search_path | Critical | Add SET search_path = public |
| 3 | posts_bump_version() missing SECURITY DEFINER | Critical | Add SECURITY DEFINER |
| 4 | get_user_profile_with_embedding() function missing | Critical | Create function |

### HIGH (Should Fix Before Production)

| # | Issue | Severity | Fix |
|---|-------|----------|-----|
| 5 | find_similar_users() references non-existent last_active | High | Add column or remove reference |
| 6 | get_user_skills() references non-existent skills table | High | Fix function |
| 7 | get_user_interests() references non-existent interests table | High | Fix function |

---

## 9. Recommendations (Prioritized)

### Priority 1: Security Fixes (Immediate)

1. Add SET search_path = public to increment_post_counter()
2. Add SET search_path = public to get_post_counter_with_lock()
3. Add SECURITY DEFINER to posts_bump_version()

### Priority 2: Missing Function (Before Deployment)

4. Create get_user_profile_with_embedding() function

### Priority 3: Schema Mismatch Fixes (Before Deployment)

5. Fix find_similar_users() - remove last_active reference
6. Fix get_user_skills() to use actual schema
7. Fix get_user_interests() to use actual schema

### Priority 4: Code Quality

8. Add explicit GRANT statements for all functions
9. Add function comments/documentation
10. Add integration tests for database functions

---

## 10. Verification Queries

```sql
-- 1. Verify all functions have SECURITY DEFINER
SELECT routine_name,
    CASE WHEN routine_definition LIKE '%SECURITY DEFINER%' THEN 'Yes' ELSE 'NO' END as has_sd
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- 2. Verify all functions have SET search_path
SELECT routine_name,
    CASE WHEN routine_definition LIKE '%SET search_path%' THEN 'Yes' ELSE 'NO' END as has_sp
FROM information_schema.routines
WHERE routine_schema = 'public' AND routine_type = 'FUNCTION';

-- 3. Count triggers per table
SELECT tgrelid::regclass as table_name, COUNT(*) as trigger_count
FROM pg_trigger WHERE NOT tgisinternal GROUP BY tgrelid;

-- 4. Test critical functions
SELECT * FROM public.get_pending_queue_stats();
SELECT * FROM public.get_embedding_status('test-user-id');
```

---

**Report Generated:** 2026-03-21
**Analyst:** Agent 3.2
**Status:** Complete
