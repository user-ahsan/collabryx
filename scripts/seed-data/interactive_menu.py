#!/usr/bin/env python3
"""
Interactive Menu with Arrow Key Navigation
Uses ctypes for direct Windows console input - most reliable method
"""

import sys
import os
import time
import msvcrt
from colorama import Fore, Style, init
from datetime import datetime

init()

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from config import config
from seeders.profiles_seeder import ProfilesSeeder
from seeders.posts_seeder import PostsSeeder
from seeders.connections_seeder import ConnectionsSeeder
from seeders.matches_seeder import MatchesSeeder
from seeders.conversations_seeder import ConversationsSeeder
from seeders.messages_seeder import MessagesSeeder
from seeders.notifications_seeder import NotificationsSeeder
from seeders.mentor_seeder import MentorSeeder
from seeders.embeddings_seeder import EmbeddingsSeeder


def get_arrow_key():
    """Get arrow key input. Returns: 'up', 'down', 'space', 'enter', 'q', 'esc', or None"""
    try:
        if not msvcrt.kbhit():
            return None

        key = msvcrt.getch()

        # Arrow keys start with \xe0 or \x00
        if key == b"\xe0" or key == b"\x00":
            key2 = msvcrt.getch()
            if key2 == b"H":
                return "up"
            elif key2 == b"P":
                return "down"
            elif key2 == b"K":
                return "up"
            elif key2 == b"M":
                return "down"
        elif key == b" ":
            return "space"
        elif key == b"\r" or key == b"\n":
            return "enter"
        elif key.lower() == b"q":
            return "q"
        elif key == b"\x1b":
            return "esc"
    except:
        pass

    return None


def clear_screen():
    """Clear screen and move cursor to home"""
    print("\033[2J\033[H", end="")
    print("\033[?25l", end="")  # Hide cursor


def show_cursor():
    """Show cursor"""
    print("\033[?25h", end="")


class Menu:
    def __init__(self, title, options, allow_multi=True):
        self.title = title
        self.options = options
        self.selected = 0
        self.checked = set()
        self.allow_multi = allow_multi

    def draw(self):
        clear_screen()

        print(Fore.CYAN + "=" * 70 + Style.RESET_ALL)
        print(Fore.CYAN + self.title + Style.RESET_ALL)
        print(Fore.CYAN + "=" * 70 + Style.RESET_ALL)
        print()

        if self.allow_multi:
            print(
                Fore.YELLOW
                + "Controls: UP/DOWN arrows, SPACE to select, ENTER to run, Q to quit"
                + Style.RESET_ALL
            )
            print()

        for i, opt in enumerate(self.options):
            if i == self.selected:
                marker = Fore.GREEN + ">>" + Style.RESET_ALL
                if i in self.checked:
                    status = Fore.GREEN + "[X]" + Style.RESET_ALL
                else:
                    status = "   "
                print(f"{marker} {status} {opt['label']}")
                if "warning" in opt:
                    print(
                        Fore.RED + f"      WARNING: {opt['warning']}" + Style.RESET_ALL
                    )
            else:
                if i in self.checked:
                    print(f"       [{Fore.GREEN}X{Style.RESET_ALL}] {opt['label']}")
                else:
                    print(f"       [ ] {opt['label']}")

        print()
        print(Fore.CYAN + "=" * 70 + Style.RESET_ALL)

        if self.checked:
            print(
                Fore.GREEN
                + f"Selected: {len(self.checked)} module(s)"
                + Style.RESET_ALL
            )

    def run(self):
        self.draw()

        while True:
            time.sleep(0.05)
            key = get_arrow_key()

            if key == "up":
                self.selected = max(0, self.selected - 1)
                self.draw()
            elif key == "down":
                self.selected = min(len(self.options) - 1, self.selected + 1)
                self.draw()
            elif key == "space" and self.allow_multi:
                if self.selected in self.checked:
                    self.checked.remove(self.selected)
                else:
                    self.checked.add(self.selected)
                self.draw()
            elif key == "enter":
                show_cursor()
                if self.allow_multi:
                    return [self.options[i] for i in self.checked]
                else:
                    return [self.options[self.selected]]
            elif key in ["q", "esc"]:
                show_cursor()
                return []


