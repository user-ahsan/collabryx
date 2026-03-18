# 📋 Collabryx ML Features - Detailed Task Breakdown

**Branch:** `feature/ml-match-scoring-and-personalization`  
**Created:** 2026-03-18  
**Total Tasks:** 147  
**Estimated Effort:** 4-5 weeks (100 working days)

---

## 🎯 Phase 1: Core Matching & Notifications (Week 1-2)

**Duration:** 10 working days  
**Priority:** CRITICAL  
**Success Criteria:** Match suggestions populated, notifications real-time, activity tracked

---

### Week 1, Day 1-2: Database Schema & Triggers

#### Task 1.1.1: Create match_scores table
- **File:** `supabase/setup/30-match-scores.sql`
- **Description:** Create table for detailed match score breakdown
- **Acceptance Criteria:**
  - [ ] Table created with all columns (semantic_similarity, skills_overlap, etc.)
  - [ ] Foreign key to match_suggestions
  - [ ] Index on suggestion_id
  - [ ] RLS policies configured
  - [ ] Realtime enabled
- **SQL Columns:**
  ```sql
  id, suggestion_id, semantic_similarity, skills_overlap, 
  complementary_score, shared_interests, activity_match, 
  overall_score, model_version, calculated_at
  ```
- **Estimated Time:** 2 hours

#### Task 1.1.2: Create feed_scores table
- **File:** `supabase/setup/31-feed-scores.sql`
- **Description:** Cache for personalized feed ranking
- **Acceptance Criteria:**
  - [ ] Table created with unique constraint (user_id, post_id)
  - [ ] Index on user_id + score (for feed queries)
  - [ ] Index on created_at (for cleanup)
  - [ ] RLS policies configured
- **Estimated Time:** 1.5 hours

#### Task 1.1.3: Create events table
- **File:** `supabase/setup/32-events.sql`
- **Description:** Central event store for analytics
- **Acceptance Criteria:**
  - [ ] Table created with jsonb metadata column
  - [ ] Composite index on (actor_id, created_at)
  - [ ] Index on event_type
  - [ ] Partitioning by month (if >1M events expected)
- **Estimated Time:** 2 hours

#### Task 1.1.4: Create user_analytics table
- **File:** `supabase/setup/33-user-analytics.sql`
- **Description:** Per-user engagement metrics
- **Acceptance Criteria:**
  - [ ] Table created with all metric columns
  - [ ] Foreign key to profiles
  - [ ] Index on last_active
  - [ ] RLS policies (user can only read own analytics)
- **Estimated Time:** 1.5 hours

#### Task 1.1.5: Create platform_analytics table
- **File:** `supabase/setup/34-platform-analytics.sql`
- **Description:** Daily aggregated platform metrics
- **Acceptance Criteria:**
  - [ ] Table created with date as primary key
  - [ ] All metric columns (dau, mau, new_posts, etc.)
  - [ ] Index on date for time-series queries
- **Estimated Time:** 1 hour

#### Task 1.1.6: Database trigger - notify_connection_request
- **File:** `supabase/setup/35-notification-triggers.sql`
- **Description:** Auto-create notification on connection request
- **Acceptance Criteria:**
  - [ ] Function created with INSERT trigger
  - [ ] Notification type = 'connect'
  - [ ] Actor = requester_id, target = receiver_id
  - [ ] Tested with sample data
- **SQL:**
  ```sql
  CREATE FUNCTION notify_connection_request() RETURNS trigger AS $$
  BEGIN
    INSERT INTO notifications (user_id, type, actor_id, content, resource_type, resource_id)
    VALUES (NEW.receiver_id, 'connect', NEW.requester_id, 
            'sent you a connection request', 'profile', NEW.requester_id);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;
  ```
- **Estimated Time:** 2 hours

#### Task 1.1.7: Database trigger - notify_post_reaction
- **File:** `supabase/setup/35-notification-triggers.sql`
- **Description:** Auto-notify on post like/reaction
- **Acceptance Criteria:**
  - [ ] Function joins posts table to get author_id
  - [ ] Notification type = 'like'
  - [ ] Tested with sample data
- **Estimated Time:** 2 hours

#### Task 1.1.8: Database trigger - notify_new_comment
- **File:** `supabase/setup/35-notification-triggers.sql`
- **Description:** Auto-notify on post comment
- **Acceptance Criteria:**
  - [ ] Function joins posts table to get author_id
  - [ ] Notification type = 'comment'
  - [ ] Tested with sample data
- **Estimated Time:** 2 hours

#### Task 1.1.9: Database trigger - notify_new_message
- **File:** `supabase/setup/35-notification-triggers.sql`
- **Description:** Auto-notify on new message
- **Acceptance Criteria:**
  - [ ] Function gets other participant from conversation
  - [ ] Notification type = 'message'
  - [ ] Tested with sample data
- **Estimated Time:** 2 hours

#### Task 1.1.10: Database trigger - notify_match_suggested
- **File:** `supabase/setup/35-notification-triggers.sql`
- **Description:** Notify user when high-confidence match found
- **Acceptance Criteria:**
  - [ ] Trigger only for match_percentage > 80
  - [ ] Notification type = 'match'
  - [ ] Includes match percentage in content
  - [ ] Tested with sample data
- **Estimated Time:** 2 hours

#### Task 1.1.11: Database trigger - capture_all_events
- **File:** `supabase/setup/36-event-capture-triggers.sql`
- **Description:** Capture all user actions to events table
- **Acceptance Criteria:**
  - [ ] Triggers on: post_reactions, comments, connections, messages, profile_views
  - [ ] Event type from TG_ARGV
  - [ ] Metadata includes full row JSON
  - [ ] Tested with sample data
- **Estimated Time:** 3 hours

#### Task 1.1.12: Database trigger - broadcast_realtime
- **File:** `supabase/setup/37-realtime-broadcast.sql`
- **Description:** pg_notify for Supabase Realtime
- **Acceptance Criteria:**
  - [ ] Function sends pg_notify on INSERT
  - [ ] Channel name = table_name:user_id
  - [ ] Payload includes full notification JSON
  - [ ] Tested with pg_listen
- **Estimated Time:** 2 hours

#### Task 1.1.13: Run all migrations in Supabase
- **File:** N/A (Supabase SQL Editor)
- **Description:** Apply all new table migrations
- **Acceptance Criteria:**
  - [ ] All 7 new tables created
  - [ ] All triggers functional
  - [ ] No SQL errors
  - [ ] RLS policies tested
- **Estimated Time:** 2 hours

#### Task 1.1.14: Verify Supabase Realtime channels
- **File:** N/A (Supabase Dashboard)
- **Description:** Enable Realtime for new tables
- **Acceptance Criteria:**
  - [ ] notifications table published
  - [ ] events table published
  - [ ] match_activity table published
  - [ ] Tested with Realtime subscription
- **Estimated Time:** 1 hour

**Day 1-2 Total:** 28 hours

---

### Week 1, Day 3-4: Python Worker - Match Generator Service

#### Task 1.2.1: Create match_generator.py skeleton
- **File:** `python-worker/services/match_generator.py`
- **Description:** Service class for match generation
- **Acceptance Criteria:**
  - [ ] Class structure with async methods
  - [ ] Supabase client initialization
  - [ ] Error handling with logging
  - [ ] Type hints throughout
