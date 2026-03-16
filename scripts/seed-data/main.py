#!/usr/bin/env python3
"""
Collabryx Database Seed Script
Main entry point for seeding dummy data

Usage:
    python main.py                          # Run with default settings
    python main.py --profiles 50            # Seed 50 profiles
    python main.py --clear-existing         # Clear existing data first
    python main.py --skip-embeddings        # Skip embedding generation
"""

import argparse
import sys
import os
from datetime import datetime
from colorama import Fore, Style, init

# Initialize colorama
init()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import config
from seeders.profiles_seeder import ProfilesSeeder
from seeders.content_seeder import ContentSeeder
from seeders.social_seeder import SocialSeeder
from seeders.messaging_seeder import MessagingSeeder
from seeders.notifications_seeder import NotificationsSeeder
from seeders.mentor_seeder import MentorSeeder
from seeders.embeddings_seeder import EmbeddingsSeeder


def print_banner():
    """Print application banner"""
    print(f"\n{Fore.CYAN}")
    print("=" * 60)
    print("  COLLABRYX DATABASE SEEDER")
    print("  Generate realistic dummy data for development/testing")
    print("=" * 60)
    print(f"{Style.RESET_ALL}\n")


def clear_database(supabase):
    """Clear existing data from database"""
    print(f"\n{Fore.RED}{'=' * 60}{Style.RESET_ALL}")
    print(f"{Fore.RED}CLEARING EXISTING DATA{Style.RESET_ALL}")
    print(f"{Fore.RED}{'=' * 60}{Style.RESET_ALL}\n")

    confirm = input(
        f"{Fore.YELLOW}⚠️  This will DELETE all data. Type 'DELETE' to confirm: {Style.RESET_ALL}"
    )

    if confirm != "DELETE":
        print(f"{Fore.RED}✗ Operation cancelled{Style.RESET_ALL}")
        return False

    tables = [
        "ai_mentor_messages",
        "ai_mentor_sessions",
        "messages",
        "conversations",
        "notifications",
        "match_suggestions",
        "match_scores",
        "connections",
        "comment_likes",
        "comments",
        "post_reactions",
        "post_attachments",
        "posts",
        "user_projects",
        "user_experiences",
        "user_interests",
        "user_skills",
        "profile_embeddings",
        "profiles",
    ]

    for table in tables:
        try:
            # Skip auth.users - cannot be deleted via API
            supabase.table(table).delete().neq(
                "id", "00000000-0000-0000-0000-000000000000"
            ).execute()
            print(f"{Fore.GREEN}✓ Cleared {table}{Style.RESET_ALL}")
        except Exception as e:
            print(f"{Fore.YELLOW}⚠️  Could not clear {table}: {e}{Style.RESET_ALL}")

    print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}✓ Database cleared{Style.RESET_ALL}")
    print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

    return True


