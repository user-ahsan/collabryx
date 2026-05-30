"""
Feed Seeder
Creates feed_scores and feed_thompson_params for user × post pairs
Uses weighted score combination and randomized Thompson sampling priors
"""

import random
import time
import json
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, Optional, List, Set, Tuple
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class FeedSeeder(BaseSeeder):
    """Seeder for feed_scores and feed_thompson_params with weighted scores"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"scores_created": 0, "scores_skipped": 0,
                       "params_created": 0, "params_skipped": 0,
                       "failed": 0}
        self._existing_scores_cache: Set[Tuple[str, str]] = set()
        self._existing_params_cache: Set[Tuple[str, str]] = set()
        self._user_ids: List[str] = []
        self._posts: List[Dict[str, Any]] = []

    def _load_scores_cache(self):
        """Fetch existing feed_scores to avoid duplicates"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/feed_scores?select=user_id,post_id",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            scores = response.json() or []
            self._existing_scores_cache = {
                (s["user_id"], s["post_id"]) for s in scores
            }
            print(
                f"{Fore.YELLOW}  → Found {len(self._existing_scores_cache)} existing feed scores{Style.RESET_ALL}"
            )
        except Exception as e:
            print(
                f"{Fore.RED}✗ Failed to fetch existing feed scores: {e}{Style.RESET_ALL}"
            )
            self._existing_scores_cache = set()

    def _load_params_cache(self):
        """Fetch existing feed_thompson_params to avoid duplicates"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/feed_thompson_params?select=user_id,post_id",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            params = response.json() or []
            self._existing_params_cache = {
                (p["user_id"], p["post_id"]) for p in params
            }
            print(
                f"{Fore.YELLOW}  → Found {len(self._existing_params_cache)} existing Thompson params{Style.RESET_ALL}"
            )
        except Exception as e:
            print(
                f"{Fore.RED}✗ Failed to fetch existing Thompson params: {e}{Style.RESET_ALL}"
            )
            self._existing_params_cache = set()

    def _load_posts(self, limit: Optional[int] = None):
        """Fetch existing posts"""
        self._posts = self.fetch_existing_posts(limit=limit)
        print(
            f"{Fore.YELLOW}  → Found {len(self._posts)} posts{Style.RESET_ALL}"
        )

    def _generate_factors(self) -> Dict[str, Any]:
        """Generate a random factors JSONB structure"""
        return {
            "content_type_boost": round(random.uniform(0.8, 1.2), 4),
            "author_reputation": round(random.uniform(0.5, 1.0), 4),
            "time_decay": round(random.uniform(0.7, 1.0), 4),
            "topic_affinity": round(random.uniform(0.0, 1.0), 4),
            "engagement_history": round(random.uniform(0.3, 1.0), 4),
        }

    def create_feed_score(
        self, user_id: str, post_id: str,
        expires_at: Optional[datetime] = None
    ) -> Optional[str]:
        """Create a single feed_scores record with weighted score"""
        try:
            # Generate sub-scores
            semantic_score = round(random.uniform(0.0, 1.0), 6)
            engagement_score = round(random.uniform(0.0, 1.0), 6)
            recency_score = round(random.uniform(0.0, 1.0), 6)
            connection_boost = round(random.uniform(1.0, 2.0), 4)

            # Score = weighted combination of sub-scores
            # weights: semantic 0.35, engagement 0.30, recency 0.20, connection_boost multiplier
            score = round(
                (semantic_score * 0.35 + engagement_score * 0.30 + recency_score * 0.20)
                * connection_boost,
                6,
            )
            # Clamp to [0, 1]
            score = max(0.0, min(1.0, score))

            factors = self._generate_factors()

            record: Dict[str, Any] = {
                "user_id": user_id,
                "post_id": post_id,
                "score": score,
                "semantic_score": semantic_score,
                "engagement_score": engagement_score,
                "recency_score": recency_score,
                "connection_boost": connection_boost,
                "factors": json.dumps(factors),
            }

            if expires_at:
                record["expires_at"] = expires_at.isoformat()

            return self.create_single("feed_scores", record)

        except Exception as e:
            print(
                f"{Fore.RED}  ✗ Error creating feed score: {e}{Style.RESET_ALL}"
            )
            return None

    def create_thompson_params(
        self, user_id: str, post_id: str
    ) -> Optional[str]:
        """Create a single feed_thompson_params record with random priors"""
        try:
            # Random alpha and beta for Beta distribution priors
            alpha = round(random.uniform(1.0, 10.0), 4)
            beta = round(random.uniform(1.0, 10.0), 4)

            record = {
                "user_id": user_id,
                "post_id": post_id,
                "alpha": alpha,
                "beta": beta,
            }

            return self.create_single("feed_thompson_params", record)

        except Exception as e:
            print(
                f"{Fore.RED}  ✗ Error creating Thompson params: {e}{Style.RESET_ALL}"
            )
            return None

    def seed(self, limit: Optional[int] = None) -> Dict[str, int]:
        """Seed feed_scores and feed_thompson_params for a subset of users"""

        # Reset statistics
        self.stats = {"scores_created": 0, "scores_skipped": 0,
                       "params_created": 0, "params_skipped": 0,
                       "failed": 0}

        print(
            f"\n{Fore.YELLOW}⏳ Loading existing data for duplicate checking...{Style.RESET_ALL}"
        )

        print(
            f"\n{Fore.YELLOW}  → Loading existing feed_scores...{Style.RESET_ALL}"
        )
        self._load_scores_cache()

        print(
            f"{Fore.YELLOW}  → Loading existing feed_thompson_params...{Style.RESET_ALL}"
        )
        self._load_params_cache()

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING FEED DATA (Scores + Thompson Params){Style.RESET_ALL}")
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

        # Use a subset of users (e.g., ~60%) for feed data
        subset_size = max(1, int(len(self._user_ids) * 0.6))
        feed_users = random.sample(self._user_ids, subset_size)

        # For each feed user, create scores for many posts (e.g., 40-80% of posts)
        posts_per_user_min = max(1, int(len(self._posts) * 0.4))
        posts_per_user_max = max(posts_per_user_min, int(len(self._posts) * 0.8))

        now = datetime.now(timezone.utc)
        expires_offset = timedelta(days=random.randint(3, 14))

        total_expected = subset_size * posts_per_user_max
        print(
            f"{Fore.YELLOW}  → {len(feed_users)} feed users × ~{posts_per_user_min}-{posts_per_user_max} posts each{Style.RESET_ALL}\n"
        )

        processed = 0
        for user_idx, user_id in enumerate(feed_users):
            num_posts = random.randint(posts_per_user_min, posts_per_user_max)
            selected_posts = random.sample(self._posts, num_posts)

            for post in selected_posts:
                post_id = post["id"]
                score_key = (user_id, post_id)
                param_key = (user_id, post_id)

                expires_at = now + expires_offset

                processed += 1

                # --- Feed Score ---
                if score_key in self._existing_scores_cache:
                    self.stats["scores_skipped"] += 1
                else:
                    print(
                        f"\r{Fore.CYAN}[{self.stats['scores_created'] + self.stats['params_created'] + 1}/{total_expected * 2}] Creating score...{Style.RESET_ALL}",
                        end="",
                        flush=True,
                    )

                    score_result = self.create_feed_score(
                        user_id, post_id, expires_at=expires_at
                    )

                    if score_result:
                        self._existing_scores_cache.add(score_key)
                        self.stats["scores_created"] += 1
                    else:
                        self.stats["failed"] += 1

                # --- Thompson Params (create alongside scores) ---
                if param_key in self._existing_params_cache:
                    self.stats["params_skipped"] += 1
                else:
                    print(
                        f"\r{Fore.CYAN}[{self.stats['scores_created'] + self.stats['params_created'] + 1}/{total_expected * 2}] Creating params...{Style.RESET_ALL}",
                        end="",
                        flush=True,
                    )

                    param_result = self.create_thompson_params(user_id, post_id)

                    if param_result:
                        self._existing_params_cache.add(param_key)
                        self.stats["params_created"] += 1
                    else:
                        self.stats["failed"] += 1

            # Rate limiting
            if (user_idx + 1) % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print statistics
        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ FEED SEEDING COMPLETE{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  Scores created:    {Fore.GREEN}{self.stats['scores_created']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Scores skipped:    {Fore.YELLOW}{self.stats['scores_skipped']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Params created:    {Fore.GREEN}{self.stats['params_created']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Params skipped:    {Fore.YELLOW}{self.stats['params_skipped']:,}{Style.RESET_ALL}"
        )
        print(
            f"  Failed:            {Fore.RED if self.stats['failed'] > 0 else Fore.GREEN}{self.stats['failed']:,}{Style.RESET_ALL}"
        )
        total_created = self.stats["scores_created"] + self.stats["params_created"]
        print(
            f"  Total created:     {Fore.CYAN}{total_created:,}{Style.RESET_ALL}"
        )
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}\n")

        return self.stats


if __name__ == "__main__":
    import httpx

    config.initialize()

    with httpx.Client() as http:
        seeder = FeedSeeder(http)
        seeder.seed(limit=10)
