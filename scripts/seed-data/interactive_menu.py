#!/usr/bin/env python3
"""
Interactive Menu with Arrow Key Navigation
Supports up/down navigation and space bar for multi-selection
"""

import sys
import msvcrt
from colorama import Fore, Style, init

init()


class InteractiveMenu:
    """Interactive menu with arrow key navigation and multi-selection"""

    def __init__(self, title: str, options: list, allow_multi_select: bool = False):
        self.title = title
        self.options = options  # List of dicts: {'label': str, 'action': callable, 'warning': str (optional)}
        self.selected_index = 0
        self.selected_items = set()  # For multi-select
        self.allow_multi_select = allow_multi_select

    def display(self):
        """Display the menu"""
        # Only clear screen if not first display
        if hasattr(self, "_displayed"):
            # Move cursor to home position instead of clearing
            print("\033[H", end="")
        self._displayed = True

        # Print header
        print(f"{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{self.title}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}\n")

        if self.allow_multi_select:
            print(f"{Fore.YELLOW}Instructions:{Style.RESET_ALL}")
            print(f"  ↑/↓ : Navigate options")
            print(f"  SPACE : Select/deselect option")
            print(f"  ENTER : Execute selected option(s)")
            print(f"  Q : Quit\n")
        else:
            print(f"{Fore.YELLOW}Instructions:{Style.RESET_ALL}")
            print(f"  ↑/↓ : Navigate options")
            print(f"  ENTER : Select option")
            print(f"  Q : Quit\n")

        # Print options
        for i, option in enumerate(self.options):
            if i == self.selected_index:
                # Selected option
                if i in self.selected_items:
                    print(
                        f"  {Fore.GREEN}▶ [{Fore.WHITE}✓{Fore.GREEN}]{Style.RESET_ALL} {option['label']}"
                    )
                else:
                    print(f"  {Fore.GREEN}▶ [ ]{Style.RESET_ALL} {option['label']}")

                # Show warning if exists
                if "warning" in option:
                    print(f"      {Fore.RED}⚠️  {option['warning']}{Style.RESET_ALL}")
            else:
                # Non-selected option
                if i in self.selected_items:
                    print(f"    {Fore.GREEN}  [✓]{Style.RESET_ALL} {option['label']}")
                else:
                    print(f"      [ ] {option['label']}")

        print(f"\n{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}")

        if self.allow_multi_select and self.selected_items:
            selected_labels = [self.options[i]["label"] for i in self.selected_items]
            print(
                f"{Fore.GREEN}Selected: {', '.join(selected_labels)}{Style.RESET_ALL}\n"
            )

    def handle_input(self) -> bool:
        """Handle keyboard input. Returns False to exit."""
        import time
        time.sleep(0.05)  # Small delay to prevent CPU spinning
        
        try:
            if msvcrt.kbhit():
                key = msvcrt.getch()
                
                if key == b'\x00' or key == b'\xe0':  # Arrow keys
                    key = msvcrt.getch()
                    if key == b'H':  # Up arrow
                        self.selected_index = max(0, self.selected_index - 1)
                        return True
                    elif key == b'P':  # Down arrow
                        self.selected_index = min(len(self.options) - 1, self.selected_index + 1)
                        return True
                
                elif key == b' ':  # Space bar (multi-select only)
                    if self.allow_multi_select:
                        if self.selected_index in self.selected_items:
                            self.selected_items.remove(self.selected_index)
                        else:
                            self.selected_items.add(self.selected_index)
                    return True
                
                elif key == b'\r':  # Enter
                    return False  # Exit to execute
                
                elif key.lower() == b'q':  # Quit
                    return False
                
        except Exception as e:
            print(f"Error: {e}")
            pass
        
        return True
                    elif key == b"P":  # Down arrow
                        self.selected_index = (self.selected_index + 1) % len(
                            self.options
                        )
                        return True

                elif key == b" ":  # Space bar (multi-select only)
                    if self.allow_multi_select:
                        if self.selected_index in self.selected_items:
                            self.selected_items.remove(self.selected_index)
                        else:
                            self.selected_items.add(self.selected_index)
                    return True

                elif key == b"\r":  # Enter
                    return False  # Exit to execute

                elif key.lower() == b"q":  # Quit
                    return False

        except Exception:
            pass

        return True

    def run(self):
        """Run the interactive menu and return selected action(s)"""
        # Initial display
        self.display()
        
        while True:
            if not self.handle_input():
                break

        # Return selected option(s)
        if self.allow_multi_select:
            return [self.options[i] for i in self.selected_items]
        else:
            return self.options[self.selected_index]