- **Methods:**
  ```python
  class MatchGenerator:
      async def generate_matches_for_user(user_id: str, limit: int = 20)
      async def calculate_match_percentage(user1_data: dict, user2_data: dict) -> float
      async def find_similar_users(user_id: str, limit: int = 50) -> List[dict]
      async def generate_match_reasons(user1: dict, user2: dict) -> List[dict]
  ```
- **Estimated Time:** 3 hours

#### Task 1.2.2: Implement find_similar_users with pgvector
- **File:** `python-worker/services/match_generator.py`
- **Description:** Use pgvector <-> operator for similarity search
- **Acceptance Criteria:**
  - [ ] Query uses `<->` cosine distance
  - [ ] Filters out already connected users
  - [ ] Filters out existing suggestions (<30 days)
  - [ ] Returns top 50 candidates
  - [ ] Tested with known embeddings
- **SQL:**
  ```python
  results = await supabase.rpc(
      'find_similar_users',
      {'query_embedding': user_embedding, 'match_limit': 50, 'exclude_user_id': user_id}
  )
  ```
- **Estimated Time:** 4 hours

#### Task 1.2.3: Create SQL function find_similar_users
- **File:** `supabase/setup/38-match-sql-functions.sql`
- **Description:** Database function for vector similarity search
- **Acceptance Criteria:**
  - [ ] Function takes embedding vector as input
  - [ ] Uses `<->` operator for cosine distance
  - [ ] Returns profiles with distance score
  - [ ] Excludes blocked/connected users
  - [ ] Tested in SQL editor
- **Estimated Time:** 3 hours

#### Task 1.2.4: Implement calculate_match_percentage (rule-based)
- **File:** `python-worker/services/match_generator.py`
- **Description:** Initial rule-based scoring (ML later)
- **Acceptance Criteria:**
  - [ ] Semantic similarity: 35% weight
  - [ ] Skills overlap: 25% weight
  - [ ] Shared interests: 20% weight
  - [ ] Profile quality: 10% weight
  - [ ] Activity match: 10% weight
  - [ ] Returns breakdown + overall score
  - [ ] Tested with sample data
- **Estimated Time:** 4 hours

#### Task 1.2.5: Implement generate_match_reasons
- **File:** `python-worker/services/match_generator.py`
- **Description:** Generate human-readable match reasons
- **Acceptance Criteria:**
  - [ ] Returns array of {type, label} objects
  - [ ] Top 3-5 reasons per match
  - [ ] Includes skill overlap details
  - [ ] Includes shared interests
  - [ ] Tested with sample profiles
- **Example Output:**
  ```json
  [
    {"type": "skill", "label": "Complementary Skills (Backend ↔ Frontend)"},
    {"type": "interest", "label": "Shared: Fintech, AI/ML"},
    {"type": "goal", "label": "Both looking for cofounder"}
  ]
  ```
- **Estimated Time:** 3 hours

#### Task 1.2.6: Implement generate_matches_for_user
- **File:** `python-worker/services/match_generator.py`
- **Description:** Main orchestration method
- **Acceptance Criteria:**
  - [ ] Fetches user profile + embedding
  - [ ] Calls find_similar_users
  - [ ] Calculates percentage for each candidate
  - [ ] Generates reasons
  - [ ] Inserts into match_suggestions
  - [ ] Inserts breakdown into match_scores
  - [ ] Returns count of suggestions created
- **Estimated Time:** 4 hours

#### Task 1.2.7: Add match generation to main.py queue processor
- **File:** `python-worker/main.py`
- **Description:** Integrate match generator into worker loop
- **Acceptance Criteria:**
  - [ ] New endpoint: POST /matches/generate
  - [ ] New endpoint: POST /matches/generate/batch
  - [ ] Background task runs daily for all users
  - [ ] Rate limited (10 users/minute)
  - [ ] Error handling with DLQ
- **Estimated Time:** 3 hours

#### Task 1.2.8: Create API endpoint - generate matches for user
- **File:** `python-worker/main.py`
- **Description:** Manual trigger for match generation
- **Acceptance Criteria:**
  - [ ] POST /api/matches/generate
  - [ ] Auth required (service role key)
  - [ ] Body: {user_id, limit}
  - [ ] Returns: {suggestions_created, matches: []}
  - [ ] Tested with curl
- **Estimated Time:** 2 hours

#### Task 1.2.9: Create API endpoint - batch generate for all users
- **File:** `python-worker/main.py`
- **Description:** Daily batch job endpoint
- **Acceptance Criteria:**
  - [ ] POST /api/matches/generate/batch
  - [ ] Auth required
  - [ ] Processes users without recent suggestions
  - [ ] Returns: {processed_count, failed_count}
  - [ ] Timeout: 5 minutes
- **Estimated Time:** 3 hours

#### Task 1.2.10: Write unit tests for match_generator.py
- **File:** `python-worker/tests/test_match_generator.py`
- **Description:** Test coverage for match generation
- **Acceptance Criteria:**
  - [ ] Test find_similar_users
  - [ ] Test calculate_match_percentage
  - [ ] Test generate_match_reasons
  - [ ] Test generate_matches_for_user
  - [ ] >90% code coverage
  - [ ] All tests passing
- **Estimated Time:** 4 hours

#### Task 1.2.11: Write integration tests for match API
- **File:** `python-worker/tests/test_match_api.py`
- **Description:** End-to-end API tests
- **Acceptance Criteria:**
  - [ ] Test POST /api/matches/generate
  - [ ] Test batch endpoint
  - [ ] Test auth validation
  - [ ] Test rate limiting
  - [ ] All tests passing
- **Estimated Time:** 3 hours

**Day 3-4 Total:** 36 hours

---

### Week 1, Day 5-6: Python Worker - Notification Engine

#### Task 1.3.1: Create notification_engine.py skeleton
- **File:** `python-worker/services/notification_engine.py`
- **Description:** Service for smart notification processing
- **Acceptance Criteria:**
  - [ ] Class structure with async methods
  - [ ] Supabase client initialization
  - [ ] Priority queue implementation
  - [ ] Type hints throughout
- **Methods:**
  ```python
  class NotificationEngine:
      async def send_notification(user_id: str, type: str, actor_id: str, content: str)
      async def send_batched_notifications(user_id: str)
      async def send_daily_digest(user_id: str)
      async def cleanup_old_notifications(days: int = 30)
  ```
- **Estimated Time:** 3 hours

#### Task 1.3.2: Implement send_notification
- **File:** `python-worker/services/notification_engine.py`
- **Description:** Send single notification with priority
- **Acceptance Criteria:**
  - [ ] Inserts into notifications table
  - [ ] Sets priority based on type
  - [ ] Broadcasts via Realtime
  - [ ] Returns notification ID
  - [ ] Tested with sample data
- **Priority Mapping:**
  ```python
  HIGH = ['message', 'match', 'connection_accepted']
  MEDIUM = ['connection_request', 'like', 'comment']
  LOW = ['profile_view', 'weekly_summary']
  ```
- **Estimated Time:** 3 hours

#### Task 1.3.3: Implement notification batching
- **File:** `python-worker/services/notification_engine.py`
- **Description:** Batch medium-priority notifications
- **Acceptance Criteria:**
  - [ ] Queues MEDIUM notifications for 5min batch
  - [ ] Combines multiple likes into "X and Y liked your post"
  - [ ] Sends batch after timeout or count threshold
  - [ ] Tested with multiple events
