# Database Seeding Guide

Comprehensive guide for seeding Collabryx with realistic dummy data.

## 📋 Overview

The Collabryx database seeder is a **modular, environment-driven system** that creates realistic dummy data including:

- **100+ User Profiles** with complete onboarding
- **Posts, Comments, Reactions** with real engagement
- **Connections** between users (social graph)
- **Match Suggestions** powered by AI matching
- **Conversations & Messages** (real-time chat)
- **Notifications** (activity feed)
- **AI Mentor Sessions** (mentoring conversations)
- **Vector Embeddings** (semantic search via Python worker)

All data uses **real UUIDs from your Supabase database** - relationships are properly maintained.

---

## 🚀 Quick Start

### 1. Setup

```bash
# Navigate to seed directory
cd scripts/seed-data

# Create virtual environment (if not already done)
python -m venv venv
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt
```

### 2. Configure Environment

Create `.env` file:

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
PYTHON_WORKER_URL=http://localhost:8000
```

**⚠️ Important:** Use the **Service Role Key** (not anon key) from:
Supabase Dashboard → Project Settings → API → Service Role Key

### 3. Start Python Worker (for embeddings)

```bash
cd ../../python-worker
docker-compose up -d
docker-compose logs -f  # Verify it's running
```

### 4. Run Seeder

```bash
cd ../scripts/seed-data

# Seed everything
python main.py --all

# Or seed specific modules
python main.py --profiles
python main.py --posts
```

---

## 📖 Table of Contents

- [Quick Start](#-quick-start)
- [Configuration](#configuration)
- [Commands & Flags](#commands--flags)
- [Seeding Modules](#seeding-modules)
- [Environment Variables](#environment-variables)
- [Troubleshooting](#troubleshooting)

---

## Configuration

### Environment File (`.env`)

| Variable | Default | Description |
|----------|---------|-------------|
| `SUPABASE_URL` | - | Your Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | - | Service role key (required) |
| `PYTHON_WORKER_URL` | `http://localhost:8000` | Embedding worker URL |

### Seeding Toggles

| Variable | Default | Description |
|----------|---------|-------------|
| `SEED_PROFILES` | `true` | Enable/disable profile seeding |
| `SEED_POSTS` | `true` | Enable/disable posts seeding |
| `SEED_CONNECTIONS` | `true` | Enable/disable connections |
| `SEED_MATCHES` | `true` | Enable/disable match suggestions |
| `SEED_CONVERSATIONS` | `true` | Enable/disable conversations |
| `SEED_MESSAGES` | `true` | Enable/disable messages |
| `SEED_NOTIFICATIONS` | `true` | Enable/disable notifications |
| `SEED_MENTOR_SESSIONS` | `true` | Enable/disable mentor sessions |
| `SEED_EMBEDDINGS` | `true` | Enable/disable embeddings |

### Seed Limits

| Variable | Default | Description |
|----------|---------|-------------|
| `LIMIT_PROFILES` | `100` | Number of profiles to create |
| `LIMIT_POSTS` | `300` | Number of posts to create |
| `LIMIT_CONNECTIONS` | `500` | Number of connections |
| `LIMIT_MATCHES_PER_USER` | `5` | Match suggestions per user |
| `LIMIT_CONVERSATIONS` | `150` | Number of conversations |
| `LIMIT_MESSAGES_PER_CONVERSATION` | `5,20` | Messages per conversation (min,max) |
| `LIMIT_COMMENTS_PER_POST` | `3,8` | Comments per post (min,max) |
| `LIMIT_REACTIONS_PER_POST` | `5,15` | Reactions per post (min,max) |
| `LIMIT_NOTIFICATIONS_PER_USER` | `5` | Notifications per user |
| `LIMIT_MENTOR_SESSIONS` | `50` | Total mentor sessions |

**Special Values:**
- `0` = Skip this seeder
- `-1` = Seed based on existing data (e.g., 10 messages per existing conversation)

---

## Commands & Flags

### Basic Usage

```bash
# Run all enabled seeders (based on .env)
python main.py --all

# Show configuration
python main.py --list

# Seed specific modules
python main.py --profiles
python main.py --posts
python main.py --connections
python main.py --matches
python main.py --conversations
python main.py --messages
python main.py --notifications
python main.py --mentor
python main.py --embeddings

# Combine multiple modules
python main.py --profiles --posts --connections
```

### Override Limits

```bash
# Override profile limit
python main.py --profiles --limit-profiles 500

# Override posts limit
python main.py --posts --limit-posts 1000

# Override connections limit
python main.py --connections --limit-connections 1000

# Override conversations limit
python main.py --conversations --limit-conversations 300
```

### Advanced Usage

```bash
# Clear all data first, then seed
# (WARNING: Deletes ALL data!)
python main.py --all --clear-first

# Skip existing data (don't duplicate)
python main.py --all --skip-existing

# Seed profiles, then posts, skip everything else
python main.py --profiles --posts

# Generate embeddings only (for existing profiles)
python main.py --embeddings
```

---

## Seeding Modules

