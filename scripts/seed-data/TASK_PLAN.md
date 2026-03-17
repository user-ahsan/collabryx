# 🚀 Collabryx Seeder Refactoring - Task Plan

**Objective:** Fix all duplicate seeding, non-incremental seeding, and configuration issues across all seeding modules.

**Start Date:** 2026-03-17
**Status:** In Progress

---

## 📋 PHASE 1: Configuration & Foundation

### Task 1.1: Fix config.py
- [ ] Add `SEED_USER_PASSWORD` ENV variable
- [ ] Add `INCREMENTAL_SEEDING` toggle
- [ ] Add `CHECK_DUPLICATES` toggle
- [ ] Add `SEED_PROFILES_RANDOMIZE_INDUSTRIES` toggle
- [ ] Validate all ENV variables at startup
- [ ] Add configuration summary print function

**File:** `config.py`
**Priority:** High
**Estimated Time:** 30 min

---

## 📋 PHASE 2: Profile Seeding Fixes

### Task 2.1: Fix data_generators/profiles.py
- [ ] Fix industry distribution to use random.choice() instead of modulo
- [ ] Add email uniqueness tracking in generate_profiles()
- [ ] Add validation for template variable replacement
- [ ] Add duplicate email detection before generation

**File:** `data_generators/profiles.py`
**Priority:** High
**Estimated Time:** 45 min

