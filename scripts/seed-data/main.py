#!/usr/bin/env python3
"""
Collabryx Interactive Database Seeder
Menu-driven seeding system with real-time configuration

Usage:
    python main.py
"""

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


def print_header():
    """Print application header"""
    print(f"\n{Fore.CYAN}")
    print("=" * 70)
    print("  🚀 COLLABRYX INTERACTIVE DATABASE SEEDER")
    print("  Environment-driven seeding with real UUIDs from Supabase")
    print("=" * 70)
    print(f"{Style.RESET_ALL}\n")


def print_menu():
    """Print main menu"""
    print(f"\n{Fore.YELLOW}{'=' * 70}{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}MAIN MENU{Style.RESET_ALL}")
    print(f"{Fore.YELLOW}{'=' * 70}{Style.RESET_ALL}\n")

    print(f"{Fore.GREEN}SEEDING MODULES:{Style.RESET_ALL}")
    print("  1. 👤 Seed Profiles (users with complete data)")
    print("  2. 📝 Seed Posts (with comments & reactions)")
    print("  3. 🔗 Seed Connections (user relationships)")
    print("  4. 🎯 Seed Matches (AI-powered suggestions)")
    print("  5. 💬 Seed Conversations (chat threads)")
    print("  6. 💭 Seed Messages (in conversations)")
    print("  7. 🔔 Seed Notifications (activity feed)")
    print("  8. 🤖 Seed Mentor Sessions (AI mentoring)")
    print("  9. 🧠 Generate Embeddings (vector embeddings via worker)")

    print(f"\n{Fore.GREEN}BATCH OPERATIONS:{Style.RESET_ALL}")
    print("  10. ⚡ Seed Everything (all modules in sequence)")
    print("  11. 🎯 Seed Social Graph (connections + matches)")
    print("  12. 💬 Seed Messaging (conversations + messages)")

    print(f"\n{Fore.GREEN}CONFIGURATION:{Style.RESET_ALL}")
    print("  13. ⚙️  View/Modify Configuration")
    print("  14. 📊 Check Database Status")
    print("  15. 🐍 Check Python Worker Status")

    print(f"\n{Fore.RED}0. Exit{Style.RESET_ALL}")
    print(f"\n{Fore.YELLOW}{'=' * 70}{Style.RESET_ALL}")


def print_sub_menu(title, options):
    """Print sub-menu"""
    print(f"\n{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{title}{Style.RESET_ALL}")
    print(f"{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}\n")

    for key, value in options.items():
        print(f"  {key}. {value}")

    print(f"\n  0. Back to Main Menu")
    print(f"\n{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}")


def get_input(prompt, default=None, input_type=int):
    """Get user input with validation"""
    while True:
        try:
            if default is not None:
                user_input = input(
                    f"{Fore.YELLOW}{prompt} [{default}]: {Style.RESET_ALL}"
                ).strip()
                if not user_input:
                    return default
            else:
                user_input = input(f"{Fore.YELLOW}{prompt}: {Style.RESET_ALL}").strip()
                if not user_input:
                    return None

            if input_type == int:
                return int(user_input)
            elif input_type == float:
                return float(user_input)
            else:
                return user_input

        except ValueError:
            print(f"{Fore.RED}✗ Invalid input. Please try again.{Style.RESET_ALL}")


def confirm_action(message):
    """Get confirmation from user"""
    response = input(f"{Fore.YELLOW}{message} (y/n): {Style.RESET_ALL}").strip().lower()
    return response in ["y", "yes", "ye"]


