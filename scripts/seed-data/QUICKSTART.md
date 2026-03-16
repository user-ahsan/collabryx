# Collabryx Database Seeder - Quick Start Guide

## Prerequisites

1. **Self-hosted Supabase running** at `https://supabase.ahsanali.cc`
2. **Python 3.14** with dependencies installed
3. **Docker worker** running for embedding generation

## Quick Start

### 1. Activate Virtual Environment (if not already)

```powershell
cd scripts\seed-data
.\venv\Scripts\Activate.ps1
```

### 2. Configure Environment

Create `.env` file in `scripts/seed-data/`:

```env
SUPABASE_URL=https://supabase.ahsanali.cc
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
PYTHON_WORKER_URL=http://localhost:8000
```

**Get your service role key from:**
- Supabase Dashboard → Project Settings → API → Service Role Key (secret, not anon key)

### 3. Start Python Worker (Docker)

```powershell
cd ..\..\python-worker
docker-compose up -d

# Verify worker is running
docker-compose ps

# Check worker health
curl http://localhost:8000/health
```

Expected response:
```json
{
  "status": "healthy",
  "model_info": {
    "model_name": "all-MiniLM-L6-v2",
    "dimensions": 384,
    "device": "cpu"
  },
  "supabase_connected": true,
  "queue_size": 0
}
```

### 4. Run Seeder

```powershell
cd ..\scripts\seed-data

# Seed with default settings (100 profiles)
C:\Users\ahsan\AppData\Local\Python\pythoncore-3.14-64\python.exe main.py

# Or with custom settings
C:\Users\ahsan\AppData\Local\Python\pythoncore-3.14-64\python.exe main.py --profiles 50 --skip-embeddings
```

### 5. Monitor Embedding Generation

```powershell
# Watch worker logs
docker-compose logs -f

# Check queue status in Supabase SQL Editor
SELECT COUNT(*) as pending FROM embedding_pending_queue WHERE status = 'pending';
SELECT COUNT(*) as completed FROM profile_embeddings WHERE status = 'completed';
```

## Command Line Options

```bash
python main.py --profiles 100      # Number of profiles (default: 100)
python main.py --posts 300         # Number of posts (default: 300)
python main.py --clear-existing    # Delete all data first (WARNING!)
python main.py --skip-embeddings   # Skip embedding generation
python main.py --skip-mentor       # Skip AI mentor sessions
python main.py --skip-notifications # Skip notifications
python main.py --batch-size 5      # Batch size for rate limiting
```

## What Gets Created

| Table | Count | Description |
|-------|-------|-------------|
| `profiles` | 100 | User profiles with auth |
| `user_skills` | 500-800 | Skills per user |
| `user_interests` | 300-500 | Interests per user |
| `user_experiences` | 100-200 | Work/education history |
| `user_projects` | 100-200 | Portfolio projects |
| `posts` | 300 | Feed posts |
| `comments` | 600-900 | Comments on posts |
| `post_reactions` | 1500-3000 | Emoji reactions |
| `connections` | 500 | User connections |
| `match_suggestions` | 250-500 | AI match recommendations |
| `conversations` | 150 | Chat threads |
| `messages` | 1000 | Chat messages |
| `notifications` | 500 | Activity notifications |
| `ai_mentor_sessions` | 50 | AI mentoring sessions |
| `profile_embeddings` | 100 | Vector embeddings (via worker) |

## User Credentials

All users have the same password:
```
Password: DemoPass123!
```

Example emails:
- `john.smith@gmail.com`
- `sarah.chen@stanford.edu`
- `mike.chen@outlook.com`

## Troubleshooting

### Auth API 404 Error

Make sure your Supabase URL is correct (with Kong gateway):
```env
SUPABASE_URL=https://supabase.ahsanali.cc
```

### Profile 409 Conflict

This is normal - means profile already exists (auto-created by trigger). The script now handles this by updating instead.

### Worker Not Available

```bash
# Check if Docker container is running
docker-compose ps

# Restart worker
docker-compose restart

# Rebuild if needed
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### Embeddings Not Generating

1. Check worker is healthy: `curl http://localhost:8000/health`
2. Check queue has items: `SELECT * FROM embedding_pending_queue WHERE status='pending';`
3. Check worker logs: `docker-compose logs -f`

## Verify Data

Run these queries in Supabase SQL Editor:

```sql
-- Count profiles
SELECT COUNT(*) FROM profiles;

-- Count posts with authors
SELECT p.content, pr.display_name 
FROM posts p 
JOIN profiles pr ON p.author_id = pr.id 
LIMIT 10;

-- Check embedding status
SELECT status, COUNT(*) 
FROM profile_embeddings 
GROUP BY status;

-- Check pending queue
SELECT status, COUNT(*) 
FROM embedding_pending_queue 
GROUP BY status;
```

## Clean Up

```powershell
# Stop worker
docker-compose down

# Deactivate venv
deactivate
```

## Next Steps

After seeding:
1. Login to your app with any seeded user email + `DemoPass123!`
2. Check dashboard shows posts, connections, matches
3. Verify messaging works
4. Check AI mentor sessions
5. Wait for embeddings to complete (check worker logs)
