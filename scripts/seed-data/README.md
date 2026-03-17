# 🚀 Collabryx Database Seeder

Interactive database seeding system with arrow key navigation and multi-selection support.

## 🎮 Quick Start

```bash
cd scripts/seed-data
python main.py
```

## 🎯 Interactive Menu Controls

| Key | Action |
|-----|--------|
| **↑ / ↓** | Navigate up/down |
| **← / →** | Also navigate (left=up, right=down) |
| **SPACE** | Select/deselect module |
| **ENTER** | Execute selected modules |
| **Q** or **ESC** | Quit |

## ✨ Features

- **Arrow Key Navigation** - Full keyboard navigation support
- **Multi-Selection** - Select multiple modules at once
- **Incremental Seeding** - Automatically skips existing records (no duplicates)
- **Real-time Statistics** - Shows created/skipped/failed counts
- **Embeddings Warning** - Warns about using Docker worker for embeddings
- **PowerShell Optimized** - No flickering, works in CMD and PowerShell

## 📋 Available Modules

1. **Seed Profiles** - Users with complete data (skills, interests, experiences)
2. **Seed Posts** - Posts with comments and reactions
3. **Seed Connections** - User relationships (bidirectional)
4. **Seed Matches** - AI-powered match suggestions
5. **Seed Conversations** - Chat threads between users
6. **Seed Messages** - Messages in conversations
7. **Seed Notifications** - Activity feed notifications
8. **Seed Mentor Sessions** - AI mentoring conversations
9. **Generate Embeddings** - ⚠️ NOT RECOMMENDED (use Docker worker)
10. **Seed Everything** - All modules in sequence
11. **Check Database Status** - View record counts
12. **Check Worker Status** - Python worker health check

## 🔧 Configuration

Create a `.env` file in the `scripts/seed-data` directory:

```env
# Supabase Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
SUPABASE_REST_URL=https://your-project.supabase.co/rest/v1

# Seeding Behavior
SEED_USER_PASSWORD=DemoPass123!
INCREMENTAL_SEEDING=true
CHECK_DUPLICATES=true

# Limits
LIMIT_PROFILES=100
LIMIT_POSTS=300
LIMIT_CONNECTIONS=500
LIMIT_MATCHES_PER_USER=5
LIMIT_CONVERSATIONS=150
LIMIT_MESSAGES_PER_CONVERSATION=5,20
LIMIT_NOTIFICATIONS_PER_USER=5
LIMIT_MENTOR_SESSIONS=50

# Batch Processing
BATCH_SIZE=10
DELAY_BETWEEN_BATCHES=2.0

# Python Worker
PYTHON_WORKER_URL=http://localhost:8000
```

## 🐍 Python Worker for Embeddings

**IMPORTANT**: For embedding generation, use the Docker worker instead of the seeder:

```bash
# Start the Python worker
cd ../../python-worker
docker-compose up -d

# Monitor logs
docker-compose logs -f

# Check health
curl http://localhost:8000/health
```

**Benefits:**
- ✅ Automatic retry on failures
- ✅ Rate limiting
- ✅ Dead letter queue for failed embeddings
- ✅ Better error handling
- ✅ Runs in background

## 📊 Incremental Seeding

All seeders support **incremental seeding** - they automatically skip existing records:

- **First run**: Creates all records
- **Second run**: Skips all existing records (0 duplicates)
- **Statistics**: Shows created/skipped/failed counts

### Example Output

```
======================================================================
✓ PROFILES SEEDING COMPLETE
======================================================================
  Created:              10
  Skipped (email):      0
  Skipped (profile):    0
  Failed:               0
  Total Processed:      10
======================================================================
```

Run again:

```
======================================================================
✓ PROFILES SEEDING COMPLETE
======================================================================
  Created:              0
  Skipped (email):      10
  Skipped (profile):    10
  Failed:               0
  Total Processed:      20
======================================================================
```

## 🧪 Testing

Test incremental seeding:

```bash
cd scripts/seed-data
python test_incremental.py
```

This runs each seeder twice and verifies no duplicates are created.

## 📁 Project Structure

```
scripts/seed-data/
├── main.py                    # Entry point (launches interactive menu)
├── interactive_menu.py        # Interactive menu with arrow navigation
├── config.py                  # Configuration and ENV variables
├── test_incremental.py        # Incremental seeding test suite
├── seeders/
│   ├── base_seeder.py         # Base seeder with utilities
│   ├── profiles_seeder.py     # User profiles with skills/interests
│   ├── posts_seeder.py        # Posts, comments, reactions
│   ├── connections_seeder.py  # User connections
│   ├── matches_seeder.py      # Match suggestions
│   ├── conversations_seeder.py # Conversations
│   ├── messages_seeder.py     # Messages
│   ├── notifications_seeder.py # Notifications
│   ├── mentor_seeder.py       # AI mentor sessions
│   └── embeddings_seeder.py   # Embedding queue (use Docker instead)
└── data_generators/
    ├── profiles.py            # Profile data generation
    ├── posts.py               # Post data generation
    ├── conversations.py       # Conversation data generation
    └── ...
```

## 🔒 Security Notes

- Uses Supabase service role key (admin access)
- **Never commit .env file** (add to .gitignore)
- Run in development/staging only
- Review data before production seeding

## 🐛 Troubleshooting

### Arrow keys not working
- Use PowerShell or CMD (not PowerShell ISE)
- Make sure terminal window is focused
- Try pressing keys more deliberately

### Menu flickering
- Fixed in latest version
- Update to latest commit

### Connection failed
- Check .env file has correct Supabase credentials
- Verify Supabase project is accessible
- Check network connection

### Python worker not available
- Start Docker: `docker-compose up -d`
- Check health: `curl http://localhost:8000/health`
- View logs: `docker-compose logs -f`

## 📚 Related Documentation

- [Main README](../../README.md) - Project overview
- [Architecture](../../docs/ARCHITECTURE.md) - System architecture
- [Deployment](../../docs/DEPLOYMENT.md) - Deployment guide
- [Database Schema](../../docs/08-database-seeding/) - Database documentation

---

**Last Updated:** 2026-03-17  
**Version:** 2.0.0 (Interactive Menu)  
**Platform:** Windows (PowerShell/CMD)