def seed_profiles_menu(http_client):
    """Profiles seeding sub-menu"""
    while True:
        print_sub_menu(
            "PROFILES SEEDING",
            {
                "1": "Seed with default limit (100 profiles)",
                "2": "Seed with custom limit",
                "3": "Seed unlimited (until stopped)",
                "4": "View current configuration",
            },
        )

        choice = get_input("Select option", default=1)

        if choice == 0:
            return
        elif choice == 1:
            from seeders.profiles_seeder import ProfilesSeeder

            seeder = ProfilesSeeder(http_client)
            seeder.seed_profiles(count=100)
        elif choice == 2:
            limit = get_input("Enter number of profiles", default=100)
            from seeders.profiles_seeder import ProfilesSeeder

            seeder = ProfilesSeeder(http_client)
            seeder.seed_profiles(count=limit)
        elif choice == 3:
            if confirm_action("This will create profiles continuously. Continue?"):
                from seeders.profiles_seeder import ProfilesSeeder

                seeder = ProfilesSeeder(http_client)
                count = 0
                while True:
                    seeder.seed_profiles(count=10)
                    count += 10
                    if not confirm_action(f"Created {count} profiles. Continue?"):
                        break
        elif choice == 4:
            print(f"\n{Fore.GREEN}Current Configuration:{Style.RESET_ALL}")
            print(f"  LIMIT_PROFILES: {config.LIMIT_PROFILES}")
            print(f"  BATCH_SIZE: {config.BATCH_SIZE}")
            print(f"  DELAY_BETWEEN_BATCHES: {config.DELAY_BETWEEN_BATCHES}s")


def seed_posts_menu(http_client):
    """Posts seeding sub-menu"""
    while True:
        print_sub_menu(
            "POSTS SEEDING",
            {
                "1": "Seed with default limit (300 posts)",
                "2": "Seed with custom limit",
                "3": "Set comments per post range",
                "4": "Set reactions per post range",
                "5": "View current configuration",
            },
        )

        choice = get_input("Select option", default=1)

        if choice == 0:
            return
        elif choice == 1:
            from seeders.posts_seeder import PostsSeeder

            seeder = PostsSeeder(http_client)
            seeder.seed(limit=300)
        elif choice == 2:
            limit = get_input("Enter number of posts", default=300)
            from seeders.posts_seeder import PostsSeeder

            seeder = PostsSeeder(http_client)
            seeder.seed(limit=limit)
        elif choice == 3:
            range_str = get_input(
                "Enter range (min,max)", default="3,8", input_type=str
            )
            config.LIMIT_COMMENTS_PER_POST = range_str
            print(
                f"{Fore.GREEN}✓ Updated comments per post to {range_str}{Style.RESET_ALL}"
            )
        elif choice == 4:
            range_str = get_input(
                "Enter range (min,max)", default="5,15", input_type=str
            )
            config.LIMIT_REACTIONS_PER_POST = range_str
            print(
                f"{Fore.GREEN}✓ Updated reactions per post to {range_str}{Style.RESET_ALL}"
            )
        elif choice == 5:
            print(f"\n{Fore.GREEN}Current Configuration:{Style.RESET_ALL}")
            print(f"  LIMIT_POSTS: {config.LIMIT_POSTS}")
            print(f"  LIMIT_COMMENTS_PER_POST: {config.LIMIT_COMMENTS_PER_POST}")
            print(f"  LIMIT_REACTIONS_PER_POST: {config.LIMIT_REACTIONS_PER_POST}")


def seed_connections_menu(http_client):
    """Connections seeding sub-menu"""
    while True:
        print_sub_menu(
            "CONNECTIONS SEEDING",
            {
                "1": "Seed with default limit (500 connections)",
                "2": "Seed with custom limit",
                "3": "View current configuration",
            },
        )

        choice = get_input("Select option", default=1)

        if choice == 0:
            return
        elif choice == 1:
            from seeders.connections_seeder import ConnectionsSeeder

            seeder = ConnectionsSeeder(http_client)
            seeder.seed(limit=500)
        elif choice == 2:
            limit = get_input("Enter number of connections", default=500)
            from seeders.connections_seeder import ConnectionsSeeder

            seeder = ConnectionsSeeder(http_client)
            seeder.seed(limit=limit)
        elif choice == 3:
            print(f"\n{Fore.GREEN}Current Configuration:{Style.RESET_ALL}")
            print(f"  LIMIT_CONNECTIONS: {config.LIMIT_CONNECTIONS}")


