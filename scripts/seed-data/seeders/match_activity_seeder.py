"""
Match Activity Seeder
Creates match activity entries (profile_view, building_match, skill_match)
using Supabase REST API
"""

import random
import time
from typing import List, Dict, Any
from colorama import Fore, Style

from config import config
from seeders.base_seeder import BaseSeeder


class MatchActivitySeeder(BaseSeeder):
    """Seeder for match_activity with incremental seeding"""

    def __init__(self, http_client):
        super().__init__(http_client)
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

    # Activity text templates keyed by type
    ACTIVITY_TEMPLATES: Dict[str, List[str]] = {
        "profile_view": [
            "Viewed your profile",
            "Checked out your projects",
            "Looked at your portfolio",
            "Browsed your experience",
            "Reviewed your skills",
        ],
        "building_match": [
            "Has complementary skills in {area}",
            "Shares your interest in {topic}",
            "Could complement your work in {area}",
            "Your skills align well with their {area} expertise",
            "Great potential collaboration in {area}",
        ],
        "skill_match": [
            "Also skilled in {skill}",
            "Looking for {skill} collaboration",
            "Expert in {skill} like you",
            "Strong {skill} background",
            "Proficient in {skill}",
        ],
    }

    COMPLEMENTARY_AREAS: List[str] = [
        "web development",
        "mobile apps",
        "data science",
        "cloud architecture",
        "DevOps",
        "UI/UX design",
        "backend systems",
        "API design",
        "machine learning",
        "blockchain",
        "cybersecurity",
        "IoT",
    ]

    SHARED_TOPICS: List[str] = [
        "startups",
        "open source",
        "AI/ML",
        "product design",
        "agile development",
        "tech innovation",
        "entrepreneurship",
        "software architecture",
    ]

    SKILLS_POOL: List[str] = [
        "JavaScript",
        "TypeScript",
        "Python",
        "React",
        "Node.js",
        "Go",
        "Rust",
        "PostgreSQL",
        "AWS",
        "Docker",
        "Kubernetes",
        "GraphQL",
        "Machine Learning",
        "Data Science",
    ]

    ACTIVITY_TYPES: List[str] = [
        "profile_view",
        "building_match",
        "skill_match",
    ]

    # =========================================================================
    # CORE LOGIC
    # =========================================================================

    def generate_activity_text(self, act_type: str) -> str:
        """Generate realistic activity text for the given type"""
        templates = self.ACTIVITY_TEMPLATES[act_type]
        template = random.choice(templates)

        if act_type == "profile_view":
            return template  # Static templates, no formatting needed
        elif act_type == "building_match":
            area = random.choice(self.COMPLEMENTARY_AREAS)
            topic = random.choice(self.SHARED_TOPICS)
            # Randomly choose which placeholder to fill
            if "{area}" in template:
                return template.format(area=area)
            return template.format(topic=topic)
        elif act_type == "skill_match":
            skill = random.choice(self.SKILLS_POOL)
            return template.format(skill=skill)

        return template

    # =========================================================================
    # MAIN SEED METHOD
    # =========================================================================

    def seed(self, count: int = None) -> Dict[str, int]:
        """
        Seed match activity entries incrementally.

        Creates 50-200 entries (or specified count) pairing random users
        with realistic activity text. 30% of entries are marked as read.
        """
        # Reset stats
        self.stats = {"created": 0, "skipped": 0, "failed": 0}

        if count is None:
            count = random.randint(50, 200)

        # Fetch user IDs
        print(f"{Fore.YELLOW}⏳ Fetching user IDs from database...{Style.RESET_ALL}")
        user_ids = self.fetch_user_ids()
        print(f"{Fore.GREEN}✓ Found {len(user_ids)} users{Style.RESET_ALL}\n")

        if len(user_ids) < 2:
            print(
                f"{Fore.RED}✗ Need at least 2 users. Seed profiles first.{Style.RESET_ALL}"
            )
            return self.stats

        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}")
        print(
            f"{Fore.CYAN}SEEDING {count} MATCH ACTIVITY ENTRIES{Style.RESET_ALL}"
        )
        print(f"{Fore.CYAN}{'=' * 60}{Style.RESET_ALL}\n")

        created_count = 0
        while created_count < count:
            # Pick two different random users
            actor, target = random.sample(user_ids, 2)

            # Choose activity type and generate text
            act_type = random.choice(self.ACTIVITY_TYPES)
            activity = self.generate_activity_text(act_type)

            # profile_view has no match_percentage; others get 40-100
            match_pct = (
                None
                if act_type == "profile_view"
                else random.randint(40, 100)
            )

            # 30% chance of being marked as read
            is_read = random.random() < 0.3

            activity_data = {
                "actor_user_id": actor,
                "target_user_id": target,
                "type": act_type,
                "activity": activity,
                "match_percentage": match_pct,
                "is_read": is_read,
            }

            print(
                f"\r{Fore.CYAN}[{created_count + 1}/{count}] Creating match activity...{Style.RESET_ALL}",
                end="",
                flush=True,
            )

            result = self.create_single("match_activity", activity_data)
            if result:
                created_count += 1
                self.stats["created"] += 1
                print(
                    f"\r{Fore.CYAN}[{created_count}/{count}] ✓ Created{Style.RESET_ALL}    ",
                    end="",
                    flush=True,
                )
            else:
                self.stats["failed"] += 1

            # Rate limiting
            if created_count % config.BATCH_SIZE == 0:
                time.sleep(config.DELAY_BETWEEN_BATCHES)

        # Print detailed statistics
        print(f"\n{Fore.GREEN}{'=' * 60}{Style.RESET_ALL}")
        print(f"{Fore.GREEN}✓ MATCH ACTIVITY SEEDING COMPLETE{Style.RESET_ALL}")
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
        seeder = MatchActivitySeeder(http)
        seeder.seed()