def run_interactive_seeder():
    """Run the interactive seeder with arrow key navigation"""
    from config import config
    import httpx
    from datetime import datetime

    # Import seeders
    from seeders.profiles_seeder import ProfilesSeeder
    from seeders.posts_seeder import PostsSeeder
    from seeders.connections_seeder import ConnectionsSeeder
    from seeders.matches_seeder import MatchesSeeder
    from seeders.conversations_seeder import ConversationsSeeder
    from seeders.messages_seeder import MessagesSeeder
    from seeders.notifications_seeder import NotificationsSeeder
    from seeders.mentor_seeder import MentorSeeder
    from seeders.embeddings_seeder import EmbeddingsSeeder

    # Define menu options
    menu_options = [
        {
            "label": "👤 Seed Profiles (users with complete data)",
            "action": lambda http: ProfilesSeeder(http).seed_profiles(count=100),
        },
        {
            "label": "📝 Seed Posts (with comments & reactions)",
            "action": lambda http: PostsSeeder(http).seed(limit=300),
        },
        {
            "label": "🔗 Seed Connections (user relationships)",
            "action": lambda http: ConnectionsSeeder(http).seed(limit=500),
        },
        {
            "label": "🎯 Seed Matches (AI-powered suggestions)",
            "action": lambda http: MatchesSeeder(http).seed(limit_per_user=5),
        },
        {
            "label": "💬 Seed Conversations (chat threads)",
            "action": lambda http: ConversationsSeeder(http).seed(limit=150),
        },
        {
            "label": "💭 Seed Messages (in conversations)",
            "action": lambda http: MessagesSeeder(http).seed(),
        },
        {
            "label": "🔔 Seed Notifications (activity feed)",
            "action": lambda http: NotificationsSeeder(http).seed(count=100),
        },
        {
            "label": "🤖 Seed Mentor Sessions (AI mentoring)",
            "action": lambda http: MentorSeeder(http).seed(count=50),
        },
        {
            "label": "🧠 Generate Embeddings (vector embeddings)",
            "action": lambda http: run_embeddings_with_warning(http),
            "warning": "NOT RECOMMENDED - Use local Docker for real embedding generation (cd ../../python-worker && docker-compose up -d)",
        },
    ]

    # Add quick actions
    quick_actions = [
        {
            'label': '⚡ Seed Everything (all modules in sequence)',
            'action': lambda http: seed_everything(http),
        },
        {
            'label': '⚙️  View/Modify Configuration',
            'action': lambda http: view_configuration(),
        },
        {
            'label': '📊 Check Database Status',
            'action': lambda http: check_database_status(http),
        },
        {
            'label': '🐍 Check Python Worker Status',
            'action': lambda http: check_worker_status(),
        },
        {
            'label': '❌ Exit',
            'action': 'exit',
        },
    ]

    print_header()

    if not config.validate():
        print(f"\n{Fore.RED}✗ Configuration validation failed{Style.RESET_ALL}")
        print(f"   Please create a .env file with your Supabase credentials")
        input(f"\n{Fore.YELLOW}Press Enter to exit...{Style.RESET_ALL}")
        return

    try:
        http_client = httpx.Client(
            timeout=30.0,
            limits=httpx.Limits(max_connections=100, max_keepalive_connections=20),
            headers={
                "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {config.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
            },
        )
        print(f"{Fore.GREEN}✓ Connected to Supabase{Style.RESET_ALL}\n")
    except Exception as e:
        print(f"{Fore.RED}✗ Failed to connect to Supabase: {e}{Style.RESET_ALL}")
        input(f"\n{Fore.YELLOW}Press Enter to exit...{Style.RESET_ALL}")
        return

    # Create menu once
    main_menu = InteractiveMenu(
        title="🚀 COLLABRYX DATABASE SEEDER - MAIN MENU",
        options=menu_options + [{'label': '─────────────────────────────────────────', 'action': None}] + quick_actions,
        allow_multi_select=True
    )
    
    # Run menu and get selection
    selected = main_menu.run()
    
    # Handle exit
    if not selected or (len(selected) == 1 and selected[0].get('action') == 'exit'):
        print(f"\n{Fore.GREEN}Goodbye! 👋{Style.RESET_ALL}\n")
        http_client.close()
        return
    
    # Execute selected actions
    for option in selected:
        if option.get('action') and option['action'] != 'exit':
            try:
                print(f"\n{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}")
                print(f"{Fore.CYAN}Executing: {option['label']}{Style.RESET_ALL}")
                print(f"{Fore.CYAN}{'=' * 70}{Style.RESET_ALL}\n")
                
                option['action'](http_client)
                
                input(f"\n{Fore.YELLOW}Press Enter to continue...{Style.RESET_ALL}")
            except KeyboardInterrupt:
                print(f"\n{Fore.RED}✗ Operation cancelled{Style.RESET_ALL}")
            except Exception as e:
                print(f"\n{Fore.RED}✗ Error: {e}{Style.RESET_ALL}")
                input(f"\n{Fore.YELLOW}Press Enter to continue...{Style.RESET_ALL}")
    
    # Loop back to menu after execution
    run_interactive_seeder()
                except KeyboardInterrupt:
                    print(f"\n{Fore.RED}✗ Operation cancelled{Style.RESET_ALL}")
                except Exception as e:
                    print(f"\n{Fore.RED}✗ Error: {e}{Style.RESET_ALL}")
                    input(f"\n{Fore.YELLOW}Press Enter to continue...{Style.RESET_ALL}")