### 1. Profiles Seeder

Creates user accounts with complete profiles.

**What it creates:**
- Auth users (via Supabase Auth API)
- Profile records with bio, headline, location
- Skills (5-10 per user)
- Interests (3-5 per user)
- Work experiences (1-3 per user)
- Portfolio projects (1-2 per user)

**Features:**
- 20 industries (Fintech, EdTech, HealthTech, AI/ML, etc.)
- Diverse name generation
- Realistic email addresses
- University emails for students
- Profile completion calculation

**Command:**
```bash
python main.py --profiles --limit-profiles 100
```

**User Credentials:**
All seeded users have password: `DemoPass123!`

### 2. Posts Seeder

Creates feed posts with comments and reactions.

**What it creates:**
- Posts (4 types: general, project-launch, teammate-request, announcement)
- Comments (3-8 per post, with replies)
- Reactions (5-15 per post, various emojis)

**Features:**
- Industry-specific content
- Intent tags (cofounder, teammate, mvp, fyp)
- Nested comments (replies)
- Realistic engagement patterns

**Command:**
```bash
python main.py --posts --limit-posts 300
```

**Requires:** Profiles must exist first

### 3. Connections Seeder

Creates social connections between users.

**What it creates:**
- Connection requests (pending, accepted, declined)
- Bidirectional connections for accepted requests

**Features:**
- Avoids duplicate connections
- Weighted status (70% accepted, 20% pending, 10% declined)
- Fetches real user UUIDs from database

**Command:**
```bash
python main.py --connections --limit-connections 500
```

**Requires:** At least 2 profiles

### 4. Matches Seeder

Creates AI-powered match suggestions.

**What it creates:**
- Match suggestions per user
- Match percentages (60-95%)
- AI confidence scores
- Match reasons (skills, interests)

**Features:**
- Configurable matches per user
- Realistic AI explanations
- Skill and interest overlap

**Command:**
```bash
python main.py --matches --limit-matches-per-user 5
```

**Requires:** Profiles must exist

### 5. Conversations Seeder

Creates chat conversations between users.

**What it creates:**
- Conversation threads
- Participant pairs
- Last message metadata

**Features:**
- Avoids duplicate conversations
- Uses real user UUIDs
- Proper participant ordering

**Command:**
```bash
python main.py --conversations --limit-conversations 150
```

**Requires:** Profiles must exist

### 6. Messages Seeder

Creates messages in conversations.

**What it creates:**
- Chat messages (5-20 per conversation)
- Timestamps (backdated for realism)
- Read status
- Updates conversation last_message

**Features:**
- Realistic conversation flows
- Proper sender/receiver alternation
- Message timestamps

**Command:**
```bash
python main.py --messages
```

**Requires:** Conversations must exist

### 7. Notifications Seeder

Creates activity notifications.

**What it creates:**
- Connection notifications
- Message notifications
- Post reaction notifications
- Comment notifications
- Match notifications

**Features:**
- Multiple notification types
- Actor information
- Read/unread status
- Resource links

**Command:**
```bash
python main.py --notifications --limit-notifications-per-user 5
```

**Requires:** Profiles must exist

### 8. Mentor Seeder

Creates AI mentor sessions.

**What it creates:**
- Mentor sessions (topics: career, startup, learning, etc.)
- Conversation messages (user + AI responses)
- Session metadata

**Features:**
- 10 session topics
- Realistic AI responses
- Message ordering

**Command:**
```bash
python main.py --mentor --limit-mentor-sessions 50
```

**Requires:** Profiles must exist

### 9. Embeddings Seeder

Generates vector embeddings for semantic search.

**What it creates:**
- Profile embeddings (384 dimensions)
- Embedding queue entries
- Embedding status tracking

**Features:**
- Uses Python worker (Docker)
- Semantic text construction
- Rate limiting support
- Queue-based processing

**Command:**
```bash
python main.py --embeddings
```

**Requires:**
- Python worker running (`docker-compose up -d`)
- Profiles with skills/interests

---

## Environment Variables Reference

### Supabase Configuration

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Get Service Role Key:**
1. Go to Supabase Dashboard
2. Select your project
3. Settings → API
4. Copy "service_role" key (secret, not anon)

### Python Worker Configuration

```env
PYTHON_WORKER_URL=http://localhost:8000
```

**For Docker:**
```bash
cd python-worker
docker-compose up -d
curl http://localhost:8000/health  # Verify
```

### Seeding Toggles

```env
SEED_PROFILES=true
SEED_POSTS=true
SEED_CONNECTIONS=true
SEED_MATCHES=true
SEED_CONVERSATIONS=true
SEED_MESSAGES=true
SEED_NOTIFICATIONS=true
SEED_MENTOR_SESSIONS=true
SEED_EMBEDDINGS=true
```

### Seed Limits

