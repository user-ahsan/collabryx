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
    """Seeder for match suggestions"""

    def __init__(self, http_client):
        super().__init__(http_client)

    def create_match_suggestion(
        self,
        user_id: str,
        matched_user_id: str,
        match_percentage: int,
        reasons: List[Dict] = None,
    ) -> bool:
        """Create a match suggestion"""
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
        return result is not None

    def seed(self, limit_per_user: int = None) -> Dict[str, int]:
        """Seed match suggestions for users"""

        if limit_per_user is None:
            limit_per_user = (
                int(config.LIMIT_MATCHES_PER_USER)
                if config.LIMIT_MATCHES_PER_USER != "-1"
                else 5
            )

        # Show current database status
        existing_matches = self.get_table_count("match_suggestions")

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}CURRENT DATABASE STATUS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  🎯 Existing Matches: {Fore.GREEN}{existing_matches:,}{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"\n{Fore.YELLOW}➕ Adding {limit_per_user} matches per user...{Style.RESET_ALL}\n"
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
            return {"created": 0, "skipped": 0, "failed": 0}

        created = 0

        # Limit to first 50 users to avoid too many suggestions
        total_expected = min(50, len(user_ids)) * limit_per_user
        for i, user_id in enumerate(user_ids[:50]):
            potential_matches = [u for u in user_ids if u != user_id]
            matches = random.sample(
                potential_matches, min(limit_per_user, len(potential_matches))
            )

            print(
                f"\r{Fore.CYAN}[{i + 1}/{min(50, len(user_ids))}] Seeding matches for user...{Style.RESET_ALL}",
                end="",
                flush=True,
            )

            for matched_user in matches:
                match_percentage = random.randint(60, 95)
                if self.create_match_suggestion(
                    user_id, matched_user, match_percentage
                ):
                    created += 1

            print(
                f"\r{Fore.CYAN}[{i + 1}/{min(50, len(user_ids))}] ✓ {created} matches created{Style.RESET_ALL}    ",
                end="",
                flush=True,
            )

            if created % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        stats = {"created": created}
        self.log_stats(stats, "Match Suggestions")
        return stats


if __name__ == "__main__":
    import httpx
    from config import config

    config.initialize()

    with httpx.Client() as http:
        seeder = MatchesSeeder(http)
        seeder.seed(limit_per_user=3)