- **Estimated Time:** 4 hours

#### Task 1.3.4: Implement daily_digest
- **File:** `python-worker/services/notification_engine.py`
- **Description:** Compile daily activity summary
- **Acceptance Criteria:**
  - [ ] Runs at 8 AM local time
  - [ ] Includes: profile views, new matches, trending posts
  - [ ] Creates single digest notification
  - [ ] Respects user preferences (opt-out)
  - [ ] Tested with sample data
- **Estimated Time:** 4 hours

#### Task 1.3.5: Implement cleanup_old_notifications
- **File:** `python-worker/services/notification_engine.py`
- **Description:** Archive/delete old notifications
- **Acceptance Criteria:**
  - [ ] Deletes notifications >30 days old
  - [ ] Archives to notification_archive table (optional)
  - [ ] Runs weekly
  - [ ] Logs count deleted
  - [ ] Tested safely
- **Estimated Time:** 2 hours

#### Task 1.3.6: Add notification endpoints to main.py
- **File:** `python-worker/main.py`
- **Description:** API endpoints for notification management
- **Acceptance Criteria:**
  - [ ] POST /api/notifications/send (manual trigger)
  - [ ] POST /api/notifications/digest/send (send digest)
  - [ ] POST /api/notifications/cleanup (admin only)
  - [ ] All endpoints authenticated
  - [ ] Tested with curl
- **Estimated Time:** 3 hours

#### Task 1.3.7: Write unit tests for notification_engine.py
- **File:** `python-worker/tests/test_notification_engine.py`
- **Description:** Test coverage for notifications
- **Acceptance Criteria:**
  - [ ] Test send_notification
  - [ ] Test batching logic
  - [ ] Test daily digest
  - [ ] Test cleanup
  - [ ] >90% coverage
  - [ ] All tests passing
- **Estimated Time:** 3 hours

**Day 5-6 Total:** 22 hours

---

### Week 1, Day 7-8: Python Worker - Activity Tracker

#### Task 1.4.1: Create activity_tracker.py skeleton
- **File:** `python-worker/services/activity_tracker.py`
- **Description:** Service for match activity tracking
- **Acceptance Criteria:**
  - [ ] Class structure with async methods
  - [ ] Supabase client initialization
  - [ ] Type hints throughout
- **Methods:**
  ```python
  class ActivityTracker:
      async def track_profile_view(viewer_id: str, target_id: str)
      async def track_match_building(user_id: str, matched_user_id: str)
      async def get_activity_feed(user_id: str, limit: int = 20)
      async def cleanup_old_activity(days: int = 30)
  ```
- **Estimated Time:** 2 hours

#### Task 1.4.2: Implement track_profile_view
- **File:** `python-worker/services/activity_tracker.py`
- **Description:** Log profile view with deduplication
- **Acceptance Criteria:**
  - [ ] Checks if view already tracked in last 24h
  - [ ] Inserts into match_activity table
  - [ ] Type = 'profile_view'
  - [ ] Activity = 'viewed your profile'
  - [ ] Returns activity ID
  - [ ] Tested with duplicate prevention
- **Estimated Time:** 3 hours

#### Task 1.4.3: Implement track_match_building
- **File:** `python-worker/services/activity_tracker.py`
- **Description:** Track when match is being built
- **Acceptance Criteria:**
  - [ ] Inserts into match_activity table
  - [ ] Type = 'building_match'
  - [ ] Activity = 'is building a match with you'
  - [ ] Includes match percentage
  - [ ] Tested with sample data
- **Estimated Time:** 2 hours

#### Task 1.4.4: Implement get_activity_feed
- **File:** `python-worker/services/activity_tracker.py`
- **Description:** Retrieve activity feed for dashboard
- **Acceptance Criteria:**
  - [ ] Queries match_activity table
  - [ ] Joins with profiles for actor info
  - [ ] Orders by created_at DESC
  - [ ] Returns formatted activity items
  - [ ] Tested with sample data
- **Estimated Time:** 3 hours