def seed_matches_menu(http_client):
    """Matches seeding sub-menu"""
    while True:
        print_sub_menu(
            "MATCHES SEEDING",
            {
                "1": "Seed with default (5 per user)",
                "2": "Seed with custom matches per user",
                "3": "View current configuration",
            },
        )

        choice = get_input("Select option", default=1)

        if choice == 0:
            return
        elif choice == 1:
            from seeders.matches_seeder import MatchesSeeder

            seeder = MatchesSeeder(http_client)
            seeder.seed(limit_per_user=5)
        elif choice == 2:
            limit = get_input("Enter matches per user", default=5)
            from seeders.matches_seeder import MatchesSeeder

            seeder = MatchesSeeder(http_client)
            seeder.seed(limit_per_user=limit)
        elif choice == 3:
            print(f"\n{Fore.GREEN}Current Configuration:{Style.RESET_ALL}")
            print(f"  LIMIT_MATCHES_PER_USER: {config.LIMIT_MATCHES_PER_USER}")


def seed_conversations_menu(http_client):
    """Conversations seeding sub-menu"""
    while True:
        print_sub_menu(
            "CONVERSATIONS SEEDING",
            {
                "1": "Seed with default limit (150 conversations)",
                "2": "Seed with custom limit",
                "3": "View current configuration",
            },
        )

        choice = get_input("Select option", default=1)

        if choice == 0:
            return
        elif choice == 1:
            from seeders.conversations_seeder import ConversationsSeeder

            seeder = ConversationsSeeder(http_client)
            seeder.seed(limit=150)
        elif choice == 2:
            limit = get_input("Enter number of conversations", default=150)
            from seeders.conversations_seeder import ConversationsSeeder

            seeder = ConversationsSeeder(http_client)
            seeder.seed(limit=limit)
        elif choice == 3:
            print(f"\n{Fore.GREEN}Current Configuration:{Style.RESET_ALL}")
            print(f"  LIMIT_CONVERSATIONS: {config.LIMIT_CONVERSATIONS}")


def seed_messages_menu(http_client):
    """Messages seeding sub-menu"""
    while True:
        print_sub_menu(
            "MESSAGES SEEDING",
            {
                "1": "Seed with default (5-20 per conversation)",
                "2": "Set custom messages per conversation range",
                "3": "View current configuration",
            },
        )

        choice = get_input("Select option", default=1)

        if choice == 0:
            return
        elif choice == 1:
            from seeders.messages_seeder import MessagesSeeder

            seeder = MessagesSeeder(http_client)
            seeder.seed()
        elif choice == 2:
            range_str = get_input(
                "Enter range (min,max)", default="5,20", input_type=str
            )
            config.LIMIT_MESSAGES_PER_CONVERSATION = range_str
            print(
                f"{Fore.GREEN}✓ Updated messages per conversation to {range_str}{Style.RESET_ALL}"
            )
        elif choice == 3:
            print(f"\n{Fore.GREEN}Current Configuration:{Style.RESET_ALL}")
            print(
                f"  LIMIT_MESSAGES_PER_CONVERSATION: {config.LIMIT_MESSAGES_PER_CONVERSATION}"
            )