def run_embeddings_with_warning(http_client):
    """Run embeddings seeder with warning"""
    print(f"\n{Fore.RED}{'=' * 70}{Style.RESET_ALL}")
    print(f"{Fore.RED}⚠️  EMBEDDINGS SEEDING - IMPORTANT WARNING{Style.RESET_ALL}")
    print(f"{Fore.RED}{'=' * 70}{Style.RESET_ALL}\n")
    print(
        f"{Fore.YELLOW}Embedding generation via the seeder is NOT RECOMMENDED.{Style.RESET_ALL}\n"
    )
    print(f"{Fore.CYAN}Recommended approach:{Style.RESET_ALL}")
    print(f"  1. Start the Python worker in Docker:")
    print(
        f"     {Fore.GREEN}cd ../../python-worker && docker-compose up -d{Style.RESET_ALL}"
    )
    print(f"  2. The worker will automatically process embeddings")
    print(f"  3. Monitor with: {Fore.GREEN}docker-compose logs -f{Style.RESET_ALL}\n")
    print(f"{Fore.YELLOW}The Docker worker provides:{Style.RESET_ALL}")
    print(f"  ✓ Automatic retry on failures")
    print(f"  ✓ Rate limiting")
    print(f"  ✓ Dead letter queue")
    print(f"  ✓ Better error handling\n")

    response = (
        input(f"{Fore.YELLOW}Continue anyway? (y/n): {Style.RESET_ALL}").strip().lower()
    )
    if response != "y":
        print(f"\n{Fore.GREEN}✓ Operation cancelled{Style.RESET_ALL}")
        return

    # Run embeddings seeder
    from seeders.embeddings_seeder import EmbeddingsSeeder

    seeder = EmbeddingsSeeder(http_client)
    user_ids = seeder.fetch_user_ids()
    if user_ids:
        seeder.queue_profiles_for_embeddings(user_ids)
        seeder.seed_embeddings()
    else:
        print(f"{Fore.RED}✗ No profiles found. Seed profiles first.{Style.RESET_ALL}")


