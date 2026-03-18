# Phase 1, Week 1, Day 1-2: Manual Supabase Tasks

**Completed:** 2026-03-18  
**Tasks:** 1.1.13, 1.1.14

---

## Task 1.1.13: Run all migrations in Supabase

**Status:** ⏳ Manual Step Required

**Steps:**
1. Go to Supabase Dashboard → SQL Editor
2. Run the following SQL files in order:
   - `supabase/setup/30-match-scores.sql`
   - `supabase/setup/31-feed-scores.sql`
   - `supabase/setup/32-events.sql`
   - `supabase/setup/33-user-analytics.sql`
   - `supabase/setup/34-platform-analytics.sql`
   - `supabase/setup/35-notification-triggers.sql`
   - `supabase/setup/36-event-capture-triggers.sql`
   - `supabase/setup/37-realtime-broadcast.sql`

**Verification:**
```sql
-- Verify all tables created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'match_scores', 'feed_scores', 'events', 
  'user_analytics', 'platform_analytics'
);

-- Verify triggers exist
SELECT trigger_name, event_object_table 
FROM information_schema.triggers 
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- Verify functions exist
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
AND routine_name LIKE 'notify_%' 
OR routine_name LIKE 'capture_%' 
OR routine_name LIKE 'broadcast_%';
```

---

## Task 1.1.14: Verify Supabase Realtime channels

**Status:** ⏳ Manual Step Required

**Steps:**
1. Go to Supabase Dashboard → Database → Replication
2. Enable Realtime for these tables:
   - [ ] `notifications`
   - [ ] `events`
   - [ ] `match_activity`
   - [ ] `messages`
   - [ ] `match_suggestions`
   - [ ] `feed_scores`
   - [ ] `user_analytics`
   - [ ] `platform_analytics`

**Verification:**
Test Realtime subscription in browser console:
```javascript
const channel = supabase
  .channel('test:notifications')
  .on('postgres_changes', 
    { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'notifications' 
    }, 
    (payload) => console.log('Realtime working!', payload)
  )
  .subscribe();
```

---

## Files Created

| File | Task | Description |
|------|------|-------------|
| `30-match-scores.sql` | 1.1.1 | Match scoring breakdown table |
| `31-feed-scores.sql` | 1.1.2 | Feed ranking cache table |
| `32-events.sql` | 1.1.3 | Central event store |
| `33-user-analytics.sql` | 1.1.4 | Per-user analytics |
| `34-platform-analytics.sql` | 1.1.5 | Daily platform metrics |
| `35-notification-triggers.sql` | 1.1.6-1.1.10 | Auto-notification triggers |
| `36-event-capture-triggers.sql` | 1.1.11 | Event capture triggers |
| `37-realtime-broadcast.sql` | 1.1.12 | Realtime broadcast triggers |

---

## Next Steps

After completing manual Supabase setup:
1. ✅ Proceed to **Task 1.2.1**: Create match_generator.py skeleton
2. Location: `python-worker/services/match_generator.py`

---

**Time Spent:** ~2 hours (code creation)  
**Manual Setup Time:** ~30 minutes (estimated)
