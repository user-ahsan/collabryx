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
    """Seeder for connections between users with incremental seeding"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.existing_connections = None
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

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
        """Get existing connections to avoid duplicates (always fetch from DB)"""
        # Always fetch fresh from database for incremental seeding
        self.existing_connections = self.fetch_existing_connections()
        print(
            f"{Fore.YELLOW}  → Found {len(self.existing_connections)} existing connections{Style.RESET_ALL}"
        )
        return self.existing_connections

    def seed(self, limit: int = None) -> Dict[str, int]:
        """Seed connections between users (incremental - skips existing)"""

        # Reset statistics
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        if limit is None:
            limit = (
                int(config.LIMIT_CONNECTIONS)
                if config.LIMIT_CONNECTIONS != "-1"
                else 500
            )

        # Fetch existing connections first
        print(
            f"\n{Fore.YELLOW}⏳ Loading existing connections for duplicate checking...{Style.RESET_ALL}"
        )
        existing = self.get_existing_connections()

        # Show current database status
        existing_count = len(existing)

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}CURRENT DATABASE STATUS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  🔗 Existing Connections: {Fore.GREEN}{existing_count:,}{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"\n{Fore.YELLOW}➕ Attempting to add {limit:,} new connections...{Style.RESET_ALL}\n"
        )

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.CYAN}SEEDING {limit} CONNECTIONS (Incremental Mode){Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch user IDs
        print(f"{Fore.YELLOW}⏳ Fetching user IDs from database...{Style.RESET_ALL}")
        user_ids = self.fetch_user_ids()
        print(f"{Fore.GREEN}✓ Found {len(user_ids)} users{Style.RESET_ALL}\n")

        if len(user_ids) < 2:
            print(
                f"{Fore.RED}✗ Need at least 2 users. Seed profiles first.{Style.RESET_ALL}"
            )
            return self.stats

        attempts = 0
        max_attempts = limit * 3  # Try 3x to account for duplicates

        while self.stats["created"] < limit and attempts < max_attempts:
            attempts += 1

            # Pick two different users
            requester, receiver = random.sample(user_ids, 2)
            pair_key = (requester, receiver)

            # Skip if already connected (both directions)
            if pair_key in existing or (receiver, requester) in existing:
                self.stats["skipped"] += 1
                continue

            existing.add(pair_key)

            # Weighted status (70% accepted, 20% pending, 10% declined)
            status = random.choices(
                ["accepted", "pending", "declined"], weights=[70, 20, 10]
            )[0]

            print(
                f"\r{Fore.CYAN}[{self.stats['created'] + 1}/{limit}] Creating connection...{Style.RESET_ALL}",
                end="",
                flush=True,
            )

            if self.create_connection(requester, receiver, status):
                self.stats["created"] += 1
                print(
                    f"\r{Fore.CYAN}[{self.stats['created']}/{limit}] ✓ Connection created{Style.RESET_ALL}    ",
                    end="",
                    flush=True,
                )

                # Create reverse connection for accepted (check first)
                if status == "accepted":
                    reverse_key = (receiver, requester)
                    if reverse_key not in existing:
                        self.create_connection(receiver, requester, "accepted")
                        existing.add(reverse_key)
                    else:
                        self.stats["skipped"] += 1
            else:
                self.stats["failed"] += 1
                print(
                    f"\r{Fore.RED}[{self.stats['created'] + 1}/{limit}] ✗ Failed{Style.RESET_ALL}    ",
                    end="",
                    flush=True,
                )

            # Rate limiting
            if self.stats["created"] % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print detailed statistics
        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ CONNECTIONS SEEDING COMPLETE{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"  Created:     {Fore.GREEN}{self.stats['created']:,}{Style.RESET_ALL}")
        print(f"  Skipped:     {Fore.YELLOW}{self.stats['skipped']:,}{Style.RESET_ALL}")
        print(
            f"  Failed:      {Fore.RED if self.stats['failed'] > 0 else Fore.GREEN}{self.stats['failed']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Total:       {Fore.CYAN}{sum(self.stats.values()):,}{Style.RESET_ALL}"
        )
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return self.stats


if __name__ == "__main__":
    import httpx
    from config import config

    config.initialize()

    with httpx.Client() as http:
        seeder = ConnectionsSeeder(http)
        seeder.seed(limit=20)
