"""
Embedding Rate Limits Seeder
Creates embedding_rate_limits rows for profiles using Supabase REST API
Simulates rate limit tracking with staggered time windows
"""

import random
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class EmbeddingRateLimitsSeeder(BaseSeeder):
    """Seeder for embedding_rate_limits with simulated rate limit windows"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

    def create_rate_limit_row(
        self,
        user_id: str,
        request_count: int,
        window_start: datetime,
        window_end: datetime,
    ) -> Optional[str]:
        """Create a single embedding_rate_limits row"""
        try:
            record = {
                "user_id": user_id,
                "request_count": request_count,
                "window_start": window_start.isoformat(),
                "window_end": window_end.isoformat(),
            }

            return self.create_single("embedding_rate_limits", record)

        except Exception as e:
            print(
                f"{Fore.RED}  ✗ Error creating embedding rate limit: {e}{Style.RESET_ALL}"
            )
            return None

    def seed(self, limit: Optional[int] = None) -> Dict[str, int]:
        """Seed embedding_rate_limits for a subset of users with staggered windows"""

        # Reset statistics
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        if limit is None:
            limit = int(config.LIMIT_PROFILES) if config.LIMIT_PROFILES != "-1" else 100
            # Rate limits only needed for a subset (~60% of profiles)
            limit = max(1, limit * 60 // 100)

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING EMBEDDING RATE LIMITS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch user IDs
        print(f"{Fore.YELLOW}⏳ Fetching user IDs from database...{Style.RESET_ALL}")
        user_ids = self.fetch_user_ids(limit=limit)
        print(f"{Fore.GREEN}✓ Found {len(user_ids)} users{Style.RESET_ALL}\n")

        if not user_ids:
            print(f"{Fore.RED}✗ No users found. Seed profiles first.{Style.RESET_ALL}")
            return self.stats

        # Use a subset — not all users need rate limit rows
        subset_size = min(len(user_ids), max(1, limit))
        target_users = random.sample(user_ids, subset_size)

        now = datetime.now(timezone.utc)

        total_target = len(target_users)
        for i, user_id in enumerate(target_users):
            # Create 1-3 rate limit rows per user with staggered windows
            num_rows = random.randint(1, 3)

            for row_idx in range(num_rows):
                # Stagger windows backward: each row starts 30-90 min before the next
                hours_ago = (row_idx + 1) * random.randint(1, 3)
                window_start = now - timedelta(hours=hours_ago)
                window_end = window_start + timedelta(hours=1)

                # Random request_count between 1 and 5
                request_count = random.randint(1, 5)

                print(
                    f"\r{Fore.CYAN}[{i * 3 + row_idx + 1}/{total_target * 3}] Creating rate limit...{Style.RESET_ALL}",
                    end="",
                    flush=True,
                )

                result = self.create_rate_limit_row(
                    user_id, request_count, window_start, window_end
                )

                if result:
                    self.stats["created"] += 1
                    print(
                        f"\r{Fore.CYAN}[{self.stats['created']}/{total_target * 3}] ✓ Created{Style.RESET_ALL}    ",
                        end="",
                        flush=True,
                    )
                else:
                    self.stats["failed"] += 1

            # Rate limiting
            if (i + 1) % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print statistics
        self.log_stats(self.stats, "Embedding Rate Limits")

        return self.stats


if __name__ == "__main__":
    import httpx

    config.initialize()

    with httpx.Client() as http:
        seeder = EmbeddingRateLimitsSeeder(http)
        seeder.seed(limit=5)