def run_embeddings_with_warning(http):
    print(Fore.RED + "\n" + "=" * 70 + Style.RESET_ALL)
    print(Fore.RED + "WARNING: EMBEDDINGS SEEDING" + Style.RESET_ALL)
    print(Fore.RED + "=" * 70 + Style.RESET_ALL + "\n")
    print(
        Fore.YELLOW
        + "Embedding generation via seeder is NOT RECOMMENDED."
        + Style.RESET_ALL
        + "\n"
    )
    print(Fore.CYAN + "Recommended:" + Style.RESET_ALL)
    print("  1. Start Docker worker:")
    print(
        Fore.GREEN
        + "     cd ../../python-worker && docker-compose up -d"
        + Style.RESET_ALL
    )
    print("  2. Worker processes embeddings automatically")
    print(
        "  3. Monitor: "
        + Fore.GREEN
        + "docker-compose logs -f"
        + Style.RESET_ALL
        + "\n"
    )

    ans = (
        input(Fore.YELLOW + "Continue anyway? (y/n): " + Style.RESET_ALL)
        .strip()
        .lower()
    )
    if ans != "y":
        print(Fore.GREEN + "Cancelled" + Style.RESET_ALL)
        return

    seeder = EmbeddingsSeeder(http)
    try:
        resp = http.get(
            f"{config.SUPABASE_REST_URL}/profiles?select=id", headers=config.API_HEADERS
        )
        profiles = resp.json() or []
        user_ids = [p["id"] for p in profiles]

        if user_ids:
            seeder.queue_profiles_for_embeddings(user_ids)
            seeder.seed_embeddings()
        else:
            print(Fore.RED + "No profiles found" + Style.RESET_ALL)
    except Exception as e:
        print(Fore.RED + f"Error: {e}" + Style.RESET_ALL)


def seed_everything(http):
    print(Fore.GREEN + "\n" + "=" * 70 + Style.RESET_ALL)
    print(Fore.GREEN + "SEEDING EVERYTHING" + Style.RESET_ALL)
    print(Fore.GREEN + "=" * 70 + Style.RESET_ALL + "\n")

    start = datetime.now()

    modules = [
        ("Profiles", lambda: ProfilesSeeder(http).seed_profiles(count=100)),
        ("Posts", lambda: PostsSeeder(http).seed(limit=300)),
        ("Connections", lambda: ConnectionsSeeder(http).seed(limit=500)),
        ("Matches", lambda: MatchesSeeder(http).seed(limit_per_user=5)),
        ("Conversations", lambda: ConversationsSeeder(http).seed(limit=150)),
        ("Messages", lambda: MessagesSeeder(http).seed()),
        ("Notifications", lambda: NotificationsSeeder(http).seed(count=100)),
        ("Mentor", lambda: MentorSeeder(http).seed(count=50)),
    ]

    for name, action in modules:
        print(Fore.CYAN + f"Seeding {name}..." + Style.RESET_ALL)
        try:
            action()
        except Exception as e:
            print(Fore.RED + f"Failed: {e}" + Style.RESET_ALL)

    elapsed = (datetime.now() - start).total_seconds()
    print(Fore.GREEN + f"\nDone in {elapsed:.1f}s" + Style.RESET_ALL)


def check_db_status(http):
    print(Fore.YELLOW + "\nDatabase Status:" + Style.RESET_ALL)
    tables = ["profiles", "posts", "connections", "conversations", "messages"]
    for table in tables:
        try:
            resp = http.get(
                f"{config.SUPABASE_REST_URL}/{table}?select=id&limit=1",
                headers=config.API_HEADERS,
            )
            count = len(resp.json() or [])
            print(f"  {table}: {count:,}")
        except:
            pass


