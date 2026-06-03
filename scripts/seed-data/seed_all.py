#!/usr/bin/env python3
"""
Non-interactive seed-all script.
Seeds profiles, posts, connections, matches, conversations, messages,
notifications, and mentor sessions.
"""
import sys, os, time
sys.stdout.reconfigure(encoding='utf-8')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from dotenv import load_dotenv
load_dotenv('.env')

import httpx
from config import config

# Validate and init
if not config.validate():
    print("FATAL: Config validation failed. Check .env")
    sys.exit(1)
config.initialize()

client = httpx.Client(timeout=httpx.Timeout(60.0, connect=30.0))

from seeders.profiles_seeder import ProfilesSeeder
from seeders.posts_seeder import PostsSeeder
from seeders.connections_seeder import ConnectionsSeeder
from seeders.matches_seeder import MatchesSeeder
from seeders.conversations_seeder import ConversationsSeeder
from seeders.messages_seeder import MessagesSeeder
from seeders.notifications_seeder import NotificationsSeeder
from seeders.mentor_seeder import MentorSeeder

def run(name, action):
    print(f"\n{'='*60}")
    print(f"  {name}")
    print(f"{'='*60}")
    t0 = time.time()
    try:
        action()
        print(f"  DONE in {time.time()-t0:.1f}s")
    except Exception as e:
        print(f"  FAILED: {e}")
    time.sleep(0.5)

run("Profiles",       lambda: ProfilesSeeder(client).seed_profiles(count=100))
run("Posts",          lambda: PostsSeeder(client).seed(limit=300))
run("Connections",    lambda: ConnectionsSeeder(client).seed(limit=500))
run("Matches",        lambda: MatchesSeeder(client).seed(limit_per_user=5))
run("Conversations",  lambda: ConversationsSeeder(client).seed(limit=150))
run("Messages",       lambda: MessagesSeeder(client).seed())
run("Notifications",  lambda: NotificationsSeeder(client).seed(count=100))
run("Mentor Sessions", lambda: MentorSeeder(client).seed(count=50))

client.close()
print("\nALL DONE.")