def seed_notifications_menu(http_client):
    """Notifications seeding sub-menu"""
    while True:
        print_sub_menu(
            "NOTIFICATIONS SEEDING",
            {
                "1": "Seed with default (5 per user)",
                "2": "Seed with custom notifications per user",
                "3": "View current configuration",
            },
        )

        choice = get_input("Select option", default=1)

        if choice == 0:
            return
        elif choice == 1:
            from seeders.notifications_seeder import NotificationsSeeder

            seeder = NotificationsSeeder(http_client)
            user_ids = (
                http_client.fetch_user_ids()
                if hasattr(http_client, "fetch_user_ids")
                else []
            )
            seeder.seed(user_ids)
        elif choice == 2:
            limit = get_input("Enter notifications per user", default=5)
            from seeders.notifications_seeder import NotificationsSeeder

            seeder = NotificationsSeeder(http_client)
            user_ids = (
                http_client.fetch_user_ids()
                if hasattr(http_client, "fetch_user_ids")
                else []
            )
            config.LIMIT_NOTIFICATIONS_PER_USER = str(limit)
            seeder.seed(user_ids)
        elif choice == 3:
            print(f"\n{Fore.GREEN}Current Configuration:{Style.RESET_ALL}")
            print(
                f"  LIMIT_NOTIFICATIONS_PER_USER: {config.LIMIT_NOTIFICATIONS_PER_USER}"
            )


def seed_mentor_menu(http_client):
    """Mentor sessions seeding sub-menu"""
    while True:
        print_sub_menu(
            "MENTOR SESSIONS SEEDING",
            {
                "1": "Seed with default (50 sessions)",
                "2": "Seed with custom limit",
                "3": "View current configuration",
            },
        )

        choice = get_input("Select option", default=1)

        if choice == 0:
            return
        elif choice == 1:
            from seeders.mentor_seeder import MentorSeeder

            seeder = MentorSeeder(http_client)
            user_ids = (
                http_client.fetch_user_ids()
                if hasattr(http_client, "fetch_user_ids")
                else []
            )
            seeder.seed(user_ids)
        elif choice == 2:
            limit = get_input("Enter number of mentor sessions", default=50)
            from seeders.mentor_seeder import MentorSeeder

            seeder = MentorSeeder(http_client)
            user_ids = (
                http_client.fetch_user_ids()
                if hasattr(http_client, "fetch_user_ids")
                else []
            )
            config.LIMIT_MENTOR_SESSIONS = str(limit)
            seeder.seed(user_ids)
        elif choice == 3:
            print(f"\n{Fore.GREEN}Current Configuration:{Style.RESET_ALL}")
            print(f"  LIMIT_MENTOR_SESSIONS: {config.LIMIT_MENTOR_SESSIONS}")


def seed_embeddings_menu(http_client):
    """Embeddings seeding sub-menu"""
    while True:
        print_sub_menu(
            "EMBEDDINGS GENERATION",
            {
                "1": "Generate embeddings for all profiles",
                "2": "Queue profiles for embeddings",
                "3": "Check worker health",
                "4": "View embedding status",
            },
        )

        choice = get_input("Select option", default=1)

        if choice == 0:
            return
        elif choice == 1:
            from seeders.embeddings_seeder import EmbeddingsSeeder

            seeder = EmbeddingsSeeder(http_client, config.PYTHON_WORKER_URL)

            try:
                import httpx as hx

                health = hx.get(f"{config.PYTHON_WORKER_URL}/health", timeout=5.0)
                if health.status_code != 200:
                    print(
                        f"{Fore.RED}✗ Python worker not healthy. Status: {health.status_code}{Style.RESET_ALL}"
                    )
                    if not confirm_action("Continue anyway?"):
                        return
            except Exception as e:
                print(
                    f"{Fore.RED}✗ Cannot connect to Python worker: {e}{Style.RESET_ALL}"
                )
                if not confirm_action("Continue anyway?"):
                    return

            user_ids = (
                http_client.fetch_user_ids()
                if hasattr(http_client, "fetch_user_ids")
                else []
            )
            if user_ids:
                seeder.queue_profiles_for_embeddings(user_ids)
                seeder.seed_embeddings()
            else:
                print(
                    f"{Fore.RED}✗ No profiles found. Seed profiles first.{Style.RESET_ALL}"
                )
        elif choice == 2:
            from seeders.embeddings_seeder import EmbeddingsSeeder

            seeder = EmbeddingsSeeder(http_client, config.PYTHON_WORKER_URL)
            user_ids = (
                http_client.fetch_user_ids()
                if hasattr(http_client, "fetch_user_ids")
                else []
            )
            seeder.queue_profiles_for_embeddings(user_ids)
        elif choice == 3:
            try:
                import httpx as hx

                health = hx.get(f"{config.PYTHON_WORKER_URL}/health", timeout=5.0)
                if health.status_code == 200:
                    print(f"\n{Fore.GREEN}✓ Python worker is healthy{Style.RESET_ALL}")
                    print(f"Response: {health.json()}")
                else:
                    print(
                        f"{Fore.RED}✗ Worker returned status {health.status_code}{Style.RESET_ALL}"
                    )
            except Exception as e:
                print(f"{Fore.RED}✗ Cannot connect to worker: {e}{Style.RESET_ALL}")
        elif choice == 4:
            print(f"\n{Fore.YELLOW}Checking embedding status...{Style.RESET_ALL}")
            print(
                "Use Supabase Dashboard → Table Editor → profile_embeddings to view status"
            )


