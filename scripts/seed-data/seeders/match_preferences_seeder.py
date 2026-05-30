"""
Match Preferences Seeder
Creates match_preferences for each profile user using Supabase REST API
UNIQUE(user_id) constraint — uses ignore_duplicates for safety
"""

import random
import time
from typing import Dict, Any, Optional, List, Set
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder

AVAILABILITY_MATCH_CHOICES = ["any", "similar", "complementary"]

INTERESTED_IN_TYPES = [
    "mentor",
    "mentee",
    "co-founder",
    "collaborator",
    "investor",
    "advisor",
    "partner",
    "freelancer",
]

INTERESTED_IN_TYPE_CLUSTERS = {
    2: [
        ["mentor", "mentee"],
        ["co-founder", "collaborator"],
        ["investor", "advisor"],
        ["partner", "freelancer"],
    ],
    3: [
        ["mentor", "mentee", "co-founder"],
        ["collaborator", "partner", "freelancer"],
        ["investor", "advisor", "partner"],
    ],
    4: [
        ["co-founder", "collaborator", "partner", "freelancer"],
        ["mentor", "mentee", "advisor", "investor"],
    ],
}


class MatchPreferencesSeeder(BaseSeeder):
    """Seeder for match_preferences with incremental duplicate handling"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}
        self._existing_preferences_cache: Set[str] = set()

    def _load_cache(self):
        """Fetch existing match_preferences to skip duplicates"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/match_preferences?select=user_id",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            prefs = response.json() or []
            self._existing_preferences_cache = {p["user_id"] for p in prefs}
            print(
                f"{Fore.YELLOW}  → Found {len(self._existing_preferences_cache)} existing match preferences{Style.RESET_ALL}"
            )
        except Exception as e:
            print(
                f"{Fore.RED}✗ Failed to fetch existing match preferences: {e}{Style.RESET_ALL}"
            )
            self._existing_preferences_cache = set()

    def _get_profile_skills(
        self, user_id: str
    ) -> List[str]:
        """Fetch skills for a user to use in interested_in_types"""
        try:
            response = self.http.get(
                f"{config.SUPABASE_REST_URL}/user_skills?select=skill_name&user_id=eq.{user_id}",
                headers=config.API_HEADERS,
            )
            response.raise_for_status()
            skills = response.json() or []
            return [s["skill_name"] for s in skills if s.get("skill_name")]
        except Exception:
            return []

    def create_match_preference(
        self, user_id: str
    ) -> Optional[str]:
        """Create a single match_preference row with random values"""
        try:
            # Random min_match_percentage 0-100
            min_match_percentage = random.randint(0, 100)

            # interested_in_types: randomly pick 2-4 types
            type_count = random.randint(2, 4)
            clusters = INTERESTED_IN_TYPE_CLUSTERS.get(
                type_count,
                [INTERESTED_IN_TYPES],
            )
            interested_in_types = random.choice(clusters)

            # availability_match: random pick
            availability_match = random.choice(AVAILABILITY_MATCH_CHOICES)

            preference = {
                "user_id": user_id,
                "min_match_percentage": min_match_percentage,
                "interested_in_types": interested_in_types,
                "availability_match": availability_match,
            }

            result = self.create_single("match_preferences", preference)
            return result

        except Exception as e:
            print(
                f"{Fore.RED}  ✗ Error creating match preference for {user_id}: {e}{Style.RESET_ALL}"
            )
            return None

    def seed(self, limit: Optional[int] = None) -> Dict[str, int]:
        """Seed match_preferences for each profile user"""

        # Reset statistics
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        if limit is None:
            limit = int(config.LIMIT_PROFILES) if config.LIMIT_PROFILES != "-1" else 100

        print(
            f"\n{Fore.YELLOW}⏳ Loading existing match_preferences for duplicate checking...{Style.RESET_ALL}"
        )
        self._load_cache()

        existing_count = len(self._existing_preferences_cache)

        print(f"\n{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}CURRENT DATABASE STATUS{Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"  🎯 Existing Preferences: {Fore.GREEN}{existing_count:,}{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"\n{Fore.YELLOW}➕ Generating preferences for up to {limit:,} users...{Style.RESET_ALL}\n"
        )

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.CYAN}SEEDING MATCH PREFERENCES (Incremental Mode){Style.RESET_ALL}")
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        # Fetch user IDs
        print(
            f"{Fore.YELLOW}⏳ Fetching user IDs from database...{Style.RESET_ALL}"
        )
        user_ids = self.fetch_user_ids(limit=limit)
        print(f"{Fore.GREEN}✓ Found {len(user_ids)} users{Style.RESET_ALL}\n")

        if not user_ids:
            print(
                f"{Fore.RED}✗ No users found. Seed profiles first.{Style.RESET_ALL}"
            )
            return self.stats

        total = len(user_ids)
        for i, user_id in enumerate(user_ids):
            # Skip if already has a preference (UNIQUE constraint)
            if user_id in self._existing_preferences_cache:
                self.stats["skipped"] += 1
                continue

            print(
                f"\r{Fore.CYAN}[{self.stats['created'] + 1}/{total}] Creating preference...{Style.RESET_ALL}",
                end="",
                flush=True,
            )

            result = self.create_match_preference(user_id)

            if result:
                self._existing_preferences_cache.add(user_id)
                self.stats["created"] += 1
                print(
                    f"\r{Fore.CYAN}[{self.stats['created']}/{total}] ✓ Preference created{Style.RESET_ALL}    ",
                    end="",
                    flush=True,
                )
            else:
                self.stats["failed"] += 1
                print(
                    f"\r{Fore.RED}[{i + 1}/{total}] ✗ Failed{Style.RESET_ALL}    ",
                    end="",
                    flush=True,
                )

            # Rate limiting
            if (i + 1) % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print statistics
        self.log_stats(self.stats, "Match Preferences")

        return self.stats


if __name__ == "__main__":
    import httpx

    config.initialize()

    with httpx.Client() as http:
        seeder = MatchPreferencesSeeder(http)
        seeder.seed(limit=10)
