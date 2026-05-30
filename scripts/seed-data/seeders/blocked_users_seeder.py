"""
Blocked Users Seeder
Creates blocked user relationships using Supabase REST API
"""

import random
import time
from typing import List, Dict, Any
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class BlockedUsersSeeder(BaseSeeder):
    """Seeder for blocked_users with incremental duplicate checking"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}
        self.existing_blocks: set = set()

    BLOCK_REASONS = [
        "Spam",
        "Harassment",
        "No reason",
        "Inappropriate content",
    ]

    # =========================================================================
    # DATA FETCHING
    # =========================================================================

    def fetch_existing_blocks(self):
        """Fetch existing blocked user records for duplicate checking"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/blocked_users?select=blocker_id,blocked_id",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            blocks = response.json() or []
            self.existing_blocks = {
                (b["blocker_id"], b["blocked_id"]) for b in blocks
            }
            print(
                f"{Fore.YELLOW}  → Found {len(self.existing_blocks)} existing blocks{Style.RESET_ALL}"
            )
        except Exception as e:
            print(f"{Fore.RED}✗ Failed to fetch existing blocks: {e}{Style.RESET_ALL}")

    # =========================================================================
    # CORE LOGIC
    # =========================================================================

    def block_exists(self, blocker_id: str, blocked_id: str) -> bool:
        """Check if block already exists (directional)"""
        return (blocker_id, blocked_id) in self.existing_blocks

    def create_block(self, blocker_id: str, blocked_id: str, reason: str) -> bool:
        """Create a single blocked_users record with duplicate checking"""
        # Pre-checks
        if blocker_id == blocked_id:
            self.stats["skipped"] += 1
            return False

        if self.block_exists(blocker_id, blocked_id):
            self.stats["skipped"] += 1
            return False

        block_data = {
            "blocker_id": blocker_id,
            "blocked_id": blocked_id,
            "reason": reason,
        }

        result = self.create_single("blocked_users", block_data)
        if result:
            self.existing_blocks.add((blocker_id, blocked_id))
            self.stats["created"] += 1
            return True

        self.stats["failed"] += 1
        return False

    # =========================================================================
    # MAIN SEED METHOD
    # =========================================================================

    def seed(self, limit: int = None) -> Dict[str, int]:
        """
        Seed blocked_users records incrementally.

        Selects 5-10% of total users as blockers, each blocking 1-3 other users.
        Skips pairs that already exist in the database.
        """
        # Reset stats
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        # Fetch existing blocks for duplicate checking
        print(
            f"\n{Fore.YELLOW}⏳ Loading existing block records for duplicate checking...{Style.RESET_ALL}"
        )
        self.fetch_existing_blocks()

        # Fetch user IDs
        print(f"{Fore.YELLOW}⏳ Fetching user IDs from database...{Style.RESET_ALL}")
        user_ids = self.fetch_user_ids()
        print(f"{Fore.GREEN}✓ Found {len(user_ids)} users{Style.RESET_ALL}\n")

        if len(user_ids) < 2:
            print(
                f"{Fore.RED}✗ Need at least 2 users. Seed profiles first.{Style.RESET_ALL}"
            )
            return self.stats

        # Determine how many users become blockers (5-10% of total)
        num_blockers = max(1, int(len(user_ids) * random.uniform(0.05, 0.1)))
        blocker_pool = random.sample(
            user_ids, min(num_blockers, len(user_ids))
        )

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.CYAN}SEEDING BLOCKED USERS ({len(blocker_pool)} blockers){Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        for i, blocker_id in enumerate(blocker_pool):
            # Each blocker blocks 1-3 random other users
            num_blocks = random.randint(1, 3)
            potential_targets = [
                u for u in user_ids if u != blocker_id
            ]
            random.shuffle(potential_targets)

            for j in range(min(num_blocks, len(potential_targets))):
                target = potential_targets[j]

                print(
                    f"\r{Fore.CYAN}[{self.stats['created'] + 1}] Creating block...{Style.RESET_ALL}",
                    end="",
                    flush=True,
                )

                reason = random.choice(self.BLOCK_REASONS)
                self.create_block(blocker_id, target, reason)

            # Progress line
            print(
                f"\r{Fore.CYAN}[{i + 1}/{len(blocker_pool)}] ✓ {self.stats['created']} blocks created{Style.RESET_ALL}    ",
                end="",
                flush=True,
            )

            # Rate limiting
            if self.stats["created"] % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print detailed statistics
        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ BLOCKED USERS SEEDING COMPLETE{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  Created:     {Fore.GREEN}{self.stats['created']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Skipped:     {Fore.YELLOW}{self.stats['skipped']:,}{Style.RESET_ALL}"
        )
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
        seeder = BlockedUsersSeeder(http)
        seeder.seed()
