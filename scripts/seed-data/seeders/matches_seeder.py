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

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.CYAN}SEEDING MATCH SUGGESTIONS ({limit_per_user} per user){Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch user IDs
        user_ids = self.fetch_user_ids()

        if len(user_ids) < 2:
            print(
                f"{Fore.RED}✗ Need at least 2 users. Seed profiles first.{Style.RESET_ALL}"
            )
            return {"created": 0, "skipped": 0, "failed": 0}

        created = 0

        # Limit to first 50 users to avoid too many suggestions
        for user_id in user_ids[:50]:
            potential_matches = [u for u in user_ids if u != user_id]
            matches = random.sample(
                potential_matches, min(limit_per_user, len(potential_matches))
            )

            for matched_user in matches:
                match_percentage = random.randint(60, 95)
                if self.create_match_suggestion(
                    user_id, matched_user, match_percentage
                ):
                    created += 1

            self.log_progress(created, 50 * limit_per_user, "Match suggestions")

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