def seed_everything_menu(http_client):
    """Seed all modules"""
    if not confirm_action("This will run ALL seeders. Continue?"):
        return

    print(f"\n{Fore.GREEN}{'=' * 70}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}🚀 SEEDING EVERYTHING{Style.RESET_ALL}")
    print(f"{Fore.GREEN}{'=' * 70}{Style.RESET_ALL}\n")

    start_time = datetime.now()

    print(f"\n{Fore.CYAN}[1/9] Seeding Profiles...{Style.RESET_ALL}")
    from seeders.profiles_seeder import ProfilesSeeder

    seeder = ProfilesSeeder(http_client)
    user_ids = seeder.seed_profiles(count=100)
    http_client.clear_cache()

    if not user_ids:
        print(f"{Fore.RED}✗ Profile seeding failed. Aborting.{Style.RESET_ALL}")
        return

    print(f"\n{Fore.CYAN}[2/9] Seeding Posts...{Style.RESET_ALL}")
    from seeders.posts_seeder import PostsSeeder

    seeder = PostsSeeder(http_client)
    seeder.seed(limit=300)

    print(f"\n{Fore.CYAN}[3/9] Seeding Connections...{Style.RESET_ALL}")
    from seeders.connections_seeder import ConnectionsSeeder

    seeder = ConnectionsSeeder(http_client)
    seeder.seed(limit=500)

    print(f"\n{Fore.CYAN}[4/9] Seeding Matches...{Style.RESET_ALL}")
    from seeders.matches_seeder import MatchesSeeder

    seeder = MatchesSeeder(http_client)
    seeder.seed(limit_per_user=5)

    print(f"\n{Fore.CYAN}[5/9] Seeding Conversations...{Style.RESET_ALL}")
    from seeders.conversations_seeder import ConversationsSeeder

    seeder = ConversationsSeeder(http_client)
    seeder.seed(limit=150)

    print(f"\n{Fore.CYAN}[6/9] Seeding Messages...{Style.RESET_ALL}")
    from seeders.messages_seeder import MessagesSeeder

    seeder = MessagesSeeder(http_client)
    seeder.seed()

    print(f"\n{Fore.CYAN}[7/9] Seeding Notifications...{Style.RESET_ALL}")
    from seeders.notifications_seeder import NotificationsSeeder

    seeder = NotificationsSeeder(http_client)
    seeder.seed(user_ids)

    print(f"\n{Fore.CYAN}[8/9] Seeding Mentor Sessions...{Style.RESET_ALL}")
    from seeders.mentor_seeder import MentorSeeder

    seeder = MentorSeeder(http_client)
    seeder.seed(user_ids)

    print(f"\n{Fore.CYAN}[9/9] Generating Embeddings...{Style.RESET_ALL}")
    from seeders.embeddings_seeder import EmbeddingsSeeder

    seeder = EmbeddingsSeeder(http_client, config.PYTHON_WORKER_URL)
    seeder.queue_profiles_for_embeddings(user_ids)
    seeder.seed_embeddings()

    elapsed = datetime.now() - start_time
    print(f"\n{Fore.GREEN}{'=' * 70}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}✓ SEEDING COMPLETE{Style.RESET_ALL}")
    print(
        f"{Fore.GREEN}  Total time: {elapsed.total_seconds():.1f} seconds{Style.RESET_ALL}"
    )
    print(f"{Fore.GREEN}{'=' * 70}{Style.RESET_ALL}\n")


