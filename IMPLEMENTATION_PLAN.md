# 🚀 Collabryx ML-Powered Features Implementation Plan

**Branch:** `feature/ml-match-scoring-and-personalization`  
**Created:** 2026-03-18  
**Status:** Planning Complete  
**Estimated Duration:** 4-5 weeks  
**Priority:** Critical

---

## 📋 Executive Summary

This implementation plan covers the complete backend infrastructure required to deliver Collabryx's core AI-powered features. The Python Worker currently handles **embedding generation only** (1 of 12 required services). This plan adds **11 new background services** using ML-based algorithms.

### Key Deliverables

| Feature | Algorithm | Business Impact |
|---------|-----------|-----------------|
| Match Scoring Engine | XGBoost Ranker | **HIGH** - Core differentiation |
| Real-Time Notifications | Supabase Realtime + Triggers | **HIGH** - User engagement |
| Content Moderation | Perspective API + HF Models | **MEDIUM** - Safety & compliance |
| AI Mentor (Gemini) | Gemini Pro API | **MEDIUM** - User retention |
| Event Processing Pipeline | Supabase Realtime + Triggers | **MEDIUM** - Analytics foundation |
| Feed Personalization | Thompson Sampling + Hybrid Scoring | **HIGH** - Core UX |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                    Background Services Architecture              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Primary Service: Python Worker (FastAPI on :8000)             │
│  ├── embedding_generator.py          ✅ EXISTING               │
│  ├── match_generator.py              ❌ NEW (Week 1)           │
│  ├── notification_engine.py          ❌ NEW (Week 1)           │
│  ├── activity_tracker.py             ❌ NEW (Week 1)           │
│  ├── feed_scorer.py                  ❌ NEW (Week 2)           │
│  ├── content_moderator.py            ❌ NEW (Week 2)           │
│  ├── ai_mentor_processor.py          ❌ NEW (Week 3)           │
│  ├── event_processor.py              ❌ NEW (Week 3)           │
│  └── analytics_aggregator.py         ❌ NEW (Week 4)           │
│                                                                 │
│  Secondary: Supabase Realtime                                  │
│  ├── Notification delivery           ✅ EXISTING               │
│  ├── Event capture                   ❌ NEW (Week 1)           │
│  └── Live feed updates               ❌ NEW (Week 2)           │
│                                                                 │
│  External APIs:                                                │
│  ├── Google Perspective API          ❌ NEW (Week 2)           │
│  ├── Google Gemini API               ❌ NEW (Week 3)           │
│  └── Hugging Face Models             ❌ NEW (Week 2)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📅 Phase Breakdown

### Phase 1: Core Matching & Notifications (Week 1-2)

**Goal:** Deliver functional match suggestions and real-time notifications

**Duration:** 10 working days

**Dependencies:** None (foundation layer)

**Success Metrics:**
- [ ] Match suggestions populated for all users with embeddings
- [ ] Notifications auto-created for all user actions
- [ ] Match activity tracked and displayed in dashboard
- [ ] Real-time delivery <100ms

**Risks:**
- Embedding quality affects match accuracy
- Database trigger performance at scale
- Training data availability for ML model

---

### Phase 2: Feed Personalization & Content Safety (Week 3)

**Goal:** Personalized feed ranking and automated content moderation

**Duration:** 5 working days

**Dependencies:** Phase 1 complete

**Success Metrics:**
- [ ] Feed shows personalized content (not chronological)
- [ ] Toxic content auto-flagged before publication
- [ ] Engagement rate increases by 20%
- [ ] Feed load time <500ms

**Risks:**
- Thompson Sampling needs engagement data (cold start problem)
- Perspective API costs at scale
- False positives in content moderation

---

### Phase 3: AI Mentor & Event Processing (Week 4)

**Goal:** Gemini-powered AI mentor and comprehensive event tracking

**Duration:** 5 working days

**Dependencies:** Phase 1 complete

**Success Metrics:**
- [ ] AI mentor sessions functional with Gemini
- [ ] Session summarization working
- [ ] All user events captured in real-time
- [ ] Event analytics dashboard operational

**Risks:**
- Gemini API rate limits
- Context window limitations
- Event storage growth

---

### Phase 4: Analytics & Optimization (Week 5)

**Goal:** User analytics, insights, and system optimization

**Duration:** 5 working days

**Dependencies:** Phase 2 & 3 complete

**Success Metrics:**
- [ ] User analytics populated
- [ ] Weekly digest emails sent
- [ ] Match acceptance rate tracked
- [ ] System performance optimized

**Risks:**
- Data privacy compliance
- Storage costs for analytics
- Query performance at scale

---

## 🔧 Technical Specifications

### 1. Match Scoring Engine

**Algorithm:** XGBoost Ranker (Learning to Rank)

**Features:**
```python
features = {
    # Semantic (35%)
    "cosine_similarity": float,
    
    # Skills (25%)
    "skills_overlap_ratio": float,
    "complementary_skills_count": int,
    
    # Interests (20%)
    "shared_interests_count": int,
    "interest_category_match": float,
    
    # Profile Quality (10%)
    "profile_completion_score": float,
    
    # Behavioral (10%)
    "activity_score_diff": float,
    "mutual_connections_count": int
}
```