def seed_everything(http_client):
    """Seed all modules in sequence"""
    print(f"\n{Fore.GREEN}{'=' * 70}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}🚀 SEEDING EVERYTHING{Style.RESET_ALL}")
    print(f"{Fore.GREEN}{'=' * 70}{Style.RESET_ALL}\n")

    start_time = datetime.now()

    modules = [
        ("Profiles", lambda: ProfilesSeeder(http_client).seed_profiles(count=100)),
        ("Posts", lambda: PostsSeeder(http_client).seed(limit=300)),
        ("Connections", lambda: ConnectionsSeeder(http_client).seed(limit=500)),
        ("Matches", lambda: MatchesSeeder(http_client).seed(limit_per_user=5)),
        ("Conversations", lambda: ConversationsSeeder(http_client).seed(limit=150)),
        ("Messages", lambda: MessagesSeeder(http_client).seed()),
        ("Notifications", lambda: NotificationsSeeder(http_client).seed(count=100)),
        ("Mentor Sessions", lambda: MentorSeeder(http_client).seed(count=50)),
    ]

    for name, action in modules:
        print(
            f"\n{Fore.CYAN}[{modules.index((name, action)) + 1}/{len(modules)}] Seeding {name}...{Style.RESET_ALL}"
        )
        try:
            action()
        except Exception as e:
            print(f"{Fore.RED}✗ {name} failed: {e}{Style.RESET_ALL}")

    elapsed = datetime.now() - start_time
    print(f"\n{Fore.GREEN}{'=' * 70}{Style.RESET_ALL}")
    print(f"{Fore.GREEN}✓ SEEDING COMPLETE{Style.RESET_ALL}")
    print(
        f"{Fore.GREEN}  Total time: {elapsed.total_seconds():.1f} seconds{Style.RESET_ALL}"
    )
    print(f"{Fore.GREEN}{'=' * 70}{Style.RESET_ALL}\n")


def view_configuration():
    """View configuration"""
    config.print_summary()


def check_database_status(http_client):
    """Check database status"""
    print(f"\n{Fore.YELLOW}Checking database status...{Style.RESET_ALL}\n")

    try:
        tables = [
            ("Profiles", "profiles"),
            ("Posts", "posts"),
            ("Connections", "connections"),
            ("Conversations", "conversations"),
            ("Messages", "messages"),
            ("Notifications", "notifications"),
            ("Mentor Sessions", "ai_mentor_sessions"),
        ]

        for name, table in tables:
            response = http_client.get(
                f"{config.SUPABASE_REST_URL}/{table}?select=id&limit=1",
                headers=config.API_HEADERS,
            )
            count = len(response.json()) if response.json() else 0
            print(f"  {Fore.GREEN}✓ {name}:{Style.RESET_ALL} {count:,} records")

        # Check embeddings
        response = http_client.get(
            f"{config.SUPABASE_REST_URL}/profile_embeddings?select=id,status&limit=100",
            headers=config.API_HEADERS,
        )
        embeddings = response.json() or []
        completed = len([e for e in embeddings if e.get("status") == "completed"])
        pending = len([e for e in embeddings if e.get("status") == "pending"])
        print(
            f"  {Fore.GREEN}✓ Embeddings:{Style.RESET_ALL} {completed:,} completed, {pending:,} pending"
        )

    except Exception as e:
        print(f"{Fore.RED}✗ Error: {e}{Style.RESET_ALL}")


def check_worker_status():
    """Check Python worker status"""
    print(f"\n{Fore.YELLOW}Checking Python worker status...{Style.RESET_ALL}\n")

    try:
        import httpx as hx

        response = hx.get(f"{config.PYTHON_WORKER_URL}/health", timeout=5.0)

        if response.status_code == 200:
            data = response.json()
            print(
                f"  {Fore.GREEN}✓ Status:{Style.RESET_ALL} {data.get('status', 'unknown')}"
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


def print_header():
    """Print application header"""
    print(f"\n{Fore.CYAN}")
    print("=" * 70)
    print("  🚀 COLLABRYX INTERACTIVE DATABASE SEEDER")
    print("  Environment-driven seeding with real UUIDs from Supabase")
    print("=" * 70)
    print(f"{Style.RESET_ALL}\n")


if __name__ == "__main__":
    try:
        run_interactive_seeder()
    except KeyboardInterrupt:
        print(f"\n\n{Fore.YELLOW}Interrupted by user{Style.RESET_ALL}")
        sys.exit(0)
