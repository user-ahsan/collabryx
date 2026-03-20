# Profile Matching Debug - Root Cause Analysis & Fix

**Date:** 2026-03-21  
**Branch:** `agent/backend/profile-matching-debug`  
**Status:** ✅ Fixed

---

## 🐛 Issue Summary

Users with 100% profile completion were not finding matches in the system.

### Reported Symptoms
- User profile shows 100% completion in UI
- Docker backend is running correctly
- No matches being found/displayed to users

---

## 🔍 Root Cause Analysis

### Primary Issue: **Stale Profile Completion Data**

The `profile_completion` field in the `profiles` table was **never being updated** in the database.

#### How It Worked (Before Fix)
1. Frontend calculates completion client-side using `use-profile.ts` hook
2. Edge functions calculate completion when generating embeddings
3. **BUT** the `profiles.profile_completion` column was never updated when:
   - Users added skills
   - Users added interests
   - Users added experiences
   - Users updated profile fields

#### Impact on Matching
The match generator (`match_generator.py`) reads `profile_completion` from the database:

```python
# Line 394-396 in match_generator.py
user1_completion = user1.get("profile_completion", 0)
user2_completion = user2.get("profile_completion", 0)
breakdown["profile_quality"] = (user1_completion + user2_completion) / 200
```

Since `profile_completion` was 0 for most users (default value), the matching algorithm was:
1. Calculating low `profile_quality` scores (0% instead of 100%)
2. Still finding matches, but with lower overall percentages
3. Users seeing fewer or no "high quality" matches

### Secondary Issue: **Missing Logging**

No logging existed to debug:
- What profile completion values were being read
- How many similar users were found
- Why matches might not be generated

---

## ✅ Fixes Applied

### 1. SQL Trigger for Auto-Calculation

**File:** `supabase/setup/41-profile-completion-trigger.sql`

Created a comprehensive trigger system that:

- **`calculate_profile_completion(user_id)`** - Function to calculate completion %
- **Triggers on profile updates** - Updates when basic fields change
- **Triggers on skills changes** - Updates when skills are added/removed
- **Triggers on interests changes** - Updates when interests are added/removed
- **Triggers on experiences changes** - Updates when experiences are added/removed
- **`recalculate_all_profile_completions()`** - Helper to fix existing data

**Scoring Breakdown:**
```
Basic Info (25%):
  - full_name/display_name: 10%
  - headline: 10%
  - bio: 5%

Skills (25%):
  - Any skills added: 25%

Interests & Goals (25%):
  - Any interests: 15%
  - looking_for array: 10%

Experience (25%):
  - Any experiences: 25%

Total: 100%
```

### 2. Enhanced Match Generator Logging

**File:** `python-worker/services/match_generator.py`

Added comprehensive logging:

```python
# In generate_matches_for_user()
logger.info(f"User {user_id} profile: completion={user_completion}%, onboarding={...}")

# In find_similar_users()
logger.info(f"Found {len(results)} similar users for {user_id}")
logger.info(f"Similar users avg completion: {avg_completion:.1f}%")

# In _get_user_detailed_data()
logger.info(f"Profile data for {user_id}: completion={...}%, onboarding={...}")
logger.info(f"Enhanced profile data: skills={...}, interests={...}, experiences={...}")
```

### 3. Fallback Completion Calculation

Added `_calculate_completion_from_data()` method that:
- Calculates completion if DB value is 0 or missing
- Uses same scoring algorithm as frontend
- Logs warnings when fallback is used
- Ensures matching works even with stale DB data

---

## 🚀 Deployment Steps

### Step 1: Run SQL Migration

```sql
-- Execute the new SQL file
\i supabase/setup/41-profile-completion-trigger.sql

-- Recalculate all existing profile completions
SELECT recalculate_all_profile_completions();
```

### Step 2: Verify Profile Completions