def verify_data(supabase):
    """Verify seeded data with counts"""
    print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}VERIFYING DATA{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

    tables = [
        ("profiles", "Profiles"),
        ("user_skills", "Skills"),
        ("user_interests", "Interests"),
        ("user_experiences", "Experiences"),
        ("user_projects", "Projects"),
        ("posts", "Posts"),
        ("comments", "Comments"),
        ("post_reactions", "Reactions"),
        ("connections", "Connections"),
        ("match_suggestions", "Match Suggestions"),
        ("conversations", "Conversations"),
        ("messages", "Messages"),
        ("notifications", "Notifications"),
        ("ai_mentor_sessions", "Mentor Sessions"),
        ("profile_embeddings", "Embeddings"),
    ]

    for table, label in tables:
        try:
            result = supabase.table(table).select("id", count="exact").execute()
            count = result.count if hasattr(result, "count") else len(result.data)
            print(f"{Fore.GREEN}✓ {label}: {count}{Style.RESET_ALL}")
        except Exception as e:
            print(f"{Fore.RED}✗ {label}: Error - {e}{Style.RESET_ALL}")

    print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Seed Collabryx database with dummy data"
    )

    parser.add_argument(
        "--profiles",
        type=int,
        default=None,
        help=f"Number of profiles to create (default: {config.SEED_COUNT_PROFILES})",
    )
    parser.add_argument(
        "--posts",
        type=int,
        default=None,
        help=f"Number of posts to create (default: {config.SEED_COUNT_POSTS})",
    )
    parser.add_argument(
        "--clear-existing",
        action="store_true",
        help="Clear existing data before seeding",
    )
    parser.add_argument(
        "--skip-embeddings", action="store_true", help="Skip embedding generation"
    )
    parser.add_argument(
        "--skip-mentor", action="store_true", help="Skip AI mentor sessions"
    )
    parser.add_argument(
        "--skip-notifications", action="store_true", help="Skip notifications"
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=None,
        help=f"Batch size for rate limiting (default: {config.BATCH_SIZE})",
    )

    args = parser.parse_args()

    # Print banner
    print_banner()

    # Validate configuration
    if not config.validate():
        sys.exit(1)

    # Print configuration summary
    config.print_summary()

    # Initialize Supabase client
    try:
        from supabase import create_client

        supabase = create_client(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY)
        print(f"{Fore.GREEN}✓ Connected to Supabase{Style.RESET_ALL}\n")
    except Exception as e:
        print(f"{Fore.RED}✗ Failed to connect to Supabase: {e}{Style.RESET_ALL}")
        print(
            "   Make sure your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct"
        )
        sys.exit(1)

    # Clear existing data if requested
    if args.clear_existing:
        if not clear_database(supabase):
            sys.exit(1)

    # Update config with CLI args
    if args.profiles:
        config.SEED_COUNT_PROFILES = args.profiles
    if args.posts:
        config.SEED_COUNT_POSTS = args.posts
    if args.batch_size:
        config.BATCH_SIZE = args.batch_size

    start_time = datetime.now()

    # ========== STEP 1: Seed Profiles ==========
    profiles_seeder = ProfilesSeeder(supabase)
    user_ids = profiles_seeder.seed_profiles(count=config.SEED_COUNT_PROFILES)

    if not user_ids:
        print(f"{Fore.RED}✗ No profiles created. Exiting.{Style.RESET_ALL}")
        sys.exit(1)

    # ========== STEP 2: Seed Content ==========
    content_seeder = ContentSeeder(supabase)
    content_seeder.seed_posts(user_ids, count=config.SEED_COUNT_POSTS)

    # ========== STEP 3: Seed Social Data ==========
    social_seeder = SocialSeeder(supabase)
    social_seeder.seed_all(user_ids)

    # ========== STEP 4: Seed Messaging ==========
    messaging_seeder = MessagingSeeder(supabase)
    messaging_seeder.seed_conversations(user_ids)

    # ========== STEP 5: Seed Notifications ==========
    if not args.skip_notifications and config.ENABLE_NOTIFICATIONS:
        notifications_seeder = NotificationsSeeder(supabase)
        notifications_seeder.seed_notifications(user_ids)

    # ========== STEP 6: Seed Mentor Sessions ==========
    if not args.skip_mentor and config.ENABLE_MENTOR_SESSIONS:
        mentor_seeder = MentorSeeder(supabase)
        mentor_seeder.seed_sessions(user_ids)

    # ========== STEP 7: Generate Embeddings ==========
    if not args.skip_embeddings and config.ENABLE_EMBEDDINGS:
        embeddings_seeder = EmbeddingsSeeder(supabase, config.PYTHON_WORKER_URL)
        embeddings_seeder.seed_embeddings()

    # ========== Verify Data ==========
    verify_data(supabase)

    # Print summary
    elapsed = datetime.now() - start_time
    print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}✓ SEEDING COMPLETE{Style.RESET_ALL}")
    print(
        f"{Fore.GREEN}  Total time: {elapsed.total_seconds():.1f} seconds{Style.RESET_ALL}"
    )
    print(f"{Fore.GREEN}  Profiles created: {len(user_ids)}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

    print(
        f"{Fore.YELLOW}💡 Tip: All users have password 'DemoPass123!' for testing{Style.RESET_ALL}\n"
    )


if __name__ == "__main__":
    main()