**Training Data Requirements:**
- Minimum 1,000 historical match suggestions
- Connection acceptance/rejection labels
- Engagement metrics (messages exchanged, etc.)

**Fallback:** Rule-based scoring until ML model trained

---

### 2. Real-Time Notifications

**Architecture:** Supabase Realtime + Database Triggers

**Notification Types:**
```typescript
type NotificationType = 
  | 'message'           // High priority, instant
  | 'match'             // High priority, instant
  | 'connection_accepted' // High priority, instant
  | 'connection_request' // Medium priority, instant
  | 'like'              // Medium priority, batched 5min
  | 'comment'           // Medium priority, batched 5min
  | 'profile_view'      // Low priority, daily digest
  | 'weekly_summary'    // Low priority, weekly
```

**Database Schema:**
```sql
CREATE TABLE notifications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  type text NOT NULL,
  actor_id uuid REFERENCES profiles(id),
  content text NOT NULL,
  resource_type text,
  resource_id uuid,
  is_read boolean DEFAULT false,
  priority text DEFAULT 'medium',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_notifications_user_unread 
ON notifications(user_id, is_read) 
WHERE is_read = false;
```

---

### 3. Content Moderation

**Models:**
- Google Perspective API (toxicity, threats, insults)
- Hugging Face BART (zero-shot classification)
- Custom spam detector

**Pipeline:**
```python
moderation_result = {
    "toxicity": 0.15,      # Threshold: 0.7
    "spam": 0.08,          # Threshold: 0.8
    "nsfw": 0.02,          # Threshold: 0.6
    "threat": 0.01,        # Threshold: 0.5 (auto-reject)
    "approved": True,      # All scores below threshold
    "flag_for_review": False
}
```

**Actions:**
- `approved` (<30% risk): Publish immediately
- `flag_for_review` (30-70% risk): Queue for manual review
- `auto_reject` (>70% risk): Block and notify user

---

### 4. AI Mentor (Gemini)

**Configuration:**
```python
gemini_config = {
    "model": "gemini-pro",
    "max_tokens": 2048,
    "temperature": 0.7,
    "system_prompt": "career_and_project_advisor",
    "context_injection": True  # User profile data
}
```

**Session Flow:**
```
User Message → Context Retrieval → Gemini API → Response → 
Action Item Extraction → Save to DB → Suggest Next Steps
```

**Cost Estimate:** $2-5/month for 1,000 sessions

---

### 5. Feed Personalization

**Algorithm:** Thompson Sampling + Hybrid Scoring

**Scoring Formula:**
```python
def final_feed_score(user, post):
    semantic = cosine_similarity(user.embedding, post.embedding)
    engagement = thompson_sample(post.engagements, post.impressions)
    recency = exp(-post.age_hours / 24)  # 24hr half-life
    connection = 1.5 if post.author_id in user.connections else 1.0
    
    return (
        0.35 * semantic +
        0.30 * engagement +
        0.20 * recency +
        0.15 * connection
    ) * engagement_boost(user, post)
```

**Cold Start Strategy:**
- New users: Show trending posts + posts from connected users
- First 7 days: Increase exploration (ε-greedy)
- After 100 interactions: Full Thompson Sampling

---

### 6. Event Processing

**Event Schema:**
```sql
CREATE TABLE events (
  id uuid PRIMARY KEY,
  event_type text NOT NULL,
  actor_id uuid REFERENCES profiles(id),
  target_id uuid,
  target_type text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_events_actor ON events(actor_id, created_at);
CREATE INDEX idx_events_type ON events(event_type, created_at);
```

**Captured Events:**
- `post_created`, `post_reacted`, `post_commented`
- `connection_requested`, `connection_accepted`, `connection_declined`
- `message_sent`, `conversation_created`
- `profile_viewed`, `profile_updated`
- `match_suggested`, `match_accepted`

---

## 📊 New Database Tables

### Match Scoring
```sql
CREATE TABLE match_scores (
  id uuid PRIMARY KEY,
  suggestion_id uuid REFERENCES match_suggestions(id),
  semantic_similarity real,
  skills_overlap real,
  complementary_score real,
  shared_interests real,
  activity_match real,
  overall_score real,
  model_version text,
  calculated_at timestamptz DEFAULT now()
);

CREATE TABLE feed_scores (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES profiles(id),
  post_id uuid REFERENCES posts(id),
  score real NOT NULL,
  factors jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, post_id)
);
```

### Analytics
```sql
CREATE TABLE user_analytics (
  user_id uuid PRIMARY KEY REFERENCES profiles(id),
  profile_views_count integer DEFAULT 0,
  post_impressions_count integer DEFAULT 0,
  match_acceptance_rate real DEFAULT 0,
  session_count integer DEFAULT 0,
  last_active timestamptz,
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE platform_analytics (
  date date PRIMARY KEY,
  dau integer,
  mau integer,
  new_posts integer,
  new_matches integer,
  new_connections integer,
  new_messages integer,
  content_flagged integer,
  avg_match_score real
);
```