### Task 2.2: Fix profiles_seeder.py
- [ ] Add check for existing auth user by email before creation
- [ ] Use ENV variable for password (SEED_USER_PASSWORD)
- [ ] Make profile creation truly incremental (skip if exists, don't update)
- [ ] Add duplicate check for skills before insertion
- [ ] Add duplicate check for interests before insertion
- [ ] Add duplicate check for experiences before insertion
- [ ] Add duplicate check for projects before insertion
- [ ] Add comprehensive skip/create statistics
- [ ] Add rollback support for failed profile creation

**File:** `seeders/profiles_seeder.py`
**Priority:** High
**Estimated Time:** 90 min

---

## 📋 PHASE 3: Content Seeding Fixes

### Task 3.1: Fix posts_seeder.py
- [ ] Add post duplicate check (by author_id + content hash)
- [ ] Call comment_exists() before creating comments
- [ ] Optimize reaction creation with batch operations
- [ ] Cache existing reactions per post
- [ ] Use config defaults for all limits
- [ ] Add comprehensive skip/create statistics

**File:** `seeders/posts_seeder.py`
**Priority:** High
**Estimated Time:** 60 min

### Task 3.2: Fix base_seeder.py (supporting fixes)
- [ ] Add batch upsert method for reactions
- [ ] Add cache for existing comments per post
- [ ] Add cache for existing reactions per post
- [ ] Optimize reaction_exists() to use cache
- [ ] Add content hash utility for duplicate detection

**File:** `seeders/base_seeder.py`
**Priority:** High
**Estimated Time:** 45 min

---

## 📋 PHASE 4: Social Seeding Fixes

### Task 4.1: Fix connections_seeder.py
- [ ] Fetch all existing connections from database at start (not just cache)
- [ ] Check both directions before creating bidirectional connections
- [ ] Add proper skip/create statistics
- [ ] Add progress logging with percentages

**File:** `seeders/connections_seeder.py`
**Priority:** High
**Estimated Time:** 45 min

### Task 4.2: Fix matches_seeder.py
- [ ] Add duplicate check for match suggestions (user_id + matched_user_id)
- [ ] Make user limit configurable via ENV
- [ ] Add proper skip/create statistics
- [ ] Inherit from BaseSeeder for utilities

**File:** `seeders/matches_seeder.py`
**Priority:** High
**Estimated Time:** 45 min

### Task 4.3: Fix conversations_seeder.py
- [ ] Add database status check at start
- [ ] Return status indicating created vs existing
- [ ] Add proper skip/create statistics
- [ ] Inherit from BaseSeeder for utilities

**File:** `seeders/conversations_seeder.py`
**Priority:** Medium
**Estimated Time:** 30 min

### Task 4.4: Fix messages_seeder.py
- [ ] Add message duplicate check (conversation_id + sender_id + content + created_at)
- [ ] Batch update conversations after all messages created
- [ ] Add proper skip/create statistics
- [ ] Inherit from BaseSeeder for utilities

**File:** `seeders/messages_seeder.py`
**Priority:** Medium
**Estimated Time:** 45 min

---

## 📋 PHASE 5: Other Seeding Fixes

### Task 5.1: Fix notifications_seeder.py
- [ ] Inherit from BaseSeeder
- [ ] Add duplicate check (user_id + type + actor_id)
- [ ] Add proper skip/create statistics
- [ ] Add database status check

**File:** `seeders/notifications_seeder.py`
**Priority:** Medium
**Estimated Time:** 45 min

### Task 5.2: Fix mentor_seeder.py
- [ ] Inherit from BaseSeeder
- [ ] Add duplicate check (user_id + topic)
- [ ] Add proper skip/create statistics
- [ ] Add database status check

**File:** `seeders/mentor_seeder.py`
**Priority:** Medium
**Estimated Time:** 45 min

### Task 5.3: Fix embeddings_seeder.py
- [ ] Add ENV variable for worker URL fallback
- [ ] Add better error handling for worker unavailability
- [ ] Add proper skip/create statistics

**File:** `seeders/embeddings_seeder.py`
**Priority:** Low
**Estimated Time:** 30 min

---

## 📋 PHASE 6: Testing & Validation

### Task 6.1: Test Profiles Seeding
- [ ] Run profiles seeder first time (10 profiles)
- [ ] Verify 10 profiles created
- [ ] Run profiles seeder second time (same 10 profiles)
- [ ] Verify 0 duplicates created, all skipped
- [ ] Check database for duplicate emails
- [ ] Check database for duplicate user_ids

**Test Script:** `scripts/seed-data/test_incremental.py`
**Priority:** High
**Estimated Time:** 30 min

### Task 6.2: Test Posts Seeding
- [ ] Run posts seeder first time (20 posts)
- [ ] Verify posts created with comments and reactions
- [ ] Run posts seeder second time
- [ ] Verify 0 duplicate posts/comments/reactions
- [ ] Check database for duplicates

**Priority:** High
**Estimated Time:** 30 min

### Task 6.3: Test Connections Seeding
- [ ] Run connections seeder first time (50 connections)
- [ ] Verify connections created
- [ ] Run connections seeder second time
- [ ] Verify 0 duplicate connections
- [ ] Check bidirectional connections are correct

**Priority:** High
**Estimated Time:** 30 min

### Task 6.4: Test Matches Seeding
- [ ] Run matches seeder first time
- [ ] Verify match suggestions created
- [ ] Run matches seeder second time
- [ ] Verify 0 duplicate match suggestions

**Priority:** High
**Estimated Time:** 30 min

### Task 6.5: Full Integration Test
- [ ] Clear test data from database (or use fresh Supabase project)
- [ ] Run complete seeding sequence (profiles → posts → connections → matches → conversations → messages)
- [ ] Verify all data created correctly
- [ ] Run complete seeding sequence again
- [ ] Verify all data skipped (incremental)
- [ ] Generate test report

**Priority:** High
**Estimated Time:** 60 min

---

## 📋 PHASE 7: Documentation & Commit

### Task 7.1: Update Documentation
- [ ] Update README.md with new ENV variables
- [ ] Update seeding documentation with incremental seeding info
- [ ] Add troubleshooting guide for duplicate issues

**Priority:** Medium
**Estimated Time:** 30 min

### Task 7.2: Sequential Commits
- [ ] Commit 1: config.py changes
- [ ] Commit 2: profiles generator fixes
- [ ] Commit 3: profiles seeder fixes
- [ ] Commit 4: posts seeder fixes
- [ ] Commit 5: connections seeder fixes
- [ ] Commit 6: matches seeder fixes
- [ ] Commit 7: conversations/messages seeder fixes
- [ ] Commit 8: notifications/mentor seeder fixes
- [ ] Commit 9: test suite
- [ ] Commit 10: documentation

**Priority:** High
**Estimated Time:** 45 min

---

## 📊 PROGRESS TRACKING

| Phase | Tasks Complete | Total Tasks | Status |
|-------|---------------|-------------|--------|
| Phase 1: Configuration | 0/1 | 1 | ⏳ Pending |
| Phase 2: Profile Seeding | 0/2 | 2 | ⏳ Pending |
| Phase 3: Content Seeding | 0/2 | 2 | ⏳ Pending |
| Phase 4: Social Seeding | 0/4 | 4 | ⏳ Pending |
| Phase 5: Other Seeding | 0/3 | 3 | ⏳ Pending |
| Phase 6: Testing | 0/5 | 5 | ⏳ Pending |
| Phase 7: Documentation | 0/2 | 2 | ⏳ Pending |
| **TOTAL** | **0/19** | **19** | **⏳ Not Started** |

---

## 🎯 SUCCESS CRITERIA

1. ✅ All seeders skip existing records (truly incremental)
2. ✅ No duplicate records created on re-seeding
3. ✅ All configuration via ENV variables
4. ✅ Comprehensive skip/create statistics shown
5. ✅ All tests pass (first run + second run verification)
6. ✅ Documentation updated
7. ✅ All changes committed with clear messages

---

## 📝 NOTES

- Run each seeder twice to verify incremental behavior
- Use a test Supabase project if possible to avoid affecting production data
- Keep track of record counts before/after each test
- Document any edge cases discovered during testing

---

**Last Updated:** 2026-03-17
**Status:** Ready to begin implementation
