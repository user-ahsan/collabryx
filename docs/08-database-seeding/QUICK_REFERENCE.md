# Database Seeding - Quick Reference

## 🚀 Quick Commands

```bash
# Navigate to seed directory
cd scripts/seed-data

# Activate virtual environment
.\venv\Scripts\Activate.ps1  # Windows
source venv/bin/activate     # Mac/Linux

# Run all seeders
python main.py --all

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

# Show configuration
python main.py --list
```

## 📋 All Flags

### Module Flags
| Flag | Description |
|------|-------------|
| `--profiles` | Seed user profiles |
| `--posts` | Seed posts, comments, reactions |
| `--connections` | Seed user connections |
| `--matches` | Seed match suggestions |
| `--conversations` | Seed conversations |
| `--messages` | Seed messages in conversations |
| `--notifications` | Seed notifications |
| `--mentor` | Seed AI mentor sessions |
| `--embeddings` | Generate vector embeddings |
| `--all` | Run all enabled seeders |
| `--list` | Show configuration |

### Override Flags
| Flag | Description |
|------|-------------|
| `--limit-profiles N` | Override profile limit |
| `--limit-posts N` | Override post limit |
| `--limit-connections N` | Override connection limit |
| `--limit-conversations N` | Override conversation limit |

### Control Flags
| Flag | Description |
|------|-------------|
| `--clear-first` | Delete all data before seeding ⚠️ |
| `--skip-existing` | Skip if data exists |

## 🎯 Common Workflows

### Fresh Database
```bash
python main.py --all
```

### Add Posts Only
```bash
python main.py --posts --limit-posts 500
```

### Test with Small Data
```bash
python main.py --profiles --limit-profiles 10
python main.py --posts --limit-posts 20
```

### Regenerate Everything
```bash
python main.py --all --clear-first
```

## ⚙️ Environment Variables

### Required
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key-here
```

### Optional
```env
PYTHON_WORKER_URL=http://localhost:8000
LIMIT_PROFILES=100
LIMIT_POSTS=300
BATCH_SIZE=10
```

## 🐳 Python Worker

```bash
# Start worker
cd ../../python-worker
docker-compose up -d

# Check health
curl http://localhost:8000/health

# View logs
docker-compose logs -f
```

## 📊 Verify Data

```sql
-- Check profiles
SELECT COUNT(*) FROM profiles;

-- Check posts
SELECT COUNT(*) FROM posts;

-- Check embeddings
SELECT status, COUNT(*) FROM profile_embeddings GROUP BY status;
```

## ⚠️ Troubleshooting

| Issue | Solution |
|-------|----------|
| No users found | Run `--profiles` first |
| Worker not available | `docker-compose up -d` |
| 409 Conflict | Normal (data exists) |
| Auth API 404 | Check `SUPABASE_URL` |

For full documentation, see [Database Seeding Guide](./README.md)