def seed_social_graph_menu(http_client):
    """Seed connections and matches"""
    if not confirm_action("Seed connections and matches?"):
        return

    print(f"\n{Fore.CYAN}[1/2] Seeding Connections...{Style.RESET_ALL}")
    from seeders.connections_seeder import ConnectionsSeeder

    seeder = ConnectionsSeeder(http_client)
    seeder.seed(limit=500)

    print(f"\n{Fore.CYAN}[2/2] Seeding Matches...{Style.RESET_ALL}")
    from seeders.matches_seeder import MatchesSeeder

    seeder = MatchesSeeder(http_client)
    seeder.seed(limit_per_user=5)


def seed_messaging_menu(http_client):
    """Seed conversations and messages"""
    if not confirm_action("Seed conversations and messages?"):
        return

    print(f"\n{Fore.CYAN}[1/2] Seeding Conversations...{Style.RESET_ALL}")
    from seeders.conversations_seeder import ConversationsSeeder

    seeder = ConversationsSeeder(http_client)
    seeder.seed(limit=150)

    print(f"\n{Fore.CYAN}[2/2] Seeding Messages...{Style.RESET_ALL}")
    from seeders.messages_seeder import MessagesSeeder

    seeder = MessagesSeeder(http_client)
    seeder.seed()


def view_configuration_menu(http_client):
    """View and modify configuration"""
    while True:
        print_sub_menu(
            "CONFIGURATION",
            {
                "1": "View all settings",
                "2": "Modify profile limit",
                "3": "Modify posts limit",
                "4": "Modify connections limit",
                "5": "Modify batch size",
                "6": "Modify delay between batches",
            },
        )

        choice = get_input("Select option", default=1)

        if choice == 0:
            return
        elif choice == 1:
            print(f"\n{Fore.GREEN}Current Configuration:{Style.RESET_ALL}")
            print(f"\n{Fore.YELLOW}Limits:{Style.RESET_ALL}")
            print(f"  LIMIT_PROFILES: {config.LIMIT_PROFILES}")
            print(f"  LIMIT_POSTS: {config.LIMIT_POSTS}")
            print(f"  LIMIT_CONNECTIONS: {config.LIMIT_CONNECTIONS}")
            print(f"  LIMIT_MATCHES_PER_USER: {config.LIMIT_MATCHES_PER_USER}")
            print(f"  LIMIT_CONVERSATIONS: {config.LIMIT_CONVERSATIONS}")
            print(
                f"  LIMIT_MESSAGES_PER_CONVERSATION: {config.LIMIT_MESSAGES_PER_CONVERSATION}"
            )
            print(f"  LIMIT_COMMENTS_PER_POST: {config.LIMIT_COMMENTS_PER_POST}")
            print(f"  LIMIT_REACTIONS_PER_POST: {config.LIMIT_REACTIONS_PER_POST}")
            print(
                f"  LIMIT_NOTIFICATIONS_PER_USER: {config.LIMIT_NOTIFICATIONS_PER_USER}"
            )
            print(f"  LIMIT_MENTOR_SESSIONS: {config.LIMIT_MENTOR_SESSIONS}")
            print(f"\n{Fore.YELLOW}Batch Processing:{Style.RESET_ALL}")
            print(f"  BATCH_SIZE: {config.BATCH_SIZE}")
            print(f"  DELAY_BETWEEN_BATCHES: {config.DELAY_BETWEEN_BATCHES}s")
        elif choice == 2:
            limit = get_input("Enter profile limit", default=int(config.LIMIT_PROFILES))
            config.LIMIT_PROFILES = str(limit)
            print(f"{Fore.GREEN}✓ Updated LIMIT_PROFILES to {limit}{Style.RESET_ALL}")
        elif choice == 3:
            limit = get_input("Enter posts limit", default=int(config.LIMIT_POSTS))
            config.LIMIT_POSTS = str(limit)
            print(f"{Fore.GREEN}✓ Updated LIMIT_POSTS to {limit}{Style.RESET_ALL}")
        elif choice == 4:
            limit = get_input(
                "Enter connections limit", default=int(config.LIMIT_CONNECTIONS)
            )
            config.LIMIT_CONNECTIONS = str(limit)
            print(
                f"{Fore.GREEN}✓ Updated LIMIT_CONNECTIONS to {limit}{Style.RESET_ALL}"
            )
        elif choice == 5:
            size = get_input("Enter batch size", default=config.BATCH_SIZE)
            config.BATCH_SIZE = size
            print(f"{Fore.GREEN}✓ Updated BATCH_SIZE to {size}{Style.RESET_ALL}")
        elif choice == 6:
            delay = get_input(
                "Enter delay (seconds)", default=config.DELAY_BETWEEN_BATCHES
            )
            config.DELAY_BETWEEN_BATCHES = delay
            print(
                f"{Fore.GREEN}✓ Updated DELAY_BETWEEN_BATCHES to {delay}s{Style.RESET_ALL}"
            )