---

## 🔐 Environment Variables Required

```env
# Python Worker
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.com

# Content Moderation
PERSPECTIVE_API_KEY=your-google-perspective-key
HUGGING_FACE_TOKEN=your-hf-token

# AI Mentor
GEMINI_API_KEY=your-google-gemini-key

# ML Training (optional, for local training)
WANDB_API_KEY=your-weights-biases-key
```

---

## 🧪 Testing Strategy

### Unit Tests
- Each service module (match_generator, feed_scorer, etc.)
- Algorithm correctness (scoring functions)
- Edge cases (missing data, invalid inputs)

### Integration Tests
- Database trigger execution
- Real-time notification delivery
- API endpoint responses

### Load Tests
- Match generation for 10,000 users
- Notification delivery at 1,000 events/second
- Feed ranking latency <500ms at p95

### A/B Tests (Post-Launch)
- ML scoring vs rule-based (match acceptance rate)
- Personalized feed vs chronological (engagement time)
- Notification batching strategies (open rate)

---

## 📈 Success Metrics & KPIs

| Metric | Baseline | Target | Measurement |
|--------|----------|--------|-------------|
| Match Acceptance Rate | 0% (no matches) | 40%+ | connections/match_suggestions |
| Notification Open Rate | N/A | 60%+ | reads/notifications |
| Feed Engagement Time | ~30s | 90s+ | session duration |
| Content Flag Rate | 0% | <2% | flagged/published |
| AI Mentor Sessions | 0 | 100/week | sessions/week |
| User Retention (D7) | TBD | 50%+ | returning users |

---

## ⚠️ Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| ML model underperforms | Medium | High | Start with rule-based, collect data |
| Supabase Realtime latency | Low | Medium | Fallback to polling |
| Perspective API costs | Medium | Low | Cache results, batch requests |
| Gemini rate limits | Low | Medium | Request queuing, fallback to Edge Function |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Low match quality perception | Medium | High | Manual curation initially, user feedback loop |
| Notification spam | Medium | Medium | User preferences, smart batching |
| False positive moderation | Low | Medium | Appeal process, manual review queue |

---

## 🚀 Deployment Checklist

### Pre-Deployment
- [ ] All unit tests passing (>90% coverage)
- [ ] Integration tests passing
- [ ] Load tests completed (1,000 concurrent users)
- [ ] Security audit completed
- [ ] Environment variables configured
- [ ] Database migrations reviewed

### Deployment
- [ ] Python Worker Docker image built and pushed
- [ ] Database migrations applied (supabase/setup/)
- [ ] Supabase Realtime channels configured
- [ ] External API keys validated
- [ ] Monitoring alerts configured

### Post-Deployment
- [ ] Health checks passing
- [ ] Queue depth <50
- [ ] Error rate <1%
- [ ] Latency p95 <500ms
- [ ] User feedback collected

---

## 📚 Documentation Deliverables

- [ ] `docs/03-core-features/match-scoring.md` - Match algorithm documentation
- [ ] `docs/03-core-features/notifications.md` - Notification system guide
- [ ] `docs/03-core-features/feed-ranking.md` - Feed personalization guide
- [ ] `docs/03-core-features/content-moderation.md` - Moderation pipeline docs
- [ ] `docs/03-core-features/ai-mentor.md` - AI mentor integration guide
- [ ] `docs/04-infrastructure/event-processing.md` - Event pipeline architecture
- [ ] `docs/04-infrastructure/analytics.md` - Analytics system documentation
- [ ] `python-worker/README.md` - Updated with all services
- [ ] `API-REFERENCE.md` - New endpoints documented

---

## 🎯 Go/No-Go Criteria

### Phase 1 Go-Live Criteria
- ✅ Match suggestions generated for 100% of users with embeddings
- ✅ Notifications delivered <100ms latency
- ✅ Match activity tracked for all interactions
- ✅ Zero critical bugs

### Phase 2 Go-Live Criteria
- ✅ Feed personalization showing measurable engagement lift
- ✅ Content moderation catching >90% of toxic content
- ✅ False positive rate <5%
- ✅ No performance degradation

### Phase 3 Go-Live Criteria
- ✅ AI mentor responses relevant and helpful
- ✅ Session summarization accurate
- ✅ Event capture complete (>99%)
- ✅ No data loss

### Phase 4 Go-Live Criteria
- ✅ Analytics dashboards populated
- ✅ Weekly digests sending
- ✅ System stable at 10,000 users
- ✅ All success metrics met

---

## 📞 Stakeholder Communication

### Weekly Updates
- **Monday:** Sprint planning, task assignment
- **Wednesday:** Mid-week progress check
- **Friday:** Demo of completed features, metrics review

### Escalation Path
1. Technical blocker → Tech Lead
2. Resource constraint → Project Manager
3. Business requirement change → Product Owner

---

**Last Updated:** 2026-03-18  
**Next Review:** 2026-03-25  
**Document Owner:** Development Team
