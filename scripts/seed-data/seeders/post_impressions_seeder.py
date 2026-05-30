"""
Post Impressions Seeder
Creates post_impressions for user × post cross-product using Supabase REST API
UNIQUE(user_id, post_id) — 30-60% density with random impression counts
"""

import random
import time
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List, Set, Tuple
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class PostImpressionsSeeder(BaseSeeder):
    """Seeder for post_impressions with cross-product density sampling"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}
        self._existing_impressions_cache: Set[Tuple[str, str]] = set()
        self._user_ids: List[str] = []
        self._posts: List[Dict[str, Any]] = []

    def _load_cache(self):
        """Fetch existing post_impressions to avoid duplicates"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/post_impressions?select=user_id,post_id",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            impressions = response.json() or []
            self._existing_impressions_cache = {
                (imp["user_id"], imp["post_id"]) for imp in impressions
            }
            print(
                f"{Fore.YELLOW}  → Found {len(self._existing_impressions_cache)} existing post impressions{Style.RESET_ALL}"
            )
        except Exception as e:
            print(
                f"{Fore.RED}✗ Failed to fetch existing post impressions: {e}{Style.RESET_ALL}"
            )
            self._existing_impressions_cache = set()

    def _load_posts(self, limit: Optional[int] = None):
        """Fetch existing posts"""
        self._posts = self.fetch_existing_posts(limit=limit)
        print(
            f"{Fore.YELLOW}  → Found {len(self._posts)} posts{Style.RESET_ALL}"
        )

    def create_post_impression(
        self, user_id: str, post_id: str, impression_count: int, last_at: datetime
    ) -> Optional[str]:
        """Create a single post_impression record"""
        try:
            record = {
                "user_id": user_id,
                "post_id": post_id,
                "impression_count": impression_count,
                "last_impression_at": last_at.isoformat(),
            }

            return self.create_single("post_impressions", record)

        except Exception as e:
            print(
                f"{Fore.RED}  ✗ Error creating post impression: {e}{Style.RESET_ALL}"
            )
            return None

    def seed(self, limit: Optional[int] = None) -> Dict[str, int]:
        """Seed post_impressions across user × post cross-product"""

        # Reset statistics
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        print(
            f"\n{Fore.YELLOW}⏳ Loading existing data for duplicate checking...{Style.RESET_ALL}"
        )
        self._load_cache()

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING POST IMPRESSIONS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch users and posts
        print(f"{Fore.YELLOW}⏳ Fetching user IDs...{Style.RESET_ALL}")
        self._user_ids = self.fetch_user_ids(limit=limit)
        print(f"{Fore.GREEN}✓ Found {len(self._user_ids)} users{Style.RESET_ALL}")

        print(f"{Fore.YELLOW}⏳ Fetching posts...{Style.RESET_ALL}")
        self._load_posts(limit=limit)
        print(f"{Fore.GREEN}✓ Found {len(self._posts)} posts{Style.RESET_ALL}\n")

        if not self._user_ids or not self._posts:
            print(
                f"{Fore.RED}✗ Need both users and posts. Seed profiles and posts first.{Style.RESET_ALL}"
            )
            return self.stats

        now = datetime.now(timezone.utc)
        total_cross = len(self._user_ids) * len(self._posts)
        target_count = int(total_cross * random.uniform(0.3, 0.6))
        print(
            f"{Fore.YELLOW}  → Target: {target_count} impressions (density: ~{target_count * 100 // total_cross}%){Style.RESET_ALL}\n"
        )

        # Build all possible pairs, shuffle, and take a random dense subset
        all_pairs = [
            (uid, pid["id"])
            for uid in self._user_ids
            for pid in self._posts
        ]
        random.shuffle(all_pairs)
        selected_pairs = all_pairs[:target_count]

        for i, (user_id, post_id) in enumerate(selected_pairs):
            key = (user_id, post_id)
            if key in self._existing_impressions_cache:
                self.stats["skipped"] += 1
                continue

            # Random impression_count 1-50
            impression_count = random.randint(1, 50)

            # last_impression_at: random time within last 7 days
            last_at = now - timedelta(
                seconds=random.randint(0, 7 * 24 * 3600)
            )

            print(
                f"\r{Fore.CYAN}[{self.stats['created'] + 1}/{target_count}] Creating impression...{Style.RESET_ALL}",
                end="",
                flush=True,
            )

            result = self.create_post_impression(
                user_id, post_id, impression_count, last_at
            )

            if result:
                self._existing_impressions_cache.add(key)
                self.stats["created"] += 1
                print(
                    f"\r{Fore.CYAN}[{self.stats['created']}/{target_count}] ✓ Created{Style.RESET_ALL}    ",
                    end="",
                    flush=True,
                )
            else:
                self.stats["failed"] += 1

            # Rate limiting
            if (i + 1) % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print statistics
        self.log_stats(self.stats, "Post Impressions")

        return self.stats


if __name__ == "__main__":
    import httpx

    config.initialize()

    with httpx.Client() as http:
        seeder = PostImpressionsSeeder(http)
        seeder.seed(limit=10)