def check_database_status(http_client):
    """Check database status"""
    print(f"\n{Fore.YELLOW}Checking database status...{Style.RESET_ALL}\n")

    try:
        response = http_client.get(
            f"{config.SUPABASE_REST_URL}/profiles?select=id&limit=1",
            headers=config.API_HEADERS,
        )
        profiles_count = len(response.json()) if response.json() else 0
        print(f"  {Fore.GREEN}✓ Profiles:{Style.RESET_ALL} {profiles_count} users")

        response = http_client.get(
            f"{config.SUPABASE_REST_URL}/posts?select=id&limit=1",
            headers=config.API_HEADERS,
        )
        posts_count = len(response.json()) if response.json() else 0
        print(f"  {Fore.GREEN}✓ Posts:{Style.RESET_ALL} {posts_count} posts")

        response = http_client.get(
            f"{config.SUPABASE_REST_URL}/connections?select=id&limit=1",
            headers=config.API_HEADERS,
        )
        connections_count = len(response.json()) if response.json() else 0
        print(
            f"  {Fore.GREEN}✓ Connections:{Style.RESET_ALL} {connections_count} connections"
        )

        response = http_client.get(
            f"{config.SUPABASE_REST_URL}/conversations?select=id&limit=1",
            headers=config.API_HEADERS,
        )
        conversations_count = len(response.json()) if response.json() else 0
        print(
            f"  {Fore.GREEN}✓ Conversations:{Style.RESET_ALL} {conversations_count} conversations"
        )

        response = http_client.get(
            f"{config.SUPABASE_REST_URL}/profile_embeddings?select=id,status&limit=100",
            headers=config.API_HEADERS,
        )
        embeddings = response.json() or []
        completed = len([e for e in embeddings if e.get("status") == "completed"])
        pending = len([e for e in embeddings if e.get("status") == "pending"])
        print(
            f"  {Fore.GREEN}✓ Embeddings:{Style.RESET_ALL} {completed} completed, {pending} pending"
        )

    except Exception as e:
        print(f"{Fore.RED}✗ Error checking status: {e}{Style.RESET_ALL}")


