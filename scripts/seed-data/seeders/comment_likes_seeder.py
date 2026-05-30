"""
Comment Likes Seeder
Creates comment_likes for existing comments using Supabase REST API
Each comment gets liked by 2-8 different users (not the author)
UNIQUE(comment_id, user_id) constraint
"""

import random
import time
from typing import Dict, Any, Optional, List, Set, Tuple
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class CommentLikesSeeder(BaseSeeder):
    """Seeder for comment_likes with duplicate prevention"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}
        self._existing_likes_cache: Set[Tuple[str, str]] = set()
        self._comments_cache: List[Dict[str, str]] = []
        self._user_ids: List[str] = []

    def _load_cache(self):
        """Fetch existing comment_likes to avoid duplicates"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/comment_likes?select=comment_id,user_id",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            likes = response.json() or []
            self._existing_likes_cache = {
                (l["comment_id"], l["user_id"]) for l in likes
            }
            print(
                f"{Fore.YELLOW}  → Found {len(self._existing_likes_cache)} existing comment likes{Style.RESET_ALL}"
            )
        except Exception as e:
            print(
                f"{Fore.RED}✗ Failed to fetch existing comment likes: {e}{Style.RESET_ALL}"
            )
            self._existing_likes_cache = set()

    def _load_comments(self, limit: Optional[int] = None):
        """Fetch existing comments with their author_id"""
        try:
            url = f"{config.SUPABASE_REST_URL}/comments?select=id,author_id"
            if limit:
                url += f"&limit={limit}"

            response = self.http.get(url, headers=config.API_HEADERS)
            response.raise_for_status()
            self._comments_cache = response.json() or []
            print(
                f"{Fore.YELLOW}  → Found {len(self._comments_cache)} comments{Style.RESET_ALL}"
            )
        except Exception as e:
            print(f"{Fore.RED}✗ Failed to fetch comments: {e}{Style.RESET_ALL}")
            self._comments_cache = []

    def create_comment_like(self, comment_id: str, user_id: str) -> Optional[str]:
        """Create a single comment_like record"""
        try:
            record = {
                "comment_id": comment_id,
                "user_id": user_id,
            }

            return self.create_single("comment_likes", record)

        except Exception as e:
            print(
                f"{Fore.RED}  ✗ Error creating comment like: {e}{Style.RESET_ALL}"
            )
            return None

    def seed(self, limit: Optional[int] = None) -> Dict[str, int]:
        """Seed comment_likes for existing comments"""

        # Reset statistics
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        print(
            f"\n{Fore.YELLOW}⏳ Loading existing data for duplicate checking...{Style.RESET_ALL}"
        )
        self._load_cache()
        self._load_comments(limit=limit)

        if not self._comments_cache:
            print(
                f"{Fore.RED}✗ No comments found. Seed posts with comments first.{Style.RESET_ALL}"
            )
            return self.stats

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING COMMENT LIKES{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch all user IDs
        print(f"{Fore.YELLOW}⏳ Fetching user IDs from database...{Style.RESET_ALL}")
        self._user_ids = self.fetch_user_ids()
        print(
            f"{Fore.GREEN}✓ Found {len(self._user_ids)} users{Style.RESET_ALL}\n"
        )

        if len(self._user_ids) < 2:
            print(
                f"{Fore.RED}✗ Need at least 2 users. Seed profiles first.{Style.RESET_ALL}"
            )
            return self.stats

        total_comments = len(self._comments_cache)
        for i, comment in enumerate(self._comments_cache):
            comment_id = comment["id"]
            author_id = comment.get("author_id")

            # Exclude the comment author from potential likers
            potential_likers = [
                uid
                for uid in self._user_ids
                if uid != author_id
            ]

            if len(potential_likers) < 2:
                continue

            # Each comment gets liked by 2-8 different users
            num_likes = random.randint(2, min(8, len(potential_likers)))
            likers = random.sample(potential_likers, num_likes)

            for liker_id in likers:
                key = (comment_id, liker_id)
                if key in self._existing_likes_cache:
                    self.stats["skipped"] += 1
                    continue

                print(
                    f"\r{Fore.CYAN}[{self.stats['created'] + 1}/{total_comments * 8}] Creating like...{Style.RESET_ALL}",
                    end="",
                    flush=True,
                )

                result = self.create_comment_like(comment_id, liker_id)

                if result:
                    self._existing_likes_cache.add(key)
                    self.stats["created"] += 1
                else:
                    self.stats["failed"] += 1

            # Rate limiting
            if (i + 1) % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print statistics
        self.log_stats(self.stats, "Comment Likes")

        return self.stats


if __name__ == "__main__":
    import httpx

    config.initialize()

    with httpx.Client() as http:
        seeder = CommentLikesSeeder(http)
        seeder.seed(limit=10)
