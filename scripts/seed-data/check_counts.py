"""
Database Seeder Row Count Checker
Checks all 36+ tables for seeded data
"""
import httpx, os
from dotenv import load_dotenv
load_dotenv()

url = os.getenv("SUPABASE_URL", "")
key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
rest = f'{url}/rest/v1'
headers = {'apikey': key, 'Authorization': f'Bearer {key}', 'Content-Type': 'application/json'}

ALL_TABLES = [
    # Profile-associated
    "profiles", "user_skills", "user_interests", "user_experiences", "user_projects",
    "match_preferences", "embedding_rate_limits", "privacy_settings",
    "theme_preferences", "notification_preferences",
    # Content
    "posts", "post_attachments", "post_reactions", "post_impressions",
    "comments", "comment_likes",
    "feed_scores", "feed_thompson_params",
    # Social
    "connections", "blocked_users", "match_suggestions", "match_scores",
    "match_activity",
    # Communication
    "conversations", "messages",
    # Notifications
    "notifications",
    # AI Mentor
    "ai_mentor_sessions", "ai_mentor_messages",
    # Embeddings
    "profile_embeddings", "embedding_dead_letter_queue", "embedding_pending_queue",
    # Analytics & Audit
    "events", "audit_logs", "content_moderation_logs",
    "user_analytics", "platform_analytics",
]

print(f"\n{'=' * 60}")
print("DATABASE SEEDER ROW COUNTS")
print(f"{'=' * 60}\n")

total_rows = 0
for table in ALL_TABLES:
    try:
        r = httpx.get(f'{rest}/{table}?select=count', headers=headers, timeout=10)
        if r.status_code == 200:
            count = r.json()[0]["count"]
            print(f"  {table:35s} → {count:>6} rows")
            total_rows += count
        elif r.status_code == 404:
            print(f"  {table:35s} → {'NOT FOUND':>10}")
        else:
            print(f"  {table:35s} → ERROR {r.status_code}")
    except Exception as e:
        print(f"  {table:35s} → ERROR {e}")

print(f"\n{'=' * 60}")
print(f"  TOTAL ROWS: {total_rows}")
print(f"{'=' * 60}\n")
