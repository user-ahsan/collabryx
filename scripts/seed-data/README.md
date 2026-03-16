# Collabryx Database Seeder

Generate realistic dummy data for the Collabryx platform with 100% complete profiles across 20 industries.

## Features

- **100 Realistic Profiles** - Complete with auth users, profiles, skills, interests, experiences, and projects
- **20 Industries** - Fintech, EdTech, HealthTech, AI/ML, and more
- **Real Embeddings** - Generates actual vector embeddings using the Python worker
- **Full Social Graph** - Connections, match suggestions, conversations, messages
- **Notifications** - Activity feed notifications
- **AI Mentor Sessions** - Sample AI mentoring conversations

## Quick Start

### 1. Install Dependencies

```bash
cd scripts/seed-data
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your Supabase credentials
# - SUPABASE_URL: Your Supabase project URL
# - SUPABASE_SERVICE_ROLE_KEY: Your service role key (from Project Settings > API)
# - PYTHON_WORKER_URL: Usually http://localhost:8000
```

### 3. Start Python Worker (for embeddings)

```bash
# Make sure the Python worker is running
cd ../../python-worker
docker-compose up -d

# Verify it's healthy
curl http://localhost:8000/health
```

### 4. Run the Seeder

```bash
# Seed with default settings (100 profiles)
python main.py

# Custom profile count
python main.py --profiles 50

# Clear existing data first
python main.py --clear-existing

# Skip embeddings (faster)
python main.py --skip-embeddings
```

## Command Line Options

| Option | Description | Default |
|--------|-------------|---------|
| `--profiles N` | Number of profiles to create | 100 |
| `--posts N` | Number of posts to create | 300 |
| `--clear-existing` | Delete all data before seeding | Off |
| `--skip-embeddings` | Don't generate embeddings | Off |
| `--skip-mentor` | Skip AI mentor sessions | Off |
| `--skip-notifications` | Skip notifications | Off |
| `--batch-size N` | Batch size for rate limiting | 10 |

## What Gets Created

| Entity | Count | Description |
|--------|-------|-------------|
| Auth Users | 100 | Real Supabase auth users |
| Profiles | 100 | Complete profiles with bio, headline, etc. |
| Skills | 500-800 | 5-10 skills per user |
| Interests | 300-500 | 3-5 interests per user |
| Experiences | 100-200 | Work/education history |
| Projects | 100-200 | Portfolio projects |
| Posts | 300 | Feed posts with various types |
| Comments | 600-900 | Comments on posts |
| Reactions | 1500-3000 | Emoji reactions |
| Connections | 500 | User connections |
| Match Suggestions | 250-500 | AI match recommendations |
| Conversations | 150 | Chat threads |
| Messages | 1000 | Chat messages |
| Notifications | 500 | Activity notifications |
| Mentor Sessions | 50 | AI mentoring conversations |
| Embeddings | 100 | Vector embeddings (if enabled) |

## Target Industries

1. Fintech
2. EdTech
3. HealthTech
4. E-commerce
5. AI/ML
6. Cybersecurity
7. Blockchain
8. Cloud Computing
9. DevTools
10. SaaS
11. Gaming
12. Social Media
13. PropTech
14. AgriTech
15. CleanTech
16. Biotech
17. Robotics
18. IoT
19. AR/VR
20. Data Analytics

## User Credentials

All created users have the same password for easy testing:

```
Password: DemoPass123!
```

Example login emails:
- john.smith@gmail.com
- sarah.johnson@stanford.edu
- mike.chen@outlook.com

## Verification

After seeding, verify the data:

```sql
-- Check profile count
SELECT COUNT(*) FROM profiles;

-- Check posts with author info
SELECT p.content, pr.display_name 
FROM posts p 
JOIN profiles pr ON p.author_id = pr.id 
LIMIT 10;

-- Check connections
SELECT COUNT(*) FROM connections WHERE status = 'accepted';

-- Check embeddings
SELECT COUNT(*) FROM profile_embeddings WHERE status = 'completed';
```

## Troubleshooting

### Python Worker Not Available

```bash
# Check if Docker container is running
docker ps | grep python-worker

# View logs
docker-compose logs -f

# Restart
docker-compose restart
```

### Rate Limiting Errors

The seeder includes automatic rate limiting. If you encounter errors:

```bash
# Reduce batch size
python main.py --batch-size 5

# Increase delay between batches (edit config.py)
# DELAY_BETWEEN_BATCHES = 5.0
```

### Supabase Connection Failed

1. Verify SUPABASE_URL is correct (https://xxx.supabase.co)
2. Use SERVICE_ROLE_KEY, not the anon key
3. Check network connectivity

## File Structure

```
scripts/seed-data/
├── main.py                      # Entry point
├── config.py                    # Configuration
├── requirements.txt             # Python dependencies
├── .env.example                 # Environment template
├── data_generators/
│   ├── __init__.py
│   ├── names.py                 # Name/email generation
│   ├── profiles.py              # Profile data generation
│   ├── posts.py                 # Post content generation
│   └── conversations.py         # Chat message generation
├── templates/
│   ├── profile_templates.json   # Bio/headline templates
│   ├── post_templates.json      # Post content templates
│   └── message_templates.json   # Chat templates
└── seeders/
    ├── __init__.py
    ├── profiles_seeder.py       # Users + profiles
    ├── content_seeder.py        # Posts + comments
    ├── social_seeder.py         # Connections + matches
    ├── messaging_seeder.py      # Conversations + messages
    ├── notifications_seeder.py  # Notifications
    ├── mentor_seeder.py         # AI mentor sessions
    └── embeddings_seeder.py     # Vector embeddings
```

## Safety Notes

⚠️ **DO NOT run on production databases!**

- Always use a development/staging Supabase project
- The `--clear-existing` flag will DELETE all data
- Created users are for testing only

## License

Internal tool for Collabryx development.