```env
LIMIT_PROFILES=100
LIMIT_POSTS=300
LIMIT_CONNECTIONS=500
LIMIT_MATCHES_PER_USER=5
LIMIT_CONVERSATIONS=150
LIMIT_MESSAGES_PER_CONVERSATION=5,20
LIMIT_COMMENTS_PER_POST=3,8
LIMIT_REACTIONS_PER_POST=5,15
LIMIT_NOTIFICATIONS_PER_USER=5
LIMIT_MENTOR_SESSIONS=50
```

### Batch Processing

```env
BATCH_SIZE=10
DELAY_BETWEEN_BATCHES=2.0
```

---

## Troubleshooting

### No Users Found

**Error:** `✗ No users found. Seed profiles first.`

**Solution:**
```bash
python main.py --profiles --limit-profiles 100
```

### Python Worker Not Available

**Error:** `⚠️  Python worker not available at http://localhost:8000`

**Solution:**
```bash
cd ../../python-worker
docker-compose up -d
docker-compose logs -f  # Check logs
curl http://localhost:8000/health  # Verify
```

### 409 Conflict Errors

**Error:** `Client error '409 Conflict'`

**Cause:** Data already exists (duplicate prevention)

**Solution:** This is normal! The seeder skips existing data. To force re-seeding:
```bash
python main.py --all --clear-first  # WARNING: Deletes ALL data
```

### Auth API 404 Error

**Error:** `Auth API Error 404`

**Cause:** Incorrect Supabase URL or endpoint

**Solution:**
1. Check `SUPABASE_URL` in `.env` (should be `https://xxx.supabase.co`)
2. For self-hosted: Use `https://your-domain.com` (Kong gateway handles routing)

### Profile Creation Fails

**Error:** `Failed to create profile`

**Possible causes:**
1. Auth user not created (check `SUPABASE_SERVICE_ROLE_KEY`)
2. RLS policy blocking inserts
3. Missing required fields

**Solution:**
```bash
# Check Supabase logs
# Verify service role key has admin permissions
# Check RLS policies on profiles table
```

### Embeddings Not Generating

**Error:** Embeddings stay in `pending` status

**Solution:**
1. Verify Python worker is running: `docker-compose ps`
2. Check worker logs: `docker-compose logs -f`
3. Verify health endpoint: `curl http://localhost:8000/health`
4. Check `embedding_pending_queue` table for queued items

### Rate Limiting

**Error:** `429 Too Many Requests`

**Solution:**
1. Reduce `BATCH_SIZE` in `.env`
2. Increase `DELAY_BETWEEN_BATCHES`
3. Python worker has built-in rate limiting (3 req/hour/user)

---

## Data Verification

### Check Profile Count

```sql
SELECT COUNT(*) FROM profiles;
SELECT COUNT(*) FROM user_skills;
SELECT COUNT(*) FROM user_interests;
```

### Check Posts and Engagement

```sql
SELECT 
  COUNT(*) as total_posts,
  SUM(comment_count) as total_comments,
  SUM(reaction_count) as total_reactions
FROM posts;
```

### Check Social Graph

```sql
SELECT 
  COUNT(*) as total_connections,
  SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted
FROM connections;
```

### Check Embeddings

```sql
SELECT 
  status, 
  COUNT(*) as count 
FROM profile_embeddings 
GROUP BY status;

SELECT 
  status, 
  COUNT(*) as count 
FROM embedding_pending_queue 
GROUP BY status;
```

---

## Best Practices

### 1. Seed in Order

Always seed profiles first, then other data:

```bash
# ✅ Correct
python main.py --profiles
python main.py --posts --connections --matches

# ❌ Wrong (will fail)
python main.py --posts  # No users exist yet!
```

### 2. Use --list to Preview

Before running, check configuration:

```bash
python main.py --list
```

### 3. Test with Small Batches

Test with small numbers first:

```bash
python main.py --profiles --limit-profiles 5
python main.py --posts --limit-posts 10
```

### 4. Monitor Python Worker

Keep worker logs open while seeding embeddings:

```bash
docker-compose logs -f python-worker
```

### 5. Backup Before Clearing

Always backup before using `--clear-first`:

```bash
# Export data first
pg_dump your-database > backup.sql

# Then clear and seed
python main.py --all --clear-first
```

---

## Advanced Usage

### Custom Industry Distribution

Edit `config.py` to change industry distribution:

```python
INDUSTRIES = [
    "Fintech", "EdTech", "HealthTech",  # Add/remove industries
]
```

### Custom Bio Templates

Edit `templates/profile_templates.json`:

```json
{
  "bio_templates": [
    "Your custom bio template here..."
  ]
}
```

### Custom Post Content

Edit `templates/post_templates.json` for industry-specific posts.

### Seeding Scripts Automation

Create a bash script:

```bash
#!/bin/bash
# seed-all.sh

echo "Seeding profiles..."
python main.py --profiles --limit-profiles 100

echo "Seeding posts..."
python main.py --posts --limit-posts 300

echo "Seeding connections..."
python main.py --connections --limit-connections 500

echo "Done!"
```

---

## Support

For issues or questions:
- Check logs: `docker-compose logs -f`
- Verify Supabase connection
- Check RLS policies in Supabase dashboard
- Review `.env` configuration