def check_worker():
    print(Fore.YELLOW + "\nWorker Status:" + Style.RESET_ALL)
    try:
        import httpx as hx

        resp = hx.get(f"{config.PYTHON_WORKER_URL}/health", timeout=5.0)
        if resp.status_code == 200:
            data = resp.json()
            print(
                Fore.GREEN
                + f"  Status: {data.get('status', 'unknown')}"
                + Style.RESET_ALL
            )
    except Exception as e:
        print(Fore.RED + f"  Cannot connect: {e}" + Style.RESET_ALL)


def run_interactive_seeder():
    print(Fore.CYAN + "\n" + "=" * 70 + Style.RESET_ALL)
    print(Fore.CYAN + "  COLLABRYX INTERACTIVE DATABASE SEEDER" + Style.RESET_ALL)
    print(Fore.CYAN + "=" * 70 + Style.RESET_ALL + "\n")

    if not config.validate():
        print(Fore.RED + "Configuration failed. Create .env file." + Style.RESET_ALL)
        input("Press Enter...")
        return

    try:
        http = httpx.Client(
            timeout=30.0,
            limits=httpx.Limits(max_connections=100),
            headers={
                "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
                "Authorization": f"Bearer {config.SUPABASE_SERVICE_ROLE_KEY}",
                "Content-Type": "application/json",
            },
        )
        print(Fore.GREEN + "Connected to Supabase" + Style.RESET_ALL + "\n")
    except Exception as e:
        print(Fore.RED + f"Failed: {e}" + Style.RESET_ALL)
        input("Press Enter...")
        return

    options = [
        {"label": "Seed Profiles (users)"},
        {"label": "Seed Posts (with comments/reactions)"},
        {"label": "Seed Connections"},
        {"label": "Seed Matches"},
        {"label": "Seed Conversations"},
        {"label": "Seed Messages"},
        {"label": "Seed Notifications"},
        {"label": "Seed Mentor Sessions"},
        {
            "label": "Generate Embeddings",
            "warning": "NOT RECOMMENDED - Use Docker instead",
        },
        {"label": "-" * 60},
        {"label": "Seed Everything"},
        {"label": "Check Database Status"},
        {"label": "Check Worker Status"},
        {"label": "Exit"},
    ]

    actions = {
        0: lambda: ProfilesSeeder(http).seed_profiles(count=100),
        1: lambda: PostsSeeder(http).seed(limit=300),
        2: lambda: ConnectionsSeeder(http).seed(limit=500),
        3: lambda: MatchesSeeder(http).seed(limit_per_user=5),
        4: lambda: ConversationsSeeder(http).seed(limit=150),
        5: lambda: MessagesSeeder(http).seed(),
        6: lambda: NotificationsSeeder(http).seed(count=100),
        7: lambda: MentorSeeder(http).seed(count=50),
        8: lambda: run_embeddings_with_warning(http),
        10: lambda: seed_everything(http),
        11: lambda: check_db_status(http),
        12: lambda: check_worker(),
        13: lambda: None,
    }

    while True:
        menu = Menu("COLLABRYX DATABASE SEEDER", options, allow_multi=True)
        selected = menu.run()

        if not selected or (len(selected) == 1 and selected[0]["label"] == "Exit"):
            print(Fore.GREEN + "\nGoodbye!" + Style.RESET_ALL + "\n")
            http.close()
            return

        for opt in selected:
            idx = options.index(opt)
            if idx in actions and idx != 13:
                try:
                    print(Fore.CYAN + f"\nRunning: {opt['label']}..." + Style.RESET_ALL)
                    actions[idx]()
                    input(
                        Fore.YELLOW + "\nPress Enter to continue..." + Style.RESET_ALL
                    )
                except Exception as e:
                    print(Fore.RED + f"Error: {e}" + Style.RESET_ALL)
                    input(
                        Fore.YELLOW + "\nPress Enter to continue..." + Style.RESET_ALL
                    )


if __name__ == "__main__":
    try:
        run_interactive_seeder()
    except KeyboardInterrupt:
        show_cursor()
        print(Fore.YELLOW + "\nInterrupted" + Style.RESET_ALL)
        sys.exit(0)
