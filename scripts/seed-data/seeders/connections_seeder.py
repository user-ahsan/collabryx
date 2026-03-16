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

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING {limit} CONNECTIONS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch user IDs
        user_ids = self.fetch_user_ids()

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

            if self.create_connection(requester, receiver, status):
                stats["created"] += 1

                # Create reverse connection for accepted
                if status == "accepted":
                    self.create_connection(receiver, requester, "accepted")
                    existing.add((receiver, requester))
            else:
                stats["failed"] += 1

            # Progress logging
            self.log_progress(stats["created"], limit, "Connections")

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
