"""
Connections Seeder
Creates connections between users using Supabase REST API
Fetches real user UUIDs from database
"""

import random
import time
from typing import List, Dict, Any, Set, Tuple
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class ConnectionsSeeder(BaseSeeder):
    """Seeder for connections between users"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.existing_connections = None

    def create_connection(
        self,
        requester_id: str,
        receiver_id: str,
        status: str = "accepted",
        message: str = None,
    ) -> bool:
        """Create a connection between two users"""
        connection = {
            "requester_id": requester_id,
            "receiver_id": receiver_id,
            "status": status,
            "message": message,
        }

        result = self.create_single("connections", connection)
        return result is not None

    def get_existing_connections(self) -> Set[Tuple[str, str]]:
        """Get existing connections to avoid duplicates"""
        if self.existing_connections is not None:
            return self.existing_connections

        self.existing_connections = self.fetch_existing_connections()
        return self.existing_connections

    def seed(self, limit: int = None) -> Dict[str, int]:
        """Seed connections between users"""

        if limit is None:
            limit = (
                int(config.LIMIT_CONNECTIONS)
                if config.LIMIT_CONNECTIONS != "-1"
                else 500
            )

        # Show current database status
        existing_connections = self.get_table_count("connections")

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}CURRENT DATABASE STATUS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  🔗 Existing Connections: {Fore.GREEN}{existing_connections:,}{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"\n{Fore.YELLOW}➕ Adding {limit:,} new connections...{Style.RESET_ALL}\n"
        )

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING {limit} CONNECTIONS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch user IDs
        print(f"{Fore.YELLOW}⏳ Fetching user IDs from database...{Style.RESET_ALL}")
        user_ids = self.fetch_user_ids()
        print(f"{Fore.GREEN}✓ Found {len(user_ids)} users{Style.RESET_ALL}\n")

        if len(user_ids) < 2:
            print(
                f"{Fore.RED}✗ Need at least 2 users. Seed profiles first.{Style.RESET_ALL}"
            )
            return {"created": 0, "skipped": 0, "failed": 0}

        # Get existing connections
        existing = self.get_existing_connections()

        stats = {"created": 0, "skipped": 0, "failed": 0}
        attempts = 0
        max_attempts = limit * 3  # Try 3x to account for duplicates

        while stats["created"] < limit and attempts < max_attempts:
            attempts += 1

            # Pick two different users
            requester, receiver = random.sample(user_ids, 2)
            pair_key = (requester, receiver)

            # Skip if already connected
            if pair_key in existing:
                stats["skipped"] += 1
                continue

            existing.add(pair_key)

            # Weighted status (70% accepted, 20% pending, 10% declined)
            status = random.choices(
                ["accepted", "pending", "declined"], weights=[70, 20, 10]
            )[0]

            print(
                f"\r{Fore.CYAN}[{stats['created'] + 1}/{limit}] Creating connection...{Style.RESET_ALL}",
                end="",
                flush=True,
            )

            if self.create_connection(requester, receiver, status):
                stats["created"] += 1
                print(
                    f"\r{Fore.CYAN}[{stats['created']}/{limit}] ✓ Connection created{Style.RESET_ALL}    ",
                    end="",
                    flush=True,
                )

                # Create reverse connection for accepted
                if status == "accepted":
                    self.create_connection(receiver, requester, "accepted")
                    existing.add((receiver, requester))
            else:
                stats["failed"] += 1
                print(
                    f"\r{Fore.RED}[{stats['created'] + 1}/{limit}] ✗ Failed{Style.RESET_ALL}    ",
                    end="",
                    flush=True,
                )

            # Rate limiting
            if stats["created"] % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        self.log_stats(stats, "Connections")
        return stats


if __name__ == "__main__":
    import httpx
    from config import config

    config.initialize()

    with httpx.Client() as http:
        seeder = ConnectionsSeeder(http)
        seeder.seed(limit=20)