#### Task 1.4.5: Add activity tracker endpoints to main.py
- **File:** `python-worker/main.py`
- **Description:** API endpoints for activity tracking
- **Acceptance Criteria:**
  - [ ] POST /api/activity/track/view (track profile view)
  - [ ] POST /api/activity/track/build (track match building)
  - [ ] GET /api/activity/feed (get user's feed)
  - [ ] All endpoints authenticated
  - [ ] Tested with curl
- **Estimated Time:** 3 hours

#### Task 1.4.6: Integrate profile view tracking with frontend
- **File:** `components/features/profile/profile-view.tsx`
- **Description:** Call tracking API when viewing profile
- **Acceptance Criteria:**
  - [ ] useEffect calls track_profile_view on mount
  - [ ] Debounced (only track after 2s view)
  - [ ] Error handling (don't block UI)
  - [ ] Tested in browser
- **Estimated Time:** 2 hours

#### Task 1.4.7: Write unit tests for activity_tracker.py
- **File:** `python-worker/tests/test_activity_tracker.py`
- **Description:** Test coverage for activity tracking
- **Acceptance Criteria:**
  - [ ] Test track_profile_view (with dedup)
  - [ ] Test track_match_building
  - [ ] Test get_activity_feed
  - [ ] >90% coverage
  - [ ] All tests passing
- **Estimated Time:** 3 hours

**Day 7-8 Total:** 18 hours

---

### Week 2, Day 9-10: Frontend Integration & Testing

#### Task 1.5.1: Update matches page to show suggestions
- **File:** `app/(auth)/matches/page.tsx`
- **Description:** Display match suggestions from new API
- **Acceptance Criteria:**
  - [ ] Fetches from /api/matches/suggestions
  - [ ] Shows match percentage badge
  - [ ] Displays match reasons
  - [ ] Shows match score breakdown
  - [ ] Empty state if no suggestions
  - [ ] Loading skeleton
  - [ ] Tested in browser
- **Estimated Time:** 4 hours

#### Task 1.5.2: Add match score breakdown UI
- **File:** `components/features/matches/match-score-breakdown.tsx`
- **Description:** Component showing detailed score breakdown
- **Acceptance Criteria:**
  - [ ] Shows semantic similarity %
  - [ ] Shows skills overlap %
  - [ ] Shows shared interests %
  - [ ] Visual progress bars
  - [ ] Tooltip explanations
  - [ ] Tested in Storybook
- **Estimated Time:** 3 hours

#### Task 1.5.3: Update notifications hook for real-time
- **File:** `hooks/use-notifications.ts`
- **Description:** Subscribe to Supabase Realtime for notifications
- **Acceptance Criteria:**
  - [ ] Subscribes to `notifications:user_id` channel
  - [ ] Updates query cache on INSERT
  - [ ] Plays notification sound
  - [ ] Shows toast on new notification
  - [ ] Cleanup on unmount
  - [ ] Tested in browser
- **Estimated Time:** 3 hours

#### Task 1.5.4: Add notification sound
- **File:** `components/shared/notification-sound.tsx`
- **Description:** Play sound on new notification
- **Acceptance Criteria:**
  - [ ] Audio file in /public/sounds/
  - [ ] Play function with volume control
  - [ ] Respects user preferences (mute option)
  - [ ] No sound if tab is active (optional)
  - [ ] Tested in browser
- **Estimated Time:** 2 hours

#### Task 1.5.5: Update dashboard sidebar with match activity
- **File:** `components/features/dashboard/activity-feed.tsx`
- **Description:** Show recent match activity in sidebar
- **Acceptance Criteria:**
  - [ ] Fetches from /api/activity/feed
  - [ ] Shows last 5 activities
  - [ ] Icons for each activity type
  - [ ] Timestamps (relative time)
  - [ ] Link to full activity page
  - [ ] Tested in browser
- **Estimated Time:** 3 hours

#### Task 1.5.6: Add notification badge to sidebar
- **File:** `components/shared/mobile-nav.tsx`
- **Description:** Show unread notification count
- **Acceptance Criteria:**
  - [ ] Badge shows count of unread notifications
  - [ ] Updates in real-time
  - [ ] Max display: 99+
  - [ ] Click navigates to notifications page
  - [ ] Tested in browser
- **Estimated Time:** 2 hours

#### Task 1.5.7: Integration test - full match flow
- **File:** `python-worker/tests/test_integration.py`
- **Description:** End-to-end test of match generation
- **Acceptance Criteria:**
  - [ ] Create test users with embeddings
  - [ ] Trigger match generation
  - [ ] Verify match_suggestions populated
  - [ ] Verify match_scores populated
  - [ ] Verify notifications sent
  - [ ] Verify activity tracked
  - [ ] All assertions passing
- **Estimated Time:** 4 hours

#### Task 1.5.8: Load test - match generation
- **File:** `python-worker/tests/test_load.py`
- **Description:** Performance test for batch match generation
- **Acceptance Criteria:**
  - [ ] Generate matches for 100 users
  - [ ] Measure time per user
  - [ ] P95 latency <5s
  - [ ] No memory leaks
  - [ ] CPU usage <80%
  - [ ] Report generated
- **Estimated Time:** 3 hours

#### Task 1.5.9: Documentation - match scoring system
- **File:** `docs/03-core-features/match-scoring.md`
- **Description:** Document match scoring algorithm
- **Acceptance Criteria:**
  - [ ] Algorithm explanation
  - [ ] Feature breakdown
  - [ ] API reference
  - [ ] Example responses
  - [ ] Troubleshooting guide
- **Estimated Time:** 2 hours

#### Task 1.5.10: Documentation - notifications system
- **File:** `docs/03-core-features/notifications.md`
- **Description:** Document notification system
- **Acceptance Criteria:**
  - [ ] Architecture diagram
  - [ ] Notification types
  - [ ] Priority levels
  - [ ] API reference
  - [ ] Frontend integration guide
- **Estimated Time:** 2 hours

#### Task 1.5.11: Phase 1 demo preparation
- **File:** N/A
- **Description:** Prepare demo for stakeholder review
- **Acceptance Criteria:**
  - [ ] Demo script written
  - [ ] Test data prepared
  - [ ] Screenshots captured
  - [ ] Metrics dashboard ready
  - [ ] Known issues documented
- **Estimated Time:** 3 hours

#### Task 1.5.12: Phase 1 retrospective
- **File:** N/A
- **Description:** Team retrospective for Phase 1
- **Acceptance Criteria:**
  - [ ] What went well documented
  - [ ] What could be improved
  - [ ] Action items for Phase 2
  - [ ] Timeline adjustment if needed
- **Estimated Time:** 2 hours

**Day 9-10 Total:** 33 hours

---

**Phase 1 Total: 137 hours (~17 working days)**

---

## 🎯 Phase 2: Feed Personalization & Content Safety (Week 3)

**Duration:** 5 working days  
**Priority:** HIGH  
**Success Criteria:** Feed personalized, content moderated, engagement up 20%

---

### Week 3, Day 1-2: Feed Scoring Service

#### Task 2.1.1: Create feed_scorer.py skeleton
- **File:** `python-worker/services/feed_scorer.py`
- **Description:** Service for feed ranking
- **Acceptance Criteria:**
  - [ ] Class structure with async methods
  - [ ] Supabase client initialization
  - [ ] Type hints throughout
- **Methods:**
  ```python
  class FeedScorer:
      async def calculate_feed_score(user_id: str, post_id: str) -> float
      async def get_personalized_feed(user_id: str, limit: int = 20) -> List[dict]
      async def compute_all_user_scores(user_id: str)
      async def update_trending_posts()
  ```
- **Estimated Time:** 3 hours

#### Task 2.1.2: Implement Thompson Sampling for engagement
- **File:** `python-worker/services/feed_scorer.py`
- **Description:** Thompson Sampling algorithm for engagement prediction
- **Acceptance Criteria:**
  - [ ] Beta distribution sampling
  - [ ] Successes = engagements, Failures = impressions - engagements
  - [ ] N samples = 1000
  - [ ] Returns mean engagement rate
  - [ ] Tested with known data
- **Code:**
  ```python
  def thompson_sample(successes, failures, n_samples=1000):
      samples = np.random.beta(successes + 1, failures + 1, n_samples)
      return np.mean(samples)
  ```
- **Estimated Time:** 4 hours

#### Task 2.1.3: Implement hybrid scoring formula
- **File:** `python-worker/services/feed_scorer.py`
- **Description:** Combine all scoring factors
- **Acceptance Criteria:**
  - [ ] Semantic: 35% (cosine similarity)
  - [ ] Engagement: 30% (Thompson Sampling)
  - [ ] Recency: 20% (exponential decay)
  - [ ] Connection: 15% (1.5x boost)
  - [ ] Returns final score 0-1
  - [ ] Tested with sample data
- **Formula:**
  ```python
  score = (
      0.35 * semantic +
      0.30 * engagement +
      0.20 * recency +
      0.15 * connection
  ) * interest_boost * intent_boost
  ```
- **Estimated Time:** 4 hours

#### Task 2.1.4: Implement get_personalized_feed
- **File:** `python-worker/services/feed_scorer.py`
- **Description:** Main feed retrieval method
- **Acceptance Criteria:**
  - [ ] Fetches candidate posts (last 7 days)
  - [ ] Calculates score for each
  - [ ] Sorts by score DESC
  - [ ] Returns top N posts
  - [ ] Caches in feed_scores table
  - [ ] Tested with sample data
- **Estimated Time:** 4 hours

#### Task 2.1.5: Add feed API endpoint
- **File:** `python-worker/main.py`
- **Description:** API endpoint for personalized feed
- **Acceptance Criteria:**
  - [ ] GET /api/feed/personalized
  - [ ] Query params: limit, offset
  - [ ] Auth required (user session)
  - [ ] Returns scored posts
  - [ ] Tested with curl
- **Estimated Time:** 2 hours

#### Task 2.1.6: Write unit tests for feed_scorer.py
- **File:** `python-worker/tests/test_feed_scorer.py`
- **Description:** Test coverage for feed scoring
- **Acceptance Criteria:**
  - [ ] Test Thompson Sampling
  - [ ] Test hybrid scoring
  - [ ] Test get_personalized_feed
  - [ ] >90% coverage
  - [ ] All tests passing
- **Estimated Time:** 3 hours

**Day 1-2 Total:** 20 hours

---

### Week 3, Day 3-4: Content Moderation Service

#### Task 2.2.1: Get Perspective API key
- **File:** N/A (Google Cloud Console)
- **Description:** Set up Google Perspective API
- **Acceptance Criteria:**
  - [ ] Google Cloud account created
  - [ ] Perspective API enabled
  - [ ] API key generated
  - [ ] Added to environment variables
  - [ ] Quota verified (1M chars free tier)
- **Estimated Time:** 1 hour

#### Task 2.2.2: Create content_moderator.py skeleton
- **File:** `python-worker/services/content_moderator.py`
- **Description:** Service for content moderation
- **Acceptance Criteria:**
  - [ ] Class structure with async methods
  - [ ] Perspective API client init
  - [ ] Hugging Face pipeline init
  - [ ] Type hints throughout
- **Methods:**
  ```python
  class ContentModerator:
      async def moderate_content(content: str, content_type: str) -> dict
      async def check_toxicity(text: str) -> float
      async def check_spam(text: str) -> float
      async def check_nsfw(text: str) -> float
      async def check_pii(text: str) -> bool
  ```
- **Estimated Time:** 3 hours

#### Task 2.2.3: Install Perspective API client
- **File:** `python-worker/requirements.txt`
- **Description:** Add Perspective API dependency
- **Acceptance Criteria:**
  - [ ] Add `google-api-python-client` to requirements
  - [ ] Run pip install
  - [ ] Verify import works
  - [ ] Update Dockerfile if needed
- **Estimated Time:** 0.5 hours

#### Task 2.2.4: Implement check_toxicity
- **File:** `python-worker/services/content_moderator.py`
- **Description:** Toxicity detection with Perspective API
- **Acceptance Criteria:**
  - [ ] Calls Perspective API analyze_comment
  - [ ] Requests: TOXICITY, SEVERE_TOXICITY, IDENTITY_ATTACK, INSULT, THREAT
  - [ ] Returns max score 0-1
  - [ ] Caches results (same text)
  - [ ] Handles API errors gracefully
  - [ ] Tested with known toxic text
- **Estimated Time:** 4 hours

#### Task 2.2.5: Implement check_spam
- **File:** `python-worker/services/content_moderator.py`
- **Description:** Spam detection with Hugging Face
- **Acceptance Criteria:**
  - [ ] Uses zero-shot classification
  - [ ] Labels: ['spam', 'legitimate']
  - [ ] Returns spam probability
  - [ ] Caches results
  - [ ] Tested with known spam
- **Estimated Time:** 3 hours

#### Task 2.2.6: Implement check_nsfw
- **File:** `python-worker/services/content_moderator.py`
- **Description:** NSFW text detection
- **Acceptance Criteria:**
  - [ ] Uses keyword matching + ML
  - [ ] Returns NSFW probability
  - [ ] Tested with known NSFW text
- **Estimated Time:** 2 hours

#### Task 2.2.7: Implement check_pii
- **File:** `python-worker/services/content_moderator.py`
- **Description:** Personal information detection
- **Acceptance Criteria:**
  - [ ] Regex for: email, phone, address, SSN
  - [ ] Returns True if PII detected
  - [ ] Tested with sample PII
- **Estimated Time:** 2 hours

#### Task 2.2.8: Implement moderate_content (orchestration)
- **File:** `python-worker/services/content_moderator.py`
- **Description:** Main moderation orchestration
- **Acceptance Criteria:**
  - [ ] Calls all check methods
  - [ ] Calculates risk score (weighted average)
  - [ ] Returns: approved/flag/reject decision
  - [ ] Includes detailed breakdown
  - [ ] Tested with various content
- **Decision Logic:**
  ```python
  if risk_score < 0.3: return "approved"
  elif risk_score < 0.7: return "flag_for_review"
  else: return "auto_reject"
  ```
- **Estimated Time:** 3 hours

#### Task 2.2.9: Add content moderation to post creation flow
- **File:** `components/features/post/actions.ts`
- **Description:** Call moderation before publishing post
- **Acceptance Criteria:**
  - [ ] Server action calls /api/moderate
  - [ ] Blocks post if auto_reject
  - [ ] Shows warning if flag_for_review
  - [ ] Proceeds if approved
  - [ ] Error handling
  - [ ] Tested in browser
- **Estimated Time:** 3 hours

#### Task 2.2.10: Add moderation API endpoint
- **File:** `python-worker/main.py`
- **Description:** API endpoint for content moderation
- **Acceptance Criteria:**
  - [ ] POST /api/moderate
  - [ ] Body: {content, content_type}
  - [ ] Returns moderation result
  - [ ] Rate limited (100 req/min)
  - [ ] Tested with curl
- **Estimated Time:** 2 hours

#### Task 2.2.11: Create manual review queue UI
- **File:** `app/(auth)/admin/moderation-queue/page.tsx`
- **Description:** Admin page for flagged content
- **Acceptance Criteria:**
  - [ ] Shows flagged posts/comments
  - [ ] Displays moderation scores
  - [ ] Approve/Reject buttons
  - [ ] Admin auth required
  - [ ] Tested in browser
- **Estimated Time:** 4 hours

#### Task 2.2.12: Write unit tests for content_moderator.py
- **File:** `python-worker/tests/test_content_moderator.py`
- **Description:** Test coverage for moderation
- **Acceptance Criteria:**
  - [ ] Test check_toxicity
  - [ ] Test check_spam
  - [ ] Test check_nsfw
  - [ ] Test check_pii
  - [ ] Test moderate_content
  - [ ] >90% coverage
  - [ ] All tests passing
- **Estimated Time:** 4 hours

**Day 3-4 Total:** 31.5 hours

---

### Week 3, Day 5: Frontend Integration & Testing

#### Task 2.3.1: Update dashboard feed to use personalized API
- **File:** `app/(auth)/dashboard/page.tsx`
- **Description:** Switch from chronological to personalized feed
- **Acceptance Criteria:**
  - [ ] Fetches from /api/feed/personalized
  - [ ] Shows posts in score order
  - [ ] Loading skeleton
  - [ ] Empty state
  - [ ] Infinite scroll works
  - [ ] Tested in browser
- **Estimated Time:** 3 hours

#### Task 2.3.2: Add feed score debugging (dev only)
- **File:** `components/features/dashboard/feed-score-debug.tsx`
- **Description:** Show why each post was shown (dev mode)
- **Acceptance Criteria:**
  - [ ] Shows score breakdown
  - [ ] Only visible in dev mode
  - [ ] Toggle button
  - [ ] Tested in browser
- **Estimated Time:** 2 hours

#### Task 2.3.3: Add content moderation loading state
- **File:** `components/features/post/post-form.tsx`
- **Description:** Show moderation in progress
- **Acceptance Criteria:**
  - [ ] Spinner during moderation check
  - [ ] "Checking content..." message
  - [ ] Disabled submit button
  - [ ] Tested in browser
- **Estimated Time:** 2 hours

#### Task 2.3.4: Add moderation rejection UI
- **File:** `components/features/post/moderation-rejection.tsx`
- **Description:** Show why content was rejected
- **Acceptance Criteria:**
  - [ ] Dialog/modal on rejection
  - [ ] Shows violation type
  - [ ] Shows score breakdown
  - [ ] Appeal link (optional)
  - [ ] Tested in browser
- **Estimated Time:** 3 hours

#### Task 2.3.5: Integration test - feed personalization
- **File:** `python-worker/tests/test_feed_integration.py`
- **Description:** End-to-end feed test
- **Acceptance Criteria:**
  - [ ] Create test user with preferences
  - [ ] Create test posts
  - [ ] Fetch personalized feed
  - [ ] Verify ranking order
  - [ ] Verify score caching
  - [ ] All assertions passing
- **Estimated Time:** 3 hours

#### Task 2.3.6: Load test - feed generation
- **File:** `python-worker/tests/test_feed_load.py`
- **Description:** Performance test for feed
- **Acceptance Criteria:**
  - [ ] Generate feed for 100 users
  - [ ] P95 latency <500ms
  - [ ] No memory leaks
  - [ ] Report generated
- **Estimated Time:** 3 hours

#### Task 2.3.7: Documentation - feed ranking
- **File:** `docs/03-core-features/feed-ranking.md`
- **Description:** Document feed algorithm
- **Acceptance Criteria:**
  - [ ] Thompson Sampling explanation
  - [ ] Scoring formula
  - [ ] API reference
  - [ ] Cold start strategy
  - [ ] Troubleshooting
- **Estimated Time:** 2 hours

#### Task 2.3.8: Documentation - content moderation
- **File:** `docs/03-core-features/content-moderation.md`
- **Description:** Document moderation system
- **Acceptance Criteria:**
  - [ ] Pipeline architecture
  - [ ] Models used
  - [ ] Thresholds
  - [ ] API reference
  - [ ] Admin guide
- **Estimated Time:** 2 hours

#### Task 2.3.9: Phase 2 demo preparation
- **File:** N/A
- **Description:** Prepare demo for stakeholder review
- **Acceptance Criteria:**
  - [ ] Demo script written
  - [ ] Test data prepared
  - [ ] Screenshots captured
  - [ ] Metrics dashboard ready
  - [ ] Known issues documented
- **Estimated Time:** 3 hours

#### Task 2.3.10: Phase 2 retrospective
- **File:** N/A
- **Description:** Team retrospective for Phase 2
- **Acceptance Criteria:**
  - [ ] What went well documented
  - [ ] What could be improved
  - [ ] Action items for Phase 3
  - [ ] Timeline adjustment if needed
- **Estimated Time:** 2 hours

**Day 5 Total:** 25 hours

---

**Phase 2 Total: 76.5 hours (~10 working days)**

---

## 🎯 Phase 3: AI Mentor & Event Processing (Week 4)

**Duration:** 5 working days  
**Priority:** MEDIUM  
**Success Criteria:** AI mentor functional, events captured, sessions summarized

---

### Week 4, Day 1-2: AI Mentor with Gemini

#### Task 3.1.1: Get Gemini API key
- **File:** N/A (Google AI Studio)
- **Description:** Set up Google Gemini API
- **Acceptance Criteria:**
  - [ ] Google AI Studio account created
  - [ ] Gemini API key generated
  - [ ] Added to environment variables
  - [ ] Quota verified (60 req/min free)
- **Estimated Time:** 1 hour

#### Task 3.1.2: Create ai_mentor_processor.py skeleton
- **File:** `python-worker/services/ai_mentor_processor.py`
- **Description:** Service for AI mentor processing
- **Acceptance Criteria:**
  - [ ] Class structure with async methods
  - [ ] Gemini client initialization
  - [ ] Type hints throughout
- **Methods:**
  ```python
  class AIMentorProcessor:
      async def generate_response(user_id: str, message: str, context: dict) -> dict
      async def summarize_session(session_id: str, messages: list) -> dict
      async def extract_action_items(text: str) -> list
      async def save_insight_to_profile(message_id: str)
  ```
- **Estimated Time:** 3 hours

#### Task 3.1.3: Install Gemini SDK
- **File:** `python-worker/requirements.txt`
- **Description:** Add Google Generative AI dependency
- **Acceptance Criteria:**
  - [ ] Add `google-generativeai` to requirements
  - [ ] Run pip install
  - [ ] Verify import works
- **Estimated Time:** 0.5 hours

#### Task 3.1.4: Implement generate_response
- **File:** `python-worker/services/ai_mentor_processor.py`
- **Description:** Generate AI mentor response
- **Acceptance Criteria:**
  - [ ] Fetches user profile context
  - [ ] Builds system prompt with context
  - [ ] Calls Gemini API
  - [ ] Returns response text
  - [ ] Saves to ai_mentor_messages
  - [ ] Tested with sample conversation
- **Estimated Time:** 4 hours

#### Task 3.1.5: Implement summarize_session
- **File:** `python-worker/services/ai_mentor_processor.py`
- **Description:** Summarize completed session
- **Acceptance Criteria:**
  - [ ] Takes conversation history
  - [ ] Calls Gemini for summary
  - [ ] Extracts top 3 action items
  - [ ] Identifies skills to save
  - [ ] Returns structured summary
  - [ ] Tested with sample session
- **Estimated Time:** 4 hours

#### Task 3.1.6: Implement extract_action_items
- **File:** `python-worker/services/ai_mentor_processor.py`
- **Description:** Parse action items from response
- **Acceptance Criteria:**
  - [ ] Regex/ML extraction
  - [ ] Returns list of {task, priority}
  - [ ] Tested with sample text
- **Estimated Time:** 2 hours

#### Task 3.1.7: Implement save_insight_to_profile
- **File:** `python-worker/services/ai_mentor_processor.py`
- **Description:** Save user insights to profile
- **Acceptance Criteria:**
  - [ ] Extracts skills from message
  - [ ] Adds to user_skills if not exists
  - [ ] Logs to profile
  - [ ] Tested with sample data
- **Estimated Time:** 3 hours

#### Task 3.1.8: Add AI mentor endpoints to main.py
- **File:** `python-worker/main.py`
- **Description:** API endpoints for AI mentor
- **Acceptance Criteria:**
  - [ ] POST /api/ai-mentor/message (send message)
  - [ ] POST /api/ai-mentor/session/summarize (end session)
  - [ ] GET /api/ai-mentor/session/:id (get session)
  - [ ] All authenticated
  - [ ] Tested with curl
- **Estimated Time:** 3 hours

#### Task 3.1.9: Update AI mentor frontend UI
- **File:** `app/(auth)/assistant/page.tsx`
- **Description:** Connect frontend to new Gemini backend
- **Acceptance Criteria:**
  - [ ] Sends messages to new API
  - [ ] Shows streaming response (if supported)
  - [ ] Session summary UI
  - [ ] Action items display
  - [ ] Tested in browser
- **Estimated Time:** 4 hours

#### Task 3.1.10: Write unit tests for ai_mentor_processor.py
- **File:** `python-worker/tests/test_ai_mentor.py`
- **Description:** Test coverage for AI mentor
- **Acceptance Criteria:**
  - [ ] Test generate_response
  - [ ] Test summarize_session
  - [ ] Test extract_action_items
  - [ ] >90% coverage
  - [ ] All tests passing
- **Estimated Time:** 3 hours

**Day 1-2 Total:** 27.5 hours

---

### Week 4, Day 3-4: Event Processing Pipeline

#### Task 3.2.1: Create event_processor.py skeleton
- **File:** `python-worker/services/event_processor.py`
- **Description:** Service for real-time event processing
- **Acceptance Criteria:**
  - [ ] Class structure with async methods
  - [ ] Supabase Realtime client
  - [ ] Type hints throughout
- **Methods:**
  ```python
  class EventProcessor:
      async def start_listening()
      async def process_event(event: dict)
      async def handle_engagement(event: dict)
      async def handle_network_change(event: dict)
      async def handle_communication(event: dict)
  ```
- **Estimated Time:** 3 hours

#### Task 3.2.2: Implement Realtime listener
- **File:** `python-worker/workers/realtime_listener.py`
- **Description:** Listen to Supabase Realtime channels
- **Acceptance Criteria:**
  - [ ] Subscribes to `events:*` channel
  - [ ] Routes events to handlers
  - [ ] Error handling with reconnection
  - [ ] Logs all events
  - [ ] Tested with sample events
- **Estimated Time:** 4 hours

#### Task 3.2.3: Implement handle_engagement
- **File:** `python-worker/services/event_processor.py`
- **Description:** Process post reactions/comments
- **Acceptance Criteria:**
  - [ ] Updates user activity score
  - [ ] Checks if post trending
  - [ ] Triggers notification
  - [ ] Tested with sample event
- **Estimated Time:** 3 hours

#### Task 3.2.4: Implement handle_network_change
- **File:** `python-worker/services/event_processor.py`
- **Description:** Process connection events
- **Acceptance Criteria:**
  - [ ] Updates network graph
  - [ ] Recalculates mutual connections
  - [ ] Triggers match recalculation
  - [ ] Tested with sample event
- **Estimated Time:** 3 hours

#### Task 3.2.5: Implement handle_communication
- **File:** `python-worker/services/event_processor.py`
- **Description:** Process message events
- **Acceptance Criteria:**
  - [ ] Updates conversation activity
  - [ ] Tracks response time
  - [ ] Triggers notification
  - [ ] Tested with sample event
- **Estimated Time:** 3 hours

#### Task 3.2.6: Add event analytics endpoint
- **File:** `python-worker/main.py`
- **Description:** API for event analytics
- **Acceptance Criteria:**
  - [ ] GET /api/events/user/:id (user events)
  - [ ] GET /api/events/platform (platform stats)
  - [ ] Query params: start_date, end_date, event_type
  - [ ] Authenticated
  - [ ] Tested with curl
- **Estimated Time:** 3 hours

#### Task 3.2.7: Write unit tests for event_processor.py
- **File:** `python-worker/tests/test_event_processor.py`
- **Description:** Test coverage for event processing
- **Acceptance Criteria:**
  - [ ] Test event routing
  - [ ] Test each handler
  - [ ] >90% coverage
  - [ ] All tests passing
- **Estimated Time:** 3 hours

**Day 3-4 Total:** 22 hours

---

### Week 4, Day 5: Testing & Documentation

#### Task 3.3.1: Integration test - AI mentor session
- **File:** `python-worker/tests/test_ai_mentor_integration.py`
- **Description:** End-to-end AI mentor test
- **Acceptance Criteria:**
  - [ ] Start new session
  - [ ] Send 5 messages
  - [ ] Summarize session
  - [ ] Verify action items extracted
  - [ ] All assertions passing
- **Estimated Time:** 3 hours

#### Task 3.3.2: Integration test - event pipeline
- **File:** `python-worker/tests/test_event_integration.py`
- **Description:** End-to-end event capture test
- **Acceptance Criteria:**
  - [ ] Trigger post reaction
  - [ ] Verify event captured
  - [ ] Verify handler called
  - [ ] Verify analytics updated
  - [ ] All assertions passing
- **Estimated Time:** 3 hours

#### Task 3.3.3: Documentation - AI mentor
- **File:** `docs/03-core-features/ai-mentor.md`
- **Description:** Document AI mentor system
- **Acceptance Criteria:**
  - [ ] Gemini integration guide
  - [ ] Session flow diagram
  - [ ] API reference
  - [ ] Context injection details
  - [ ] Troubleshooting
- **Estimated Time:** 2 hours

#### Task 3.3.4: Documentation - event processing
- **File:** `docs/04-infrastructure/event-processing.md`
- **Description:** Document event pipeline
- **Acceptance Criteria:**
  - [ ] Architecture diagram
  - [ ] Event types list
  - [ ] Handler descriptions
  - [ ] API reference
  - [ ] Monitoring guide
- **Estimated Time:** 2 hours

#### Task 3.3.5: Phase 3 demo preparation
- **File:** N/A
- **Description:** Prepare demo for stakeholder review
- **Acceptance Criteria:**
  - [ ] Demo script written
  - [ ] Test data prepared
  - [ ] Screenshots captured
  - [ ] Metrics dashboard ready
  - [ ] Known issues documented
- **Estimated Time:** 3 hours

#### Task 3.3.6: Phase 3 retrospective
- **File:** N/A
- **Description:** Team retrospective for Phase 3
- **Acceptance Criteria:**
  - [ ] What went well documented
  - [ ] What could be improved
  - [ ] Action items for Phase 4
  - [ ] Timeline adjustment if needed
- **Estimated Time:** 2 hours

**Day 5 Total:** 15 hours

---

**Phase 3 Total: 64.5 hours (~8 working days)**

---

## 🎯 Phase 4: Analytics & Optimization (Week 5)

**Duration:** 5 working days  
**Priority:** LOW  
**Success Criteria:** Analytics populated, insights generated, system optimized

---

### Week 5, Day 1-2: Analytics Aggregation

#### Task 4.1.1: Create analytics_aggregator.py skeleton
- **File:** `python-worker/services/analytics_aggregator.py`
- **Description:** Service for analytics aggregation
- **Acceptance Criteria:**
  - [ ] Class structure with async methods
  - [ ] Supabase client initialization
  - [ ] Type hints throughout
- **Methods:**
  ```python
  class AnalyticsAggregator:
      async def aggregate_daily_stats(date: date)
      async def update_user_analytics(user_id: str)
      async def generate_weekly_digest(user_id: str)
      async def cleanup_old_analytics(days: int = 90)
  ```
- **Estimated Time:** 3 hours

#### Task 4.1.2: Implement aggregate_daily_stats
- **File:** `python-worker/services/analytics_aggregator.py`
- **Description:** Daily platform metrics aggregation
- **Acceptance Criteria:**
  - [ ] Runs at midnight UTC
  - [ ] Counts: DAU, MAU, new_posts, new_matches, etc.
  - [ ] Inserts into platform_analytics
  - [ ] Logs aggregation time
  - [ ] Tested with sample data
- **Estimated Time:** 4 hours

#### Task 4.1.3: Implement update_user_analytics
- **File:** `python-worker/services/analytics_aggregator.py`
- **Description:** Per-user analytics update
- **Acceptance Criteria:**
  - [ ] Updates profile_views_count
  - [ ] Updates post_impressions_count
  - [ ] Updates match_acceptance_rate
  - [ ] Updates last_active
  - [ ] Runs weekly per user
  - [ ] Tested with sample data
- **Estimated Time:** 4 hours

#### Task 4.1.4: Implement generate_weekly_digest
- **File:** `python-worker/services/analytics_aggregator.py`
- **Description:** Weekly summary for users
- **Acceptance Criteria:**
  - [ ] Runs every Monday 8 AM
  - [ ] Includes: profile views, matches, top post
  - [ ] Creates notification or email
  - [ ] Respects user preferences
  - [ ] Tested with sample data
- **Estimated Time:** 4 hours

#### Task 4.1.5: Add analytics admin dashboard
- **File:** `app/(auth)/admin/analytics/page.tsx`
- **Description:** Admin view of platform analytics
- **Acceptance Criteria:**
  - [ ] Shows DAU/MAU chart
  - [ ] Shows growth trends
  - [ ] Shows top metrics
  - [ ] Date range picker
  - [ ] Export to CSV
  - [ ] Tested in browser
- **Estimated Time:** 4 hours

#### Task 4.1.6: Write unit tests for analytics_aggregator.py
- **File:** `python-worker/tests/test_analytics_aggregator.py`
- **Description:** Test coverage for analytics
- **Acceptance Criteria:**
  - [ ] Test daily aggregation
  - [ ] Test user analytics
  - [ ] Test weekly digest
  - [ ] >90% coverage
  - [ ] All tests passing
- **Estimated Time:** 3 hours

**Day 1-2 Total:** 22 hours

---

### Week 5, Day 3-4: System Optimization

#### Task 4.2.1: Profile Python Worker performance
- **File:** N/A
- **Description:** Identify bottlenecks
- **Acceptance Criteria:**
  - [ ] Run cProfile on all services
  - [ ] Identify slow functions
  - [ ] Document findings
  - [ ] Prioritize optimizations
- **Estimated Time:** 3 hours

#### Task 4.2.2: Optimize database queries
- **File:** Multiple SQL files
- **Description:** Add missing indexes, optimize queries
- **Acceptance Criteria:**
  - [ ] EXPLAIN ANALYZE on slow queries
  - [ ] Add missing indexes
  - [ ] Update queries with better plans
  - [ ] Verify improvement
- **Estimated Time:** 4 hours

#### Task 4.2.3: Implement query result caching
- **File:** `python-worker/lib/cache.py`
- **Description:** Redis/in-memory caching
- **Acceptance Criteria:**
  - [ ] Cache frequent queries
  - [ ] TTL configuration
  - [ ] Cache invalidation
  - [ ] Tested with load
- **Estimated Time:** 4 hours

#### Task 4.2.4: Optimize embedding generation
- **File:** `python-worker/services/embedding_generator.py`
- **Description:** Batch embedding generation
- **Acceptance Criteria:**
  - [ ] Batch multiple profiles
  - [ ] GPU acceleration (if available)
  - [ ] Reduce redundant processing
  - [ ] Measure improvement
- **Estimated Time:** 3 hours

#### Task 4.2.5: Set up monitoring alerts
- **File:** `python-worker/lib/monitoring.py`
- **Description:** Alert on system health
- **Acceptance Criteria:**
  - [ ] Alert on queue depth >50
  - [ ] Alert on DLQ size >10
  - [ ] Alert on error rate >1%
  - [ ] Alert on latency p95 >1s
  - [ ] Slack/email notifications
- **Estimated Time:** 4 hours

#### Task 4.2.6: Load test entire system
- **File:** `python-worker/tests/test_load_full.py`
- **Description:** Full system load test
- **Acceptance Criteria:**
  - [ ] Simulate 1,000 concurrent users
  - [ ] All services under load
  - [ ] P95 latency <1s
  - [ ] No memory leaks
  - [ ] Report generated
- **Estimated Time:** 4 hours

**Day 3-4 Total:** 22 hours

---

### Week 5, Day 5: Final Testing & Deployment

#### Task 4.3.1: Security audit
- **File:** N/A
- **Description:** Review security implementation
- **Acceptance Criteria:**
  - [ ] Review all API endpoints
  - [ ] Check RLS policies
  - [ ] Verify auth on all endpoints
  - [ ] Check for SQL injection
  - [ ] Document findings
- **Estimated Time:** 4 hours

#### Task 4.3.2: Final integration testing
- **File:** N/A
- **Description:** End-to-end testing of all features
- **Acceptance Criteria:**
  - [ ] Match generation flow
  - [ ] Notification delivery
  - [ ] Feed personalization
  - [ ] Content moderation
  - [ ] AI mentor sessions
  - [ ] Event capture
  - [ ] Analytics aggregation
  - [ ] All passing
- **Estimated Time:** 4 hours

#### Task 4.3.3: Documentation - analytics system
- **File:** `docs/04-infrastructure/analytics.md`
- **Description:** Document analytics architecture
- **Acceptance Criteria:**
  - [ ] Data flow diagram
  - [ ] Table descriptions
  - [ ] Aggregation logic
  - [ ] API reference
  - [ ] Admin guide
- **Estimated Time:** 2 hours

#### Task 4.3.4: Update IMPLEMENTATION_PLAN.md
- **File:** `IMPLEMENTATION_PLAN.md`
- **Description:** Mark all tasks complete
- **Acceptance Criteria:**
  - [ ] All checkboxes marked
  - [ ] Actual vs estimated time
  - [ ] Lessons learned
  - [ ] Next phase recommendations
- **Estimated Time:** 2 hours

#### Task 4.3.5: Phase 4 demo preparation
- **File:** N/A
- **Description:** Prepare final demo
- **Acceptance Criteria:**
  - [ ] Full feature demo script
  - [ ] Metrics dashboard
  - [ ] Performance report
  - [ ] Known issues list
  - [ ] Roadmap for future
- **Estimated Time:** 3 hours

#### Task 4.3.6: Final retrospective
- **File:** N/A
- **Description:** Project retrospective
- **Acceptance Criteria:**
  - [ ] All phases reviewed
  - [ ] Success metrics evaluated
  - [ ] Lessons learned documented
  - [ ] Recommendations for future projects
- **Estimated Time:** 3 hours

**Day 5 Total:** 18 hours

---

**Phase 4 Total: 62 hours (~8 working days)**

---

## 📊 Project Summary

| Phase | Duration | Tasks | Hours | Status |
|-------|----------|-------|-------|--------|
| Phase 1: Core Matching & Notifications | 10 days | 47 | 137 | ⏳ Pending |
| Phase 2: Feed & Content Safety | 5 days | 28 | 76.5 | ⏳ Pending |
| Phase 3: AI Mentor & Events | 5 days | 24 | 64.5 | ⏳ Pending |
| Phase 4: Analytics & Optimization | 5 days | 18 | 62 | ⏳ Pending |
| **TOTAL** | **25 days** | **117** | **340** | **⏳ Pending** |

---

## 🎯 Critical Path

```
Phase 1 (Match Scoring) → Phase 2 (Feed Ranking) → Phase 3 (AI Mentor) → Phase 4 (Analytics)
     ↓                        ↓                        ↓                      ↓
  Week 1-2                 Week 3                   Week 4                 Week 5
```

**Blockers:**
- Phase 2 depends on Phase 1 (embedding quality affects feed)
- Phase 3 depends on Phase 1 (events need activity tracking)
- Phase 4 depends on Phase 2 & 3 (analytics need data sources)

---

**Last Updated:** 2026-03-18  
**Next Review:** Daily standups  
**Document Owner:** Development Team