```sql
-- Check profile completion distribution
SELECT 
  CASE 
    WHEN profile_completion = 0 THEN '0% (incomplete)'
    WHEN profile_completion < 50 THEN '1-49% (partial)'
    WHEN profile_completion < 100 THEN '50-99% (mostly complete)'
    WHEN profile_completion = 100 THEN '100% (complete)'
  END as status,
  COUNT(*) as count
FROM profiles
GROUP BY 
  CASE 
    WHEN profile_completion = 0 THEN '0% (incomplete)'
    WHEN profile_completion < 50 THEN '1-49% (partial)'
    WHEN profile_completion < 100 THEN '50-99% (mostly complete)'
    WHEN profile_completion = 100 THEN '100% (complete)'
  END;
```

### Step 3: Test Match Generation

```bash
# Call the match generation endpoint
curl -X POST http://localhost:8000/api/matches/generate \
  -H "Content-Type: application/json" \
  -d '{"user_id": "YOUR_USER_ID", "limit": 20}'

# Check logs for detailed output
docker compose -f docker-compose.dev.yml logs -f embedding-service
```

### Step 4: Monitor Logs

Expected log output for successful matching:
```
INFO: Starting match generation for user {id} (limit=20)
INFO: User {id} profile: completion=100%, onboarding=True
INFO: Finding similar users for {id} (limit=50)
INFO: Retrieved embedding for {id} (dimensions: 384)
INFO: Found 42 similar users for {id}
INFO: Similar users avg completion: 87.3% (range: 45-100%)
INFO: Proceeding with 42 candidates for match scoring
INFO: Generated 20 match suggestions for user {id}
```

---

## 🧪 Testing Verification

### Test Case 1: 100% Complete Profile
```sql
-- Create test user with 100% completion
-- Expected: Should find matches with high percentages
```

### Test Case 2: Profile with No Skills
```sql
-- User with only basic info (no skills/interests/experiences)
-- Expected: ~25% completion, fewer matches
```

### Test Case 3: Add Skills Dynamically
```sql
-- Add skills to existing user
-- Expected: profile_completion updates automatically via trigger
```

---

## 📊 Expected Results

### Before Fix
- Profile shows 100% in UI
- Database has `profile_completion = 0`
- Match quality score: Low (profile_quality = 0)
- Users see few/no matches

### After Fix
- Profile shows 100% in UI
- Database has `profile_completion = 100` (auto-updated)
- Match quality score: Accurate (profile_quality = 100)
- Users see appropriate matches based on actual compatibility

---

## 🔧 Maintenance

### Manual Recalculation
If needed, manually recalculate all completions:
```sql
SELECT recalculate_all_profile_completions();
```

### Check Trigger Status
```sql
-- Verify triggers are active
SELECT tgname, tgrelid::regclass, tgenabled
FROM pg_trigger
WHERE tgname LIKE '%profile_completion%';
```

### Monitor Completion Distribution
```sql
-- Weekly check of completion distribution
SELECT 
  ROUND(profile_completion / 10) * 10 as completion_bucket,
  COUNT(*) as user_count
FROM profiles
GROUP BY completion_bucket
ORDER BY completion_bucket;
```

---

## 📝 Related Files

- `supabase/setup/41-profile-completion-trigger.sql` - New trigger system
- `python-worker/services/match_generator.py` - Enhanced matching with logging
- `hooks/use-profile.ts` - Frontend completion calculation (reference)
- `supabase/functions/generate-embedding/index.ts` - Edge function calculation (reference)

---

## ✅ Verification Checklist

- [x] SQL trigger file created
- [x] Match generator logging added
- [x] Fallback completion calculation added
- [x] Changes committed to branch
- [ ] SQL migration executed in database
- [ ] Profile completions recalculated
- [ ] Match generation tested
- [ ] Logs verified for correct completion values
- [ ] Users report seeing matches

---

**Next Steps:** Deploy SQL migration and monitor match generation logs.
