#!/usr/bin/env python3
"""
Collabryx Modular Database Seeder
Environment-driven seeding with individual module control

Usage:
    python main.py --all                     # Run all enabled seeders
    python main.py --profiles                # Seed profiles only
    python main.py --posts                   # Seed posts only
    python main.py --connections             # Seed connections only
    python main.py --matches                 # Seed matches only
    python main.py --conversations           # Seed conversations only
    python main.py --messages                # Seed messages only
    python main.py --notifications           # Seed notifications only
    python main.py --mentor                  # Seed mentor sessions only
    python main.py --embeddings              # Generate embeddings only
"""

import argparse
import sys
import os
import httpx
from datetime import datetime
from colorama import Fore, Style, init

# Initialize colorama
init()

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import config


def print_banner():
    """Print application banner"""
    print(f"\n{Fore.CYAN}")
    print("=" * 60)
    print("  COLLABRYX MODULAR DATABASE SEEDER")
    print("  Environment-driven seeding with real UUIDs")
    print("=" * 60)
    print(f"{Style.RESET_ALL}\n")


def print_config():
    """Print current configuration"""
    print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}SEEDING CONFIGURATION{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")

    # Toggles
    toggles = [
        ("Profiles", config.SEED_PROFILES),
        ("Posts", config.SEED_POSTS),
        ("Connections", config.SEED_CONNECTIONS),
        ("Matches", config.SEED_MATCHES),
        ("Conversations", config.SEED_CONVERSATIONS),
        ("Messages", config.SEED_MESSAGES),
        ("Notifications", config.SEED_NOTIFICATIONS),
        ("Mentor Sessions", config.SEED_MENTOR_SESSIONS),
        ("Embeddings", config.SEED_EMBEDDINGS),
    ]

    print("\nEnabled Seeders:")
    for name, enabled in toggles:
        status = (
            f"{Fore.GREEN}✓{Style.RESET_ALL}"
            if enabled
            else f"{Fore.RED}✗{Style.RESET_ALL}"
        )
        print(f"  {status} {name}")

    # Limits
    print(f"\nLimits:")
    print(f"  Profiles:      {config.LIMIT_PROFILES}")
    print(f"  Posts:         {config.LIMIT_POSTS}")
    print(f"  Connections:   {config.LIMIT_CONNECTIONS}")
    print(f"  Matches/user:  {config.LIMIT_MATCHES_PER_USER}")
    print(f"  Conversations: {config.LIMIT_CONVERSATIONS}")
    print(f"  Messages/conv: {config.LIMIT_MESSAGES_PER_CONVERSATION}")
    print(f"  Notifications: {config.LIMIT_NOTIFICATIONS_PER_USER}")
    print(f"  Mentor:        {config.LIMIT_MENTOR_SESSIONS}")

    print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")


def run_seeders(http_client, args):
    """Run seeders based on arguments and configuration"""

    start_time = datetime.now()
    results = {}

    # Import seeders lazily to avoid circular imports
    if args.profiles or (args.all and config.SEED_PROFILES):
        from seeders.profiles_seeder import ProfilesSeeder

        seeder = ProfilesSeeder(http_client)
        results["profiles"] = seeder.seed()
        http_client.clear_cache()  # Refresh user IDs cache

    if args.posts or (args.all and config.SEED_POSTS):
        from seeders.posts_seeder import PostsSeeder

        seeder = PostsSeeder(http_client)
        results["posts"] = seeder.seed()

    if args.connections or (args.all and config.SEED_CONNECTIONS):
        from seeders.connections_seeder import ConnectionsSeeder

        seeder = ConnectionsSeeder(http_client)
        results["connections"] = seeder.seed()

    if args.matches or (args.all and config.SEED_MATCHES):
        from seeders.matches_seeder import MatchesSeeder

        seeder = MatchesSeeder(http_client)
        results["matches"] = seeder.seed()

    if args.conversations or (args.all and config.SEED_CONVERSATIONS):
        from seeders.conversations_seeder import ConversationsSeeder

        seeder = ConversationsSeeder(http_client)
        results["conversations"] = seeder.seed()

    if args.messages or (args.all and config.SEED_MESSAGES):
        from seeders.messages_seeder import MessagesSeeder

        seeder = MessagesSeeder(http_client)
        results["messages"] = seeder.seed()

    if args.notifications or (args.all and config.SEED_NOTIFICATIONS):
        from seeders.notifications_seeder import NotificationsSeeder

        seeder = NotificationsSeeder(http_client)
        user_ids = (
            http_client.fetch_user_ids()
            if hasattr(http_client, "fetch_user_ids")
            else []
        )
        results["notifications"] = seeder.seed(user_ids)

    if args.mentor or (args.all and config.SEED_MENTOR_SESSIONS):
        from seeders.mentor_seeder import MentorSeeder

        seeder = MentorSeeder(http_client)
        user_ids = (
            http_client.fetch_user_ids()
            if hasattr(http_client, "fetch_user_ids")
            else []
        )
        results["mentor"] = seeder.seed(user_ids)

    if args.embeddings or (args.all and config.SEED_EMBEDDINGS):
        from seeders.embeddings_seeder import EmbeddingsSeeder

        seeder = EmbeddingsSeeder(http_client, config.PYTHON_WORKER_URL)

        # Queue profiles for embeddings
        user_ids = (
            http_client.fetch_user_ids()
            if hasattr(http_client, "fetch_user_ids")
            else []
        )
        if user_ids:
            seeder.queue_profiles_for_embeddings(user_ids)
            seeder.seed_embeddings()

    # Print summary
    elapsed = datetime.now() - start_time
    print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}✓ SEEDING COMPLETE{Style.RESET_ALL}")
    print(
        f"{Fore.GREEN}  Total time: {elapsed.total_seconds():.1f} seconds{Style.RESET_ALL}"
    )
    print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

    print(
        f"{Fore.YELLOW}💡 Tip: All users have password '{config.DEFAULT_PASSWORD}' for testing{Style.RESET_ALL}\n"
    )

    return results


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Collabryx Modular Database Seeder",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python main.py --all                     Run all enabled seeders
  python main.py --profiles                Seed profiles only
  python main.py --posts --connections     Seed posts and connections
  python main.py --all --limit-profiles 50 Override profile limit
        """,
    )

    # Individual seeders
    parser.add_argument("--profiles", action="store_true", help="Seed profiles only")
    parser.add_argument("--posts", action="store_true", help="Seed posts only")
    parser.add_argument(
        "--connections", action="store_true", help="Seed connections only"
    )
    parser.add_argument("--matches", action="store_true", help="Seed matches only")
    parser.add_argument(
        "--conversations", action="store_true", help="Seed conversations only"
    )
    parser.add_argument("--messages", action="store_true", help="Seed messages only")
    parser.add_argument(
        "--notifications", action="store_true", help="Seed notifications only"
    )
    parser.add_argument(
        "--mentor", action="store_true", help="Seed mentor sessions only"
    )
    parser.add_argument(
        "--embeddings", action="store_true", help="Generate embeddings only"
    )

    # Control flags
    parser.add_argument(
        "--all", action="store_true", help="Run all enabled seeders (based on .env)"
    )
    parser.add_argument(
        "--list", action="store_true", help="Show configuration and exit"
    )

    # Override limits
    parser.add_argument("--limit-profiles", type=int, help="Override LIMIT_PROFILES")
    parser.add_argument("--limit-posts", type=int, help="Override LIMIT_POSTS")
    parser.add_argument(
        "--limit-connections", type=int, help="Override LIMIT_CONNECTIONS"
    )
    parser.add_argument(
        "--limit-conversations", type=int, help="Override LIMIT_CONVERSATIONS"
    )

    args = parser.parse_args()

    # Print banner
    print_banner()

    # Validate configuration
    if not config.validate():
        sys.exit(1)

    # Show configuration if requested
    if args.list:
        print_config()
        return

    # Print configuration
    print_config()

    # Apply limit overrides
    if args.limit_profiles:
        config.LIMIT_PROFILES = str(args.limit_profiles)
    if args.limit_posts:
        config.LIMIT_POSTS = str(args.limit_posts)
    if args.limit_connections:
        config.LIMIT_CONNECTIONS = str(args.limit_connections)
    if args.limit_conversations:
        config.LIMIT_CONVERSATIONS = str(args.limit_conversations)

    # Initialize HTTP client with service role key
    try:
        http_client = httpx.Client(
            timeout=30.0,
            headers={
                "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {config.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
            },
        )

        # Add helper methods to http_client
        from seeders.base_seeder import BaseSeeder

        base = BaseSeeder(http_client)
        http_client.fetch_user_ids = base.fetch_user_ids
        http_client.fetch_existing_conversations = base.fetch_existing_conversations
        http_client.clear_cache = base.clear_cache

        print(f"{Fore.GREEN}✓ Connected to Supabase{Style.RESET_ALL}\n")
    except Exception as e:
        print(f"{Fore.RED}✗ Failed to connect to Supabase: {e}{Style.RESET_ALL}")
        print(
            "   Make sure your SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are correct"
        )
        sys.exit(1)

    # Determine what to run
    run_any = any(
        [
            args.profiles,
            args.posts,
            args.connections,
            args.matches,
            args.conversations,
            args.messages,
            args.notifications,
            args.mentor,
            args.embeddings,
        ]
    )

    if not run_any and not args.all:
        args.all = True  # Default to --all if no specific seeder specified

    # Run seeders
    try:
        run_seeders(http_client, args)
    finally:
        http_client.close()


if __name__ == "__main__":
    main()
