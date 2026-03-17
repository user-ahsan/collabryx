"""
Matches Seeder
Creates match suggestions using Supabase REST API
"""

import random
import time
from typing import List, Dict, Any
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class MatchesSeeder(BaseSeeder):
    """Seeder for match suggestions with incremental seeding"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}
        self.existing_matches = set()

    def fetch_existing_matches(self):
        """Fetch existing match suggestions for duplicate checking"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/match_suggestions?select=id,user_id,matched_user_id",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            matches = response.json() or []
            self.existing_matches = {
                f"{m['user_id']}:{m['matched_user_id']}" for m in matches
            }
            print(
                f"{Fore.YELLOW}  → Found {len(self.existing_matches)} existing matches{Style.RESET_ALL}"
            )
        except Exception as e:
            print(f"{Fore.RED}✗ Failed to fetch existing matches: {e}{Style.RESET_ALL}")

    def match_exists(self, user_id: str, matched_user_id: str) -> bool:
        """Check if match already exists (either direction)"""
        match_key = f"{user_id}:{matched_user_id}"
        reverse_key = f"{matched_user_id}:{user_id}"
        return (
            match_key in self.existing_matches or reverse_key in self.existing_matches
        )

    def create_match_suggestion(
        self,
        user_id: str,
        matched_user_id: str,
        match_percentage: int,
        reasons: List[Dict] = None,
    ) -> bool:
        """Create a match suggestion with duplicate checking"""
        # Check for duplicate (either direction)
        if self.match_exists(user_id, matched_user_id):
            print(f"{Fore.YELLOW}  ⚠️  Match exists, skipping{Style.RESET_ALL}")
            self.stats["skipped"] += 1
            return False

        if reasons is None:
            reasons = [
                {"type": "skill", "label": "Complementary Skills"},
                {
                    "type": "interest",
                    "label": f"Shared Interest: {random.choice(['Startups', 'AI/ML', 'Open Source'])}",
                },
            ]

        suggestion = {
            "user_id": user_id,
            "matched_user_id": matched_user_id,
            "match_percentage": match_percentage,
            "reasons": reasons,
            "ai_confidence": random.uniform(0.7, 0.95),
            "ai_explanation": f"Strong match based on complementary skills and shared interests.",
            "status": "active",
        }

        result = self.create_single("match_suggestions", suggestion)
        if result:
            self.existing_matches.add(f"{user_id}:{matched_user_id}")
            self.stats["created"] += 1
        return result is not None

    def seed(self, limit_per_user: int = None) -> Dict[str, int]:
        """Seed match suggestions for users (incremental - skips existing)"""

        # Reset stats
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        if limit_per_user is None:
            limit_per_user = (
                int(config.LIMIT_MATCHES_PER_USER)
                if config.LIMIT_MATCHES_PER_USER != "-1"
                else 5
            )

        # Fetch existing matches for duplicate checking
        print(
            f"\n{Fore.YELLOW}⏳ Loading existing matches for duplicate checking...{Style.RESET_ALL}"
        )
        self.fetch_existing_matches()

        # Show current database status
        existing_matches = len(self.existing_matches)

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}CURRENT DATABASE STATUS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  🎯 Existing Matches: {Fore.GREEN}{existing_matches:,}{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"\n{Fore.YELLOW}➕ Adding {limit_per_user} matches per user (Incremental Mode)...{Style.RESET_ALL}\n"
        )

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.CYAN}SEEDING MATCH SUGGESTIONS ({limit_per_user} per user){Style.RESET_ALL}"
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

        # Limit to first 50 users to avoid too many suggestions
        for i, user_id in enumerate(user_ids[:50]):
            potential_matches = [u for u in user_ids if u != user_id]
            matches = random.sample(
                potential_matches, min(limit_per_user, len(potential_matches))
            )

            print(
                f"\r{Fore.CYAN}[{i + 1}/{min(50, len(user_ids))}] Seeding matches...{Style.RESET_ALL}",
                end="",
                flush=True,
            )

            for matched_user in matches:
                match_percentage = random.randint(60, 95)
                self.create_match_suggestion(user_id, matched_user, match_percentage)

            print(
                f"\r{Fore.CYAN}[{i + 1}/{min(50, len(user_ids))}] ✓ {self.stats['created']} created{Style.RESET_ALL}    ",
                end="",
                flush=True,
            )

            if self.stats["created"] % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print detailed statistics
        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ MATCHES SEEDING COMPLETE{Style.RESET_ALL}")
        print(f"{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"  Created:     {Fore.GREEN}{self.stats['created']:,}{Style.RESET_ALL}")
        print(f"  Skipped:     {Fore.YELLOW}{self.stats['skipped']:,}{Style.RESET_ALL}")
        print(f"  Failed:      {Fore.GREEN}{self.stats['failed']:,}{Style.RESET_ALL}")
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
        seeder = MatchesSeeder(http)
        seeder.seed(limit_per_user=3)