def check_worker_status(http_client):
    """Check Python worker status"""
    print(f"\n{Fore.YELLOW}Checking Python worker status...{Style.RESET_ALL}\n")

    try:
        import httpx as hx

        response = hx.get(f"{config.PYTHON_WORKER_URL}/health", timeout=5.0)

        if response.status_code == 200:
            data = response.json()
            print(
                f"  {Fore.GREEN}✓ Worker Status:{Style.RESET_ALL} {data.get('status', 'unknown')}"
            )
            print(
                f"  {Fore.GREEN}✓ Model:{Style.RESET_ALL} {data.get('model_info', {}).get('model_name', 'unknown')}"
            )
            print(
                f"  {Fore.GREEN}✓ Dimensions:{Style.RESET_ALL} {data.get('model_info', {}).get('dimensions', 'unknown')}"
            )
            print(
                f"  {Fore.GREEN}✓ Queue Size:{Style.RESET_ALL} {data.get('queue_size', 'unknown')}"
            )
            print(
                f"  {Fore.GREEN}✓ Supabase Connected:{Style.RESET_ALL} {data.get('supabase_connected', False)}"
            )
        else:
            print(
                f"{Fore.RED}✗ Worker returned status {response.status_code}{Style.RESET_ALL}"
            )

    except Exception as e:
        print(f"{Fore.RED}✗ Cannot connect to worker: {e}{Style.RESET_ALL}")
        print(f"   Make sure Docker container is running: docker-compose up -d")


def main():
    """Main entry point"""
    print_header()

    if not config.validate():
        print(f"\n{Fore.RED}✗ Configuration validation failed.{Style.RESET_ALL}")
        print(f"   Please create a .env file with your Supabase credentials.")
        input(f"\n{Fore.YELLOW}Press Enter to exit...{Style.RESET_ALL}")
        return

    try:
        http_client = httpx.Client(
            timeout=30.0,
            headers={
                "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {config.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
            },
        )

        from seeders.base_seeder import BaseSeeder

        base = BaseSeeder(http_client)
        http_client.fetch_user_ids = base.fetch_user_ids
        http_client.fetch_existing_conversations = base.fetch_existing_conversations
        http_client.clear_cache = base.clear_cache

        print(f"{Fore.GREEN}✓ Connected to Supabase{Style.RESET_ALL}\n")

    except Exception as e:
        print(f"{Fore.RED}✗ Failed to connect to Supabase: {e}{Style.RESET_ALL}")
        input(f"\n{Fore.YELLOW}Press Enter to exit...{Style.RESET_ALL}")
        return

    while True:
        print_menu()

        choice = get_input("Select option", default=0)

        if choice == 0:
            print(f"\n{Fore.GREEN}Goodbye! 👋{Style.RESET_ALL}\n")
            http_client.close()
            return
        elif choice == 1:
            seed_profiles_menu(http_client)
        elif choice == 2:
            seed_posts_menu(http_client)
        elif choice == 3:
            seed_connections_menu(http_client)
        elif choice == 4:
            seed_matches_menu(http_client)
        elif choice == 5:
            seed_conversations_menu(http_client)
        elif choice == 6:
            seed_messages_menu(http_client)
        elif choice == 7:
            seed_notifications_menu(http_client)
        elif choice == 8:
            seed_mentor_menu(http_client)
        elif choice == 9:
            seed_embeddings_menu(http_client)
        elif choice == 10:
            seed_everything_menu(http_client)
        elif choice == 11:
            seed_social_graph_menu(http_client)
        elif choice == 12:
            seed_messaging_menu(http_client)
        elif choice == 13:
            view_configuration_menu(http_client)
        elif choice == 14:
            check_database_status(http_client)
        elif choice == 15:
            check_worker_status(http_client)
        else:
            print(f"{Fore.RED}✗ Invalid option. Please try again.{Style.RESET_ALL}")


if __name__ == "__main__":
    main()
